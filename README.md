# � Bot Finanças - Sistema de Controle de Gastos

**Stack Moderno**: NestJS + DDD/Clean Architecture + Next.js + TanStack Query + Zustand

Sistema completo para controle financeiro com:

- 🤖 Bot WhatsApp integrado (Twilio)
- 🔐 Autenticação OTP + JWT
- 💻 UI Web responsiva (mobile-first)
- 🏗️ Arquitetura escalável com DDD

---

## 🚀 Quick Start

### Backend (NestJS)

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com credenciais Twilio

# 3. Iniciar servidor
npm run start:dev

# ✅ Backend em: http://localhost:3000
```

### Frontend (Next.js)

```bash
# 1. Instalar dependências
cd apps/web
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local

# 3. Iniciar servidor
npm run dev

# ✅ Frontend em: http://localhost:3000
# ⚠️ Mudar porta no next dev ou configurar proxy
```

---

## 📁 Estrutura do Projeto

```
botFinancaSheet/
├── src/                          # Backend NestJS
│   ├── domain/                   # Lógica de negócio pura (DDD)
│   │   ├── entities/
│   │   ├── value-objects/        # PhoneNumber, Valor, etc
│   │   ├── repositories/         # Interfaces
│   │   └── specifications/       # Queries complexas
│   │
│   ├── application/              # Casos de uso (orquestração)
│   │   ├── use-cases/            # SolicitarOtp, ValidarOtpLogin, etc
│   │   ├── services/             # OtpService, JwtService, NotificationService
│   │   ├── dtos/                 # Input/Output Transfer Objects
│   │   └── mappers/              # Entity ↔ DTO
│   │
│   ├── infrastructure/           # Implementações técnicas
│   │   ├── api/                  # REST Controllers
│   │   ├── bots/                 # WhatsApp Bot (preservado)
│   │   ├── database/             # TypeORM Entities e Repositories
│   │   ├── guards/               # JwtAuthGuard
│   │   └── interceptors/
│   │
│   └── shared/                   # Compartilhado
│       └── errors/               # Exceções customizadas
│
├── apps/web/                     # Frontend Next.js 14
│   ├── src/
│   │   ├── app/                  # Páginas (App Router)
│   │   ├── components/           # Componentes React
│   │   ├── lib/
│   │   │   ├── hooks/            # useAuth, useGastos
│   │   │   ├── utils/            # formatters, validators
│   │   │   ├── store.ts          # Zustand auth/state
│   │   │   └── api.ts            # Axios com interceptadores
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   └── tailwind.config.ts
│
└── docs/
    ├── ARCHITECTURE.md           # Guia completo de arquitetura
    └── ...
```

---

## 🔐 Fluxo de Autenticação

### OTP + JWT (2FA)

```
1️⃣ Usuário solicita OTP
   POST /api/auth/solicitar-otp
   ├─ PhoneNumber validado (E.164)
   ├─ OtpService gera código 6 dígitos
   ├─ NotificationService envia via Twilio WhatsApp
   └─ ✅ Retorna: { mensagem: "OTP enviado" }

2️⃣ Usuário valida OTP
   POST /api/auth/validar-otp
   ├─ OtpService valida código (10 min expiry)
   ├─ Cria/encontra usuário
   ├─ JwtService gera tokens
   └─ ✅ Retorna: { accessToken, refreshToken, usuario }

3️⃣ Requisições autenticadas
   GET /api/gastos
   ├─ Header: Authorization: Bearer <token>
   ├─ JwtAuthGuard valida
   └─ ✅ Request.user carrega phoneNumber
```

**Segurança**:

- ✅ OTP: 6 dígitos, 10 minutos, uso único
- ✅ JWT: Expiração 1h (access), 7d (refresh)
- ✅ PhoneNumber: Validação E.164 rigorosa
- ✅ Sem quebra do bot: Endpoints `/api/` com JWT, webhooks sem autenticação

---

## 📝 Endpoints REST

### Autenticação (sem JWT)

```
POST   /api/auth/solicitar-otp    # Solicitar OTP
POST   /api/auth/validar-otp      # Validar e receber JWT
```

### Gastos (com JWT)

```
GET    /api/gastos                 # Listar (com filtros)
POST   /api/gastos                 # Criar
PATCH  /api/gastos/:id             # Editar
DELETE /api/gastos/:id             # Deletar
```

### Webhook (sem JWT)

```
POST   /webhook/whatsapp           # Recebe mensagens do bot
```

---

## 🛠️ Desenvolvimento

### Backend

**Adicionar nueva feature com DDD:**

```
1. Domain (src/domain/):
   - Criar Entity/ValueObject com lógica
   - Definir Repository Interface

