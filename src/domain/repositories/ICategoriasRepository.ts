export interface ICategoriasRepository {
  salvar(userId: string, categoria: string): Promise<void>;
  salvarTodas(userId: string, categorias: string[]): Promise<void>;
  buscarTodas(userId: string): Promise<string[]>;
  existe(userId: string, categoria: string): Promise<boolean>;
}
