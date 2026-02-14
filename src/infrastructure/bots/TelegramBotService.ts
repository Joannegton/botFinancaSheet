import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { MessageParser } from '@application/parsers/MessageParser';
import { RegistrarGasto } from '@application/use-cases/RegistrarGasto';
import { GerenciarCategorias } from '@application/use-cases/GerenciarCategorias';
import { FormaPagamento } from '@domain/value-objects/FormaPagamento';
import { TipoGasto } from '@domain/value-objects/TipoGasto';
import { Valor } from '@domain/value-objects/Valor';
import { Gasto } from '@domain/entities/Gasto';

interface SessionData {
  step?: 'aguardando_forma' | 'aguardando_valor' | 'aguardando_tipo' | 'aguardando_observacao';
  formaPagamento?: string;
  valor?: string;
  tipo?: string;
}

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot!: Telegraf;
  private authorizedUserId!: number;
  private botUsername: string = '';
  private sessions: Map<number, SessionData> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly messageParser: MessageParser,
    private readonly registrarGasto: RegistrarGasto,
    private readonly gerenciarCategorias: GerenciarCategorias,
  ) {}

  async onModuleInit() {
    await this.initialize();
  }

  private async initialize(): Promise<void> {
    this.logger.log('🤖 Inicializando Bot do Telegram...');

    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const userIdStr = this.configService.get<string>('TELEGRAM_USER_ID');

    if (!token) {
      const msg = '❌ TELEGRAM_BOT_TOKEN não configurado';
      this.logger.error(msg);
      throw new Error(msg);
    }

    if (!userIdStr) {
      this.logger.warn('⚠️  TELEGRAM_USER_ID não configurado. Bot rodará mas sem autenticação!');
    }

    this.authorizedUserId = Number(userIdStr);
    this.logger.log(`📝 Configurando Telegraf...`);
    this.bot = new Telegraf(token);

    this.bot.use((ctx, next) => {
      if (ctx.from?.id !== this.authorizedUserId) {
        this.logger.warn(
          `🚫 Tentativa de acesso não autorizado, veja sua configuração de TELEGRAM_USER_ID.`,
        );
        return;
      }
      return next();
    });

    this.setupCommands();

    this.setupMessageHandlers();

    this.logger.log(`🚀 Iniciando polling do Telegram...`);
    this.bot.launch().catch((error) => {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao manter bot conectado: ${msg}`);
    });

    try {
      const botInfo = await this.bot.telegram.getMe();
      this.botUsername = botInfo.username || '';
      this.logger.log(`✨ Bot do Telegram iniciado com sucesso!`);
      this.logger.log(`🤖 Nome do bot: @${botInfo.username}`);
      this.logger.log(`📡 Aguardando mensagens em modo polling...`);
    } catch (error) {
      this.logger.log('✨ Bot do Telegram iniciado com sucesso!');
      this.logger.log('📡 Aguardando mensagens em modo polling...');
    }

    // Inicializar categorias padrão se necessário
    try {
      await this.gerenciarCategorias.inicializarCategoriasIfNeeded();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.warn(`⚠️ Erro ao inicializar categorias: ${msg}`);
    }

    // Enviar mensagem de boas-vindas ao iniciar
    if (this.authorizedUserId) {
      this.bot.telegram
        .sendMessage(this.authorizedUserId, this.getWelcomeMessage(), {
          parse_mode: 'Markdown',
        })
        .catch((error) => {
          const msg = error instanceof Error ? error.message : 'Erro desconhecido';

          if (msg.includes('403')) {
            this.logger.warn(
              `⚠️  Não foi possível enviar a mensagem de boas-vindas!\n` +
                `📱 Por favor, siga os passos:\n` +
                `   1. Abra o Telegram\n` +
                `   2. Pesquise pelo nome @${this.botUsername} na lupa\n` +
                `   3. Clique em "Desbloquear" (se estiver bloqueado)\n` +
                `   4. Clique em "Iniciar" para começar a conversa\n` +
                `🔄 Após fazer isso, a mensagem de boas-vindas será enviada automaticamente!`,
            );
          } else {
            this.logger.warn(`⚠️ Erro ao enviar mensagem de boas-vindas: ${msg}`);
          }
        });
    }

    process.once('SIGINT', () => {
      this.logger.log('⛔ Parando bot (SIGINT)...');
      this.bot.stop('SIGINT');
    });
    process.once('SIGTERM', () => {
      this.logger.log('⛔ Parando bot (SIGTERM)...');
      this.bot.stop('SIGTERM');
    });
  }

  private setupCommands(): void {
    this.logger.log(
      '📝 Registrando comandos: /menu, /ajuda, /criar, /cancelar, /relatorio, /categorias, /addcategoria',
    );

    this.bot.command('menu', (ctx) => {
      ctx.reply(this.getWelcomeMessage(), { parse_mode: 'Markdown' });
    });

    this.bot.command('ajuda', (ctx) => {
      ctx.reply(this.messageParser.getHelpMessage(), { parse_mode: 'Markdown' });
    });

    this.bot.command('criar', async (ctx) => {
      await this.startInteractiveFlow(ctx);
    });

    this.bot.command('cancelar', (ctx) => {
      this.logger.debug(`Comando /cancelar executado por: ${ctx.from?.id}`);
      const userId = ctx.from?.id;
      if (userId) {
        this.sessions.delete(userId);
      }
      ctx.reply('❌ Operação cancelada.', {
        reply_markup: { remove_keyboard: true },
      });
    });

    this.bot.command('relatorio', async (ctx) => {
      await this.enviarRelatorio(ctx);
    });

    this.bot.command('categorias', async (ctx) => {
      await this.listarCategorias(ctx);
    });

    this.bot.command('addcategoria', async (ctx) => {
      await this.adicionarCategoria(ctx);
    });
  }

  private setupMessageHandlers(): void {
    this.logger.log('📨 Configurando handler de mensagens de texto...');

    this.bot.on(message('text'), async (ctx) => {
      const mensagem = ctx.message.text;
      const userId = ctx.from?.id;
      if (mensagem.startsWith('/')) {
        return;
      }

      if (!userId) {
        this.logger.warn('Não consegui identificar o usuário');
        ctx.reply('❌ Erro: não consegui identificar seu usuário');
        return;
      }

      const session = this.sessions.get(userId);

      if (session) {
        this.logger.debug(`Processando fluxo interativo para ${userId}`);
        await this.handleInteractiveFlow(ctx, mensagem, session, userId);
        return;
      }

      this.logger.debug(`Processando mensagem direta de ${userId}`);
      await this.handleDirectMessage(ctx, mensagem);
    });
  }

  private async startInteractiveFlow(ctx: Context): Promise<void> {
    const userId = ctx.from?.id;

    if (!userId) {
      ctx.reply('❌ Erro: não consegui identificar seu usuário');
      return;
    }

    this.sessions.set(userId, { step: 'aguardando_forma' });

    ctx.reply('💳 *Escolha a forma de pagamento:*', {
      parse_mode: 'Markdown',
      ...Markup.keyboard([['💳 Cartão', '📱 Pix', '💵 Dinheiro'], ['❌ Cancelar']])
        .resize()
        .oneTime(),
    });
  }

  private async handleInteractiveFlow(
    ctx: Context,
    mensagem: string,
    session: SessionData,
    userId: number,
  ): Promise<void> {
    try {
      switch (session.step) {
        case 'aguardando_forma':
          const forma = this.extractFormaPagamento(mensagem);
          session.formaPagamento = forma;
          session.step = 'aguardando_valor';
          // this.sessions.set(userId, session);

          ctx.reply('💰 *Digite o valor:*\n\nExemplo: 35 ou 50.50', {
            parse_mode: 'Markdown',
            ...Markup.keyboard([['❌ Cancelar']])
              .resize()
              .oneTime(),
          });
          break;

        case 'aguardando_valor':
          session.valor = mensagem.trim();
          session.step = 'aguardando_tipo';
          // this.sessions.set(userId, session);

          const categorias = await this.gerenciarCategorias.buscarTodas();
          const linhas = [];
          for (let i = 0; i < categorias.length; i += 2) {
            const botoes = [];
            botoes.push(categorias[i]);
            if (i + 1 < categorias.length) {
              botoes.push(categorias[i + 1]);
            }
            linhas.push(botoes);
          }
          linhas.push(['❌ Cancelar']);

          const listaCategoriasFormatada = categorias.join(', ');
          ctx.reply(`📝 *Escolha o tipo de gasto:*\n\n${listaCategoriasFormatada}`, {
            parse_mode: 'Markdown',
            ...Markup.keyboard(linhas).resize().oneTime(),
          });
          break;

        case 'aguardando_tipo':
          const tipo = await this.extractTipo(mensagem);
          session.tipo = tipo;
          session.step = 'aguardando_observacao';
          // this.sessions.set(userId, session);

          ctx.reply('📋 *Digite uma observação (opcional):*\n\nOu digite "pular" para finalizar.', {
            parse_mode: 'Markdown',
            ...Markup.keyboard([['⏭️ Pular'], ['❌ Cancelar']])
              .resize()
              .oneTime(),
          });
          break;

        case 'aguardando_observacao':
          const observacao = mensagem.toLowerCase().includes('pular') ? undefined : mensagem;

          const gasto = new Gasto(
            new Date(),
            new FormaPagamento(session.formaPagamento!),
            new TipoGasto(session.tipo!),
            Valor.fromString(session.valor!),
            observacao,
          );

          await this.registrarGasto.execute(gasto);

          this.sessions.delete(userId);

          ctx.reply(
            `✅ *Gasto registrado com sucesso!*\n\n` +
              `💳 ${session.formaPagamento}\n` +
              `💰 R$ ${gasto.valor.toString()}\n` +
              `📝 ${session.tipo}\n` +
              `${observacao ? `📋 ${observacao}` : ''}`,
            {
              parse_mode: 'Markdown',
              reply_markup: { remove_keyboard: true },
            },
          );
          break;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro no fluxo interativo:', error);
      this.sessions.delete(userId);
      ctx.reply(`❌ Erro: ${msg}\n\nTente novamente com /criar`, {
        reply_markup: { remove_keyboard: true },
      });
    }
  }

  private async handleDirectMessage(ctx: Context, mensagem: string): Promise<void> {
    try {
      if (!this.messageParser.isGastoMessage(mensagem)) {
        ctx.reply(
          '❓ Não entendi.\n Digite /ajuda para ver como registrar um gasto ou /criar para modo interativo.',
        );
        return;
      }

      const gasto = this.messageParser.parse(mensagem);
      await this.registrarGasto.execute(gasto);

      ctx.reply(
        `✅ *Gasto registrado!*\n\n` +
          `💳 ${gasto.formaPagamento}\n` +
          `💰 R$ ${gasto.valor.toString()}\n` +
          `📝 ${gasto.tipo}\n` +
          `${gasto.observacao ? `📋 ${gasto.observacao}` : ''}`,
        { parse_mode: 'Markdown' },
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro ao processar mensagem:', error);
      ctx.reply(`❌ ${msg}\n\nDigite /ajuda para ver o formato correto.`);
    }
  }

  private async enviarRelatorio(ctx: Context): Promise<void> {
    try {
      const gastos = await this.registrarGasto.buscarTodos();

      if (gastos.length === 0) {
        ctx.reply('📊 Nenhum gasto registrado ainda.');
        return;
      }

      const total = gastos.reduce((acc, g) => acc + g.valor.toNumber(), 0);
      const ultimosDez = gastos.slice(-10).reverse();

      let mensagem = `📊 *Relatório de Gastos*\n\n`;
      mensagem += `💰 Total geral: R$ ${total.toFixed(2)}\n`;
      mensagem += `📝 Total de registros: ${gastos.length}\n\n`;
      mensagem += `*Últimos 10 gastos:*\n\n`;

      ultimosDez.forEach((g, index) => {
        mensagem += `${index + 1}. R$ ${g.valor.toString()} - ${g.tipo} (${g.formaPagamento})\n`;
        if (g.observacao) {
          mensagem += `   └ ${g.observacao}\n`;
        }
      });

      ctx.reply(mensagem, { parse_mode: 'Markdown' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro ao gerar relatório:', error);
      ctx.reply(`❌ Erro ao gerar relatório: ${msg}`);
    }
  }

  private async listarCategorias(ctx: Context): Promise<void> {
    try {
      const categorias = await this.gerenciarCategorias.buscarTodas();

      if (categorias.length === 0) {
        ctx.reply('📂 Nenhuma categoria registrada ainda. Use /addcategoria para adicionar.');
        return;
      }

      const listaFormatada = await this.gerenciarCategorias.formatarListaCategorias(categorias);
      const mensagem = `📂 *Categorias disponíveis:*\n\n${listaFormatada}\n\nUse /addcategoria [nome] para adicionar uma nova.`;
      ctx.reply(mensagem, { parse_mode: 'Markdown' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro ao listar categorias:', error);
      ctx.reply(`❌ Erro ao listar categorias: ${msg}`);
    }
  }

  private async adicionarCategoria(ctx: Context): Promise<void> {
    try {
      const message = ctx.message;
      if (!message || !('text' in message)) {
        ctx.reply('❌ Erro ao processar mensagem');
        return;
      }

      const args = message.text?.replace('/addcategoria', '').trim() || '';

      if (!args) {
        ctx.reply(
          '❌ Use /addcategoria [nome]\n\nExemplo: /addcategoria saude\n\nA categoria não pode ter mais de 20 caracteres.',
        );
        return;
      }

      const novaCategoria = await this.gerenciarCategorias.adicionarCategoria(args);
      ctx.reply(`✅ Categoria "${novaCategoria}" adicionada com sucesso!`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro ao adicionar categoria:', error);
      ctx.reply(`❌ ${msg}`);
    }
  }

  private extractFormaPagamento(mensagem: string): string {
    const lower = mensagem.toLowerCase();
    if (lower.includes('cartao') || lower.includes('cartão')) return 'cartao';
    if (lower.includes('pix')) return 'pix';
    if (lower.includes('dinheiro')) return 'dinheiro';
    throw new Error('Forma de pagamento não reconhecida');
  }

  private async extractTipo(mensagem: string): Promise<string> {
    const lower = mensagem.toLowerCase().trim();
    const categorias = await this.gerenciarCategorias.buscarTodas();

    // Procura correspondência exata ou parcial
    for (const categoria of categorias) {
      if (lower === categoria || lower.includes(categoria)) {
        return categoria;
      }
    }

    throw new Error('Tipo de gasto não reconhecido. Use /categorias para ver as disponíveis.');
  }

  private getWelcomeMessage(): string {
    return (
      `👋 Olá! Bem-vindo ao *Registro de Gastos*!\n\n` +
      `Você pode registrar gastos de duas formas:\n\n` +
      `1️⃣ *Mensagem direta:*\n` +
      `\`cartao, 35, comida, almoço\`\n\n` +
      `2️⃣ *Modo interativo:*\n` +
      `Digite /criar\n\n` +
      `📂 *Gerenciar categorias:*\n` +
      `/categorias - Ver todas as categorias\n` +
      `/addcategoria [nome] - Adicionar nova categoria\n\n` +
      `📝 *Mais comandos:*\n` +
      `/ajuda - Ver guia completo\n` +
      `/relatorio - Ver últimos gastos`
    );
  }
}
