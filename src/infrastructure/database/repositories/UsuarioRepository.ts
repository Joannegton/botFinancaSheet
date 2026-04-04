import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUsuarioRepository } from '@domain/repositories/IUsuarioRepository';
import { UsuarioEntity, UsuarioStatus } from '../entities/UsuarioEntity';

@Injectable()
export class UsuarioRepository implements IUsuarioRepository {
  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly usuarioRepository: Repository<UsuarioEntity>,
  ) {}

  async criarUsuario(phoneNumber: string, name?: string): Promise<void> {
    const usuario = this.usuarioRepository.create({
      phoneNumber,
      name: name || null,
      status: UsuarioStatus.ACTIVE,
      ultimaMensagemEm: new Date(),
    });
    await this.usuarioRepository.save(usuario);
  }

  async obterUsuario(
    phoneNumber: string,
  ): Promise<{ phoneNumber: string; status: UsuarioStatus } | null> {
    const usuario = await this.usuarioRepository.findOneBy({ phoneNumber });
    if (!usuario) return null;
    return {
      phoneNumber: usuario.phoneNumber,
      status: usuario.status,
    };
  }

  async usuarioExiste(phoneNumber: string): Promise<boolean> {
    const count = await this.usuarioRepository.countBy({ phoneNumber });
    return count > 0;
  }

  async atualizarStatusUsuario(phoneNumber: string, status: UsuarioStatus): Promise<void> {
    await this.usuarioRepository.update({ phoneNumber }, { status });
  }

  async atualizarUltimaMensagem(phoneNumber: string): Promise<void> {
    await this.usuarioRepository.update({ phoneNumber }, { ultimaMensagemEm: new Date() });
  }
}
