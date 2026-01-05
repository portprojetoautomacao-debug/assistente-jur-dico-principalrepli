# ??? Arquitetura de População Automática do Qdrant

## ?? Visão Geral

Sistema de população inteligente e automática do Qdrant Vector Database, integrado ao fluxo de análise de intimações com extração temática e enriquecimento via DataJud.

---

## ?? Objetivos

1. **População Automática**: Ao receber intimações, extrair temas e popular Qdrant
2. **Enriquecimento Contextual**: Buscar precedentes relacionados no DataJud
3. **Aprendizado Contínuo**: Sistema aprende com os casos do escritório
4. **Performance**: Busca vetorial < 100ms, população assíncrona
5. **Qualidade**: Embeddings validados, sem duplicatas, metadados completos

---

## ?? Fluxo de População Automática

```
???????????????????????????????????????????????????????????????????
?                    TRIGGER: Nova Intimação                      ?
???????????????????????????????????????????????????????????????????
                     ?
                     ?
???????????????????????????????????????????????????????????????????
?  1. ANÁLISE DE INTIMAÇÃO (Mrs. Justin-e)                        ?
?     - Extrai: número processo, tribunal, classe, assunto        ?
?     - Identifica: tipo de intimação, prazo, urgência            ?
?     - Classifica: tema jurídico primário                        ?
???????????????????????????????????????????????????????????????????
                     ?
                     ?
???????????????????????????????????????????????????????????????????
?  2. EXTRAÇÃO TEMÁTICA INTELIGENTE                               ?
?     - NER (Named Entity Recognition) para entidades jurídicas   ?
?     - Classificação multi-label de temas                        ?
?     - Extração de keywords (TF-IDF + embeddings)                ?
?     - Confiança mínima: 0.7                                     ?
???????????????????????????????????????????????????????????????????
                     ?
                     ?
???????????????????????????????????????????????????????????????????
?  3. ENRIQUECIMENTO VIA DATAJUD (Paralelo)                       ?
?     ?????????????????????????????????????????????               ?
?     ? Busca por Tema      ? Busca por Processo  ?               ?
?     ? - Precedentes STF/STJ? - Movimentações    ?               ?
?     ? - Jurisprudências   ? - Decisões         ?               ?
?     ? - Súmulas          ? - Recursos         ?               ?
?     ?????????????????????????????????????????????               ?
???????????????????????????????????????????????????????????????????
                     ?
                     ?
???????????????????????????????????????????????????????????????????
?  4. GERAÇÃO DE EMBEDDINGS (Gemini)                              ?
?     - Modelo: text-embedding-004 (768 dims)                     ?
?     - Batch processing (5 docs/vez)                             ?
?     - Validação: magnitude, dimensões, NaN/Inf                  ?
?     - Cache: Redis (TTL 24h)                                    ?
???????????????????????????????????????????????????????????????????
                     ?
                     ?
???????????????????????????????????????????????????????????????????
?  5. VERIFICAÇÃO DE DUPLICATAS                                   ?
?     - Busca por número de processo (exact match)                ?
?     - Busca semântica (similarity > 0.95)                       ?
?     - Se duplicata: UPDATE metadados, não INSERT                ?
???????????????????????????????????????????????????????????????????
                     ?
                     ?
???????????????????????????????????????????????????????????????????
?  6. INSERÇÃO NO QDRANT                                          ?
?     - Collection: legal_docs                                    ?
?     - Payload: metadados ricos (20+ campos)                     ?
?     - Índice: HNSW (M=16, ef_construct=200)                     ?
?     - Replicação: 2 réplicas (HA)                               ?
???????????????????????????????????????????????????????????????????
                     ?
                     ?
???????????????????????????????????????????????????????????????????
?  7. INDEXAÇÃO REVERSA (Para Busca Rápida)                       ?
?     - Redis: processo_numero ? qdrant_id                        ?
?     - Redis: tema ? [qdrant_ids]                                ?
?     - TTL: 7 dias                                               ?
???????????????????????????????????????????????????????????????????
```

---

## ??? Estrutura de Dados no Qdrant

### Collection Schema

