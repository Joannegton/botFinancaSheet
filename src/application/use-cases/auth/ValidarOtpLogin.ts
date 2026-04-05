import { Injectable, Logger, Inject } from '@nestjs/common';
import { ValidarOtpInput } from '@application/dtos/inputs';
import { AuthOutput } from '@application/dtos/outputs';
import { OtpService } from '@application/services/OtpService';
import { JwtService } from '@application/services/JwtService';
import { IUsuarioRepository } from '@domain/repositories/IUsuarioRepository';
import { PhoneNumber } from '@domain/value-objects';
import { OtpInvalidoError, UsuarioNaoEncontradoError } from '@shared/errors';

@Injectable()
export class ValidarOtpLoginUseCase {
  private readonly logger = new Logger(ValidarOtpLoginUseCase.name);

  constructor(
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    @Inject('IUsuarioRepository')
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async execute(input: ValidarOtpInput): Promise<AuthOutput> {
    try {
      // Validar phoneNumber
      const phone = PhoneNumber.create(input.phoneNumber);

      // Validar OTP
      const otpValido = await this.otpService.validar(phone.valor, input.codigo);
      if (!otpValido) {
        throw new OtpInvalidoError();
      }

      // Obter ou criar usuário
      let usuario = await this.usuarioRepository.obterUsuario(phone.valor);

      if (!usuario) {
        // Criar novo usuário
        await this.usuarioRepository.criarUsuario(phone.valor);
        usuario = await this.usuarioRepository.obterUsuario(phone.valor);

        if (!usuario) {
          throw new UsuarioNaoEncontradoError();
        }

        this.logger.log(`Novo usuário criado: ${phone.valor}`);
      } else {
        this.logger.log(`Usuário existente fez login: ${phone.valor}`);
      }

      // Gerar tokens (usar phoneNumber como userId por enquanto)
      const { accessToken, refreshToken } = this.jwtService.gerarToken({
        phoneNumber: usuario.phoneNumber,
        userId: usuario.phoneNumber, // Usando phoneNumber como userId
      });

      return new AuthOutput(accessToken, refreshToken, {
        id: usuario.phoneNumber,
        phoneNumber: usuario.phoneNumber,
        name: null,
      });
    } catch (error) {
      this.logger.error(`Erro ao validar OTP: ${error.message}`);
      throw error;
    }
  }
}
