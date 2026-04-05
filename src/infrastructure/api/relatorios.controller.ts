import { Controller, Get, Request, UseGuards, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '@infrastructure/guards/JwtAuthGuard';
import { IUsuarioRepository } from '@domain/repositories/IUsuarioRepository';
import { IGastoRepository } from '@domain/repositories/IGastoRepository';
import { Logger } from '@nestjs/common';

@Controller('api/relatorios')
@UseGuards(JwtAuthGuard)
export class RelatoriosController {
  private readonly logger = new Logger(RelatoriosController.name);

  constructor(
    @Inject('IGastoRepository')
    private readonly gastoRepository: IGastoRepository,
    @Inject('IUsuarioRepository')
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  @Get('resumo')
  @HttpCode(HttpStatus.OK)
  async resumoMensal(@Request() req, @HttpCode() mes?: string) {
    const phoneNumber = req.user.phoneNumber;
    this.logger.debug(`Gerando resumo mensal para ${phoneNumber}`);

    const usuario = await this.usuarioRepository.obterUsuario(phoneNumber);
    if (!usuario) {
      return {
        mes: new Date().toISOString().slice(0, 7),
        totalGastos: 0,
        porCategoria: [],
      };
    }

    const todosOsGastos = await this.gastoRepository.buscarTodos(usuario.phoneNumber);
    const gastos = todosOsGastos || [];

    // Agrupar por categoria
    const porCategoria = new Map<string, number>();
    let totalGastos = 0;

    gastos.forEach((g) => {
      const valor = g.valor.valor || g.valor;
      totalGastos += valor;
      const ctx = porCategoria.get(g.categoria) || 0;
      porCategoria.set(g.categoria, ctx + valor);
    });

    return {
      mes: new Date().toISOString().slice(0, 7),
      totalGastos,
      porCategoria: Array.from(porCategoria, ([categoria, valor]) => ({
        categoria,
        valor,
      })),
    };
  }

  @Get('tendencia')
  @HttpCode(HttpStatus.OK)
  async tendencia(@Request() req) {
    const phoneNumber = req.user.phoneNumber;
    this.logger.debug(`Gerando tendência para ${phoneNumber}`);

    return {
      mensagem: 'Feature em desenvolvimento',
    };
  }
}
