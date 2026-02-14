export class FormaPagamento {
  private static readonly FORMAS_VALIDAS = ['cartao', 'pix', 'dinheiro'] as const;

  constructor(private readonly valor: string) {
    this.validar();
  }

  private validar(): void {
    const normalizado = this.normalizar(this.valor);

    if (!FormaPagamento.FORMAS_VALIDAS.includes(normalizado as any)) {
      throw new Error(`Forma de pagamento inválida: ${this.valor}. Use: cartao, pix ou dinheiro`);
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

  static fromMenu(opcao: number): FormaPagamento {
    const mapa = {
      1: 'cartao',
      2: 'pix',
      3: 'dinheiro',
    };

    const forma = mapa[opcao as keyof typeof mapa];
    if (!forma) {
      throw new Error('Opção inválida. Use 1 (Cartão), 2 (Pix) ou 3 (Dinheiro)');
    }

    return new FormaPagamento(forma);
  }
}
