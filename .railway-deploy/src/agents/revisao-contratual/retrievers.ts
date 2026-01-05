/**
 * Retrievers para busca de templates e padrões contratuais
 * Baseado no padrão Google Agent Starter Pack (agentic_rag/retrievers.py)
 */

import { getGeminiApiKey, isGeminiConfigured } from "@/lib/gemini-config";
import { QdrantService, type SearchResult as QdrantSearchResult } from "@/lib/qdrant-service";
import type { RevisaoContratualInput } from "./validators";

const EMBEDDING_API_URL =
  "https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent";
const EMBEDDING_DIMENSION = 768;

export interface TemplateContratual {
  titulo: string;
  descricao: string;
  relevancia: number;
  tipoContrato: string;
  clausulasPadrao: ClausulaPadrao[];
  versao: string;
  ultimaAtualizacao: string;
  fonte?: string;
  tags?: string[];
}

export interface ClausulaPadrao {
  numero: string;
  titulo: string;
  texto: string;
  obrigatoria: boolean;
  comentarios?: string;
}

export interface SearchResult {
  templates: TemplateContratual[];
  totalFound: number;
  avgRelevance: number;
  query: string;
  executionTimeMs: number;
}

export interface TemplateSearchInput {
  texto: string;
  tipoContrato?: string;
  limit?: number;
  relevanceThreshold?: number;
}

export class TemplateContratualRetriever {
  private readonly collectionName = "contratos_templates";
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

  async search(input: TemplateSearchInput): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      const embeddings = await this.generateEmbeddings(input.texto);
      const rawResults = await this.searchVectorDatabase(embeddings, input);
      const rankedTemplates = this.reRankResults(rawResults, input.relevanceThreshold || 0.7);
      const filteredTemplates = this.filterByTipo(rankedTemplates, input.tipoContrato || "todos");
      const finalTemplates = filteredTemplates.slice(0, input.limit || 10);

      const executionTimeMs = Date.now() - startTime;

