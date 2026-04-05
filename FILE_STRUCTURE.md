# 📁 Estrutura de Arquivos - Finanças Bot

Visão completa de todos os arquivos do projeto com descrições.

---

## 🌳 Estrutura Raiz

```
botFinancaSheet/
│
├── 📄 Documentação Principal
│   ├── GETTING_STARTED.md                      ← 👈 COMECE AQUI!
│   ├── QUICK_START_DOCKER.md                   ← Como rodar Docker
│   ├── DEPLOYMENT_GUIDE.md                     ← Como fazer deploy
│   ├── DEPLOYMENT_CHECKLIST.md                 ← Checklist final
│   ├── IMPLEMENTATION_SUMMARY_DEPLOYMENT.md    ← O que foi feito
│   ├── COMMAND_REFERENCE.md                    ← Cheat sheet de comandos
│   ├── FILE_STRUCTURE.md                       ← Este arquivo
│   └── README.md                               ← Overview geral
│
├── 🐳 Infraestrutura & Deployment
│   ├── docker-compose.yml                      ← Orquestração Docker (PostgreSQL + Backend + Frontend + Nginx)
│   ├── Dockerfile                              ← Build image Backend (NestJS)
│   ├── .env.example                            ← Template de variáveis
│   ├── .env.prod                               ← Template produção
│   ├── .env                                    ← Variáveis reais (não versionar!)
│   │
│   ├── 🔧 nginx/
│   │   ├── nginx.conf                          ← Configuração reverse proxy
│   │   └── ssl/                                ← Certificados SSL (git ignored)
│   │
│   ├── 📜 Deploy Scripts
│   │   ├── deploy.sh                           ← Script deploy Linux/Mac
│   │   ├── deploy.bat                          ← Script deploy Windows
│   │   └── generate-ssl.sh                     ← Gera certificado SSL
│   │
│   └── CI/CD
│       └── .github/
│           └── workflows/
│               └── ci-cd.yml                   ← GitHub Actions pipeline
│
├── 🏢 Backend (NestJS + TypeScript)
│   ├── package.json                            ← Dependências backend
│   ├── tsconfig.json                           ← TypeScript config
│   ├── nest-cli.json                           ← NestJS config
│   │
│   └── src/
│       ├── main.ts                             ← Entrada da aplicação
│       ├── app.module.ts                       ← Módulo raiz
│       │
│       ├── 📦 domain/                          ← DDD - Lógica de negócio pura
│       │   ├── entities/
│       │   │   └── Gasto.ts                    ← Entidade de gastos
│       │   ├── repositories/
│       │   │   ├── IGastoRepository.ts         ← Interface repositório
│       │   │   ├── IUsuarioRepository.ts
│       │   │   ├── ICategoriasRepository.ts
│       │   │   ├── IFormasPagamentoRepository.ts
│       │   │   └── IConfigRepository.ts
│       │   └── value-objects/
│       │       ├── PhoneNumber.ts              ← VO com validação E.164
│       │       ├── FormaPagamento.ts
│       │       ├── TipoGasto.ts
│       │       └── Valor.ts
│       │
│       ├── 📋 application/                     ← DDD - Orquestração de use cases
│       │   ├── services/
│       │   │   ├── OtpService.ts               ← Gera/valida códigos OTP
│       │   │   ├── JwtService.ts               ← Tokens JWT
│       │   │   ├── NotificationService.ts      ← Twilio WhatsApp
│       │   │   └── SchedulerService.ts
│       │   ├── use-cases/
│       │   │   ├── RegistrarUsuario.ts
│       │   │   ├── RegistrarGasto.ts
│       │   │   ├── GerenciarCategorias.ts
│       │   │   ├── GerenciarFormasPagamento.ts
│       │   │   └── GerenciarConfig.ts
│       │   ├── dtos/
│       │   │   ├── inputs/                    ← DTO for request
│       │   │   └── outputs/                   ← DTO for response
│       │   ├── mappers/
│       │   ├── parsers/
│       │   │   └── MessageParser.ts            ← Parse mensagens WhatsApp
│       │   └── exceptions/
│       │
│       ├── 🔌 infrastructure/                  ← DDD - Framework & APIs
│       │   ├── api/
│       │   │   ├── auth.controller.ts          ← POST /api/auth/solicitar-otp, /validar-otp
│       │   │   ├── gastos.controller.ts        ← GET/POST /api/gastos (+ PATCH/DELETE)
│       │   │   ├── categorias.controller.ts    ← GET /api/categorias (+ POST)
│       │   │   └── relatorios.controller.ts    ← GET /api/relatorios/resumo
│       │   ├── bots/
│       │   │   ├── WhatsAppBotService.ts       ← Lógica bot WhatsApp
│       │   │   └── WhatsAppWebhookController.ts ← Webhook /webhook/whatsapp
│       │   ├── guards/
│       │   │   └── JwtAuthGuard.ts             ← @UseGuards(JwtAuthGuard)
│       │   ├── database/
│       │   │   ├── entities/                   ← TypeORM entities
│       │   │   │   ├── UsuarioEntity.ts
│       │   │   │   ├── GastoEntity.ts
│       │   │   │   ├── CategoriaEntity.ts
│       │   │   │   ├── FormaPagamentoEntity.ts
│       │   │   │   ├── ConfigEntity.ts
│       │   │   │   └── OtpEntity.ts
│       │   │   └── repositories/               ← Implementações dos repos
│       │   │       ├── UsuarioRepository.ts
│       │   │       ├── GastoRepository.ts
│       │   │       ├── CategoriasRepository.ts
│       │   │       ├── FormasPagamentoRepository.ts
│       │   │       ├── ConfigRepository.ts
│       │   │       └── OtpRepository.ts
│       │   └── evolution-api/
│       │       └── docker-compose.yml          ← Evolution API para bot
│       │
│       ├── 🎯 shared/                          ← Código compartilhado
│       │   └── errors/
│       │       ├── DomainError.ts              ← Base para exceções
│       │       ├── ValidationError.ts
│       │       ├── OtpInvalidoError.ts
│       │       ├── UsuarioNaoEncontradoError.ts
│       │       └── ... (outras exceções)
│       │
│       └── 🏥 HealthController.ts              ← GET /health
│
├── 🎨 Frontend (Next.js + React)
│   └── apps/web/
│       ├── Dockerfile                          ← Build image Frontend
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       ├── .env.local                          ← Variáveis locais (desenvolvimento)
│       │
│       ├── public/
│       │   └── ...                             ← Assets estáticos
│       │
│       └── src/
│           ├── app/                            ← Next.js 14 App Router
│           │   ├── layout.tsx                  ← Root layout
│           │   ├── page.tsx                    ← Dashboard (GET /)
│           │   ├── auth/
│           │   │   └── login/
│           │   │       └── page.tsx            ← Login OTP 2-telas
│           │   ├── gastos/
│           │   │   └── page.tsx                ← CRUD gastos (form modal + table/cards)
│           │   ├── categorias/
│           │   │   └── page.tsx                ← Lista categorias
│           │   ├── relatorios/
│           │   │   └── page.tsx                ← Gráficos placeholder
│           │   └── config/
│           │       └── page.tsx                ← Configurações
│           │
│           ├── components/
│           │   ├── Layout/
│           │   │   └── Navbar.tsx              ← Header responsivo
│           │   ├── Auth/
│           │   │   ├── PhoneInput.tsx          ← Tela 1: Insira telefone
│           │   │   ├── OtpInput.tsx            ← Tela 2: Insira código
│           │   │   └── ProtectedRoute.tsx      ← Route guard (requere login)
│           │   └── ... (outros componentes)
│           │
│           └── lib/
│               ├── store.ts                    ← Zustand: auth + persist
│               ├── api.ts                      ← Axios client + interceptadores
│               ├── types.ts                    ← Interfaces TypeScript
│               ├── hooks/                      ← Custom React hooks
│               │   ├── useAuth.ts              ← useSolicitarOtp, useValidarOtp
│               │   └── useGastos.ts            ← useGastos, useCreateGasto, etc
│               └── utils/
│                   ├── formatters.ts           ← formatCurrency, formatDate
│                   └── ... (outros utilitários)
│
├── 📚 Documentação & Guides
│   └── docs/
│       ├── ARCHITECTURE.md                     ← Padrões DDD + exemplos
│       ├── TROUBLESHOOTING.md                  ← Resolução de problemas
│       ├── API.md                              ← Documentação API REST
│       └── SECURITY.md                         ← Checklist de segurança
│
├── 📊 Configuração & Logs
│   ├── logs/                                   ← Pasta de logs (git ignored)
│   ├── .gitignore
│   ├── .env.example
│   └── package-lock.json
│
└── 🎬 Scripts & Build
    ├── nest-cli.json
    ├── setup.sh
    ├── setup.bat
    └── docker-entrypoint.sh
```

