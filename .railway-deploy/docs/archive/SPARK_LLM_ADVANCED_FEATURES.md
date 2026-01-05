# Documentação: Recursos Avançados Spark LLM API

## Visão Geral

Este documento descreve as melhorias implementadas no Assistente Jurídico PJe, inspiradas nas funcionalidades do Databricks Spark LLM API. As implementações focam em **LLMOps**, **processamento NLP avançado**, **observabilidade** e **governança unificada**.

## Arquitetura

### Camada de Serviço Unificada

```
┌─────────────────────────────────────────────────────┐
│             Application Components                   │
│  (AIAgents, ProcessosView, PDFUploader, etc.)       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│          LLM Service Layer (llm-service.ts)         │
│                                                       │
│  • Request/Response Management                       │
│  • Caching (LRU with TTL)                           │
│  • Retry Logic (Exponential Backoff)               │
│  • Metrics Collection                               │
│  • Cost Tracking                                    │
│  • Audit Logging                                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│         NLP Pipeline (nlp-pipeline.ts)              │
│                                                       │
│  • Named Entity Recognition                         │
│  • Sentiment Analysis                               │
│  • Document Classification                          │
│  • Information Extraction                           │
│  • Batch Processing                                 │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              Spark LLM API                          │
│          (spark.llm, spark.llmPrompt)               │
└─────────────────────────────────────────────────────┘
```

## Componentes Principais

### 1. LLM Service (`src/lib/llm-service.ts`)

Serviço unificado para todas as operações de LLM com observabilidade completa.

#### Características:

- **Gerenciamento de Ciclo de Vida (LLMOps)**
  - Versionamento implícito através de audit logs
  - Tracking completo de métricas por requisição
  - Gestão de custos em tempo real
  
- **Cache Inteligente**
  - LRU (Least Recently Used) eviction
  - TTL configurável (padrão: 1 hora)
  - Hit rate tracking
  - Tamanho máximo: 100 entradas
  
- **Retry com Exponential Backoff**
  - Até 3 tentativas por padrão
  - Delays: 1s, 2s, 4s (max 10s)
  - Error handling robusto
  
- **Métricas Coletadas**
  - Tokens (prompt, completion, total)
  - Latência (ms)
  - Custo (R$)
  - Taxa de sucesso
  - Feature/usuário associado

#### Uso Básico:

```typescript
import { llmService } from '@/lib/llm-service'

// Execução simples
const response = await llmService.execute(
  'Analise este contrato...',
  {
    model: 'gpt-4o',
    useCache: true,
    feature: 'contract-analysis',
    userId: 'user-123'
  }
)

// Execução com JSON estruturado
const data = await llmService.executeJSON<ContractAnalysis>(
  'Analise este contrato e retorne JSON...',
  { feature: 'contract-analysis' }
)

// Processamento em lote
const results = await llmService.executeBatch([
  { id: '1', prompt: 'Analise documento 1' },
  { id: '2', prompt: 'Analise documento 2' }
])

// Obter métricas
const metrics = llmService.getAggregatedMetrics(24 * 60 * 60 * 1000) // últimas 24h
console.log({
  totalRequests: metrics.totalRequests,
  successRate: metrics.successRate,
  totalCost: metrics.totalCost,
  cacheHitRate: metrics.cacheHitRate
})
```

### 2. NLP Pipeline (`src/lib/nlp-pipeline.ts`)

Pipeline de processamento de linguagem natural para documentos jurídicos.

#### Operações Disponíveis:

##### a) Named Entity Recognition (NER)

Extrai entidades nomeadas de textos jurídicos:

```typescript
import { nlpPipeline } from '@/lib/nlp-pipeline'

const entities = await nlpPipeline.extractEntities(documentText)
// Retorna: NamedEntity[]
// Tipos: PERSON, ORGANIZATION, LOCATION, DATE, MONETARY_VALUE, 
//        LEGAL_REFERENCE, PROCESS_NUMBER, LAW_ARTICLE
```

Exemplo de entidade:
```typescript
{
  text: "João da Silva",
  type: "PERSON",
  start: 45,
  end: 59,
  confidence: 0.95
}
```

##### b) Análise de Sentimento

