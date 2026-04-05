import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private twilioClient!: Twilio;
  private twilioPhoneNumber!: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioPhoneNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER');

    if (!accountSid || !authToken || !this.twilioPhoneNumber) {
      this.logger.warn('Twilio não configurado corretamente');
      return;
    }

    this.twilioClient = new Twilio(accountSid, authToken);
  }

  async enviarOtpViaTwilio(phoneNumber: string, codigo: string): Promise<void> {
    try {
      if (!this.twilioClient) {
        this.logger.warn('Twilio não inicializado');
        return;
      }

      const mensagem = `Seu código de acesso é: *${codigo}*\n\nVálido por 10 minutos.\n\nNão compartilhe este código com ninguém.`;

      await this.twilioClient.messages.create({
        to: `whatsapp:${phoneNumber}`,
        from: `whatsapp:${this.twilioPhoneNumber}`,
        body: mensagem,
      });

      this.logger.debug(`OTP enviado com sucesso para ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar OTP para ${phoneNumber}:`, error);
      throw error;
    }
  }

  async enviarMensagem(phoneNumber: string, mensagem: string): Promise<void> {
    try {
      if (!this.twilioClient) {
        this.logger.warn('Twilio não inicializado');
        return;
      }

      await this.twilioClient.messages.create({
        to: `whatsapp:${phoneNumber}`,
        from: `whatsapp:${this.twilioPhoneNumber}`,
        body: mensagem,
      });

      this.logger.debug(`Mensagem enviada com sucesso para ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem para ${phoneNumber}:`, error);
      throw error;
    }
  }
}
