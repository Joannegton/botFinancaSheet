import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { SolicitarOtpUseCase, ValidarOtpLoginUseCase } from '@application/use-cases/auth';
import { SolicitarOtpInput, ValidarOtpInput } from '@application/dtos/inputs';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly solicitarOtpUseCase: SolicitarOtpUseCase,
    private readonly validarOtpLoginUseCase: ValidarOtpLoginUseCase,
  ) {}

  @Post('solicitar-otp')
  @HttpCode(HttpStatus.OK)
  async solicitarOtp(@Body() input: SolicitarOtpInput) {
    return this.solicitarOtpUseCase.execute(input);
  }

  @Post('validar-otp')
  @HttpCode(HttpStatus.OK)
  async validarOtp(@Body() input: ValidarOtpInput) {
    return this.validarOtpLoginUseCase.execute(input);
  }
}
