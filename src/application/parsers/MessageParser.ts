import { Injectable } from '@nestjs/common';
import { Gasto } from '@domain/entities/Gasto';
import { FormaPagamento } from '@domain/value-objects/FormaPagamento';
import { TipoGasto } from '@domain/value-objects/TipoGasto';
import { Valor } from '@domain/value-objects/Valor';

export interface MensagemParsed {
  formaPagamento: string;
  valor: string;
  tipo: string;
  observacao?: string;
}

@Injectable()
export class MessageParser {
  /**
   * Parse de mensagem no formato:
   * cartao - final 1234 - 35 - comida - almoço no centro
   * ou
   * pix - 50 - transporte - uber
   * ou
   * dinheiro - 20 - comida
   */
  parse(mensagem: string): Gasto {
    const partes = mensagem.split('-').map((p) => p.trim());

    if (partes.length < 3) {
      throw new Error(
        'Formato inválido. Use: [forma_pagamento] - [valor] - [tipo] - [observação opcional]',
      );
    }

    let formaPagamentoStr = partes[0];
    let valorStr: string;
    let tipoStr: string;
    let observacao: string | undefined;

    // Se começar com "final", é cartão com número
    if (partes.length >= 4 && partes[1].toLowerCase().startsWith('final')) {
      // cartao - final 1234 - 35 - comida - observacao
      formaPagamentoStr = partes[0];
      valorStr = partes[2];
      tipoStr = partes[3];
      observacao = partes.slice(4).join(' - ').trim() || undefined;
    } else {
      // Formato simples: pix - 50 - comida - observacao
      formaPagamentoStr = partes[0];
      valorStr = partes[1];
      tipoStr = partes[2];
      observacao = partes.slice(3).join(' - ').trim() || undefined;
    }

    try {
      const formaPagamento = new FormaPagamento(formaPagamentoStr);
      const valor = Valor.fromString(valorStr);
      const tipo = new TipoGasto(tipoStr);
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
    const partes = mensagem.split('-');
    return partes.length >= 3;
  }

  /**
   * Gera mensagem de ajuda
   */
  getHelpMessage(): string {
    return `
📝 *Como registrar um gasto:*

*Formato:*
\`[forma] - [valor] - [tipo] - [observação]\`

*Formas de pagamento:*
• cartao
• pix  
• dinheiro

*Tipos de gasto:*
• comida
• transporte
• lazer
• saude
• educacao
• moradia
• vestuario
• outros

*Exemplos:*
\`cartao - 35 - comida - almoço no centro\`
\`pix - 50.50 - transporte - uber\`
\`dinheiro - 20 - lazer\`
\`cartao - final 1234 - 150 - saude - consulta\`

Digite /menu para ver opções interativas.
    `.trim();
  }
}
