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

      const sheet = response.data.sheets?.find((s) => s.properties?.title === this.sheetName);

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
      }

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

        const sheetId = sheet?.properties?.sheetId || 0;

        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      textFormat: {
                        bold: true,
                      },
                    },
                  },
                  fields: 'userEnteredFormat.textFormat.bold',
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

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:E`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [row],
        },
      });

      this.logger.log(`Gasto registrado: R$ ${gasto.valor.toNumber()} - ${gasto.tipo}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao salvar gasto: ${msg}`);
      throw new Error(`Falha ao salvar no Google Sheets: ${msg}`);
    }
  }

  async buscarTodos(): Promise<Gasto[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A2:E`,
      });

      const rows = response.data.values || [];

      return rows.map((row) => {
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
