# Sentry AI Agents Monitoring - Guia Completo Atualizado ✅

Este documento descreve a integração OFICIAL do **Sentry AI Agents Monitoring** com o sistema Assistente Jurídico PJe, seguindo as **práticas da documentação oficial** do Sentry (Dezembro 2025).

## 📋 Resumo das Mudanças

### O que mudou na v2.0.0?

| Aspecto | v1 (Antigo) | v2 (Novo - Oficial) |
|---------|-------------|---------------------|
| **Implementação** | Custom wrapper | Seguindo convenções OpenTelemetry oficiais |
| **Opções** | `includePrompts`, `captureErrors` | `recordInputs`, `recordOutputs` (padrão SDK) |
| **Spans** | Genéricos | `gen_ai.invoke_agent`, `gen_ai.chat`, `gen_ai.execute_tool`, `gen_ai.handoff` |
| **Atributos** | Customizados | Seguindo spec OpenTelemetry (`gen_ai.*`) |
| **Integração** | Manual (wrapper functions) | Spans manuais + `googleGenAIIntegration()` (quando disponível) |
| **Conversação** | Não suportada | `conversation.session_id`, `conversation.turn` |
| **Tool Calling** | Não suportado | `gen_ai.execute_tool` com input/output |
| **Handoff** | Não suportado | `gen_ai.handoff` entre agentes |

### Arquivos Novos

```
src/lib/sentry-gemini-integration-v2.ts  # ✅ Nova implementação oficial
docs/SENTRY_AI_AGENTS_EXAMPLES.tsx       # ✅ 6 exemplos práticos
docs/SENTRY_AI_MONITORING.md            # ✅ Este guia
```

### Arquivos Mantidos (compatibilidade)

```
src/lib/sentry-gemini-integration.ts     # ⚠️ Legacy (não remover ainda)
```

## 🎯 Por que migrar para v2?

### Benefícios da nova implementação:

1. **Compatibilidade** com dashboard oficial do Sentry AI Agents
2. **Padronização** - Segue spec OpenTelemetry reconhecida pela indústria
3. **Mais métricas** - Token usage, tool calls, handoffs, conversação
4. **Melhor análise** - Queries e filtros mais poderosos no Sentry.io
5. **Futureproof** - Quando `googleGenAIIntegration()` estiver disponível, migração fácil

## 📊 Convenções OpenTelemetry (Oficial)

### Tipos de Operations (op)

| op | Descrição | Quando usar |
|----|-----------|-------------|
| `gen_ai.invoke_agent` | Invocação completa de agente | Rastrear agente do início ao fim |
| `gen_ai.chat` | Chamada individual ao LLM | Cada request/response do modelo |
| `gen_ai.execute_tool` | Execução de ferramenta | Function calling, busca em KB, etc |
| `gen_ai.handoff` | Transferência entre agentes | Quando um agente passa contexto para outro |

### Atributos Obrigatórios

| Atributo | Tipo | Exemplo |
|----------|------|---------|
| `gen_ai.system` | string | `"gcp.gemini"`, `"openai"`, `"custom-llm"` |
| `gen_ai.request.model` | string | `"gemini-2.5-pro"`, `"gpt-4"` |
| `gen_ai.operation.name` | string | `"invoke_agent"`, `"chat"` |

### Atributos Opcionais (mas recomendados)

| Atributo | Tipo | Descrição |
|----------|------|-----------|
| `gen_ai.agent.name` | string | Nome do agente (ex: "Harvey Specter") |
| `gen_ai.request.temperature` | float | 0.0 - 1.0 |
| `gen_ai.request.max_tokens` | int | Limite de tokens |
| `gen_ai.request.messages` | string | JSON stringified: `"[{role:'user',content:'...'}]"` |
| `gen_ai.response.text` | string | JSON stringified: `"['Resposta do LLM']"` |
| `gen_ai.usage.input_tokens` | int | Tokens de entrada (prompt) |
| `gen_ai.usage.output_tokens` | int | Tokens de saída (resposta) |
| `gen_ai.usage.total_tokens` | int | Total usado |
| `conversation.session_id` | string | ID único da conversa |
| `conversation.turn` | int | Número do turno (incrementa cada mensagem) |

## 🔧 Setup Inicial

### 1. Instalar dependências (já instaladas)

```bash
npm install @sentry/react@latest
```

