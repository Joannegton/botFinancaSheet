import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { HealthController } from './HealthController';
import { WhatsAppBotService } from '@infrastructure/bots/WhatsAppBotService';
import { WhatsAppWebhookController } from '@infrastructure/bots/WhatsAppWebhookController';
import { GastoRepository } from '@infrastructure/database/repositories/GastoRepository';
import { CategoriasRepository } from '@infrastructure/database/repositories/CategoriasRepository';
import { FormasPagamentoRepository } from '@infrastructure/database/repositories/FormasPagamentoRepository';
import { ConfigRepository } from '@infrastructure/database/repositories/ConfigRepository';
import { UsuarioRepository } from '@infrastructure/database/repositories/UsuarioRepository';
import { OtpRepository } from '@infrastructure/database/repositories/OtpRepository';
import { GastoEntity } from '@infrastructure/database/entities/GastoEntity';
import { CategoriaEntity } from '@infrastructure/database/entities/CategoriaEntity';
import { FormaPagamentoEntity } from '@infrastructure/database/entities/FormaPagamentoEntity';
import { ConfigEntity } from '@infrastructure/database/entities/ConfigEntity';
import { UsuarioEntity } from '@infrastructure/database/entities/UsuarioEntity';
import { OtpEntity } from '@infrastructure/database/entities/OtpEntity';
import { MessageParser } from '@application/parsers/MessageParser';
import { RegistrarGasto } from '@application/use-cases/RegistrarGasto';
import { GerenciarCategorias } from '@application/use-cases/GerenciarCategorias';
import { GerenciarFormasPagamento } from '@application/use-cases/GerenciarFormasPagamento';
import { GerenciarConfig } from '@application/use-cases/GerenciarConfig';
import { RegistrarUsuario } from '@application/use-cases/RegistrarUsuario';
import { SchedulerService } from '@application/services/SchedulerService';
import { DocumentacaoController } from './app/documentacao.controller';
import { OtpService } from '@application/services/OtpService';
import { JwtService } from '@application/services/JwtService';
import { NotificationService } from '@application/services/NotificationService';
import { SolicitarOtpUseCase, ValidarOtpLoginUseCase } from '@application/use-cases/auth';
import { AuthController } from '@infrastructure/api/auth.controller';
import { GastosController } from '@infrastructure/api/gastos.controller';
import { CategoriasController } from '@infrastructure/api/categorias.controller';
import { RelatoriosController } from '@infrastructure/api/relatorios.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number.parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'bot_financa',
      entities: [GastoEntity, CategoriaEntity, FormaPagamentoEntity, ConfigEntity, UsuarioEntity, OtpEntity],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([
      GastoEntity,
      CategoriaEntity,
      FormaPagamentoEntity,
      ConfigEntity,
      UsuarioEntity,
      OtpEntity,
    ]),
  ],
  controllers: [HealthController, DocumentacaoController, WhatsAppWebhookController, AuthController, GastosController, CategoriasController, RelatoriosController],
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
    {
      provide: 'IUsuarioRepository',
      useClass: UsuarioRepository,
    },
    {
      provide: 'IOtpRepository',
      useClass: OtpRepository,
    },
    WhatsAppBotService,
    RegistrarGasto,
    GerenciarCategorias,
    GerenciarFormasPagamento,
    GerenciarConfig,
    RegistrarUsuario,
    SchedulerService,
    MessageParser,
    OtpService,
    JwtService,
    NotificationService,
    SolicitarOtpUseCase,
    ValidarOtpLoginUseCase,
    GastosController,
    CategoriasController,
    RelatoriosController,
  ],
})
