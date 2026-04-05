import { Injectable, Logger } from '@nestjs/common';
import { IOtpRepository } from '@domain/repositories/IOtpRepository';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly otpRepository: IOtpRepository) {}

  async gerar(phoneNumber: string): Promise<string> {
    const codigo = this.gerarCodigoAleatorio(6);
    const expiradoEm = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    this.logger.debug(`Gerando OTP para ${phoneNumber}`);
    await this.otpRepository.salvar(phoneNumber, codigo, expiradoEm);

    return codigo;
  }

  async validar(phoneNumber: string, codigo: string): Promise<boolean> {
    const otp = await this.otpRepository.obter(phoneNumber);

    if (!otp) {
      this.logger.warn(`OTP não encontrado para ${phoneNumber}`);
      return false;
    }

    if (otp.codigo !== codigo) {
      this.logger.warn(`Código OTP inválido para ${phoneNumber}`);
      return false;
    }

    if (new Date() > otp.expiradoEm) {
      this.logger.warn(`OTP expirado para ${phoneNumber}`);
      return false;
    }

    // Marcar como utilizado
    await this.otpRepository.marcarUtilizado(otp.id);
    this.logger.debug(`OTP validado com sucesso para ${phoneNumber}`);

    return true;
  }

  private gerarCodigoAleatorio(tamanho: number): string {
    return Math.floor(Math.random() * Math.pow(10, tamanho))
      .toString()
      .padStart(tamanho, '0');
  }
}
