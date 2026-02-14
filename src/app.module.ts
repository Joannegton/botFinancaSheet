import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './HealthController';
import { TelegramBotService } from '@infrastructure/bots/TelegramBotService';
import { GoogleSheetsRepository } from '@infrastructure/sheets/GoogleSheetsRepository';
import { MessageParser } from '@application/parsers/MessageParser';
import { RegistrarGasto } from '@application/use-cases/RegistrarGasto';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  providers: [
    {
      provide: 'IGastoRepository',
      useClass: GoogleSheetsRepository,
    },
    TelegramBotService,
    RegistrarGasto,
    MessageParser,
  ],
  controllers: [HealthController],
})
export class AppModule {}
