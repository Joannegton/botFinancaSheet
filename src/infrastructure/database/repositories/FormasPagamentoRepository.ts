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

  async salvar(forma: string): Promise<void> {
    const existe = await this.formaPagamentoRepository.findOneBy({ nome: forma });

    if (!existe) {
      const fp = this.formaPagamentoRepository.create({ nome: forma });
      await this.formaPagamentoRepository.save(fp);
    }
  }

  async salvarTodas(formas: string[]): Promise<void> {
    for (const forma of formas) {
      await this.salvar(forma);
    }
  }

  async buscarTodas(): Promise<string[]> {
    const formas = await this.formaPagamentoRepository.find();
    return formas.map((f) => f.nome);
  }

  async existe(forma: string): Promise<boolean> {
    const existe = await this.formaPagamentoRepository.findOneBy({ nome: forma });
    return !!existe;
  }
}
