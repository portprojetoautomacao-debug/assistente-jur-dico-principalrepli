// Advanced NLP Processing Pipeline
// Inspired by Databricks Spark NLP capabilities:
// - Named Entity Recognition (NER)
// - Sentiment Analysis
// - Document Classification
// - Information Extraction
// - Batch Processing

import { llmService, type LLMRequestConfig } from "./llm-service";

// Entity types for legal documents
export type EntityType =
  | "PERSON"
  | "ORGANIZATION"
  | "LOCATION"
  | "DATE"
  | "MONETARY_VALUE"
  | "LEGAL_REFERENCE"
  | "PROCESS_NUMBER"
  | "LAW_ARTICLE";

// Named Entity
export interface NamedEntity {
  text: string;
  type: EntityType;
  start: number;
  end: number;
  confidence: number;
}

// Sentiment analysis result
export interface SentimentAnalysis {
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  confidence: number;
  aspects: Array<{
    aspect: string;
    sentiment: "positive" | "negative" | "neutral";
    score: number;
  }>;
}

// Document classification result
export interface DocumentClassification {
  category: string;
  subcategory?: string;
  confidence: number;
  tags: string[];
}

// NLP Operation Result type alias
export type NLPOperationResult =
  | NamedEntity[]
  | SentimentAnalysis
  | DocumentClassification
  | ExtractedInformation;

// Batch processing result item
export interface BatchProcessResultItem {
  id: string;
  result: NLPOperationResult;
  error?: string;
}

// Information extraction result
export interface ExtractedInformation {
  summary: string;
  keyPoints: string[];
  entities: NamedEntity[];
  dates: string[];
  monetaryValues: string[];
  legalReferences: string[];
  parties: string[];
}

/**
 * NLP Pipeline Service
 */
export class NLPPipeline {
  /**
   * Extract named entities from text
   */
  async extractEntities(text: string, config: LLMRequestConfig = {}): Promise<NamedEntity[]> {
    // Validating the input text to ensure it's not empty
    if (!text || text.trim().length === 0) {
      throw new Error("Input text is empty or invalid.");
    }

    const prompt = `Você é um especialista em processamento de linguagem natural para documentos jurídicos brasileiros.

    Analise o seguinte texto e extraia todas as entidades nomeadas relevantes:

    TEXTO:
    ${text}

    INSTRUÇÕES:
    1. Identifique pessoas, organizações, localizações, datas, valores monetários, referências legais, números de processo e artigos de lei
    2. Para cada entidade, forneça: texto, tipo, posição inicial, posição final e nível de confiança (0-1)
    3. Retorne no formato JSON com array de entidades

    FORMATO DE SAÍDA:
    {
      "entities": [
        {
          "text": "texto da entidade",
          "type": "PERSON|ORGANIZATION|LOCATION|DATE|MONETARY_VALUE|LEGAL_REFERENCE|PROCESS_NUMBER|LAW_ARTICLE",
          "start": número_posição_inicial,
          "end": número_posição_final,
          "confidence": número_0_a_1
        }
      ]
    }`;

    try {
      const result = await llmService.executeJSON<{ entities: NamedEntity[] }>(prompt, {
        ...config,
        feature: "ner",
      });
      return result.entities || [];
    } catch (error) {
      console.error("Error during NER processing:", error);
      throw new Error("Failed to extract named entities.");
    }
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text: string, config: LLMRequestConfig = {}): Promise<SentimentAnalysis> {
    // Validating the input text to ensure it's not empty
    if (!text || text.trim().length === 0) {
      throw new Error("Input text is empty or invalid.");
    }

    const prompt = `Você é um especialista em análise de sentimento para documentos jurídicos.

    Analise o sentimento do seguinte texto:

    TEXTO:
    ${text}

    INSTRUÇÕES:
    1. Determine o sentimento geral (positive, negative, neutral)
    2. Atribua um score de -1 (muito negativo) a +1 (muito positivo)
    3. Forneça o nível de confiança (0-1)
    4. Identifique aspectos específicos e seus sentimentos

    FORMATO DE SAÍDA:
    {
      "sentiment": "positive|negative|neutral",
      "score": número_entre_-1_e_1,
      "confidence": número_0_a_1,
      "aspects": [
        {
          "aspect": "aspecto_específico",
          "sentiment": "positive|negative|neutral",
          "score": número_entre_-1_e_1
        }
      ]
    }`;

    try {
      const result = await llmService.executeJSON<SentimentAnalysis>(prompt, {
        ...config,
        feature: "sentiment-analysis",
      });
      return result;
    } catch (error) {
      console.error("Error during sentiment analysis:", error);
      throw new Error("Failed to analyze sentiment.");
    }
  }

