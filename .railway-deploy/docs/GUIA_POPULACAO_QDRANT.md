# ?? Guia de Implementação - População Automática do Qdrant

## ? Status: PRONTO PARA IMPLEMENTAÇÃO

Todos os componentes técnicos foram desenvolvidos e documentados. Este guia consolida a arquitetura e fornece instruções passo-a-passo para ativação.

---

## ?? Componentes Implementados

### 1. **Documentação**
- ? `docs/ARQUITETURA_POPULACAO_QDRANT.md` - Arquitetura completa (300 linhas)
- ? `docs/CORRECOES_IMPLEMENTADAS.md` - Correções pós-análise Serena

### 2. **Serviços Core**
- ? `src/lib/tema-extractor.ts` - Extração inteligente de temas (450 linhas)
- ? `src/lib/qdrant-auto-populator.ts` - População automática (400 linhas)

### 3. **Hooks React**
- ? `src/hooks/use-qdrant-auto-populate.ts` - Hook React para UI (250 linhas)

### 4. **Scripts de Manutenção**
- ? `scripts/populate-qdrant-datajud.ts` - População inicial/bulk (melhorado)
- ? `scripts/test-qdrant.ts` - Validação de conexão e busca

### 5. **Instrumentação**
- ? `src/agents/base/langgraph_agent.ts` - Sentry AI Monitoring
- ? `src/lib/agent-metrics.ts` - Métricas de performance

### 6. **Testes**
- ? `tests/hybrid/hybrid-integration.test.ts` - Testes E2E
- ? `tests/hybrid/orchestration.test.ts` - Testes de orquestração

---

## ?? Fluxo de População Automática

```
TRIGGER: Nova Intimação
         ?
         ?
??????????????????????????
? 1. Mrs. Justin-e       ?  ? Analisa intimação
?    (Agente Principal)  ?
??????????????????????????
            ?
            ?
??????????????????????????
? 2. TemaExtractor       ?  ? Extrai tema + entidades (Gemini)
?    - Tema primário     ?
?    - Temas secundários ?
?    - Palavras-chave    ?
?    - Entidades (NER)   ?
??????????????????????????
            ?
            ?
??????????????????????????
? 3. DataJud Service     ?  ? Busca precedentes (paralelo)
?    - Por tema          ?
?    - Por processo      ?
??????????????????????????
            ?
            ?
??????????????????????????
? 4. Gemini Embeddings   ?  ? Gera vetor 768d
?    - text-embedding-004?
?    - Validação         ?
??????????????????????????
            ?
            ?
??????????????????????????
? 5. Qdrant Insert       ?  ? Armazena documento + vetor
?    - Collection: legal_?
?      docs              ?
?    - Payload: 20+      ?
?      campos            ?
??????????????????????????
            ?
            ?
??????????????????????????
? 6. Redis Cache         ?  ? Índice reverso
?    - processo ? id     ?
?    - tema ? [ids]      ?
??????????????????????????
```

---

## ?? Configuração

### 1. Variáveis de Ambiente

Adicione ao `.env`:

```bash
# Qdrant (já configurado)
QDRANT_URL=https://4aee698c-53f6-4571-8f41-eb80f56ff1f2.us-east4-0.gcp.cloud.qdrant.io:6333
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.x_25dZul95SHNLLE0bu3bvZtGDrZgbpPiYBTgEAgF0U
QDRANT_COLLECTION_NAME=legal_docs
QDRANT_TIMEOUT=30000

# Gemini (já configurado)
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# Upstash Redis (já configurado)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# DataJud CNJ (público)
DATAJUD_BASE_URL=https://api-publica.datajud.cnj.jus.br
```

### 2. Inicializar Collection Qdrant

```bash
# Criar collection com dimensões corretas (768d)
npm run qdrant:test
```

Resultado esperado:
```
? Conectado: https://...
?? Collection: legal_docs
?? Modelo Gemini: text-embedding-004 (768 dimensões)
? Collection verificada/criada
```

---

## ?? Ativação da População Automática

### Opção 1: Integração com Mrs. Justin-e (Recomendado)

Edite `src/agents/justine/justine_graph.ts`:

