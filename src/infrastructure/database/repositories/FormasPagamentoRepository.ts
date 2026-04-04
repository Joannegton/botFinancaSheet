import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IFormasPagamentoRepository } from '@domain/repositories/IFormasPagamentoRepository';
import { FormaPagamentoEntity } from '../entities/FormaPagamentoEntity';

@Injectable()
export class FormasPagamentoRepository implements IFormasPagamentoRepository {
  constructor(
    @InjectRepository(FormaPagamentoEntity)
    private readonly formaPagamentoRepository: Repository<FormaPagamentoEntity>,
  ) {}

  async salvar(userId: string, forma: string): Promise<void> {
    const existe = await this.formaPagamentoRepository.findOneBy({ userId, nome: forma });

    if (!existe) {
      const fp = this.formaPagamentoRepository.create({ userId, nome: forma });
      await this.formaPagamentoRepository.save(fp);
    }
  }

  async salvarTodas(userId: string, formas: string[]): Promise<void> {
    for (const forma of formas) {
      await this.salvar(userId, forma);
    }
  }

  async buscarTodas(userId: string): Promise<string[]> {
    const formas = await this.formaPagamentoRepository.find({ where: { userId } });
    return formas.map((f) => f.nome);
  }

  async existe(userId: string, forma: string): Promise<boolean> {
    const existe = await this.formaPagamentoRepository.findOneBy({ userId, nome: forma });
    return !!existe;
  }
}
