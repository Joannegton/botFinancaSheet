import { Controller, Get, HttpCode } from '@nestjs/common';

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

@Controller('health')
export class HealthController {
  private startTime = Date.now();

  @Get()
  @HttpCode(200)
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('ready')
  @HttpCode(200)
  getReady(): { ready: boolean } {
    return { ready: true };
  }
}
