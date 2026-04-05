import { DomainError } from './DomainError';

export class OtpInvalidoError extends DomainError {
  constructor() {
    super('OTP inválido ou expirado');
    this.name = 'OtpInvalidoError';
    Object.setPrototypeOf(this, OtpInvalidoError.prototype);
  }
}
