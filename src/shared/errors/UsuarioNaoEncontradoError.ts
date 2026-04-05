import { DomainError } from './DomainError';

export class UsuarioNaoEncontradoError extends DomainError {
  constructor() {
    super('Usuário não encontrado');
    this.name = 'UsuarioNaoEncontradoError';
    Object.setPrototypeOf(this, UsuarioNaoEncontradoError.prototype);
  }
}