Analisa o sentimento do texto com aspectos detalhados:

```typescript
const sentiment = await nlpPipeline.analyzeSentiment(documentText)
// Retorna: SentimentAnalysis
```

Exemplo de resposta:
```typescript
{
  sentiment: "positive",
  score: 0.75,
  confidence: 0.89,
  aspects: [
    {
      aspect: "argumentação jurídica",
      sentiment: "positive",
      score: 0.82
    },
    {
      aspect: "fundamentação legal",
      sentiment: "neutral",
      score: 0.05
    }
  ]
}
```

##### c) Classificação de Documentos

Classifica documentos jurídicos automaticamente:

```typescript
const classification = await nlpPipeline.classifyDocument(documentText)
```

Exemplo:
```typescript
{
  category: "Petição Inicial",
  subcategory: "Ação de Cobrança",
  confidence: 0.92,
  tags: ["cível", "contrato", "inadimplência"]
}
```

##### d) Extração de Informações

Extrai informações estruturadas:

```typescript
const info = await nlpPipeline.extractInformation(documentText)
```

Exemplo:
```typescript
{
  summary: "Ação de cobrança referente a contrato de prestação...",
  keyPoints: [
    "Valor principal: R$ 50.000,00",
    "Inadimplência desde março/2024",
    "Cláusula penal: 10%"
  ],
  entities: [...],
  dates: ["15/03/2024", "30/04/2024"],
  monetaryValues: ["R$ 50.000,00", "R$ 5.000,00"],
  legalReferences: ["Art. 389 CC", "Art. 395 CC"],
  parties: ["Empresa XYZ Ltda", "José Santos"]
}
```

##### e) Processamento em Lote

Processa múltiplos documentos em paralelo:

```typescript
const results = await nlpPipeline.batchProcess(
  [
    { id: 'doc1', text: 'texto...' },
    { id: 'doc2', text: 'texto...' }
  ],
  'extract', // ou 'entities', 'sentiment', 'classify'
  { feature: 'batch-analysis' }
)
```

##### f) Recursos Adicionais

**Análise de Padrões:**
```typescript
const patterns = await nlpPipeline.analyzePatterns(
  documentText,
  ['prescrição', 'decadência', 'prazo fatal']
)
```

**Comparação de Documentos:**
```typescript
const comparison = await nlpPipeline.compareDocuments(doc1, doc2)
// Retorna similaridade, diferenças, adições e remoções
```

**Geração de Insights:**
```typescript
const insights = await nlpPipeline.generateInsights(
  documentText,
  'Contrato de Prestação de Serviços'
)
// Retorna summary, risks, opportunities, recommendations, urgency
```

### 3. Dashboard de Observabilidade (`src/components/LLMObservabilityDashboard.tsx`)

Interface visual para monitoramento de operações LLM.

#### Métricas Principais:

1. **Total de Requisições**: Volume total com taxa de sucesso
2. **Latência Média**: Performance das requisições
3. **Custo Total**: Gastos em R$ com tokens utilizados
4. **Taxa de Cache**: Eficiência do cache

#### Abas do Dashboard:

**Modelos**
- Distribuição de uso por modelo (GPT-4o, GPT-4, GPT-3.5-turbo)
- Porcentagem e contagem de requisições

**Features**
- Agrupamento por funcionalidade
- Ranking de features mais utilizadas

**Performance**
- Estatísticas de cache (tamanho, hits, idade média)
- Taxa de sucesso detalhada
- Últimas requisições processadas

**Auditoria**
- Log completo de operações
- Filtros por sucesso/erro
- Detalhes: timestamp, usuário, modelo, tokens, custo

#### Controles:

- Seleção de período (1h, 24h, 7d, 30d)
- Atualização manual
- Limpeza de cache
- Export de dados

### 4. Dashboard NLP Avançado (`src/components/AdvancedNLPDashboard.tsx`)

Interface para operações de NLP em documentos jurídicos.

#### Funcionalidades:

**Input de Documento**
- Área de texto para colar/digitar documento
- Múltiplas operações disponíveis
- Processamento individual ou completo