```typescript
interface LegalDocumentPayload {
  // Identificação
  id: string;                          // UUID
  tipo: 'intimacao' | 'processo' | 'precedente' | 'jurisprudencia';
  
  // Dados Processuais
  numeroProcesso: string;              // CNJ: 0000000-00.0000.0.00.0000
  tribunal: string;                    // ex: "TST", "TRT3", "TJMG"
  classe: string;                      // ex: "Reclamação Trabalhista"
  assunto: string;                     // ex: "Rescisão Indireta"
  orgaoJulgador: string;               // ex: "1ª Vara do Trabalho de BH"
  
  // Classificação Temática
  temaPrimario: string;                // ex: "Direito do Trabalho - Rescisão"
  temasSecundarios: string[];          // ex: ["Férias", "13º Salário"]
  palavrasChave: string[];             // TF-IDF top 10
  confidenceTema: number;              // 0.0 - 1.0
  
  // Enriquecimento DataJud
  temPrecedentes: boolean;
  qtdPrecedentes: number;
  precedentesRelevantes: Array<{
    numero: string;
    tribunal: string;
    decisao: string;
    relevancia: number;
  }>;
  
  // Contexto da Intimação
  tipoIntimacao: string;               // ex: "Despacho", "Sentença", "Acórdão"
  prazo: {
    dias: number;
    tipo: 'corridos' | 'úteis';
    vencimento: string;                // ISO 8601
    urgente: boolean;
  };
  
  // Partes do Processo
  partes: Array<{
    tipo: 'autor' | 'reu' | 'terceiro';
    nome: string;
    cpfCnpj?: string;                  // Redacted para LGPD
  }>;
  
  // Metadados de Embedding
  embedModel: string;                  // "text-embedding-004"
  embedDimensions: number;             // 768
  embedGeneratedAt: string;            // ISO 8601
  embedConfidence: number;             // Qualidade do embedding
  
  // Histórico e Versionamento
  versao: number;                      // Incrementa em updates
  criadoEm: string;                    // ISO 8601
  atualizadoEm: string;                // ISO 8601
  fonte: 'djen' | 'datajud' | 'pje' | 'manual';
  
  // Análise Interna
  escritorio: string;                  // ID do escritório
  responsavel?: string;                // Advogado responsável
  estrategiaAdotada?: string;          // Estratégia definida
  resultadoFinal?: string;             // Após conclusão
  
  // Campos de Busca (Denormalizados)
  textoCompleto: string;               // Para full-text search
  entidadesNomeadas: string[];         // NER: pessoas, empresas, leis
  citacoesLegais: string[];            // ex: ["CLT Art. 477", "CF Art. 7º"]
}
```

### Índices de Busca

```typescript
interface QdrantSearchConfig {
  // Busca Vetorial Principal
  vectorSearch: {
    collection: 'legal_docs',
    vector: number[],                  // 768 dims
    limit: 20,
    scoreThreshold: 0.7,
  };
  
  // Filtros Estruturados
  filters: {
    must?: Array<{
      key: string;
      match: { value: string | number | boolean };
    }>;
    should?: Array<{
      key: string;
      match: { value: string | number | boolean };
    }>;
    mustNot?: Array<{
      key: string;
      match: { value: string | number | boolean };
    }>;
  };
  
  // Busca Híbrida (Vetorial + Full-Text)
  hybrid: {
    query: string;                     // Full-text query
    alpha: 0.7;                        // 0.7 = 70% vetorial, 30% full-text
  };
}
```

---

## ?? Componentes Técnicos

### 1. Serviço de Extração Temática

