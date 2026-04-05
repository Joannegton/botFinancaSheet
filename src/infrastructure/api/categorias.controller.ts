import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard } from '@infrastructure/guards/JwtAuthGuard';
import { IUsuarioRepository } from '@domain/repositories/IUsuarioRepository';
import { GerenciarCategorias } from '@application/use-cases/GerenciarCategorias';
import { Logger } from '@nestjs/common';

@Controller('api/categorias')
@UseGuards(JwtAuthGuard)
export class CategoriasController {
  private readonly logger = new Logger(CategoriasController.name);

  constructor(
    @Inject('ICategoriasRepository')
    private readonly categoriasRepository: any,
    @Inject('IUsuarioRepository')
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly gerenciarCategorias: GerenciarCategorias,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listar(@Request() req) {
    const phoneNumber = req.user.phoneNumber;
    this.logger.debug(`Listando categorias para ${phoneNumber}`);

    const usuario = await this.usuarioRepository.obterUsuario(phoneNumber);
    if (!usuario) {
      return { categorias: [] };
    }

    // Buscar categorias do usuário
    const categorias = await this.categoriasRepository.buscarPorUsuario(usuario.phoneNumber);

    return {
      categorias: categorias.map((c: any) => ({
        id: c.id,
        nome: c.nome,
      })),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criar(@Request() req, @Body() body: { nome: string }) {
    const phoneNumber = req.user.phoneNumber;
    this.logger.debug(`Criando categoria ${body.nome} para ${phoneNumber}`);

    // TODO: Implementar criação de categoria
    return { mensagem: 'Feature em desenvolvimento' };
  }
}
