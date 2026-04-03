import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IConfigRepository } from '@domain/repositories/IConfigRepository';
import { ConfigEntity } from '../entities/ConfigEntity';

@Injectable()
export class ConfigRepository implements IConfigRepository {
  constructor(
    @InjectRepository(ConfigEntity)
    private readonly configRepository: Repository<ConfigEntity>,
  ) {}

  async salvarConfig(userId: string, diaInicio: number): Promise<void> {
    const config = this.configRepository.create({ userId, diaInicio });
    await this.configRepository.save(config);
  }

  async obterConfig(userId: string): Promise<number | null> {
    const config = await this.configRepository.findOneBy({ userId });
    return config?.diaInicio ?? null;
  }

  async atualizarConfig(userId: string, diaInicio: number): Promise<void> {
    await this.configRepository.update({ userId }, { diaInicio });
  }
}
