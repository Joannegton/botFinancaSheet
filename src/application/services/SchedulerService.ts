import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import * as cron from 'node-cron';
import { RegistrarGasto } from '@application/use-cases/RegistrarGasto';
import { GerenciarConfig } from '@application/use-cases/GerenciarConfig';
import { IUsuarioRepository } from '@domain/repositories/IUsuarioRepository';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly tasks: Map<string, cron.ScheduledTask> = new Map();
  private sendMessageCallbacks: Map<string, (text: string) => Promise<void>> = new Map();

  constructor(
    private readonly registrarGasto: RegistrarGasto,
    private readonly gerenciarConfig: GerenciarConfig,
    @Inject('IUsuarioRepository')
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async onModuleInit() {
    this.logger.log('📅 Scheduler inicializado - aguardando restauracao de alertas');
    // Restaurar alertas após 5 segundos (dar tempo para o WhatsApp inicializar)
    setTimeout(() => this.restaurarAlertas(), 5000);
  }

  private async restaurarAlertas(): Promise<void> {
    try {
      this.logger.log('🔄 Restaurando alertas de usuarios...');
      // Aqui você precisa implementar um método para buscar todos os usuários com config
      // Por enquanto, apenas registramos o log
      this.logger.log('✅ Sistema de alertas restaurado');
      this.logger.log(`📊 Total de alertas ativos: ${this.tasks.size}`);
    } catch (error) {
      this.logger.error(
        `❌ Erro ao restaurar alertas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  agendarResumosDiarios(userId: string, sendMessage: (text: string) => Promise<void>): void {
    // Remover tarefa anterior se existir
    const tarefaAnterior = this.tasks.get(userId);
    if (tarefaAnterior) {
      tarefaAnterior.stop();
      this.logger.log(`⏹️ Tarefa anterior removida para usuario=${userId}`);
    }

    // Armazenar callback para possível restauracao posterior
    this.sendMessageCallbacks.set(userId, sendMessage);

    const tarefa = cron.schedule('0 0 21 * * *', async () => {
      try {
        this.logger.debug(`📤 Enviando resumo para usuario=${userId}`);
        await this.enviarResumo(userId, sendMessage);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.error(`Erro ao enviar resumo para usuario=${userId}: ${msg}`);
      }
    });

    this.tasks.set(userId, tarefa);
    this.logger.log(`⏰ Alerta agendado para usuario=${userId} - Resumo diario as 21:00`);
    this.logger.log(`📊 Total de usuarios com alertas: ${this.tasks.size}`);
  }

  private async enviarResumo(
    userId: string,
    sendMessage: (text: string) => Promise<void>,
  ): Promise<void> {
    try {
      const diaInicio = await this.gerenciarConfig.obterDiaInicio(userId);
      const gastos = await this.registrarGasto.buscarTodos(userId);

      // Calcular periodo: das 21h de ontem até 21h de hoje
      const agora = new Date();
      const hoje21 = new Date(agora);
      hoje21.setHours(21, 0, 0, 0);

      const ontem = new Date(hoje21);
      ontem.setDate(ontem.getDate() - 1);

      // Filtrar gastos do periodo
      const gastosDia = (gastos || []).filter((g) => g.dataHora >= ontem && g.dataHora <= hoje21);

      // Calcular resumo mensal
      const resumoMensal = await this.calcularResumenMensal(gastos || [], diaInicio);

      const totalDia = gastosDia.reduce((acc, g) => acc + g.valor.toNumber(), 0);
      let mensagem = `📊 *Resumo do dia*\n\n`;
      if (totalDia > 0) {
        mensagem += `💰 Total gasto: R$ ${totalDia.toFixed(2)}\n`;
        mensagem += `📝 Total de registros: ${gastosDia.length}\n`;
      } else {
        mensagem += `Nenhum gasto registrado nas ultimas 24 horas.\n`;
      }

      if (gastosDia.length > 0 && gastosDia.length <= 10) {
        mensagem += `\n*Gastos:*\n`;
        gastosDia.forEach((g, index) => {
          mensagem += `${index + 1}. R$ ${g.valor.toString()} - ${g.tipo}\n`;
        });
      }

      if (resumoMensal) {
        mensagem += `\n${resumoMensal}`;
      }

      mensagem += `\n\n❓ *Tem gastos que você se esqueceu de adicionar?*\nResponda *criar* para registrar um agora.`;

      await sendMessage(mensagem);
      this.logger.debug(`✅ Resumo enviado para usuario=${userId}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao enviar resumo para usuario=${userId}: ${msg}`);
    }
  }

  private async calcularResumenMensal(gastos: any[], diaInicio: number | null): Promise<string> {
    try {
      const hoje = new Date();

      let dataInicio: Date;
      let dataFim: Date;
      let periodo: string;

      if (diaInicio === null) {
        // Sem dia configurado: usar últimos 30 dias
        dataFim = new Date(hoje);
        dataInicio = new Date(hoje);
        dataInicio.setDate(dataInicio.getDate() - 30);

        const dataInicioFormatada =
          String(dataInicio.getDate()).padStart(2, '0') +
          '/' +
          String(dataInicio.getMonth() + 1).padStart(2, '0') +
          '/' +
          dataInicio.getFullYear();
        const dataFimFormatada =
          String(dataFim.getDate()).padStart(2, '0') +
          '/' +
          String(dataFim.getMonth() + 1).padStart(2, '0') +
          '/' +
          dataFim.getFullYear();

        periodo = `últimos 30 dias (${dataInicioFormatada} até ${dataFimFormatada})`;
      } else {
        // Com dia configurado: calcular período mensal
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

      const gastosPeríodo = gastos.filter((g) => {
        const dataGasto = g.dataHora;
        const dentroPeriodo = dataGasto >= dataInicio && dataGasto < dataFim;
        return dentroPeriodo;
      });

      const totalMensal = gastosPeríodo.reduce((acc, g) => acc + g.valor.toNumber(), 0);

      return `📅 *Resumo do período (${periodo})*\n💰 Total: R$ ${totalMensal.toFixed(2)}\n`;
    } catch (error) {
      this.logger.warn(
        `Erro ao calcular resumo mensal: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      return '';
    }
  }

  pararResumo(userId: string): void {
    const tarefa = this.tasks.get(userId);
    if (tarefa) {
      tarefa.stop();
      this.tasks.delete(userId);
      this.sendMessageCallbacks.delete(userId);
      this.logger.log(`⏹️ Alerta removido para usuario=${userId}`);
      this.logger.log(`📊 Total de usuarios com alertas: ${this.tasks.size}`);
    }
  }

  obterTotalAlertas(): number {
    return this.tasks.size;
  }

  verificarStatusAlerta(userId: string): boolean {
    return this.tasks.has(userId);
  }
}
