# 🚀 Guia Completo: Melhorias nos Agentes LangGraph

Este guia detalha como resolver os três problemas principais dos agentes LangGraph:

1. ✅ Aplicar melhorias nos 14 agentes
2. ✅ Conectar Qdrant real (remover mocks)
3. ✅ Criar testes unitários

---

## 📋 Problema 1: Aplicar Melhorias nos Agentes

### O Que São as Melhorias?

Baseado nos agentes **Harvey** e **Justine** (já implementados), as melhorias incluem:

✅ **Sentry AI Monitoring v2** - Rastreamento completo de execução  
✅ **Circuit Breaker** - Proteção contra falhas em cascata  
✅ **Graceful Degradation** - Degradação controlada em falhas  
✅ **Retry Policy** - 3 tentativas com exponential backoff  
✅ **Error Handling** - Classificação e recuperação de erros  
✅ **Session Tracking** - `sessionId` e `turnCounter`  
✅ **Timeout Configurável** - 30s padrão, ajustável por agente  
✅ **Logs Estruturados** - Contexto completo para debugging  

### Como Aplicar?

#### Opção 1: Script Automatizado (Recomendado)

```bash
# Aplicar melhorias em TODOS os agentes
chmod +x scripts/apply-agent-improvements.sh
./scripts/apply-agent-improvements.sh all

# Ou aplicar em agente específico
./scripts/apply-agent-improvements.sh monitor-djen
```

**O que o script faz:**

1. Verifica se agente existe
2. Cria backup do arquivo original (`.backup.TIMESTAMP`)
3. Aplica transformações via `transform-agent.mjs`
4. Valida sintaxe TypeScript
5. Roda testes (se existirem)

#### Opção 2: Manual (Para Customização)

**Exemplo: Transformar `compliance_graph.ts`**

**ANTES:**
```typescript
import type { AgentState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export class ComplianceAgent extends LangGraphAgent {
  protected async run(state: AgentState): Promise<AgentState> {
    // Lógica do agente...
    return state;
  }
}
```

**DEPOIS:**
```typescript
import type { AgentState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import { updateState } from "../base/agent_state";
import { callGemini } from "@/lib/gemini-service";
import { createInvokeAgentSpan } from "@/lib/sentry-gemini-integration-v2";

/**
 * Compliance Agent
 * 
 * LangGraph-based agent with:
 * - Sentry AI Monitoring v2
 * - Circuit Breaker pattern
 * - Graceful degradation
 * - Retry with exponential backoff
 */
export class ComplianceAgent extends LangGraphAgent {
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    return createInvokeAgentSpan(
      {
        agentName: "Compliance",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.4,
      },
      {
        sessionId: (state.data?.sessionId as string) || `compliance_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        try {
          let current = updateState(state, { currentStep: "compliance:start" });
          
          const task = (state.data.task as string) || "Análise de compliance LGPD";
          
          span?.setAttribute("compliance.task", task);
          span?.setAttribute("compliance.started_at", Date.now());
          
          // Lógica do agente...
          const response = await callGemini(systemPrompt, {
            temperature: 0.4,
            maxOutputTokens: 2048,
          });
          
          current = updateState(current, {
            currentStep: "compliance:completed",
            completed: true,
            data: {
              ...current.data,
              result: response,
            },
          });
          
          span?.setAttribute("compliance.completed", true);
          
          return current;
          
        } catch (error) {
          console.error("[compliance] Erro durante execução:", error);
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", error instanceof Error ? error.message : String(error));
          
          return updateState(state, {
            completed: false,
            currentStep: "compliance:error",
            data: {
              ...state.data,
              error: error instanceof Error ? error.message : "Erro desconhecido",
            },
          });
        }
      }
    );
  }
}
```

### Validação Pós-Aplicação

```bash
# Verificar sintaxe TypeScript
npx tsc --noEmit src/agents/compliance/compliance_graph.ts

# Rodar testes
npm run test -- src/agents/compliance/__tests__/compliance.test.ts

# Build completo
npm run build
```

---

## 🗄️ Problema 2: Conectar Qdrant Real

### Por Que Remover Mocks?

- **Testes realistas**: Mocks não simulam latência de rede, erros de conexão, etc.
- **Validação de produção**: Garantir que embedding/search funcionam de verdade
- **Performance**: Testar queries complexas com dados reais

### Pré-Requisitos

1. **Conta no Qdrant Cloud** (https://cloud.qdrant.io)
2. **Criar cluster** (Free tier: 1GB RAM, 0.5 CPU)
3. **Obter credenciais**:
   - URL: `https://xxxxxxxx-xxxx-xxxx.qdrant.tech`
   - API Key: `your-api-key-here`

### Como Configurar?

#### 1. Adicionar Variáveis de Ambiente

**Arquivo: `.env`**
```bash
# Qdrant Real (Substituir valores)
VITE_QDRANT_URL=https://seu-cluster.qdrant.tech
VITE_QDRANT_API_KEY=sua-api-key-aqui
VITE_QDRANT_COLLECTION=jurisprudence
```

