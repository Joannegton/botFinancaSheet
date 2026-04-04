import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IGastoRepository } from '@domain/repositories/IGastoRepository';
import { Gasto } from '@domain/entities/Gasto';
import { FormaPagamento } from '@domain/value-objects/FormaPagamento';
import { TipoGasto } from '@domain/value-objects/TipoGasto';
import { Valor } from '@domain/value-objects/Valor';
import { GastoEntity } from '../entities/GastoEntity';

@Injectable()
export class GastoRepository implements IGastoRepository {
  constructor(
    @InjectRepository(GastoEntity)
    private readonly gastoRepository: Repository<GastoEntity>,
  ) {}

  async salvar(userId: string, gasto: Gasto): Promise<void> {
    const gastoEntity = this.gastoRepository.create({
      userId,
      dataHora: gasto.dataHora,
      formaPagamento: gasto.formaPagamento.toString(),
      tipo: gasto.tipo.toString(),
      valor: gasto.valor.toNumber(),
      observacao: gasto.observacao ?? undefined,
    });

    await this.gastoRepository.save(gastoEntity);
  }

  async buscarTodos(userId: string): Promise<Gasto[]> {
    const gastos = await this.gastoRepository.find({
      where: { userId },
      order: { dataHora: 'DESC' },
    });

    return gastos.map(
      (g) =>
        new Gasto(
          g.dataHora,
          new FormaPagamento(g.formaPagamento),
          new TipoGasto(g.tipo),
          new Valor(g.valor),
          g.observacao || undefined,
        ),
    );
  }
}
