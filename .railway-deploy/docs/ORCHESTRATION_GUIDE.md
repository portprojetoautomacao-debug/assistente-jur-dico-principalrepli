# 🎯 Guia de Orquestração de Múltiplos Agentes

## Índice
1. [Visão Geral](#visão-geral)
2. [Padrões de Orquestração](#padrões-de-orquestração)
3. [Resiliência e Circuit Breakers](#resiliência-e-circuit-breakers)
4. [Observabilidade](#observabilidade)
5. [Exemplos Práticos](#exemplos-práticos)
6. [API Reference](#api-reference)

---

## Visão Geral

A arquitetura V2 dos agentes implementa **4 padrões de orquestração** inspirados em LangGraph, CrewAI e AutoGen:

```
┌─────────────────────────────────────────────────────────────┐
│                   AGENT ORCHESTRATOR                        │
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐│
│  │Sequential│   │ Parallel │   │Hierarchical│ │Collaborative│
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             CIRCUIT BREAKERS                        │   │
│  │  DJEN API  │  Todoist  │  PJe  │  Evolution API   │   │
│  │  [CLOSED]  │  [CLOSED] │ [OPEN]│    [HALF_OPEN]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             15 SPECIALIZED AGENTS                   │   │
│  │  Harvey │ Justin-e │ Monitor-DJEN │ Gestão-Prazos  │   │
│  │  ...                                                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Componentes Principais

1. **AgentOrchestrator**: Coordena execução de múltiplos agentes
2. **CircuitBreaker**: Protege APIs externas de sobrecarga
3. **AgentTrace**: Sistema de observabilidade detalhado
4. **ToolContext**: Contexto enriquecido com traceId, agentId, sessionId

---

## Padrões de Orquestração

### 1. Sequential (Sequencial)

**Quando usar**: Tarefas têm dependências entre si.

**Características**:
- Execução em ordem (A → B → C)
- Respeita dependências declaradas
- Ordenação topológica automática
- Priorização por nível (critical > high > medium > low)

**Exemplo**: Workflow de intimação
```
Justin-e analisa intimação
    ↓ (depende do resultado)
Gestão-Prazos calcula deadline
    ↓ (depende do prazo)
Justin-e cria tarefa no Todoist
```

**Código**:
```typescript
import { AgentOrchestrator, OrchestrationPatterns } from './lib/ai/agent-orchestrator';

const orchestrator = new AgentOrchestrator(agentsMap, 'sequential');
const tasks = OrchestrationPatterns.intimacaoWorkflow();
const result = await orchestrator.orchestrate(tasks);
```

---

### 2. Parallel (Paralelo)

**Quando usar**: Tarefas são independentes.

**Características**:
- Execução simultânea (A || B || C)
- Ganho de performance ~Nx mais rápido
- Ideal para análises multicritério
- Falha em um não bloqueia outros

**Exemplo**: Análise de caso
```
┌─ Análise-Risco      ─┐
├─ Pesquisa-Juris     ─┤  ⟹  Resultado consolidado
└─ Análise-Financeira ─┘
```

**Código**:
```typescript
const orchestrator = new AgentOrchestrator(agentsMap, 'parallel');
const tasks = OrchestrationPatterns.caseAnalysisParallel('CASO-123');
const result = await orchestrator.orchestrate(tasks);

// Resultado:
// - Duração: 3s (vs. 9s sequencial)
// - 3x mais rápido
```

---

### 3. Hierarchical (Hierárquico)

**Quando usar**: Há coordenador que delega tarefas.

**Características**:
- Primeiro agente é o coordenador (ex: Harvey)
- Coordenador analisa e redistribui
- Subordinados executam em paralelo
- Coordenador consolida resultados

**Exemplo**: Revisão estratégica
```
      Harvey (coordenador)
       /              \
Gestão-Prazos    Monitor-DJEN
(críticos)     (novas publicações)
```

**Código**:
```typescript
const orchestrator = new AgentOrchestrator(agentsMap, 'hierarchical');
const tasks = OrchestrationPatterns.strategicReview();
const result = await orchestrator.orchestrate(tasks);
```

---

### 4. Collaborative (Colaborativo)

**Quando usar**: Decisão precisa de consenso.

**Características**:
- Todos agentes processam mesma tarefa
- Votação/consenso no final
- Implementação atual: resultado mais comum
- Útil para validações críticas

**Exemplo**: Análise de risco complexo
```
Harvey analisa    → Voto: RISCO ALTO
Análise-Risco     → Voto: RISCO ALTO
Pesquisa-Juris    → Voto: RISCO MÉDIO
                   ───────────────────
Consenso: RISCO ALTO (maioria 2/3)
```

**Código**:
```typescript
const orchestrator = new AgentOrchestrator(agentsMap, 'collaborative');
const tasks = [{
  id: 'consensus',
  assignedTo: 'harvey', // Todos vão processar
  input: 'Analisar risco do caso XYZ',
  priority: 'high',
}];
const result = await orchestrator.orchestrate(tasks);
```

---

## Resiliência e Circuit Breakers

### Problema

APIs externas podem falhar:
- DJEN fora do ar
- Todoist com latência alta
- PJe retornando 500
- Evolution API timeout

### Solução: Circuit Breaker Pattern

Inspirado em **Netflix Hystrix** e **resilience4j**.

### Estados do Circuit Breaker

```
     5 falhas
CLOSED ────────▶ OPEN ────────▶ HALF_OPEN
  ▲                              │
  │                              │ 2 sucessos
  └──────────────────────────────┘
```

1. **CLOSED (normal)**: Tudo funcionando, requisições passam
2. **OPEN (bloqueado)**: Muitas falhas, bloqueia por 60s para proteger API
3. **HALF_OPEN (teste)**: Após timeout, permite algumas requisições de teste

### Configuração

```typescript
import { CircuitBreakerRegistry } from './lib/ai/circuit-breaker';

const breaker = CircuitBreakerRegistry.get('djen-api', {
  failureThreshold: 5,      // 5 falhas → OPEN
  successThreshold: 2,      // 2 sucessos → CLOSED
  timeout: 60000,           // 60s para tentar HALF_OPEN
  resetTimeout: 300000,     // 5min para reset
});

// Executar com proteção
const result = await breaker.execute(async () => {
  return await fetch('/api/djen/check');
});
```

### Monitoramento de Circuit Breakers

```bash
# Ver estado de todos os breakers
GET /api/observability?action=circuit-breakers

# Resposta:
{
  "summary": {
    "total": 6,
    "healthy": 4,
    "degraded": 1,
    "down": 1
  },
  "breakers": [
    {
      "name": "djen-api",
      "state": "CLOSED",
      "failures": 0,
      "successes": 15
    },
    {
      "name": "pje-api",
      "state": "OPEN",
      "failures": 5,
      "lastFailureTime": 1704123456789
    }
  ]
}
```

---

## Observabilidade

### AgentTrace: Rastreamento Completo

Cada execução gera traces detalhados:

```typescript
interface AgentTrace {
  timestamp: string;
  step: number;
  type: 'thought' | 'action' | 'observation' | 'final';
  content: string;
  toolUsed?: string;
  duration?: number;
  error?: string;
}
```

### Exemplo de Traces

```json
{
  "traces": [
    {
      "timestamp": "2024-01-01T10:00:00Z",
      "step": 1,
      "type": "thought",
      "content": "Preciso buscar a próxima intimação pendente",
      "duration": 150
    },
    {
      "timestamp": "2024-01-01T10:00:00Z",
      "step": 2,
      "type": "action",
      "content": "{\"tool\":\"buscarIntimacaoPendente\",\"args\":{}}",
      "toolUsed": "buscarIntimacaoPendente",
      "duration": 890
    },
    {
      "timestamp": "2024-01-01T10:00:01Z",
      "step": 3,
      "type": "observation",
      "content": "Encontrada intimação 123456-78.2024.5.02.0001",
      "duration": 50
    },
    {
      "timestamp": "2024-01-01T10:00:02Z",
      "step": 4,
      "type": "final",
      "content": "Intimação identificada com sucesso",
      "duration": 100
    }
  ],
  "totalDuration": 1190
}
```

### Health Check

```bash
GET /api/observability?action=health

# Resposta (sistema healthy):
{
  "ok": true,
  "status": "healthy",
  "details": {
    "apis": {
      "healthy": ["djen-api", "todoist-api"],
      "degraded": ["evolution-api"],
      "down": []
    }
  }
}

# Resposta (sistema degradado):
{
  "ok": false,
  "status": "degraded",
  "details": {
    "apis": {
      "healthy": ["todoist-api"],
      "degraded": ["evolution-api"],
      "down": ["pje-api"]
    }
  }
}
```

---

## Exemplos Práticos

### Exemplo 1: Workflow Completo de Intimação

```typescript
import { intimacaoWorkflow } from './lib/ai/orchestrator-examples';

const result = await intimacaoWorkflow({
  baseUrl: 'https://assistente-juridico-github.vercel.app',
  evolutionApiUrl: process.env.EVOLUTION_API_URL,
  evolutionApiKey: process.env.EVOLUTION_API_KEY,
});

console.log(`Sucesso: ${result.success}`);
console.log(`Duração total: ${result.totalDuration}ms`);
console.log(`Tarefas executadas: ${result.traces.length}`);
```

### Exemplo 2: Análise Paralela de Caso

```typescript
import { caseAnalysisParallel } from './lib/ai/orchestrator-examples';

const result = await caseAnalysisParallel('CASO-123', baseContext);

// Acessa resultados individuais
const riskAnalysis = result.results.get('risk-analysis');
const precedentResearch = result.results.get('precedent-research');
const financialAnalysis = result.results.get('financial-analysis');
```

### Exemplo 3: Workflow Customizado

```typescript
import { AgentOrchestrator, type AgentTask } from './lib/ai/agent-orchestrator';

const tasks: AgentTask[] = [
  {
    id: 'monitor',
    assignedTo: 'monitor-djen',
    input: 'Verificar publicações do dia',
    priority: 'critical',
  },
  {
    id: 'analyze',
    assignedTo: 'analise-risco',
    input: 'Analisar riscos das publicações',
    priority: 'high',
    dependencies: ['monitor'], // Depende de monitor
  },
  {
    id: 'notify',
    assignedTo: 'comunicacao-clientes',
    input: 'Notificar clientes afetados',
    priority: 'high',
    dependencies: ['analyze'], // Depende de analyze
  },
];

const orchestrator = new AgentOrchestrator(agentsMap, 'sequential');
const result = await orchestrator.orchestrate(tasks);
```

---

## API Reference

### AgentOrchestrator

```typescript
class AgentOrchestrator {
  constructor(
    agents: Map<string, SimpleAgent>,
    pattern: OrchestrationPattern
  )

  async orchestrate(tasks: AgentTask[]): Promise<OrchestrationResult>
}
```

### AgentTask

```typescript
interface AgentTask {
  id: string;                // Identificador único
  assignedTo: string;        // ID do agente
  input: string;             // Mensagem de entrada
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies?: string[];   // IDs de tasks que devem executar antes
  timeout?: number;          // Timeout em ms (padrão: 60000)
}
```

### OrchestrationResult

```typescript
interface OrchestrationResult {
  success: boolean;
  results: Map<string, any>;
  traces: Array<{
    agentId: string;
    taskId: string;
    result: any;
    duration: number;
    error?: string;
  }>;
  totalDuration: number;
}
```

### CircuitBreaker

```typescript
class CircuitBreaker {
  constructor(name: string, config?: Partial<CircuitBreakerConfig>)
  
  async execute<T>(fn: () => Promise<T>): Promise<T>
  reset(): void
  getStats(): CircuitBreakerStats
  isAvailable(): boolean
}
```

### CircuitBreakerConfig

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;   // Falhas para abrir (padrão: 5)
  successThreshold: number;   // Sucessos para fechar (padrão: 2)
  timeout: number;            // Timeout para HALF_OPEN (padrão: 60s)
  resetTimeout: number;       // Timeout para reset (padrão: 5min)
}
```

---

## Próximos Passos

### Produção Checklist

- [ ] Implementar `UpstashMemoryStore` para memória persistente
- [ ] Adicionar autenticação no endpoint `/api/observability`
- [ ] Configurar alertas quando circuit breaker abre
- [ ] Implementar rate limiting por agente
- [ ] Criar dashboard de visualização de traces
- [ ] Adicionar métricas Prometheus/Grafana
- [ ] Implementar retry com backoff exponencial nas tools
- [ ] Criar testes de carga para orquestração paralela

### Melhorias Futuras

- [ ] Pattern "Event-Driven" com webhooks
- [ ] Pattern "Hybrid" combinando múltiplos
- [ ] Votação ponderada no modo Collaborative
- [ ] Circuit breaker por agente (não só por API)
- [ ] Tracing distribuído com OpenTelemetry
- [ ] Compensação automática em caso de falhas (Saga pattern)

---

## Referências

- **ReAct Pattern**: Yao et al. (2022) - "ReAct: Synergizing Reasoning and Acting in Language Models"
- **LangChain**: Framework para aplicações LLM com agents
- **LangGraph**: Orquestração de múltiplos agentes (graphs)
- **CrewAI**: Framework multi-agent com hierarquia
- **AutoGen**: Framework Microsoft para conversação multi-agent
- **Netflix Hystrix**: Circuit breaker pattern original
- **resilience4j**: Biblioteca Java de fault tolerance

---

**Versão**: 2.0  
**Data**: 2024  
**Autor**: Assistente Jurídico AI System  
