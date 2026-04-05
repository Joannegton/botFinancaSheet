export class ListarGastosOutput {
  constructor(
    readonly gastos: Array<{
      id: string;
      valor: number;
      categoria: string;
      formaPagamento: string;
      observacao: string | null;
      data: Date;
      criadoEm: Date;
    }>,
    readonly total: number,
  ) {}
}
