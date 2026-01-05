# Integração com Todoist

Este documento explica como usar a integração do Todoist no Assistente Jurídico PJe para gerenciar tarefas relacionadas a processos judiciais, prazos e atividades do escritório.

## 📋 Sumário

1. [Configuração](#configuração)
2. [Uso via MCP Server](#uso-via-mcp-server)
3. [Uso Programático](#uso-programático)
4. [Casos de Uso Jurídicos](#casos-de-uso-jurídicos)
5. [Referência de API](#referência-de-api)

## 🔧 Configuração

### 1. Obter API Token do Todoist

1. Acesse [Todoist Settings](https://todoist.com/app/settings/integrations/developer)
2. Role até a seção "API token"
3. Copie seu token pessoal

### 2. Configurar Variável de Ambiente

Adicione ao seu arquivo `.env`:

```env
VITE_TODOIST_API_KEY=seu-token-aqui
```

### 3. Verificar Instalação

A integração foi instalada automaticamente com os seguintes pacotes:

- `@doist/todoist-ai` - Ferramentas de IA para Todoist
- `@doist/todoist-api-typescript` - Cliente TypeScript da API

## 🤖 Uso via MCP Server

### Configuração no VS Code / Cursor

O servidor MCP do Todoist foi configurado automaticamente em:

- `.vscode/mcp.json`
- `.cursor/mcp.json`

Você pode usar os seguintes comandos no Copilot Chat:

```
@todoist adicionar tarefa "Elaborar contestação - Processo 1234567-89.2024.8.09.0000" com prazo 2024-12-15
```

```
@todoist buscar tarefas para hoje
```

```
@todoist marcar tarefa #12345678 como concluída
```

### Ferramentas Disponíveis via MCP

- **addTasks** - Adiciona uma ou mais tarefas
- **findTasksByDate** - Busca tarefas por data
- **findTasks** - Busca tarefas com filtros
- **updateTask** - Atualiza uma tarefa existente
- **completeTask** - Marca tarefa como concluída

## 💻 Uso Programático

### Inicializar Cliente

```typescript
import { initializeTodoistClient } from '@/lib/todoist-integration';
import { config } from '@/lib/config';

// Inicializar no componente ou hook
const client = initializeTodoistClient(config.todoist.apiKey);
```

### Adicionar Tarefas Jurídicas

```typescript
import { addLegalTasks } from '@/lib/todoist-integration';

// Adicionar uma tarefa de prazo processual
await addLegalTasks([{
  content: "Elaborar contestação - Processo 1234567-89.2024.8.09.0000",
  description: "Prazo: 15 dias úteis após citação\nForo: 1ª Vara Cível",
  dueDate: "2024-12-15",
  priority: 4, // Máxima prioridade
  labels: ['processo', 'prazo', 'contestacao']
}]);
```

### Criar Tarefas a partir de Prazo Calculado

```typescript
import { createTaskFromDeadline } from '@/lib/todoist-integration';

// Após calcular prazo no calculador
await createTaskFromDeadline(
  "1234567-89.2024.8.09.0000",
  "Recurso de Apelação",
  "2024-12-20",
  "Prazo: 15 dias úteis. Anexar razões e documentos."
);
```

### Buscar Tarefas de Hoje

```typescript
import { findLegalTasksByDate } from '@/lib/todoist-integration';

const today = new Date().toISOString().split('T')[0];
const tasks = await findLegalTasksByDate(today);

console.log(`Você tem ${tasks.length} tarefas para hoje`);
```

### Buscar Tarefas por Processo

```typescript
import { findTasksByProcess } from '@/lib/todoist-integration';

const tasks = await findTasksByProcess("1234567-89.2024.8.09.0000");
console.log(`${tasks.length} tarefas encontradas para este processo`);
```

### Atualizar Tarefa

```typescript
import { updateLegalTask } from '@/lib/todoist-integration';

await updateLegalTask("12345678", {
  content: "Elaborar contestação - URGENTE",
  priority: 4,
  dueDate: "2024-12-10" // Antecipar prazo
});
```

### Marcar Tarefa como Concluída

```typescript
import { completeLegalTask } from '@/lib/todoist-integration';

await completeLegalTask("12345678");
```

## ⚖️ Casos de Uso Jurídicos

### 1. Criar Tarefas ao Adicionar Processo no CRM

```typescript
import { createProcessTasks } from '@/lib/todoist-integration';

// Quando adicionar processo no Kanban
await createProcessTasks({
  number: "1234567-89.2024.8.09.0000",
  type: "Ação de Cobrança",
  deadlines: [
    {
      type: "Contestação",
      date: "2024-12-15",
      description: "Apresentar defesa com documentos"
    },
    {
      type: "Audiência Prévia",
      date: "2024-12-20",
      description: "Comparecer ao fórum às 14h"
    }
  ]
});
```

### 2. Integrar com Calculadora de Prazos

```typescript
// No componente DeadlineCalculator
const handleCalculateAndCreateTask = async () => {
  const finalDate = calculateDeadline(
    startDate,
    daysCount,
    suspensionPeriods
  );
  
  await createTaskFromDeadline(
    processNumber,
    taskType,
    finalDate.toISOString().split('T')[0],
    `Prazo calculado: ${daysCount} dias úteis`
  );
  
  toast.success("Tarefa criada no Todoist!");
};
```

### 3. Sincronizar com Google Calendar

```typescript
// Criar tarefa no Todoist e evento no Calendar
async function createDeadlineEverywhere(deadline) {
  // 1. Adicionar ao Todoist
  await createTaskFromDeadline(
    deadline.processNumber,
    deadline.type,
    deadline.date
  );
  
  // 2. Adicionar ao Google Calendar
  await addToGoogleCalendar(deadline);
  
  // 3. Atualizar no Kanban local
  updateProcessInCRM(deadline);
}
```

### 4. Monitorar Prazos Urgentes

```typescript
import { searchLegalTasks } from '@/lib/todoist-integration';

// Buscar tarefas urgentes (próximos 3 dias)
const urgentTasks = await searchLegalTasks("3 days & p1");

// Notificar usuário
if (urgentTasks.length > 0) {
  showNotification({
    title: "⚠️ Prazos Urgentes",
    message: `Você tem ${urgentTasks.length} prazos nos próximos 3 dias`,
    type: "warning"
  });
}
```

### 5. Dashboard de Produtividade

```typescript
// Estatísticas de tarefas
async function getProductivityStats() {
  const today = await findLegalTasksByDate(new Date().toISOString().split('T')[0]);
  const allProcessTasks = await searchLegalTasks("@processo");
  
  return {
    tasksToday: today.length,
    totalProcessTasks: allProcessTasks.length,
    completedThisWeek: await searchLegalTasks("completed & 7 days")
  };
}
```

## 📚 Referência de API

### Funções Disponíveis

#### `initializeTodoistClient(apiKey: string): TodoistApi`
Inicializa o cliente Todoist. Deve ser chamado antes de usar outras funções.

#### `addLegalTasks(tasks: TaskInput[]): Promise<Task[]>`
Adiciona uma ou mais tarefas jurídicas.

**Parâmetros:**
- `content` (string) - Título da tarefa
- `description` (string, opcional) - Descrição detalhada
- `dueDate` (string, opcional) - Data no formato YYYY-MM-DD
- `priority` (number, opcional) - 1 a 4 (4 = máxima)
- `labels` (string[], opcional) - Tags da tarefa
- `projectId` (string, opcional) - ID do projeto

#### `findLegalTasksByDate(date: string): Promise<Task[]>`
Busca tarefas por data específica.

#### `searchLegalTasks(query: string): Promise<Task[]>`
Busca tarefas usando filtros do Todoist.

**Exemplos de queries:**
- `"@processo"` - Todas as tarefas com label "processo"
- `"p1"` - Tarefas de prioridade máxima
- `"3 days"` - Tarefas dos próximos 3 dias
- `"overdue"` - Tarefas atrasadas

#### `updateLegalTask(taskId: string, updates: object): Promise<Task>`
Atualiza uma tarefa existente.

#### `completeLegalTask(taskId: string): Promise<void>`
Marca tarefa como concluída.

#### `createTaskFromDeadline(processNumber, taskType, deadline, description?): Promise<Task>`
Cria tarefa a partir de dados de prazo processual.

#### `findTasksByProcess(processNumber: string): Promise<Task[]>`
Busca todas as tarefas relacionadas a um processo.

#### `createProcessTasks(processData): Promise<Task[]>`
Cria múltiplas tarefas para um novo processo.

### Labels Recomendadas

Sugerimos usar as seguintes labels para organizar tarefas jurídicas:

- `processo` - Tarefas relacionadas a processos
- `prazo` - Prazos processuais
- `audiencia` - Audiências e sessões
- `peticao` - Elaboração de petições
- `recurso` - Recursos e contra-razões
- `urgente` - Tarefas urgentes
- `cliente:[nome]` - Tarefas por cliente
- `vara:[nome]` - Tarefas por vara/foro

### Prioridades

- **P1 (4)** - Urgente: prazos próximos, audiências
- **P2 (3)** - Alta: petições importantes
- **P3 (2)** - Normal: tarefas regulares
- **P4 (1)** - Baixa: tarefas administrativas

## 🔐 Segurança

- **Nunca** commite o arquivo `.env` com seu token
- O token do Todoist dá acesso total à sua conta
- Use variáveis de ambiente diferentes para dev/produção
- No Vercel, configure `VITE_TODOIST_API_KEY` nas configurações do projeto

## 🆘 Solução de Problemas

### Erro: "Cliente Todoist não inicializado"

Certifique-se de chamar `initializeTodoistClient()` antes de usar qualquer função:

```typescript
import { initializeTodoistClient } from '@/lib/todoist-integration';
import { config } from '@/lib/config';

initializeTodoistClient(config.todoist.apiKey);
```

### Tarefas não aparecem

Verifique se:
1. O token da API está correto
2. A tarefa foi criada com sucesso (verifique o retorno da Promise)
3. O projeto/labels existem na sua conta Todoist

### MCP Server não conecta

1. Reinicie o VS Code / Cursor
2. Verifique se os arquivos `.vscode/mcp.json` e `.cursor/mcp.json` existem
3. Execute manualmente: `npx @doist/todoist-ai`

## 📖 Recursos Adicionais

- [Documentação Oficial Todoist AI](https://github.com/Doist/todoist-ai)
- [API Todoist](https://developer.todoist.com/rest/v2)
- [Filtros e Queries Todoist](https://todoist.com/help/articles/introduction-to-filters-V98wIH)
- [MCP Protocol](https://modelcontextprotocol.io/)

## 🤝 Contribuindo

Se você implementar novos casos de uso interessantes com o Todoist, considere documentá-los aqui para beneficiar outros usuários!

---

**Última atualização:** 22 de novembro de 2025
