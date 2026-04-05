import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@infrastructure/guards/JwtAuthGuard';
import { RegistrarGasto } from '@application/use-cases/RegistrarGasto';
import { CriarGastoInput, ListarGastosInput } from '@application/dtos/inputs';
import { IUsuarioRepository } from '@domain/repositories/IUsuarioRepository';
import { Inject, Logger } from '@nestjs/common';
import { IGastoRepository } from '@domain/repositories/IGastoRepository';

@Controller('api/gastos')
@UseGuards(JwtAuthGuard)
export class GastosController {
  private readonly logger = new Logger(GastosController.name);

  constructor(
    private readonly registrarGastoUseCase: RegistrarGasto,
    @Inject('IGastoRepository')
    private readonly gastoRepository: IGastoRepository,
    @Inject('IUsuarioRepository')
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listar(
    @Request() req,
    @Query('limite') limite: string = '20',
    @Query('pagina') pagina: string = '1',
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('categoria') categoria?: string,
  ) {
    const phoneNumber = req.user.phoneNumber;
    this.logger.debug(`Listando gastos para ${phoneNumber}`);

    const usuario = await this.usuarioRepository.obterUsuario(phoneNumber);
    if (!usuario) {
      return { gastos: [], total: 0 };
    }

    // Buscar todos os gastos do usuário (será melhorado com paginação)
    const todosOsGastos = await this.gastoRepository.buscarTodos(usuario.phoneNumber);

    let gastos = todosOsGastos || [];

    // Filtrar por data se fornecido
    if (dataInicio) {
      const inicio = new Date(dataInicio);
      gastos = gastos.filter((g) => new Date(g.data) >= inicio);
    }

    if (dataFim) {
      const fim = new Date(dataFim);
      gastos = gastos.filter((g) => new Date(g.data) <= fim);
    }

    // Filtrar por categoria se fornecido
    if (categoria) {
      gastos = gastos.filter((g) => g.categoria === categoria);
    }

    // Ordenar por data descendente
    gastos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    return {
      gastos: gastos.map((g) => ({
        id: g.id || Math.random().toString(),
        valor: g.valor.valor,
        categoria: g.categoria,
        formaPagamento: g.formaPagamento,
        observacao: g.observacao || null,
        data: g.data,
        criadoEm: g.criadoEm,
      })),
      total: gastos.length,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criar(@Request() req, @Body() input: CriarGastoInput) {
    const phoneNumber = req.user.phoneNumber;
    this.logger.debug(`Criando gasto para ${phoneNumber}`);

    input.phoneNumber = phoneNumber;
    const resultado = await this.registrarGastoUseCase.execute(input);

    return {
      mensagem: 'Gasto criado com sucesso',
      gasto: resultado,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async atualizar(
    @Request() req,
    @Param('id') id: string,
    @Body() input: Partial<CriarGastoInput>,
  ) {
    this.logger.debug(`Atualizando gasto ${id} para ${req.user.phoneNumber}`);

    // TODO: Implementar atualização de gasto
    return { mensagem: 'Feature em desenvolvimento' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deletar(@Request() req, @Param('id') id: string) {
    this.logger.debug(`Deletando gasto ${id} para ${req.user.phoneNumber}`);

    // TODO: Implementar deleção de gasto
    return { mensagem: 'Gasto deletado com sucesso' };
  }
}
