import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, sheets_v4 } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ICategoriasRepository } from '@domain/repositories/ICategoriasRepository';

@Injectable()
export class CategoriasGoogleSheetsRepository implements ICategoriasRepository, OnModuleInit {
  private readonly logger = new Logger(CategoriasGoogleSheetsRepository.name);
  private sheets!: sheets_v4.Sheets;
  private spreadsheetId!: string;
  private sheetName = 'Categorias';
  private readonly CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

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
      this.logger.error(`Erro ao inicializar Categorias: ${msg}`);
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
            values: [['Categoria']],
          },
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao garantir existência da aba: ${msg}`);
      throw error;
    }
  }

  async salvar(categoria: string): Promise<void> {
    try {
      const categoriaFormatada = categoria.toLowerCase().trim();

      const existe = await this.existe(categoriaFormatada);
      if (existe) {
        throw new Error(`Categoria ${categoriaFormatada} já existe`);
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
          values: [[categoriaFormatada]],
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao salvar categoria: ${msg}`);
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
        .filter((cat) => cat && cat !== '');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao buscar categorias: ${msg}`);
      return [];
    }
  }

  async existe(categoria: string): Promise<boolean> {
    const categorias = await this.buscarTodas();
    return categorias.includes(categoria.toLowerCase().trim());
  }

  async salvarTodas(categorias: string[]): Promise<void> {
    try {
      const categoriasFormatadas = categorias.map((c) => [c.toLowerCase().trim()]);

      // Clear existing data (except header)
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A2:A`,
      });

      if (categoriasFormatadas.length > 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A2`,
          valueInputOption: 'RAW',
          requestBody: {
            values: categoriasFormatadas,
          },
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao salvar todas as categorias: ${msg}`);
    }
  }
}
