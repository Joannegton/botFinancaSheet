export class GastoOutput {
  constructor(
    readonly id: string,
    readonly valor: number,
    readonly categoria: string,
    readonly formaPagamento: string,
    readonly observacao: string | null,
    readonly data: Date,
    readonly criadoEm: Date,
  ) {}
}
