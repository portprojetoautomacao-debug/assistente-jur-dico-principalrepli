# 📝 Exemplo Prático: GitLab Duo Revisando Seu Código

## Código Original (Do seu projeto)

```typescript
// api/agents.ts - Linhas 1-60

interface AgentTask {
  id: string
  agentId: string
  type: 'analyze_document' | 'monitor_djen' | 'calculate_deadline' | 'draft_petition' | 'check_datajud' | 'organize_files' | 'research_precedents' | 'risk_analysis' | 'contract_review' | 'client_communication' | 'billing_analysis' | 'case_strategy' | 'legal_translation' | 'compliance_check'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'human_intervention'
  createdAt: string
  startedAt?: string
  completedAt?: string
  data: Record<string, unknown>
  result?: Record<string, unknown>
  error?: string
}

function getSystemPrompt(agentType: string): string {
  const prompts: Record<string, string> = {
    analyzer: `Você é um assistente jurídico especializado em análise de documentos processuais.
Sua função é extrair informações críticas de documentos jurídicos, identificar prazos, partes envolvidas, e sugerir ações.
Sempre retorne respostas em formato JSON estruturado.`,

    monitor: `Você é um agente de monitoramento de publicações jurídicas especializado em DJEN e DataJud.
Analise intimações, extraia dados do processo, identifique prazos e classifique a urgência.
Retorne sempre em JSON com campos: processo, tipo, prazo, urgência.`,
  }
  return prompts[agentType] || ''
}
```

---

## 🤖 O Que o Duo Sugeriria

### **Comando 1: `/refactor melhorar tipo e validação`**

**Sugestão do Duo:**

```typescript
// ✨ VERSÃO MELHORADA

// 1. Criar tipos enumerados para melhor type safety
enum AgentType {
  ANALYZE_DOCUMENT = 'analyze_document',
  MONITOR_DJEN = 'monitor_djen',
  CALCULATE_DEADLINE = 'calculate_deadline',
  DRAFT_PETITION = 'draft_petition',
  CHECK_DATAJUD = 'check_datajud',
  ORGANIZE_FILES = 'organize_files',
  RESEARCH_PRECEDENTS = 'research_precedents',
  RISK_ANALYSIS = 'risk_analysis',
  CONTRACT_REVIEW = 'contract_review',
  CLIENT_COMMUNICATION = 'client_communication',
  BILLING_ANALYSIS = 'billing_analysis',
  CASE_STRATEGY = 'case_strategy',
  LEGAL_TRANSLATION = 'legal_translation',
  COMPLIANCE_CHECK = 'compliance_check'
}

enum TaskStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  HUMAN_INTERVENTION = 'human_intervention'
}

enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 2. Interface melhorada com validações
interface AgentTask {
  id: string
  agentId: string
  type: AgentType
  priority: TaskPriority
  status: TaskStatus
  createdAt: string
  startedAt?: string
  completedAt?: string
  data: Record<string, unknown>
  result?: Record<string, unknown>
  error?: string
  
  // Novos campos para rastreamento
  retryCount: number
  maxRetries: number
  timeout: number
}

// 3. Validador de tarefa
function validateAgentTask(task: Partial<AgentTask>): task is AgentTask {
  return !!(
    task.id &&
    task.agentId &&
    task.type &&
    task.priority &&
    task.status &&
    task.createdAt
  )
}

// 4. Função melhorada com cache
const SYSTEM_PROMPTS: Record<AgentType, string> = {
  [AgentType.ANALYZER]: `Você é um assistente jurídico especializado em análise de documentos processuais...`,
  [AgentType.MONITOR_DJEN]: `Você é um agente de monitoramento de publicações jurídicas...`,
  // ... outros prompts
}

function getSystemPrompt(agentType: AgentType): string {
  const prompt = SYSTEM_PROMPTS[agentType]
  
  if (!prompt) {
    console.warn(`System prompt not found for agent type: ${agentType}`)
    return ''
  }
  
  return prompt
}
```

**Benefícios:**
- ✅ Enums previnem typos
- ✅ Type safety melhorada
- ✅ Validação integrada
- ✅ Cache de prompts
- ✅ Melhor manutenção

---

### **Comando 2: `/fix adicionar tratamento de erros e logging`**

**Sugestão do Duo:**

```typescript
// ✨ COM TRATAMENTO DE ERROS

import { logger } from '../lib/logger'
import { captureException } from '@sentry/node'

async function processAgentTask(task: AgentTask): Promise<void> {
  // Validação prévia
  if (!validateAgentTask(task)) {
    const error = new Error('Invalid agent task structure')
    logger.error('Task validation failed', { task, error })
    captureException(error)
    throw error
  }

  try {
    logger.info('Processing agent task', {
      taskId: task.id,
      agentId: task.agentId,
      type: task.type
    })

    // Timeout protection
    const controller = new AbortController()
    const timeout = setTimeout(
      () => controller.abort(),
      task.timeout || 30000
    )

    try {
      const result = await executeAgent(task, controller.signal)
      
      logger.info('Agent task completed', {
        taskId: task.id,
        resultSize: JSON.stringify(result).length
      })

      return result
    } finally {
      clearTimeout(timeout)
    }

  } catch (error) {
    logger.error('Agent task execution failed', {
      taskId: task.id,
      agentId: task.agentId,
      error: error instanceof Error ? error.message : String(error)
    })

    // Sentry para monitoring
    captureException(error, {
      tags: {
        agentId: task.agentId,
        taskType: task.type
      }
    })

    throw error
  }
}
```

**Benefícios:**
- ✅ Validação antes do processamento
- ✅ Logging estruturado
- ✅ Timeout protection
- ✅ Error tracking com Sentry
- ✅ Fácil debugging

