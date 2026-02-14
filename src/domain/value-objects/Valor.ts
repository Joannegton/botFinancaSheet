export class Valor {
  constructor(private readonly valor: number) {
    this.validar();
  }

  private validar(): void {
    if (this.valor <= 0) {
      throw new Error('O valor deve ser maior que zero');
    }

    if (!Number.isFinite(this.valor)) {
      throw new Error('O valor deve ser um número válido');
    }

    // Verifica se tem no máximo 2 casas decimais
    const decimalPart = this.valor.toString().split('.')[1];
    if (decimalPart && decimalPart.length > 2) {
      throw new Error('O valor deve ter no máximo 2 casas decimais');
    }
  }

  toNumber(): number {
    return Math.round(this.valor * 100) / 100; // Garante 2 casas decimais
  }

  static fromString(valorStr: string): Valor {
    const valorLimpo = valorStr.replace(',', '.').trim();
    const numero = parseFloat(valorLimpo);

    if (isNaN(numero)) {
      throw new Error(`Valor inválido: ${valorStr}`);
    }

    return new Valor(numero);
  }

  toString(): string {
    return this.toNumber().toFixed(2);
  }
}
