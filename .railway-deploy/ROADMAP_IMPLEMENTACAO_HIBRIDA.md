# Roadmap de Implementação - Arquitetura Híbrida
## Assistente Jurídico PJe com CrewAI + LangGraph + DSPy + AutoGen

**Data**: 2024-12-07
**Projeto**: assistente-juridico-p
**Objetivo**: Transformar sistema jurídico em Multi-Agent AI com otimização contínua

---

## 📊 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│ TIER 1: ORQUESTRAÇÃO (AutoGen MagenticOne)                 │
│ - Coordenação de 15 agentes                                 │
│ - Detecção e execução de handoffs                          │
│ - Persistência de estado                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ TIER 2: WORKFLOWS (LangGraph StateGraph)                   │
│ - Fluxo estruturado de cada agente                         │
│ - Roteamento condicional                                   │
│ - Execução paralela de ferramentas                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ TIER 3: OTIMIZAÇÃO (DSPy Teleprompters)                   │
│ - Otimização de prompts                                    │
│ - Few-shot generation                                      │
│ - Learning from feedback                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ TIER 4: RETRIEVAL (Haystack + Qdrant)                     │
│ - RAG Pipelines                                            │
│ - Hybrid Search (Dense + Sparse)                          │
│ - Jurisprudência em Vetores                               │
└─────────────────────────────────────────────────────────────┘
```

---

## ✏️ Fase 1: Infraestrutura Base (Semanas 1-3)

### 1.1 Setup de Dependências

```bash
# Frontend (TypeScript)
npm install langraph @langchain/core @langchain/openai qdrant-js

# Backend (Python) - setup paralelo
pip install dspy-ai haystack-ai fastapi uvicorn python-dotenv

# Optional: AutoGen (se usar TypeScript)
npm install autogen-agentchat
```

### 1.2 Estrutura de Diretórios

```
src/
├── agents/
│   ├── base/
│   │   ├── langgraph_agent.ts          # Base class para agentes
│   │   ├── agent_state.ts               # TypedDict state schema
│   │   └── agent_registry.ts            # Registry de agentes
│   ├── monitor-djen/
│   │   ├── monitor_graph.ts             # StateGraph principal
│   │   └── nodes/
│   │       ├── detect_publications.ts   # Detectar publicações
│   │       ├── analyze_intimations.ts   # Analisar intimações
│   │       └── escalate_to_justin.ts    # Escalar para Mrs. Justin-e
│   └── redacao-peticoes/
│       ├── redacao_graph.ts             # Fluxo de redação
│       └── nodes/
│           ├── select_template.ts
│           ├── generate_draft.ts
│           └── review_quality.ts
│
├── lib/
│   ├── langgraph/
│   │   ├── node_definitions.ts          # Definições de nós
│   │   └── edge_conditions.ts           # Funções de roteamento
│   ├── qdrant-service.ts                # Cliente Qdrant
│   ├── qdrant-queries.ts                # Queries jurídicas
│   └── embedding-provider.ts            # Seleção de embedding
│
└── types/
    └── agent_types.ts                    # Types compartilhados

api/
├── agents/
│   ├── autogen_orchestrator.ts          # MagenticOne setup
│   ├── orchestrator_service.ts          # Serviço de orquestração
│   └── message_router.ts                # Roteamento de mensagens
│
├── dspy/
│   ├── dspy_bridge.py                   # Bridge para DSPy
│   └── optimizers.py                    # Teleprompters
│
└── qdrant/
    ├── collections_init.ts              # Inicializar collections
    └── seed_data.ts                     # Popular com jurisprudência
```

### 1.3 Arquivo Base: `src/agents/base/agent_state.ts`

```typescript
import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

// Estado compartilhado entre todos agentes
export const AgentState = Annotation.Root({
  // Core
  agentId: Annotation<string>({ // ex: "monitor-djen", "redacao-peticoes"
    reducer: (current, update) => update || current,
  }),
  processId: Annotation<string | null>({
    reducer: (current, update) => update || current,
  }),

  // Mensagens
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => [...(current || []), ...update],
  }),

  // Análise
  analysis: Annotation<Record<string, any>>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),

  // Dados de Entrada
  input: Annotation<Record<string, any>>({
    reducer: (current, update) => update || current,
    default: () => ({}),
  }),

  // Resultado Final
  result: Annotation<Record<string, any>>({
    reducer: (current, update) => update || current,
  }),

  // Metadata
  metadata: Annotation<{
    startedAt: string;
    updatedAt: string;
    nodeHistory: string[];
  }>({
    reducer: (current, update) => update || current,
    default: () => ({
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodeHistory: [],
    }),
  }),
});

