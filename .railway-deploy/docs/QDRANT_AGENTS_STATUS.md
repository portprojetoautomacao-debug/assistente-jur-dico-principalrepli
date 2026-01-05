# ?? Status de Conex�o: Cluster Qdrant x Agentes

**Data**: 09/12/2024
**Cluster**: `https://4aee698c-53f6-4571-8f41-eb80f56ff1f2.us-east4-0.gcp.cloud.qdrant.io:6333`
**Collection**: `legal_docs`

---

## ?? **Situa��o Atual**

### ? **Cluster Qdrant: Operacional**

| Item | Status |
|------|--------|
| Cluster criado | ? Sim |
| Collection `legal_docs` | ? Criada |
| API Key configurada | ? Sim |
| Conex�o testada | ? Funcionando |
| Vetores armazenados | ? 0 (vazio) |

### ? **Agentes: N�O Conectados**

**Nenhum agente est� conectado ao Qdrant atualmente!**

| Agente | Status Qdrant | Observa��o |
|--------|---------------|------------|
| **Pesquisa Juris** | ?? **MOCK** | Deveria usar, mas usa dados mockados |
| Harvey Specter | ? N�o | Chatbot conversacional (n�o precisa) |
| Mrs. Justin-e | ? N�o | An�lise de intima��es (n�o precisa) |
| Monitor DJEN | ? N�o | Monitoramento DJEN (n�o precisa) |
| Reda��o Peti��es | ? N�o | Usa templates locais |
| An�lise Documental | ? N�o | Poderia usar, mas n�o implementado |
| Revis�o Contratual | ? N�o | N�o implementado |
| Outros 8 agentes | ? N�o | N�o implementados |

---

## ?? **Evid�ncias de MOCK vs REAL**

### **Agente Atual (Mock)**

```typescript
// src/agents/pesquisa-juris/pesquisa_graph.ts
const precedentes = [
  { titulo: "STF - Tema 1234...", relevancia: 0.92 } // ? HARDCODED!
];
```

### **Servi�o Qdrant (Existe mas N�o � Usado)**

```typescript
// src/lib/qdrant-service.ts
export class QdrantService {
  async search(vector: number[], limit: number): Promise<SearchResult[]> // ? IMPLEMENTADO
}
```

**Problema**: ? Nenhum agente importa `QdrantService`!

---

## ?? **Arquivos Criados para Resolver**

### **1. Agente com Integra��o Real**

? **`src/agents/pesquisa-juris/pesquisa_graph_qdrant.ts`**

- Importa `createQdrantService`
- Gera embedding da query
- Busca vetores similares no cluster
- Fallback para mock se Qdrant indispon�vel
- Instrumenta��o Sentry completa

**Caracter�sticas:**

- ? Usa `VITE_QDRANT_URL`, `VITE_QDRANT_API_KEY`, `VITE_QDRANT_COLLECTION_NAME`
- ? Busca real via `qdrantService.search()`
- ? Fallback autom�tico se cluster offline
- ? Sentry spans para monitoramento

---

## ?? **O Que Falta Fazer**

### **Fase 1: Popular a Collection (URGENTE)**

? **Collection est� vazia** - precisa ser populada com dados jur�dicos

**Op��es:**

1. **Scraping STF/STJ** (manual ou script)
2. **Upload de PDFs jur�dicos** (converter para embeddings)
3. **Importar base de precedentes** (JSON/CSV)

### **Fase 2: Implementar Embedding Generation**

? **Placeholder de embedding** - precisa integra��o real com Gemini

```typescript
// src/lib/gemini-embedding-service.ts
export async function generateEmbedding(text: string): Promise<number[]> {
  // Chamar Gemini/OpenAI Embedding API
  // Retornar vetor de 768 dimens�es (text-embedding-004 / text-embedding-3-large)
}
```

### **Fase 3: Conectar Agente ao Sistema**

? **Registrar agente no sistema** - adicionar ao registry de agentes

```typescript
// src/lib/agents.ts
export const AGENTS: Agent[] = [
  // ...existing agents...
  {
    id: "pesquisa-juris-qdrant",
    name: "Pesquisa Jurisprudencial (Qdrant)",
    capabilities: ["jurisprudence-search", "precedent-analysis", "vector-search"],
    // ...
  },
];
```

### **Fase 4: Testar Integra��o End-to-End**

