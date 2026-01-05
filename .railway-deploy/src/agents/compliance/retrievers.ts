/**
 * Retrievers para busca de normas e regulamentos
 * Baseado no padrão Google Agent Starter Pack (agentic_rag/retrievers.py)
 */

import { getGeminiApiKey, isGeminiConfigured } from "@/lib/gemini-config";
import { QdrantService, type SearchResult as QdrantSearchResult } from "@/lib/qdrant-service";
import type { ComplianceInput } from "./validators";

const EMBEDDING_API_URL =
  "https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent";
const EMBEDDING_DIMENSION = 768;

export interface NormaRegulamento {
  titulo: string;
  ementa: string;
  relevancia: number;
  tipo: "lei" | "decreto" | "portaria" | "resolução" | "instrução normativa" | "súmula";
  numero: string;
  dataPublicacao: string;
  orgaoEmissor: string;
  artigos: ArtigoNorma[];
  vigente: boolean;
  tags?: string[];
}

export interface ArtigoNorma {
  numero: string;
  caput: string;
  paragrafos?: string[];
  incisos?: string[];
}

export interface SearchResult {
  normas: NormaRegulamento[];
  totalFound: number;
  avgRelevance: number;
  query: string;
  executionTimeMs: number;
}

export interface NormaSearchInput {
  texto: string;
  tipoVerificacao?: string;
  limit?: number;
  relevanceThreshold?: number;
}

export class NormaRegulamentoRetriever {
  private readonly collectionName = "normas_regulamentos";
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

  async search(input: NormaSearchInput): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      const embeddings = await this.generateEmbeddings(input.texto);
      const rawResults = await this.searchVectorDatabase(embeddings, input);
      const rankedNormas = this.reRankResults(rawResults, input.relevanceThreshold || 0.7);
      const filteredNormas = this.filterByTipoVerificacao(
        rankedNormas,
        input.tipoVerificacao || "todos"
      );
      const finalNormas = filteredNormas.slice(0, input.limit || 10);

      const executionTimeMs = Date.now() - startTime;

