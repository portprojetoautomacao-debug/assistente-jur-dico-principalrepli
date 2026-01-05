# 🔧 Plano de Remoção de Dados Simulados

## 📋 Arquivos que Precisam ser Modificados

### 1. `/src/lib/agents.ts` - REMOVER COMPLETAMENTE

**Problemas Identificados:**

#### Linha 144: Atividades aleatórias
```typescript
// ❌ REMOVER
return activities[Math.floor(Math.random() * activities.length)]
```
**Solução:** Usar atividade baseada no status real do agente

#### Linha 185-187: Delays simulados
```typescript
// ❌ REMOVER
const processingTime = 1500 + Math.random() * 3000
await new Promise(resolve => setTimeout(resolve, processingTime))
```
**Solução:** Tempo real de processamento da API/LLM

#### Linhas 190-629: Função `processTaskWithAI` INTEIRA
Esta função retorna APENAS dados simulados. **REMOVER COMPLETAMENTE**.

**Exemplos de simulações:**
```typescript
// ❌ REMOVER - Linha 204
confidence: 0.92 + Math.random() * 0.08

// ❌ REMOVER - Linha 215
const hasNewIntimations = Math.random() > 0.7

// ❌ REMOVER - Linha 220
processo: `${Math.floor(Math.random() * 9000000) + 1000000}-${Math.floor(Math.random() * 90) + 10}.2024.8.07.0001`

// ❌ REMOVER - Linhas 278-308 - Petição com placeholders
[REQUERENTE]
[Redigido automaticamente pela IA - Requer revisão humana]
[ADVOGADO(A)]
OAB/XX XXXXX

// ❌ REMOVER - Linha 338
filesOrganized: Math.floor(Math.random() * 20) + 5

// ❌ REMOVER - Linha 354
number: `REsp ${Math.floor(Math.random() * 2000000) + 1000000}/DF`

// ❌ REMOVER - Linha 372
riskLevel: ['baixo', 'médio', 'alto', 'crítico'][Math.floor(Math.random() * 4)]

// ❌ REMOVER - Linha 420
totalBilled: (Math.random() * 50000 + 10000).toFixed(2)
```

**Solução:** Substituir pela nova arquitetura em `lib/ai/`

---

### 2. `/api/agents.ts` - DEPRECAR ou REFATORAR

**Problemas:**

#### Linhas 138-172: Função `processTaskWithAI`
Tenta usar Spark LLM mas depois faz parse genérico que pode falhar.

```typescript
// ⚠️ MELHORAR tratamento de resposta
const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
result = jsonMatch ? JSON.parse(jsonMatch[0]) : { rawResponse: aiContent };
```

**Solução:** 
- Usar `HttpLlmClient` da nova arquitetura
- Implementar retry e validação

#### Linhas 40-90: System prompts genéricos
```typescript
// ⚠️ MELHORAR - Prompts muito vagos
analyzer: `Você é um assistente jurídico especializado em análise de documentos processuais.`
```

**Solução:** Usar prompts detalhados de `lib/ai/agents-registry.ts`

---

### 3. `/src/lib/real-agent-client.ts` - REVISAR

**Linha 173:**
```typescript
// ⚠️ AMBÍGUO - Menciona "modo simulado"
: 'Modo de agentes simulados será ativado. Os agentes voltarão a usar dados fictícios. Continuar?'
```

**Solução:**
- Remover toggle de simulação
- Sempre usar dados reais em produção
- Ter ambiente de DEV separado para testes

---

### 4. Componentes Frontend - ATUALIZAR

**Arquivos a verificar:**
- `src/components/agents/*.tsx`
- `src/pages/agents/*.tsx`
- `src/hooks/use-autonomous-agents.ts`
- `src/hooks/use-agent-backup.ts`

**Mudanças necessárias:**
1. Trocar chamadas para `/api/agents` → `/api/agents-v2`
2. Atualizar tipos para usar novos retornos
3. Adicionar tratamento de erros para falhas de API real

---

## 🎯 Plano de Ação Detalhado

