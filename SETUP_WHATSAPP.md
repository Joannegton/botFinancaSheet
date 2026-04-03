# ⚙️ Setup: Bot WhatsApp com Twilio + NestJS

Guia completo para configurar e rodar seu bot de controle financeiro usando a **Twilio WhatsApp API**.

> **Por que Twilio?** Simples, barato para testes (sandbox gratuito), e pronta para produção com número dedicado.

---

## 1️⃣ Pré-requisitos

- **Docker & Docker Compose** instalados
- **Google Cloud** com credenciais JSON (para Google Sheets)
- **Uma conta Twilio** — [console.twilio.com](https://console.twilio.com)
- **URL pública** para o webhook (use [ngrok](https://ngrok.com) em desenvolvimento)

---

## 2️⃣ Configurar Twilio WhatsApp

### 2.1 Acessar Twilio Console

1. Entre em [console.twilio.com](https://console.twilio.com)
2. No menu esquerdo, vá em **Messaging > Settings > WhatsApp Sandbox** (ou WhatsApp Production)

### 2.2 Obter as credenciais

No Twilio console, você precisa de:

| Campo               | Onde encontrar                           | Variável `.env`       |
| ------------------- | ---------------------------------------- | --------------------- |
| **Account SID**     | Conta → Account SID                      | `TWILIO_ACCOUNT_SID`  |
| **Auth Token**      | Conta → Auth Token (bem protegido!)      | `TWILIO_AUTH_TOKEN`   |
| **WhatsApp Number** | Messaging > WhatsApp SandBox (ex: +1...) | `TWILIO_WHATSAPP_...` |

### 2.3 Número de teste

Para testes, Twilio oferece um **número de sandbox gratuito**: `+14155238886`

Para produção, você compra um número dedicado.

---

## 3️⃣ Configurar o Arquivo `.env`

```bash
cp .env.example .env
```

Edite `.env` com seus valores:

```dotenv
# ─── TWILIO WHATSAPP ───
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  # Encontrado em: Conta → Account SID

TWILIO_AUTH_TOKEN=your_auth_token_here
  # Encontrado em: Conta → Auth Token
  # ⚠️ NUNCA commite isso no Git!

TWILIO_WHATSAPP_NUMBER=+14155238886
  # Sandbox (testes): +14155238886 (padrão Twilio)
  # Produção: seu número dedicado (ex: +5511987654321)

WHATSAPP_AUTHORIZED_NUMBER=5511999887766
  # Seu número com DDI (Brasil: 55 + DDD + celular)
  # APENAS DÍGITOS (sem + ou espaços)

# ─── GOOGLE SHEETS ───
GOOGLE_SHEETS_SPREADSHEET_ID=1a2b3c4d5e6f7g8h9i0j
GOOGLE_APPLICATION_CREDENTIALS=/app/config/service-account.json

# ─── APLICAÇÃO ───
NODE_ENV=production
PORT=3000
```

---

## 4️⃣ Credenciais Google Sheets

```bash
ls -la config/service-account.json
```

**Se não tiver:**

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie uma **Service Account** com acesso à Sheets API
3. Gere uma chave JSON → salve em `config/service-account.json`
4. Compartilhe a planilha com o e-mail da service account

---

## 5️⃣ Subir o Docker

```bash
# Sobe PostgreSQL + NestJS em background
docker compose up -d

# Acompanha os logs
docker compose logs -f app
```

**Logs esperados ao iniciar:**

```
[WhatsAppBotService] 🤖 Inicializando Bot do WhatsApp via Twilio WhatsApp API...
[WhatsAppBotService] ✅ WhatsApp Bot pronto! Twilio Number: "+14155238886"
[WhatsAppBotService] 📱 Número autorizado: 5511999999999
[WhatsAppBotService] 🌐 Aguardando webhooks em POST /webhook/whatsapp
```

---

## 6️⃣ Configurar o Webhook no Twilio

### 6.1 Expor a URL pública (desenvolvimento local)

```bash
# Instale ngrok: https://ngrok.com/download
ngrok http 3000
```

Copie a URL HTTPS gerada, ex: `https://abc123.ngrok-free.app`

### 6.2 Cadastrar o webhook no painel Twilio

1. Acesse [Twilio Console](https://console.twilio.com)
2. Vá em **Messaging > Settings > WhatsApp Sandbox**
3. Em **Sandbox Webhook URL**, configure:
   - **When a message comes in**: `https://sua-url.ngrok.io/webhook/whatsapp`
   - **HTTP Method**: POST

4. Clique em **Save**

---

## 7️⃣ Testar (Sandbox)

### 7.1 Adicionar seu número ao sandbox

1. Em **Twilio Console > Messaging > WhatsApp Sandbox**
2. Encontre a seção "To add a number to the sandbox"
3. Você verá algo como: `WhatsApp +14155238886 to +5511912345678`
4. Faça isso no seu celular no WhatsApp com a Twilio

### 7.2 Enviar uma mensagem

Envie qualquer mensagem no WhatsApp com a Twilio. Você deve ver:

```
docker compose logs -f app | grep "Mensagem recebida"
```

---

## 8️⃣ Primeiros Comandos

| Comando                | O que faz                            |
| ---------------------- | ------------------------------------ |
| `menu`                 | Mostra o menu principal              |
| `ajuda`                | Mostra todos os comandos             |
| `config`               | Configura o dia de início do mês     |
| `criar`                | Modo interativo para registrar gasto |
| `pix, 50, alimentação` | Registra gasto direto                |
| `relatório`            | Mostra gastos do período             |

---

## 9️⃣ Parar / Reiniciar

```bash
docker compose down       # Para tudo
docker compose restart app  # Reinicia só o bot
docker compose down -v    # Limpa tudo (⚠️ apaga banco)
```

---

## � Sistema de Segurança e Autorização

### Autorização por Número WhatsApp

O bot utiliza um **whitelist de um número único** para máxima segurança:

- ✅ **Mensagens do número autorizado** (`WHATSAPP_AUTHORIZED_NUMBER`) → Processadas normalmente
- 🚫 **Mensagens de outros números** → Rejeitadas com log de segurança

### Logs de Segurança

Quando você envia uma mensagem, você verá logs assim:

**✅ Acesso autorizado:**
```
📨 Webhook recebido. From="whatsapp:+5511970179936", Body="50, alimentação"
📩 Mensagem autorizada de 5511970179936: "50, alimentação"
```

**🚫 Acesso rejeitado:**
```
📨 Webhook recebido. From="whatsapp:+5511965835394", Body="teste"
🚫 Acesso não autorizado de: 5511965835394 | Esperado: 5511970179936
```

### Configurar o Número Autorizado

1. Abra `.env`
2. Localize: `WHATSAPP_AUTHORIZED_NUMBER=5511970179936`
3. **Substitua** pelo seu número (apenas dígitos, com DDI):
   - Brasil: `55` + DDD + celular
   - Exemplo: `5511987654321` (55 é a DDI do Brasil, 11 é de SP)
4. Reinicie: `docker compose restart app`

> ⚠️ **Importante**: Apenas DÍGITOS. Sem `+`, sem espaços, sem hífen.

### Teste de Autorização

```bash
# Ver logs em tempo real
docker compose logs -f app

# Procure por linhas com emoji 🚫 ou 📩
```

---

## 🔐 Validação de Assinatura Twilio

O webhook utiliza **HMAC-SHA1** para validar que as mensagens realmente vêm da Twilio:

- ✅ **Em desenvolvimento** (`NODE_ENV=development`): Assinatura inválida gera ⚠️ aviso mas permite
- 🔴 **Em produção** (`NODE_ENV=production`): Assinatura inválida rejeita com HTTP 400

**Logs esperados:**
```
✅ Assinatura Twilio validada com sucesso
```

**Se aparecer erro:**
```
⚠️ Assinatura Twilio inválida - em DEV será permitida
```

**Causas:**
- `TWILIO_AUTH_TOKEN` incorreto
- URL do webhook não corresponde ao registrado na Twilio
- Relógio do servidor fora de sincronismo

---

## 🎯 Troubleshooting

### ❌ "TWILIO_ACCOUNT_SID não configurado"

- Verifique que `.env` existe na raiz do projeto
- Certifique-se que as variáveis não estão comentadas
- Reinicie: `docker compose restart app`

### ❌ "Assinatura Twilio inválida"

- Confirme que `TWILIO_AUTH_TOKEN` está correto
- Verifique se não há espaços ou caracteres especiais indesejados
- O header `X-Twilio-Signature` deve vir na requisição

### ❌ "Webhook recebido mas mensagem ignorada"

Este é combinação de dois eventos:
1. ✅ Webhook chegou na aplicação (visto em logs)
2. 🚫 MAS número não está autorizado (rejeitado)

**Solução:**
```bash
# 1. Verificar qual número está autorizado:
grep WHATSAPP_AUTHORIZED_NUMBER .env

# 2. Enviar mensagem do seu número
# (mensagem que você está usando no What's App)

# 3. Ver o log com o número recusado
docker compose logs -f app | grep "Acesso não"
```

### ❌ "Google Sheets erro"

- Verifique `service-account.json` em `config/`
- Confirme que a planilha foi compartilhada com o e-mail da service account
- Verifique `GOOGLE_SHEETS_SPREADSHEET_ID`

---

## 🎯 Estrutura Final

```
botFinancaSheet/
├── .env                          ← Copiar de .env.example e customizar
├── .env.example                  ← Template (NÃO editar)
├── docker-compose.yml            ← Stack NestJS + PostgreSQL
├── config/
│   └── service-account.json      ← Credenciais Google (não commitado)
├── src/
│   ├── infrastructure/bots/
│   │   ├── WhatsAppBotService.ts         ← Lógica principal (Twilio)
│   │   └── WhatsAppWebhookController.ts  ← POST (recebe mensagens)
│   └── ...
└── SETUP_WHATSAPP.md             ← Este arquivo
```

---

**Feito! Seu bot está rodando com a Twilio.** 🎉

Envie `menu` no WhatsApp e comece a registrar gastos!