export type AgentStateType = typeof AgentState.State;
```

### 1.4 Arquivo Base: `src/agents/base/langgraph_agent.ts`

```typescript
import { START, END, StateGraph } from "@langchain/langgraph";
import { AgentState, AgentStateType } from "./agent_state";

export abstract class LangGraphAgent {
  agentId: string;
  model: any; // ChatOpenAI ou similar

  constructor(agentId: string, model: any) {
    this.agentId = agentId;
    this.model = model;
  }

  /**
   * Define os nós do grafo deste agente
   * Deve ser implementado por subclasses
   */
  abstract defineNodes(): Map<string, (state: AgentStateType) => Promise<Partial<AgentStateType>>>;

  /**
   * Define as edges (transições) do grafo
   * Padrão: START → node1 → conditional → node2 ou END
   */
  abstract defineEdges(): Array<{
    source: string;
    target: string | ((state: AgentStateType) => string);
  }>;

  /**
   * Constrói o StateGraph
   */
  buildGraph() {
    const graph = new StateGraph(AgentState);
    const nodes = this.defineNodes();

    // Adicionar nós
    for (const [nodeId, nodeFunc] of nodes) {
      graph.addNode(nodeId, nodeFunc);
    }

    // Adicionar edges
    for (const edge of this.defineEdges()) {
      if (typeof edge.target === "string") {
        graph.addEdge(edge.source, edge.target);
      } else {
        graph.addConditionalEdges(edge.source, edge.target);
      }
    }

    // Compilar
    return graph.compile();
  }

  /**
   * Executar o agente
   */
  async run(input: Record<string, any>) {
    const compiled = this.buildGraph();
    return await compiled.invoke({
      agentId: this.agentId,
      input,
      messages: [],
      analysis: {},
      metadata: {
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodeHistory: [],
      },
    });
  }
}
```

### 1.5 Implementar 1º Agente: Monitor DJEN

```typescript
// src/agents/monitor-djen/monitor_graph.ts
import { LangGraphAgent } from "../base/langgraph_agent";
import { AgentStateType } from "../base/agent_state";

export class MonitorDJENAgent extends LangGraphAgent {
  defineNodes() {
    return new Map([
      ["detect", async (state: AgentStateType) => {
        // 1. Chamar API DJEN para buscar publicações novas
        const publications = await this.detectNewPublications();

        return {
          analysis: {
            publicationsFound: publications.length,
            intimationsDetected: publications.filter(p => p.isIntimation).length,
          },
          messages: [
            {
              content: `Detectadas ${publications.length} publicações`,
              role: "assistant",
            },
          ],
        };
      }],

      ["analyze", async (state: AgentStateType) => {
        // 2. Analisar quais são intimações críticas
        const intimations = state.analysis.publicationsFound;

        return {
          analysis: {
            ...state.analysis,
            criticalDeadlines: intimations
              .filter(i => i.deadlineHours < 72)
              .length,
          },
        };
      }],

      ["escalate", async (state: AgentStateType) => {
        // 3. Se houver intimações, escalar para Mrs. Justin-e
        const critical = state.analysis.criticalDeadlines || 0;

        if (critical > 0) {
          return {
            result: {
              action: "escalate",
              targetAgent: "justine",
              intimationCount: critical,
            },
          };
        }

        return {
          result: {
            action: "done",
          },
        };
      }],
    ]);
  }

  defineEdges() {
    return [
      { source: "START", target: "detect" },
      { source: "detect", target: "analyze" },
      { source: "analyze", target: "escalate" },
      {
        source: "escalate",
        target: (state: AgentStateType) => {
          return state.result?.action === "escalate" ? "END" : "END";
        },
      },
    ];
  }

  private async detectNewPublications() {
    // TODO: Implementar chamada para API DJEN
    return [];
  }
}
```

---

## 🔄 Fase 2: Integração de Retrieval (Semanas 4-6)

### 2.1 Setup Qdrant

```typescript
// src/lib/qdrant-service.ts
import { QdrantClient } from "qdrant-js";

export class QdrantService {
  private client: QdrantClient;

  constructor(apiKey: string) {
    this.client = new QdrantClient({
      apiKey,
      host: process.env.QDRANT_HOST || "localhost",
      port: 6333,
    });
  }

  /**
   * Criar collection para jurisprudência
   */
  async initJurisprudenceCollection() {
    const collectionName = "jurisprudencia_stf_stj";

    try {
      await this.client.recreateCollection(collectionName, {
        vectors: {
          size: 768, // OpenAI/Gemini embedding size
          distance: "Cosine",
        },
        sparse_vectors: {
          bm25: {},
        },
      });

      console.log(`✅ Collection ${collectionName} criada`);
    } catch (error) {
      console.error("Erro criando collection:", error);
    }
  }