  /**
   * Classify document
   */
  async classifyDocument(
    text: string,
    config: LLMRequestConfig = {}
  ): Promise<DocumentClassification> {
    // Validating the input text to ensure it's not empty
    if (!text || text.trim().length === 0) {
      throw new Error("Input text is empty or invalid.");
    }

    const prompt = `Você é um especialista em classificação de documentos jurídicos brasileiros.

    Classifique o seguinte documento:

    TEXTO:
    ${text}

    INSTRUÇÕES:
    1. Identifique a categoria principal (ex: "Petição Inicial", "Sentença", "Recurso", "Contrato", etc.)
    2. Identifique a subcategoria se aplicável
    3. Forneça nível de confiança (0-1)
    4. Adicione tags relevantes

    FORMATO DE SAÍDA:
    {
      "category": "categoria_principal",
      "subcategory": "subcategoria_opcional",
      "confidence": número_0_a_1,
      "tags": ["tag1", "tag2", "tag3"]
    }`;

    try {
      const result = await llmService.executeJSON<DocumentClassification>(prompt, {
        ...config,
        feature: "document-classification",
      });
      return result;
    } catch (error) {
      console.error("Error during document classification:", error);
      throw new Error("Failed to classify document.");
    }
  }

  /**
   * Extract structured information from document
   */
  async extractInformation(
    text: string,
    config: LLMRequestConfig = {}
  ): Promise<ExtractedInformation> {
    // Validating the input text to ensure it's not empty
    if (!text || text.trim().length === 0) {
      throw new Error("Input text is empty or invalid.");
    }

    const prompt = `Você é um especialista em extração de informações de documentos jurídicos.

    Extraia informações estruturadas do seguinte documento:

    TEXTO:
    ${text}

    INSTRUÇÕES:
    1. Gere um resumo conciso (máximo 200 palavras)
    2. Liste os pontos-chave mais importantes
    3. Extraia todas as entidades nomeadas
    4. Identifique todas as datas mencionadas
    5. Liste todos os valores monetários
    6. Identifique referências legais (leis, artigos, jurisprudências)
    7. Identifique as partes envolvidas

    FORMATO DE SAÍDA:
    {
      "summary": "resumo_do_documento",
      "keyPoints": ["ponto1", "ponto2", "ponto3"],
      "entities": [
        {
          "text": "texto",
          "type": "PERSON|ORGANIZATION|LOCATION|DATE|MONETARY_VALUE|LEGAL_REFERENCE|PROCESS_NUMBER|LAW_ARTICLE",
          "start": 0,
          "end": 0,
          "confidence": 1.0
        }
      ],
      "dates": ["data1", "data2"],
      "monetaryValues": ["valor1", "valor2"],
      "legalReferences": ["ref1", "ref2"],
      "parties": ["parte1", "parte2"]
    }`;

    try {
      const result = await llmService.executeJSON<ExtractedInformation>(prompt, {
        ...config,
        feature: "information-extraction",
      });
      return result;
    } catch (error) {
      console.error("Error during information extraction:", error);
      throw new Error("Failed to extract information.");
    }
  }

