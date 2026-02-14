import { Injectable } from '@nestjs/common';
import { Gasto } from '@domain/entities/Gasto';
import { FormaPagamento } from '@domain/value-objects/FormaPagamento';
import { TipoGasto } from '@domain/value-objects/TipoGasto';
import { Valor } from '@domain/value-objects/Valor';
import { GerenciarFormasPagamento } from '@application/use-cases/GerenciarFormasPagamento';
import { GerenciarCategorias } from '@application/use-cases/GerenciarCategorias';
import { GerenciarConfig } from '@application/use-cases/GerenciarConfig';

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
    private readonly gerenciarConfig: GerenciarConfig,
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

  async getMenuMessage(userId?: number): Promise<string> {
    let configText = `/config - Configurar dados`;
    let tituloTexto = '👋 Olá! Bem-vindo ao *Registro de Gastos*!';

    if (userId) {
      try {
        const diaInicio = await this.gerenciarConfig.obterDiaInicio(userId);
        if (diaInicio !== null) {
          // Calcular dias faltantes até o próximo mês
          const hoje = new Date();
          const diaAtual = hoje.getDate();
          const mesAtual = hoje.getMonth();
          const anoAtual = hoje.getFullYear();

          let diasFaltantes: number;
          if (diaInicio > diaAtual) {
            // No mesmo mês
            diasFaltantes = diaInicio - diaAtual;
          } else {
            // Próximo mês
            const diaInicioProxMes = new Date(anoAtual, mesAtual + 1, diaInicio);
            diasFaltantes = Math.ceil(
              (diaInicioProxMes.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
            );
          }
          tituloTexto = '👋 Bem vindo de volta!';
          configText = `\nSeu mês inicia em ${diasFaltantes} ${diasFaltantes === 1 ? 'dia' : 'dias'}`;
        }
      } catch (error) {
        // Se houver erro, mantém texto padrão
      }
    }

    return (
      `${tituloTexto}\n\n` +
      `Você pode registrar gastos de duas formas:\n\n` +
      `1️⃣ *Mensagem direta:*\n` +
      `\`[tipo pagamento], [valor], [categoria], [observação]\`\n` +
      `\`Ex: cartão nubank, 35, moradia, aluguel\`\n\n` +
      `2️⃣ *Modo interativo:*\n` +
      `Digite /criar\n\n` +
      `📝 *Conheça o funcionamento:*\n` +
      `/ajuda - Ver ajuda completa e todas as funcionalidades\n` +
      `/documentacao - Acessar documentação web completa\n` +
      `${configText}`
    );
  }

  async getHelpMessage(userId?: number): Promise<string> {
    const formas = await this.gerenciarFormasPagamento.buscarTodas();
    const categorias = await this.gerenciarCategorias.buscarTodas();

    const formasFormatadas = formas.map((f) => `  • ${f}`).join('\n');
    const categoriasFormatadas = categorias.map((c) => `  • ${c}`).join('\n');

    // Verificar se usuário tem config completa
    let avisoConfig = '';
    if (userId) {
      const diaInicio = await this.gerenciarConfig.obterDiaInicio(userId);
      if (diaInicio === null) {
        avisoConfig = `⚠️ *Atenção:* Você ainda não configurou o seu mês!\nUse /config para definir o dia de início do seu mês.\n\n`;
      }
    }

    return `${avisoConfig}📝 *Como registrar um gasto:*

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

🔧 *Comandos de registro:*
/criar - Modo interativo para registrar gasto
/cancelar - Cancelar operação atual

📊 *Comandos de consulta:*
/menu - Inicio
/ajuda - Ver este guia completo
/documentacao - Acessar documentação web completa
/relatorio - Ver últimos gastos

📂 *Gerenciar categorias:*
/categorias - Ver todas as categorias
/addcategoria [nome] - Adicionar nova categoria
/delcategoria [número] - Remover categoria por posição

💳 *Gerenciar formas de pagamento:*
/formas - Ver todas as formas de pagamento
/addforma [nome] - Adicionar nova forma de pagamento
/delforma [número] - Remover forma de pagamento por posição

️⚙ *Configuração:*
/config - Configurar dados`.trim();
  }
  //TODO ajustar link da documentacao em producao
  async getDocumentacaoMessage(): Promise<string> {
    return `📚 *Documentação Completa*

Acesse a documentação completa do sistema através do link abaixo:

🌐 *Documentação Web:*
[https://botfinancasheet.fly.dev/documentacao](https://botfinancasheet.fly.dev/documentacao)

💡 *Dicas:*
• Use em um navegador para melhor visualização
• Documentação inclui exemplos, comandos e troubleshooting
`.trim();
  }
}
