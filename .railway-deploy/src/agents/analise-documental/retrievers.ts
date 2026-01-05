/**
 * Retrievers para busca de documentos jurídicos similares
 * Baseado no padrão Google Agent Starter Pack (agentic_rag/retrievers.py)
 */

import { getGeminiApiKey, isGeminiConfigured } from "@/lib/gemini-config";
import { QdrantService, type SearchResult as QdrantSearchResult } from "@/lib/qdrant-service";
import type { AnaliseDocumentalInput } from "./validators";

const EMBEDDING_API_URL =
  "https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent";
const EMBEDDING_DIMENSION = 768;

export interface DocumentoJuridico {
  titulo: string;
  conteudo: string;
  relevancia: number;
  tipoDocumento: string;
  data: string;
  numeroProcesso?: string;
  partes?: string[];
  clausulasChave?: string[];
  tags?: string[];
}

export interface SearchResult {
  documentos: DocumentoJuridico[];
  totalFound: number;
  avgRelevance: number;
  query: string;
  executionTimeMs: number;
}

export interface DocumentSearchInput {
  texto: string;
  tipoDocumento?: string;
  limit?: number;
  relevanceThreshold?: number;
}

export class DocumentoRetriever {
  private readonly collectionName = "documentos_juridicos";
  private qdrantService: QdrantService | null = null;
  private useMockData: boolean = true;

  constructor() {
    const qdrantUrl = import.meta.env.VITE_QDRANT_URL || import.meta.env.QDRANT_URL;
    const qdrantKey = import.meta.env.VITE_QDRANT_API_KEY || import.meta.env.QDRANT_API_KEY;

    if (qdrantUrl && qdrantKey && typeof qdrantUrl === "string" && typeof qdrantKey === "string") {
      try {
        this.qdrantService = new QdrantService({
          url: qdrantUrl,
          apiKey: qdrantKey,
          collectionName: this.collectionName,
          timeout: 30000,
        });
        this.useMockData = false;
        console.log("✅ Qdrant connected:", { url: qdrantUrl, collection: this.collectionName });
      } catch (error) {
        console.warn("⚠️ Qdrant connection failed, using mock data:", error);
        this.useMockData = true;
      }
    } else {
      console.log("ℹ️ Qdrant credentials not found, using mock data");
      this.useMockData = true;
    }
  }

  async search(input: DocumentSearchInput): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      const embeddings = await this.generateEmbeddings(input.texto);
      const rawResults = await this.searchVectorDatabase(embeddings, input);
      const rankedDocumentos = this.reRankResults(rawResults, input.relevanceThreshold || 0.7);
      const filteredDocumentos = this.filterByTipo(
        rankedDocumentos,
        input.tipoDocumento || "todos"
      );
      const finalDocumentos = filteredDocumentos.slice(0, input.limit || 10);

      const executionTimeMs = Date.now() - startTime;