  /**
   * Batch process documents with NLP
   */
  async batchProcess(
    documents: Array<{ id: string; text: string }>,
    operation: "entities" | "sentiment" | "classify" | "extract",
    config: LLMRequestConfig = {}
  ): Promise<BatchProcessResultItem[]> {
    const operations = {
      entities: this.extractEntities.bind(this),
      sentiment: this.analyzeSentiment.bind(this),
      classify: this.classifyDocument.bind(this),
      extract: this.extractInformation.bind(this),
    };

    const operationFn = operations[operation];

    const results = await Promise.allSettled(
      documents.map(async ({ id, text }) => {
        const result = await operationFn(text, config);
        return { id, result };
      })
    );

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value as {
          id: string;
          result: NamedEntity[] | SentimentAnalysis | DocumentClassification | ExtractedInformation;
        };
      } else {
        // Create default result based on operation type
        const defaultResult:
          | NamedEntity[]
          | SentimentAnalysis
          | DocumentClassification
          | ExtractedInformation = operation === "entities" ? [] : ({} as SentimentAnalysis);
        return {
          id: documents[index].id,
          result: defaultResult,
          error: result.reason?.message || "Unknown error",
        };
      }
    });
  }

  /**
   * Analyze legal text for specific patterns
   */
  async analyzePatterns(
    text: string,
    patterns: string[],
    config: LLMRequestConfig = {}
  ): Promise<Array<{ pattern: string; found: boolean; occurrences: string[] }>> {
    const prompt = `Você é um especialista em análise de padrões em documentos jurídicos.

    Analise o seguinte texto e identifique a presença dos padrões especificados:

    TEXTO:
    ${text}

    PADRÕES A BUSCAR:
    ${patterns.map((p, i) => `${i + 1}. ${p}`).join("\n")}

    INSTRUÇÕES:
    1. Para cada padrão, determine se está presente no texto
    2. Liste todas as ocorrências encontradas (trechos relevantes do texto)
    3. Seja preciso e cite trechos literais quando possível

    FORMATO DE SAÍDA:
    {
      "results": [
        {
          "pattern": "nome_do_padrão",
          "found": true|false,
          "occurrences": ["ocorrência1", "ocorrência2"]
        }
      ]
    }`;

    try {
      const result = await llmService.executeJSON<{
        results: Array<{ pattern: string; found: boolean; occurrences: string[] }>;
      }>(prompt, { ...config, feature: "pattern-analysis" });

      return result.results || [];
    } catch (error) {
      console.error("Error during pattern analysis:", error);
      throw new Error("Failed to analyze patterns.");
    }
  }

  /**
   * Compare two documents and identify differences
   */
  async compareDocuments(
    document1: string,
    document2: string,
    config: LLMRequestConfig = {}
  ): Promise<{
    similarity: number;
    differences: string[];
    additions: string[];
    removals: string[];
    summary: string;
  }> {
    const prompt = `Você é um especialista em comparação de documentos jurídicos.

    Compare os dois documentos a seguir:

    DOCUMENTO 1:
    ${document1}

    DOCUMENTO 2:
    ${document2}

    INSTRUÇÕES:
    1. Calcule o nível de similaridade (0-100%)
    2. Liste as principais diferenças
    3. Identifique adições no documento 2
    4. Identifique remoções em relação ao documento 1
    5. Forneça um resumo executivo das mudanças

    FORMATO DE SAÍDA:
    {
      "similarity": número_0_a_100,
      "differences": ["diferença1", "diferença2"],
      "additions": ["adição1", "adição2"],
      "removals": ["remoção1", "remoção2"],
      "summary": "resumo_das_mudanças"
    }`;

    try {
      const result = await llmService.executeJSON<{
        similarity: number;
        differences: string[];
        additions: string[];
        removals: string[];
        summary: string;
      }>(prompt, { ...config, feature: "document-comparison" });

      return result;
    } catch (error) {
      console.error("Error during document comparison:", error);
      throw new Error("Failed to compare documents.");
    }
  }

  /**
   * Generate legal document summary with key insights
   */
  async generateInsights(
    text: string,
    documentType: string,
    config: LLMRequestConfig = {}
  ): Promise<{
    summary: string;
    risks: string[];
    opportunities: string[];
    recommendations: string[];
    urgency: "low" | "medium" | "high" | "critical";
  }> {
    const prompt = `Você é um assistente jurídico sênior especializado em análise estratégica.

    Analise o seguinte documento do tipo "${documentType}":

    TEXTO:
    ${text}

    INSTRUÇÕES:
    1. Gere um resumo executivo conciso
    2. Identifique riscos potenciais
    3. Identifique oportunidades
    4. Forneça recomendações acionáveis
    5. Avalie o nível de urgência

    FORMATO DE SAÍDA:
    {
      "summary": "resumo_executivo",
      "risks": ["risco1", "risco2"],
      "opportunities": ["oportunidade1", "oportunidade2"],
      "recommendations": ["recomendação1", "recomendação2"],
      "urgency": "low|medium|high|critical"
    }`;

    try {
      const result = await llmService.executeJSON<{
        summary: string;
        risks: string[];
        opportunities: string[];
        recommendations: string[];
        urgency: "low" | "medium" | "high" | "critical";
      }>(prompt, { ...config, feature: "insight-generation" });

      return result;
    } catch (error) {
      console.error("Error during insight generation:", error);
      throw new Error("Failed to generate insights.");
    }
  }
}

// Export singleton instance
export const nlpPipeline = new NLPPipeline();
