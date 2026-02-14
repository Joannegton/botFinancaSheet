import { Injectable } from '@nestjs/common';
import { Gasto } from '@domain/entities/Gasto';
import { FormaPagamento } from '@domain/value-objects/FormaPagamento';
import { TipoGasto } from '@domain/value-objects/TipoGasto';
import { Valor } from '@domain/value-objects/Valor';
import { GerenciarFormasPagamento } from '@application/use-cases/GerenciarFormasPagamento';
import { GerenciarCategorias } from '@application/use-cases/GerenciarCategorias';

export interface MensagemParsed {
  formaPagamento: string;
  valor: string;
  tipo: string;
  observacao?: string;
}

@Injectable()
export class MessageParser {
  constructor(
    private readonly gerenciarFormasPagamento: GerenciarFormasPagamento,
    private readonly gerenciarCategorias: GerenciarCategorias,
  ) {}
  /**
   * Parse de mensagem no formato:
   * cartão nubank, 35, comida, almoço no centro
   * ou
   * pix, 50, transporte, uber
   * ou
   * dinheiro, 20, comida
   */
  async parse(mensagem: string): Promise<Gasto> {
    const partes = mensagem.split(',').map((p) => p.trim());

    if (partes.length < 3) {
      throw new Error(
        'Formato inválido. Use: [forma_pagamento], [valor], [tipo], [observação opcional]',
      );
    }

    const formaPagamentoStr = partes[0];
    const valorStr = partes[1];
    const tipoStr = partes[2];
    const observacao = partes.slice(3).join(', ').trim() || undefined;

    try {
      // Validar forma de pagamento
      const formasValidas = await this.gerenciarFormasPagamento.buscarTodas();
      const formaNormalizada = formaPagamentoStr.toLowerCase().trim();
      const formaValida = formasValidas.find((f) => f.toLowerCase() === formaNormalizada);
      if (!formaValida) {
        throw new Error(
          `Forma de pagamento inválida: ${formaPagamentoStr}. Use /formas para ver as opções válidas`,
        );
      }

      // Validar tipo de gasto
      const tiposValidos = await this.gerenciarCategorias.buscarTodas();
      const tipoNormalizado = tipoStr.toLowerCase().trim();
      const tipoValido = tiposValidos.find((t) => t.toLowerCase() === tipoNormalizado);
      if (!tipoValido) {
        throw new Error(
          `Tipo de gasto inválido: ${tipoStr}. Use /categorias para ver as opções válidas`,
        );
      }

      const formaPagamento = new FormaPagamento(formaValida);
      const valor = Valor.fromString(valorStr);
      const tipo = new TipoGasto(tipoValido);
      const dataHora = new Date();

      return new Gasto(dataHora, formaPagamento, tipo, valor, observacao);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao processar mensagem: ${msg}`);
    }
  }

  /**
   * Valida se a mensagem parece ser um registro de gasto
   */
  isGastoMessage(mensagem: string): boolean {
    const partes = mensagem.split(',');
    return partes.length >= 3;
  }

  /**
   * Gera mensagem de ajuda
   */
  async getHelpMessage(): Promise<string> {
    const formas = await this.gerenciarFormasPagamento.buscarTodas();
    const categorias = await this.gerenciarCategorias.buscarTodas();

    const formasFormatadas = formas.map((f) => `• ${f}`).join('\n');
    const categoriasFormatadas = categorias.map((c) => `• ${c}`).join('\n');

    return `
📝 *Como registrar um gasto:*

*Formato:*
\`[forma], [valor], [tipo], [observação]\`

*Exemplos:*
\`${formas[0] || 'cartao'}, 35, ${categorias[0] || 'comida'}, almoço no centro\`
\`${formas[1] || 'pix'}, 50.50, ${categorias[1] || 'transporte'}, uber\`
\`${formas[2] || 'dinheiro'}, 20, ${categorias[2] || 'lazer'}\`

*Formas de pagamento disponíveis:*
${formasFormatadas}

*Tipos de gasto disponíveis:*
${categoriasFormatadas}

*Comandos disponíveis:*
/menu - Ver mensagem de boas-vindas
/ajuda - Ver este guia completo
/criar - Modo interativo para registrar gasto
/cancelar - Cancelar operação atual
/relatorio - Ver últimos gastos
/categorias - Ver todas as categorias
/addcategoria [nome] - Adicionar nova categoria
/formas - Ver todas as formas de pagamento
/addforma [nome] - Adicionar nova forma de pagamento
    `.trim();
  }
}