---

## 📋 Descrição de Arquivos Por Categoria

### 🚀 **PARA COMEÇAR** (leia nesta ordem)

1. [GETTING_STARTED.md](GETTING_STARTED.md) - Orientação geral
2. [QUICK_START_DOCKER.md](QUICK_START_DOCKER.md) - Como rodar Docker
3. [COMMAND_REFERENCE.md](COMMAND_REFERENCE.md) - Cheat sheet de comandos

### 📘 **DOCUMENTAÇÃO TÉCNICA**

1. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deploy completo
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Padrões DDD
3. [README.md](README.md) - Overview do projeto

### 🐳 **INFRAESTRUTURA**

| Arquivo               | Propósito                                                       |
| --------------------- | --------------------------------------------------------------- |
| `docker-compose.yml`  | Orquestração de containers (Postgres, Backend, Frontend, Nginx) |
| `Dockerfile`          | Build image para Backend (NestJS)                               |
| `apps/web/Dockerfile` | Build image para Frontend (Next.js)                             |
| `nginx/nginx.conf`    | Configuração de reverse proxy e SSL                             |
| `.env`                | Variáveis de ambiente (não versionar)                           |
| `.env.example`        | Template para `.env`                                            |
| `.env.prod`           | Template para produção                                          |

### 📜 **SCRIPTS & DEPLOYMENT**

