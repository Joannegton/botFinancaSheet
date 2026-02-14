import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, sheets_v4 } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs/promises';
import { IGastoRepository } from '@domain/repositories/IGastoRepository';
import { Gasto } from '@domain/entities/Gasto';
import { FormaPagamento } from '@domain/value-objects/FormaPagamento';
import { TipoGasto } from '@domain/value-objects/TipoGasto';
import { Valor } from '@domain/value-objects/Valor';

@Injectable()
export class GoogleSheetsRepository implements IGastoRepository, OnModuleInit {
  private readonly logger = new Logger(GoogleSheetsRepository.name);
  private sheets!: sheets_v4.Sheets;
  private spreadsheetId!: string;
  private sheetName!: string;
  private sheetId!: number;
  private readonly HEADER_ROW = ['Data/Hora', 'Forma Pagamento', 'Tipo', 'Valor', 'Observação'];
  private readonly CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initialize();
  }

  private async authorize() {
    const content = await fs.readFile(this.CREDENTIALS_PATH, 'utf-8');
    const credentials = JSON.parse(content);

    if (credentials.type !== 'service_account') {
      throw new Error(
        'credentials.json deve ser do tipo "service_account". ' +
          'Este é um arquivo especial para bots. ' +
          'Veja: https://console.cloud.google.com/apis/credentials',
      );
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: this.CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return auth.getClient();
  }

  private async initialize(): Promise<void> {
    try {
      const spreadsheetId = this.configService.get<string>('GOOGLE_SHEETS_SPREADSHEET_ID');
      const sheetName = this.configService.get<string>('GOOGLE_SHEETS_SHEET_NAME') || 'Gastos';

      if (!spreadsheetId || !sheetName) {
        throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID ou GOOGLE_SHEETS_SHEET_NAME não configurada');
      }

      this.spreadsheetId = spreadsheetId;
      this.sheetName = sheetName;

      const auth = await this.authorize();

      this.sheets = google.sheets({ version: 'v4', auth: auth as any });

      await this.ensureSheetExists();

      this.logger.log('Google Sheets inicializado com sucesso');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao inicializar Google Sheets: ${msg}`);
      throw error;
    }
  }

  private async ensureSheetExists(): Promise<void> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      let sheet = response.data.sheets?.find((s) => s.properties?.title === this.sheetName);

      if (!sheet) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: this.sheetName,
                  },
                },
              },
            ],
          },
        });

        this.logger.log(`Aba "${this.sheetName}" criada`);

        // Buscar novamente para pegar o sheetId correto da aba recém-criada
        const updatedResponse = await this.sheets.spreadsheets.get({
          spreadsheetId: this.spreadsheetId,
        });
        sheet = updatedResponse.data.sheets?.find((s) => s.properties?.title === this.sheetName);
      }

      // Armazenar o sheetId correto
      this.sheetId = sheet?.properties?.sheetId || 0;

      const values = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1:E1`,
      });

      if (!values.data.values || values.data.values.length === 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A1:E1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [this.HEADER_ROW],
          },
        });

        // Formatar cabeçalho: centralizado, bold, cor preta, fundo cinza-claro-1
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId: this.sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: 5,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: {
                        red: 0.85,
                        green: 0.85,
                        blue: 0.85,
                      },
                      textFormat: {
                        bold: true,
                        foregroundColor: {
                          red: 0,
                          green: 0,
                          blue: 0,
                        },
                      },
                      horizontalAlignment: 'CENTER',
                      verticalAlignment: 'MIDDLE',
                    },
                  },
                  fields:
                    'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat,userEnteredFormat.horizontalAlignment,userEnteredFormat.verticalAlignment',
                },
              },
            ],
          },
        });

        this.logger.log('Cabeçalho criado e formatado');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao verificar/criar planilha: ${msg}`);
      throw error;
    }
  }

  async salvar(gasto: Gasto): Promise<void> {
    try {
      const row = gasto.toSheetRow();

      // Encontrar a linha de Total
      const totalRowIndex = await this.findTotalRowIndex();

      if (totalRowIndex > 0) {
        // Inserir nova linha antes da linha de Total
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [
              {
                insertDimension: {
                  range: {
                    sheetId: this.sheetId,
                    dimension: 'ROWS',
                    startIndex: totalRowIndex - 1,
                    endIndex: totalRowIndex,
                  },
                },
              },
            ],
          },
        });

        // Preencher a nova linha
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A${totalRowIndex}:E${totalRowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [row],
          },
        });

        // Aplicar formatação correta à nova linha (fundo cinza claro, sem bold, centralizado)
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId: this.sheetId,
                    startRowIndex: totalRowIndex - 1,
                    endRowIndex: totalRowIndex,
                    startColumnIndex: 0,
                    endColumnIndex: 5,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: {
                        red: 0.95,
                        green: 0.95,
                        blue: 0.95,
                      },
                      textFormat: {
                        bold: false,
                      },
                      horizontalAlignment: 'CENTER',
                      verticalAlignment: 'MIDDLE',
                    },
                  },
                  fields:
                    'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat.bold,userEnteredFormat.horizontalAlignment,userEnteredFormat.verticalAlignment',
                },
              },
            ],
          },
        });

        // Atualizar a linha de Total
        await this.updateTotalRow();
      } else {
        // Se não houver linha de Total, fazer append normal
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A:E`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [row],
          },
        });

        // Buscar o número da linha que foi inserida
        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A:A`,
        });
        const newRowIndex = (response.data.values || []).length;

        // Aplicar formatação à nova linha (centralizado, fundo cinza-claro-2)
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId: this.sheetId,
                    startRowIndex: newRowIndex - 1,
                    endRowIndex: newRowIndex,
                    startColumnIndex: 0,
                    endColumnIndex: 5,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: {
                        red: 0.95,
                        green: 0.95,
                        blue: 0.95,
                      },
                      textFormat: {
                        bold: false,
                      },
                      horizontalAlignment: 'CENTER',
                      verticalAlignment: 'MIDDLE',
                    },
                  },
                  fields:
                    'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat.bold,userEnteredFormat.horizontalAlignment,userEnteredFormat.verticalAlignment',
                },
              },
            ],
          },
        });

        // E criar a linha de totais
        await this.updateTotalRow();
      }

      this.logger.log(`Gasto registrado: R$ ${gasto.valor.toNumber()} - ${gasto.tipo}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao salvar gasto: ${msg}`);
      throw new Error(`Falha ao salvar no Google Sheets: ${msg}`);
    }
  }

  private async findTotalRowIndex(): Promise<number> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:A`,
      });

      const values = response.data.values || [];

      // Procurar pela última linha que começa com "Total"
      for (let i = values.length - 1; i >= 2; i--) {
        if (values[i] && values[i][0] === 'Total') {
          return i + 1; // Retornar índice 1-based do Google Sheets
        }
      }

      return -1; // Não encontrou linha de Total
    } catch {
      return -1;
    }
  }

  private async clearTotalRow(): Promise<void> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:A`,
      });

      const values = response.data.values || [];

      // Encontrar a última linha que é "Total"
      for (let i = values.length - 1; i >= 2; i--) {
        if (values[i] && values[i][0] === 'Total') {
          const rowIndex = i + 1; // Índice do Google Sheets (1-based)
          await this.sheets.spreadsheets.values.clear({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A${rowIndex}:E${rowIndex}`,
          });
          return;
        }
      }
    } catch (error) {
      // Ignorar erro ao limpar linha de Total (pode não existir)
    }
  }

  private async updateTotalRow(): Promise<void> {
    try {
      // Buscar todas as linhas
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:E`,
      });

      const values = response.data.values || [];

      // Remover todas as linhas de Total existentes
      const totalRowIndices: number[] = [];
      for (let i = values.length - 1; i >= 1; i--) {
        if (values[i] && values[i][0] === 'Total') {
          totalRowIndices.push(i + 1); // Índice 1-based do Google Sheets
        }
      }

      // Remover linhas de Total (de cima para baixo para não deslocar índices)
      for (const rowIndex of totalRowIndices.sort((a, b) => b - a)) {
        await this.sheets.spreadsheets.values.clear({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A${rowIndex}:E${rowIndex}`,
        });
      }

      // Encontrar a última linha com dados (excluindo Totals agora removidos)
      let lastDataRowIndexInArray = 0;
      for (let i = values.length - 1; i >= 1; i--) {
        if (values[i] && values[i][0] !== 'Total') {
          lastDataRowIndexInArray = i;
          break;
        }
      }

      // Converter para índice 1-based do Google Sheets
      const lastDataRowSheets = lastDataRowIndexInArray + 1;
      const totalRowSheets = lastDataRowIndexInArray + 2;

      // Preparar dados para a linha de totais
      // A-B-C mescladas com "Total", D-E mescladas com fórmula
      const totalRow = ['Total', '', '', `=SUM(D2:D${lastDataRowSheets})`, ''];

      // Inserir/atualizar linha de totais
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A${totalRowSheets}:E${totalRowSheets}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [totalRow],
        },
      });

      // Formatar linha de totais
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            // Mesclar células A, B, C
            {
              mergeCells: {
                range: {
                  sheetId: this.sheetId,
                  startRowIndex: totalRowSheets - 1,
                  endRowIndex: totalRowSheets,
                  startColumnIndex: 0,
                  endColumnIndex: 3,
                },
                mergeType: 'MERGE_ALL',
              },
            },
            // Mesclar células D, E
            {
              mergeCells: {
                range: {
                  sheetId: this.sheetId,
                  startRowIndex: totalRowSheets - 1,
                  endRowIndex: totalRowSheets,
                  startColumnIndex: 3,
                  endColumnIndex: 5,
                },
                mergeType: 'MERGE_ALL',
              },
            },
            // Formatar células A-C (Total)
            {
              repeatCell: {
                range: {
                  sheetId: this.sheetId,
                  startRowIndex: totalRowSheets - 1,
                  endRowIndex: totalRowSheets,
                  startColumnIndex: 0,
                  endColumnIndex: 3,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.85,
                      green: 0.85,
                      blue: 0.85,
                    },
                    textFormat: {
                      bold: true,
                      foregroundColor: {
                        red: 0,
                        green: 0,
                        blue: 0,
                      },
                    },
                    horizontalAlignment: 'CENTER',
                    verticalAlignment: 'MIDDLE',
                  },
                },
                fields:
                  'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat,userEnteredFormat.horizontalAlignment,userEnteredFormat.verticalAlignment',
              },
            },
            // Formatar células D-E (Valor total)
            {
              repeatCell: {
                range: {
                  sheetId: this.sheetId,
                  startRowIndex: totalRowSheets - 1,
                  endRowIndex: totalRowSheets,
                  startColumnIndex: 3,
                  endColumnIndex: 5,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.85,
                      green: 0.85,
                      blue: 0.85,
                    },
                    textFormat: {
                      bold: true,
                      foregroundColor: {
                        red: 0,
                        green: 0,
                        blue: 0,
                      },
                    },
                    horizontalAlignment: 'CENTER',
                    verticalAlignment: 'MIDDLE',
                  },
                },
                fields:
                  'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat,userEnteredFormat.horizontalAlignment,userEnteredFormat.verticalAlignment',
              },
            },
          ],
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao atualizar linha de totais: ${msg}`);
      // Não lançar erro para não interromper o fluxo de gravação
    }
  }

  async buscarTodos(): Promise<Gasto[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A2:E`,
      });

      const rows = response.data.values || [];

      // Filtrar linhas de totais (que começam com "Total")
      return rows
        .filter((row) => row[0] !== 'Total')
        .map((row) => {
          const [dataHoraStr, formaPagamentoStr, tipoStr, valorStr, observacao] = row;

          const dataHora = this.parseDate(dataHoraStr);
          const formaPagamento = new FormaPagamento(formaPagamentoStr);
          const tipo = new TipoGasto(tipoStr);
          const valor = new Valor(Number(valorStr));

          return new Gasto(dataHora, formaPagamento, tipo, valor, observacao || undefined);
        });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao buscar gastos: ${msg}`);
      throw new Error(`Falha ao buscar gastos: ${msg}`);
    }
  }

  private parseDate(dateStr: string): Date {
    const date = new Date(dateStr);

    if (!isNaN(date.getTime())) {
      return date;
    }

    const brFormat = /(\d{2})\/(\d{2})\/(\d{4})[,\s]+(\d{2}):(\d{2}):(\d{2})/;
    const match = dateStr.match(brFormat);

    if (match) {
      const [, day, month, year, hour, minute, second] = match;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      );
    }

    return new Date();
  }
}