```typescript
import { QdrantAutoPopulator } from "@/lib/qdrant-auto-populator";
import { temaExtractor } from "@/lib/tema-extractor";
import { geminiEmbeddingService } from "@/lib/gemini-embedding-service";
import { dataJudService } from "@/lib/datajud-service";
import { createQdrantService } from "@/lib/qdrant-service";

export class JustineAgent extends LangGraphAgent {
  private autoPopulator: QdrantAutoPopulator;

  constructor(config?: Partial<LangGraphConfig>) {
    super({ ...config, agentName: "justine" });

    // Inicializar auto-populator
    const qdrant = createQdrantService({
      url: import.meta.env.QDRANT_URL || "",
      apiKey: import.meta.env.QDRANT_API_KEY || "",
      collectionName: "legal_docs",
    });

    if (qdrant) {
      this.autoPopulator = new QdrantAutoPopulator(
        qdrant,
        dataJudService,
        temaExtractor,
        geminiEmbeddingService
      );
    }
  }

  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    const intimacao = state.data.intimacao;

    // Análise padrão da Mrs. Justin-e
    const analiseResult = await this.analisarIntimacao(intimacao);

    // População Qdrant (assíncrono, não bloqueia)
    if (this.autoPopulator && intimacao.numeroProcesso) {
      this.populateQdrantInBackground(intimacao).catch((error) => {
        console.error("[Justin-e] Erro ao popular Qdrant:", error);
      });
    }

    return updateState(state, {
      data: { ...state.data, analise: analiseResult },
      completed: true,
    });
  }

  private async populateQdrantInBackground(intimacao: Expediente): Promise<void> {
    try {
      const result = await this.autoPopulator.populateFromIntimacao(intimacao);

      if (result.inserted) {
        console.log(`[Justin-e] ? Qdrant populated: ${result.qdrantId}`);
        console.log(`[Justin-e] Tema: ${result.temas.temaPrimario} (${result.temas.confidence})`);
        console.log(`[Justin-e] Precedentes: ${result.precedentesEncontrados}`);
        console.log(`[Justin-e] Duração: ${result.duration}ms`);
      }
    } catch (error) {
      console.error("[Justin-e] Falha na população Qdrant:", error);
    }
  }
}
```

### Opção 2: Hook React no UI

```tsx
// src/pages/Expedientes.tsx

import { useQdrantAutoPopulate } from "@/hooks/use-qdrant-auto-populate";

function ExpedientesPage() {
  const { populate, status, result } = useQdrantAutoPopulate({
    onSuccess: (result) => {
      toast.success(
        `?? Tema: ${result.temas.temaPrimario}\n` +
        `?? ${result.precedentesEncontrados} precedentes encontrados`
      );
    },
    onError: (error) => {
      toast.error(`Erro ao popular Qdrant: ${error.message}`);
    },
  });

  const handleNovaIntimacao = async (intimacao: Expediente) => {
    // Processar intimação normalmente
    await processarIntimacao(intimacao);

    // Popular Qdrant automaticamente
    if (intimacao.novo) {
      await populate(intimacao);
    }
  };

  return (
    <div>
      {status === "processing" && (
        <div className="flex items-center gap-2">
          <Spinner />
          <span>Analisando e populando Qdrant...</span>
        </div>
      )}

      {result && (
        <div className="bg-green-50 p-4 rounded">
          <h4>? Documento indexado no Qdrant</h4>
          <p>Tema: {result.temas.temaPrimario}</p>
          <p>Confiança: {(result.temas.confidence * 100).toFixed(1)}%</p>
          <p>Precedentes: {result.precedentesEncontrados}</p>
        </div>
      )}
    </div>
  );
}
```

### Opção 3: Batch Processing (População Inicial)

```bash
# População inicial com DataJud (dry-run primeiro)
npm run qdrant:populate:dry-run

# População real
npm run qdrant:populate-datajud
```

---

## ?? Monitoramento e Validação

### 1. Verificar População

```bash
npm run qdrant:test
```

Resultado esperado:
```
?? Testando busca semântica...

?? Query: "ação trabalhista rescisão contrato"
   ??  Embedding gerado em: 450ms
   ??  Busca executada em: 85ms
   ?? Resultados encontrados: 5

   ?? Top Resultados:

   1. Score: 0.8542
      Número: 0001234-56.2024.5.03.0001
      Tribunal: TST
      Classe: Reclamação Trabalhista
      Assunto: Rescisão Indireta

? Performance excelente! (85ms)
```

### 2. Dashboard de Métricas

```typescript
import { useAgentMetrics } from "@/lib/agent-metrics";

function QdrantMetricsDashboard() {
  const justineStats = useAgentMetrics("justine");

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard
        title="Latência Média"
        value={`${justineStats?.averageLatency || 0}ms`}
        target="< 2000ms"
      />
      <MetricCard
        title="Taxa de Sucesso"
        value={`${((justineStats?.successfulExecutions || 0) / (justineStats?.totalExecutions || 1) * 100).toFixed(1)}%`}
        target="> 95%"
      />
      <MetricCard
        title="Total Populado"
        value={justineStats?.totalExecutions || 0}
      />
      <MetricCard
        title="Throughput"
        value={`${justineStats?.throughput.toFixed(1) || 0}/min`}
      />
    </div>
  );
}
```

