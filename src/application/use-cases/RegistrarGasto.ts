import { Injectable, Inject } from '@nestjs/common';
import { Gasto } from '@domain/entities/Gasto';
import { IGastoRepository } from '@domain/repositories/IGastoRepository';

@Injectable()
export class RegistrarGasto {
  constructor(
    @Inject('IGastoRepository')
    private readonly gastoRepository: IGastoRepository,
  ) {}

  async execute(userId: string, gasto: Gasto): Promise<void> {
    try {
      await this.gastoRepository.salvar(userId, gasto);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao registrar gasto: ${msg}`);
    }
  }

  async buscarTodos(userId: string): Promise<Gasto[]> {
    try {
      return await this.gastoRepository.buscarTodos(userId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao buscar gastos: ${msg}`);
    }
  }

  async buscarPorPeriodo(userId: string, dataInicio: Date, dataFim: Date): Promise<Gasto[]> {
    try {
      const todos = await this.gastoRepository.buscarTodos(userId);
      return todos.filter((gasto) => {
        const dataGasto = gasto.dataHora;
        return dataGasto >= dataInicio && dataGasto <= dataFim;
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao buscar gastos por período: ${msg}`);
    }
  }
}
