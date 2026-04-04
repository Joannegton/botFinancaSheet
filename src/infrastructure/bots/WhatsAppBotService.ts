import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { MessageParser } from '@application/parsers/MessageParser';
import { RegistrarGasto } from '@application/use-cases/RegistrarGasto';
import { GerenciarCategorias } from '@application/use-cases/GerenciarCategorias';
import { GerenciarFormasPagamento } from '@application/use-cases/GerenciarFormasPagamento';
import { GerenciarConfig } from '@application/use-cases/GerenciarConfig';
import { RegistrarUsuario } from '@application/use-cases/RegistrarUsuario';
import { SchedulerService } from '@application/services/SchedulerService';
import { IUsuarioRepository } from '@domain/repositories/IUsuarioRepository';
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
    | 'aguardando_config_dia'
    | 'aguardando_nome_registro'
    | 'aguardando_nome_edicao';
  formaPagamento: string;
  valor: string;
  tipo: string;
  nome: string;
  nomeUsuario?: string;
}

@Injectable()
export class WhatsAppBotService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppBotService.name);
  private twilioClient!: Twilio;
  private twilioPhoneNumber!: string;
  private readonly sessions: Map<string, SessionData> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly messageParser: MessageParser,
    private readonly registrarGasto: RegistrarGasto,
    private readonly gerenciarCategorias: GerenciarCategorias,
    private readonly gerenciarFormasPagamento: GerenciarFormasPagamento,
    private readonly gerenciarConfig: GerenciarConfig,
    private readonly registrarUsuario: RegistrarUsuario,
    private readonly schedulerService: SchedulerService,
    @Inject('IUsuarioRepository')
    private readonly usuarioRepository: IUsuarioRepository,
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

    if (!accountSid) throw new Error('TWILIO_ACCOUNT_SID não configurado');
    if (!authToken) throw new Error('TWILIO_AUTH_TOKEN não configurado');
    if (!twilioNumber) throw new Error('TWILIO_WHATSAPP_NUMBER não configurado');

    this.twilioPhoneNumber = twilioNumber;
    this.twilioClient = new Twilio(accountSid, authToken);

    // Inicializar dados padrão (descomentar quando necessário para admin)
    // try {
    //   await this.gerenciarCategorias.inicializarCategoriasIfNeeded('admin');
    // } catch (error) {
    //   this.logger.warn(`⚠️ Erro ao inicializar categorias: ${this.errorMsg(error)}`);
    // }
    //
    // try {
    //   await this.gerenciarFormasPagamento.inicializarFormasIfNeeded('admin');
    // } catch (error) {
    //   this.logger.warn(`⚠️ Erro ao inicializar formas de pagamento: ${this.errorMsg(error)}`);
    // }

    // Agendar resumo diário às 21h (não pode aqui, pois será feito por usuário)
    // Na prática, cada usuário agendará seu próprio resumo

    this.logger.log(`✅ WhatsApp Bot pronto! Twilio Number: "${this.twilioPhoneNumber}"`);
    this.logger.log(`🌐 Bot PUBLICO - qualquer numero de WhatsApp pode usar`);
    this.logger.log(`📱 Cadastro automatico para novos usuarios`);
    this.logger.log(`⏰ Cada usuario recebe seu proprio resumo diario as 21:00`);
    this.logger.log(`📊 Alertas ativos: ${this.schedulerService.obterTotalAlertas()}`);
    this.logger.log(`🌐 Aguardando webhooks em POST /webhook/whatsapp`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Recepcao de webhook da Twilio WhatsApp API
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

  /** Valida usuário e roteia uma mensagem recebida via Twilio */
  private async processIncomingTwilioMessage(payload: TwilioWebhookPayload): Promise<void> {
    const senderPhone = this.sanitizePhone(payload.From);
    const text = payload.Body?.trim();
    if (!text) return;

    // Verificar se o usuário existe
    const usuarioExiste = await this.usuarioRepository.usuarioExiste(senderPhone);

    if (!usuarioExiste) {
      // Novo usuário - iniciar fluxo de registro
      const session = this.sessions.get(senderPhone);
      if (!session || session.step !== 'aguardando_nome_registro') {
        // Primeira vez que entra
        this.sessions.set(senderPhone, {
          step: 'aguardando_nome_registro',
          formaPagamento: '',
          valor: '',
          tipo: '',
          nome: '',
          nomeUsuario: '',
        });
        await this.sendMessage(
          senderPhone,
          '🎉 *Bem-vindo ao Bot Financeiro!*\n\n' +
            'Parece que você é novo por aqui.\n\n' +
            'Para se registrar, como podemos te chamar?',
        );
        return;
      }
      await this.processMessage(senderPhone, text);
      return;
    }

    this.logger.debug(`📩 Mensagem de ${senderPhone}: "${text.substring(0, 60)}"`);
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
      if (session.step === 'aguardando_nome_registro') {
        await this.handleRegistrationFlow(phone, mensagem, session);
        return;
      }
      if (session.step === 'aguardando_nome_edicao') {
        await this.handleNomeEdicao(phone, mensagem, session);
        return;
      }
      if (session.step === 'aguardando_config_dia') {
        const lower = mensagem.toLowerCase();
        const isBlockedCommand =
          lower.startsWith('/') && lower !== '/cancelar' && lower !== 'cancelar';
        if (isBlockedCommand) {
          await this.sendMessage(
            phone,
            `⚙️ *Configuracao do mes*\n\n📅 Nenhum dia configurado.\n\n` +
              `Qual dia do mes deve ser o inicio? _(numero entre 1 e 31)_`,
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
  // Fluxo de registro
  // ─────────────────────────────────────────────────────────────────────────────

  private async handleRegistrationFlow(
    phone: string,
    mensagem: string,
    session: SessionData,
  ): Promise<void> {
    const nome = mensagem.trim();

    // Validar que o nome não é vazio e não é muito longo
    if (!nome || nome.length === 0) {
      await this.sendMessage(phone, '❓ Por favor, envie um nome válido.');
      return;
    }

    if (nome.length > 100) {
      await this.sendMessage(
        phone,
        '❓ O nome é muito longo. Por favor, envie um nome com até 100 caracteres.',
      );
      return;
    }

    try {
      await this.registrarUsuario.execute(phone, nome);

      // Mostrar mensagem de sucesso
      await this.sendMessage(
        phone,
        `✅ *Registro concluído com sucesso!*\n\n` +
          `Bem-vindo ao Bot Financeiro, *${nome}*! 🎉\n\n` +
          `Agora vamos configurar seu mês.`,
      );

      // Transição automática para configuração de dia
      await new Promise((resolve) => setTimeout(resolve, 800));

      this.sessions.set(phone, {
        step: 'aguardando_config_dia',
        formaPagamento: '',
        valor: '',
        tipo: '',
        nome: '',
        nomeUsuario: nome,
      });

      await this.sendMessage(
        phone,
        `⚙️ *Configuracao do mes*\n\n` +
          `📅 Qual dia do mes deve ser o inicio?\n` +
          `_(numero entre 1 e 31)_`,
      );
    } catch (error) {
      await this.sendMessage(
        phone,
        `❌ Erro ao registrar: ${this.errorMsg(error)}\n\nTente novamente enviando seu nome.`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Fluxo interativo (multi-step)
  // ─────────────────────────────────────────────────────────────────────────────

  private async startInteractiveFlow(phone: string): Promise<void> {
    this.sessions.set(phone, {
      step: 'aguardando_forma',
      formaPagamento: '',
      valor: '',
      tipo: '',
      nome: '',
      nomeUsuario: '',
    });
    try {
      const formas = await this.gerenciarFormasPagamento.buscarTodas(phone);
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
          const forma = await this.extractFormaPagamento(phone, mensagem);
          session.formaPagamento = forma;
          session.step = 'aguardando_valor';
          await this.sendMessage(phone, '💰 *Digite o valor:*\n\nExemplo: `35` ou `50.50`');
          break;
        }

        case 'aguardando_valor': {
          session.valor = mensagem.trim();
          session.step = 'aguardando_tipo';
          const categorias = await this.gerenciarCategorias.buscarTodas(phone);
          const lista = categorias.map((c, i) => `${i + 1}. ${c}`).join('\n');
          await this.sendMessage(
            phone,
            `📝 *Escolha o tipo de gasto:*\n\n${lista}\n\n_Digite o nome ou número_`,
          );
          break;
        }

        case 'aguardando_tipo': {
          const tipo = await this.extractTipo(phone, mensagem);
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
          await this.registrarGasto.execute(phone, gasto);
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
          const lower = mensagem.toLowerCase().trim();

          // Se pareceu gasto, processar como gasto e limpar sessão
          if (mensagem.includes(',')) {
            this.sessions.delete(phone);
            await this.handleDirectMessage(phone, mensagem);
            return;
          }

          // Se usuário quer alterar nome
          if (lower === 'nome') {
            this.sessions.set(phone, {
              step: 'aguardando_nome_edicao',
              formaPagamento: '',
              valor: '',
              tipo: '',
              nome: '',
              nomeUsuario: session.nomeUsuario || '',
            });
            await this.sendMessage(phone, `📝 Qual é seu novo nome?`);
            return;
          }

          const dia = Number.parseInt(mensagem.trim(), 10);
          if (Number.isNaN(dia) || dia < 1 || dia > 31) {
            await this.sendMessage(phone, `⚠️ Numero invalido. Digite um valor entre *1* e *31*.`);
            return;
          }

          await this.gerenciarConfig.salvarDiaInicio(phone, dia);
          this.sessions.delete(phone);
          this.schedulerService.agendarResumosDiarios(phone, (text) =>
            this.sendMessage(phone, text),
          );

          await this.sendMessage(
            phone,
            `✅ *Configuracao salva!*\n\n📅 Seu mes comecara no dia *${dia}* de cada mes.`,
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

      const gasto = await this.messageParser.parse(phone, mensagem);
      await this.registrarGasto.execute(phone, gasto);
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
      const todosGastos = await this.registrarGasto.buscarTodos(phone);

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
      const categorias = await this.gerenciarCategorias.buscarTodas(phone);
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
      const nova = await this.gerenciarCategorias.adicionarCategoria(phone, nome);
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
      const removida = await this.gerenciarCategorias.deletarCategoriaPorIndice(phone, indice);
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
      const formas = await this.gerenciarFormasPagamento.buscarTodas(phone);
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
      const nova = await this.gerenciarFormasPagamento.adicionarForma(phone, nome);
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
      const removida = await this.gerenciarFormasPagamento.deletarFormaPorIndice(phone, indice);
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
      const usuario = await this.usuarioRepository.obterUsuario(phone);

      this.sessions.set(phone, {
        step: 'aguardando_config_dia',
        formaPagamento: '',
        valor: '',
        tipo: '',
        nome: '',
        nomeUsuario: usuario?.phoneNumber || '',
      });

      const configInfo = diaAtual ? `📅 Dia atual: ${diaAtual}` : `📅 Nenhum dia configurado`;

      const nomeInfo = usuario?.phoneNumber ? `👤 Nome: ${usuario.phoneNumber}` : '';

      const separator = nomeInfo ? '\n' : '';

      await this.sendMessage(
        phone,
        `⚙️ *Configuracao do mes*\n\n` +
          configInfo +
          separator +
          nomeInfo +
          `\n\n` +
          `Digite o numero (1-31) para alterar o dia\n` +
          `ou *nome* para alterar seu nome\n` +
          `ou *cancelar* para voltar`,
      );
    } catch (error) {
      await this.sendMessage(phone, `❌ ${this.errorMsg(error)}`);
    }
  }

  private async handleNomeEdicao(
    phone: string,
    mensagem: string,
    session: SessionData,
  ): Promise<void> {
    const novoNome = mensagem.trim();

    if (!novoNome || novoNome.length === 0) {
      await this.sendMessage(phone, '❓ Por favor, envie um nome valido.');
      return;
    }

    if (novoNome.length > 100) {
      await this.sendMessage(
        phone,
        '❓ O nome é muito longo. Por favor, envie um nome com até 100 caracteres.',
      );
      return;
    }

    try {
      // Update nome no banco (se implementar função update no repositório)
      // Por enquanto, apenas atualizar a sessão
      this.sessions.set(phone, {
        step: 'aguardando_config_dia',
        formaPagamento: '',
        valor: '',
        tipo: '',
        nome: '',
        nomeUsuario: novoNome,
      });

      await this.sendMessage(
        phone,
        `✅ Nome atualizado para *${novoNome}*!\n\n` +
          `⚙️ *Configuracao do mes*\n\n` +
          `Digite o numero (1-31) para alterar o dia\n` +
          `ou *nome* para alterar novamente\n` +
          `ou *cancelar* para voltar`,
      );
    } catch (error) {
      await this.sendMessage(phone, `❌ Erro ao atualizar nome: ${this.errorMsg(error)}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  private async extractFormaPagamento(phone: string, mensagem: string): Promise<string> {
    const lower = mensagem.toLowerCase().trim();
    const formas = await this.gerenciarFormasPagamento.buscarTodas(phone);

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

  private async extractTipo(phone: string, mensagem: string): Promise<string> {
    const lower = mensagem.toLowerCase().trim();
    const categorias = await this.gerenciarCategorias.buscarTodas(phone);

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
