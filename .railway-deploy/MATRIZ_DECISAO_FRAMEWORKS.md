# Matriz de Decisão - Frameworks Jurídicos

## 📊 Comparação Detalhada: Qual Framework Para Qual Problema?

### 1. **Orquestração de Múltiplos Agentes**

| Aspecto | AutoGen | CrewAI | Verdict |
|---------|---------|--------|--------|
| **Orquestração Sofisticada** | MagenticOne com ledger | Crew + Tasks | ✅ **AutoGen** |
| **Handoff Automático** | ✅ Detecção de intenção | ❌ Manual | ✅ **AutoGen** |
| **State Persistence** | ✅ save_state/load_state | ❌ Limitado | ✅ **AutoGen** |
| **Flexibilidade** | ✅ Muito flexível | ❌ Menos flexível | ✅ **AutoGen** |
| **Curva de Aprendizado** | Média | Baixa | ⚖️ Trade-off |
| **Comunidade** | Microsoft (grande) | Startup (crescente) | ⚖️ AutoGen |

**Recomendação**: **AutoGen para 15 agentes jurídicos**

**Por quê?**
- Handoff automático é crítico para delegação entre especialistas (Monitor DJEN → Justine → Prazos)
- Persistence permite recuperação após falhas (importante em processos jurídicos)
- MagenticOne é production-ready e usado internamente pela Microsoft

---

### 2. **Workflow Estruturado Dentro de Cada Agente**

| Aspecto | LangGraph | Haystack Pipeline | Verdict |
|---------|-----------|-------------------|--------|
| **Type-Safety** | ✅ TypedDict | ⚠️ Parcial | ✅ **LangGraph** |
| **Condicional Routing** | ✅ Powerful | ✅ Simples | ✅ **LangGraph** |
| **Tool Calling** | ✅ Native + Parallel | ⚠️ Manual | ✅ **LangGraph** |
| **Visualização** | ✅ Dashboard | ⚠️ Limited | ✅ **LangGraph** |
| **RAG Pipelines** | ❌ Não é especializado | ✅ Especializado | ⚖️ LangGraph (workflows) + Haystack (RAG) |
| **Async Support** | ✅ Native | ✅ Sim | ⚖️ Ambas |

**Recomendação**: **LangGraph para workflows internos** + **Haystack para RAG especializado**

**Por quê?**
- LangGraph excela em fluxos com decisões condicionais
- Haystack é especializado em RAG (melhor para buscas jurídicas)
- Usá-los separadamente evita abstração excessiva

---

### 3. **Otimização de Prompts Jurídicos**

| Aspecto | DSPy | Fine-Tuning Manual | Verdict |
|---------|------|-------------------|--------|
| **Automático** | ✅ 100% automático | ❌ Manual | ✅ **DSPy** |
| **Feedback Loop** | ✅ Aprende com erros | ⚠️ Lento | ✅ **DSPy** |
| **Few-Shot Gen** | ✅ COPRO/MIPROv2 | ❌ Manual | ✅ **DSPy** |
| **Qualidade Final** | ✅ Excelente | ✅ Excelente | ⚖️ Ambas |
| **Custo** | ⚠️ Mais chamadas LLM | ✅ Barato | ⚖️ Trade-off |
| **Tempo Setup** | Médio | Longo | ✅ **DSPy** |

**Recomendação**: **DSPy para otimização contínua**

**Por quê?**
- Feedback loop é essencial (operador corrige → sistema aprende)
- MIPROv2 com Bayesian search é ideal para prompts jurídicos complexos
- Automação reduz necessidade de manual fine-tuning

---

### 4. **Vector Database para Jurisprudência**

| Aspecto | Qdrant | ChromaDB | Pinecone |
|---------|--------|----------|----------|
| **Escala** | Bilhões ✅ | Milhões ⚠️ | Bilhões ✅ |
| **Sparse Vectors** | ✅ SPLADE/BM25 | ⚠️ Recente | ✅ Sim |
| **Hybrid Search** | ✅ Dense+Sparse | ✅ Sim | ✅ Sim |
| **Auto-Embedding** | ❌ Manual | ✅ Automático | ⚠️ Alguns modelos |
| **Self-Hosted** | ✅ Fácil | ✅ Fácil | ❌ Apenas Cloud |
| **Custo (Produção)** | 💰 Baixo | 💰 Médio | 💰💰 Alto |
| **Latência P99** | <10ms ✅ | <50ms | <10ms ✅ |

**Recomendação**: **Qdrant para produção jurídica**

**Por quê?**
- STF/STJ terão bilhões de documentos (Qdrant escala melhor)
- Sparse vectors críticos para legal search (jurisprudência é texto-heavy)
- Hybrid search (dense semântico + sparse keyword) é ideal para precedentes
- Self-hosted reduz dependência de vendors

