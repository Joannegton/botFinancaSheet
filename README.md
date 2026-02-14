# 📊 Sistema de Registro de Gastos via Telegram

Sistema profissional para registro automático de gastos via Telegram Bot com salvamento em Google Sheets para analise e filtros avançados.

## 🎯 Funcionalidades

Para ver a documentação completa de todas as funcionalidades do sistema, acesse:

📖 **[FUNCIONALIDADES.md](./FUNCIONALIDADES.md)** - Documentação detalhada com exemplos e casos de uso

## 📋 Pré-requisitos

### 1. Criar Bot no Telegram

1. Abra o Telegram e procure por `@BotFather`
2. Envie `/newbot`
3. Escolha um nome e username para seu bot
4. Copie o **token** fornecido
5. Para obter seu **User ID**:
   - Procure por `@userinfobot`
   - Envie `/start`
   - Copie o **Id** mostrado

### 2. Configurar Google Sheets

#### 2.1. Criar Service Account

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** → **Credentials**
4. Clique em **Create Credentials** → **Service Account**
5. Preencha os dados e clique em **Create**
6. Clique na service account criada
7. Vá em **Keys** → **Add Key** → **Create new key**
8. Escolha **JSON** e faça o download
9. [Documentação oficial](https://developers.google.com/workspace/guides/create-credentials?hl=pt-br#service-account)

#### 2.2. Ativar Google Sheets API

1. No Google Cloud Console, vá em **APIs & Services** → **Library**
2. Procure por "Google Sheets API"
3. Clique em **Enable**

#### 2.3. Criar e Compartilhar Planilha

1. Crie uma nova planilha no [Google Sheets](https://sheets.google.com)
2. Copie o **ID da planilha** da URL:
   ```
   https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit
   ```
3. Clique em **Compartilhar**
4. Cole o email da service account (está no JSON baixado)
5. Dê permissão de **Editor**

## 🚀 Instalação

### Opção 1: Docker (Recomendado)

```bash
# Clone o repositório
cd botFinancaSheet

# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas credenciais
nano .env

# Inicie com Docker Compose
docker-compose up -d

# Veja os logs
docker-compose logs -f
```

## ⚙️ Configuração (.env)

Edite o arquivo `.env` com suas credenciais:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_USER_ID=123456789
TELEGRAM_WEBHOOK_SECRET=seu_secret_aleatorio_aqui

# Google Sheets Configuration
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
GOOGLE_SHEETS_SHEET_NAME=Gastos

# Application
NODE_ENV=production
PORT=3000
```

### Configuração de Credenciais do Google

O arquivo `credentials.json` é necessário para autenticar com o Google Sheets:

1. **Baixe as credenciais** no [Google Cloud Console](https://console.cloud.google.com/)
2. **Copie o conteúdo** do arquivo JSON para `credentials.json` na raiz do projeto
3. **Não faça commit** desse arquivo (está no `.gitignore`)

Veja [SETUP_GOOGLE_SHEETS.md](./SETUP_GOOGLE_SHEETS.md) para instruções detalhadas.

### Como obter a Private Key do JSON:

Abra o arquivo JSON baixado da service account e procure por `private_key`.
Copie o valor incluindo as aspas e quebras de linha (`\n`).

## 🛠️ Stack Tecnológica

- **Node.js 20** (LTS)
- **TypeScript 5.3**
- **NestJS 10** - Framework backend
- **Telegraf 4.16** - Bot do Telegram
- **Google Sheets API** - Armazenamento de dados
- **Docker** - Containerização

## 📄 Licença

© 2026 - Projeto Privado. Todos os direitos reservados.