### 2. Inicializar Sentry (`src/services/error-tracking.ts`)

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://<key>@<org>.ingest.sentry.io/<project>",
  
  // ⚠️ IMPORTANTE: Define se grava prompts/outputs
  // true = grava (útil dev), false = não grava (LGPD prod)
  sendDefaultPii: process.env.NODE_ENV === "development",
  
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  integrations: [
    Sentry.browserTracingIntegration(),
    // googleGenAIIntegration() ainda não disponível em @sentry/react v10
    // Use spans manuais (createInvokeAgentSpan, etc)
  ],
});
```

### 3. Configurar opções de PII

```typescript
import { setGeminiIntegrationOptions } from '@/lib/sentry-gemini-integration-v2';

// Produção: não gravar prompts/outputs (LGPD)
if (process.env.NODE_ENV === "production") {
  setGeminiIntegrationOptions({
    recordInputs: false,
    recordOutputs: false
  });
}

// Desenvolvimento: gravar tudo para debug
else {
  setGeminiIntegrationOptions({
    recordInputs: true,
    recordOutputs: true
  });
}
```

## 💻 Exemplos de Uso

### Exemplo 1: Invoke Agent Simples

```typescript
import { createInvokeAgentSpan } from '@/lib/sentry-gemini-integration-v2';

async function analisarIntimacao(expedienteId: string) {
  const result = await createInvokeAgentSpan(
    {
      agentName: "Mrs. Justin-e",
      system: "gcp.gemini",
      model: "gemini-2.5-pro",
      temperature: 0.7
    },
    {
      sessionId: `expediente_${expedienteId}`,
      turn: 1
    },
    async (span) => {
      // Chama Gemini API
      const response = await callGeminiAPI({
        prompt: "Analyze this legal intimation..."
      });
      
      // Atribui resposta ao span
      span?.setAttribute("gen_ai.response.text", JSON.stringify([response.text]));
      span?.setAttribute("gen_ai.usage.total_tokens", response.usage.totalTokens);
      span?.setAttribute("conversation.resolution_status", "resolved");
      
      return response;
    }
  );
  
  return result;
}
```

**Resultado no Sentry:**
- ✅ Span com `op: gen_ai.invoke_agent`
- ✅ Nome: `invoke_agent Mrs. Justin-e`
- ✅ Duração, tokens, status
- ✅ Aparece no AI Agents Dashboard

### Exemplo 2: Agente com Tool Calling

```typescript
import {
  createInvokeAgentSpan,
  createChatSpan,
  createExecuteToolSpan
} from '@/lib/sentry-gemini-integration-v2';

async function processarExpedienteComFerramentas(expediente: Expediente) {
  return createInvokeAgentSpan(
    {
      agentName: "Mrs. Justin-e",
      system: "gcp.gemini",
      model: "gemini-2.5-pro"
    },
    {
      sessionId: `exp_${expediente.id}`,
      turn: 1
    },
    async (agentSpan) => {
      // 1. LLM decide se precisa de ferramenta
      const llmResponse = await createChatSpan(
        { agentName: "Mrs. Justin-e", system: "gcp.gemini", model: "gemini-2.5-pro" },
        [{ role: "user", content: expediente.conteudo }],
        async (chatSpan) => {
          const response = await callGeminiAPI({ prompt: expediente.conteudo });
          chatSpan?.setAttribute("gen_ai.response.text", JSON.stringify([response.text]));
          
          if (response.toolCalls) {
            chatSpan?.setAttribute("gen_ai.response.tool_calls", JSON.stringify(response.toolCalls));
          }
          
          return response;
        }
      );
      
      // 2. Se houver tool calls, executa
      if (llmResponse.toolCalls) {
        for (const toolCall of llmResponse.toolCalls) {
          await createExecuteToolSpan(
            { agentName: "Mrs. Justin-e", system: "gcp.gemini", model: "gemini-2.5-pro" },
            {
              toolName: toolCall.name,
              toolType: "function",
              toolInput: JSON.stringify(toolCall.arguments)
            },
            async (toolSpan) => {
              const output = await executeTool(toolCall.name, toolCall.arguments);
              toolSpan?.setAttribute("gen_ai.tool.output", JSON.stringify(output));
              return output;
            }
          );
        }
      }
      
      // 3. Atributos finais do agente
      agentSpan?.setAttribute("gen_ai.response.text", llmResponse.text);
      agentSpan?.setAttribute("conversation.tools_used", llmResponse.toolCalls?.length || 0);
      
      return llmResponse;
    }
  );
}
```

### Exemplo 3: Handoff Entre Agentes

```typescript
import { createHandoffSpan } from '@/lib/sentry-gemini-integration-v2';

