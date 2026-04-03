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

  async salvar(categoria: string): Promise<void> {
    const existe = await this.categoriaRepository.findOneBy({ nome: categoria });

    if (!existe) {
      const cat = this.categoriaRepository.create({ nome: categoria });
      await this.categoriaRepository.save(cat);
    }
  }

  async salvarTodas(categorias: string[]): Promise<void> {
    for (const categoria of categorias) {
      await this.salvar(categoria);
    }
  }

  async buscarTodas(): Promise<string[]> {
    const categorias = await this.categoriaRepository.find();
    return categorias.map((c) => c.nome);
  }

  async existe(categoria: string): Promise<boolean> {
    const existe = await this.categoriaRepository.findOneBy({ nome: categoria });
    return !!existe;
  }
}
