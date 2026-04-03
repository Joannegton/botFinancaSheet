export interface IConfigRepository {
  salvarConfig(userId: string, diaInicio: number): Promise<void>;
  obterConfig(userId: string): Promise<number | null>;
  atualizarConfig(userId: string, diaInicio: number): Promise<void>;
}
