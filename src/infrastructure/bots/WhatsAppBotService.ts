import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { MessageParser } from '@application/parsers/MessageParser';
import { RegistrarGasto } from '@application/use-cases/RegistrarGasto';
import { GerenciarCategorias } from '@application/use-cases/GerenciarCategorias';
import { GerenciarFormasPagamento } from '@application/use-cases/GerenciarFormasPagamento';
import { GerenciarConfig } from '@application/use-cases/GerenciarConfig';
import { SchedulerService } from '@application/services/SchedulerService';
import { FormaPagamento } from '@domain/value-objects/FormaPagamento';
import { TipoGasto } from '@domain/value-objects/TipoGasto';
import { Valor } from '@domain/value-objects/Valor';
import { Gasto } from '@domain/entities/Gasto';

// ─── Tipos do payload de webhook da Twilio WhatsApp API ─────────────────────
interface TwilioWebhookPayload {
  From: string;
  To: string;
  Body: string;
  MediaUrl?: string;
  MessageSid?: string;
  AccountSid?: string;
  [key: string]: unknown;
}

interface SessionData {
  step?:
    | 'aguardando_forma'
    | 'aguardando_valor'
    | 'aguardando_tipo'
    | 'aguardando_observacao'
    | 'aguardando_config_dia';
  formaPagamento: string;
  valor: string;
  tipo: string;
}

