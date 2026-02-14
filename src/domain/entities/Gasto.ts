import { FormaPagamento } from '../value-objects/FormaPagamento';
import { TipoGasto } from '../value-objects/TipoGasto';
import { Valor } from '../value-objects/Valor';

export class Gasto {
  constructor(
    public readonly dataHora: Date,
    public readonly formaPagamento: FormaPagamento,
    public readonly tipo: TipoGasto,
    public readonly valor: Valor,
    public readonly observacao?: string,
  ) {}

  toPlainObject(): {
    dataHora: string;
    formaPagamento: string;
    tipo: string;
    valor: number;
    observacao: string;
  } {
    return {
      dataHora: this.dataHora.toISOString(),
      formaPagamento: this.formaPagamento.toString(),
      tipo: this.tipo.toString(),
      valor: this.valor.toNumber(),
      observacao: this.observacao || '',
    };
  }

  toSheetRow(): (string | number)[] {
    // Formata a data no padrão BR
    const dataFormatada = this.dataHora.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });

    return [
      dataFormatada,
      this.formaPagamento.toString(),
      this.tipo.toString(),
      this.valor.toNumber(),
      this.observacao || '',
    ];
  }
}
