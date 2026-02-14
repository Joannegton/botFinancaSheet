import { Injectable, Logger, Inject } from '@nestjs/common';
import { ICategoriasRepository } from '@domain/repositories/ICategoriasRepository';

@Injectable()
export class GerenciarCategorias {
  private readonly logger = new Logger(GerenciarCategorias.name);
  private readonly CATEGORIAS_PADRAO = ['moradia', 'vestuario', 'outros'];

  constructor(
    @Inject('ICategoriasRepository')
    private readonly categoriasRepository: ICategoriasRepository,
  ) {}

  async buscarTodas(): Promise<string[]> {
    return this.categoriasRepository.buscarTodas();
  }

  async adicionarCategoria(categoria: string): Promise<string> {
    const categoriaFormatada = categoria.toLowerCase().trim();

    if (!categoriaFormatada) {
      throw new Error('Categoria não pode estar vazia');
    }

    if (categoriaFormatada.length > 20) {
      throw new Error('Categoria não pode ter mais de 20 caracteres');
    }

    // Validar caracteres especiais
    if (!/^[a-záéíóúâêôãõç\s]+$/i.test(categoriaFormatada)) {
      throw new Error('Categoria contém caracteres inválidos');
    }

    const categorias = await this.categoriasRepository.buscarTodas();

    if (categorias.includes(categoriaFormatada)) {
      throw new Error('Essa categoria já existe');
    }

    await this.categoriasRepository.salvar(categoriaFormatada);
    this.logger.log(`✅ Categoria adicionada: ${categoriaFormatada}`);

    return categoriaFormatada;
  }

  async inicializarCategoriasIfNeeded(): Promise<void> {
    const categorias = await this.categoriasRepository.buscarTodas();

    if (categorias.length === 0) {
      this.logger.log('Inicializando categorias padrão...');
      for (const cat of this.CATEGORIAS_PADRAO) {
        await this.categoriasRepository.salvar(cat);
      }
      this.logger.log('✅ Categorias padrão inicializadas');
    }
  }

  async formatarListaCategorias(categorias: string[]): Promise<string> {
    return categorias.map((cat, index) => `${index + 1}. ${cat}`).join('\n');
  }
}