      return {
        normas: finalNormas,
        totalFound: filteredNormas.length,
        avgRelevance: this.calculateAverageRelevance(finalNormas),
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

  async searchFromCompliance(input: ComplianceInput): Promise<SearchResult> {
    return this.search({
      texto: input.documentoTexto.substring(0, 1000),
      tipoVerificacao: input.tipoVerificacao,
      limit: 10,
      relevanceThreshold: 0.5,
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
    input: NormaSearchInput
  ): Promise<NormaRegulamento[]> {
    if (this.qdrantService && !this.useMockData) {
      try {
        const qdrantResults = await this.qdrantService.search(embeddings, input.limit || 10);
        return this.mapQdrantResultsToNormas(qdrantResults);
      } catch (error) {
        console.warn("⚠️ Qdrant search failed, falling back to mock data:", error);
      }
    }

    return this.getMockNormas();
  }

  private mapQdrantResultsToNormas(results: QdrantSearchResult[]): NormaRegulamento[] {
    return results.map((result) => ({
      titulo: (result.payload.titulo as string) || "Sem título",
      ementa: (result.payload.ementa as string) || "Sem ementa",
      relevancia: result.score,
      tipo: (result.payload.tipo as NormaRegulamento["tipo"]) || "lei",
      numero: (result.payload.numero as string) || "S/N",
      dataPublicacao:
        (result.payload.dataPublicacao as string) || new Date().toISOString().split("T")[0],
      orgaoEmissor: (result.payload.orgaoEmissor as string) || "Desconhecido",
      artigos: (result.payload.artigos as ArtigoNorma[]) || [],
      vigente: result.payload.vigente !== false,
      tags: (result.payload.tags as string[]) || [],
    }));
  }

  private getMockNormas(): NormaRegulamento[] {
    const mockNormas: NormaRegulamento[] = [
      {
        titulo: "Lei Geral de Proteção de Dados Pessoais (LGPD)",
        ementa:
          "Dispõe sobre o tratamento de dados pessoais, inclusive nos meios digitais, por pessoa natural ou por pessoa jurídica",
        relevancia: 0.96,
        tipo: "lei",
        numero: "13.709/2018",
        dataPublicacao: "2018-08-14",
        orgaoEmissor: "Congresso Nacional",
        artigos: [
          {
            numero: "7º",
            caput:
              "O tratamento de dados pessoais somente poderá ser realizado nas seguintes hipóteses:",
            incisos: [
              "I - mediante o fornecimento de consentimento pelo titular",
              "II - para o cumprimento de obrigação legal ou regulatória",
              "III - pela administração pública, para tratamento de dados necessários à execução de políticas públicas",
            ],
          },
          {
            numero: "11",
            caput:
              "O tratamento de dados pessoais sensíveis somente poderá ocorrer nas seguintes hipóteses:",
            incisos: [
              "I - quando o titular ou seu responsável legal consentir",
              "II - sem fornecimento de consentimento do titular, nas hipóteses em que for indispensável para...",
            ],
          },
        ],
        vigente: true,
        tags: ["lgpd", "dados pessoais", "privacidade", "compliance"],
      },
      {
        titulo: "Lei de Lavagem de Dinheiro",
        ementa: "Dispõe sobre os crimes de lavagem ou ocultação de bens, direitos e valores",
        relevancia: 0.92,
        tipo: "lei",
        numero: "9.613/1998",
        dataPublicacao: "1998-03-03",
        orgaoEmissor: "Congresso Nacional",
        artigos: [
          {
            numero: "1º",
            caput:
              "Ocultar ou dissimular a natureza, origem, localização, disposição, movimentação ou propriedade de bens, direitos ou valores provenientes, direta ou indiretamente, de infração penal.",
          },
          {
            numero: "10",
            caput:
              "As pessoas referidas no art. 9º: I - identificarão seus clientes e manterão cadastro atualizado...",
          },
        ],
        vigente: true,
        tags: ["lavagem", "crime financeiro", "PLD", "compliance"],
      },
      {
        titulo: "Resolução BACEN - Política de Prevenção à Lavagem",
        ementa:
          "Dispõe sobre a política, os procedimentos e os controles internos de prevenção à lavagem de dinheiro",
        relevancia: 0.88,
        tipo: "resolução",
        numero: "4.753/2019",
        dataPublicacao: "2019-09-26",
        orgaoEmissor: "Banco Central do Brasil",
        artigos: [
          {
            numero: "2º",
            caput:
              "A política de prevenção à lavagem de dinheiro e ao financiamento do terrorismo deve contemplar...",
          },
        ],
        vigente: true,
        tags: ["BACEN", "PLD", "financeiro", "controles internos"],
      },
      {
        titulo: "Código de Ética do Servidor Público",
        ementa:
          "Aprova o Código de Ética Profissional do Servidor Público Civil do Poder Executivo Federal",
        relevancia: 0.85,
        tipo: "decreto",
        numero: "1.171/1994",
        dataPublicacao: "1994-06-22",
        orgaoEmissor: "Presidência da República",
        artigos: [
          {
            numero: "I",
            caput:
              "A dignidade, o decoro, o zelo, a eficácia e a consciência dos princípios morais são primados maiores...",
          },
        ],
        vigente: true,
        tags: ["ética", "servidor público", "conduta", "administração pública"],
      },
      {
        titulo: "Instrução Normativa RFB - Compliance Tributário",
        ementa: "Dispõe sobre o programa de conformidade cooperativa fiscal",
        relevancia: 0.8,
        tipo: "instrução normativa",
        numero: "2.153/2023",
        dataPublicacao: "2023-07-15",
        orgaoEmissor: "Receita Federal do Brasil",
        artigos: [
          {
            numero: "3º",
            caput: "O contribuinte participante do Confia deverá manter governança tributária...",
          },
        ],
        vigente: true,
        tags: ["tributário", "Confia", "RFB", "compliance fiscal"],
      },
      {
        titulo: "NR-1 - Disposições Gerais e Gerenciamento de Riscos Ocupacionais",
        ementa:
          "Estabelece as disposições gerais, o campo de aplicação, os termos e as definições comuns às Normas Regulamentadoras",
        relevancia: 0.75,
        tipo: "portaria",
        numero: "MTP 423/2021",
        dataPublicacao: "2021-12-07",
        orgaoEmissor: "Ministério do Trabalho e Previdência",
        artigos: [
          {
            numero: "1.5.1",
            caput:
              "O empregador deve implementar o gerenciamento de riscos ocupacionais em suas organizações...",
          },
        ],
        vigente: true,
        tags: ["trabalhista", "NR", "segurança do trabalho", "GRO"],
      },
      {
        titulo: "Súmula Vinculante 37 - STF",
        ementa:
          "Não cabe ao Poder Judiciário, que não tem função legislativa, aumentar vencimentos de servidores públicos sob o fundamento de isonomia.",
        relevancia: 0.72,
        tipo: "súmula",
        numero: "37",
        dataPublicacao: "2014-10-24",
        orgaoEmissor: "Supremo Tribunal Federal",
        artigos: [],
        vigente: true,
        tags: ["STF", "súmula vinculante", "servidor público", "remuneração"],
      },
    ];

    return mockNormas;
  }

  private reRankResults(normas: NormaRegulamento[], threshold: number): NormaRegulamento[] {
    return normas
      .filter((n) => n.relevancia >= threshold)
      .sort((a, b) => b.relevancia - a.relevancia);
  }

  private filterByTipoVerificacao(
    normas: NormaRegulamento[],
    tipoVerificacao: string
  ): NormaRegulamento[] {
    if (tipoVerificacao === "todos") {
      return normas;
    }

    const tipoToTagsMap: Record<string, string[]> = {
      lgpd: ["lgpd", "dados pessoais", "privacidade"],
      lavagem: ["lavagem", "PLD", "crime financeiro"],
      etica: ["ética", "conduta", "integridade"],
      tributario: ["tributário", "fiscal", "RFB"],
      trabalhista: ["trabalhista", "NR", "CLT"],
    };

    const relevantTags = tipoToTagsMap[tipoVerificacao] || [];

    if (relevantTags.length === 0) {
      return normas;
    }

    return normas.filter((n) => n.tags?.some((tag) => relevantTags.includes(tag.toLowerCase())));
  }

  private calculateAverageRelevance(normas: NormaRegulamento[]): number {
    if (normas.length === 0) {
      return 0;
    }

    const sum = normas.reduce((acc, n) => acc + n.relevancia, 0);
    return sum / normas.length;
  }
}

export function formatNormas(normas: NormaRegulamento[]): string {
  if (normas.length === 0) {
    return "Nenhuma norma ou regulamento encontrado com os critérios especificados.";
  }

  return normas
    .map((n, i) => {
      const lines = [
        `${i + 1}. **${n.titulo}**`,
        `Tipo: ${n.tipo.toUpperCase()} nº ${n.numero}`,
        `Ementa: ${n.ementa.substring(0, 150)}...`,
        `Relevância: ${(n.relevancia * 100).toFixed(0)}%`,
        `Órgão: ${n.orgaoEmissor} | Publicação: ${n.dataPublicacao}`,
        `Status: ${n.vigente ? "✅ Vigente" : "❌ Revogada"}`,
      ];

      if (n.artigos.length > 0) {
        lines.push(`Artigos relevantes:`);
        n.artigos.slice(0, 2).forEach((a) => {
          lines.push(`  - Art. ${a.numero}: ${a.caput.substring(0, 80)}...`);
        });
      }

      if (n.tags && n.tags.length > 0) {
        lines.push(`Tags: ${n.tags.join(", ")}`);
      }

      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}
