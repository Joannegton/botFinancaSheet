export interface IFormasPagamentoRepository {
  salvar(forma: string): Promise<void>;
  buscarTodas(): Promise<string[]>;
  existe(forma: string): Promise<boolean>;
}
