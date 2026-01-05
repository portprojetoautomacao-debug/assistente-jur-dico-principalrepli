# Sistema de Agentes IA - Documentação Completa

## 📋 Visão Geral

O Sistema de Agentes IA é uma arquitetura modular e escalável que permite a automação inteligente de tarefas jurídicas através de múltiplos agentes especializados trabalhando de forma autônoma e colaborativa.

## 🏗️ Arquitetura

### Componentes Principais

```
src/lib/
├── agents.ts                    # Tipos e funções core do sistema
├── agent-orchestrator.ts        # Orquestração e distribuição de tarefas
├── agent-communication.ts       # Sistema de comunicação entre agentes
├── real-agent-client.ts         # Cliente para IA real (Spark LLM)
├── agents/
│   └── todoist-agent.ts        # Agente especializado em Todoist
└── djen-monitor-agent.ts       # Agente de monitoramento DJEN

src/hooks/
└── use-autonomous-agents.ts    # Hook React para gerenciar agentes
```

## 🤖 Agentes Disponíveis (15 Total)

### 1. Harvey Specter (`harvey`) ⭐
**Função:** Assistente jurídico estratégico que analisa performance, processos, prazos e finanças do escritório em tempo real
**Tipo:** Strategic
**Status:** Ativo por padrão
**Capacidades:**
- `strategic-analysis` - Análise estratégica
- `performance-monitoring` - Monitoramento de performance
- `risk-identification` - Identificação de riscos
- `data-analysis` - Análise de dados

### 2. Mrs. Justin-e (`justine`) ⭐
**Função:** Especialista em análise automática de intimações com foco em identificação de prazos, providências e geração de tarefas
**Tipo:** Intimation Analyzer
**Status:** Ativo por padrão
**Capacidades:**
- `intimation-analysis` - Análise de intimações
- `deadline-identification` - Identificação de prazos
- `task-generation` - Geração de tarefas
- `priority-assessment` - Avaliação de prioridade

### 3. Análise Documental (`analise-documental`) ⭐
**Função:** Analisa automaticamente expedientes, intimações e documentos do PJe 24/7, extraindo informações estruturadas
**Tipo:** Analyzer
**Status:** Ativo por padrão
**Capacidades:**
- `document-analysis` - Análise de documentos
- `text-extraction` - Extração de texto
- `entity-recognition` - Reconhecimento de entidades
- `classification` - Classificação

### 4. Monitor DJEN (`monitor-djen`) ⭐
**Função:** Monitora automaticamente o Diário de Justiça Eletrônico Nacional (DJEN) e DataJud para novas publicações relevantes
**Tipo:** Monitor
**Status:** Ativo por padrão
**Capacidades:**
- `djen-monitoring` - Monitoramento DJEN
- `publication-detection` - Detecção de publicações
- `notification` - Notificação
- `datajud-integration` - Integração DataJud

**Configuração:**
```typescript
import { criarMonitorDJEN } from '@/lib/djen-monitor-agent'

const monitor = criarMonitorDJEN({
  tribunais: ['TJSP', 'TJRJ'],
  advogados: [
    { nome: 'João Silva', oab: 'SP123456' }
  ],
  intervaloHoras: 1,
  maxRetries: 3,
  retryDelayMs: 5000,
  notificarCallback: (publicacoes) => {
    console.log('Novas publicações:', publicacoes)
  }
})

monitor.iniciar()
```

### 5. Gestão de Prazos (`gestao-prazos`) ⭐
**Função:** Calcula e acompanha prazos processuais automaticamente, gerando alertas e priorizando ações
**Tipo:** Calculator
**Status:** Ativo por padrão
**Capacidades:**
- `deadline-calculation` - Cálculo de prazos
- `business-days` - Dias úteis
- `holiday-detection` - Detecção de feriados
- `alert-generation` - Geração de alertas

