# 📊 Sistema de Registro de Gastos via Telegram

Sistema profissional para registro automático de gastos via Telegram Bot com salvamento em Google Sheets para analise e filtros avançados.

## 🎯 Funcionalidades

Para ver a documentação completa de todas as funcionalidades do sistema, acesse:

📖 **[FUNCIONALIDADES.md](./FUNCIONALIDADES.md)** - Documentação detalhada com exemplos e casos de uso

---

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

- Siga os passos indicados em [configurando google sheets](./SETUP_GOOGLE_SHEETS.md)

## 🚀 Instalação

### Docker

```bash
# 1. Copie seu arquivo baixado para a pasta config
cp /caminho/para/seu/credentials.json config/service-account.json

# 2. Copie o arquivo .env de exemplo
cp .env.example .env

# 3. Edite o .env com suas credenciais do Telegram
nano .env

# 4. Inicie com Docker Compose
docker-compose up -d --build

# 5. Veja os logs
docker-compose logs -f
```

📖 **Para deploy em servidor ou configuração avançada, veja [DEPLOYMENT.md](./DEPLOYMENT.md)**

## ⚙️ Configuração (.env)

Edite o arquivo `.env` com suas credenciais:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_USER_ID=123456789
TELEGRAM_WEBHOOK_SECRET=seu_secret_aleatorio_aqui

# Google Sheets Configuration
# Path DENTRO do container (não altere)
GOOGLE_APPLICATION_CREDENTIALS=/app/config/service-account.json
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
GOOGLE_SHEETS_SHEET_NAME=Gastos

# Application
NODE_ENV=production
PORT=3000
```

## 🛠️ Stack Tecnológica

- **Node.js 20** (LTS)
- **TypeScript 5.3**
- **NestJS 10** - Framework backend
- **Telegraf 4.16** - Bot do Telegram
- **Google Sheets API** - Armazenamento de dados
- **Docker** - Containerização

## 📄 Licença

© 2026 - Projeto Privado. Todos os direitos reservados.
