import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { RegistrarGasto } from '@application/use-cases/RegistrarGasto';
import { GerenciarConfig } from '@application/use-cases/GerenciarConfig';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly tasks: Map<string, cron.ScheduledTask> = new Map();

  constructor(
    private readonly registrarGasto: RegistrarGasto,
    private readonly gerenciarConfig: GerenciarConfig,
  ) {}

  onModuleInit() {
    this.logger.log('📅 Scheduler inicializado');
  }

  agendarResumosDiarios(userId: string, sendMessage: (text: string) => Promise<void>): void {
    // Remover tarefa anterior se existir
    const tarefaAnterior = this.tasks.get(userId);
    if (tarefaAnterior) {
      tarefaAnterior.stop();
      this.logger.log(`⏹️ Tarefa anterior de resumo removida para userId=${userId}`);
    }

    const tarefa = cron.schedule('0 0 21 * * *', async () => {
      try {
        await this.enviarResumo(userId, sendMessage);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.error(`Erro ao enviar resumo para userId=${userId}: ${msg}`);
      }
    });

    this.tasks.set(userId, tarefa);
    this.logger.log(`⏰ Resumo diário agendado para às 21:00`);
  }

  private async enviarResumo(userId: string, sendMessage: (text: string) => Promise<void>): Promise<void> {
    try {
      const diaInicio = await this.gerenciarConfig.obterDiaInicio(userId);
      const gastos = await this.registrarGasto.buscarTodos();

      // Calcular período: das 21h de ontem até 21h de hoje
      const agora = new Date();
      const hoje21 = new Date(agora);
      hoje21.setHours(21, 0, 0, 0);

      const ontem = new Date(hoje21);
      ontem.setDate(ontem.getDate() - 1);

      // Filtrar gastos do período
      const gastosDia = (gastos || []).filter((g) => g.dataHora >= ontem && g.dataHora <= hoje21);

      // Calcular resumo mensal
      const resumoMensal = await this.calcularResumenMensal(gastos || [], diaInicio);

      const totalDia = gastosDia.reduce((acc, g) => acc + g.valor.toNumber(), 0);
      let mensagem = `📊 *Resumo do dia*\n\n`;
      if (totalDia > 0) {
        mensagem += `💰 Total gasto: R$ ${totalDia.toFixed(2)}\n`;
        mensagem += `📝 Total de registros: ${gastosDia.length}\n`;
      } else {
        mensagem += `Nenhum gasto registrado nas últimas 24 horas.\n`;
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
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao enviar resumo: ${msg}`);
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
      this.logger.warn(`Erro ao calcular resumo mensal: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return '';
    }
  }

  pararResumo(userId: string): void {
    const tarefa = this.tasks.get(userId);
    if (tarefa) {
      tarefa.stop();
      this.tasks.delete(userId);
      this.logger.log(`⏹️ Resumo diário parado para userId=${userId}`);
    }
  }
}
