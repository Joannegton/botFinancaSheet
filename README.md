# 📊 Sistema de Registro de Gastos via Telegram

Sistema profissional para registro automático de gastos via Telegram Bot com salvamento em Google Sheets.

## 🎯 Funcionalidades

- ✅ Registro de gastos via mensagem direta ou menu interativo
- ✅ Salvamento automático no Google Sheets
- ✅ Autenticação por ID de usuário Telegram
- ✅ Suporte a múltiplas formas de pagamento (Cartão, Pix, Dinheiro)
- ✅ Categorização de gastos
- ✅ Relatórios diretamente no Telegram
- ✅ Dockerizado e pronto para produção

## 🏗️ Arquitetura

Este projeto segue **Clean Architecture** com as seguintes camadas:

```
src/
├── domain/                  # Regras de negócio puras
│   ├── entities/           # Entidades (Gasto)
│   ├── value-objects/      # Objetos de valor (Valor, FormaPagamento, TipoGasto)
│   └── repositories/       # Interfaces de repositórios
│
├── application/            # Casos de uso
│   ├── use-cases/         # RegistrarGasto
│   └── parsers/           # MessageParser
│
├── infrastructure/         # Implementações técnicas
│   ├── sheets/            # GoogleSheetsRepository
│   └── bots/              # TelegramBotService
│
└── main.ts                # Entry point
```

## 🛠️ Stack Tecnológica

- **Node.js 20** (LTS)
- **TypeScript 5.3**
- **NestJS 10** - Framework backend
- **Telegraf 4.16** - Bot do Telegram
- **Google Sheets API** - Armazenamento de dados
- **Docker** - Containerização

## 📋 Pré-requisitos

### 1. Criar Bot no Telegram

1. Abra o Telegram e procure por `@BotFather`
2. Envie `/newbot`
3. Escolha um nome e username para seu bot
4. Copie o **token** fornecido
5. Para obter seu **User ID**:
   - Procure por `@userinfobot`
   - Envie `/start`
   - Copie o **Id** mostrado

### 2. Configurar Google Sheets

#### 2.1. Criar Service Account

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** → **Credentials**
4. Clique em **Create Credentials** → **Service Account**
5. Preencha os dados e clique em **Create**
6. Clique na service account criada
7. Vá em **Keys** → **Add Key** → **Create new key**
8. Escolha **JSON** e faça o download

#### 2.2. Ativar Google Sheets API

1. No Google Cloud Console, vá em **APIs & Services** → **Library**
2. Procure por "Google Sheets API"
3. Clique em **Enable**

#### 2.3. Criar e Compartilhar Planilha

