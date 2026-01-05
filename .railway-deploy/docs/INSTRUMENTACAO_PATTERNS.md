# 📘 Guia de Padrões de Instrumentação Sentry AI v2.0

**Versão:** 2.0.0  
**Data:** 08 de Dezembro de 2025  
**Status:** ✅ Oficial

---

## 🎯 Objetivo

Este guia documenta os **padrões oficiais** de instrumentação de agentes IA com Sentry para o projeto **Assistente Jurídico PJe**.

**Uso:**
- Implementar novos agentes
- Manter consistência de instrumentação
- Garantir conformidade OpenTelemetry
- Facilitar debugging e monitoring

---

## 📊 Convenções OpenTelemetry

### Operations Padronizadas

| Operation | Descrição | Quando Usar |
|-----------|-----------|-------------|
| `gen_ai.invoke_agent` | Invocação de agente completo | Sempre ao iniciar um agente |
| `gen_ai.chat` | Chamada a LLM (Gemini, GPT, etc.) | Para geração de texto com IA |
| `gen_ai.execute_tool` | Execução de ferramenta/função | Para busca, cálculo, API externa |
| `gen_ai.handoff` | Transferência entre agentes | Quando um agente delega para outro |

### Atributos Obrigatórios

#### Para `gen_ai.invoke_agent`:

```typescript
{
  "gen_ai.operation.name": "invoke_agent",
  "gen_ai.agent.name": "Harvey Specter",
  "gen_ai.system": "gemini",
  "gen_ai.request.model": "gemini-2.5-pro",
  "conversation.session_id": "session_123",
  "conversation.turn": 1
}
```

#### Para `gen_ai.chat`:

```typescript
{
  "gen_ai.operation.name": "chat",
  "gen_ai.system": "gemini",
  "gen_ai.request.model": "gemini-2.5-pro",
  "gen_ai.request.messages": JSON.stringify([...]),
  "gen_ai.request.temperature": 0.7
}
```

#### Para `gen_ai.execute_tool`:

```typescript
{
  "gen_ai.operation.name": "execute_tool",
  "gen_ai.tool.name": "search_knowledge_base",
  "gen_ai.tool.type": "function",
  "gen_ai.tool.input": JSON.stringify({...}),
  "gen_ai.tool.output": JSON.stringify({...})
}
```

---

## 🎨 Padrões de Implementação

Existem **4 padrões principais** para instrumentar agentes:

### Pattern 1: Agent Simples

**Quando usar:** Agentes que fazem apenas processamento lógico (sem LLM)

**Exemplo:** Monitor DJEN (versão simplificada)