**Uso:**
```typescript
import { calcularPrazoCPC } from '@/lib/prazos'

const dataInicio = new Date('2025-01-06')
const prazoFinal = calcularPrazoCPC(dataInicio, 15) // 15 dias úteis
```

### 6. Redação de Petições (`redacao-peticoes`)
**Função:** Auxilia na criação de petições e documentos jurídicos profissionais com base nos autos e precedentes
**Tipo:** Writer
**Status:** Inativo por padrão (ativar quando necessário)
**Capacidades:**
- `document-drafting` - Redação de documentos
- `legal-writing` - Escrita jurídica
- `template-generation` - Geração de templates
- `precedent-integration` - Integração de precedentes

### 7. Organização de Arquivos (`organizacao-arquivos`)
**Função:** Organiza e categoriza automaticamente documentos do escritório por processo, tipo e relevância
**Tipo:** Organizer
**Status:** Inativo por padrão
**Capacidades:**
- `file-organization` - Organização de arquivos
- `categorization` - Categorização
- `indexing` - Indexação
- `duplicate-detection` - Detecção de duplicatas

### 8. Pesquisa Jurisprudencial (`pesquisa-juris`)
**Função:** Busca e analisa precedentes e jurisprudências relevantes automaticamente em tribunais superiores
**Tipo:** Researcher
**Status:** Inativo por padrão
**Capacidades:**
- `jurisprudence-search` - Busca de jurisprudência
- `precedent-analysis` - Análise de precedentes
- `case-law-research` - Pesquisa de casos
- `trend-analysis` - Análise de tendências

### 9. Análise de Risco (`analise-risco`)
**Função:** Avalia riscos processuais, financeiros e estratégicos de cada caso com base em dados e precedentes
**Tipo:** Risk Analyzer
**Status:** Inativo por padrão
**Capacidades:**
- `risk-assessment` - Avaliação de riscos
- `probability-analysis` - Análise de probabilidade
- `financial-impact` - Impacto financeiro
- `mitigation-strategies` - Estratégias de mitigação

### 10. Revisão Contratual (`revisao-contratual`)
**Função:** Analisa contratos identificando cláusulas problemáticas, riscos e pontos de não conformidade
**Tipo:** Contract Reviewer
**Status:** Inativo por padrão
**Capacidades:**
- `contract-analysis` - Análise de contratos
- `clause-review` - Revisão de cláusulas
- `compliance-check` - Verificação de conformidade
- `risk-identification` - Identificação de riscos

### 11. Comunicação com Clientes (`comunicacao-clientes`)
**Função:** Gera comunicações personalizadas e relatórios para clientes em linguagem acessível e respeitosa
**Tipo:** Communicator
**Status:** Inativo por padrão
**Capacidades:**
- `client-communication` - Comunicação com clientes
- `report-generation` - Geração de relatórios
- `language-simplification` - Simplificação de linguagem
- `personalization` - Personalização

### 12. Análise Financeira (`financeiro`)
**Função:** Monitora faturamento, recebimentos e análises de rentabilidade do escritório com base em dados reais
**Tipo:** Financial Analyzer
**Status:** Inativo por padrão
**Capacidades:**
- `financial-monitoring` - Monitoramento financeiro
- `profitability-analysis` - Análise de rentabilidade
- `receivables-tracking` - Rastreamento de recebíveis
- `metrics-calculation` - Cálculo de métricas

### 13. Estratégia Processual (`estrategia-processual`)
**Função:** Sugere estratégias processuais baseadas em análise de dados, precedentes e probabilidade de sucesso
**Tipo:** Strategy Advisor
**Status:** Inativo por padrão
**Capacidades:**
- `strategic-planning` - Planejamento estratégico
- `option-analysis` - Análise de opções
- `cost-benefit` - Custo-benefício
- `success-probability` - Probabilidade de sucesso

### 14. Tradução Jurídica (`traducao-juridica`)
**Função:** Traduz termos técnicos jurídicos para linguagem simples e vice-versa, mantendo precisão
**Tipo:** Translator
**Status:** Inativo por padrão
**Capacidades:**
- `legal-translation` - Tradução jurídica
- `term-explanation` - Explicação de termos
- `glossary-creation` - Criação de glossário
- `language-adaptation` - Adaptação de linguagem

