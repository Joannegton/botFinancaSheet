# 🚀 Guia Rápido de Início

## Passo 1: Criar Bot no Telegram

1. Abra o Telegram
2. Procure por `@BotFather`
3. Envie: `/newbot`
4. Escolha um nome: `Meu Controle de Gastos`
5. Escolha um username: `meu_gastos_bot`
6. **Copie o token** (algo como: `123456:ABC-DEF1234...`)

## Passo 2: Obter seu User ID

1. Procure por `@userinfobot` no Telegram
2. Envie: `/start`
3. **Copie o Id** (número tipo: `123456789`)

## Passo 3: Configurar Google Sheets

### 3.1. Criar Service Account

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto novo ou use um existente
3. Vá em: **APIs & Services** → **Credentials**
4. **Create Credentials** → **Service Account**
5. Dê um nome e clique em **Create**
6. Clique na service account criada
7. Vá em **Keys** → **Add Key** → **Create new key** → **JSON**
8. Baixe o arquivo JSON

### 3.2. Ativar Google Sheets API

1. No menu, vá em: **APIs & Services** → **Library**
2. Procure: "Google Sheets API"
3. Clique em **Enable**

### 3.3. Criar Planilha

1. Acesse: https://sheets.google.com
2. Crie uma nova planilha
3. Dê um nome: "Meus Gastos"
4. **Copie o ID da URL** (entre `/d/` e `/edit`):
   ```
   https://docs.google.com/spreadsheets/d/ESTE_É_O_ID/edit
   ```
5. Clique em **Compartilhar**
6. Cole o email da service account (está no JSON: `client_email`)
7. Dê permissão de **Editor**
8. Envie

## Passo 4: Configurar o Projeto

### Windows:

```bash
# Execute o script de setup
setup.bat

# Edite o arquivo .env (abrirá no bloco de notas)
notepad .env
```

### Linux/Mac:

```bash
# Dê permissão de execução
chmod +x setup.sh

# Execute o script
./setup.sh

# Edite o arquivo .env
nano .env
```

## Passo 5: Preencher o .env

Abra o arquivo `.env` e preencha:

```env
# Cole o token do BotFather
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# Cole seu User ID
TELEGRAM_USER_ID=123456789

# Cole o ID da planilha
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

# Cole o email do arquivo JSON
GOOGLE_SERVICE_ACCOUNT_EMAIL=seu-bot@seu-projeto.iam.gserviceaccount.com

# Cole a private_key do arquivo JSON (mantenha as aspas e \n)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhki...\n-----END PRIVATE KEY-----\n"
```

**IMPORTANTE:** Para a `GOOGLE_PRIVATE_KEY`:
- Abra o arquivo JSON baixado
- Procure por `"private_key"`
- Copie o valor INTEIRO (incluindo `-----BEGIN` e `-----END`)
- Cole no .env mantendo as aspas e os `\n`

## Passo 6: Iniciar a Aplicação

### Opção 1: Docker (mais fácil)

```bash
docker-compose up -d
```

### Opção 2: Node.js

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## Passo 7: Testar

1. Abra o Telegram
2. Procure pelo seu bot
3. Envie: `/start`
4. Teste enviando: `pix - 10 - comida - teste`
5. Verifique se apareceu na planilha!

## ✅ Pronto!

Agora você pode:

- Enviar gastos via mensagem direta
- Usar `/menu` para modo interativo
- Usar `/relatorio` para ver resumo
- Usar `/ajuda` para ver instruções

## 🆘 Problemas Comuns

### Bot não responde

- Verifique se o token está correto
- Confirme se iniciou a aplicação (`docker-compose logs -f`)

### Não salva no Google Sheets

- Confirme que compartilhou a planilha com a service account
- Verifique se a API está ativada
- Confirme que a `GOOGLE_PRIVATE_KEY` está completa (com `\n`)

### Erro de autenticação

- Confirme que o `TELEGRAM_USER_ID` está correto
- Use o `@userinfobot` para verificar seu ID

## 📊 Ver Logs

```bash
# Docker
docker-compose logs -f

# Node.js direto
# Os logs aparecerão no console
```

---

**Qualquer dúvida, consulte o README.md completo!**