| Arquivo                | Função                             |
| ---------------------- | ---------------------------------- |
| `deploy.sh`            | Automação deployment Linux/Mac     |
| `deploy.bat`           | Automação deployment Windows       |
| `generate-ssl.sh`      | Gera certificado SSL autoassinado  |
| `docker-entrypoint.sh` | Entry point para container Backend |

### 🤖 **CI/CD**

| Arquivo                       | Função                                        |
| ----------------------------- | --------------------------------------------- |
| `.github/workflows/ci-cd.yml` | GitHub Actions: test → build → deploy staging |

### 📦 **BACKEND (NestJS)**

| Camada             | Arquivos              | Responsabilidade                                     |
| ------------------ | --------------------- | ---------------------------------------------------- |
| **Domain**         | `src/domain/`         | Entidades, value objects, interfaces de repositórios |
| **Application**    | `src/application/`    | Use cases, DTOs, services, mappers                   |
| **Infrastructure** | `src/infrastructure/` | Controllers, guards, database, bots, webhooks        |
| **Shared**         | `src/shared/`         | Exceções compartilhadas                              |

### 🎨 **FRONTEND (Next.js)**

| Componente     | Arquivos                    | Responsabilidade                                      |
| -------------- | --------------------------- | ----------------------------------------------------- |
| **Pages**      | `apps/web/src/app/`         | Login, Dashboard, CRUD Gastos, Categorias, Relatórios |
| **Components** | `apps/web/src/components/`  | Navbar, PhoneInput, OtpInput, ProtectedRoute          |
| **Hooks**      | `apps/web/src/lib/hooks/`   | useAuth, useGastos (TanStack Query)                   |
| **Store**      | `apps/web/src/lib/store.ts` | Zustand com persist localStorage                      |
| **API**        | `apps/web/src/lib/api.ts`   | Axios com interceptadores JWT                         |

---

## 🔗 Relacionamentos de Arquivos

### Flow: Frontend → Backend → Database

```
Frontend (Next.js)
├── pages (app/)
│   ├── auth/login → useAuth hook → POST /api/auth/solicitar-otp
│   └── gastos → useGastos hook → GET /api/gastos
│
└── lib/
    ├── store.ts (Zustand) → localStorage
    └── api.ts (Axios) → Backend API
                    ↓
Backend (NestJS)
├── controllers
│   ├── auth.controller → POST /auth/solicitar-otp
│   └── gastos.controller → GET /gastos
│
├── application → use-cases
│   ├── SolicitarOtp → OtpService, NotificationService
│   └── RegistrarGasto → GastoRepository
│
└── infrastructure → database
    ├── entities (TypeORM)
    └── repositories → PostgreSQL
```

### DDD Architecture Layers

```
Domain (Pura, sem framework)
│   ├── entities/Gasto.ts
│   ├── repositories/IGastoRepository.ts (interface)
│   └── value-objects/PhoneNumber.ts
       ↓
Application (Orquestração)
│   ├── services/OtpService.ts
│   ├── use-cases/RegistrarGasto.ts
│   └── dtos/CriarGastoInput.ts
       ↓
Infrastructure (Framework-specific)
    ├── api/gastos.controller.ts (@UseGuards, @Post)
    ├── database/entities/GastoEntity.ts (TypeORM)
    └── database/repositories/GastoRepository.ts (implementação)
```