```typescript
// src/lib/tema-extractor.ts

interface TemaExtracao {
  temaPrimario: string;
  temasSecundarios: string[];
  palavrasChave: string[];
  confidence: number;
  entidades: {
    pessoas: string[];
    empresas: string[];
    leis: string[];
    tribunais: string[];
  };
}

export class TemaExtractorService {
  private geminiClient: GeminiClient;
  
  /**
   * Extrai temas de uma intimação usando LLM + NER
   */
  async extractTemas(intimacao: {
    texto: string;
    numeroProcesso: string;
    tribunal: string;
  }): Promise<TemaExtracao> {
    // 1. Classificação via Gemini
    const prompt = `
      Analise esta intimação jurídica e extraia:
      1. Tema jurídico principal (ex: "Direito do Trabalho - Rescisão Indireta")
      2. Temas secundários (até 3)
      3. Palavras-chave relevantes (até 10)
      4. Entidades: pessoas, empresas, leis citadas, tribunais
      
      Intimação:
      ${intimacao.texto}
      
      Processo: ${intimacao.numeroProcesso}
      Tribunal: ${intimacao.tribunal}
      
      Responda em JSON:
      {
        "temaPrimario": "...",
        "temasSecundarios": ["...", "..."],
        "palavrasChave": ["...", "..."],
        "confidence": 0.95,
        "entidades": {
          "pessoas": ["..."],
          "empresas": ["..."],
          "leis": ["CLT Art. 477", "..."],
          "tribunais": ["TST", "..."]
        }
      }
    `;
    
    const response = await this.geminiClient.chat('gemini-2.5-pro', [
      { role: 'user', content: prompt }
    ]);
    
    // 2. Parse e valida resposta
    const temas = JSON.parse(response);
    
    // 3. Validação de confiança
    if (temas.confidence < 0.7) {
      throw new Error(`Confiança muito baixa na extração: ${temas.confidence}`);
    }
    
    return temas;
  }
  
  /**
   * Classifica tema em taxonomia jurídica
   */
  private classificarTema(tema: string): {
    area: string;
    subarea: string;
    especialidade: string;
  } {
    // Taxonomia: Direito do Trabalho > Rescisão > Indireta
    const taxonomia = {
      'Direito do Trabalho': {
        'Rescisão': ['Indireta', 'Direta', 'Culpa Recíproca'],
        'Férias': ['Proporcionais', 'Vencidas', '1/3 Constitucional'],
        'Jornada': ['Horas Extras', 'Adicional Noturno', 'Intervalo']
      },
      'Direito Civil': {
        'Contratos': ['Rescisão', 'Revisão', 'Inexecução'],
        'Responsabilidade': ['Contratual', 'Extracontratual']
      },
      // ... mais áreas
    };
    
    // Algoritmo de classificação (simplificado)
    for (const [area, subareas] of Object.entries(taxonomia)) {
      if (tema.includes(area)) {
        for (const [subarea, especialidades] of Object.entries(subareas)) {
          if (tema.includes(subarea)) {
            const especialidade = especialidades.find(e => tema.includes(e)) || especialidades[0];
            return { area, subarea, especialidade };
          }
        }
      }
    }
    
    return { area: 'Outros', subarea: 'Geral', especialidade: 'N/A' };
  }
}
```

### 2. Serviço de População Automática