  /**
   * Buscar precedentes similares
   */
  async searchPrecedents(query: string, embedding: number[]) {
    const results = await this.client.search("jurisprudencia_stf_stj", {
      vector: embedding,
      limit: 10,
      score_threshold: 0.7,
    });

    return results.map((r) => ({
      id: r.id,
      score: r.score,
      metadata: r.payload,
    }));
  }

  /**
   * Adicionar precedente
   */
  async addPrecedent(id: string, embedding: number[], metadata: any) {
    await this.client.upsert("jurisprudencia_stf_stj", {
      points: [
        {
          id,
          vector: embedding,
          payload: metadata,
        },
      ],
    });
  }
}
```

### 2.2 Haystack RAG Pipeline

```typescript
// src/lib/haystack-pipeline.ts
import { Pipeline, Document } from "haystack";
import { InMemoryDocumentStore } from "haystack/document_stores/in_memory";
import { BM25Retriever } from "haystack/retrievers/bm25";

export async function buildRagPipeline() {
  // 1. Document Store
  const docStore = new InMemoryDocumentStore();

  // 2. Retriever
  const retriever = new BM25Retriever(
    document_store=docStore
  );

  // 3. Pipeline
  const pipeline = new Pipeline();
  pipeline.addComponent("retriever", retriever);

  // Adicionar gerador, prompt builder, etc.

  return pipeline;
}
```

### 2.3 Agente de Pesquisa Jurisprudencial

```typescript
// src/agents/pesquisa-juris/pesquisa_graph.ts
export class PesquisaJurisAgent extends LangGraphAgent {
  private qdrant: QdrantService;
  private embedder: any; // OpenAIEmbeddings

  defineNodes() {
    return new Map([
      ["decompose", async (state: AgentStateType) => {
        // Quebrar query jurídica em conceitos
        const query = state.input.query;
        const concepts = await this.decomposeQuery(query);

        return {
          analysis: { concepts },
        };
      }],

      ["search_dense", async (state: AgentStateType) => {
        // Busca semântica (dense vectors)
        const embedding = await this.embedder.embed_query(
          state.input.query
        );
        const denseResults = await this.qdrant.searchPrecedents(
          state.input.query,
          embedding
        );

        return {
          analysis: {
            ...state.analysis,
            denseResults,
          },
        };
      }],

      ["search_sparse", async (state: AgentStateType) => {
        // Busca keyword (sparse vectors)
        const sparseResults = await this.qdrant.searchPrecedents(
          state.input.query,
          [] // sparse vector
        );

        return {
          analysis: {
            ...state.analysis,
            sparseResults,
          },
        };
      }],

      ["rank", async (state: AgentStateType) => {
        // Combinar dense + sparse com ranking customizado
        const combined = [
          ...state.analysis.denseResults,
          ...state.analysis.sparseResults,
        ];

        // Deduplicate e rank por relevância jurídica
        const ranked = combined
          .filter((r, i, arr) => arr.findIndex(a => a.id === r.id) === i)
          .sort((a, b) => b.score - a.score);

        return {
          result: {
            precedents: ranked.slice(0, 5), // Top 5
          },
        };
      }],
    ]);
  }

  defineEdges() {
    return [
      { source: "START", target: "decompose" },
      { source: "decompose", target: "search_dense" },
      { source: "search_dense", target: "search_sparse" },
      { source: "search_sparse", target: "rank" },
      { source: "rank", target: "END" },
    ];
  }

  private async decomposeQuery(query: string) {
    // TODO: Usar LLM para decompor
    return [];
  }
}
```

---

## 🧠 Fase 3: DSPy Optimization Loop (Semanas 7-8)

### 3.1 Bridge Python-TypeScript

```python
# scripts/dspy_bridge.py
from fastapi import FastAPI
from dspy.teleprompt import MIPRO
import dspy

app = FastAPI()

@app.post("/optimize-prompt")
async def optimize_prompt(
    task_name: str,
    current_prompt: str,
    examples: list[dict],
    metric_func: str
):
    """
    Otimizar prompt usando DSPy MIPRO
    """

    # Configurar DSPy
    turbo = dspy.OpenAI(model="gpt-4")
    dspy.settings.configure(lm=turbo)

    # Definir classe custom
    class JuridicalTask(dspy.Module):
        def __init__(self, current_prompt):
            super().__init__()
            self.signature = dspy.Signature(current_prompt)

        def forward(self, **kwargs):
            return dspy.ChainOfThought(self.signature)(**kwargs)

    # Executar optimizer
    optimizer = MIPRO(
        metric=eval(metric_func),
        num_threads=4,
    )

    task = JuridicalTask(current_prompt)
    optimized = optimizer.compile(task, trainset=examples)

    return {
        "optimized_prompt": str(optimized.signature),
        "improvement": "X%",
    }