### 15. Compliance (`compliance`)
**Função:** Verifica conformidade com LGPD, Código de Ética da OAB, normas trabalhistas e regulatórias
**Tipo:** Compliance Checker
**Status:** Inativo por padrão
**Capacidades:**
- `compliance-check` - Verificação de conformidade
- `lgpd-verification` - Verificação LGPD
- `ethics-review` - Revisão ética
- `regulatory-audit` - Auditoria regulatória

## 🔧 Uso Básico

### Inicializando Agentes

```typescript
import { useAutonomousAgents } from '@/hooks/use-autonomous-agents'

function MyComponent() {
  const {
    agents,
    taskQueue,
    completedTasks,
    addTask,
    toggleAgent,
    useRealAI,
    toggleRealAI
  } = useAutonomousAgents()

  // Ativar/desativar um agente
  const handleToggleAgent = (agentId: string) => {
    toggleAgent(agentId)
  }

  // Adicionar uma tarefa
  const handleAddTask = () => {
    addTask({
      id: crypto.randomUUID(),
      agentId: 'djen-monitor',
      type: 'monitor-djen',
      priority: 'high',
      status: 'queued',
      createdAt: new Date().toISOString(),
      data: {
        description: 'Verificar publicações DJEN'
      }
    })
  }

  return (
    <div>
      {agents.map(agent => (
        <div key={agent.id}>
          <h3>{agent.name}</h3>
          <p>{agent.description}</p>
          <button onClick={() => handleToggleAgent(agent.id)}>
            {agent.enabled ? 'Desativar' : 'Ativar'}
          </button>
        </div>
      ))}
    </div>
  )
}
```

### Criando Tarefas Personalizadas

```typescript
import type { AgentTask } from '@/lib/agents'

const task: AgentTask = {
  id: crypto.randomUUID(),
  agentId: 'document-analyzer',
  type: 'analyze-document',
  priority: 'high',
  status: 'queued',
  createdAt: new Date().toISOString(),
  data: {
    documentId: 'doc-123',
    documentType: 'petition',
    analysisType: 'full'
  }
}

addTask(task)
```

## 🎯 Orquestração de Agentes

### Distribuição Automática de Tarefas

```typescript
import { globalOrchestrator } from '@/lib/agent-orchestrator'

// Configurar orquestrador
globalOrchestrator.updateConfig({
  maxConcurrentTasks: 5,
  enableLoadBalancing: true,
  enablePrioritization: true,
  useRealAI: false
})

// Distribuir tarefa para o agente mais adequado
const agent = await globalOrchestrator.distributeTask(task, agents)

if (agent) {
  const result = await globalOrchestrator.processTask(task, agent)
  console.log('Resultado:', result)
}
```

### Métricas de Orquestração

```typescript
const metrics = globalOrchestrator.getMetrics()

console.log('Total de tarefas processadas:', metrics.totalTasksProcessed)
console.log('Taxa de sucesso:', metrics.successRate)
console.log('Tempo médio de processamento:', metrics.averageProcessingTime)
console.log('Agentes ativos:', metrics.activeAgents)
console.log('Tarefas na fila:', metrics.queuedTasks)
```

## 💬 Comunicação Entre Agentes

### Enviando Mensagens

```typescript
import { communicationHub } from '@/lib/agent-communication'

// Enviar mensagem para um agente específico
communicationHub.sendMessage({
  fromAgentId: 'djen-monitor',
  toAgentId: 'deadline-calculator',
  type: 'request',
  priority: 'high',
  content: 'Calcular prazo para publicação encontrada',
  data: {
    publicationDate: '2025-01-15',
    processNumber: '1234567-89.2025.8.26.0000'
  }
})

// Broadcast para todos os agentes
communicationHub.sendMessage({
  fromAgentId: 'djen-monitor',
  type: 'alert',
  priority: 'critical',
  content: 'Publicação urgente detectada!'
})
```

