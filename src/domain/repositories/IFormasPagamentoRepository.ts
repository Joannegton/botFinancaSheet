export interface IFormasPagamentoRepository {
  salvar(userId: string, nome: string): Promise<void>;
  salvarTodas(userId: string, nomes: string[]): Promise<void>;
  buscarTodas(userId: string): Promise<string[]>;
  existe(userId: string, nome: string): Promise<boolean>;
}
