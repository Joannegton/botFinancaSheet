export class ListarGastosInput {
  phoneNumber: string;
  dataInicio?: Date;
  dataFim?: Date;
  categoria?: string;
  pagina?: number;
  limite?: number;
}
