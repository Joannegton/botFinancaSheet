import { Injectable, Logger, Inject } from '@nestjs/common';
import { IFormasPagamentoRepository } from '@domain/repositories/IFormasPagamentoRepository';

@Injectable()
export class GerenciarFormasPagamento {
  private readonly logger = new Logger(GerenciarFormasPagamento.name);
  private readonly FORMAS_PADRAO = ['cartão nubank', 'pix', 'dinheiro'];

  constructor(
    @Inject('IFormasPagamentoRepository')
    private readonly formasPagamentoRepository: IFormasPagamentoRepository,
  ) {}

  async buscarTodas(): Promise<string[]> {
    return this.formasPagamentoRepository.buscarTodas();
  }

  async adicionarForma(forma: string): Promise<string> {
    const formaFormatada = forma.toLowerCase().trim();

    if (!formaFormatada) {
      throw new Error('Forma de pagamento não pode estar vazia');
    }

    if (formaFormatada.length > 20) {
      throw new Error('Forma de pagamento não pode ter mais de 20 caracteres');
    }

    // Validar caracteres especiais
    if (!/^[a-záéíóúâêôãõç\s]+$/i.test(formaFormatada)) {
      throw new Error('Forma de pagamento contém caracteres inválidos');
    }

    const formas = await this.formasPagamentoRepository.buscarTodas();

    if (formas.includes(formaFormatada)) {
      throw new Error('Essa forma de pagamento já existe');
    }

    await this.formasPagamentoRepository.salvar(formaFormatada);
    this.logger.log(`✅ Forma de pagamento adicionada: ${formaFormatada}`);

    return formaFormatada;
  }

  async inicializarFormasIfNeeded(): Promise<void> {
    const formas = await this.formasPagamentoRepository.buscarTodas();

    if (formas.length === 0) {
      this.logger.log('Inicializando formas de pagamento padrão...');
      for (const forma of this.FORMAS_PADRAO) {
        await this.formasPagamentoRepository.salvar(forma);
      }
      this.logger.log('✅ Formas de pagamento padrão inicializadas');
    }
  }

  async formatarListaFormas(formas: string[]): Promise<string> {
    return formas.map((forma, index) => `${index + 1}. ${forma}`).join('\n');
  }
}
