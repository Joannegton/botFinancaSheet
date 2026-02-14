# 📁 Pasta de Configuração

Esta pasta é usada para armazenar arquivos de configuração sensíveis que **NÃO** devem ser commitados no Git.

## 🔐 Arquivos Esperados

### `service-account.json`

Arquivo de credenciais do Google Service Account para acesso ao Google Sheets.

**Como obter:**

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **APIs & Services** → **Credentials**
3. Clique na Service Account criada
4. Vá em **Keys** → **Add Key** → **Create new key**
5. Escolha **JSON** e faça o download
6. Renomeie para `service-account.json` e coloque nesta pasta

## 📋 Estrutura

```
config/
├── README.md                 # Este arquivo
└── service-account.json      # Credenciais Google (NÃO commitar!)
```

## 🚨 IMPORTANTE

- ✅ Esta pasta está no `.gitignore`
- ✅ Nunca commite arquivos de credenciais
- ✅ Use permissões `600` no arquivo (Linux/Mac): `chmod 600 service-account.json`
- ✅ Use permissões `700` na pasta (Linux/Mac): `chmod 700 config/`

## 🐳 Docker

O Docker Compose monta este arquivo como volume read-only:

```yaml
volumes:
  - ./config/service-account.json:/app/config/service-account.json:ro
```

## 🔧 Setup

### Desenvolvimento Local

```bash
# Copie seu arquivo de credenciais para cá
cp ~/Downloads/credentials.json config/service-account.json

# Configure permissões (Linux/Mac)
chmod 600 config/service-account.json
chmod 700 config/
```

### Produção (Servidor)

Recomendado usar pasta segura do sistema:

```bash
# Crie pasta segura
mkdir -p ~/.secrets/bot-gastos
chmod 700 ~/.secrets/bot-gastos

# Copie credenciais
cp credentials.json ~/.secrets/bot-gastos/service-account.json
chmod 600 ~/.secrets/bot-gastos/service-account.json

# Ajuste docker-compose.yml para usar:
# - ~/.secrets/bot-gastos/service-account.json:/app/config/service-account.json:ro
```

Veja [DEPLOYMENT.md](../DEPLOYMENT.md) para mais detalhes.

---

⚠️ **Nunca compartilhe ou commite arquivos de credenciais!**
