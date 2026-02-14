# Configuração do Google Sheets

Antes de rodar o bot, você precisa configurar as credenciais do Google Sheets.

## Passo 1: Criar uma Conta de Serviço no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google Sheets API**:
   - Vá para "APIs & Services" > "Library"
   - Procure por "Google Sheets API"
   - Clique em "Enable"

4. Crie uma **Service Account**:
   - Vá para "APIs & Services" > "Credentials"
   - Clique em "Create Credentials" > "Service Account"
   - Preencha o nome da conta (ex: "telegram-bot")
   - Clique em "Create and Continue"
   - Pule as próximas etapas clicando em "Continue"
   - [Documentação oficial](https://developers.google.com/workspace/guides/create-credentials?hl=pt-br#service-account)

## Passo 2: Gerar as Credenciais em JSON

1. Na página da Service Account:
   - Vá para a aba "Keys"
   - Clique em "Add Key" > "Create new key"
   - Selecione o tipo "JSON"
   - O arquivo será baixado automaticamente

2. Copie o conteúdo do arquivo JSON baixado
3. Cole no arquivo `service-account.json` da raiz do projeto
   - Caminho: `c:\...\...\...\projeto\config/credentials.json`

## Passo 3: Compartilhar a Planilha Google Sheets

1. Pegue o email da Service Account (está no arquivo service-account.json em `client_email`)
2. Abra sua planilha no Google Sheets
3. Clique em "Share" e adicione o email da Service Account como editor

## Variáveis de Ambiente

Certifique-se de que seu `.env` contém:

```
GOOGLE_APPLICATION_CREDENTIALS=/app/config/service-account.json
GOOGLE_SHEETS_SPREADSHEET_ID=seu_spreadsheet_id_aqui
GOOGLE_SHEETS_SHEET_NAME=Gastos
```

Para obter o `SPREADSHEET_ID`:

- Abra sua planilha no Google Sheets
- Copie o ID da URL: `https://docs.google.com/spreadsheets/d/{ID}/edit`