      return {
        documentos: finalDocumentos,
        totalFound: filteredDocumentos.length,
        avgRelevance: this.calculateAverageRelevance(finalDocumentos),
        query: input.texto,
        executionTimeMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorType = error instanceof Error ? error.name : "UnknownError";

      throw new Error(
        `Calling retrieval tool with query:\n\n${input.texto}\n\n` +
          `raised the following error:\n\n${errorType}: ${errorMessage}`
      );
    }
  }

  async searchFromAnalise(input: AnaliseDocumentalInput): Promise<SearchResult> {
    return this.search({
      texto: input.documentoTexto.substring(0, 1000),
      tipoDocumento: input.tipoDocumento,
      limit: 5,
      relevanceThreshold: 0.6,
    });
  }

  private async generateEmbeddings(text: string): Promise<number[]> {
    if (!isGeminiConfigured()) {
      console.warn("⚠️ [Embeddings] Gemini API não configurada, usando mock embeddings");
      return this.generateMockEmbeddings();
    }

    try {
      const apiKey = getGeminiApiKey();
      const startTime = Date.now();

      console.log("🔄 [Embeddings] Gerando embedding real via Gemini API...", {
        textLength: text.length,
        model: "text-embedding-004",
      });

      const response = await fetch(`${EMBEDDING_API_URL}?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: {
            parts: [{ text }],
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("❌ [Embeddings] Erro na API Gemini:", {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
        });
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const embeddings = data?.embedding?.values;

      if (!embeddings || !Array.isArray(embeddings)) {
        console.error("❌ [Embeddings] Resposta inválida da API:", data);
        throw new Error("Invalid embedding response from Gemini API");
      }

      const elapsedMs = Date.now() - startTime;
      console.log("✅ [Embeddings] Embedding gerado com sucesso:", {
        dimension: embeddings.length,
        elapsedMs,
      });

      return embeddings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        "❌ [Embeddings] Falha ao gerar embedding real, usando fallback mock:",
        errorMessage
      );
      return this.generateMockEmbeddings();
    }
  }

  private generateMockEmbeddings(): number[] {
    console.log("📦 [Embeddings] Usando mock embeddings (768 dimensões)");
    return Array.from({ length: EMBEDDING_DIMENSION }, () => Math.random());
  }

  private async searchVectorDatabase(
    embeddings: number[],
    input: DocumentSearchInput
  ): Promise<DocumentoJuridico[]> {
    if (this.qdrantService && !this.useMockData) {
      try {
        const qdrantResults = await this.qdrantService.search(embeddings, input.limit || 10);
        return this.mapQdrantResultsToDocumentos(qdrantResults);
      } catch (error) {
        console.warn("⚠️ Qdrant search failed, falling back to mock data:", error);
      }
    }

    return this.getMockDocumentos();
  }

  private mapQdrantResultsToDocumentos(results: QdrantSearchResult[]): DocumentoJuridico[] {
    return results.map((result) => ({
      titulo: (result.payload.titulo as string) || "Sem título",
      conteudo: (result.payload.conteudo as string) || "Sem conteúdo",
      relevancia: result.score,
      tipoDocumento: (result.payload.tipoDocumento as string) || "genérico",
      data: (result.payload.data as string) || new Date().toISOString().split("T")[0],
      numeroProcesso: result.payload.numeroProcesso as string | undefined,
      partes: (result.payload.partes as string[]) || [],
      clausulasChave: (result.payload.clausulasChave as string[]) || [],
      tags: (result.payload.tags as string[]) || [],
    }));
  }

  private getMockDocumentos(): DocumentoJuridico[] {
    const mockDocumentos: DocumentoJuridico[] = [
      {
        titulo: "Contrato de Prestação de Serviços - Modelo Padrão",
        conteudo:
          "Contrato de prestação de serviços que entre si celebram as partes identificadas... Cláusula 1ª - Do Objeto...",
        relevancia: 0.94,
        tipoDocumento: "contrato",
        data: "2024-06-15",
        numeroProcesso: undefined,
        partes: ["Empresa Contratante LTDA", "Prestador de Serviços ME"],
        clausulasChave: ["objeto", "prazo", "valor", "rescisão"],
        tags: ["prestação de serviços", "B2B", "modelo padrão"],
      },
      {
        titulo: "Petição Inicial - Reclamação Trabalhista",
        conteudo:
          "Exmo. Sr. Dr. Juiz do Trabalho da 99ª Vara do Trabalho de São Paulo... O reclamante vem expor e requerer...",
        relevancia: 0.88,
        tipoDocumento: "petição",
        data: "2024-08-20",
        numeroProcesso: "0001234-56.2024.5.02.0099",
        partes: ["João da Silva (Reclamante)", "Empresa XYZ S.A. (Reclamada)"],
        clausulasChave: [],
        tags: ["trabalhista", "petição inicial", "reclamação"],
      },
      {
        titulo: "Sentença - Ação de Cobrança",
        conteudo:
          "Vistos, relatados e discutidos estes autos... JULGO PROCEDENTE o pedido para condenar a ré...",
        relevancia: 0.82,
        tipoDocumento: "sentença",
        data: "2024-05-10",
        numeroProcesso: "0009876-54.2023.8.26.0100",
        partes: ["Credor Ltda", "Devedor ME"],
        clausulasChave: [],
        tags: ["cível", "cobrança", "sentença condenatória"],
      },
      {
        titulo: "Procuração Ad Judicia",
        conteudo:
          "Pelo presente instrumento particular de mandato, o outorgante constitui como seu procurador...",
        relevancia: 0.75,
        tipoDocumento: "procuração",
        data: "2024-09-01",
        numeroProcesso: undefined,
        partes: ["Outorgante", "Advogado OAB/SP 123.456"],
        clausulasChave: ["poderes", "foro", "revogação"],
        tags: ["procuração", "mandato", "advocacia"],
      },
      {
        titulo: "Decisão Interlocutória - Tutela de Urgência",
        conteudo:
          "Defiro a tutela de urgência requerida, ante a presença dos requisitos do art. 300 do CPC...",
        relevancia: 0.7,
        tipoDocumento: "decisão",
        data: "2024-07-22",
        numeroProcesso: "1005678-90.2024.8.26.0100",
        partes: ["Autor", "Réu"],
        clausulasChave: [],
        tags: ["tutela de urgência", "liminar", "decisão interlocutória"],
      },
    ];

    return mockDocumentos;
  }

  private reRankResults(documentos: DocumentoJuridico[], threshold: number): DocumentoJuridico[] {
    return documentos
      .filter((d) => d.relevancia >= threshold)
      .sort((a, b) => b.relevancia - a.relevancia);
  }

  private filterByTipo(documentos: DocumentoJuridico[], tipo: string): DocumentoJuridico[] {
    if (tipo === "todos" || tipo === "genérico") {
      return documentos;
    }

    return documentos.filter((d) => d.tipoDocumento === tipo);
  }

  private calculateAverageRelevance(documentos: DocumentoJuridico[]): number {
    if (documentos.length === 0) {
      return 0;
    }

    const sum = documentos.reduce((acc, d) => acc + d.relevancia, 0);
    return sum / documentos.length;
  }
}

export function formatDocumentos(documentos: DocumentoJuridico[]): string {
  if (documentos.length === 0) {
    return "Nenhum documento similar encontrado com os critérios especificados.";
  }

  return documentos
    .map((d, i) => {
      const lines = [
        `${i + 1}. **${d.titulo}**`,
        `Tipo: ${d.tipoDocumento}`,
        `Conteúdo: ${d.conteudo.substring(0, 150)}...`,
        `Relevância: ${(d.relevancia * 100).toFixed(0)}%`,
        `Data: ${d.data}`,
      ];

      if (d.numeroProcesso) {
        lines.push(`Processo: ${d.numeroProcesso}`);
      }

      if (d.partes && d.partes.length > 0) {
        lines.push(`Partes: ${d.partes.join(", ")}`);
      }

      if (d.clausulasChave && d.clausulasChave.length > 0) {
        lines.push(`Cláusulas-chave: ${d.clausulasChave.join(", ")}`);
      }

      if (d.tags && d.tags.length > 0) {
        lines.push(`Tags: ${d.tags.join(", ")}`);
      }

      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}
