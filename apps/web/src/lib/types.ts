export interface Gasto {
  id: string;
  valor: number;
  categoria: string;
  formaPagamento: string;
  observacao: string | null;
  data: Date;
  criadoEm: Date;
}

export interface Usuario {
  id: string;
  phoneNumber: string;
  name?: string;
}

export interface Categoria {
  id: string;
  nome: string;
}

export interface FormaPagamento {
  id: string;
  nome: string;
}
