import { OtpEntity } from '@infrastructure/database/entities/OtpEntity';

export interface IOtpRepository {
  salvar(phoneNumber: string, codigo: string, expiradoEm: Date): Promise<void>;
  obter(phoneNumber: string): Promise<OtpEntity | null>;
  marcarUtilizado(otpId: string): Promise<void>;
  limparExpirados(): Promise<void>;
}