### Compartilhando Contexto

```typescript
import { shareContext } from '@/lib/agent-communication'

// Compartilhar contexto entre agentes
shareContext(
  'djen-monitor',
  'publication-context',
  {
    processNumber: '1234567-89.2025.8.26.0000',
    publicationDate: '2025-01-15',
    tribunal: 'TJSP',
    urgency: 'high'
  },
  ['deadline-calculator', 'document-analyzer'] // Agentes com acesso
)
```

### Inscrevendo-se para Receber Mensagens

```typescript
// Inscrever agente para receber mensagens
const unsubscribe = communicationHub.subscribe(
  'deadline-calculator',
  (message) => {
    console.log('Mensagem recebida:', message)
    
    if (message.type === 'request') {
      // Processar requisição
      const result = processRequest(message.data)
      
      // Responder
      communicationHub.sendMessage({
        fromAgentId: 'deadline-calculator',
        toAgentId: message.fromAgentId,
        type: 'response',
        priority: message.priority,
        content: 'Prazo calculado',
        data: result
      })
    }
  }
)

// Cancelar inscrição quando não for mais necessário
unsubscribe()
```

## 🔄 Human-in-the-Loop

### Pausando para Revisão Humana

O sistema automaticamente pausa tarefas que requerem supervisão humana:

```typescript
import { shouldPauseForHuman } from '@/lib/agents'

if (shouldPauseForHuman(agent, task)) {
  // Tarefa requer revisão humana
  // Notificar usuário
  notifyUser('Tarefa requer sua atenção')
}
```

**Critérios para pausa automática:**
- Tarefas com prioridade `critical`
- Tarefas que falharam múltiplas vezes
- Tipos sensíveis: `petition-filing`, `contract-signing`, `payment-processing`, `client-communication`, `legal-advice`

### Retomando Após Intervenção

```typescript
import { canResumeAfterHuman } from '@/lib/agents'

if (canResumeAfterHuman(task)) {
  // Tarefa pode ser retomada
  resumeTask(task)
}
```

## 🧪 Testes

### Executando Testes

```bash
# Testar sistema de agentes
npm test -- src/lib/agents.test.ts

# Testar cálculo de prazos
npm test -- src/lib/prazos.test.ts

# Testar todos os agentes
npm test -- src/lib --run
```

### Exemplo de Teste

```typescript
import { describe, it, expect } from 'vitest'
import { processTaskWithAI } from '@/lib/agents'

describe('Agent Task Processing', () => {
  it('should process monitoring task', async () => {
    const task = {
      id: '1',
      agentId: 'djen-monitor',
      type: 'monitor-djen',
      priority: 'high',
      status: 'queued',
      createdAt: new Date().toISOString(),
      data: {}
    }

    const agent = {
      id: 'djen-monitor',
      name: 'DJEN Monitor',
      type: 'monitor',
      // ... outros campos
    }

    const result = await processTaskWithAI(task, agent)
    
    expect(result.success).toBe(true)
    expect(result.message).toBeDefined()
  })
})
```

## 🚀 Modo IA Real vs Simulado

### Modo Simulado (Padrão)
- Usa lógica simulada para processar tarefas
- Não consome recursos de IA externa
- Ideal para desenvolvimento e testes

### Modo IA Real
- Usa Spark LLM (GPT-4) para processar tarefas
- Integração com APIs externas (DJEN, DataJud)
- Respostas mais precisas e contextualizadas

```typescript
// Ativar modo IA real
toggleRealAI()

// Verificar se está ativo
if (useRealAI && isRealAgentsEnabled()) {
  console.log('Modo IA Real ativado')
}
```

## 📊 Monitoramento e Métricas

### Métricas de Agentes