**Botões de Ação:**
- **Análise Completa**: Executa todas as operações em paralelo
- **Extrair Entidades**: Apenas NER
- **Analisar Sentimento**: Apenas análise de sentimento
- **Classificar**: Apenas classificação de documento
- **Extrair Info**: Apenas extração de informações

**Visualização de Resultados:**

1. **Tab Entidades**
   - Lista de entidades por tipo
   - Badges coloridos por categoria
   - Nível de confiança visual (progress bar)

2. **Tab Sentimento**
   - Sentimento geral (😊 Positivo, 😟 Negativo, 😐 Neutro)
   - Score e confiança
   - Análise por aspectos específicos

3. **Tab Classificação**
   - Categoria principal do documento
   - Subcategoria (se aplicável)
   - Tags relevantes
   - Confiança da classificação

4. **Tab Extração**
   - Resumo executivo
   - Pontos-chave destacados
   - Datas identificadas
   - Valores monetários
   - Referências legais
   - Partes envolvidas

**Recursos de Export:**
- Copiar para clipboard
- Download como JSON
- Compatível com importação em outras ferramentas

## Benefícios Inspirados no Databricks

### 1. Consultar e Servir LLMs ✅

**Implementado:**
- Abstração unificada sobre Spark LLM API
- Suporte a múltiplos modelos (GPT-4o, GPT-4, GPT-3.5-turbo)
- Switching automático e fallback

**Benefício:** Simplifica deploy e escalonamento de LLMs na aplicação jurídica.

### 2. Acelerar Aplicações de IA Generativa ✅

**Implementado:**
- Cache inteligente reduz latência em 99% para requisições repetidas
- Processamento em lote para múltiplos documentos
- Retry automático evita falhas temporárias

**Benefício:** Performance otimizada para operações jurídicas repetitivas.

### 3. Gerenciamento do Ciclo de Vida (LLMOps) ✅

**Implementado:**
- Métricas completas (tokens, latência, custo, sucesso)
- Audit log de todas as operações
- Dashboard de observabilidade em tempo real
- Controle de versões implícito via timestamps

**Benefício:** Confiabilidade e rastreabilidade corporativa.

### 4. Processamento de Linguagem Natural Avançado ✅

**Implementado:**
- NER específico para documentos jurídicos brasileiros
- Análise de sentimento com aspectos
- Classificação automática de documentos
- Extração estruturada de informações
- Batch processing

**Benefício:** Automação de tarefas de análise documental em larga escala.

### 5. Governança Unificada ✅

**Implementado:**
- Audit log completo
- Tracking por usuário e feature
- Controle de custos e uso
- Dashboard de observabilidade

**Benefício:** Governança e compliance em operações de IA.

## Casos de Uso

### 1. Análise em Massa de Intimações

```typescript
// Processar 100 intimações em lote
const intimacoes = [...] // array de textos
const results = await nlpPipeline.batchProcess(
  intimacoes.map((text, i) => ({ id: `int-${i}`, text })),
  'extract'
)

// Resultados prontos para dashboard
results.forEach(({ id, result, error }) => {
  if (!error) {
    console.log(`${id}: ${result.summary}`)
    console.log(`Prazo: ${result.dates[0]}`)
  }
})
```

### 2. Monitoramento de Custos

```typescript
// Obter custos das últimas 24 horas
const metrics = llmService.getAggregatedMetrics(24 * 60 * 60 * 1000)

if (metrics.totalCost > BUDGET_LIMIT) {
  alert('Orçamento de IA excedido!')
}

// Por feature
console.log('Custos por feature:', metrics.requestsByFeature)
```

### 3. Análise Estratégica de Processos

```typescript
// Gerar insights estratégicos
const processo = getProcesso(id)
const insights = await nlpPipeline.generateInsights(
  processo.descricao,
  'Processo Judicial'
)

console.log('Riscos:', insights.risks)
console.log('Oportunidades:', insights.opportunities)
console.log('Recomendações:', insights.recommendations)
console.log('Urgência:', insights.urgency)
```

### 4. Comparação de Versões de Contratos

```typescript
const comparison = await nlpPipeline.compareDocuments(
  contratoOriginal,
  contratoRevisado
)

console.log(`Similaridade: ${comparison.similarity}%`)
console.log('Adições:', comparison.additions)
console.log('Remoções:', comparison.removals)
```

