import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './HealthController';
import { WhatsAppBotService } from '@infrastructure/bots/WhatsAppBotService';
import { WhatsAppWebhookController } from '@infrastructure/bots/WhatsAppWebhookController';
import { GastoRepository } from '@infrastructure/database/repositories/GastoRepository';
import { CategoriasRepository } from '@infrastructure/database/repositories/CategoriasRepository';
import { FormasPagamentoRepository } from '@infrastructure/database/repositories/FormasPagamentoRepository';
import { ConfigRepository } from '@infrastructure/database/repositories/ConfigRepository';
import { GastoEntity } from '@infrastructure/database/entities/GastoEntity';
import { CategoriaEntity } from '@infrastructure/database/entities/CategoriaEntity';
import { FormaPagamentoEntity } from '@infrastructure/database/entities/FormaPagamentoEntity';
import { ConfigEntity } from '@infrastructure/database/entities/ConfigEntity';
import { MessageParser } from '@application/parsers/MessageParser';
import { RegistrarGasto } from '@application/use-cases/RegistrarGasto';
import { GerenciarCategorias } from '@application/use-cases/GerenciarCategorias';
import { GerenciarFormasPagamento } from '@application/use-cases/GerenciarFormasPagamento';
import { GerenciarConfig } from '@application/use-cases/GerenciarConfig';
import { SchedulerService } from '@application/services/SchedulerService';
import { DocumentacaoController } from './app/documentacao.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number.parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'bot_financa',
      entities: [GastoEntity, CategoriaEntity, FormaPagamentoEntity, ConfigEntity],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([GastoEntity, CategoriaEntity, FormaPagamentoEntity, ConfigEntity]),
  ],
  controllers: [HealthController, DocumentacaoController, WhatsAppWebhookController],
  providers: [
    {
      provide: 'IGastoRepository',
      useClass: GastoRepository,
    },
    {
      provide: 'ICategoriasRepository',
      useClass: CategoriasRepository,
    },
    {
      provide: 'IFormasPagamentoRepository',
      useClass: FormasPagamentoRepository,
    },
    {
      provide: 'IConfigRepository',
      useClass: ConfigRepository,
    },
    WhatsAppBotService,
    RegistrarGasto,
    GerenciarCategorias,
    GerenciarFormasPagamento,
    GerenciarConfig,
    SchedulerService,
    MessageParser,
  ],
})
export class AppModule {}
