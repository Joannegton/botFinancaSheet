import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, sheets_v4 } from 'googleapis';
import * as fs from 'fs/promises';
import { IFormasPagamentoRepository } from '@domain/repositories/IFormasPagamentoRepository';

@Injectable()
export class FormasPagamentoGoogleSheetsRepository
  implements IFormasPagamentoRepository, OnModuleInit
{
  private readonly logger = new Logger(FormasPagamentoGoogleSheetsRepository.name);
  private sheets!: sheets_v4.Sheets;
  private spreadsheetId!: string;
  private sheetName = 'FormasPagamento';
  private sheetId!: number;
  private readonly CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS as string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initialize();
  }

  private async authorize() {
    const content = await fs.readFile(this.CREDENTIALS_PATH, 'utf-8');
    const credentials = JSON.parse(content);

    if (credentials.type !== 'service_account') {
      throw new Error('credentials.json deve ser do tipo "service_account"');
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

      if (!spreadsheetId) {
        throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID não configurado');
      }

      this.spreadsheetId = spreadsheetId;

      const auth = await this.authorize();
      this.sheets = google.sheets({ version: 'v4', auth: auth as any });

      await this.ensureSheetExists();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao inicializar Formas de Pagamento: ${msg}`);
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

        const updatedResponse = await this.sheets.spreadsheets.get({
          spreadsheetId: this.spreadsheetId,
        });
        sheet = updatedResponse.data.sheets?.find((s) => s.properties?.title === this.sheetName);
      }

      this.sheetId = sheet?.properties?.sheetId || 0;

      const values = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1:A1`,
      });

      if (!values.data.values || values.data.values.length === 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Forma de Pagamento']],
          },
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao garantir existência da aba: ${msg}`);
      throw error;
    }
  }

  async salvar(forma: string): Promise<void> {
    try {
      const formaFormatada = forma.toLowerCase().trim();

      const existe = await this.existe(formaFormatada);
      if (existe) {
        throw new Error(`Forma de pagamento ${formaFormatada} já existe`);
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:A`,
      });

      const rowIndex = (response.data.values?.length || 0) + 1;

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[formaFormatada]],
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao salvar forma de pagamento: ${msg}`);
    }
  }

  async buscarTodas(): Promise<string[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A2:A`,
      });

      if (!response.data.values || response.data.values.length === 0) {
        return [];
      }

      return response.data.values
        .map((row) => row[0]?.toString().toLowerCase().trim())
        .filter((forma) => forma && forma !== '');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao buscar formas de pagamento: ${msg}`);
      return [];
    }
  }

  async salvarTodas(formas: string[]): Promise<void> {
    try {
      const formasFormatadas = formas.map((f) => [f.toLowerCase().trim()]);

      // Clear existing data (except header)
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A2:A`,
      });

      if (formasFormatadas.length > 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A2`,
          valueInputOption: 'RAW',
          requestBody: {
            values: formasFormatadas,
          },
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao salvar todas as formas de pagamento: ${msg}`);
    }
  }

  async existe(forma: string): Promise<boolean> {
    const formas = await this.buscarTodas();
    return formas.includes(forma.toLowerCase().trim());
  }
}