**ChromaDB como alternativa**:
- Se começar com volume menor (<100M vetores)
- Prototipagem rápida é mais importante

---

### 5. **RAG Pipelines - Haystack vs LangChain**

| Aspecto | Haystack | LangChain | Verdict |
|---------|----------|-----------|--------|
| **Component Model** | ✅ Puro components | ⚠️ Mixed abstractions | ✅ **Haystack** |
| **Hybrid Retrieval** | ✅ Built-in | ⚠️ Manual composition | ✅ **Haystack** |
| **Generator Integration** | ✅ 5+ LLMs natively | ✅ Extensive | ⚖️ Ambas |
| **Async First** | ✅ AsyncPipeline | ✅ Sim | ⚖️ Ambas |
| **Documentation** | ✅ Excelente | ✅ Excelente | ⚖️ Ambas |
| **Specialization** | ✅ RAG-first | ❌ Genérico | ✅ **Haystack** |

**Recomendação**: **Haystack para RAG jurídico**

**Por quê?**
- Especializado em RAG (melhor design de componentes)
- Hybrid retrieval é nativo (BM25 + embedding)
- DocumentStore abstraction permite múltiplas backends
- Pipeline declarativo é mais fácil entender

---

## 🎯 Matriz de Decisão Consolidada

```
┌─────────────────────────┬──────────────────────────┬───────────────┐
│ Problema                │ Framework(s)             │ Por Quê?      │
├─────────────────────────┼──────────────────────────┼───────────────┤
│ Coordenar 15 agentes    │ AutoGen MagenticOne      │ Orquestração  │
│ jurídicos especializados│                          │ sofisticada   │
├─────────────────────────┼──────────────────────────┼───────────────┤
│ Fluxo interno de cada   │ LangGraph StateGraph     │ Type-safety + │
│ agente (decisões)       │                          │ condicional   │
├─────────────────────────┼──────────────────────────┼───────────────┤
│ Otimizar prompts via    │ DSPy (MIPROv2/GEPA)      │ Automático +  │
│ feedback de operador    │                          │ aprendizado   │
├─────────────────────────┼──────────────────────────┼───────────────┤
│ Buscar jurisprudência   │ Haystack (RAG) +         │ Hybrid search │
│ (semantic + keyword)    │ Qdrant (vector DB)       │ especializado │
├─────────────────────────┼──────────────────────────┼───────────────┤
│ Armazenar embeddings    │ Qdrant                   │ Escala +      │
│ em escala (~bilhões)    │                          │ sparse vectors│
└─────────────────────────┴──────────────────────────┴───────────────┘
```

---

## 🚫 Conflitos e Resoluções

### Conflito 1: "AutoGen já gerencia fluxo, por que LangGraph?"

**Problema**: Parecer redundante ter AutoGen (orchestração) + LangGraph (workflows)

**Resolução**:
```
AutoGen (Nível Macro)       LangGraph (Nível Micro)
    │                           │
    ├─ Agente A ─────────────────┼─ Node 1 (detect)
    │  (Monitor)                 ├─ Node 2 (analyze)
    │                            └─ Node 3 (escalate)
    │
    ├─ Agente B ─────────────────┼─ Node 1 (select_template)
    │  (Redação)                 ├─ Node 2 (generate)
    │                            └─ Node 3 (review)
    │
    └─ Agente C
       (Pesquisa)
```

**Por quê funciona**:
- AutoGen = Orquestração entre agentes (quem fala com quem)
- LangGraph = Fluxo dentro de cada agente (que passos executar)
- Separação de conceitos = código mais limpo e testável

---

### Conflito 2: "Haystack + Qdrant é complexo demais, por que não usar Pinecone?"

**Problema**: Adicionar 2 frameworks ao invés de 1 simplificaria?

**Resolução - Análise Comparativa**:

```python
# Opção A: Haystack + Qdrant (RECOMENDADA)
pipeline = Pipeline()
pipeline.addComponent("retriever", HybridRetriever(qdrant_client))
pipeline.addComponent("reranker", BgeReranker())  # Qualidade
pipeline.connect("retriever", "reranker")
# Vantagens: Controle total, sem vendor lock-in, hybrid nativo

# Opção B: LangChain + Pinecone (ALTERNATIVA)
from pinecone import Pinecone
index = Pinecone(api_key=key)  # Pronto
# Vantagens: Mais simples, sem DevOps
# Desvantagens: Caro em escala (~$0.10 por 1M queries)
```

**Recomendação**: Haystack + Qdrant para produção jurídica
- Bilhões de precedentes = custo Pinecone $$$ inviável
- Hybrid search crítico (legal search não é só semântico)
- Self-hosted = conformidade com dados jurídicos (LGPD)

