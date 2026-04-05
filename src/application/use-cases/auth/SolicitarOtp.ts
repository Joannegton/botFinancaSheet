import { Injectable, Logger } from '@nestjs/common';
import { SolicitarOtpInput } from '@application/dtos/inputs';
import { OtpService } from '@application/services/OtpService';
import { NotificationService } from '@application/services/NotificationService';
import { PhoneNumber } from '@domain/value-objects';

@Injectable()
export class SolicitarOtpUseCase {
  private readonly logger = new Logger(SolicitarOtpUseCase.name);

  constructor(
    private readonly otpService: OtpService,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(input: SolicitarOtpInput): Promise<{ mensagem: string }> {
    try {
      // Validar phoneNumber (value object)
      const phone = PhoneNumber.create(input.phoneNumber);

      // Gerar OTP
      const codigo = await this.otpService.gerar(phone.valor);

      // Enviar via Twilio (async, não bloqueia)
      this.notificationService.enviarOtpViaTwilio(phone.valor, codigo).catch((err) => {
        this.logger.error(`Erro ao enviar OTP para ${phone.valor}: ${err.message}`);
      });

      this.logger.log(`OTP solicitado para ${phone.valor}`);

      return { mensagem: 'OTP enviado para seu WhatsApp' };
    } catch (error) {
      this.logger.error(`Erro ao solicitar OTP: ${error.message}`);
      throw error;
    }
  }
}