@Injectable()
export class WhatsAppBotService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppBotService.name);
  private twilioClient!: Twilio;
  private authorizedPhones: string[] = [];
  private twilioPhoneNumber!: string;
  private readonly sessions: Map<string, SessionData> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly messageParser: MessageParser,
    private readonly registrarGasto: RegistrarGasto,
    private readonly gerenciarCategorias: GerenciarCategorias,
    private readonly gerenciarFormasPagamento: GerenciarFormasPagamento,
    private readonly gerenciarConfig: GerenciarConfig,
    private readonly schedulerService: SchedulerService,
  ) {}

  async onModuleInit() {
    await this.initialize();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Inicialização
  // ─────────────────────────────────────────────────────────────────────────────

  private async initialize(): Promise<void> {
    this.logger.log('🤖 Inicializando Bot do WhatsApp via Twilio WhatsApp API...');

    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const twilioNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER');
    const phone = this.configService.get<string>('WHATSAPP_AUTHORIZED_NUMBER');

    if (!accountSid) throw new Error('TWILIO_ACCOUNT_SID não configurado');
    if (!authToken) throw new Error('TWILIO_AUTH_TOKEN não configurado');
    if (!twilioNumber) throw new Error('TWILIO_WHATSAPP_NUMBER não configurado');
    if (!phone) throw new Error('WHATSAPP_AUTHORIZED_NUMBER não configurado');

    this.authorizedPhones = phone
      .split(',')
      .map((p) => this.sanitizePhone(p.trim()))
      .filter((p) => p.length > 0);

    if (this.authorizedPhones.length === 0) {
      throw new Error('Nenhum número WhatsApp autorizado configurado');
    }

    this.twilioPhoneNumber = twilioNumber;
    this.twilioClient = new Twilio(accountSid, authToken);

    // Inicializar dados padrão
    try {
      await this.gerenciarCategorias.inicializarCategoriasIfNeeded();
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao inicializar categorias: ${this.errorMsg(error)}`);
    }

    try {
      await this.gerenciarFormasPagamento.inicializarFormasIfNeeded();
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao inicializar formas de pagamento: ${this.errorMsg(error)}`);
    }

    // Agendar resumo diário às 21h (para o primeiro número autorizado)
    try {
      const primaryPhone = this.authorizedPhones[0];
      this.schedulerService.agendarResumosDiarios(primaryPhone, (text) =>
        this.sendMessage(primaryPhone, text),
      );
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao configurar scheduler: ${this.errorMsg(error)}`);
    }

    this.logger.log(`✅ WhatsApp Bot pronto! Twilio Number: "${this.twilioPhoneNumber}"`);
    this.logger.log(`📱 Números autorizados: ${this.authorizedPhones.join(', ')}`);
    this.logger.log(`🌐 Aguardando webhooks em POST /webhook/whatsapp`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Recepção de webhook da Twilio WhatsApp API
  // ─────────────────────────────────────────────────────────────────────────────

  async handleWebhook(payload: TwilioWebhookPayload): Promise<void> {
    this.logger.debug(`🔵 Webhook Twilio recebido de: ${payload.From} → ${payload.To}`);

    // Validar que a mensagem tem conteúdo
    if (!payload.Body) {
      this.logger.warn(`⚠️ Webhook sem Body, ignorando. [MessageSid: ${payload?.MessageSid}]`);
      return;
    }

    await this.processIncomingTwilioMessage(payload);
  }

  /** Valida autorização e roteia uma mensagem recebida via Twilio */
  private async processIncomingTwilioMessage(payload: TwilioWebhookPayload): Promise<void> {
    const senderPhone = this.sanitizePhone(payload.From);

    if (!this.authorizedPhones.includes(senderPhone)) {
      this.logger.warn(
        `🚫 Acesso não autorizado de: ${senderPhone} | Autorizados: ${this.authorizedPhones.join(', ')} [MessageSid: ${payload?.MessageSid}]`,
      );

      this.logger.debug(
        `Acesso negado: payload.From="${payload.From}", sanitized="${senderPhone}", autorizados="${this.authorizedPhones.join(', ')}"`,
      );
      return;
    }

    const text = payload.Body?.trim();
    if (!text) return;

    this.logger.debug(`📩 Mensagem autorizada de ${senderPhone}: "${text.substring(0, 60)}"`);
    await this.processMessage(senderPhone, text);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Envio de mensagem via Twilio WhatsApp API
  // ─────────────────────────────────────────────────────────────────────────────

  async sendMessage(phone: string, text: string): Promise<void> {
    try {
      // Formatar número para WhatsApp (adicionar prefixo whatsapp:)
      const fromNumber = `whatsapp:${this.twilioPhoneNumber}`;
      const toNumber = `whatsapp:+${phone}`;

      await this.twilioClient.messages.create({
        from: fromNumber,
        to: toNumber,
        body: text,
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar mensagem para ${phone}: ${this.errorMsg(error)}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Roteamento de mensagens recebidas
  // ─────────────────────────────────────────────────────────────────────────────

  private async processMessage(phone: string, mensagem: string): Promise<void> {
    const session = this.sessions.get(phone);

    // Fluxo interativo ativo
    if (session) {
      if (session.step === 'aguardando_config_dia') {
        const lower = mensagem.toLowerCase();
        const isBlockedCommand =
          lower.startsWith('/') && lower !== '/cancelar' && lower !== 'cancelar';
        if (isBlockedCommand) {
          await this.sendMessage(
            phone,
            `⚙️ *Configuração do mês*\n\n📅 Nenhum dia configurado.\n\n` +
              `Qual dia do mês deve ser o início? _(número entre 1 e 31)_`,
          );
          return;
        }
      }
      await this.handleInteractiveFlow(phone, mensagem, session);
      return;
    }

    await this.routeCommand(phone, mensagem);
  }

  /** Roteamento de comandos quando não há sessão interativa ativa */
  private async routeCommand(phone: string, mensagem: string): Promise<void> {
    const lower = mensagem.toLowerCase().trim();

    if (lower === '/menu' || lower === 'menu') {
      await this.sendMessage(phone, await this.messageParser.getMenuMessage(phone));
      return;
    }
    if (lower === '/ajuda' || lower === 'ajuda') {
      await this.sendMessage(phone, await this.messageParser.getHelpMessage(phone));
      return;
    }
    if (lower === '/criar' || lower === 'criar') {
      await this.startInteractiveFlow(phone);
      return;
    }
    if (lower === '/cancelar' || lower === 'cancelar') {
      await this.sendMessage(phone, '❌ Nenhuma operação em andamento.');
      return;
    }
    if (lower === '/relatorio' || lower === 'relatorio' || lower === 'relatório') {
      await this.enviarRelatorio(phone);
      return;
    }
    if (lower === '/categorias' || lower === 'categorias') {
      await this.listarCategorias(phone);
      return;
    }
    if (lower === '/formas' || lower === 'formas') {
      await this.listarFormas(phone);
      return;
    }
    if (lower === '/config' || lower === 'config') {
      await this.configurarDiaInicio(phone);
      return;
    }

    // Fallback: interpretar como gasto direto
    await this.handleDirectMessage(phone, mensagem);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Fluxo interativo (multi-step)
  // ─────────────────────────────────────────────────────────────────────────────

  private async startInteractiveFlow(phone: string): Promise<void> {
    this.sessions.set(phone, { step: 'aguardando_forma', formaPagamento: '', valor: '', tipo: '' });
    try {
      const formas = await this.gerenciarFormasPagamento.buscarTodas();
      const lista = formas.map((f, i) => `${i + 1}. ${f}`).join('\n');
      await this.sendMessage(
        phone,
        `💳 *Escolha a forma de pagamento:*\n\n${lista}\n\n_Digite o nome ou número_\n\n_Envie *cancelar* para sair_`,
      );
    } catch (error) {
      this.sessions.delete(phone);
      await this.sendMessage(phone, `❌ Erro: ${this.errorMsg(error)}`);
    }
  }

  private async handleInteractiveFlow(
    phone: string,
    mensagem: string,
    session: SessionData,
  ): Promise<void> {
    try {
      const lower = mensagem.toLowerCase().trim();

      // Cancelamento universal
      if (lower === 'cancelar' || lower === '/cancelar' || lower === '❌ cancelar') {
        this.sessions.delete(phone);
        await this.sendMessage(phone, '❌ Operação cancelada.');
        return;
      }

      switch (session.step) {
        case 'aguardando_forma': {
          const forma = await this.extractFormaPagamento(mensagem);
          session.formaPagamento = forma;
          session.step = 'aguardando_valor';
          await this.sendMessage(phone, '💰 *Digite o valor:*\n\nExemplo: `35` ou `50.50`');
          break;
        }

        case 'aguardando_valor': {
          session.valor = mensagem.trim();
          session.step = 'aguardando_tipo';
          const categorias = await this.gerenciarCategorias.buscarTodas();
          const lista = categorias.map((c, i) => `${i + 1}. ${c}`).join('\n');
          await this.sendMessage(
            phone,
            `📝 *Escolha o tipo de gasto:*\n\n${lista}\n\n_Digite o nome ou número_`,
          );
          break;
        }

        case 'aguardando_tipo': {
          const tipo = await this.extractTipo(mensagem);
          session.tipo = tipo;
          session.step = 'aguardando_observacao';
          await this.sendMessage(
            phone,
            '📋 *Digite uma observação (opcional):*\n\nOu envie *pular* para finalizar.',
          );
          break;
        }

        case 'aguardando_observacao': {
          const observacao = lower === 'pular' ? undefined : mensagem;
          const gasto = new Gasto(
            new Date(),
            new FormaPagamento(session.formaPagamento),
            new TipoGasto(session.tipo),
            Valor.fromString(session.valor),
            observacao,
          );
          await this.registrarGasto.execute(gasto);
          this.sessions.delete(phone);
          const obsLine = observacao ? '\n\u{1F4CB} ' + observacao : '';
          await this.sendMessage(
            phone,
            '\u2705 *Gasto registrado com sucesso!*\n\n' +
              '\u{1F4B3} ' +
              session.formaPagamento +
              '\n' +
              '\u{1F4B0} R$ ' +
              gasto.valor.toString() +
              '\n' +
              '\u{1F4DD} ' +
              session.tipo +
              obsLine,
          );
          break;
        }

        case 'aguardando_config_dia': {
          // Se pareceu gasto, processar como gasto e limpar sessão
          if (mensagem.includes(',')) {
            this.sessions.delete(phone);
            await this.handleDirectMessage(phone, mensagem);
            return;
          }

          const dia = Number.parseInt(mensagem.trim(), 10);
          if (Number.isNaN(dia) || dia < 1 || dia > 31) {
            await this.sendMessage(phone, `⚠️ Número inválido. Digite um valor entre *1* e *31*.`);
            return;
          }

          await this.gerenciarConfig.salvarDiaInicio(phone, dia);
          this.sessions.delete(phone);
          this.schedulerService.agendarResumosDiarios(phone, (text) =>
            this.sendMessage(phone, text),
          );

          await this.sendMessage(
            phone,
            `✅ *Configuração salva!*\n\n📅 Seu mês começará no dia *${dia}* de cada mês.`,
          );
          await new Promise((resolve) => setTimeout(resolve, 500));
          const menuMessage = await this.messageParser.getMenuMessage(phone);
          await this.sendMessage(phone, menuMessage);
          break;
        }
      }
    } catch (error) {
      this.logger.error('Erro no fluxo interativo:', error);
      this.sessions.delete(phone);
      await this.sendMessage(phone, `❌ Erro: ${this.errorMsg(error)}\n\nTente novamente.`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Mensagem direta (formato CSV)
  // ─────────────────────────────────────────────────────────────────────────────

  private async handleDirectMessage(phone: string, mensagem: string): Promise<void> {
    try {
      if (!this.messageParser.isGastoMessage(mensagem)) {
        await this.sendMessage(
          phone,
          '❓ Não entendi.\nEnvie *ajuda* para ver como registrar um gasto ou *criar* para o modo interativo.',
        );
        return;
      }

      const gasto = await this.messageParser.parse(mensagem);
      await this.registrarGasto.execute(gasto);
      const obsLineDirect = gasto.observacao ? '\n\u{1F4CB} ' + gasto.observacao : '';
      await this.sendMessage(
        phone,
        '\u2705 *Gasto registrado!*\n\n' +
          '\u{1F4B3} ' +
          gasto.formaPagamento +
          '\n' +
          '\u{1F4B0} R$ ' +
          gasto.valor.toString() +
          '\n' +
          '\u{1F4DD} ' +
          gasto.tipo +
          obsLineDirect,
      );
    } catch (error) {
      this.logger.error(`❌ Erro em handleDirectMessage: ${this.errorMsg(error)}`);
      await this.sendMessage(
        phone,
        `❌ ${this.errorMsg(error)}\n\nEnvie *ajuda* para ver o formato correto.`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Relatório
  // ─────────────────────────────────────────────────────────────────────────────

  private async enviarRelatorio(phone: string): Promise<void> {
    try {
      const diaInicio = await this.gerenciarConfig.obterDiaInicio(phone);
      const todosGastos = await this.registrarGasto.buscarTodos();

      if (todosGastos.length === 0) {
        await this.sendMessage(phone, '📊 Nenhum gasto registrado ainda.');
        return;
      }

      const hoje = new Date();
      let dataInicio: Date;
      let dataFim: Date;
      let periodo: string;

      if (diaInicio === null) {
        dataFim = new Date(hoje);
        dataInicio = new Date(hoje);
        dataInicio.setDate(dataInicio.getDate() - 30);
        periodo = 'últimos 30 dias';
      } else {
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth();
        const diaAtual = hoje.getDate();

        if (diaAtual >= diaInicio) {
          dataInicio = new Date(anoAtual, mesAtual, diaInicio);
          dataFim = new Date(anoAtual, mesAtual + 1, diaInicio);
        } else {
          dataInicio = new Date(anoAtual, mesAtual - 1, diaInicio);
          dataFim = new Date(anoAtual, mesAtual, diaInicio);
        }

        const mesInicioDisplay = String(dataInicio.getMonth() + 1).padStart(2, '0');
        const mesFimDisplay = String(dataFim.getMonth() + 1).padStart(2, '0');
        const diaInicioDisplay = String(diaInicio).padStart(2, '0');
        periodo = `${diaInicioDisplay}/${mesInicioDisplay} até ${diaInicioDisplay}/${mesFimDisplay}`;
      }

      const gastosPeriodo = todosGastos.filter((g) => {
        const d = g.dataHora;
        return d >= dataInicio && d < dataFim;
      });

      if (gastosPeriodo.length === 0) {
        await this.sendMessage(phone, `📊 Nenhum gasto no período (${periodo}).`);
        return;
      }

      const total = gastosPeriodo.reduce((acc, g) => acc + g.valor.toNumber(), 0);
      const ultimosDez = gastosPeriodo.slice(-10).reverse();

      let msg = `📊 *Relatório de Gastos*\n\n`;
      msg += `💰 Total: R$ ${total.toFixed(2)}\n`;
      msg += `📝 Registros: ${gastosPeriodo.length}\n`;
      msg += `📅 Período: ${periodo}\n\n`;
      msg += `*Últimos 10 gastos:*\n\n`;

      ultimosDez.forEach((g, i) => {
        msg += `${i + 1}. R$ ${g.valor.toString()} - ${g.tipo} (${g.formaPagamento})\n`;
        if (g.observacao) msg += `   └ ${g.observacao}\n`;
      });

      await this.sendMessage(phone, msg);
    } catch (error) {
      await this.sendMessage(phone, `❌ Erro ao gerar relatório: ${this.errorMsg(error)}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Categorias
  // ─────────────────────────────────────────────────────────────────────────────

  private async listarCategorias(phone: string): Promise<void> {
    try {
      const categorias = await this.gerenciarCategorias.buscarTodas();
      if (categorias.length === 0) {
        await this.sendMessage(
          phone,
          '📂 Nenhuma categoria cadastrada. Envie *addcategoria [nome]* para adicionar.',
        );
        return;
      }
      const lista = await this.gerenciarCategorias.formatarListaCategorias(categorias);
      await this.sendMessage(
        phone,
        `📂 *Categorias:*\n\n${lista}\n\n` +
          `Use *addcategoria [nome]* para adicionar.\n` +
          `Use *delcategoria [número]* para remover.`,
      );
    } catch (error) {
      await this.sendMessage(phone, `❌ Erro: ${this.errorMsg(error)}`);
    }
  }

  private async adicionarCategoria(phone: string, nome: string): Promise<void> {
    if (!nome) {
      await this.sendMessage(phone, '❌ Use: *addcategoria [nome]*\nExemplo: addcategoria saude');
      return;
    }
    try {
      const nova = await this.gerenciarCategorias.adicionarCategoria(nome);
      await this.sendMessage(phone, `✅ Categoria "${nova}" adicionada com sucesso!`);
    } catch (error) {
      await this.sendMessage(phone, `❌ ${this.errorMsg(error)}`);
    }
  }

  private async deletarCategoria(phone: string, args: string): Promise<void> {
    const indice = Number.parseInt(args, 10);
    if (Number.isNaN(indice)) {
      await this.sendMessage(phone, '❌ Forneça o número da categoria. Veja com *categorias*.');
      return;
    }
    try {
      const removida = await this.gerenciarCategorias.deletarCategoriaPorIndice(indice);
      await this.sendMessage(phone, `✅ Categoria "${removida}" removida com sucesso!`);
    } catch (error) {
      await this.sendMessage(phone, `❌ ${this.errorMsg(error)}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Formas de pagamento
  // ─────────────────────────────────────────────────────────────────────────────

  private async listarFormas(phone: string): Promise<void> {
    try {
      const formas = await this.gerenciarFormasPagamento.buscarTodas();
      if (formas.length === 0) {
        await this.sendMessage(
          phone,
          '💳 Nenhuma forma de pagamento cadastrada. Envie *addforma [nome]* para adicionar.',
        );
        return;
      }
      const lista = await this.gerenciarFormasPagamento.formatarListaFormas(formas);
      await this.sendMessage(
        phone,
        `💳 *Formas de pagamento:*\n\n${lista}\n\n` +
          `Use *addforma [nome]* para adicionar.\n` +
          `Use *delforma [número]* para remover.`,
      );
    } catch (error) {
      await this.sendMessage(phone, `❌ Erro: ${this.errorMsg(error)}`);
    }
  }

  private async adicionarForma(phone: string, nome: string): Promise<void> {
    if (!nome) {
      await this.sendMessage(phone, '❌ Use: *addforma [nome]*\nExemplo: addforma credito');
      return;
    }
    try {
      const nova = await this.gerenciarFormasPagamento.adicionarForma(nome);
      await this.sendMessage(phone, `✅ Forma de pagamento "${nova}" adicionada com sucesso!`);
    } catch (error) {
      await this.sendMessage(phone, `❌ ${this.errorMsg(error)}`);
    }
  }

  private async deletarForma(phone: string, args: string): Promise<void> {
    const indice = Number.parseInt(args, 10);
    if (Number.isNaN(indice)) {
      await this.sendMessage(phone, '❌ Forneça o número da forma. Veja com *formas*.');
      return;
    }
    try {
      const removida = await this.gerenciarFormasPagamento.deletarFormaPorIndice(indice);
      await this.sendMessage(phone, `✅ Forma de pagamento "${removida}" removida com sucesso!`);
    } catch (error) {
      await this.sendMessage(phone, `❌ ${this.errorMsg(error)}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Configuração
  // ─────────────────────────────────────────────────────────────────────────────

  private async configurarDiaInicio(phone: string): Promise<void> {
    try {
      const diaAtual = await this.gerenciarConfig.obterDiaInicio(phone);
      this.sessions.set(phone, {
        step: 'aguardando_config_dia',
        formaPagamento: '',
        valor: '',
        tipo: '',
      });
      const configInfo = diaAtual
        ? '\u{1F4C5} Dia atual: ' + diaAtual
        : '\u{1F4C5} Nenhum dia configurado';
      await this.sendMessage(
        phone,
        '\u2699\uFE0F *Configuração do mês*\n\n' +
          configInfo +
          '\n\n' +
          'Qual dia do mês deve ser considerado o início?\n_(número entre 1 e 31)_',
      );
    } catch (error) {
      await this.sendMessage(phone, `❌ ${this.errorMsg(error)}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  private async extractFormaPagamento(mensagem: string): Promise<string> {
    const lower = mensagem.toLowerCase().trim();
    const formas = await this.gerenciarFormasPagamento.buscarTodas();

    // Suporte a número ordinal (ex: "1")
    const numero = Number.parseInt(lower, 10);
    if (!Number.isNaN(numero) && numero >= 1 && numero <= formas.length) {
      return formas[numero - 1];
    }

    for (const forma of formas) {
      if (lower === forma.toLowerCase() || lower.includes(forma.toLowerCase())) {
        return forma;
      }
    }

    throw new Error('Forma de pagamento não reconhecida. Envie *formas* para ver as disponíveis.');
  }

  private async extractTipo(mensagem: string): Promise<string> {
    const lower = mensagem.toLowerCase().trim();
    const categorias = await this.gerenciarCategorias.buscarTodas();

    // Suporte a número ordinal (ex: "1")
    const numero = Number.parseInt(lower, 10);
    if (!Number.isNaN(numero) && numero >= 1 && numero <= categorias.length) {
      return categorias[numero - 1];
    }

    for (const categoria of categorias) {
      if (lower === categoria.toLowerCase() || lower.includes(categoria.toLowerCase())) {
        return categoria;
      }
    }

    throw new Error('Tipo de gasto não reconhecido. Envie *categorias* para ver os disponíveis.');
  }

  /** Remove sufixos WhatsApp (@s.whatsapp.net) e caracteres não numéricos */
  private sanitizePhone(phone: string): string {
    return phone.replaceAll(/@.*$/g, '').replaceAll(/\D/g, '');
  }

  private errorMsg(error: unknown): string {
    return error instanceof Error ? error.message : 'Erro desconhecido';
  }
}
