import { Injectable, Inject, Logger } from '@nestjs/common';
import { IUsuarioRepository } from '@domain/repositories/IUsuarioRepository';
import { ICategoriasRepository } from '@domain/repositories/ICategoriasRepository';
import { IFormasPagamentoRepository } from '@domain/repositories/IFormasPagamentoRepository';

@Injectable()
export class RegistrarUsuario {
  private readonly logger = new Logger(RegistrarUsuario.name);

  constructor(
    @Inject('IUsuarioRepository')
    private readonly usuarioRepository: IUsuarioRepository,
    @Inject('ICategoriasRepository')
    private readonly categoriasRepository: ICategoriasRepository,
    @Inject('IFormasPagamentoRepository')
    private readonly formasPagamentoRepository: IFormasPagamentoRepository,
  ) {}

  async execute(phoneNumber: string, name?: string): Promise<void> {
    // Verificar se usuário já existe
    const existe = await this.usuarioRepository.usuarioExiste(phoneNumber);
    if (existe) {
      this.logger.debug(`👤 Usuário ${phoneNumber} já está registrado`);
      return;
    }

    // Criar novo usuário
    await this.usuarioRepository.criarUsuario(phoneNumber, name);
    this.logger.log(`✅ 👤 Novo usuário registrado: ${phoneNumber}`);

    // Inicializar categorias padrão para o novo usuário
    const categoriasDefault = [
      'alimentação',
      'saúde',
      'moradia',
      'transporte',
      'vestuário',
      'outros',
    ];
    for (const categoria of categoriasDefault) {
      try {
        await this.categoriasRepository.salvar(phoneNumber, categoria);
      } catch (error) {
        // Ignorar erros de duplicação
        this.logger.debug(`⚠️ Categoria "${categoria}" pode já estar criada`);
      }
    }

    // Inicializar formas de pagamento padrão para o novo usuário
    const formasDefault = ['cartão nubank', 'pix', 'dinheiro'];
    for (const forma of formasDefault) {
      try {
        await this.formasPagamentoRepository.salvar(phoneNumber, forma);
      } catch (error) {
        // Ignorar erros de duplicação
        this.logger.debug(`⚠️ Forma "${forma}" pode já estar criada`);
      }
    }

    this.logger.log(`📋 Categorias e formas de pagamento inicializadas para ${phoneNumber}`);
  }
}