      return {
        templates: finalTemplates,
        totalFound: filteredTemplates.length,
        avgRelevance: this.calculateAverageRelevance(finalTemplates),
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

  async searchFromRevisao(input: RevisaoContratualInput): Promise<SearchResult> {
    return this.search({
      texto: input.contratoTexto.substring(0, 1000),
      tipoContrato: input.tipoContrato,
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
    input: TemplateSearchInput
  ): Promise<TemplateContratual[]> {
    if (this.qdrantService && !this.useMockData) {
      try {
        const qdrantResults = await this.qdrantService.search(embeddings, input.limit || 10);
        return this.mapQdrantResultsToTemplates(qdrantResults);
      } catch (error) {
        console.warn("⚠️ Qdrant search failed, falling back to mock data:", error);
      }
    }

    return this.getMockTemplates();
  }

  private mapQdrantResultsToTemplates(results: QdrantSearchResult[]): TemplateContratual[] {
    return results.map((result) => ({
      titulo: (result.payload.titulo as string) || "Sem título",
      descricao: (result.payload.descricao as string) || "Sem descrição",
      relevancia: result.score,
      tipoContrato: (result.payload.tipoContrato as string) || "outro",
      clausulasPadrao: (result.payload.clausulasPadrao as ClausulaPadrao[]) || [],
      versao: (result.payload.versao as string) || "1.0",
      ultimaAtualizacao:
        (result.payload.ultimaAtualizacao as string) || new Date().toISOString().split("T")[0],
      fonte: result.payload.fonte as string | undefined,
      tags: (result.payload.tags as string[]) || [],
    }));
  }

  private getMockTemplates(): TemplateContratual[] {
    const mockTemplates: TemplateContratual[] = [
      {
        titulo: "Template - Contrato de Prestação de Serviços",
        descricao:
          "Modelo padrão para contratos de prestação de serviços entre empresas ou pessoa física",
        relevancia: 0.95,
        tipoContrato: "prestação de serviços",
        clausulasPadrao: [
          {
            numero: "1",
            titulo: "Objeto",
            texto:
              "O presente contrato tem por objeto a prestação de serviços de [DESCREVER SERVIÇOS]...",
            obrigatoria: true,
            comentarios: "Descrever detalhadamente os serviços",
          },
          {
            numero: "2",
            titulo: "Prazo",
            texto:
              "O prazo de vigência do presente contrato é de [XX] meses, iniciando em [DATA]...",
            obrigatoria: true,
          },
          {
            numero: "3",
            titulo: "Valor e Forma de Pagamento",
            texto:
              "Pelos serviços prestados, o CONTRATANTE pagará ao CONTRATADO o valor de R$ [VALOR]...",
            obrigatoria: true,
          },
          {
            numero: "4",
            titulo: "Rescisão",
            texto:
              "O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 dias...",
            obrigatoria: false,
          },
        ],
        versao: "2.1",
        ultimaAtualizacao: "2024-06-01",
        fonte: "OAB/SP - Modelo Recomendado",
        tags: ["prestação de serviços", "B2B", "modelo padrão"],
      },
      {
        titulo: "Template - Contrato de Locação Residencial",
        descricao:
          "Modelo de contrato de locação de imóvel residencial urbano conforme Lei 8.245/91",
        relevancia: 0.9,
        tipoContrato: "locação",
        clausulasPadrao: [
          {
            numero: "1",
            titulo: "Objeto da Locação",
            texto:
              "O LOCADOR cede ao LOCATÁRIO, para uso exclusivamente residencial, o imóvel situado em...",
            obrigatoria: true,
          },
          {
            numero: "2",
            titulo: "Prazo da Locação",
            texto:
              "O prazo da locação é de [XX] meses, com início em [DATA] e término em [DATA]...",
            obrigatoria: true,
          },
          {
            numero: "3",
            titulo: "Aluguel",
            texto: "O aluguel mensal é de R$ [VALOR], a ser pago até o dia [XX] de cada mês...",
            obrigatoria: true,
          },
          {
            numero: "4",
            titulo: "Garantia",
            texto: "Como garantia do presente contrato, o LOCATÁRIO oferece [TIPO DE GARANTIA]...",
            obrigatoria: true,
            comentarios: "Escolher entre caução, fiador ou seguro-fiança",
          },
        ],
        versao: "3.0",
        ultimaAtualizacao: "2024-03-15",
        fonte: "CRECI/SP",
        tags: ["locação", "residencial", "Lei do Inquilinato"],
      },
      {
        titulo: "Template - Contrato de Trabalho CLT",
        descricao: "Modelo de contrato individual de trabalho por prazo indeterminado conforme CLT",
        relevancia: 0.87,
        tipoContrato: "trabalho",
        clausulasPadrao: [
          {
            numero: "1",
            titulo: "Admissão",
            texto: "O EMPREGADOR admite o EMPREGADO para exercer a função de [CARGO]...",
            obrigatoria: true,
          },
          {
            numero: "2",
            titulo: "Jornada de Trabalho",
            texto: "A jornada de trabalho será de [XX] horas semanais, de segunda a sexta-feira...",
            obrigatoria: true,
          },
          {
            numero: "3",
            titulo: "Remuneração",
            texto:
              "O salário mensal será de R$ [VALOR], pago até o 5º dia útil do mês subsequente...",
            obrigatoria: true,
          },
          {
            numero: "4",
            titulo: "Período de Experiência",
            texto:
              "O contrato terá período de experiência de 45 dias, prorrogável por mais 45 dias...",
            obrigatoria: false,
          },
        ],
        versao: "4.2",
        ultimaAtualizacao: "2024-01-10",
        fonte: "MTE - Modelo Oficial",
        tags: ["trabalho", "CLT", "prazo indeterminado"],
      },
      {
        titulo: "Template - Contrato de Compra e Venda de Imóvel",
        descricao:
          "Modelo de contrato para compra e venda de imóvel com cláusulas de financiamento",
        relevancia: 0.83,
        tipoContrato: "compra e venda",
        clausulasPadrao: [
          {
            numero: "1",
            titulo: "Objeto",
            texto: "O VENDEDOR vende ao COMPRADOR o imóvel descrito na matrícula nº [XX]...",
            obrigatoria: true,
          },
          {
            numero: "2",
            titulo: "Preço e Condições de Pagamento",
            texto: "O preço total do imóvel é de R$ [VALOR], a ser pago da seguinte forma...",
            obrigatoria: true,
          },
          {
            numero: "3",
            titulo: "Escritura e Registro",
            texto: "A escritura pública será lavrada no Cartório de Notas após a quitação...",
            obrigatoria: true,
          },
        ],
        versao: "2.5",
        ultimaAtualizacao: "2024-04-20",
        fonte: "Cartório de Registro de Imóveis",
        tags: ["compra e venda", "imóvel", "escritura"],
      },
      {
        titulo: "Template - Contrato Social de Sociedade Limitada",
        descricao: "Modelo de contrato social para constituição de sociedade empresária limitada",
        relevancia: 0.78,
        tipoContrato: "sociedade",
        clausulasPadrao: [
          {
            numero: "1",
            titulo: "Denominação Social",
            texto: "A sociedade adotará a denominação social [NOME] Ltda...",
            obrigatoria: true,
          },
          {
            numero: "2",
            titulo: "Capital Social",
            texto:
              "O capital social é de R$ [VALOR], dividido em [XX] quotas de R$ [VALOR] cada...",
            obrigatoria: true,
          },
          {
            numero: "3",
            titulo: "Administração",
            texto: "A sociedade será administrada por [SÓCIO(S)]...",
            obrigatoria: true,
          },
        ],
        versao: "1.8",
        ultimaAtualizacao: "2024-02-28",
        fonte: "Junta Comercial",
        tags: ["sociedade", "limitada", "contrato social"],
      },
    ];

    return mockTemplates;
  }

  private reRankResults(templates: TemplateContratual[], threshold: number): TemplateContratual[] {
    return templates
      .filter((t) => t.relevancia >= threshold)
      .sort((a, b) => b.relevancia - a.relevancia);
  }

  private filterByTipo(templates: TemplateContratual[], tipo: string): TemplateContratual[] {
    if (tipo === "todos" || tipo === "outro") {
      return templates;
    }

    return templates.filter((t) => t.tipoContrato === tipo);
  }

  private calculateAverageRelevance(templates: TemplateContratual[]): number {
    if (templates.length === 0) {
      return 0;
    }

    const sum = templates.reduce((acc, t) => acc + t.relevancia, 0);
    return sum / templates.length;
  }
}

export function formatTemplates(templates: TemplateContratual[]): string {
  if (templates.length === 0) {
    return "Nenhum template contratual encontrado com os critérios especificados.";
  }

  return templates
    .map((t, i) => {
      const lines = [
        `${i + 1}. **${t.titulo}**`,
        `Tipo: ${t.tipoContrato}`,
        `Descrição: ${t.descricao}`,
        `Relevância: ${(t.relevancia * 100).toFixed(0)}%`,
        `Versão: ${t.versao} | Atualizado em: ${t.ultimaAtualizacao}`,
        `Cláusulas padrão: ${t.clausulasPadrao.length}`,
      ];

      if (t.fonte) {
        lines.push(`Fonte: ${t.fonte}`);
      }

      if (t.clausulasPadrao.length > 0) {
        lines.push(`Cláusulas principais:`);
        t.clausulasPadrao.slice(0, 3).forEach((c) => {
          lines.push(`  - ${c.numero}. ${c.titulo}${c.obrigatoria ? " (obrigatória)" : ""}`);
        });
      }

      if (t.tags && t.tags.length > 0) {
        lines.push(`Tags: ${t.tags.join(", ")}`);
      }

      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}