---

### Conflito 3: "DSPy é Python, projeto é TypeScript. Como integrar?"

**Problema**: Misturar Python + TypeScript é complexo

**Resolução - Bridge Pattern**:

```
TypeScript (Frontend + API)        Python (DSPy Server)
    │                                    │
    ├─ LangGraph Agents                 ├─ FastAPI Bridge
    │  (TS)                             │  (Python)
    │                                    │
    ├─ Redacao Agent ◄────HTTP────────► ├─ MIPRO Optimizer
    │  (Gera minuta)      POST          │  (Otimiza prompt)
    │                    /optimize      │
    │                                    ├─ GEPA Teleprompter
    │                                    │  (Multimodal feedback)
    │                                    │
    │  Após operador corrigir            └─ save_new_prompt()
    │  minuta, enviar feedback           
    │  para otimização automática        
```

**Implementação**:
```typescript
// src/lib/dspy-bridge.ts
export async function optimizePrompt(
  currentPrompt: string,
  examples: any[]
) {
  const response = await fetch("http://localhost:8000/optimize", {
    method: "POST",
    body: JSON.stringify({ currentPrompt, examples }),
  });
  return response.json();
}
```

```bash
# Rodar em paralelo
npm run dev              # TypeScript
python scripts/bridge.py # DSPy (porta 8000)
```

---

### Conflito 4: "CrewAI é mais simples que AutoGen. Por que não usar?"

**Problema**: CrewAI tem abstração mais simples ("crew" vs "agents" arbitrários)

**Resolução - Trade-Off Analysis**:

| Critério | AutoGen | CrewAI |
|----------|---------|--------|
| **Simplicidade inicial** | ❌ Média | ✅ Alta |
| **Flexibilidade escalada** | ✅ Alta | ❌ Limitada |
| **Handoff automático** | ✅ Sim | ❌ Não |
| **State persistence** | ✅ Sim | ❌ Não |
| **Produção jurídica** | ✅ Recomendado | ⚠️ Não pronto |

**Recomendação**: AutoGen

**Por quê?**
- Handoff automático é **crítico** para fluxo jurídico complexo
- Persistence previne perda de contexto em longas conversas
- CrewAI é mais adequado para "times fixos simples"
- Assistente jurídico exige flexibilidade de AutoGen

---

## 🔄 Fluxo de Integração Recomendado

```
Entrada (Processo Jurídico)
    │
    ▼
┌─────────────────────────────────────┐
│ AutoGen Orchestrator                │  ← Decisão: qual agente?
│ (Tier 1: Orquestração)              │
└─────────────────────────────────────┘
    │
    ├─► Monitor DJEN (LangGraph)
    │   └─► Detectar publicações
    │       └─► Escalar para Justine
    │
    ├─► Mrs. Justin-e (LangGraph)
    │   └─► Analisar intimações
    │       └─► Criar tarefas
    │
    ├─► Redação Petições (LangGraph)
    │   └─► Selecionar template
    │       └─► Gerar com LLM
    │           └─► Revisar qualidade
    │               └─► (Se operador corrigir)
    │                   └─► DSPy otimiza prompt
    │
    └─► Pesquisa Jurisprudencial (LangGraph + Haystack + Qdrant)
        └─► Decomposição de query
            └─► Busca Haystack (hybrid)
                └─► Qdrant (dense + sparse)
                    └─► Rank e retornar
```

---

## 📋 Checklist de Decisão

- [x] Escolher AutoGen para orquestração? **SIM** (melhor para handoffs)
- [x] Usar LangGraph para workflows? **SIM** (type-safety crítico)
- [x] Integrar DSPy para otimização? **SIM** (feedback loop essencial)
- [x] Haystack para RAG? **SIM** (hybrid search especializado)
- [x] Qdrant para vector DB? **SIM** (escala + sparse vectors)
- [x] CrewAI como alternativa? **NÃO** (menos flexível)
- [x] Pinecone em vez de Qdrant? **NÃO** (custo alto em escala)

---

## 🚀 Próximos Passos

1. **Esta semana**: Prototype LangGraph com Monitor DJEN
2. **Próxima semana**: Integrar Qdrant + Haystack para pesquisa
3. **Semana 3**: Setup DSPy bridge Python
4. **Semana 4**: AutoGen orchestrator com todos agentes

**Docs de referência criados**:
- ✅ `ANALISE_FRAMEWORKS_HIBRIDOS.json` - Análise técnica completa
- ✅ `ROADMAP_IMPLEMENTACAO_HIBRIDA.md` - Plano passo-a-passo
- ✅ `MATRIZ_DECISAO_FRAMEWORKS.md` - Este arquivo (decisões justificadas)

