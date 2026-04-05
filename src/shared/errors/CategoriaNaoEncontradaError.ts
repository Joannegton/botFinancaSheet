import { DomainError } from './DomainError';

export class CategoriaNaoEncontradaError extends DomainError {
  constructor() {
    super('Categoria não encontrada');
    this.name = 'CategoriaNaoEncontradaError';
    Object.setPrototypeOf(this, CategoriaNaoEncontradaError.prototype);
  }
}
