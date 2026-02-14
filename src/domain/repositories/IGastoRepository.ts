import { Gasto } from '@domain/entities/Gasto';

export interface IGastoRepository {
  salvar(gasto: Gasto): Promise<void>;
  buscarTodos(): Promise<Gasto[]>;
}