## Métricas e Performance

### Custos Estimados

Com base nos preços de tokens GPT:

| Modelo | Custo por 1K tokens | Uso típico |
|--------|-------------------|-----------|
| GPT-4o | R$ 0,015 | Análises complexas |
| GPT-4 | R$ 0,030 | Tarefas críticas |
| GPT-3.5-turbo | R$ 0,002 | Classificações simples |

### Economia com Cache

- **Cache Hit**: 0ms de latência, R$ 0,00 de custo
- **Cache Miss**: ~2000ms de latência, custo variável
- **Taxa de hit esperada**: 40-60% em operações repetitivas

### Latências Típicas

| Operação | Latência | Cache Hit |
|----------|----------|-----------|
| NER | 1.5-3s | 0ms |
| Sentimento | 1-2s | 0ms |
| Classificação | 1-2s | 0ms |
| Extração Completa | 3-5s | 0ms |
| Batch (10 docs) | 5-10s | - |

## Navegação na Interface

### Acessar Dashboard de Observabilidade

1. Login na aplicação
2. Menu lateral: **"Observabilidade LLM"**
3. Visualizar métricas em tempo real
4. Selecionar período de análise
5. Explorar abas: Modelos, Features, Performance, Auditoria

### Acessar Dashboard NLP

1. Login na aplicação
2. Menu lateral: **"NLP Avançado"**
3. Colar texto do documento
4. Clicar em "Análise Completa" ou operação específica
5. Visualizar resultados nas abas
6. Exportar dados conforme necessário

## Manutenção e Configuração

### Ajustar Configurações de Cache

Em `src/lib/llm-service.ts`:

```typescript
private readonly CACHE_TTL_MS = 1000 * 60 * 60 // 1 hora
private readonly MAX_CACHE_SIZE = 100 // máximo de entradas
```

### Ajustar Custos

Atualizar tabela de preços em `src/lib/llm-service.ts`:

```typescript
private readonly COST_PER_1K_TOKENS: Record<LLMModel, number> = {
  'gpt-4o': 0.015,
  'gpt-4': 0.03,
  'gpt-3.5-turbo': 0.002
}
```

### Ajustar Retry

```typescript
const response = await llmService.execute(prompt, {
  retryAttempts: 5, // aumentar tentativas
  timeout: 30000 // 30 segundos
})
```

## Roadmap Futuro

### Planejado

- [ ] Persistência de métricas em KV store
- [ ] Alertas automáticos de custo
- [ ] Fine-tuning feedback loop
- [ ] RAG (Retrieval Augmented Generation) com base de conhecimento
- [ ] Multi-agent orchestration melhorado
- [ ] Streaming de respostas LLM
- [ ] Integração com MLflow para tracking de modelos
- [ ] A/B testing de prompts
- [ ] Análise de qualidade de respostas
- [ ] Dashboard de tendências e insights

### Em Consideração

- [ ] Modelos locais para documentos sensíveis
- [ ] Embedding de documentos para similaridade
- [ ] Summarização hierárquica
- [ ] Geração de petições completas
- [ ] OCR integrado para PDFs

## Suporte e Documentação

Para dúvidas sobre:

- **LLM Service**: Ver código em `src/lib/llm-service.ts`
- **NLP Pipeline**: Ver código em `src/lib/nlp-pipeline.ts`
- **UI Observabilidade**: Ver código em `src/components/LLMObservabilityDashboard.tsx`
- **UI NLP**: Ver código em `src/components/AdvancedNLPDashboard.tsx`

Todos os serviços possuem comentários detalhados em TypeScript.

## Conclusão

A implementação dos recursos Spark LLM API inspirados no Databricks traz:

✅ **Profissionalismo**: Observabilidade e governança de nível corporativo
✅ **Eficiência**: Cache, retry e batch processing otimizam performance
✅ **Inteligência**: NLP avançado automatiza análise documental
✅ **Controle**: Métricas completas de uso, custo e performance
✅ **Escalabilidade**: Arquitetura preparada para crescimento

O sistema agora está equipado com ferramentas de IA de classe empresarial, mantendo a interface amigável e o foco na experiência do usuário jurídico.
