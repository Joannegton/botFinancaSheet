import { UsuarioStatus } from '@infrastructure/database/entities/UsuarioEntity';

export interface IUsuarioRepository {
  criarUsuario(phoneNumber: string, name?: string): Promise<void>;
  obterUsuario(phoneNumber: string): Promise<{ phoneNumber: string; status: UsuarioStatus } | null>;
  usuarioExiste(phoneNumber: string): Promise<boolean>;
  atualizarStatusUsuario(phoneNumber: string, status: UsuarioStatus): Promise<void>;
  atualizarUltimaMensagem(phoneNumber: string): Promise<void>;
}
