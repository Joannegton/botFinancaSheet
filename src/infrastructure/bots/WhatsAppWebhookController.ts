import {
  Controller,
  Post,
  Body,
  Logger,
  HttpCode,
  BadRequestException,
  Headers,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { WhatsAppBotService } from '@infrastructure/bots/WhatsAppBotService';

/**
 * Controller para receber webhooks da Twilio WhatsApp API.
 *
 * Configure a URL do webhook no Twilio console como:
 *   https://<seu-host>/webhook/whatsapp
 *
 * Apenas POST é necessário. Twilio valida com assinatura X-Twilio-Signature (HMAC-SHA1).
 */
@Controller('webhook')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private readonly whatsAppBotService: WhatsAppBotService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Recebimento de mensagens WhatsApp via Twilio.
   * Twilio valida a requisição com X-Twilio-Signature.
   */
  @Post('whatsapp')
  @HttpCode(200)
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-twilio-signature') twilioSignature: string,
    @Req() req: Request,
  ): Promise<{ status: string }> {
    this.logger.debug(
      `📨 Webhook recebido. From="${payload?.From}", To="${payload?.To}", Body="${payload?.Body?.substring(0, 50)}"`,
    );

    // Validar assinatura Twilio (optional: pode desabilitar em desenvolvimento)
    if (twilioSignature) {
      const isValid = this.validateTwilioRequest(twilioSignature, req);
      if (!isValid) {
        this.logger.warn(
          `⚠️ Assinatura Twilio inválida - em DEV será permitida. Use NODE_ENV=production para rejeitar.`,
        );
        // Em produção, descomente a linha abaixo:
        // throw new BadRequestException('Assinatura Twilio inválida');
      } else {
        this.logger.debug(`✅ Assinatura Twilio validada com sucesso`);
      }
    } else {
      this.logger.warn(`⚠️ X-Twilio-Signature não fornecido no header`);
    }

    await this.whatsAppBotService.handleWebhook(payload);
    return { status: 'ok' };
  }

  /**
   * Valida a assinatura HMAC-SHA1 do Twilio.
   * A Twilio envia X-Twilio-Signature = HMAC-SHA1(URL + params do POST, AuthToken)
   */
  private validateTwilioRequest(signature: string, req: Request): boolean {
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (!authToken) {
      this.logger.warn('TWILIO_AUTH_TOKEN não configurado');
      return false;
    }

    if (!signature) {
      return false;
    }

    try {
      // Construir URL base (sem query string)
      const urlBase = `${req.protocol}://${req.get('host')}${req.path}`;

      // Converter body para URLSearchParams string (formato que Twilio envia)
      const params = new URLSearchParams(req.body).toString();
      const dataToHash = urlBase + params;

      // HMAC-SHA1 do Twilio
      const crypto = require('crypto');
      const expected = crypto
        .createHmac('sha1', authToken)
        .update(dataToHash, 'utf-8')
        .digest('base64');

      const isValid = expected === signature;

      if (!isValid) {
        this.logger.debug(`⚠️ Assinatura inválida. Expected: ${expected}, Received: ${signature}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error(`❌ Erro ao validar assinatura: ${error}`);
      return false;
    }
  }
}