? **Validar fluxo completo**:

1. Query ? Embedding ? Qdrant Search ? Resultados
2. Fallback funciona se Qdrant offline
3. Sentry spans aparecem no dashboard
4. Performance aceit�vel (<500ms)

---

## ?? **Plano de A��o Imediato**

### **Passo 1: Popular Collection com Dados de Teste**

```typescript
// scripts/populate-qdrant-test-data.ts
import { createQdrantService } from "../src/lib/qdrant-service";

const service = createQdrantService({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
  collectionName: "legal_docs",
});

const testData = [
  {
    id: "stf-001",
    vector: Array.from({ length: 768 }, () => Math.random()),
    payload: {
      tribunal: "STF",
      titulo: "Tema 1234 - Direito � greve",
      ementa: "� constitucional o exerc�cio do direito de greve...",
      data: "2023-05-15",
      numero: "ADPF-123",
    },
  },
  // ... mais 10-20 precedentes de teste
];

await service.upsert(testData);
console.log("? Dados de teste inseridos!");
```

**Executar**:

```sh
tsx scripts/populate-qdrant-test-data.ts
```

### **Passo 2: Integrar Gemini Embedding**

```typescript
// src/lib/gemini-embedding-service.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}
```

### **Passo 3: Atualizar Agente para Usar Embedding Real**

```typescript
// src/agents/pesquisa-juris/pesquisa_graph_qdrant.ts
import { generateEmbedding } from "@/lib/gemini-embedding-service";

private async generateEmbedding(text: string): Promise<number[]> {
  return generateEmbedding(text); // ? REAL, n�o mock
}
```

### **Passo 4: Registrar no Sistema**

```typescript
// src/lib/agents.ts
{
  id: "pesquisa-juris-qdrant",
  name: "Pesquisa Jurisprudencial (Qdrant)",
  description: "Busca precedentes usando busca vetorial no Qdrant",
  capabilities: ["jurisprudence-search", "vector-search", "precedent-analysis"],
  active: true,
  implementation: () => import("../agents/pesquisa-juris/pesquisa_graph_qdrant"),
},
```

### **Passo 5: Testar End-to-End**

```sh
# 1. Popular dados de teste
npm run qdrant:populate-test

# 2. Iniciar app
npm run dev

# 3. Testar pesquisa no dashboard
# Abrir painel de Pesquisa Jurisprudencial
# Executar busca: "direito � greve"
# Verificar se retorna precedentes do Qdrant

# 4. Verificar Sentry
# Acessar Sentry.io ? AI Agents
# Validar spans de "qdrant_vector_search"
```

---

## ?? **M�tricas de Sucesso**

| M�trica | Meta | Status Atual |
|---------|------|--------------|
| Agentes conectados ao Qdrant | ?1 | 0 ? |
| Vetores na collection | ?100 | 0 ? |
| Tempo de resposta | <500ms | N/A |
| Taxa de sucesso | >95% | N/A |
| Relev�ncia m�dia | >0.7 | N/A |

---

## ?? **Documenta��o Relacionada**

- `docs/QDRANT_SETUP_CHECKLIST.md` - Setup do cluster
- `docs/QDRANT_CONFIG_COMPLETA.md` - Configura��o final
- `ROADMAP_IMPLEMENTACAO_HIBRIDA.md` - Fase 2 (Retrieval)
- `src/lib/qdrant-service.ts` - Servi�o TypeScript
- `src/agents/pesquisa-juris/pesquisa_graph_qdrant.ts` - ? **NOVO!**

---

## ? **Resumo Executivo**

### **Status Atual**: ?? **Cluster OK, Agentes N�o Conectados**

- ? Cluster Qdrant configurado e funcionando
- ? Collection `legal_docs` criada
- ? **Nenhum agente conectado funcionalmente**
- ? Collection vazia (0 vetores)
- ?? Agente de Pesquisa Juris usa **dados mockados**

### **Pr�ximos Passos**:

1. ? Popular collection com dados de teste (criado script)
2. ? Integrar Gemini Embedding Service (criado m�dulo)
3. ? Conectar agente `pesquisa-juris-qdrant` (criado)
4. ? Testar end-to-end
5. ? Registrar no sistema de agentes

**Tempo estimado**: 2-4 horas para completar integra��o funcional

---

**�ltima atualiza��o**: 09/12/2024
