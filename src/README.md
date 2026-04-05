# Backend - Bot Finanças

Servidor NestJS com autenticação JWT/OTP, suporte a WhatsApp Bot e API REST.

## Instalação

```bash
npm install
```

## Variáveis de Ambiente

Crie um arquivo `.env` baseado em `.env.example`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=bot_financa

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+55XX999999999

# Node Environment
NODE_ENV=development
```

## Desenvolvimento

```bash
npm run start:dev
```

Servidor inicia em `http://localhost:3000`

## Estrutura com DDD

```
src/
├── domain/               - Lógica de negócio pura
│   ├── entities/
│   ├── value-objects/    - PhoneNumber, Valor, etc
│   ├── repositories/     - Interfaces
│   └── specifications/   - Queries complexas
├── application/          - Casos de uso
│   ├── use-cases/
│   ├── dtos/             - Transfer Objects
│   ├── mappers/
│   └── services/         - OtpService, JwtService, NotificationService
├── infrastructure/       - Implementação técnica
│   ├── api/              - REST Controllers
│   ├── bots/             - WhatsApp Bot (preservado)
│   ├── database/         - TypeORM Entities e Repositories
│   ├── guards/           - JwtAuthGuard
│   └── interceptors/
└── shared/               - Utilitários compartilhados
    └── errors/           - Exceções customizadas
```

## Endpoints

### Autenticação (sem JWT requerido)

- `POST /api/auth/solicitar-otp` - Solicitar código OTP
- `POST /api/auth/validar-otp` - Validar código e receber JWT

### Gastos (JWT requerido)

- `GET /api/gastos` - Listar gastos (com filtros)
- `POST /api/gastos` - Criar gasto
- `PATCH /api/gastos/:id` - Editar gasto
- `DELETE /api/gastos/:id` - Deletar gasto

### Webhook (sem autenticação)

- `POST /webhook/whatsapp` - Recebe mensagens do bot

## Padrões

- **DDD**: Domain-Driven Design para lógica de negócio isolada
- **Clean Architecture**: Camadas bem definidas e independentes
- **DTOs**: Separação entre Input/Output
- **Value Objects**: Validação de dados em objetos de valor
- **Repository Pattern**: Abstração de acesso a dados
- **Use Cases**: Casos de uso como classes injetáveis
- **Dependency Injection**: NestJS @Injectable

## Testing

```bash
npm run test
npm run test:watch
npm run test:cov
```

## Build & Deploy

```bash
npm run build
npm run start:prod
```

Com Docker:

```bash
docker-compose up
```
