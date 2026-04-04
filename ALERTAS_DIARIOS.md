# 📊 Sistema de Alertas Diários

## Como Funciona

### ✅ Resumo Pessoal

- **NÃO é um broadcast** - Cada usuário recebe **apenas seu próprio resumo**
- Quando um usuário configura seu dia de início do mês, um alerta individual é criado
- Apenas aquele usuário recebe a mensagem às 21:00 todos os dias

### 🕐 Horário dos Alertas

- **Hora fixa**: 21:00 (9 PM) a cada dia
- Usa cronograma cron: `0 0 21 * * *` (21:00 em todos os dias)
- Baseado no horário do servidor (timezone UTC ou conforme configurado)

### 📈 Conteúdo do Resumo

Cada alerta inclui:

1. **Total gasto hoje** (últimas 24 horas)
2. **Quantidade de registros do dia**
3. **Lista dos gastos** (se forem ≤ 10)
4. **Resumo do período do mês** (baseado no dia de início configurado)
5. **Sugestão para registrar gastos faltantes**

### 🔄 Restauração ao Reiniciar

**Situação atual:**

- ❌ Alertas são perdidos ao reiniciar a aplicação
- Apenas novos usuários que configurarem recebem alertas
- Usuários antigos não recebem alertas após restart

**Solução planejada:**

- ✅ Ao inicializar, buscar todos os usuários com config salva
- ✅ Re-agendar alertas automaticamente
- ✅ Nenhum usuário será deixado de lado

### 🎯 Gestão de Alertas

```bash
# Ver total de alertas ativos (nos logs)
📊 Alertas ativos: X

# Na inicialização:
⏰ Cada usuario recebe seu proprio resumo diario as 21:00
📊 Alertas ativos: 0 (será restaurado em 5 segundos)
```

### 🛑 Como Parar Alertas

Se um usuário quiser parar de receber alertas:

1. Remova a configuração de dia de início do mês
2. Será chamado `pararResumo(userId)` automaticamente
3. Nenhum alerta será enviado

### 📝 Logs do Sistema

```
⏰ Alerta agendado para usuario=55XXXXXX9 - Resumo diario as 21:00
📊 Total de usuarios com alertas: 3
📤 Enviando resumo para usuario=55XXXXXX9
✅ Resumo enviado para usuario=55XXXXXX9
```

---

## ⚙️ Configuração Técnica

- **Serviço**: `SchedulerService`
- **Biblioteca**: `node-cron`
- **Armazenamento de tarefas**: Memória (Map)
- **Callbacks de mensagem**: Individualizados por usuário

## 🔐 Segurança

- ✅ Cada alerta é enviado apenas para o usuário específico
- ✅ Sem vazamento de dados entre usuários
- ✅ Callback de envio é isolado por usuário
