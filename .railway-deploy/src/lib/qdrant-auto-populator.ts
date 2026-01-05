/**
 * Qdrant Auto-Populator Service
 *
 * Servi�o respons�vel por popular automaticamente o Qdrant quando uma nova
 * intima��o � recebida. Integra:
 * - TemaExtractor (classifica��o)
 * - DataJud (enriquecimento)
 * - Gemini Embeddings (vetoriza��o)
 * - Qdrant (armazenamento)
 * - Redis (cache e �ndice reverso)
 *
 * Fluxo:
 * 1. Extrai temas da intima��o
 * 2. Busca precedentes no DataJud
 * 3. Gera embedding
 * 4. Valida embedding
 * 5. Construir payload
 * 6. Insere no Qdrant
 * 7. Cria �ndice reverso no Redis
 *
 * @module qdrant-auto-populator
 */

import type { Expediente } from "@/types";
import type { DataJudService } from "./datajud-service";
import type { GeminiEmbeddingService } from "./gemini-embedding-service";
import type { QdrantService } from "./qdrant-service";
import type { TemaExtracao, TemaExtractorService } from "./tema-extractor";

/**
 * KV Store helper (via API)
 */
const kv = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const response = await fetch(`/api/kv?key=${encodeURIComponent(key)}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.value as T;
    } catch {
      return null;
    }
  },
  async set(key: string, value: unknown, options?: { ex?: number }): Promise<void> {
    try {
      await fetch("/api/kv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, options }),
      });
    } catch (error) {
      console.warn("KV set failed:", error);
    }
  },
};

/**
 * Payload completo do documento jur�dico no Qdrant
 */
export interface LegalDocumentPayload {
  // Identifica��o
  id: string;
  tipo: "intimacao" | "processo" | "precedente" | "jurisprudencia";

  // Dados Processuais
  numeroProcesso: string;
  tribunal: string;
  classe: string;
  assunto: string;
  orgaoJulgador?: string;

  // Classifica��o Tem�tica
  temaPrimario: string;
  temasSecundarios: string[];
  palavrasChave: string[];
  confidenceTema: number;

  // Taxonomia Jur�dica
  taxonomia: {
    area: string;
    subarea: string;
    especialidade: string;
  };

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
  tipoIntimacao?: string;
  prazo?: {
    dias: number;
    tipo: "corridos" | "úteis";
    vencimento: string;
    urgente: boolean;
  };

  // Partes do Processo (LGPD compliant)
  partes: Array<{
    tipo: "autor" | "reu" | "terceiro";
    nome: string;
    cpfCnpj?: string;
  }>;

  // Metadados de Embedding
  embedModel: string;
  embedDimensions: number;
  embedGeneratedAt: string;
  embedConfidence: number;

  // Hist�rico e Versionamento
  versao: number;
  criadoEm: string;
  atualizadoEm: string;
  fonte: "djen" | "datajud" | "pje" | "manual";

  // An�lise Interna
  escritorio: string;
  responsavel?: string;
  estrategiaAdotada?: string;
  resultadoFinal?: string;

  // Campos de Busca
  textoCompleto: string;
  entidadesNomeadas: string[];
  citacoesLegais: string[];
}

/**
 * Resultado da popula��o autom�tica
 */
export interface PopulationResult {
  success: boolean;
  inserted: boolean;
  qdrantId: string;
  temas: TemaExtracao;
  precedentesEncontrados: number;
  error?: string;
  duration: number;
}

/**
 * Configura��o do auto-populator
 */
export interface AutoPopulatorConfig {
  enableCache?: boolean;
  enablePrecedentSearch?: boolean;
  minConfidence?: number;
  maxPrecedents?: number;
  timeoutMs?: number;
}

const DEFAULT_CONFIG: Required<AutoPopulatorConfig> = {
  enableCache: true,
  enablePrecedentSearch: true,
  minConfidence: 0.7,
  maxPrecedents: 10,
  timeoutMs: 30000,
};

export class QdrantAutoPopulator {
  private readonly config: Required<AutoPopulatorConfig>;

  constructor(
    private readonly qdrant: QdrantService,
    private readonly dataJud: DataJudService,
    private readonly temaExtractor: TemaExtractorService,
    private readonly embeddings: GeminiEmbeddingService,
    config: Partial<AutoPopulatorConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Popula Qdrant automaticamente a partir de uma intima��o
   */
  async populateFromIntimacao(intimacao: Expediente): Promise<PopulationResult> {
    const startTime = Date.now();

    try {
      console.log(`[AutoPopulator] Processando intima��o: ${intimacao.id}`);
      console.log(`[AutoPopulator] Processo: ${intimacao.numeroProcesso}`);

      // 1. Extrair temas
      const temas = await this.temaExtractor.extractTemasFromExpediente(intimacao);

      if (temas.confidence < this.config.minConfidence) {
        throw new Error(
          `Confian�a insuficiente para popular Qdrant: ${temas.confidence} < ${this.config.minConfidence}`
        );
      }

      console.log(
        `[AutoPopulator] ? Tema extra�do: ${temas.temaPrimario} (confidence: ${temas.confidence})`
      );

      // 2. Buscar precedentes no DataJud (paralelo)
      let precedentes: unknown[] = [];
      if (this.config.enablePrecedentSearch) {
        try {
          const precedentesTema = await this.dataJud
            .searchPrecedentes(
              intimacao.tribunal || "TST",
              temas.temaPrimario,
              this.config.maxPrecedents
            )
            .catch(() => []);

          const precedentesProcesso = intimacao.numeroProcesso
            ? await this.dataJud.searchProcessos({ limit: 1 }).catch(() => [])
            : [];

          precedentes = [...precedentesTema, ...precedentesProcesso];

          console.log(`[AutoPopulator] ?? ${precedentes.length} precedentes encontrados`);
        } catch (error) {
          console.warn("[AutoPopulator] ??  Falha ao buscar precedentes:", error);
          // N�o falha a opera��o
        }
      }

      // 3. Gerar embedding
      const embeddingResult = await this.embeddings.generateDocumentEmbedding({
        numero: intimacao.numeroProcesso || "N/A",
        tribunal: intimacao.tribunal || "DESCONHECIDO",
        classe: temas.temaPrimario,
        assunto: temas.temasSecundarios.join("; "),
        movimentacoes:
          intimacao.conteudo?.substring(0, 3000) || intimacao.content?.substring(0, 3000) || "",
      });

      console.log(`[AutoPopulator] ?? Embedding gerado: ${embeddingResult.embedding.length}d`);

      // 4. Validar embedding
      const validation = this.validateEmbedding(embeddingResult.embedding, 768);
      if (!validation.valid) {
        throw new Error(`Embedding inv�lido: ${validation.issues.join(", ")}`);
      }

      console.log(
        `[AutoPopulator] ? Embedding validado (confidence: ${validation.confidence.toFixed(3)})`
      );

      // 5. Construir payload
      const payload = this.buildPayload(intimacao, temas, precedentes, embeddingResult);

      // 6. Inserir no Qdrant
      await this.qdrant.upsert([
        {
          id: intimacao.id,
          vector: embeddingResult.embedding,
          payload: payload as unknown as Record<string, unknown>,
        },
      ]);

      console.log(`[AutoPopulator] ? Inserido no Qdrant: ${intimacao.id}`);

      // 7. Cache Redis (�ndice reverso)
      if (this.config.enableCache && intimacao.numeroProcesso) {
        await this.createReverseIndex(intimacao.numeroProcesso, intimacao.id, temas.temaPrimario);
      }

      return {
        success: true,
        inserted: true,
        qdrantId: intimacao.id,
        temas,
        precedentesEncontrados: precedentes.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error("[AutoPopulator] ? Erro ao popular Qdrant:", error);
      return {
        success: false,
        inserted: false,
        qdrantId: "",
        temas: {
          temaPrimario: "",
          temasSecundarios: [],
          palavrasChave: [],
          confidence: 0,
          entidades: { pessoas: [], empresas: [], leis: [], tribunais: [] },
          taxonomia: { area: "", subarea: "", especialidade: "" },
        },
        precedentesEncontrados: 0,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Verifica se documento já existe no Qdrant
   */
  private async checkDuplicate(numeroProcesso: string): Promise<{
    id: string;
    temas?: unknown;
    qtdPrecedentes?: number;
  } | null> {
    try {
      // 1. Busca no cache Redis
      const cachedId = await kv.get<string>(`qdrant:processo:${numeroProcesso}`);
      if (cachedId) {
        console.log(`[AutoPopulator] ?? Cache hit: ${cachedId}`);
        // Buscar metadados do Qdrant se necess�rio
        return { id: cachedId };
      }

      // 2. Busca no Qdrant (filtro exato)
      // Nota: Precisa de um vector dummy para buscar com filtros
      const dummyVector = new Array(768).fill(0);

      const results = await this.qdrant.search(dummyVector, 1, {
        must: [
          {
            key: "numeroProcesso",
            match: { value: numeroProcesso },
          },
        ],
      } as Record<string, unknown>);

      if (results.length > 0) {
        console.log(`[AutoPopulator] ?? Documento encontrado no Qdrant: ${results[0].id}`);

        // Atualiza cache
        await kv.set(`qdrant:processo:${numeroProcesso}`, String(results[0].id), {
          ex: 7 * 24 * 60 * 60,
        });

        return { id: String(results[0].id) };
      }

      return null;
    } catch (error) {
      console.warn("[AutoPopulator] ??  Erro ao verificar duplicata:", error);
      return null;
    }
  }

  /**
   * Valida qualidade do embedding
   */
  private validateEmbedding(
    embedding: number[],
    expectedDims: number
  ): {
    valid: boolean;
    issues: string[];
    confidence: number;
  } {
    const issues: string[] = [];

    // 1. Validar dimens�es
    if (embedding.length !== expectedDims) {
      issues.push(`Dimens�es incorretas: ${embedding.length} != ${expectedDims}`);
    }

    // 2. Validar valores NaN/Infinity
    const hasInvalidValues = embedding.some((v) => !Number.isFinite(v));
    if (hasInvalidValues) {
      issues.push("Cont�m valores NaN ou Infinity");
    }

    // 3. Validar magnitude (embeddings Gemini s�o normalizados)
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    if (Math.abs(magnitude - 1) > 0.01) {
      issues.push(`Magnitude anormal: ${magnitude.toFixed(4)} (esperado ~1)`);
    }

    // 4. Validar que não é zero vector
    const isZeroVector = embedding.every((v) => v === 0);
    if (isZeroVector) {
      issues.push("Zero vector detectado");
    }

    // Confidence baseado na magnitude
    const confidence = Math.max(0, 1 - Math.abs(magnitude - 1));

    return {
      valid: issues.length === 0,
      issues,
      confidence,
    };
  }

  /**
   * Constr�i payload completo para inser��o no Qdrant
   */
  private buildPayload(
    intimacao: Expediente,
    temas: TemaExtracao,
    precedentes: unknown[],
    embeddingResult: { embedding: number[]; model: string }
  ): LegalDocumentPayload {
    return {
      id: intimacao.id,
      tipo: "intimacao",

      numeroProcesso: intimacao.numeroProcesso || "N/A",
      tribunal: intimacao.tribunal || "DESCONHECIDO",
      classe: temas.temaPrimario,
      assunto: temas.temasSecundarios.join("; "),
      orgaoJulgador: intimacao.orgao,

      temaPrimario: temas.temaPrimario,
      temasSecundarios: temas.temasSecundarios,
      palavrasChave: temas.palavrasChave,
      confidenceTema: temas.confidence,

      taxonomia: temas.taxonomia,

      temPrecedentes: precedentes.length > 0,
      qtdPrecedentes: precedentes.length,
      precedentesRelevantes: precedentes.slice(0, 5).map((p: unknown) => {
        const prec = p as {
          numero?: string;
          tribunal?: string;
          decisao?: string;
          relevancia?: number;
        };
        return {
          numero: prec.numero || "N/A",
          tribunal: prec.tribunal || "N/A",
          decisao: prec.decisao || "N/A",
          relevancia: prec.relevancia || 0.5,
        };
      }),

      tipoIntimacao: intimacao.tipo,
      prazo: intimacao.prazo
        ? {
            dias: intimacao.prazo.diasUteis || 0,
            tipo: "úteis" as const,
            vencimento: intimacao.prazo.dataFinal || "",
            urgente: (intimacao.prazo.diasUteis || 999) < 5,
          }
        : undefined,

      partes: [],

      embedModel: embeddingResult.model,
      embedDimensions: embeddingResult.embedding.length,
      embedGeneratedAt: new Date().toISOString(),
      embedConfidence: this.validateEmbedding(embeddingResult.embedding, 768).confidence,

      versao: 1,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      fonte: intimacao.source === "DJEN" ? "djen" : "pje",

      // PENDING: Implementar identificação de escritório a partir de contexto do usuário
      // Atualmente usando valor padrão até implementação de multi-tenant
      escritorio: "default",
      textoCompleto: intimacao.conteudo || "",
      entidadesNomeadas: [...temas.entidades.pessoas, ...temas.entidades.empresas],
      citacoesLegais: temas.entidades.leis,
    };
  }

  /**
   * Cria �ndice reverso no Redis para busca r�pida
   */
  private async createReverseIndex(
    numeroProcesso: string,
    qdrantId: string,
    temaPrimario: string
  ): Promise<void> {
    try {
      // �ndice: processo -> qdrant_id
      await kv.set(`qdrant:processo:${numeroProcesso}`, qdrantId, { ex: 7 * 24 * 60 * 60 });

      // �ndice: tema -> [qdrant_ids]
      const temaKey = `qdrant:tema:${temaPrimario}`;
      const existingIds = (await kv.get<string[]>(temaKey)) || [];
      await kv.set(temaKey, [...existingIds, qdrantId], { ex: 7 * 24 * 60 * 60 });

      console.log(`[AutoPopulator] ???  �ndice reverso criado no Redis`);
    } catch (error) {
      console.warn("[AutoPopulator] ??  Falha ao criar �ndice reverso:", error);
      // N�o falha a opera��o
    }
  }
}
