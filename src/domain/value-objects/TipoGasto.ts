export class TipoGasto {
  constructor(private readonly valor: string) {}

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
}