### 3. Sentry AI Monitoring

Verifique no Sentry:
- Spans: `gen_ai.operation.chat` com `gen_ai.agent.name=justine`
- Atributos: `conversation.session_id`, `conversation.turn`
- Métricas: `gen_ai.usage.total_tokens`, `gen_ai.response.time`

---

## ?? Casos de Uso

### 1. Análise de Intimação + População Automática

```typescript
// Fluxo completo automático
async function processarIntimacaoDJEN(expediente: Expediente) {
  // 1. Mrs. Justin-e analisa
  const analise = await justineAgent.analyze(expediente);

  // 2. População Qdrant automática (dentro do agent)
  // ? Já acontece automaticamente

  // 3. Busca precedentes similares
  const similares = await qdrant.search(
    analise.embedding,
    5,
    {
      must: [
        { key: "temaPrimario", match: { value: analise.tema } },
        { key: "tribunal", match: { value: expediente.tribunal } },
      ],
    }
  );

  return {
    analise,
    precedentesSimilares: similares,
  };
}
```

### 2. Busca Semântica de Casos Similares

```typescript
async function buscarCasosSimilares(query: string) {
  // 1. Gerar embedding da query
  const embedding = await geminiEmbeddingService.generateQueryEmbedding(query);

  // 2. Buscar no Qdrant
  const results = await qdrant.search(embedding.embedding, 10, {
    scoreThreshold: 0.7,
  });

  return results.map((r) => ({
    numeroProcesso: r.payload.numeroProcesso,
    tema: r.payload.temaPrimario,
    similaridade: r.score,
    precedentes: r.payload.precedentesRelevantes,
  }));
}
```

### 3. Análise Temática de Todo o Escritório

```typescript
async function analisarTemasEscritorio() {
  // Buscar todos documentos
  const allDocs = await qdrant.search(
    new Array(768).fill(0), // Dummy vector
    1000,
    {
      must: [{ key: "escritorio", match: { value: "default" } }],
    }
  );

  // Agrupar por tema
  const temasCounts = new Map<string, number>();
  allDocs.forEach((doc) => {
    const tema = doc.payload.temaPrimario;
    temasCounts.set(tema, (temasCounts.get(tema) || 0) + 1);
  });

  // Top 10 temas
  return Array.from(temasCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}
```

---

## ?? Troubleshooting

### Erro: "Qdrant não configurado"

? **Solução:** Verifique `.env`:
```bash
echo $QDRANT_URL
echo $QDRANT_API_KEY
```

### Erro: "Confiança muito baixa na extração de temas"

? **Solução:** Ajuste `minConfidence` no auto-populator:
```typescript
new QdrantAutoPopulator(..., { minConfidence: 0.6 })
```

### Erro: "Embedding inválido: Magnitude anormal"

? **Solução:** Verifique modelo Gemini:
```typescript
// Deve ser text-embedding-004
await geminiEmbeddingService.generateDocumentEmbedding(...)
```

### Busca retorna 0 resultados

? **Solução:** Verifique se collection está populada:
```bash
npm run qdrant:test
```

---

## ?? Roadmap de Evolução

### Fase 1 (Atual): Core Functionality ?
- [x] Extração de temas
- [x] População automática
- [x] Busca vetorial
- [x] Cache Redis

### Fase 2: Otimizações (2 semanas)
- [ ] Queue assíncrona (BullMQ)
- [ ] Batch embedding (5 docs/vez)
- [ ] Re-ranking com cross-encoder
- [ ] Multi-tenancy (por escritório)

### Fase 3: Features Avançadas (1 mês)
- [ ] Auto-update de temas (re-classificação periódica)
- [ ] Clustering de casos similares
- [ ] Recomendação de estratégias baseada em precedentes
- [ ] Dashboard analytics de temas

---

## ? Checklist de Ativação

- [ ] 1. Variáveis de ambiente configuradas
- [ ] 2. Collection Qdrant inicializada (`npm run qdrant:test`)
- [ ] 3. Integração com Mrs. Justin-e implementada
- [ ] 4. População inicial executada (`npm run qdrant:populate-datajud`)
- [ ] 5. Testes E2E passando (`npm run test:hybrid`)
- [ ] 6. Monitoramento Sentry configurado
- [ ] 7. Dashboard de métricas funcionando
- [ ] 8. Documentação revisada pela equipe

---

## ?? Referências

- [Arquitetura Completa](./ARQUITETURA_POPULACAO_QDRANT.md)
- [Correções Implementadas](./CORRECOES_IMPLEMENTADAS.md)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Gemini Embeddings API](https://ai.google.dev/docs/embeddings)
- [DataJud CNJ](https://datajud-wiki.cnj.jus.br/)
