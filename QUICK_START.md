# 🚀 Quick Start Guide

## 5 Minutos para Começar

### Pré-requisitos

- Node.js 18+
- PostgreSQL 13+
- Git

### 1️⃣ Clone e Setup

```bash
# Instalar backend
npm install

# Instalar frontend
cd apps/web
npm install
cd ../..
```

### 2️⃣ Configurar Credenciais

```bash
# Backend
cp .env.example .env
# Edite .env:
# - DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD
# - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
# - JWT_SECRET (gere uma string aleatória)

# Frontend (opcional, já tem default)
cd apps/web
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000
cd ../..
```

### 3️⃣ Iniciar Backend

```bash
npm run start:dev
# ✅ http://localhost:3000
# Logs: "NestApplication has been successfully started"
```

### 4️⃣ Iniciar Frontend (outro terminal)

```bash
cd apps/web
npm run dev
# ✅ http://localhost:3001 (ou 3000 com proxy)
# Abrir: http://localhost:3001
```

### 5️⃣ Testar Fluxo OTP

1. Acesse `http://localhost:3001/auth/login`
2. Digite telefone: `+5521999999999` (seu telefone real)
3. Clique "Enviar Código"
4. ✅ Você recebe OTP no WhatsApp
5. Digite o código (6 dígitos)
6. ✅ Login bem-sucedido → Dashboard

---

## 📂 Arquivos Importantes

| Arquivo                           | Descrição                    |
| --------------------------------- | ---------------------------- |
| `src/domain/`                     | Lógica de negócio pura (DDD) |
| `src/application/use-cases/auth/` | Autenticação OAuth           |
| `src/infrastructure/api/`         | Controllers REST             |
| `src/infrastructure/guards/`      | Proteção JWT                 |
| `apps/web/src/lib/store.ts`       | Zustand auth                 |
| `apps/web/src/lib/api.ts`         | Axios + interceptadores      |
| `.env.example`                    | Config backend               |
| `docs/ARCHITECTURE.md`            | Guia completo                |

---

## 🔧 Commando Úteis

### Backend

```bash
npm run start:dev        # Desenvolvimento com auto-reload
npm run build            # Build production
npm run test            # Rodar testes
npm run lint            # ESLint + fix
```

### Frontend

```bash
npm run dev             # Desenvolvimento
npm run build           # Build otimizado
npm run start           # Produção
npm run lint            # ESLint
```

---

## 🐛 Troubleshooting

| Problema           | Solução                                         |
| ------------------ | ----------------------------------------------- |
| Porta 3000 ocupada | Mude para 3001:`npm run dev -- -p 3001`         |
| OTP não chega      | Verificar `TWILIO_*` em .env                    |
| Erro no banco      | Criar DB: `createdb bot_financa`                |
| JWT erro           | Verificar `JWT_SECRET` em .env                  |
| CORS error         | Verificar `NEXT_PUBLIC_API_URL` em `.env.local` |

---

## 📚 Leia Depois

1. **[docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)** - Arquitetura DDD
2. **[IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md)** - O que foi implementado
3. **[README.md](../README.md)** - Overview geral

---

Pronto! 🎉 Agora acesse `http://localhost:3001` e comece a testar.
