export interface IConfigRepository {
  salvarConfig(userId: number, diaInicio: number): Promise<void>;
  obterConfig(userId: number): Promise<number | null>;
  atualizarConfig(userId: number, diaInicio: number): Promise<void>;
}