```

### 3.2 Integração no Agente de Redação

```typescript
// Após operador corrigir minuta...
async function learnFromCorrection(
  originalPrompt: string,
  operatorCorrection: string,
  examples: any[]
) {
  // Chamar bridge DSPy
  const response = await fetch("http://localhost:8000/optimize-prompt", {
    method: "POST",
    body: JSON.stringify({
      task_name: "redacao-peticoes",
      current_prompt: originalPrompt,
      examples,
      metric_func: "similarity_to_operator_version",
    }),
  });

  const optimized = await response.json();

  // Salvar novo prompt
  await updateAgentPrompt("redacao-peticoes", optimized.optimized_prompt);
}
```

---

## 🤖 Fase 4: Orquestração com AutoGen (Semanas 9-10)

### 4.1 Setup AutoGen Orchestrator

```typescript
// api/agents/autogen_orchestrator.ts
import { MagenticOneOrchestrator } from "autogen-agentchat";

export class JuridicalOrchestrator {
  private orchestrator: MagenticOneOrchestrator;

  async initialize() {
    this.orchestrator = new MagenticOneOrchestrator();

    // Registrar 15 agentes
    await this.registerAgents();
  }

  private async registerAgents() {
    // Cada agente é uma instância de LangGraphAgent compilada
    const agentes = [
      { id: "monitor-djen", agent: new MonitorDJENAgent() },
      { id: "justine", agent: new JustineAgent() },
      { id: "redacao-peticoes", agent: new RedacaoPeticoesAgent() },
      // ... 12 mais
    ];

    for (const { id, agent } of agentes) {
      await this.orchestrator.registerAgent(id, agent);
    }
  }

  /**
   * Executar orquestração completa
   */
  async runOrchestration(input: {
    topic: string;
    processId: string;
  }) {
    const result = await this.orchestrator.run({
      initial_message: input.topic,
      agents_map: this.agentsMap,
    });

    return result;
  }
}
```

---

## 📋 Checklist de Implementação

### Fase 1
- [ ] Instalar dependências (npm + pip)
- [ ] Criar estrutura de diretórios
- [ ] Implementar `AgentState` TypeScript
- [ ] Implementar classe base `LangGraphAgent`
- [ ] Implementar `MonitorDJENAgent` completo
- [ ] Testar grafo com exemplos locais

### Fase 2
- [ ] Setup Qdrant Cloud (ou local)
- [ ] Criar collections (jurisprudência, processos)
- [ ] Popular com dados iniciais (scraping STF/STJ)
- [ ] Implementar `QdrantService` completo
- [ ] Implementar Haystack pipelines
- [ ] Implementar `PesquisaJurisAgent`
- [ ] Testar hybrid search (dense + sparse)

### Fase 3
- [ ] Setup FastAPI com bridge Python
- [ ] Implementar `scripts/dspy_bridge.py`
- [ ] Integrar feedback loop no Redactor
- [ ] Testar otimização com exemplos reais
- [ ] Coletar métricas de melhoria

### Fase 4
- [ ] Setup AutoGen
- [ ] Implementar `JuridicalOrchestrator`
- [ ] Registrar 15 agentes
- [ ] Testar handoffs entre agentes
- [ ] Integração end-to-end

---

## 🔧 Commands de Desenvolvimento

```bash
# Desenvolvimento local
npm run dev

# Rodar Bridge DSPy
python scripts/dspy_bridge.py

# Testes
npm run test

# Build
npm run build

# Lint
npm run lint
```

---

## 🎯 Métricas de Sucesso

| Fase | Métrica | Meta |
|------|---------|------|
| 1 | 2 agentes rodando | ✅ |
| 2 | Buscas Qdrant com score > 0.85 | ✅ |
| 3 | Melhoria de prompt > 15% | ✅ |
| 4 | 15 agentes coordenados | ✅ |

---

## 🚀 Deploy em Produção

```bash
# Docker
docker build -t assistente-juridico:latest .
docker run -p 3000:3000 assistente-juridico:latest

# Vercel
vercel deploy --prod

# Qdrant Cloud
vercel env add QDRANT_API_KEY
```