### Fase 1: Criar Novos Arquivos ✅ (CONCLUÍDO)

- [x] `lib/ai/core-agent.ts`
- [x] `lib/ai/http-llm-client.ts`
- [x] `lib/ai/tools.ts`
- [x] `lib/ai/agents-registry.ts`
- [x] `api/agents-v2.ts`

### Fase 2: Ajustar Endpoints de APIs (SE NECESSÁRIO)

Verificar se estes endpoints existem e funcionam:

**Checklist de APIs:**
- [ ] `/api/djen/check` - Retorna intimações reais?
- [ ] `/api/todoist` - Cria tarefas reais no Todoist?
- [ ] `/api/deadline/calculate` - Calcula prazos com calendário real?
- [ ] `/api/legal-services` - Consulta processos reais?
- [ ] `/api/kv` - Salva logs no Redis?

**Se algum não existir ou estiver simulado, implementar.**

### Fase 3: Atualizar Código Existente

#### Arquivo: `src/lib/agents.ts`

**Ação: REFATORAR COMPLETAMENTE**

```typescript
// MANTER apenas:
export type AgentTaskData = Record<string, unknown>
export type AgentTaskResult = Record<string, unknown>
export interface AgentTask { ... }
export interface Agent { ... }
export const agentActivities = { ... }
export function getAgentActivity(agent: Agent): string { ... }
export function getTaskDescription(task: AgentTask): string { ... }
export function createAgentTask(...) { ... }

// REMOVER:
export async function processTaskWithAI(task: AgentTask, agent: Agent) {
  // ❌ DELETAR TUDO - usar lib/ai/core-agent.ts
}

// ADICIONAR:
import { SimpleAgent } from './ai/core-agent'
import { HttpLlmClient } from './ai/http-llm-client'
import { ALL_TOOLS } from './ai/tools'
import { AGENTS } from './ai/agents-registry'

export async function processTaskWithAgent(task: AgentTask, agent: Agent): Promise<AgentTaskResult> {
  const persona = AGENTS[agent.id as any]
  if (!persona) {
    throw new Error(`Agente ${agent.id} não encontrado no registry`)
  }

  const llm = new HttpLlmClient({
    baseUrl: process.env.LLM_PROXY_URL || '/api/llm-proxy'
  })

  const ctx = {
    baseUrl: typeof window !== 'undefined' ? window.location.origin : '',
    evolutionApiUrl: process.env.EVOLUTION_API_URL || '',
    evolutionApiKey: process.env.EVOLUTION_API_KEY || '',
  }

  const agentInstance = new SimpleAgent({
    llm,
    tools: ALL_TOOLS,
    persona,
    toolContext: ctx,
    sessionId: `agent-${agent.id}-${Date.now()}`,
  })

  const taskDescription = getTaskDescription(task)
  const result = await agentInstance.run(`Processe: ${taskDescription}. Dados: ${JSON.stringify(task.data)}`)

  return {
    ...result,
    processedAt: new Date().toISOString(),
    agentId: agent.id,
  }
}
```

#### Arquivo: `api/agents.ts`

**Ação: DEPRECAR**

1. Renomear para `api/agents-old-deprecated.ts`
2. Adicionar comentário no topo:
```typescript
/**
 * @deprecated Use /api/agents-v2.ts
 * Este arquivo contém lógica antiga com dados simulados
 * Mantido apenas para referência histórica
 */
```

#### Arquivo: Frontend Components

**Ação: ATUALIZAR chamadas**

```typescript
// ANTES
const response = await fetch('/api/agents', {
  method: 'POST',
  body: JSON.stringify({ agentId: 'harvey' })
})

// DEPOIS
const response = await fetch('/api/agents-v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ agentId: 'harvey' })
})

// Adicionar tratamento de erro
if (!response.ok) {
  const error = await response.json()
  throw new Error(error.error || 'Falha ao executar agente')
}
```

### Fase 4: Implementar Memória Persistente (Redis)

**Arquivo: `lib/ai/upstash-memory-store.ts` (NOVO)**

