# ?? Integração Qdrant - Instruções dos Agentes Atualizadas

## ? Status: CONCLUÍDO

Data: 10/12/2024

---

## ?? Objetivo

Atualizar as instruções (system prompts) de todos os agentes relevantes para incluir informações sobre:
- População automática do Qdrant com jurisprudências do DataJud
- Busca vetorial semântica com embeddings de 768 dimensões
- Integração com o fluxo de trabalho dos agentes

---

## ?? Agentes Atualizados

### 1. **Mrs. Justin-e** (`justine`)

**O que foi adicionado:**
- Seção "?? POPULAÇÃO AUTOMÁTICA DO QDRANT"
- Explicação do fluxo automático:
  1. Extração de tema jurídico
  2. Busca de precedentes no DataJud
  3. Geração de embeddings com Gemini
  4. Inserção no Qdrant Cloud
  5. Indexação no Redis

**Benefícios:**
- ? Justin-e sabe que não precisa fazer nada manualmente
- ? Sistema cuida da população em background
- ? Transparência sobre o processo de indexação

---

### 2. **Pesquisa Jurisprudencial** (`pesquisa-juris`)

**O que foi adicionado:**
- Seção "?? BUSCA VETORIAL NO QDRANT"
- Detalhes da collection:
  - 768 dimensões (Gemini text-embedding-004)
  - Metadados: tribunal, classe, assunto, tema
  - Busca por cosine similarity
- Explicação do fluxo de busca:
  1. Gerar embedding da query
  2. Buscar top-K similares
  3. Aplicar filtros (tribunal, tema, data)
  4. Retornar ordenado por score

**Benefícios:**
- ? Agente sabe como usar busca vetorial
- ? Entende os metadados disponíveis
- ? Pode filtrar por tribunal/tema

---

### 3. **Análise Documental** (`analise-documental`)

**O que foi adicionado:**
- Seção "?? INTEGRAÇÃO COM QDRANT"
- Casos de uso:
  - Verificar casos similares existentes
  - Buscar precedentes por similaridade
  - Enriquecer análise com jurisprudências

**Benefícios:**
- ? Análise enriquecida com precedentes
- ? Contexto histórico de casos similares
- ? Melhor classificação de documentos

---

### 4. **Redação de Petições** (`redacao-peticoes`)

**O que foi adicionado:**
- Seção "?? PRECEDENTES DO QDRANT"
- Como usar precedentes:
  - Fundamentação com jurisprudências indexadas
  - Citação de teses similares
  - Busca semântica por tema
- Exemplo de citação: "Conforme precedente similar indexado no sistema..."

**Benefícios:**
- ? Petições fundamentadas com jurisprudência real
- ? Busca automática de precedentes similares
- ? Qualidade técnica superior

---

### 5. **Estratégia Processual** (`estrategia-processual`)

**O que foi adicionado:**
- Seção "?? ANÁLISE COM PRECEDENTES DO QDRANT"
- Como usar para estratégia:
  - Casos similares já julgados
  - Teses vencedoras em tribunais superiores
  - Tendências jurisprudenciais por tema
  - Taxa de sucesso histórica
- Exemplo: "Baseado em 12 precedentes similares (tema: rescisão), estratégia X teve 85% sucesso no TST"

**Benefícios:**
- ? Estratégias baseadas em dados reais
- ? Probabilidade de sucesso fundamentada
- ? Decisões mais informadas

---

## ??? Arquitetura de População Automática

### Fluxo Completo

```
Nova Intimação (DJEN/PJe)
         ?
Mrs. Justin-e (análise)
         ?
TemaExtractor (Gemini)
    ?         ?
Tema     Entidades/Keywords
    ?         ?
DataJud API (CNJ)
         ?
Precedentes Encontrados
         ?
Gemini Embeddings (768d)
         ?
Qdrant Insert (vector + payload)
         ?
Redis Cache (índice reverso)
```

### Componentes Técnicos

| Componente | Arquivo | Função |
|------------|---------|--------|
| **TemaExtractor** | `src/lib/tema-extractor.ts` | Extrai tema jurídico com Gemini |
| **QdrantAutoPopulator** | `src/lib/qdrant-auto-populator.ts` | Orquestra população automática |
| **DataJudService** | `src/lib/datajud-service.ts` | Busca precedentes CNJ |
| **GeminiEmbedding** | `src/lib/gemini-embedding-service.ts` | Gera vetores 768d |
| **QdrantService** | `src/lib/qdrant-service.ts` | CRUD no Qdrant Cloud |

---

## ?? Metadados Armazenados no Qdrant

Cada documento jurídico no Qdrant possui:

```typescript
{
  id: "processo-123",
  vector: [0.123, -0.456, ...], // 768 dimensões
  payload: {
    numeroProcesso: "0001234-56.2024.5.03.0001",
    tribunal: "TST",
    classe: "Reclamação Trabalhista",
    assunto: "Rescisão Indireta",
    temaPrimario: "Rescisão Indireta",
    temasSecundarios: ["FGTS", "Verbas Rescisórias"],
    palavrasChave: ["rescisão", "justa causa", "reversão"],
    dataAjuizamento: "2024-01-15",
    orgaoJulgador: "1ª Turma",
    totalMovimentacoes: 12,
    partes: "João Silva vs Empresa XYZ",
    embedModel: "text-embedding-004",
    createdAt: "2024-12-10T10:30:00Z",
    escritorio: "default"
  }
}
```

