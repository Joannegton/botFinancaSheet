import { Injectable, Logger } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

interface JwtPayload {
  phoneNumber: string;
  userId: string;
}

@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);

  constructor(private readonly jwtService: NestJwtService) {}

  gerarToken(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    this.logger.debug(`Tokens gerados para usuario ${payload.phoneNumber}`);

    return { accessToken, refreshToken };
  }

  validar(token: string): JwtPayload {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      this.logger.error(`Token inválido: ${error.message}`);
      throw new Error('Token inválido ou expirado');
    }
  }

  decodificar(token: string): any {
    return this.jwtService.decode(token);
  }
}