---

## 📊 Estatísticas do Projeto

| Item                         | Quantidade                             |
| ---------------------------- | -------------------------------------- |
| Arquivos TypeScript Backend  | ~25                                    |
| Arquivos TypeScript Frontend | ~20                                    |
| Diretórios                   | ~15                                    |
| Arquivos de Configuração     | ~8                                     |
| Documentação Markdown        | ~7                                     |
| Linhas de Código Backend     | ~2000                                  |
| Linhas de Código Frontend    | ~1500                                  |
| Linhas de Documentação       | ~5000+                                 |
| Docker Compose Services      | 4 (Postgres, Backend, Frontend, Nginx) |

---

## 🎯 Arquivos Críticos

### Não remover ou alterar sem cuidado:

1. **`docker-compose.yml`** - Orquestra toda a stack
2. **`src/main.ts`** - Entrada da aplicação Backend
3. **`apps/web/src/app/layout.tsx`** - Root layout Frontend
4. **`nginx/nginx.conf`** - Reverse proxy config
5. **`.env.example`** - Template de variáveis

### GitIgnore (não versionar):

```
.env           # Variáveis reais com secrets
node_modules/  # Dependências
dist/          # Build output
.next/         # Next.js build
coverage/      # Testes coverage
logs/          # Arquivos de log
nginx/ssl/     # Certificados (git ignored)
```

---

## 🔍 Como Encontrar Algo

### "Quero mudar o fluxo de login"

→ Arquivos: `apps/web/src/app/auth/login/page.tsx`, `src/infrastructure/api/auth.controller.ts`

### "Quero adicionar um novo endpoint"

→ Criar arquivo em `src/infrastructure/api/novo.controller.ts`, registrar em `src/app.module.ts`

### "Quero mudar o banco de dados"

→ Alterar `src/infrastructure/database/entities/`, `src/domain/repositories/`

### "Quero customizar o email/SMS"

→ Editar `src/application/services/NotificationService.ts`

### "Quero mudar o style da aplicação"

→ Editar `apps/web/src/components/`, `tailwind.config.js`

### "Quero fazer deploy"

→ Usar `./deploy.sh` ou ler [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## 📂 Estrutura de Diretórios Vazia vs Preenchida

```
Antes da Sessão (Message 4):
src/
├── app.module.ts
├── main.ts
├── domain/ (basics)
├── application/ (auth only)
└── infrastructure/ (auth controller)

Depois da Sessão (Message 5):
src/
├── app.module.ts (atualizado)
├── main.ts
├── domain/ (entities, VOs, repos)
├── application/ (use-cases, DTOs, services)
├── infrastructure/ (3 controllers novos + database)
└── shared/ (error handling)
```

---

## 💾 Tamanho Aproximado

```
Backend:
  src/             ~200 KB (código TypeScript)
  node_modules/    ~300 MB (dependências)
  dist/            ~50 MB (build output)

Frontend:
  apps/web/src/    ~100 KB (código React)
  apps/web/.next/  ~30 MB (build output)
  node_modules/    ~400 MB (dependências)

Database:
  Postgres:        ~50 MB (dados)
  Backups:         ~10 MB (por backup)

Docker Images:
  Backend image:   ~500 MB
  Frontend image:  ~200 MB
  Nginx image:     ~20 MB (official)
  Postgres image:  ~70 MB (official)

Total com dependências: ~1.2 GB (durante desenvolvimento)
Total production (images): ~700 MB
```

---

## 🚀 Como Navegar o Codebase

### Para Iniciantes

1. Leia: [GETTING_STARTED.md](GETTING_STARTED.md)
2. Rode: `./deploy.sh dev`
3. Explore: `src/main.ts` → `src/app.module.ts` → controllers
4. Veja: `apps/web/src/app/page.tsx` → components

### Para Desenvolvedores

1. Entenda: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
2. Veja ejemplos: `src/application/use-cases/` → `src/infrastructure/api/`
3. Adicione feature: Crie novo use-case + controller + página React
4. Teste: `npm test`, testes E2E

### Para DevOps

1. Leia: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. Use: `deploy.sh` scripts
3. Monitore: `docker-compose logs -f`
4. Configure: `.env`, `nginx.conf`, `docker-compose.yml`

---

**Última atualização**: 2024  
**Versão**: 1.0.0  
**Status**: ✅ Estrutura Completa
