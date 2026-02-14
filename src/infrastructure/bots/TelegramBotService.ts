import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { MessageParser } from '@application/parsers/MessageParser';
import { RegistrarGasto } from '@application/use-cases/RegistrarGasto';
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
  private sessions: Map<number, SessionData> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly messageParser: MessageParser,
    private readonly registrarGasto: RegistrarGasto,
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

    this.logger.log('✨ Bot do Telegram iniciado com sucesso!');
    this.logger.log('📡 Aguardando mensagens em modo polling...');

    // Enviar mensagem de boas-vindas ao iniciar
    if (this.authorizedUserId) {
      this.bot.telegram
        .sendMessage(this.authorizedUserId, this.getWelcomeMessage(), {
          parse_mode: 'Markdown',
        })
        .catch((error) => {
          const msg = error instanceof Error ? error.message : 'Erro desconhecido';
          this.logger.warn(`⚠️ Não foi possível enviar mensagem de boas-vindas: ${msg}`);
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
    this.logger.log('📝 Registrando comandos: /start, /ajuda, /menu, /cancelar, /relatorio');

    this.bot.command('start', (ctx) => {
      ctx.reply(this.getWelcomeMessage(), { parse_mode: 'Markdown' });
    });

    this.bot.command('ajuda', (ctx) => {
      ctx.reply(this.messageParser.getHelpMessage(), { parse_mode: 'Markdown' });
    });

    this.bot.command('menu', (ctx) => {
      this.startInteractiveFlow(ctx);
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

  private startInteractiveFlow(ctx: Context): void {
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

          const tipos = TipoGasto.getTiposValidos().join(' | ');
          ctx.reply(`📝 *Escolha o tipo de gasto:*\n\n${tipos}`, {
            parse_mode: 'Markdown',
            ...Markup.keyboard([
              ['🍔 Comida', '🚗 Transporte'],
              ['🎮 Lazer', '🏥 Saúde'],
              ['📚 Educação', '🏠 Moradia'],
              ['👕 Vestuário', '📦 Outros'],
              ['❌ Cancelar'],
            ])
              .resize()
              .oneTime(),
          });
          break;

        case 'aguardando_tipo':
          const tipo = this.extractTipo(mensagem);
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
          const observacao = mensagem.toLowerCase() === 'pular' ? undefined : mensagem;

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
      ctx.reply(`❌ Erro: ${msg}\n\nTente novamente com /menu`, {
        reply_markup: { remove_keyboard: true },
      });
    }
  }

  private async handleDirectMessage(ctx: Context, mensagem: string): Promise<void> {
    try {
      if (!this.messageParser.isGastoMessage(mensagem)) {
        ctx.reply(
          '❓ Não entendi.\n Digite /ajuda para ver como registrar um gasto ou /menu para modo interativo.',
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

  private extractFormaPagamento(mensagem: string): string {
    const lower = mensagem.toLowerCase();
    if (lower.includes('cartao') || lower.includes('cartão')) return 'cartao';
    if (lower.includes('pix')) return 'pix';
    if (lower.includes('dinheiro')) return 'dinheiro';
    throw new Error('Forma de pagamento não reconhecida');
  }

  private extractTipo(mensagem: string): string {
    const lower = mensagem.toLowerCase();
    const mapa: Record<string, string> = {
      comida: 'comida',
      transporte: 'transporte',
      lazer: 'lazer',
      saude: 'saude',
      saúde: 'saude',
      educacao: 'educacao',
      educação: 'educacao',
      moradia: 'moradia',
      vestuario: 'vestuario',
      vestuário: 'vestuario',
      outros: 'outros',
    };

    for (const [key, value] of Object.entries(mapa)) {
      if (lower.includes(key)) return value;
    }

    throw new Error('Tipo de gasto não reconhecido');
  }

  private getWelcomeMessage(): string {
    return (
      `👋 Olá! Bem-vindo ao *Registro de Gastos*!\n\n` +
      `Você pode registrar gastos de duas formas:\n\n` +
      `1️⃣ *Mensagem direta:*\n` +
      `\`cartao - 35 - comida - almoço\`\n\n` +
      `2️⃣ *Menu interativo:*\n` +
      `Digite /menu\n\n` +
      `Digite /ajuda para ver todos os comandos.`
    );
  }
}