async function processarComHandoff(processo: Process) {
  // 1. Harvey analisa estratégia
  const harveyDecision = await createInvokeAgentSpan(
    { agentName: "Harvey Specter", system: "gcp.gemini", model: "gemini-2.5-pro" },
    { sessionId: `proc_${processo.id}`, turn: 1 },
    async (span) => {
      const decision = await analyzeStrategy(processo);
      span?.setAttribute("gen_ai.response.text", JSON.stringify([decision.text]));
      return decision;
    }
  );
  
  // 2. Harvey decide transferir para Justin-e
  if (harveyDecision.needsIntimationAnalysis) {
    // Marca handoff
    await createHandoffSpan("Harvey Specter", "Mrs. Justin-e");
    
    // 3. Mrs. Justin-e assume
    const justinResult = await createInvokeAgentSpan(
      { agentName: "Mrs. Justin-e", system: "gcp.gemini", model: "gemini-2.5-pro" },
      { sessionId: `proc_${processo.id}`, turn: 2 },
      async (span) => {
        const analysis = await analyzeIntimation(processo);
        span?.setAttribute("gen_ai.response.text", JSON.stringify([analysis.text]));
        return analysis;
      }
    );
    
    return justinResult;
  }
  
  return harveyDecision;
}
```

### Exemplo 4: Hook React

```typescript
import { useAIInstrumentation } from '@/lib/sentry-gemini-integration-v2';
import { useState, useEffect } from 'react';

function ChatComponent() {
  const { invokeAgent } = useAIInstrumentation();
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    // Client-side only para evitar hydration mismatch
    setSessionId(`session_${Date.now()}`);
  }, []);
  
  const handleSend = async (userMessage: string) => {
    const response = await invokeAgent(
      {
        agentName: "Legal Assistant",
        system: "gcp.gemini",
        model: "gemini-2.5-pro"
      },
      {
        sessionId,
        turn: messages.length + 1,
        messages: [
          { role: "system", content: "You are a legal assistant" },
          ...messages,
          { role: "user", content: userMessage }
        ]
      },
      async (span) => {
        const aiResponse = await callAIBackend(userMessage);
        
        span?.setAttribute("gen_ai.response.text", aiResponse.message);
        span?.setAttribute("gen_ai.usage.total_tokens", aiResponse.tokens);
        
        return aiResponse;
      }
    );
    
    setMessages([...messages, 
      { role: "user", content: userMessage },
      { role: "assistant", content: response.message }
    ]);
  };
  
  return <div>{/* UI */}</div>;
}
```

## 📈 Monitoramento no Sentry.io

### Onde ver os dados

1. **AI Agents Dashboard**: https://sentry.io/orgredirect/organizations/:orgslug/insights/ai/agents/
2. **Traces Explorer**: https://sentry.io/orgredirect/organizations/:orgslug/explore/traces/
3. **Metrics**: https://sentry.io/orgredirect/organizations/:orgslug/explore/metrics/

### Queries Úteis

**Latência média por agente:**
```
avg(span.duration) 
WHERE op:gen_ai.invoke_agent 
GROUP BY gen_ai.agent.name
```

**Total de tokens por modelo:**
```
sum(gen_ai.usage.total_tokens) 
WHERE op:gen_ai.chat 
GROUP BY gen_ai.request.model
```

**Taxa de erro por agente:**
```
count(*) WHERE op:gen_ai.invoke_agent AND status:error 
/ count(*) WHERE op:gen_ai.invoke_agent
GROUP BY gen_ai.agent.name
```

**Ferramentas mais usadas:**
```
count(*) 
WHERE op:gen_ai.execute_tool 
GROUP BY gen_ai.tool.name
```

## 🔒 LGPD e Segurança

### Configuração Recomendada para Produção

```typescript
// src/services/error-tracking.ts

Sentry.init({
  dsn: "...",
  
  // ❌ Não gravar PII em produção
  sendDefaultPii: false,
  
  beforeSend(event) {
    // Filtra dados sensíveis
    if (event.contexts?.ai) {
      delete event.contexts.ai.prompt;
      delete event.contexts.ai.response;
    }
    return event;
  }
});

// Configurar opções globais
setGeminiIntegrationOptions({
  recordInputs: false,   // ❌ Não grava prompts
  recordOutputs: false   // ❌ Não grava respostas
});
```

### O que você ainda terá (sem PII):

- ✅ Latência de todas as chamadas
- ✅ Uso de tokens (input/output/total)
- ✅ Nomes de agentes e modelos
- ✅ Nomes de ferramentas executadas
- ✅ Taxa de erro e sucesso
- ✅ Traces completos (sem conteúdo)

## 🔄 Migração v1 → v2

### Antes (v1):

```typescript
import { instrumentGeminiCall } from '@/lib/sentry-gemini-integration';

