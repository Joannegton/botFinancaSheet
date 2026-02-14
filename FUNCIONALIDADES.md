# 📱 Funcionalidades do Sistema de Registro de Gastos

> Sistema profissional de controle financeiro via Telegram Bot com integração ao Google Sheets

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Registro de Gastos](#-registro-de-gastos)
3. [Gerenciamento de Categorias](#-gerenciamento-de-categorias)
4. [Gerenciamento de Formas de Pagamento](#-gerenciamento-de-formas-de-pagamento)
5. [Relatórios e Consultas](#-relatórios-e-consultas)
6. [Configurações do Sistema](#%EF%B8%8F-configurações-do-sistema)
7. [Resumos Automáticos](#-resumos-automáticos)
8. [Comandos Disponíveis](#-comandos-disponíveis)
9. [Segurança e Autenticação](#-segurança-e-autenticação)

---

## 🎯 Visão Geral

O sistema oferece uma solução completa para registro e controle de gastos pessoais através do Telegram, com armazenamento automático no Google Sheets.

### Principais Características

- ✅ **Registro Rápido**: Duas formas de registrar gastos (mensagem direta ou menu interativo)
- ✅ **Categorização Flexível**: Categorias e formas de pagamento personalizáveis
- ✅ **Relatórios Inteligentes**: Relatórios automáticos baseados em período configurável
- ✅ **Resumos Diários**: Notificações automáticas todos os dias
- ✅ **Persistência Segura**: Todos os dados salvos no Google Sheets
- ✅ **Autenticação Robusta**: Controle de acesso por User ID do Telegram

---

## 💰 Registro de Gastos

### 1. Mensagem Direta (Formato Rápido)

Registre gastos enviando uma mensagem no formato simples:

```
[forma_pagamento], [valor], [tipo], [observação]
```

#### Exemplos Práticos:

```
cartão nubank, 35, moradia, almoço no centro
pix, 50.50, vestuario, uber
dinheiro, 20, outros
cartão nubank, 150, moradia, consulta médica
```

#### Características:

- **Separador**: Vírgula (`,`)
- **Valor**: Aceita decimais com ponto (`.`) ou vírgula (`,`)
- **Observação**: Opcional, pode conter múltiplas vírgulas
- **Validação**: Automática de forma de pagamento e categoria
- **Resposta**: Confirmação instantânea com resumo do gasto

#### Resposta do Sistema:

```
✅ Gasto registrado!

💳 cartão nubank
💰 R$ 35.00
📝 moradia
📋 almoço no centro
```

### 2. Fluxo Interativo (Modo Guiado)

Comando: `/criar`

O bot guia você através de um processo passo a passo:

#### Passo 1: Escolha da Forma de Pagamento

```
💳 Escolha a forma de pagamento:

cartão nubank, pix, dinheiro

[Teclado personalizado aparece com botões]
```

#### Passo 2: Inserção do Valor

```
💰 Digite o valor gasto:

Exemplos: 50 ou 50.50
```

#### Passo 3: Seleção do Tipo de Gasto

```
🏷️ Escolha o tipo de gasto:

moradia, vestuario, outros

[Teclado personalizado aparece com botões]
```

#### Passo 4: Observação (Opcional)

```
📋 Digite uma observação (ou envie '0' para pular):
```

#### Passo 5: Confirmação

```
✅ Gasto registrado!

💳 pix
💰 R$ 50.00
📝 vestuario
📋 compra online
```

#### Características do Fluxo Interativo:

- **Teclado Customizado**: Botões para seleção rápida
- **Validação em Tempo Real**: Cada entrada é validada imediatamente
- **Cancelamento**: Use `/cancelar` a qualquer momento
- **Segurança**: Remove teclado automaticamente ao finalizar
- **User-Friendly**: Ideal para iniciantes

### Validações Aplicadas

1. **Forma de Pagamento**: Deve existir na lista configurada
2. **Valor**: Deve ser numérico positivo
3. **Tipo**: Deve existir na lista de categorias
4. **Observação**: Máximo de 500 caracteres

---

## 📂 Gerenciamento de Categorias

Sistema completo para gerenciar suas categorias de gastos.

### Listar Categorias

**Comando**: `/categorias`

```
📂 Categorias disponíveis:

1. moradia
2. vestuario
3. outros

Use /addcategoria [nome] - para adicionar uma nova.
Use /delcategoria [número] - para remover uma categoria.
```

### Adicionar Categoria

**Comando**: `/addcategoria [nome]`

#### Exemplos:

```
/addcategoria saúde
/addcategoria educação
/addcategoria transporte
```

#### Validações:

- ✅ Máximo 20 caracteres
- ✅ Apenas letras e espaços (com acentuação)
- ✅ Não pode estar vazia
- ✅ Não pode ser duplicada
- ✅ Convertida para lowercase automaticamente

#### Resposta de Sucesso:

```
✅ Categoria "saúde" adicionada com sucesso!
```

### Remover Categoria

**Comando**: `/delcategoria [número]`

#### Exemplos:

```
/delcategoria 2
```

#### Processo:

1. Lista todas as categorias com números
2. Remove a categoria do índice especificado
3. Atualiza o Google Sheets
4. Confirma a remoção

#### Resposta:

```
✅ Categoria "vestuario" removida com sucesso!
```

### Categorias Padrão

Ao inicializar pela primeira vez, o sistema cria automaticamente:

- `moradia`
- `vestuario`
- `outros`

---

## 💳 Gerenciamento de Formas de Pagamento

Gerencie suas formas de pagamento personalizadas.

### Listar Formas de Pagamento

**Comando**: `/formas`

```
💳 Formas de pagamento disponíveis:

1. cartão nubank
2. pix
3. dinheiro

Use /addforma [nome] - para adicionar uma nova.
Use /delforma [número] - para remover uma forma de pagamento.
```

### Adicionar Forma de Pagamento

**Comando**: `/addforma [nome]`

#### Exemplos:

```
/addforma cartão inter
/addforma débito
/addforma vale refeição
```

#### Validações:

- ✅ Máximo 20 caracteres
- ✅ Apenas letras e espaços (com acentuação)
- ✅ Não pode estar vazia
- ✅ Não pode ser duplicada
- ✅ Convertida para lowercase automaticamente

#### Resposta:

```
✅ Forma de pagamento "cartão inter" adicionada com sucesso!
```

### Remover Forma de Pagamento

**Comando**: `/delforma [número]`

#### Exemplo:

```
/delforma 3
```

#### Resposta:

```
✅ Forma de pagamento "dinheiro" removida com sucesso!
```

### Formas de Pagamento Padrão

Ao inicializar, o sistema cria:

- `cartão nubank`
- `pix`
- `dinheiro`

---

## 📊 Relatórios e Consultas

### Relatório Completo

**Comando**: `/relatorio`

Gera um relatório detalhado dos seus gastos baseado no período configurado.

#### Relatório com Dia Configurado:

```
📊 Relatório de Gastos

💰 Total geral: R$ 1.250.00
📝 Total de registros: 45
📅 Período: 15/01 até 15/02

Últimos 10 gastos:

1. R$ 35.00 - moradia (cartão nubank)
   📋 almoço no centro
2. R$ 50.00 - vestuario (pix)
3. R$ 150.00 - moradia (cartão nubank)
   📋 consulta médica
...
```

#### Relatório sem Dia Configurado (últimos 30 dias):

```
📊 Relatório de Gastos

💰 Total geral: R$ 850.00
📝 Total de registros: 28
📅 Período: últimos 30 dias (15/01/2026 até 14/02/2026)

Últimos 10 gastos:
...
```

### Funcionalidades do Relatório:

1. **Cálculo de Período**:
   - Com dia configurado: calcula baseado no "mês personalizado"
   - Sem dia: últimos 30 dias corridos

2. **Estatísticas**:
   - Total gasto no período
   - Quantidade de registros
   - Período exato analisado

3. **Lista de Gastos**:
   - Últimos 10 gastos em ordem reversa
   - Mostra valor, tipo e forma de pagamento
   - Inclui observações quando disponíveis

4. **Filtros Automáticos**:
   - Apenas gastos dentro do período
   - Ordenação cronológica

---

## ⚙️ Configurações do Sistema

### Configurar Dia de Início do Mês

**Comando**: `/config`

Permite definir qual dia do mês deve ser considerado como início do seu "mês financeiro".

#### Fluxo de Configuração:

```
⚙️ Configuração do mês

📅 Nenhum dia configurado

Qual dia do mês você gostaria que seja considerado o início do seu mês?
(Use um número entre 1 e 31)
```

#### Exemplos de Uso:

```
15    # Seu mês vai de dia 15 até dia 14 do mês seguinte
1     # Mês normal (1º até último dia do mês)
25    # Mês de 25 até 24 do mês seguinte
```

#### Validações:

- ✅ Deve ser um número entre 1 e 31
- ✅ Armazenado por usuário
- ✅ Afeta relatórios e resumos mensais

#### Confirmação:

```
✅ Dia de início do mês configurado com sucesso!
⏰ Nota: Resumos diários continuam às 21:00

📅 Seu mês agora vai de 15/01 até 15/02
```

#### Benefícios:

- **Flexibilidade**: Alinhe com seu salário ou ciclo de pagamentos
- **Relatórios Precisos**: Veja gastos do "seu" mês real
- **Resumos Mensais**: Estatísticas baseadas no período configurado

### Reconfigurando:

Basta executar `/config` novamente e informar o novo dia.

---

## 🔔 Resumos Automáticos

O sistema envia automaticamente um resumo diário às **21:00** (horário do servidor).

### Conteúdo do Resumo Diário:

```
📊 Resumo do dia

💰 Total gasto: R$ 125.00
📝 Total de registros: 3

Gastos:
1. R$ 35.00 - moradia
2. R$ 50.00 - vestuario
3. R$ 40.00 - outros

📊 Resumo Mensal (15/01 até 15/02)

💰 Total do mês: R$ 1.250.00
📝 Gastos no mês: 45
📆 Dias faltantes: 12 dias (até 15/02)

❓ Tem gastos que vc se esqueceu de adicionar?

[Botão: Sim, adicionar gasto]
```

### Características:

1. **Período Analisado**: Últimas 24 horas (21h de ontem até 21h de hoje)

2. **Resumo Diário**:
   - Total gasto nas últimas 24h
   - Quantidade de registros
   - Lista de até 10 gastos do dia

3. **Resumo Mensal** (se dia configurado):
   - Total acumulado no mês atual
   - Quantidade de gastos do mês
   - Dias restantes até o próximo ciclo

4. **Ação Rápida**:
   - Botão para adicionar gasto esquecido
   - Abre fluxo interativo sem digitar comando

5. **Caso sem gastos**:

   ```
   📊 Resumo do dia

   Nenhum gasto registrado nas últimas 24 horas.

   📊 Resumo Mensal (15/01 até 15/02)
   ...
   ```

### Configuração Técnica:

- **Horário**: 21:00 (definido via cron: `0 0 21 * * *`)
- **Frequência**: Diária
- **Automático**: Inicia quando o bot é iniciado
- **Por Usuário**: Cada usuário recebe seu próprio resumo

---

## 📝 Comandos Disponíveis

### Comandos Principais

| Comando     | Descrição                                  |
| ----------- | ------------------------------------------ |
| `/menu`     | Exibe menu principal com todos os comandos |
| `/ajuda`    | Mostra instruções de uso detalhadas        |
| `/criar`    | Inicia fluxo interativo para criar gasto   |
| `/cancelar` | Cancela operação em andamento              |

### Comandos de Consulta

| Comando       | Descrição                           |
| ------------- | ----------------------------------- |
| `/relatorio`  | Gera relatório de gastos do período |
| `/categorias` | Lista todas as categorias           |
| `/formas`     | Lista todas as formas de pagamento  |

### Comandos de Gerenciamento

| Comando                  | Descrição                      | Exemplo               |
| ------------------------ | ------------------------------ | --------------------- |
| `/addcategoria [nome]`   | Adiciona nova categoria        | `/addcategoria saúde` |
| `/delcategoria [número]` | Remove categoria               | `/delcategoria 2`     |
| `/addforma [nome]`       | Adiciona forma de pagamento    | `/addforma débito`    |
| `/delforma [número]`     | Remove forma de pagamento      | `/delforma 3`         |
| `/config`                | Configura dia de início do mês | `/config`             |

### Fluxo de Comandos

```
/menu
  ├─ /criar (Fluxo interativo)
  │   ├─ Escolhe forma
  │   ├─ Digite valor
  │   ├─ Escolhe tipo
  │   └─ Digite observação
  │
  ├─ /relatorio
  │   └─ Exibe estatísticas
  │
  ├─ /categorias
  │   ├─ /addcategoria [nome]
  │   └─ /delcategoria [número]
  │
  ├─ /formas
  │   ├─ /addforma [nome]
  │   └─ /delforma [número]
  │
  └─ /config
      └─ Digite dia (1-31)
```

---

## 🔒 Segurança e Autenticação

### Controle de Acesso

O sistema implementa autenticação robusta baseada no User ID do Telegram.

#### Como Funciona:

1. **Configuração**: User ID definido em variável de ambiente

   ```env
   TELEGRAM_USER_ID=123456789
   ```

2. **Validação**: Toda mensagem é validada antes do processamento

   ```typescript
   if (ctx.from?.id !== this.authorizedUserId) {
     // Acesso negado
     return;
   }
   ```

3. **Proteção**: Apenas o usuário autorizado pode:
   - Registrar gastos
   - Ver relatórios
   - Gerenciar categorias e formas de pagamento
   - Receber resumos automáticos

#### Tentativa de Acesso Não Autorizado:

```
🚫 Tentativa de acesso não autorizado detectada
```

_Mensagem registrada nos logs do servidor_

### Segurança dos Dados

1. **Credenciais Google**:
   - Armazenadas em arquivo separado (`credentials.json`)
   - Nunca commitadas no Git
   - Service Account com permissões mínimas

2. **Tokens Telegram**:
   - Armazenados em variáveis de ambiente
   - Não expostos nos logs
   - Não aparecem no código

3. **Logs**:
   - Estruturados e informativos
   - Sem exposição de dados sensíveis
   - Registro de tentativas de acesso

4. **Google Sheets**:
   - Acesso via Service Account
   - Permissões específicas por planilha
   - Histórico completo de alterações

---

## 🗄️ Armazenamento de Dados

### Estrutura no Google Sheets

O sistema utiliza múltiplas abas para organizar os dados:

#### 1. Aba "Gastos" (Principal)

| Data/Hora            | Forma Pagamento | Tipo      | Valor | Observação |
| -------------------- | --------------- | --------- | ----- | ---------- |
| 14/02/2026, 10:30:45 | cartão nubank   | moradia   | 35.00 | almoço     |
| 14/02/2026, 15:20:10 | pix             | vestuario | 50.50 | uber       |

#### 2. Aba "Categorias"

```
moradia
vestuario
outros
saúde
educação
```

#### 3. Aba "FormasPagamento"

```
cartão nubank
pix
dinheiro
cartão inter
```

#### 4. Aba "Config"

| UserId    | DiaInicio |
| --------- | --------- |
| 123456789 | 15        |

### Características:

- **Backup Automático**: Google Sheets mantém histórico de versões
- **Acesso Web**: Visualize via navegador
- **Exportação**: Fácil exportação para CSV/Excel
- **Compartilhamento**: Compartilhe com contador ou família
- **Gráficos**: Crie dashboards personalizados

---

## 🏗️ Arquitetura e Tecnologia

### Clean Architecture

```
┌─────────────────────────────────────┐
│         Infrastructure              │
│  (Telegram Bot, Google Sheets)      │
├─────────────────────────────────────┤
│         Application                 │
│   (Use Cases, Services, Parsers)    │
├─────────────────────────────────────┤
│            Domain                   │
│  (Entities, Value Objects, Rules)   │
└─────────────────────────────────────┘
```

### Camadas:

1. **Domain** (Núcleo de Negócio):
   - `Gasto`: Entidade principal
   - `Valor`, `FormaPagamento`, `TipoGasto`: Value Objects
   - Interfaces de repositórios

2. **Application** (Casos de Uso):
   - `RegistrarGasto`: Registra e busca gastos
   - `GerenciarCategorias`: Gerencia categorias
   - `GerenciarFormasPagamento`: Gerencia formas
   - `GerenciarConfig`: Gerencia configurações
   - `MessageParser`: Parse de mensagens
   - `SchedulerService`: Resumos automáticos

3. **Infrastructure** (Implementações):
   - `TelegramBotService`: Integração Telegram
   - `GoogleSheetsRepository`: Persistência
   - `CategoriasGoogleSheetsRepository`
   - `FormasPagamentoGoogleSheetsRepository`
   - `ConfigGoogleSheetsRepository`

### Stack Tecnológica:

- **Runtime**: Node.js 20 (LTS)
- **Linguagem**: TypeScript 5.3
- **Framework**: NestJS 10
- **Bot**: Telegraf 4.16
- **Storage**: Google Sheets API
- **Scheduler**: node-cron
- **Container**: Docker

---

## 📈 Casos de Uso Práticos

### Cenário 1: Usuário Iniciante

1. Inicia conversa com `/start`
2. Recebe mensagem de boas-vindas
3. Usa `/criar` para primeiro gasto
4. Segue fluxo interativo passo a passo
5. Gasto registrado com sucesso
6. Visualiza com `/relatorio`

### Cenário 2: Usuário Avançado

1. Registra gastos via mensagem direta
2. Personaliza categorias com `/addcategoria`
3. Configura dia do mês com `/config`
4. Recebe resumos diários às 21h
5. Analisa dados no Google Sheets

### Cenário 3: Família Compartilhada

1. Múltiplos usuários (requer bot por usuário)
2. Planilha compartilhada
3. Dashboard consolidado no Sheets
4. Relatórios individuais via Telegram

### Cenário 4: Controle Empresarial

1. Categorias por centro de custo
2. Formas de pagamento por cartão corporativo
3. Exportação mensal para contabilidade
4. Auditoria via histórico do Sheets

---

## 🎓 Melhores Práticas

### Para Registro Eficiente:

1. **Seja Consistente**: Use sempre as mesmas formas e categorias
2. **Registre Imediatamente**: Não deixe acumular gastos
3. **Use Observações**: Facilita lembrar depois
4. **Revise Diariamente**: Leia o resumo das 21h

### Para Organização:

1. **Categorias Claras**: Não crie categorias demais
2. **Periodicidade**: Configure dia do mês alinhado ao salário
3. **Backup**: Exporte Google Sheets mensalmente
4. **Limpeza**: Remova categorias não utilizadas

### Para Análise:

1. **Use Google Sheets**: Crie gráficos e tabelas dinâmicas
2. **Compare Períodos**: Analise mês a mês
3. **Identifique Padrões**: Onde gastou mais?
4. **Estabeleça Metas**: Defina limites por categoria

---

## 📚 Resumo das Funcionalidades

### ✅ Funcionalidades Implementadas

- [x] Registro de gastos (2 métodos)
- [x] Categorias personalizáveis
- [x] Formas de pagamento personalizáveis
- [x] Relatórios por período configurável
- [x] Configuração de dia do mês
- [x] Resumos diários automáticos
- [x] Integração Google Sheets
- [x] Autenticação por User ID
- [x] Comandos completos
- [x] Validações robustas
- [x] Logs estruturados
- [x] Dockerização
- [x] Clean Architecture

### 🚀 Funcionalidades Futuras (Sugestões)

- [ ] Múltiplos usuários
- [ ] Metas de gastos por categoria
- [ ] Alertas de limite
- [ ] Gráficos no Telegram
- [ ] Exportação PDF
- [ ] Reconhecimento de nota fiscal (OCR)
- [ ] Integração com bancos
- [ ] App mobile nativo
- [ ] Dashboard web

---

## 🆘 Suporte

Para dúvidas ou problemas:

1. Verifique os logs: `docker-compose logs -f`
2. Consulte `/ajuda` no bot
3. Leia o [README.md](README.md)
4. Veja o [SETUP_GOOGLE_SHEETS.md](SETUP_GOOGLE_SHEETS.md)

---

**Desenvolvido com ❤️ usando NestJS, TypeScript e Clean Architecture**

_Sistema completo de controle financeiro pessoal via Telegram Bot_
