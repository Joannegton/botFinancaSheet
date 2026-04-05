# ⚡ Quick Start - Stack Completo (Backend + Frontend + Banco)

## 🎯 Objetivo

Subir a stack inteira com um comando, testar autenticação e CRUD.

## 📋 Pré-requisitos

✅ **Docker Desktop** instalado  
✅ **Git** clonado ou este repo  
✅ **Credenciais Twilio** (para OTP via WhatsApp - opcional para teste)

## 🚀 3 Passos para Começar

### 1️⃣ Clone e Configure

```bash
cd botFinancaSheet
cp .env.example .env
# Editar .env conforme necessário (ou deixar defaults para dev)
```

### 2️⃣ Inicie Docker Stack

**Linux/Mac:**

```bash
chmod +x deploy.sh
./deploy.sh dev
```

**Windows:**

```bash
deploy.bat dev
```

**Ou manualmente:**

```bash
docker-compose up -d
```

### 3️⃣ Acesse a Aplicação

```
🌐 Frontend:    http://localhost (ou http://localhost:80)
📡 Backend API: http://localhost:3000
📚 API Docs:    http://localhost:3000/docs
🔧 Postgres:    localhost:5432
```

---

## ✅ Validar Setup

### Verificar Saúde dos Serviços

```bash
# Ver logs em tempo real
docker-compose logs -f

# Ou individual
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
docker-compose logs nginx

# Ver containers rodando
docker-compose ps
```

### Testar Backend

```bash
# Health check
curl http://localhost:3000/health

# Solicitar OTP (sem Twilio, apenas mock)
curl -X POST http://localhost:3000/api/auth/solicitar-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+5521999999999"}'

# Listar gastos (sem autenticação = 401 Unauthorized)
curl -X GET http://localhost:3000/api/gastos
# Resposta: 401 Unauthorized (esperada)
```

### Testar Frontend

```bash
# Abrir no browser
open http://localhost  # Mac
xdg-open http://localhost  # Linux
start http://localhost  # Windows
# Ou navegue manualmente em http://localhost

# Devtools
# F12 → Network tab
# Tentar login (sem Twilio, fase 1 deve falhar)
# → POST /api/auth/solicitar-otp → 400-500 (sem Twilio config)
```

---

## 🔐 Adicionar Credenciais Twilio (Opcional)

Se quiser testar OTP real via WhatsApp:

1. **Criar conta Twilio**
   - Ir para https://www.twilio.com/console
   - Pegar: ACCOUNT_SID, AUTH_TOKEN
   - Ativar WhatsApp sandbox (ou número de produção)
   - Copiar TWILIO_WHATSAPP_NUMBER (ex: +1234567890)

2. **Atualizar .env**

   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_WHATSAPP_NUMBER=+1234567890
   ```

3. **Restart containers**

   ```bash
   docker-compose restart backend
   ```

4. **Testar**
   ```bash
   # Seu telefone deve receber mensagem com OTP
   curl -X POST http://localhost:3000/api/auth/solicitar-otp \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "+55XXXXXXXXX"}'  # Seu número
   ```

---

## 🗂️ Estrutura da Stack

```
┌──────────────────────────────────────────────┐
│           Nginx (Porta 80/443)               │
│  - Reverse proxy                             │
│  - SSL/TLS                                   │
│  - Static file serving                       │
└─────────────────┬──────────────────┬─────────┘
                  │                  │
        ┌─────────▼────┐    ┌────────▼────────┐
        │   Backend    │    │    Frontend     │
        │  NestJS      │    │   Next.js       │
        │  :3000       │    │   :3001         │
        └─────────┬────┘    └────────┬────────┘
                  └──────────┬───────┘
                       ┌─────▼──────┐
                       │ PostgreSQL │
                       │  :5432     │
                       └────────────┘
