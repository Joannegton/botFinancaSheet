export interface ICategoriasRepository {
  salvar(categoria: string): Promise<void>;
  salvarTodas(categorias: string[]): Promise<void>;
  buscarTodas(): Promise<string[]>;
  existe(categoria: string): Promise<boolean>;
}
