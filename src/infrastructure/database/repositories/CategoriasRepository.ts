import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICategoriasRepository } from '@domain/repositories/ICategoriasRepository';
import { CategoriaEntity } from '../entities/CategoriaEntity';

@Injectable()
export class CategoriasRepository implements ICategoriasRepository {
  constructor(
    @InjectRepository(CategoriaEntity)
    private readonly categoriaRepository: Repository<CategoriaEntity>,
  ) {}

  async salvar(userId: string, categoria: string): Promise<void> {
    const existe = await this.categoriaRepository.findOneBy({ userId, nome: categoria });

    if (!existe) {
      const cat = this.categoriaRepository.create({ userId, nome: categoria });
      await this.categoriaRepository.save(cat);
    }
  }

  async salvarTodas(userId: string, categorias: string[]): Promise<void> {
    for (const categoria of categorias) {
      await this.salvar(userId, categoria);
    }
  }

  async buscarTodas(userId: string): Promise<string[]> {
    const categorias = await this.categoriaRepository.find({ where: { userId } });
    return categorias.map((c) => c.nome);
  }

  async existe(userId: string, categoria: string): Promise<boolean> {
    const existe = await this.categoriaRepository.findOneBy({ userId, nome: categoria });
    return !!existe;
  }
}
