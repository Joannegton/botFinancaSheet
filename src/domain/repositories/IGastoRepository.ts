import { Gasto } from '@domain/entities/Gasto';

export interface IGastoRepository {
  salvar(userId: string, gasto: Gasto): Promise<void>;
  buscarTodos(userId: string): Promise<Gasto[]>;
}
