import { ValidationError } from '../shared/errors';

export class PhoneNumber {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): PhoneNumber {
    const normalized = this.normalize(value);

    if (!this.isValid(normalized)) {
      throw new ValidationError('Telefone inválido. Use formato: +5521999999999');
    }

    return new PhoneNumber(normalized);
  }

  private static normalize(value: string): string {
    // Remove espaços, parênteses, hífens
    return value.replace(/[\s\-\(\)]/g, '');
  }

  private static isValid(phone: string): boolean {
    // E.164 format: +55 + DDD + número (10-11 dígitos)
    const e164Regex = /^\+55\d{10,11}$/;
    return e164Regex.test(phone);
  }

  get valor(): string {
    return this.value;
  }

  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