**Arquivo: `.env.test`**
```bash
# Mesmos valores para testes
VITE_QDRANT_URL=https://seu-cluster.qdrant.tech
VITE_QDRANT_API_KEY=sua-api-key-aqui
DEBUG_TESTS=false
```

#### 2. Executar Script de Setup

```bash
chmod +x scripts/setup-qdrant-real.sh
./scripts/setup-qdrant-real.sh
```

**O que o script faz:**

1. ✅ Verifica variáveis de ambiente
2. ✅ Testa conexão com Qdrant
3. ✅ Cria coleção `jurisprudence` (768 dimensões, Cosine)
4. ✅ Remove referências a mocks no código
5. ✅ Roda testes com Qdrant real
6. ✅ (Opcional) Popula com dados de exemplo

#### 3. Verificar Configuração

```bash
# Testar conexão
npx tsx scripts/test-qdrant-connection.ts

# Rodar testes unitários
npm run test -- tests/qdrant-service.test.ts

# Testar agente pesquisa-juris
npm run test -- src/agents/pesquisa-juris/__tests__/
```

### Remover Mocks Manualmente

Se o script automático não pegar tudo:

**Arquivo: `src/lib/qdrant-service.ts`**

❌ **ANTES (com mock):**
```typescript
async search(vector: number[], limit: number = 10): Promise<SearchResult[]> {
  if (process.env.DEBUG_TESTS === "true") {
    return [
      { id: "mock-1", score: 0.95, payload: { text: "Mock result" } }
    ];
  }
  // Lógica real...
}
```

✅ **DEPOIS (sem mock):**
```typescript
async search(vector: number[], limit: number = 10): Promise<SearchResult[]> {
  this.validateVector(vector, this.collectionVectorSize);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
  
  try {
    const response = await fetch(
      `${this.config.url}/collections/${this.config.collectionName}/points/search`,
      {
        method: "POST",
        headers: this.baseHeaders,
        signal: controller.signal,
        body: JSON.stringify({ vector, limit }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Qdrant search failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.result;
    
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### Popular com Dados Reais

```bash
# Usar dados do DataJud (CNJ)
npx tsx scripts/populate-qdrant-datajud.ts

# Ou criar coleção vazia
npx tsx scripts/init-qdrant-collection.ts
```

---

## 🧪 Problema 3: Criar Testes Unitários

### Por Que Testes São Importantes?

- ✅ Garantir que melhorias não quebram funcionalidade
- ✅ Detectar regressões antes do deploy
- ✅ Documentar comportamento esperado
- ✅ Facilitar refatoração futura

### Como Gerar Testes?

#### Opção 1: Script Automatizado (Recomendado)

```bash
# Gerar testes para TODOS os agentes
chmod +x scripts/generate-agent-tests.mjs
node scripts/generate-agent-tests.mjs all

# Ou gerar para agente específico
node scripts/generate-agent-tests.mjs gestao-prazos
```

**Estrutura dos Testes Gerados:**

```
src/agents/gestao-prazos/
├── gestao_prazos_graph.ts
└── __tests__/
    └── gestao-prazos.test.ts  # ✨ Gerado automaticamente
```

#### Opção 2: Manual (Customizado)

**Exemplo: Teste para `gestao-prazos`**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import type { AgentState } from "@/agents/base/agent_state";
import { GestaoPrazosAgent } from "../gestao_prazos_graph";

describe("GestaoPrazosAgent", () => {
  let agent: GestaoPrazosAgent;
  let initialState: AgentState;

  beforeEach(() => {
    agent = new GestaoPrazosAgent({
      timeoutMs: 5000,
      maxRetries: 2,
      enableSentryTracing: false, // Desabilitar em testes
    });

    initialState = {
      messages: [],
      currentStep: "init",
      data: {
        task: "Calcular prazo de recurso",
      },
      completed: false,
      retryCount: 0,
      maxRetries: 2,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };
  });

  describe("Inicialização", () => {
    it("deve inicializar corretamente", () => {
      expect(agent).toBeDefined();
      expect(agent.getSessionId()).toContain("gestao-prazos");
    });
  });

  describe("Execução básica", () => {
    it("deve executar com sucesso", async () => {
      const result = await agent.execute(initialState);

      expect(result).toBeDefined();
      expect(result.messages).toBeDefined();
      expect(Array.isArray(result.messages)).toBe(true);
    });

    it("deve atualizar currentStep durante execução", async () => {
      const result = await agent.execute(initialState);

      expect(result.currentStep).toBeTruthy();
      expect(result.currentStep).not.toBe("init");
    });
  });

  describe("Error Handling", () => {
    it("deve lidar com timeout", async () => {
      const shortTimeoutAgent = new GestaoPrazosAgent({
        timeoutMs: 1, // 1ms para forçar timeout
        maxRetries: 0,
        enableSentryTracing: false,
      });

      const result = await shortTimeoutAgent.execute(initialState);
      expect(result).toBeDefined();
    });

    it("deve fazer retry em caso de falha", async () => {
      const retryAgent = new GestaoPrazosAgent({
        timeoutMs: 5000,
        maxRetries: 2,
        retryDelayMs: 10,
        enableSentryTracing: false,
      });

      const result = await retryAgent.execute(initialState);
      expect(result.retryCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Circuit Breaker", () => {
    it("deve ter circuit breaker configurado", async () => {
      const results = [];
      
      for (let i = 0; i < 3; i++) {
        const result = await agent.execute(initialState);
        results.push(result);
      }

      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });
});
```