```typescript
export class SimpleDJENAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    return createInvokeAgentSpan(
      {
        agentName: "Monitor DJEN",
        system: "custom-llm",
        model: "djen-api"
      },
      {
        sessionId: state.data?.sessionId || `djen_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: []
      },
      async (span) => {
        // Processamento
        const publications = await fetchPublications();
        
        // Atributos customizados
        span?.setAttribute("djen.publications_found", publications.length);
        span?.setAttribute("djen.scan_timestamp", new Date().toISOString());
        
        // Atualizar estado
        let current = updateState(state, {
          currentStep: "completed",
          data: { publications },
          completed: true
        });
        
        span?.setStatus({ code: 1, message: "ok" });
        
        return this.addAgentMessage(
          current,
          `Monitor DJEN: ${publications.length} publicações encontradas`
        );
      }
    );
  }
}
```

**Atributos customizados típicos:**
```typescript
span?.setAttribute("agent_specific.metric", value);
span?.setAttribute("agent_specific.count", count);
span?.setAttribute("agent_specific.status", "success");
```

---

### Pattern 2: Agent + Chat (LLM)

**Quando usar:** Agentes que usam LLM para gerar texto/análise

**Exemplo:** Redação de Petições

```typescript
export class RedacaoPeticoesAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    return createInvokeAgentSpan(
      {
        agentName: "Redação de Petições",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.8
      },
      {
        sessionId: state.data?.sessionId || `redacao_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: []
      },
      async (span) => {
        let current = updateState(state, { currentStep: "redacao:start" });
        
        // Extrair dados
        const tipoPeticao = state.data?.tipoPeticao as string || "contestação";
        const fatos = state.data?.fatos as string || "";
        
        span?.setAttribute("redacao.tipo_peticao", tipoPeticao);
        span?.setAttribute("redacao.fatos_length", fatos.length);
        
        // Usar LLM para redigir
        const minutaGerada = await createChatSpan(
          {
            agentName: "Redação de Petições",
            system: "gemini",
            model: "gemini-2.5-pro",
            temperature: 0.8
          },
          [
            {
              role: "system",
              content: "Você é um redator jurídico especializado."
            },
            {
              role: "user",
              content: `Redija uma ${tipoPeticao} com base em: ${fatos}`
            }
          ],
          async (chatSpan) => {
            // Simular geração
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const minuta = `EXCELENTÍSSIMO SENHOR DOUTOR JUIZ...`;
            
            chatSpan?.setAttribute("gen_ai.response.text", JSON.stringify([minuta]));
            chatSpan?.setAttribute("gen_ai.usage.total_tokens", 500);
            chatSpan?.setAttribute("gen_ai.usage.input_tokens", 100);
            chatSpan?.setAttribute("gen_ai.usage.output_tokens", 400);
            
            return minuta;
          }
        );
        
        span?.setAttribute("redacao.minuta_length", minutaGerada.length);
        span?.setAttribute("redacao.confidence", 0.9);
        
        current = updateState(current, {
          currentStep: "redacao:complete",
          data: { minuta: minutaGerada },
          completed: true
        });
        
        span?.setStatus({ code: 1, message: "ok" });
        
        return this.addAgentMessage(
          current,
          `Minuta de ${tipoPeticao} gerada (${minutaGerada.length} caracteres)`
        );
      }
    );
  }
}
```

**Boas práticas:**
- Sempre definir `temperature` apropriada
- Registrar `gen_ai.usage.*` para monitorar custos
- Usar `gen_ai.response.text` em formato JSON array

---

### Pattern 3: Agent + Tool + Chat

**Quando usar:** Agentes que precisam buscar dados (tool) e depois usar LLM

**Exemplo:** Análise Documental

```typescript
export class AnaliseDocumentalAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    return createInvokeAgentSpan(
      {
        agentName: "Análise Documental",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.3
      },
      {
        sessionId: state.data?.sessionId || `analise_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: []
      },
      async (span) => {
        let current = updateState(state, { currentStep: "analise:start" });
        
        const documentoTexto = state.data?.documentoTexto as string || "";
        span?.setAttribute("analise.documento_length", documentoTexto.length);
        
        // 1. TOOL: Extrair entidades do documento
        const entidades = await createExecuteToolSpan(
          {
            agentName: "Análise Documental",
            system: "gemini",
            model: "gemini-2.5-pro"
          },
          {
            toolName: "extract_entities",
            toolType: "function",
            toolInput: JSON.stringify({ texto: documentoTexto.substring(0, 500) })
          },
          async (toolSpan) => {
            // Simular extração
            await new Promise(resolve => setTimeout(resolve, 30));
            
            const entidadesExtraidas = [
              { tipo: "PESSOA", texto: "João Silva", posicao: 10 },
              { tipo: "DATA", texto: "15/01/2024", posicao: 50 },
              { tipo: "VALOR", texto: "R$ 10.000,00", posicao: 80 }
            ];
            
            toolSpan?.setAttribute("gen_ai.tool.output", JSON.stringify(entidadesExtraidas));
            toolSpan?.setAttribute("extraction.entities_count", entidadesExtraidas.length);
            
            return entidadesExtraidas;
          }
        );
        
        span?.setAttribute("analise.entidades_extraidas", entidades.length);
        
        // 2. CHAT: Usar LLM para classificar documento
        const classificacao = await createChatSpan(
          {
            agentName: "Análise Documental",
            system: "gemini",
            model: "gemini-2.5-pro",
            temperature: 0.3
          },
          [
            {
              role: "system",
              content: "Você classifica documentos jurídicos."
            },
            {
              role: "user",
              content: `Classifique o documento com entidades: ${JSON.stringify(entidades)}`
            }
          ],
          async (chatSpan) => {
            await new Promise(resolve => setTimeout(resolve, 40));
            
            const resultado = {
              tipo: "intimação",
              urgencia: "alta",
              prazo: "15 dias",
              confianca: 0.95
            };
            
            chatSpan?.setAttribute("gen_ai.response.text", JSON.stringify([resultado]));
            chatSpan?.setAttribute("gen_ai.usage.total_tokens", 200);
            
            return resultado;
          }
        );
        
        span?.setAttribute("analise.tipo_documento", classificacao.tipo);
        span?.setAttribute("analise.urgencia", classificacao.urgencia);
        span?.setAttribute("analise.confianca", classificacao.confianca);
        
        current = updateState(current, {
          currentStep: "analise:complete",
          data: { entidades, classificacao },
          completed: true
        });
        
        span?.setStatus({ code: 1, message: "ok" });
        
        return this.addAgentMessage(
          current,
          `Documento classificado: ${classificacao.tipo} (${classificacao.urgencia})`
        );
      }
    );
  }
}
```

**Sequência típica:**
1. `createInvokeAgentSpan` → Span pai
2. `createExecuteToolSpan` → Tool call (filho)
3. `createChatSpan` → LLM analysis (filho)
4. Retornar resultado

---

### Pattern 4: Agent + Chat + Handoff

**Quando usar:** Agentes que delegam trabalho para outros agentes

**Exemplo:** Estratégia Processual → Análise de Risco

```typescript
export class EstrategiaProcessualAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    return createInvokeAgentSpan(
      {
        agentName: "Estratégia Processual",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.6
      },
      {
        sessionId: state.data?.sessionId || `estrategia_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: []
      },
      async (span) => {
        let current = updateState(state, { currentStep: "estrategia:start" });
        
        const riskScore = state.data?.riskScore as number || undefined;
        
        // Verificar se precisa de handoff para Análise de Risco
        if (!riskScore || riskScore === 0.5) {
          // HANDOFF: Marcar transferência
          await createHandoffSpan("Estratégia Processual", "Análise de Risco");
          
          span?.setAttribute("estrategia.handoff_triggered", true);
          span?.setAttribute("estrategia.handoff_reason", "Risco não calculado");
          
          // Sinalizar que aguarda análise de risco
          current = updateState(current, {
            currentStep: "waiting_risk_analysis",
            data: {
              ...current.data,
              handoffTo: "analise-risco"
            }
          });
          
          span?.setStatus({ code: 1, message: "ok" });
          
          return this.addAgentMessage(
            current,
            "Aguardando análise de risco antes de definir estratégia"
          );
        }
        
        // Continuar com estratégia (se risco já calculado)
        const estrategia = await createChatSpan(
          {
            agentName: "Estratégia Processual",
            system: "gemini",
            model: "gemini-2.5-pro",
            temperature: 0.6
          },
          [
            {
              role: "system",
              content: "Você é um estrategista processual."
            },
            {
              role: "user",
              content: `Recomende estratégia para risco ${riskScore < 0.3 ? 'baixo' : riskScore < 0.6 ? 'médio' : 'alto'}`
            }
          ],
          async (chatSpan) => {
            await new Promise(resolve => setTimeout(resolve, 70));
            
            const resultado = {
              principal: "Contestação com preliminares",
              alternativas: ["Acordo", "Reconvenção"],
              confianca: 0.8
            };
            
            chatSpan?.setAttribute("gen_ai.response.text", JSON.stringify([resultado]));
            chatSpan?.setAttribute("gen_ai.usage.total_tokens", 300);
            
            return resultado;
          }
        );
        
        span?.setAttribute("estrategia.principal", estrategia.principal);
        span?.setAttribute("estrategia.confianca", estrategia.confianca);
        
        current = updateState(current, {
          currentStep: "estrategia:complete",
          data: { estrategia },
          completed: true
        });
        
        span?.setStatus({ code: 1, message: "ok" });
        
        return this.addAgentMessage(
          current,
          `Estratégia: ${estrategia.principal}`
        );
      }
    );
  }
}
```

**Boas práticas de handoff:**
- Sempre usar `createHandoffSpan` antes de delegar
- Registrar `handoff_triggered` e `handoff_reason` no span pai
- Retornar estado com `handoffTo` para orquestrador processar

---

## 🔧 Configuração de Ambiente

### Desenvolvimento

```typescript
// Gravar inputs/outputs para debugging
globalGeminiConfig = {
  recordInputs: true,
  recordOutputs: true,
  piiFilterConfig: {
    ...DEFAULT_PII_CONFIG,
    enabled: false  // Desabilitar em dev para facilitar debug
  }
};
```

### Produção

```typescript
// Não gravar inputs/outputs (apenas métricas)
globalGeminiConfig = {
  recordInputs: false,
  recordOutputs: false,
  piiFilterConfig: {
    ...DEFAULT_PII_CONFIG,
    enabled: true  // OBRIGATÓRIO: Habilitar PII filtering
  }
};
```

### Configuração no Sentry.init()

```typescript
Sentry.init({
  dsn: "...",
  
  // ✅ LGPD: Desabilitar envio automático de PII
  sendDefaultPii: false,
  
  // ✅ LGPD: Sanitizar erros
  beforeSend: createPIIFilteredBeforeSend(PII_CONFIG),
  
  // ✅ LGPD: Sanitizar AI spans
  beforeSendTransaction: createAISanitizingBeforeSendTransaction(PII_CONFIG),
  
  integrations: [
    // ...outras integrações
  ]
});
```

---

## 📊 Atributos Customizados Recomendados

### Por Tipo de Agente

#### Monitor/Scanner
```typescript
span?.setAttribute("monitor.items_found", count);
span?.setAttribute("monitor.scan_duration_ms", duration);
span?.setAttribute("monitor.scan_timestamp", isoDate);
span?.setAttribute("monitor.source", "DJEN");
```

#### Análise/Classificação
```typescript
span?.setAttribute("analysis.confidence", 0.95);
span?.setAttribute("analysis.type", "intimação");
span?.setAttribute("analysis.urgency", "alta");
span?.setAttribute("analysis.entities_count", count);
```

#### Redação/Geração
```typescript
span?.setAttribute("generation.output_length", chars);
span?.setAttribute("generation.template_used", "contestação");
span?.setAttribute("generation.confidence", 0.9);
span?.setAttribute("generation.language", "pt-BR");
```

#### Cálculo/Processamento
```typescript
span?.setAttribute("calculation.result", value);
span?.setAttribute("calculation.method", "CPC");
span?.setAttribute("calculation.business_days", days);
span?.setAttribute("calculation.holidays_count", count);
```

---

## ⚠️ Erros Comuns e Soluções

### Erro 1: Span não aparece no Sentry

**Causa:** `span.setStatus()` não chamado

**Solução:**
```typescript
// ✅ SEMPRE fazer isso
span?.setStatus({ code: 1, message: "ok" });
// ou em caso de erro
span?.setStatus({ code: 2, message: error.message });
```

### Erro 2: Atributos não aparecem

**Causa:** Atributos definidos após `setStatus()`

**Solução:**
```typescript
// ❌ ERRADO
span?.setStatus({ code: 1, message: "ok" });
span?.setAttribute("my.attr", value);  // Tarde demais!

// ✅ CORRETO
span?.setAttribute("my.attr", value);
span?.setStatus({ code: 1, message: "ok" });
```

### Erro 3: PII vazando em spans

**Causa:** `piiFilterConfig.enabled = false` em produção

**Solução:**
```typescript
// ✅ Sempre verificar ambiente
const PII_CONFIG: PIIFilterConfig = {
  ...DEFAULT_PII_CONFIG,
  enabled: process.env.NODE_ENV === "production"
};
```

### Erro 4: Handoff não registrado

**Causa:** Esqueceu de chamar `createHandoffSpan`

**Solução:**
```typescript
// ✅ SEMPRE criar handoff span antes de delegar
await createHandoffSpan("AgentOrigem", "AgentDestino");

// Depois definir dados de handoff
current = updateState(current, {
  data: { ...current.data, handoffTo: "agent-destino" }
});
```

---

## 🧪 Testando Instrumentação

### Teste Manual

```typescript
// 1. Executar agente
const agent = new MyAgent();
const result = await agent.execute(initialState);

// 2. Verificar no Sentry.io → Insights → AI → AI Agents
// Confirmar:
// - Span aparece com nome correto
// - Atributos estão presentes
// - Tempo de execução razoável
// - Sem PII vazando
```

### Teste Automatizado (Futuro)

```typescript
import { describe, it, expect } from 'vitest';
import * as Sentry from '@sentry/react';

describe('Agent Instrumentation', () => {
  it('should create invoke_agent span', async () => {
    const mockSpan = vi.fn();
    vi.spyOn(Sentry, 'startSpan').mockImplementation(mockSpan);
    
    await runMyAgent({});
    
    expect(mockSpan).toHaveBeenCalledWith(
      expect.objectContaining({
        op: 'gen_ai.invoke_agent',
        name: expect.stringContaining('invoke_agent')
      }),
      expect.any(Function)
    );
  });
});
```

---

## 📚 Referências

- **OpenTelemetry Semantic Conventions:** https://opentelemetry.io/docs/specs/otel/trace/semantic_conventions/
- **Sentry AI Monitoring:** https://docs.sentry.io/platforms/javascript/guides/react/tracing/span-metrics/examples/#manual-llm-instrumentation-custom-ai-agent--tool-calls
- **Documentação Interna:** `docs/SENTRY_AI_MONITORING.md`

---

## 🎯 Checklist de Implementação

Ao implementar um novo agente, verificar:

- [ ] Span `gen_ai.invoke_agent` criado com `createInvokeAgentSpan`
- [ ] Atributos obrigatórios definidos (`gen_ai.agent.name`, `gen_ai.system`, `gen_ai.request.model`)
- [ ] Se usa LLM: span `gen_ai.chat` com `createChatSpan`
- [ ] Se usa tool: span `gen_ai.execute_tool` com `createExecuteToolSpan`
- [ ] Se delega: span `gen_ai.handoff` com `createHandoffSpan`
- [ ] `span.setStatus()` chamado no final (success ou error)
- [ ] Atributos customizados relevantes adicionados
- [ ] PII filtering configurado (`piiFilterConfig.enabled = true` em prod)
- [ ] Testado no Sentry.io

---

**Versão:** 2.0.0  
**Última Atualização:** 08/12/2025  
**Responsável:** Equipe de Desenvolvimento