```typescript
// src/lib/qdrant-auto-populator.ts

export class QdrantAutoPopulator {
  private qdrant: QdrantService;
  private dataJud: DataJudService;
  private temaExtractor: TemaExtractorService;
  private embeddings: GeminiEmbeddingService;
  private redis: RedisClient;
  
  /**
   * Popula Qdrant automaticamente ao receber intimação
   */
  async populateFromIntimacao(intimacao: Expediente): Promise<{
    inserted: boolean;
    qdrantId: string;
    temas: TemaExtracao;
    precedentesEncontrados: number;
  }> {
    console.log(`[AutoPopulator] Processando intimação: ${intimacao.id}`);
    
    // 1. Verificar duplicata
    const existente = await this.checkDuplicate(intimacao.numeroProcesso);
    if (existente) {
      console.log(`[AutoPopulator] Duplicata detectada: ${existente.id}`);
      return {
        inserted: false,
        qdrantId: existente.id,
        temas: existente.temas,
        precedentesEncontrados: 0
      };
    }
    
    // 2. Extrair temas
    const temas = await this.temaExtractor.extractTemas({
      texto: intimacao.conteudo,
      numeroProcesso: intimacao.numeroProcesso,
      tribunal: intimacao.tribunal || 'DESCONHECIDO'
    });
    
    console.log(`[AutoPopulator] Tema extraído: ${temas.temaPrimario} (confidence: ${temas.confidence})`);
    
    // 3. Buscar precedentes no DataJud (paralelo)
    const [precedentesTema, precedentesProcesso] = await Promise.all([
      this.dataJud.searchPrecedentesByTema(temas.temaPrimario, { limit: 10 }),
      this.dataJud.searchProcesso(intimacao.numeroProcesso)
    ]);
    
    const precedentes = [...precedentesTema, ...precedentesProcesso];
    console.log(`[AutoPopulator] ${precedentes.length} precedentes encontrados`);
    
    // 4. Gerar embedding
    const embeddingResult = await this.embeddings.generateDocumentEmbedding({
      numero: intimacao.numeroProcesso,
      tribunal: intimacao.tribunal || 'DESCONHECIDO',
      classe: temas.temaPrimario,
      assunto: temas.temasSecundarios.join('; '),
      texto: intimacao.conteudo.substring(0, 5000) // Limita tamanho
    });
    
    // 5. Validar embedding
    const validation = this.validateEmbedding(embeddingResult.embedding);
    if (!validation.valid) {
      throw new Error(`Embedding inválido: ${validation.issues.join(', ')}`);
    }
    
    // 6. Construir payload
    const payload: LegalDocumentPayload = {
      id: intimacao.id,
      tipo: 'intimacao',
      
      numeroProcesso: intimacao.numeroProcesso,
      tribunal: intimacao.tribunal || 'DESCONHECIDO',
      classe: temas.temaPrimario,
      assunto: temas.temasSecundarios.join('; '),
      orgaoJulgador: intimacao.orgaoJulgador || 'N/A',
      
      temaPrimario: temas.temaPrimario,
      temasSecundarios: temas.temasSecundarios,
      palavrasChave: temas.palavrasChave,
      confidenceTema: temas.confidence,
      
      temPrecedentes: precedentes.length > 0,
      qtdPrecedentes: precedentes.length,
      precedentesRelevantes: precedentes.slice(0, 5).map(p => ({
        numero: p.numero,
        tribunal: p.tribunal,
        decisao: p.decisao || 'N/A',
        relevancia: p.relevancia || 0.5
      })),
      
      tipoIntimacao: intimacao.tipo || 'DESCONHECIDO',
      prazo: intimacao.prazo ? {
        dias: intimacao.prazo.diasUteis || 0,
        tipo: 'úteis',
        vencimento: intimacao.prazo.dataLimite || '',
        urgente: (intimacao.prazo.diasUteis || 999) < 5
      } : undefined,
      
      partes: intimacao.partes?.map(p => ({
        tipo: p.tipo as any,
        nome: p.nome,
        cpfCnpj: '[REDACTED]' // LGPD compliance
      })) || [],
      
      embedModel: embeddingResult.model,
      embedDimensions: embeddingResult.embedding.length,
      embedGeneratedAt: new Date().toISOString(),
      embedConfidence: validation.confidence || 1.0,
      
      versao: 1,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      fonte: intimacao.fonte === 'DJEN' ? 'djen' : 'pje',
      
      escritorio: 'default', // TODO: pegar do contexto
      textoCompleto: intimacao.conteudo,
      entidadesNomeadas: [
        ...temas.entidades.pessoas,
        ...temas.entidades.empresas
      ],
      citacoesLegais: temas.entidades.leis
    };
    
    // 7. Inserir no Qdrant
    await this.qdrant.upsert([{
      id: intimacao.id,
      vector: embeddingResult.embedding,
      payload
    }]);
    
    // 8. Cache Redis (indexação reversa)
    await this.redis.set(
      `processo:${intimacao.numeroProcesso}`,
      intimacao.id,
      'EX',
      7 * 24 * 60 * 60 // 7 dias
    );
    
    await this.redis.sadd(
      `tema:${temas.temaPrimario}`,
      intimacao.id
    );
    
    console.log(`[AutoPopulator] ? Inserido no Qdrant: ${intimacao.id}`);
    
    return {
      inserted: true,
      qdrantId: intimacao.id,
      temas,
      precedentesEncontrados: precedentes.length
    };
  }
  
  /**
   * Verifica se documento já existe no Qdrant
   */
  private async checkDuplicate(numeroProcesso: string): Promise<any | null> {
    // 1. Busca no cache Redis
    const cachedId = await this.redis.get(`processo:${numeroProcesso}`);
    if (cachedId) {
      return { id: cachedId, cached: true };
    }
    
    // 2. Busca no Qdrant (filtro exato)
    const results = await this.qdrant.search(
      new Array(768).fill(0), // Dummy vector
      1,
      {
        must: [{
          key: 'numeroProcesso',
          match: { value: numeroProcesso }
        }]
      }
    );
    
    return results.length > 0 ? results[0] : null;
  }
  
  /**
   * Valida qualidade do embedding
   */
  private validateEmbedding(embedding: number[]): {
    valid: boolean;
    issues: string[];
    confidence: number;
  } {
    const issues: string[] = [];
    
    // Validações (conforme script anterior)
    if (embedding.length !== 768) {
      issues.push(`Dimensões incorretas: ${embedding.length} != 768`);
    }
    
    const hasInvalidValues = embedding.some(v => !isFinite(v));
    if (hasInvalidValues) {
      issues.push('Contém valores NaN ou Infinity');
    }
    
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    if (Math.abs(magnitude - 1.0) > 0.01) {
      issues.push(`Magnitude anormal: ${magnitude.toFixed(4)}`);
    }
    
    const isZeroVector = embedding.every(v => v === 0);
    if (isZeroVector) {
      issues.push('Zero vector detectado');
    }
    
    // Confidence baseado na magnitude
    const confidence = Math.max(0, 1 - Math.abs(magnitude - 1.0));
    
    return {
      valid: issues.length === 0,
      issues,
      confidence
    };
  }
}
```

