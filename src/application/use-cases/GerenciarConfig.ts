import { Injectable, Inject, Logger } from '@nestjs/common';
import { IConfigRepository } from '@domain/repositories/IConfigRepository';

@Injectable()
export class GerenciarConfig {
  private readonly logger = new Logger(GerenciarConfig.name);

  constructor(
    @Inject('IConfigRepository')
    private readonly configRepository: IConfigRepository,
  ) {}

  async salvarDiaInicio(userId: number, diaInicio: number): Promise<void> {
    if (diaInicio < 1 || diaInicio > 31) {
      throw new Error('Dia inválido. Use um número entre 1 e 31');
    }

    await this.configRepository.salvarConfig(userId, diaInicio);
  }

  async obterDiaInicio(userId: number): Promise<number | null> {
    return this.configRepository.obterConfig(userId);
  }

  async atualizarDiaInicio(userId: number, diaInicio: number): Promise<void> {
    if (diaInicio < 1 || diaInicio > 31) {
      throw new Error('Dia inválido. Use um número entre 1 e 31');
    }

    await this.configRepository.atualizarConfig(userId, diaInicio);
  }
}