2. Application (src/application/):
   - Criar DTOs (Input/Output)
   - Criar Use Case (@Injectable)
   - Criar Mapper (Entity ↔ DTO)

3. Infrastructure (src/infrastructure/):
   - Implementar Repository concreto
   - Criar Controller REST
```

Ver detalhes: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

### Frontend

**Componentes Mobile-First com Tailwind:**

```typescript
// Exemplo: 1 coluna mobile, 2 tablet, 3 desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Conteúdo responsivo */}
</div>
```

---

## 📦 Dependências Principais

### Backend

- `@nestjs/core` - Framework
- `@nestjs/jwt` - JWT signing/verification
- `typeorm` - ORM
- `twilio` - WhatsApp API
- `class-validator` - DTO validation

### Frontend

- `next` - React framework
- `zustand` - State management
- `@tanstack/react-query` - HTTP caching
- `axios` - HTTP client
- `tailwindcss` - Styling
- `lucide-react` - Icons

---

## 🧪 Testes

```bash
# Backend - Unitários (use-cases)
npm run test -- src/application/use-cases

# Backend - Integração
npm run test -- src/infrastructure

# Backend - Coverage
npm run test:cov

# Frontend - Setup (Vitest/Jest configurado)
cd apps/web
npm run test
```

---

## 🚢 Deploy

### Docker

```bash
docker-compose up
# Construir e rodar backend + PostgreSQL + nginx
# Backend: http://localhost:3000
# Frontend: http://localhost:80
```

### Environment Variables

**Backend (.env)**:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=bot_financa

JWT_SECRET=seu-secret-key

TWILIO_ACCOUNT_SID=seu_sid
TWILIO_AUTH_TOKEN=seu_token
TWILIO_WHATSAPP_NUMBER=+5521999999999

NODE_ENV=production
```

**Frontend (.env.local)**:

```env
NEXT_PUBLIC_API_URL=https://api.example.com
```

---

## 📚 Documentação

- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Arquitetura DDD/Clean detalhada
- **[src/README.md](./src/README.md)** - Guia Backend
- **[apps/web/README.md](./apps/web/README.md)** - Guia Frontend
- **[FUNCIONALIDADES.md](./FUNCIONALIDADES.md)** - Features do sistema

---

## 🤝 Bot WhatsApp

O bot continua funcionando normalmente em:

- **Webhook**: `POST /webhook/whatsapp`
- **Sem autenticação**: Bot usa signature validation do Twilio
- **Dados compartilhados**: Mesma base PostgreSQL
- **Sem conflitos**: Bot e API usam endpoints diferentes

**Fluxo bot intacto**:

```
Mensagem WhatsApp
  ↓
Twilio → POST /webhook/whatsapp
  ↓
WhatsAppBotService.handleWebhook()
  ↓
MessageParser.parse()
  ↓
Use Cases do bot (RegistrarGasto, etc)
  ↓
Database ✅
```

---

## 🔧 Scripts Disponíveis

### Backend

```bash
npm run start:dev          # Modo desenvolvimento
npm run start:debug        # Modo debug
npm run start:prod         # Produção
npm run build              # Build
npm run test               # Testes
npm run lint               # Lint + fix
npm run format             # Prettier
```

### Frontend

```bash
npm run dev                # Desenvolvimento
npm run build              # Build otimizado
npm run start              # Produção
npm run lint               # ESLint
```

---

## ⚠️ Boas Práticas

1. **Nunca** coloque lógica nos controllers
2. **Sempre** use DTOs para comunicação
3. **Valide** no domínio, não no controller
4. **Use** exceptions customizadas (`src/shared/errors/`)
5. **Injete** repositórios como interfaces
6. **Teste** use cases isolados
7. **Documente** com exemplos vivos

---

## 📞 Troubleshooting

### Backend não conecta ao banco

```bash
# Verificar PostgreSQL
psql -U postgres -h localhost -d bot_financa

# Sincronizar schema (apenas dev!)
# synchronize: true em typeorm config
```

### OTP não chega

```bash
- Verificar credenciais Twilio in .env
- Testar no console Twilio
- Verificar logs: npm run start:dev
```

### Frontend não conecta ao backend

```bash
- Verificar NEXT_PUBLIC_API_URL em .env.local
- Verificar CORS em main.ts
- Testar endpoint: curl http://localhost:3000/api/gastos
```

---

## 📄 Licença

MIT

---

**Última atualização**: Abril 2026  
**Versão**: 2.0.0 (DDD + Next.js) 5. Para obter seu **User ID**:

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
