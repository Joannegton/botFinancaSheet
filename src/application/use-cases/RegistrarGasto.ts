import { Injectable, Inject } from '@nestjs/common';
import { Gasto } from '@domain/entities/Gasto';
import { IGastoRepository } from '@domain/repositories/IGastoRepository';

@Injectable()
export class RegistrarGasto {
  constructor(
    @Inject('IGastoRepository')
    private readonly gastoRepository: IGastoRepository,
  ) {}

  async execute(gasto: Gasto): Promise<void> {
    try {
      await this.gastoRepository.salvar(gasto);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao registrar gasto: ${msg}`);
    }
  }

  async buscarTodos(): Promise<Gasto[]> {
    try {
      return await this.gastoRepository.buscarTodos();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao buscar gastos: ${msg}`);
    }
  }
}