```

---

## 📝 Workflow Típico

### 1. Fazer Login

```
1. Abrir http://localhost
2. Clique no ícone da aplicação (ou ir para /auth/login)
3. Insira seu telefone (+5521999999999)
4. Receba código via WhatsApp (ou mock)
5. Insira código
6. Será redirecionado para dashboard (/)
```

### 2. Criar Gasto

```
1. No dashboard, clique em "Gastos"
2. Clique "Novo Gasto"
3. Preencha:
   - Valor: 50.00
   - Categoria: Alimentação
   - Forma de Pagamento: PIX
   - Observação: Almoço com cliente
4. Clique "Salvar"
5. Gasto aparece na tabela (desktop) ou cards (mobile)
```

### 3. Ver Relatórios

```
1. Clique em "Relatórios"
2. Ver resumo do mês (por categoria)
3. Ver gráfico de tendências (últimos 12 meses)
```

---

## 🛑 Parar Stack

```bash
# Parar containers (dados persistem)
docker-compose down

# Parar e remover volumes (limpar banco)
docker-compose down -v

# Ver containers parados
docker-compose ps -a
```

---

## 🧹 Limpar Tudo

```bash
# Remover containers, images, volumes
docker-compose down -v --remove-orphans
docker image rm postgres:16-alpine node:18-alpine nginx:alpine

# Limpar node_modules (opcional)
rm -rf node_modules apps/web/node_modules
```

---

## 🐛 Troubleshooting

| Problema                                 | Solução                                                   |
| ---------------------------------------- | --------------------------------------------------------- |
| **"Connection refused: localhost:3000"** | Backend não iniciou. Ver: `docker-compose logs backend`   |
| **"Cannot GET /"**                       | Frontend não iniciou. Ver: `docker-compose logs frontend` |
| **"108: Cannot connect to Postgres"**    | Banco não saudável. Aguarde 30s ou ver logs postgres      |
| **"401 Unauthorized"**                   | Sem token JWT. Fazer login primeiro                       |
| **"TWILIO_ACCOUNT_SID is not defined"**  | Adicionar em .env. OTP sem Twilio sempre falha            |
| **"Port 3000 already in use"**           | Outro processo usando. `lsof -i :3000` e matar            |
| **Mobile não conecta API**               | NEXT_PUBLIC_API_URL deve estar correto. Ver .env.local    |

---

## 📊 Visualizar Dados

### Banco de Dados

```bash
# Conectar ao postgres
docker-compose exec postgres psql -U postgres -d bot_financa

# Listar tabelas
\dt

# Ver usuários
SELECT * FROM "Usuario";

# Ver gastos
SELECT * FROM "Gasto";

# Ver categorias
SELECT * FROM "Categoria";
```

### Logs

```bash
# Todos os logs
docker-compose logs

# Últimas 100 linhas
docker-compose logs --tail 100

# Em tempo real
docker-compose logs -f

# Específico do backend
docker-compose logs backend -f
```

---

## 🔄 Desenvolvimento

### Fazer mudanças no código

**Backend (NestJS)**:

```bash
# Se subir sem Docker:
npm run start:dev
# Hot reload automático em src/

# Se subir via Docker:
# editar arquivo → docker-compose restart backend
# (volume monta src/ em tempo real)
```

**Frontend (Next.js)**:

```bash
# Se subir sem Docker:
cd apps/web
npm run dev
# Hot reload automático em src/

# Se subir via Docker:
# editar arquivo → preview no navegador (refetch)
```

---

## 📦 Variáveis de Ambiente

### Backend (.env)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=bot_financa
PORT=3000
NODE_ENV=development
JWT_SECRET=dev-secret-key
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
```

### Frontend (apps/web/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 🎯 Próximos Passos

- [ ] Testar fluxo de login com OTP real (adicionar Twilio)
- [ ] Criar alguns gastos e ver relatórios
- [ ] Customizar categorias em /config
- [ ] Exportar dados em CSV
- [ ] Configurar dark mode
- [ ] Deploy em staging (`./deploy.sh staging`)

---

**Documentação**: Ver [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)  
**ArchitectureDetails**: Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)  
**Issues**: Abrir no GitHub ou ver [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