### 3. Integração com Mrs. Justin-e

```typescript
// src/agents/justine/justine_with_qdrant.ts

export class JustineAgentWithQdrant extends JustineAgent {
  private autoPopulator: QdrantAutoPopulator;
  
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    const intimacao = state.data.intimacao as Expediente;
    
    // Análise padrão da Mrs. Justin-e
    const analiseResult = await super.run(state, signal);
    
    // População automática do Qdrant (assíncrono, não bloqueia)
    this.populateQdrantInBackground(intimacao).catch(error => {
      console.error('[Justin-e] Erro ao popular Qdrant:', error);
      // Não propaga erro para não afetar fluxo principal
    });
    
    return analiseResult;
  }
  
  private async populateQdrantInBackground(intimacao: Expediente): Promise<void> {
    try {
      const result = await this.autoPopulator.populateFromIntimacao(intimacao);
      
      if (result.inserted) {
        console.log(`[Justin-e] ? Qdrant populated: ${result.qdrantId}`);
        console.log(`[Justin-e] Tema: ${result.temas.temaPrimario}`);
        console.log(`[Justin-e] Precedentes: ${result.precedentesEncontrados}`);
      } else {
        console.log(`[Justin-e] ??  Documento já existe no Qdrant`);
      }
    } catch (error) {
      console.error('[Justin-e] Falha na população Qdrant:', error);
      // Registrar no Sentry mas não falhar o agente
      // captureException(error);
    }
  }
}
```

---

## ?? Performance e Escalabilidade

### Benchmarks Esperados

| Operação | Latência (P95) | Throughput |
|----------|----------------|------------|
| Extração de Tema (Gemini) | < 2s | 30 req/min |
| Busca DataJud | < 3s | 20 req/min |
| Geração Embedding | < 500ms | 120 req/min |
| Inserção Qdrant | < 100ms | 1000 req/min |
| **Total Pipeline** | **< 6s** | **10 intimações/min** |

### Otimizações

1. **Batch Processing**: Agrupar embeddings em lotes de 5
2. **Cache Redis**: TTL 24h para embeddings repetidos
3. **Rate Limiting**: Respeitar limites Gemini (60 req/min)
4. **Queue**: Fila assíncrona para não bloquear Mrs. Justin-e
5. **Retry**: Exponential backoff para falhas temporárias

---

## ?? Segurança e Compliance

### LGPD

- ? CPF/CNPJ redacted antes de inserir no Qdrant
- ? Nomes de partes apenas se necessário (opt-in)
- ? Logs sem dados sensíveis
- ? Direito ao esquecimento: API de delete por processo

### Segurança

- ? API Key Qdrant via env vars
- ? HTTPS obrigatório
- ? Rate limiting (1000 req/hora)
- ? Validação de embeddings (anti-injection)

---

## ?? Monitoramento

### Métricas Sentry

```typescript
// Instrumentação automática
span.setAttribute('qdrant.operation', 'auto_populate');
span.setAttribute('qdrant.tema_primario', temas.temaPrimario);
span.setAttribute('qdrant.precedentes_count', precedentes.length);
span.setAttribute('qdrant.confidence', temas.confidence);
span.setAttribute('qdrant.latency_ms', duration);
```

### Alertas

- ?? Latência > 10s
- ?? Taxa de erro > 5%
- ?? Confidence média < 0.7
- ?? Fila > 100 items

---

## ?? Roadmap de Implementação

### Fase 1: Core (1 semana)
- [x] Serviço TemaExtractor
- [x] Serviço QdrantAutoPopulator
- [ ] Integração Mrs. Justin-e
- [ ] Testes unitários

### Fase 2: Enriquecimento (1 semana)
- [ ] Busca DataJud otimizada
- [ ] Cache Redis
- [ ] Validação de embeddings

### Fase 3: Produção (1 semana)
- [ ] Queue assíncrona
- [ ] Monitoramento Sentry
- [ ] Documentação API
- [ ] Deploy em staging

---

## ?? Referências Técnicas

- [Qdrant Indexing Best Practices](https://qdrant.tech/documentation/concepts/indexing/)
- [Gemini Embeddings API](https://ai.google.dev/docs/embeddings)
- [DataJud CNJ API](https://datajud-wiki.cnj.jus.br/)
- [LGPD Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