---

## ?? Exemplos de Uso por Agente

### Mrs. Justin-e

```typescript
// Fluxo automático após processar intimação
const intimacao = await buscarIntimacaoPendente();
const analise = await analisarIntimacao(intimacao);

// População automática em background (não bloqueia)
autoPopulator.populateFromIntimacao(intimacao)
  .then(result => {
    console.log(`? Populado: ${result.qdrantId}`);
    console.log(`Tema: ${result.temas.temaPrimario}`);
    console.log(`Precedentes: ${result.precedentesEncontrados}`);
  });
```

### Pesquisa Jurisprudencial

```typescript
// Buscar precedentes similares
const query = "rescisão indireta justa causa reversão";
const embedding = await gemini.generateQueryEmbedding(query);

const similares = await qdrant.search(
  embedding.embedding,
  limit: 10,
  filter: {
    must: [
      { key: "tribunal", match: { value: "TST" } },
      { key: "temaPrimario", match: { value: "Rescisão Indireta" } }
    ]
  },
  scoreThreshold: 0.75
);
```

### Redação de Petições

```typescript
// Buscar precedentes para fundamentar petição
const temaProcesso = "rescisão indireta";
const embedding = await gemini.generateQueryEmbedding(temaProcesso);

const precedentes = await qdrant.search(embedding.embedding, 5);

// Incluir na petição:
precedentes.forEach(p => {
  petição += `\n\nConforme precedente ${p.payload.numeroProcesso} `;
  petição += `(${p.payload.tribunal}, ${p.payload.orgaoJulgador}), `;
  petição += `similaridade: ${(p.score * 100).toFixed(1)}%...`;
});
```

### Estratégia Processual

```typescript
// Analisar sucesso histórico de estratégias
const estrategiasTestadas = await qdrant.search(
  embedding,
  50,
  {
    must: [
      { key: "temaPrimario", match: { value: tema } },
      { key: "tribunal", match: { value: "TST" } }
    ]
  }
);

// Calcular taxa de sucesso
const sucessos = estrategiasTestadas.filter(e => 
  e.payload.resultado === "procedente"
).length;

const taxaSucesso = (sucessos / estrategiasTestadas.length) * 100;

console.log(`Taxa de sucesso: ${taxaSucesso.toFixed(1)}% (${sucessos}/${estrategiasTestadas.length})`);
```

---

## ?? Próximos Passos

### 1. Testar População Automática

```bash
# Inicializar collection
npm run qdrant:test

# População inicial (dry-run primeiro)
npm run qdrant:populate:dry-run

# População real
npm run qdrant:populate-datajud
```

### 2. Integrar com Mrs. Justin-e

```typescript
// Em src/agents/justine/justine_graph.ts
import { QdrantAutoPopulator } from "@/lib/qdrant-auto-populator";

export class JustineAgent extends LangGraphAgent {
  private autoPopulator: QdrantAutoPopulator;
  
  constructor() {
    super({ agentName: "justine" });
    this.autoPopulator = new QdrantAutoPopulator(/* ... */);
  }
  
  async run(state: AgentState) {
    const analise = await this.analisarIntimacao(state.data.intimacao);
    
    // População automática em background
    this.autoPopulator
      .populateFromIntimacao(state.data.intimacao)
      .catch(error => console.error("Erro população:", error));
      
    return updateState(state, { analise });
  }
}
```

### 3. Validar Busca Vetorial

```bash
npm run qdrant:test

# Resultado esperado:
# ? Query: "ação trabalhista rescisão"
# ? Resultados encontrados: 5
# ? Score médio: 0.85+
# ? Performance: < 100ms
```

### 4. Monitorar Métricas

- Dashboard de Métricas dos Agentes
- Sentry AI Monitoring
- Qdrant Cloud Dashboard

---

## ?? Documentação Relacionada

- [Guia de População Qdrant](./GUIA_POPULACAO_QDRANT.md)
- [Arquitetura Completa](./ARQUITETURA_POPULACAO_QDRANT.md)
- [Implementação Completa](./IMPLEMENTACAO_COMPLETA_QDRANT.md)
- [Correções Implementadas](./CORRECOES_IMPLEMENTADAS.md)

---

## ? Checklist de Verificação

- [x] Instruções da Mrs. Justin-e atualizadas
- [x] Instruções do Pesquisa Jurisprudencial atualizadas
- [x] Instruções do Análise Documental atualizadas
- [x] Instruções do Redação de Petições atualizadas
- [x] Instruções do Estratégia Processual atualizadas
- [x] Commit realizado
- [x] Push para repositório
- [ ] Testes E2E validados
- [ ] População inicial executada
- [ ] Integração com Justin-e ativada
- [ ] Monitoramento configurado

---

## ?? Resumo

**5 agentes atualizados** com informações completas sobre:
- ? População automática do Qdrant
- ? Busca vetorial semântica
- ? Metadados e filtros disponíveis
- ? Casos de uso práticos
- ? Integração com fluxo de trabalho

**Resultado esperado:**
- Agentes cientes das capacidades do Qdrant
- Uso efetivo de precedentes nas análises
- Fundamentação de petições com jurisprudências reais
- Estratégias baseadas em dados históricos

**Próximo marco:** Popular Qdrant com dados reais do DataJud! ??