```typescript
agents.forEach(agent => {
  console.log(`${agent.name}:`)
  console.log(`  Status: ${agent.status}`)
  console.log(`  Tarefas concluídas: ${agent.tasksCompleted}`)
  console.log(`  Tarefas hoje: ${agent.tasksToday}`)
  console.log(`  Última atividade: ${agent.lastActivity}`)
})
```

### Log de Atividades

```typescript
activityLog.forEach(log => {
  console.log(`[${log.timestamp}] ${log.agentId}: ${log.action} (${log.result})`)
})
```

## 🔒 Segurança e Boas Práticas

### 1. Validação de Tarefas
Sempre valide dados de entrada antes de processar:

```typescript
function validateTask(task: AgentTask): boolean {
  if (!task.id || !task.agentId || !task.type) {
    return false
  }
  
  if (!['low', 'medium', 'high', 'critical'].includes(task.priority)) {
    return false
  }
  
  return true
}
```

### 2. Timeout de Tarefas
Configure timeouts apropriados:

```typescript
globalOrchestrator.updateConfig({
  taskTimeout: 300000 // 5 minutos
})
```

### 3. Limite de Tentativas
Configure retry logic com backoff exponencial:

```typescript
const monitor = criarMonitorDJEN({
  maxRetries: 3,
  retryDelayMs: 5000 // 5 segundos, com backoff exponencial
})
```

### 4. Sanitização de Dados
Sempre sanitize dados antes de processar:

```typescript
function sanitizeTaskData(data: Record<string, unknown>): Record<string, unknown> {
  // Remover campos sensíveis
  const { password, apiKey, secret, ...safe } = data
  return safe
}
```

## 🐛 Troubleshooting

### Agente não está processando tarefas

1. Verificar se o agente está habilitado:
```typescript
if (!agent.enabled) {
  console.log('Agente desabilitado')
}
```

2. Verificar se há tarefas na fila:
```typescript
const agentTasks = taskQueue.filter(t => t.agentId === agent.id)
console.log('Tarefas na fila:', agentTasks.length)
```

3. Verificar status do agente:
```typescript
if (agent.status === 'paused') {
  console.log('Agente pausado')
}
```

### Tarefas falhando constantemente

1. Verificar logs de erro:
```typescript
const failedTasks = taskQueue.filter(t => t.status === 'failed')
failedTasks.forEach(t => console.log('Erro:', t.error))
```

2. Verificar configuração de retry:
```typescript
if (task.retryCount >= task.maxRetries) {
  console.log('Máximo de tentativas atingido')
}
```

### Performance degradada

1. Verificar número de tarefas concorrentes:
```typescript
const metrics = globalOrchestrator.getMetrics()
if (metrics.queuedTasks > 10) {
  console.warn('Muitas tarefas na fila')
}
```

2. Verificar tempo médio de processamento:
```typescript
if (metrics.averageProcessingTime > 10000) {
  console.warn('Processamento lento')
}
```

## 📚 Recursos Adicionais

- [Documentação do Spark LLM](./api.githubcopilot.com.md)
- [Integração DJEN](./DJEN_DOCUMENTATION.md)
- [Cálculo de Prazos](./src/lib/prazos.ts)
- [Testes](./src/lib/agents.test.ts)

## 🤝 Contribuindo

Para adicionar um novo agente:

1. Defina as capacidades do agente em `DEFAULT_AGENTS`
2. Implemente a lógica específica em `src/lib/agents/`
3. Adicione testes em `src/lib/agents/*.test.ts`
4. Atualize esta documentação

## 📝 Changelog

### v2.0.0 (2025-01-23)
- ✅ Sistema completo de tipos e interfaces
- ✅ Orquestrador de agentes com load balancing
- ✅ Sistema de comunicação entre agentes
- ✅ Human-in-the-loop com pausas automáticas
- ✅ Retry logic com backoff exponencial
- ✅ Testes abrangentes (14 testes passando)
- ✅ Documentação completa

### v1.0.0
- Sistema básico de agentes
- Integração com Todoist
- Monitor DJEN