const wrapper = instrumentGeminiCall(
  {
    model: "gemini-2.5-pro",
    operation: "generate_content",
    prompt: "Analyze this",
    startTime: Date.now()
  },
  { includePrompts: true, captureErrors: true }
);

const result = await wrapper(async () => {
  return await callGeminiAPI();
});
```

### Depois (v2):

```typescript
import { createInvokeAgentSpan } from '@/lib/sentry-gemini-integration-v2';

const result = await createInvokeAgentSpan(
  {
    agentName: "My Agent",
    system: "gcp.gemini",
    model: "gemini-2.5-pro"
  },
  { sessionId: "session_123", turn: 1 },
  async (span) => {
    const response = await callGeminiAPI();
    span?.setAttribute("gen_ai.response.text", response.text);
    span?.setAttribute("gen_ai.usage.total_tokens", response.tokens);
    return response;
  }
);
```

## ✅ Checklist de Implementação (ATUALIZADO - Fase 3 Completa)

### Fase 1: Infraestrutura (100% Completo) ✅
- [x] ✅ Criar `sentry-gemini-integration-v2.ts`
- [x] ✅ Adicionar exemplos em `SENTRY_AI_AGENTS_EXAMPLES.tsx`
- [x] ✅ Documentar em `SENTRY_AI_MONITORING.md`
- [x] ✅ Criar schemas Zod (agent, expediente, process)
- [x] ✅ Criar hooks validated (processes, expedientes, clientes, minutas)
- [x] ✅ Implementar lazy loading em 14 componentes pesados
- [x] ✅ Criar testes unitários para schemas Zod (18 testes)

### Fase 2: Instrumentação Inicial (100% Completo) ✅
- [x] ✅ Migrar agente `Harvey Specter` para v2
- [x] ✅ Migrar agente `Mrs. Justin-e` para v2
- [x] ✅ Instrumentar agente `Redação de Petições` com createChatSpan
- [x] ✅ Instrumentar agente `Monitor DJEN` com createInvokeAgentSpan (corrigido)

### Fase 3: Instrumentação Avançada (100% Completo) ✅
- [x] ✅ Instrumentar agente `Gestão de Prazos`
- [x] ✅ Instrumentar agente `Análise Documental` (com tool calling)
- [x] ✅ Instrumentar agente `Pesquisa Jurisprudencial` (Chat + Tool)
- [x] ✅ Instrumentar agente `Análise de Risco` (Chat com heurísticas)
- [x] ✅ Instrumentar agente `Estratégia Processual` (Handoff + Chat)

### Fase 4: Instrumentação Final (Pendente)
- [ ] 🔄 Instrumentar agentes restantes (6/15 pendentes)
  - [ ] Comunicação com Clientes
  - [ ] Revisão Contratual
  - [ ] Compliance
  - [ ] Organização de Arquivos
  - [ ] Análise Financeira
  - [ ] Tradução Jurídica
- [ ] 🔄 Configurar PII filtering para produção (LGPD)
- [ ] 🔄 Testar no dashboard AI Agents do Sentry.io
- [ ] 🔄 Criar alertas customizados
- [ ] 🔄 Documentar runbooks de troubleshooting

## 🎯 Agentes Instrumentados (9/15 = 60%)

| Agente | Status | Arquivo | Padrão | Tool | Handoff |
|--------|--------|---------|--------|------|---------|
| Harvey Specter | ✅ Completo | `HarveySpecterChat.tsx` | Agent + Chat | ❌ | ❌ |
| Mrs. Justin-e | ✅ Completo | `use-autonomous-agents.ts` | Agent | ❌ | ❌ |
| Redação Petições | ✅ Completo | `redacao_graph.ts`, `gemini-service.ts` | Agent + Chat | ❌ | ❌ |
| Monitor DJEN | ✅ Completo | `monitor_graph.ts` | Agent | ❌ | ❌ |
| Gestão Prazos | ✅ Completo | `gestao_prazos_graph.ts` | Agent | ❌ | ❌ |
| Análise Documental | ✅ Completo | `analise_documental_graph.ts` | Agent | ✅ entity_extraction | ❌ |
| Pesquisa Juris | ✅ Completo | `pesquisa_graph.ts` | Agent + Chat | ✅ search_db | ❌ |
| Análise de Risco | ✅ Completo | `analise_risco_graph.ts` | Agent + Chat | ❌ | ❌ |
| **Estratégia Processual** | ✅ Completo | `estrategia_processual_graph.ts` | Agent + Chat | ❌ | ✅ → Risco |
| Comunicação Clientes | ⏸️ Pendente | - | - | - | - |
| Revisão Contratual | ⏸️ Pendente | - | - | - | - |
| Compliance | ⏸️ Pendente | - | - | - | - |
| Organização Arquivos | ⏸️ Pendente | - | - | - | - |
| Análise Financeira | ⏸️ Pendente | - | - | - | - |
| Tradução Jurídica | ⏸️ Pendente | - | - | - | - |

## 🎊 Novidades da Fase 3

### ⭐ Handoff Entre Agentes (Primeira Implementação!)

**Exemplo: Estratégia Processual → Análise de Risco**

```typescript
// Detectar necessidade de análise de risco
if (riskScore === undefined || riskScore === 0.5) {
  await createHandoffSpan("Estratégia Processual", "Análise de Risco");
  
  span?.setAttribute("estrategia.handoff_triggered", true);
  span?.setAttribute("estrategia.handoff_reason", "Necessário análise de risco primeiro");
  
  // Aguardar análise...
}
```

**No Sentry.io:**
- ✅ Span com `op: gen_ai.handoff`
- ✅ Atributos: `gen_ai.from_agent`, `gen_ai.to_agent`
- ✅ Trace completo mostrando fluxo entre agentes

### 🔧 Tool Calling em Produção

**Agente: Análise Documental**

```typescript
const entities = await createExecuteToolSpan(
  { agentName: "Análise Documental", ... },
  {
    toolName: "entity_extraction",
    toolType: "function",
    toolInput: JSON.stringify({ texto, tipo })
  },
  async (toolSpan) => {
    const result = await extractEntities(texto);
    toolSpan?.setAttribute("gen_ai.tool.output", JSON.stringify(result));
    return result;
  }
);
```

**Saída:**
```json
{
  "partes": ["Autor: João Silva", "Réu: Empresa XYZ"],
  "datas": ["2024-12-08", "2024-11-15"],
  "valores": ["R$ 10.000,00"],
  "processos": ["1234567-89.2024.5.02.0999"]
}
```

**Agente: Pesquisa Jurisprudencial**

```typescript
// 1. Chat LLM para gerar query
const query = await createChatSpan(...);

