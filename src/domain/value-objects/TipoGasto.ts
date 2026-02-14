export class TipoGasto {
  private static readonly TIPOS_VALIDOS = [
    'comida',
    'transporte',
    'lazer',
    'saude',
    'educacao',
    'moradia',
    'vestuario',
    'outros',
  ] as const;

  constructor(private readonly valor: string) {
    this.validar();
  }

  private validar(): void {
    const normalizado = this.normalizar(this.valor);

    if (!TipoGasto.TIPOS_VALIDOS.includes(normalizado as any)) {
      throw new Error(
        `Tipo de gasto inválido: ${this.valor}. Use: ${TipoGasto.TIPOS_VALIDOS.join(', ')}`,
      );
    }
  }

  private normalizar(valor: string): string {
    return valor
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
  }

  toString(): string {
    return this.normalizar(this.valor);
  }

  static getTiposValidos(): readonly string[] {
    return TipoGasto.TIPOS_VALIDOS;
  }
}
