# Guia de Uso - Arquitetura DDD + Clean Architecture

## 📋 Visão Geral

Este projeto implementa uma arquitetura robusta com **Domain-Driven Design (DDD)** e **Clean Architecture**, separando responsabilidades em camadas bem definidas.

### Camadas

#### 1. **Domain** (`src/domain/`)

Contém a lógica de negócio pura, independente de qualquer framework.

- **Entities**: Objetos com identidade (ex: Gasto, Usuario)
- **Value Objects**: Objetos sem identidade, imutáveis (ex: PhoneNumber, Valor)
- **Repositories** (Interfaces): Contratos de acesso a dados
- **Specifications**: Padrão para consultas complexas

#### 2. **Application** (`src/application/`)

Orquestra a lógica de negócio e expõe funcionalidades como casos de uso.

- **Use Cases**: Classes que implementam um caso de uso (ex: SolicitarOtpUseCase)
- **DTOs**: Data Transfer Objects (Input/Output)
- **Mappers**: Convertem entre Domain Entities e DTOs
- **Services de Aplicação**: Serviços orquestrados (OtpService, JwtService)

#### 3. **Infrastructure** (`src/infrastructure/`)

Implementações técnicas (banco de dados, APIs externas).

- **Data / Repositories**: Implementações concretas de repositórios
- **Database Entities**: Mapeamento TypeORM
- **APIs / Controllers**: Endpoints REST
- **Bots**: Integração com WhatsApp (preservado)
- **Guards / Interceptors**: Middleware NestJS

#### 4. **Shared** (`src/shared/`)

Utilitários, constantes e exceções compartilhadas.

### Fluxo de Requisição

```
HTTP Request
    ↓
Controller (@api/auth.controller.ts)
    ↓
Use Case (SolicitarOtpUseCase)
    ↓
Domain Entities + Value Objects
    ↓
Repository Interface
    ↓
Infrastructure Repository (TypeORM)
    ↓
Database
```

## 🔐 Autenticação OTP + JWT

### Fluxo

1. **Usuário solicita OTP**
   - POST `/api/auth/solicitar-otp` com `phoneNumber`
   - `SolicitarOtpUseCase` valida phoneNumber (PhoneNumber VO)
   - `OtpService` gera código de 6 dígitos
   - `NotificationService` envia via Twilio WhatsApp
   - ✅ Retorna: `{ mensagem: "OTP enviado para seu WhatsApp" }`

2. **Usuário valida OTP**
   - POST `/api/auth/validar-otp` com `phoneNumber` e `codigo`
   - `ValidarOtpLoginUseCase` valida código
   - Se válido: cria/encontra usuário, gera JWT
   - ✅ Retorna: `{ accessToken, refreshToken, usuario }`

3. **Requisições autenticadas**
   - Header: `Authorization: Bearer <accessToken>`
   - `JwtAuthGuard` valida token
   - Request.user contém payload (`phoneNumber`, `userId`)

### Segurança

- ✅ OTP expira em 10 minutos
- ✅ OTP é code única (um uso)
- ✅ PhoneNumber validado em E.164 format
- ✅ JWT com expiração 1 hora (accessToken)
- ✅ Refresh token com 7 dias

## 📦 Criando uma Nova Feature

### Exemplo: Novas Funcionalidades de Relatórios

#### 1. Domain (`src/domain/`)

```typescript
// entities/Relatorio.ts
export class Relatorio {
  private constructor(
    public readonly mes: string,
    public readonly totalGastos: number,
    public readonly porCategoria: Map<string, number>,
  ) {}

  static criar(mes: string, gastos: Gasto[]): Relatorio {
    const total = gastos.reduce((sum, g) => sum + g.valor, 0);
    const porCategoria = new Map();
    // ...
    return new Relatorio(mes, total, porCategoria);
  }
}
```

#### 2. Application (`src/application/`)

```typescript
// dtos/inputs/ObterRelatoriInput.ts
export class ObterRelatorioInput {
  phoneNumber: string;
  mes: string; // MM-YYYY
}

// dtos/outputs/RelatorioOutput.ts
export class RelatorioOutput {
  mes: string;
  totalGastos: number;
  porCategoria: Array<{ categoria: string; valor: number }>;
}

// use-cases/relatorios/ObterRelatorio.ts
@Injectable()
export class ObterRelatorioUseCase {
  constructor(
    @Inject('IGastoRepository')
    private gastoRepository: IGastoRepository,
  ) {}

  async execute(input: ObterRelatorioInput): Promise<RelatorioOutput> {
    const gastos = await this.gastoRepository.buscarPorMes(input.mes);
    const relatorio = Relatorio.criar(input.mes, gastos);
    return RelatorioMapper.toDTO(relatorio);
  }
}
```

#### 3. Infrastructure (`src/infrastructure/`)

```typescript
// api/relatorios.controller.ts
@Controller('api/relatorios')
@UseGuards(JwtAuthGuard)
export class RelatoriosController {
  constructor(private obterRelatorioUseCase: ObterRelatorioUseCase) {}

  @Get('/:mes')
  async obter(@Request() req, @Param('mes') mes: string) {
    return this.obterRelatorioUseCase.execute({
      phoneNumber: req.user.phoneNumber,
      mes,
    });
  }
}
```

## 🚀 Rollout: Backend + Frontend

### Phase 1: Backend Setup

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env
cp .env.example .env
# Editar com suas credenciais Twilio

# 3. Iniciar servidor
npm run start:dev
# http://localhost:3000 ✅

# 4. Testar autenticação
curl -X POST http://localhost:3000/api/auth/solicitar-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+5521999999999"}'
```

### Phase 2: Frontend Setup

```bash
# 1. Instalar dependências
cd apps/web
npm install

# 2. Configurar .env.local
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000

# 3. Iniciar dev server
npm run dev
# http://localhost:3000 (Frontend)
# http://localhost:3000 (Backend em porta diferente? Re-configurar!)

# 4. Testar fluxo OTP
# - Ir para http://localhost:3000/auth/login
# - Digitar telefone
# - Receber OTP no WhatsApp
# - Digitar código
# - ✅ Login bem-sucedido
```

### Phase 3: Integração

- ✅ Bot WhatsApp continua funcionando
- ✅ Dados aparecem na UI (não há conflito de dados)
- ✅ Requisições simultâneas: bot + UI

## 🧪 Testes

```bash
# Testes unitários (use-cases)
npm run test -- src/application/use-cases

# Testes de integração (controllers + repositories)
npm run test -- src/infrastructure

# Coverage
npm run test:cov
```

## 📚 Referências

- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/) -[Clean Architecture - Robert Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)

## ⚠️ Importante

- **Nunca** exponha lógica de negócio nos controllers
- **Sempre** use DTOs para comunicação externa
- **Sempre** valide no domínio (não no controller)
- **Use** exceptions do `shared/errors` para erros de negócio
- **Injete** repositórios como interfaces, não classes concretas

## 📞 Support

Dúvidas? Revise:

1. Fluxo arquitetural (veja acima)
2. Exemplos em cada camada
3. Testes unitários como documentação viva