// 2. Tool para buscar em datastore
const resultados = await createExecuteToolSpan(
  {...},
  {
    toolName: "search_jurisprudence_database",
    toolType: "datastore",
    toolInput: JSON.stringify({ query, limit: 10 })
  },
  async (toolSpan) => {
    const precedentes = await searchDatabase(query);
    toolSpan?.setAttribute("search.results_count", precedentes.length);
    return precedentes;
  }
);
```

### 📊 Análise de Risco com Heurísticas

**Fórmula de Cálculo:**

```typescript
let riskScore = 0.5; // Baseline

// Ajustar por complexidade
if (complexidade === "baixa") riskScore -= 0.15;
else if (complexidade === "alta") riskScore += 0.2;

// Ajustar por precedentes
if (precedentes.length > 3) riskScore -= 0.1;
else if (precedentes.length === 0) riskScore += 0.15;

// Ajustar por valor da causa
if (valorCausa > 100000) riskScore += 0.1;

// Limitar entre 0 e 1
riskScore = Math.max(0, Math.min(1, riskScore));
```

**Classificação:**
- `score < 0.3` → **Risco Baixo**
- `0.3 ≤ score < 0.6` → **Risco Médio**
- `score ≥ 0.6` → **Risco Alto**

**Probabilidade de Sucesso:**
```typescript
probabilidadeSucesso = (1 - riskScore) * 100
```

### 🎯 Estratégias Contextuais

| Fase | Risco | Estratégia Principal | Ações Imediatas |
|------|-------|---------------------|-----------------|
| Inicial | Baixo | Contestação completa | Juntar docs, Arrolar testemunhas |
| Inicial | Alto | Acordo pré-processual | Negociação, Análise de valores |
| Recursal | Baixo | Recurso de apelação | Analisar sentença, Preparar minuta |
| Recursal | Alto | Acordo judicial | Proposta redução, Análise custo-benefício |

---

**Última atualização:** Dezembro 2025  
**Versão:** 2.0.0 (Migração para padrões oficiais OpenTelemetry)
