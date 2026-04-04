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

  async buscarTodas(userId: string): Promise<string[]> {
    return this.formasPagamentoRepository.buscarTodas(userId);
  }

  async adicionarForma(userId: string, forma: string): Promise<string> {
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

    const formas = await this.formasPagamentoRepository.buscarTodas(userId);

    if (formas.includes(formaFormatada)) {
      throw new Error('Essa forma de pagamento já existe');
    }

    await this.formasPagamentoRepository.salvar(userId, formaFormatada);
    this.logger.log(`✅ Forma de pagamento adicionada: ${formaFormatada}`);

    return formaFormatada;
  }

  async inicializarFormasIfNeeded(userId: string): Promise<void> {
    const formas = await this.formasPagamentoRepository.buscarTodas(userId);

    if (formas.length === 0) {
      this.logger.debug('Inicializando formas de pagamento padrão para ' + userId);
      for (const forma of this.FORMAS_PADRAO) {
        await this.formasPagamentoRepository.salvar(userId, forma);
      }
    }
  }

  async deletarFormaPorIndice(userId: string, indice: number): Promise<string> {
    const formas = await this.formasPagamentoRepository.buscarTodas(userId);

    if (indice < 1 || indice > formas.length) {
      throw new Error(`Índice inválido. Use um número entre 1 e ${formas.length}`);
    }

    const formaRemovida = formas[indice - 1];
    const novasFormas = formas.filter((_, i) => i !== indice - 1);

    await this.formasPagamentoRepository.salvarTodas(userId, novasFormas);
    this.logger.log(`✅ Forma de pagamento removida: ${formaRemovida}`);

    return formaRemovida;
  }

  async formatarListaFormas(formas: string[]): Promise<string> {
    return formas.map((forma, index) => `${index + 1}. ${forma}`).join('\n');
  }
}
