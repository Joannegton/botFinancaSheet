import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, sheets_v4 } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs/promises';
import { IConfigRepository } from '@domain/repositories/IConfigRepository';

@Injectable()
export class ConfigGoogleSheetsRepository implements IConfigRepository, OnModuleInit {
  private readonly logger = new Logger(ConfigGoogleSheetsRepository.name);
  private sheets!: sheets_v4.Sheets;
  private spreadsheetId!: string;
  private sheetName = 'Config';
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
      this.logger.error(`Erro ao inicializar Config: ${msg}`);
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
        range: `${this.sheetName}!A1:B1`,
      });

      if (!values.data.values || values.data.values.length === 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['UserId', 'DiaInicio']],
          },
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao garantir existência da aba: ${msg}`);
      throw error;
    }
  }

  async salvarConfig(userId: number, diaInicio: number): Promise<void> {
    try {
      const existente = await this.obterConfig(userId);

      if (existente !== null) {
        // Atualizar
        await this.atualizarConfig(userId, diaInicio);
        return;
      }

      // Inserir novo
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:B`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[userId, diaInicio]],
        },
      });

      this.logger.log(`✅ Config salva: userId=${userId}, diaInicio=${diaInicio}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao salvar config: ${msg}`);
    }
  }

  async obterConfig(userId: number): Promise<number | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A2:B`,
      });

      if (!response.data.values || response.data.values.length === 0) {
        return null;
      }

      const linha = response.data.values.find((row) => Number(row[0]) === userId);

      if (!linha) {
        return null;
      }

      return Number(linha[1]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao obter config: ${msg}`);
      return null;
    }
  }

  async atualizarConfig(userId: number, diaInicio: number): Promise<void> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A2:B`,
      });

      if (!response.data.values) {
        throw new Error('Nenhuma config encontrada');
      }

      const rowIndex = response.data.values.findIndex((row) => Number(row[0]) === userId);

      if (rowIndex === -1) {
        throw new Error(`Config não encontrada para userId=${userId}`);
      }

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!B${rowIndex + 2}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[diaInicio]],
        },
      });

      this.logger.log(`✅ Config atualizada: userId=${userId}, diaInicio=${diaInicio}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao atualizar config: ${msg}`);
    }
  }
}
