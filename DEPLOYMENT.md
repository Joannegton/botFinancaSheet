# 🚀 Guia de Deploy com Docker

Este guia explica como fazer deploy seguro da aplicação usando Docker com credenciais protegidas.

---

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Arquivo de credenciais do Google Service Account (JSON)
- Token do bot Telegram
- ID do usuário autorizado

---

## 🔐 Configuração Segura de Credenciais

### Opção 1: Desenvolvimento Local (Recomendado para testes)

```bash
# 1. Crie a pasta config no projeto
mkdir config

# 2. Copie o arquivo de credenciais do Google
cp /caminho/para/seu/credentials.json config/service-account.json

# 3. Configure permissões (Linux/Mac)
chmod 600 config/service-account.json
chmod 700 config/

# 4. Configure o .env
cp .env.example .env
nano .env  # Edite com suas credenciais
```

### Opção 2: Servidor de Produção (Mais Seguro)

```bash
# 1. Crie pasta segura fora do projeto
mkdir -p ~/.secrets/bot-gastos
chmod 700 ~/.secrets/bot-gastos

# 2. Coloque as credenciais na pasta segura
cp credentials.json ~/.secrets/bot-gastos/service-account.json
chmod 600 ~/.secrets/bot-gastos/service-account.json

# 3. Ajuste o docker-compose.yml
# Edite a linha de volume para apontar para a pasta segura:
```

**docker-compose.yml** (ajuste):

```yaml
volumes:
  # Credenciais em pasta segura do sistema
  - ~/.secrets/bot-gastos/service-account.json:/app/config/service-account.json:ro
  # Logs
  - ./logs:/app/logs
```

---

## 🏗️ Estrutura de Pastas

### Desenvolvimento:

```
nestJs/
├── config/                          # Pasta de configuração
│   └── service-account.json         # Credenciais Google (NUNCA commite!)
├── .env                             # Variáveis de ambiente (NUNCA commite!)
├── docker-compose.yml
└── ...
```

### Produção:

```
/home/usuario/
├── .secrets/                        # Pasta segura do sistema
│   └── bot-gastos/
│       └── service-account.json     # Credenciais isoladas
└── nestJs/                          # Projeto
    ├── .env
    ├── docker-compose.yml
    └── ...
```

---