---

### **Comando 3: `/tests gerar testes com casos extremos`**

**Sugestão do Duo:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { validateAgentTask, getSystemPrompt } from '../api/agents'

describe('Agent Tasks', () => {
  describe('validateAgentTask', () => {
    it('should validate correct agent task', () => {
      const validTask = {
        id: 'task-1',
        agentId: 'agent-1',
        type: AgentType.ANALYZE_DOCUMENT,
        priority: TaskPriority.HIGH,
        status: TaskStatus.QUEUED,
        createdAt: new Date().toISOString(),
        data: {},
        retryCount: 0,
        maxRetries: 3,
        timeout: 30000
      }

      expect(validateAgentTask(validTask)).toBe(true)
    })

    it('should reject task missing required fields', () => {
      const invalidTask = {
        id: 'task-1',
        // Missing agentId, type, priority, status
      }

      expect(validateAgentTask(invalidTask)).toBe(false)
    })

    it('should handle empty object', () => {
      expect(validateAgentTask({})).toBe(false)
    })

    it('should handle null and undefined', () => {
      expect(validateAgentTask(null as any)).toBe(false)
      expect(validateAgentTask(undefined as any)).toBe(false)
    })
  })

  describe('getSystemPrompt', () => {
    it('should return correct prompt for analyzer', () => {
      const prompt = getSystemPrompt(AgentType.ANALYZER)
      expect(prompt).toContain('assistente jurídico')
      expect(prompt).toContain('análise de documentos')
    })

    it('should return empty string for unknown agent type', () => {
      const prompt = getSystemPrompt('unknown_type' as AgentType)
      expect(prompt).toBe('')
    })

    it('should return consistent prompts', () => {
      const prompt1 = getSystemPrompt(AgentType.MONITOR_DJEN)
      const prompt2 = getSystemPrompt(AgentType.MONITOR_DJEN)
      expect(prompt1).toBe(prompt2)
    })

    it('should have all prompts defined', () => {
      Object.values(AgentType).forEach(type => {
        const prompt = getSystemPrompt(type as AgentType)
        expect(prompt).toBeDefined()
        expect(prompt.length).toBeGreaterThan(0)
      })
    })
  })
})
```

**Cobertura:**
- ✅ 7 casos de teste
- ✅ Casos extremos cobertos
- ✅ Edge cases validados
- ✅ Testes de regressão

---

### **Comando 4: `/security-check`**

**Sugestão do Duo:**

```
⚠️  ACHADOS DE SEGURANÇA:

1. ⚠️ MÉDIO: Tipagem fraca em Record<string, unknown>
   └─ Risco: Injeção de dados maliciosos
   └─ Solução: Usar Zod/Yup para validação em runtime

2. ✅ BAIXO: SQL Injection não é risco (sem SQL aqui)

3. ⚠️ MÉDIO: Tratamento de erro genérico
   └─ Risco: Exposição de detalhes internos
   └─ Solução: Sanitizar erros antes de retornar ao cliente

4. ✅ ALTO: Timeout implementado ✓
```

**Código Sugerido:**

```typescript
import { z } from 'zod'

// Schema de validação com Zod
const AgentTaskSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  type: z.enum([...Object.values(AgentType)]),
  priority: z.enum([...Object.values(TaskPriority)]),
  status: z.enum([...Object.values(TaskStatus)]),
  createdAt: z.string().datetime(),
  data: z.record(z.unknown()).superRefine((data, ctx) => {
    // Validar conteúdo de data
    if (typeof data !== 'object') {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_type,
        expected: 'object',
        received: typeof data
      })
    }
  }),
  retryCount: z.number().min(0),
  maxRetries: z.number().min(1),
  timeout: z.number().min(1000).max(60000)
})

// Função segura
function validateAgentTaskSecure(data: unknown): AgentTask {
  try {
    return AgentTaskSchema.parse(data)
  } catch (error) {
    logger.error('Task validation failed', {
      error: error instanceof z.ZodError ? error.errors : error
    })
    throw new Error('Invalid task configuration')
  }
}
```

---

## 🎯 Como Testar Agora Mesmo

### Passo 1: No VS Code

```
1. Abra /workspaces/assistente-juridico-p/api/agents.ts
2. Selecione linhas 1-60
3. Pressione Ctrl+Shift+P
4. Procure "GitLab: Open Duo Chat"
5. Cole este comando:

/refactor melhorar tipagem com enums e validação estruturada
```

### Passo 2: Veja as Sugestões

O Duo responderá com sugestões de:
- ✅ Melhor type safety
- ✅ Validações automáticas
- ✅ Error handling
- ✅ Performance

### Passo 3: Aplique as Mudanças

Copie as sugestões e integre ao código!

---

## 📊 Resumo de Benefícios

| Antes | Depois |
|-------|--------|
| Strings de tipos | ✅ Enums type-safe |
| Sem validação | ✅ Validação integrada |
| Sem logs | ✅ Logging estruturado |
| Sem error handling | ✅ Try/catch + Sentry |
| Sem testes | ✅ 7+ casos de teste |
| Sem segurança | ✅ Validação Zod |

---

## 🚀 Próximas Revisões

Você pode usar o Duo para revisar:

1. **`src/lib/agent-orchestrator.ts`**
   - `/refactor melhorar load balancing`

2. **`src/lib/agent-communication.ts`**
   - `/security-check vulnerabilidades`

3. **`api/legal-services.ts`**
   - `/performance-check otimizações`

4. **Qualquer arquivo `.ts` ou `.tsx`**
   - `/tests gerar cobertura de testes`

---

**Pronto para revisar seu código com IA? 🤖**