1. Crie uma nova planilha no [Google Sheets](https://sheets.google.com)
2. Copie o **ID da planilha** da URL:
   ```
   https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit
   ```
3. Clique em **Compartilhar**
4. Cole o email da service account (está no JSON baixado)
5. Dê permissão de **Editor**

## 🚀 Instalação

### Opção 1: Docker (Recomendado)

```bash
# Clone o repositório
cd nestJs

# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas credenciais
nano .env

# Inicie com Docker Compose
docker-compose up -d

# Veja os logs
docker-compose logs -f
```

### Opção 2: Instalação Local

```bash
# Clone o repositório
cd nestJs

# Instale as dependências
npm install

# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas credenciais
nano .env

# Execute em desenvolvimento
npm run start:dev

# Ou compile e execute em produção
npm run build
npm run start:prod
```

## ⚙️ Configuração (.env)

Edite o arquivo `.env` com suas credenciais:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_USER_ID=123456789
TELEGRAM_WEBHOOK_SECRET=seu_secret_aleatorio_aqui

# Google Sheets Configuration
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
GOOGLE_SHEETS_SHEET_NAME=Gastos

# Application
NODE_ENV=production
PORT=3000
```

### Configuração de Credenciais do Google

O arquivo `credentials.json` é necessário para autenticar com o Google Sheets:

1. **Baixe as credenciais** no [Google Cloud Console](https://console.cloud.google.com/)
2. **Copie o conteúdo** do arquivo JSON para `credentials.json` na raiz do projeto
3. **Não faça commit** desse arquivo (está no `.gitignore`)

Veja [SETUP_GOOGLE_SHEETS.md](./SETUP_GOOGLE_SHEETS.md) para instruções detalhadas.

### Como obter a Private Key do JSON:

Abra o arquivo JSON baixado da service account e procure por `private_key`.
Copie o valor incluindo as aspas e quebras de linha (`\n`).

## 📱 Como Usar

### Mensagem Direta

Envie uma mensagem no formato:

```
[forma] - [valor] - [tipo] - [observação]
```

**Exemplos:**

```
cartao - 35 - comida - almoço no centro
pix - 50.50 - transporte - uber
dinheiro - 20 - lazer
cartao - final 1234 - 150 - saude - consulta médica
```

### Menu Interativo

1. Digite `/menu`
2. Escolha a forma de pagamento
3. Digite o valor
4. Escolha o tipo de gasto
5. Digite uma observação (ou pule)

### Comandos Disponíveis

- `/start` - Iniciar o bot
- `/menu` - Abrir menu interativo
- `/ajuda` - Ver instruções de uso
- `/relatorio` - Ver resumo dos gastos
- `/cancelar` - Cancelar operação em andamento

### Formas de Pagamento

- `cartao` ou `cartão`
- `pix`
- `dinheiro`

### Tipos de Gasto

- `comida`
- `transporte`
- `lazer`
- `saude` ou `saúde`
- `educacao` ou `educação`
- `moradia`
- `vestuario` ou `vestuário`
- `outros`

## 📊 Formato da Planilha

A planilha será criada automaticamente com as seguintes colunas:

| Data/Hora            | Forma Pagamento | Tipo   | Valor | Observação       |
| -------------------- | --------------- | ------ | ----- | ---------------- |
| 13/02/2026, 14:30:45 | cartao          | comida | 35.00 | almoço no centro |

## 🔒 Segurança

- ✅ Autenticação por User ID do Telegram
- ✅ Variáveis sensíveis em `.env`
- ✅ Service Account do Google com permissões mínimas
- ✅ Container rodando com usuário não-root
- ✅ Logs estruturados

### Recomendações Adicionais

1. **Firewall**: Configure para aceitar apenas IPs do Telegram
2. **HTTPS**: Use ngrok ou um domínio próprio com certificado SSL
3. **Backups**: Configure backups automáticos da planilha
4. **Monitoramento**: Use ferramentas como PM2 ou Docker healthcheck

## 🐳 Docker

### Comandos Úteis

```bash
# Iniciar
docker-compose up -d

# Parar
docker-compose down

# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Rebuild
docker-compose up -d --build

# Ver status
docker-compose ps
```

## 📈 Monitoramento

### Logs

Os logs são salvos automaticamente e incluem:

- Inicialização do bot
- Gastos registrados
- Erros e avisos
- Tentativas de acesso não autorizado

```bash
# Ver logs em tempo real
docker-compose logs -f app

# Últimas 100 linhas
docker-compose logs --tail=100 app
```

## 🧪 Testes

```bash
# Rodar todos os testes
npm test

# Testes com coverage
npm run test:cov

# Testes em watch mode
npm run test:watch
```

## 🔧 Desenvolvimento

```bash
# Modo desenvolvimento com hot reload
npm run start:dev

# Build
npm run build

# Lint
npm run lint

# Format
npm run format
```

## 📝 Scripts NPM

- `npm start` - Inicia a aplicação
- `npm run start:dev` - Modo desenvolvimento com watch
- `npm run start:prod` - Produção
- `npm run build` - Compilar TypeScript
- `npm run lint` - Verificar código
- `npm run format` - Formatar código
- `npm test` - Executar testes

## 🚨 Troubleshooting

### Bot não responde

1. Verifique se o token está correto
2. Confirme se o User ID está correto
3. Veja os logs: `docker-compose logs -f`

### Erro ao salvar no Google Sheets

1. Verifique se a API está ativada
2. Confirme que a service account tem permissão de Editor
3. Verifique se o ID da planilha está correto
4. Confirme que a Private Key está correta (com `\n`)

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs app

# Verificar variáveis de ambiente
docker-compose config
```

## 📦 Estrutura de Arquivos

```
nestJs/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── Gasto.ts
│   │   ├── value-objects/
│   │   │   ├── FormaPagamento.ts
│   │   │   ├── TipoGasto.ts
│   │   │   └── Valor.ts
│   │   └── repositories/
│   │       └── IGastoRepository.ts
│   │
│   ├── application/
│   │   ├── use-cases/
│   │   │   └── RegistrarGasto.ts
│   │   ├── parsers/
│   │   │   └── MessageParser.ts
│   │   └── application.module.ts
│   │
│   ├── infrastructure/
│   │   ├── sheets/
│   │   │   └── GoogleSheetsRepository.ts
│   │   ├── bots/
│   │   │   └── TelegramBotService.ts
│   │   └── infrastructure.module.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
```

## 💰 Custos Estimados

- **Telegram Bot**: Gratuito
- **Google Sheets**: Gratuito (até 10 milhões de células)
- **Servidor**:
  - PC Local: R$ 0 (Docker)
  - VPS: R$ 30-60/mês (Contabo, Digital Ocean, etc.)

## 🤝 Contribuindo

Este é um projeto pessoal, mas contribuições são bem-vindas:

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

MIT License - sinta-se livre para usar este projeto.

## 📞 Suporte

Se tiver problemas:

1. Verifique a seção **Troubleshooting**
2. Veja os logs
3. Abra uma issue no GitHub

---

**Desenvolvido com ❤️ usando NestJS e TypeScript**

🚀 **Bom controle financeiro!**
