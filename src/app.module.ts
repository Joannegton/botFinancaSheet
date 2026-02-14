import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './HealthController';
import { TelegramBotService } from '@infrastructure/bots/TelegramBotService';
import { GoogleSheetsRepository } from '@infrastructure/sheets/GoogleSheetsRepository';
import { CategoriasGoogleSheetsRepository } from '@infrastructure/sheets/CategoriasGoogleSheetsRepository';
import { FormasPagamentoGoogleSheetsRepository } from '@infrastructure/sheets/FormasPagamentoGoogleSheetsRepository';
import { MessageParser } from '@application/parsers/MessageParser';
import { RegistrarGasto } from '@application/use-cases/RegistrarGasto';
import { GerenciarCategorias } from '@application/use-cases/GerenciarCategorias';
import { GerenciarFormasPagamento } from '@application/use-cases/GerenciarFormasPagamento';

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
    {
      provide: 'ICategoriasRepository',
      useClass: CategoriasGoogleSheetsRepository,
    },
    {
      provide: 'IFormasPagamentoRepository',
      useClass: FormasPagamentoGoogleSheetsRepository,
    },
    TelegramBotService,
    RegistrarGasto,
    GerenciarCategorias,
    GerenciarFormasPagamento,
    MessageParser,
  ],
  controllers: [HealthController],
})
export class AppModule {}
