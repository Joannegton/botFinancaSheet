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

  async buscarTodas(userId: string): Promise<string[]> {
    return this.categoriasRepository.buscarTodas(userId);
  }

  async adicionarCategoria(userId: string, categoria: string): Promise<string> {
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

    const categorias = await this.categoriasRepository.buscarTodas(userId);

    if (categorias.includes(categoriaFormatada)) {
      throw new Error('Essa categoria já existe');
    }

    await this.categoriasRepository.salvar(userId, categoriaFormatada);
    this.logger.log(`✅ Categoria adicionada: ${categoriaFormatada}`);

    return categoriaFormatada;
  }

  async inicializarCategoriasIfNeeded(userId: string): Promise<void> {
    const categorias = await this.categoriasRepository.buscarTodas(userId);

    if (categorias.length === 0) {
      this.logger.debug('Inicializando categorias padrão para ' + userId);
      for (const cat of this.CATEGORIAS_PADRAO) {
        await this.categoriasRepository.salvar(userId, cat);
      }
    }
  }

  async deletarCategoriaPorIndice(userId: string, indice: number): Promise<string> {
    const categorias = await this.categoriasRepository.buscarTodas(userId);

    if (indice < 1 || indice > categorias.length) {
      throw new Error(`Índice inválido. Use um número entre 1 e ${categorias.length}`);
    }

    const categoriaRemovida = categorias[indice - 1];
    const novasCategorias = categorias.filter((_, i) => i !== indice - 1);

    await this.categoriasRepository.salvarTodas(userId, novasCategorias);
    this.logger.log(`✅ Categoria removida: ${categoriaRemovida}`);

    return categoriaRemovida;
  }

  async formatarListaCategorias(categorias: string[]): Promise<string> {
    return categorias.map((cat, index) => `${index + 1}. ${cat}`).join('\n');
  }
}