### Rodar Testes

```bash
# Todos os testes
npm run test

# Apenas testes de agentes
npm run test -- src/agents

# Agente específico
npm run test -- src/agents/gestao-prazos/__tests__/

# Com cobertura
npm run test:coverage

# Modo watch (desenvolvimento)
npm run test:watch
```

### Validação de Cobertura

```bash
npm run test:coverage

# Verificar relatório
open coverage/index.html
```

**Meta de Cobertura:**
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

---

## 🚀 Workflow Completo

### 1️⃣ Aplicar Melhorias

```bash
# Todos os agentes
./scripts/apply-agent-improvements.sh all

# Validar
npx tsc --noEmit
npm run lint
```

### 2️⃣ Configurar Qdrant Real

```bash
# Configurar .env
echo "VITE_QDRANT_URL=https://seu-cluster.qdrant.tech" >> .env
echo "VITE_QDRANT_API_KEY=sua-api-key" >> .env

# Setup
./scripts/setup-qdrant-real.sh

# Validar
npx tsx scripts/test-qdrant-connection.ts
```

### 3️⃣ Gerar Testes

```bash
# Todos os agentes
node scripts/generate-agent-tests.mjs all

# Rodar testes
npm run test

# Cobertura
npm run test:coverage
```

### 4️⃣ Validação Final

```bash
# Build
npm run build

# Testes completos
npm run test:all

# E2E (opcional)
npm run test:e2e
```

---

## 📊 Checklist de Validação

### Para Cada Agente

- [ ] Melhorias aplicadas (createInvokeAgentSpan presente)
- [ ] Circuit breaker configurado
- [ ] Error handling robusto
- [ ] Timeout configurado
- [ ] Logs estruturados
- [ ] Testes unitários criados
- [ ] Testes passando (100%)
- [ ] Build sem erros
- [ ] Lint sem warnings

### Para Qdrant

- [ ] Variáveis de ambiente configuradas
- [ ] Conexão testada com sucesso
- [ ] Coleção criada (768 dimensões)
- [ ] Mocks removidos do código
- [ ] Testes usando Qdrant real
- [ ] Performance aceitável (< 500ms por query)

### Para Testes

- [ ] Todos os agentes têm testes
- [ ] Cobertura > 80%
- [ ] Testes de inicialização
- [ ] Testes de execução básica
- [ ] Testes de error handling
- [ ] Testes de circuit breaker
- [ ] Testes de retry policy
- [ ] Testes de timeout

---

## 🐛 Troubleshooting

### Erro: "createInvokeAgentSpan is not defined"

```bash
# Verificar import
grep -r "createInvokeAgentSpan" src/agents/*/
```

Adicionar:
```typescript
import { createInvokeAgentSpan } from "@/lib/sentry-gemini-integration-v2";
```

### Erro: "Qdrant connection timeout"

```bash
# Testar conexão manual
curl -H "api-key: $VITE_QDRANT_API_KEY" "$VITE_QDRANT_URL/collections"

# Verificar firewall/VPN
# Qdrant pode bloquear IPs suspeitos
```

### Erro: "Test file not found"

```bash
# Verificar estrutura
tree src/agents/gestao-prazos/

# Deve ter:
# ├── gestao_prazos_graph.ts
# └── __tests__/
#     └── gestao-prazos.test.ts
```

### Erro: "Module resolution failed"

```bash
# Limpar cache
rm -rf node_modules/.vite
rm -rf dist

# Reinstalar
npm install

# Build
npm run build
```

---

## 📚 Referências

- **LangGraph Agent Base**: [src/agents/base/langgraph_agent.ts](src/agents/base/langgraph_agent.ts)
- **Harvey Agent (Modelo)**: [src/agents/harvey/harvey_graph.ts](src/agents/harvey/harvey_graph.ts)
- **Justine Agent (Modelo)**: [src/agents/justine/justine_graph.ts](src/agents/justine/justine_graph.ts)
- **Qdrant Service**: [src/lib/qdrant-service.ts](src/lib/qdrant-service.ts)
- **Sentry Integration**: [src/lib/sentry-gemini-integration-v2.ts](src/lib/sentry-gemini-integration-v2.ts)

---

## ✅ Próximos Passos

Após aplicar as melhorias:

1. **Ativar agentes**: `./scripts/activate-langgraph-agents.sh all`
2. **Deploy**: `npm run build:deploy && npm run start:production`
3. **Monitorar**: Verificar Sentry dashboard
4. **Otimizar**: Ajustar timeouts/retries conforme métricas

---

**Última atualização**: 03 de Janeiro de 2026