```typescript
import type { MemoryStore, ChatMessage } from './core-agent'

export class UpstashMemoryStore implements MemoryStore {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.APP_BASE_URL || ''
  }

  async load(sessionId: string): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/kv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get',
          key: `agent-memory:${sessionId}`,
        }),
      })

      if (!response.ok) return []
      
      const data = await response.json()
      return data.value || []
    } catch {
      return []
    }
  }

  async save(sessionId: string, history: ChatMessage[]): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/kv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set',
          key: `agent-memory:${sessionId}`,
          value: history,
          ttl: 86400, // 24h
        }),
      })
    } catch (e) {
      console.error('[UpstashMemoryStore] Erro ao salvar:', e)
    }
  }
}
```

**Atualizar `api/agents-v2.ts`:**
```typescript
import { UpstashMemoryStore } from '../lib/ai/upstash-memory-store'

// Trocar:
memoryStore: InMemoryMemoryStore,
// Por:
memoryStore: new UpstashMemoryStore(),
```

---

## 🧪 Testes Necessários

### 1. Teste de Integração - Justine (Intimações)

```bash
curl -X POST https://seu-app.vercel.app/api/agents-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "justine",
    "message": "Busque a próxima intimação pendente e crie tarefa"
  }'
```

**Resultado esperado:**
- ✅ Chama `/api/djen/check`
- ✅ Retorna intimação REAL (ou erro se não houver)
- ✅ Calcula prazo REAL via `/api/deadline/calculate`
- ✅ Cria tarefa REAL no Todoist
- ✅ Registra log no Redis

### 2. Teste de Integração - Harvey (Estratégia)

```bash
curl -X POST https://seu-app.vercel.app/api/agents-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "harvey",
    "message": "Me dê resumo dos 3 processos mais críticos hoje"
  }'
```

**Resultado esperado:**
- ✅ Chama `/api/legal-services` para buscar processos
- ✅ Retorna dados REAIS de processos
- ✅ Analisa e prioriza baseado em prazos
- ✅ Registra análise em logs

### 3. Teste de Erro - API Offline

Simular falha de API para verificar tratamento:

```bash
# Desabilitar temporariamente DJEN_API_KEY
curl -X POST https://seu-app.vercel.app/api/agents-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "justine"
  }'
```

**Resultado esperado:**
- ✅ Retorna erro claro
- ✅ Não trava ou retorna dados inventados
- ✅ Registra erro em logs

---

## 📊 Métricas de Sucesso

### Antes (Versão Antiga)
- ❌ 100% dos dados são simulados
- ❌ 0 chamadas a APIs reais
- ❌ Math.random() usado 50+ vezes
- ❌ Placeholders em 10+ locais

### Depois (Versão Nova)
- ✅ 100% dos dados vêm de APIs reais
- ✅ 6 tools conectadas a endpoints reais
- ✅ 0 uso de Math.random() para dados
- ✅ 0 placeholders em produção

---

## ✅ Checklist Final

### Código
- [ ] Remover `Math.random()` de `src/lib/agents.ts`
- [ ] Remover função `processTaskWithAI` simulada
- [ ] Deprecar `/api/agents.ts` antigo
- [ ] Atualizar frontend para usar `/api/agents-v2`
- [ ] Implementar `UpstashMemoryStore`
- [ ] Adicionar tratamento de erros em todas as tools

### Configuração
- [ ] Configurar variáveis de ambiente na Vercel
- [ ] Validar credenciais de APIs (DJEN, Todoist, Evolution)
- [ ] Testar conectividade com todas as APIs
- [ ] Configurar Redis/Upstash para logs

### Testes
- [ ] Testar cada um dos 15 agentes
- [ ] Validar que tools retornam dados reais
- [ ] Testar cenários de erro (API offline)
- [ ] Verificar logs sendo salvos corretamente

### Documentação
- [ ] Atualizar README com nova arquitetura
- [ ] Documentar variáveis de ambiente
- [ ] Criar guia de troubleshooting
- [ ] Documentar migração para equipe

---

**Próximo Passo:** Começar implementação das mudanças listadas acima.
