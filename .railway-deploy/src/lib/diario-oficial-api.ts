/**
 * Official Gazette (Diários Oficiais) API Integration
 *
 * Monitors official publications from:
 * - DJe (Diário de Justiça Eletrônico) from all courts
 * - DOU (Diário Oficial da União)
 * - State official gazettes
 *
 * These are the primary sources for all legal publications and notifications
 */

import type {
  UnifiedPublication,
  PublicationSearchParams,
  PublicationSourceConfig,
} from "./publication-sources-types";

export interface DiarioOficialConfig extends PublicationSourceConfig {
  source: "diario_oficial";
  monitoredGazettes?: string[];
}

export interface DiarioOficialEntry {
  id: string;
  gazette: string;
  edition: string;
  date: string;
  section?: string;
  page?: string;
  content: string;
  type?: string;
  entities?: string[];
  url?: string;
}

export interface GazetteSourceInfo {
  name: string;
  url: string;
  api?: string;
  note?: string;
  sections?: string[];
}

/**
 * Main official gazette sources in Brazil
 */
const GAZETTES_SOURCES = {
  // Federal
  dou: {
    name: "Diário Oficial da União",
    url: "https://www.in.gov.br/consulta",
    sections: ["Seção 1", "Seção 2", "Seção 3", "Suplemento"],
  },

  // Judicial - via DJEN (already implemented in djen-api.ts)
  djen: {
    name: "Diário de Justiça Eletrônico Nacional",
    url: "https://comunica.pje.jus.br",
    note: "Use DJEN API integration (already implemented)",
  },

  // States - examples
  doe_sp: {
    name: "Diário Oficial do Estado de São Paulo",
    url: "https://www.imprensaoficial.com.br",
  },
  doe_mg: {
    name: "Diário Oficial do Estado de Minas Gerais",
    url: "https://www.jornalminasgerais.mg.gov.br",
  },
  doe_rj: {
    name: "Diário Oficial do Estado do Rio de Janeiro",
    url: "https://www.ioerj.com.br",
  },

  // Third-party aggregators with better APIs
  querido_diario: {
    name: "Querido Diário (Open Knowledge Brasil)",
    url: "https://queridodiario.ok.org.br",
    api: "https://queridodiario.ok.org.br/api/docs",
    note: "Open source project aggregating municipal gazettes",
  },
} satisfies Record<string, GazetteSourceInfo>;

export class DiarioOficialAPIError extends Error {
  constructor(
    message: string,
    public gazette?: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "DiarioOficialAPIError";
  }
}

/**
 * Tipagem mínima da resposta do Querido Diário
 * (somente campos que realmente usamos)
 */
interface QueridoDiarioGazette {
  territory_id: string;
  territory_name: string;
  date: string;
  edition: string;
  url: string;
  excerpt?: string;
  txt_url?: string;
}

interface QueridoDiarioResponse {
  gazettes?: QueridoDiarioGazette[];
}

/**
 * Search in Querido Diário API (municipal gazettes)
 * This is an open source project with a public API
 */
export async function consultarQueridoDiario(
  params: PublicationSearchParams
): Promise<UnifiedPublication[]> {
  const publications: UnifiedPublication[] = [];

  if (!params.keywords || params.keywords.length === 0) {
    throw new DiarioOficialAPIError("Keywords required for gazette search");
  }

  const baseUrl = "https://queridodiario.ok.org.br/api";
  const searchQuery = params.keywords.join(" OR ");

  try {
    const queryParams = new URLSearchParams();
    queryParams.append("q", searchQuery);

    if (params.startDate) {
      queryParams.append("published_since", params.startDate);
    }
    if (params.endDate) {
      queryParams.append("published_until", params.endDate);
    }

    // Add lawyer/party search terms to query
    const additionalTerms = [params.lawyerName, params.oabNumber, params.partyName].filter(
      Boolean
    ) as string[];

    if (additionalTerms.length > 0) {
      queryParams.append("excerpt_size", "500");
      const fullQuery = `${searchQuery} AND (${additionalTerms.join(" OR ")})`;
      queryParams.set("q", fullQuery);
    }

    const url = `${baseUrl}/gazettes?${queryParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new DiarioOficialAPIError(
        `HTTP ${response.status}: ${response.statusText}`,
        "querido_diario",
        response.status
      );
    }

    const data = (await response.json()) as QueridoDiarioResponse;

    // Process results
    if (data.gazettes && Array.isArray(data.gazettes)) {
      for (const gazette of data.gazettes) {
        publications.push({
          id: `qd_${gazette.territory_id}_${gazette.date}_${gazette.edition}`,
          source: "diario_oficial",
          sourceUrl: gazette.url,
          title: `Diário Oficial - ${gazette.territory_name}`,
          content: gazette.excerpt || gazette.txt_url || "",
          publicationType: "Diário Oficial Municipal",
          publicationDate: gazette.date,
          officialGazette: gazette.territory_name,
          pageNumber: gazette.edition,
          matchReason: `Encontrado em ${gazette.territory_name}`,
          matchType: "keyword",
          rawData: gazette,
        });
      }
    }

    return publications;
  } catch (error) {
    if (error instanceof DiarioOficialAPIError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new DiarioOficialAPIError(
        `Error searching Querido Diário: ${error.message}`,
        "querido_diario",
        undefined,
        error
      );
    }

    throw new DiarioOficialAPIError(
      "Unknown error searching gazettes",
      "querido_diario",
      undefined,
      error
    );
  }
}

/**
 * Get information about available gazette sources
 */
export function getAvailableGazettes(): Array<{
  id: string;
  name: string;
  url: string;
  api?: string;
  note?: string;
  sections?: string[];
}> {
  return Object.entries(GAZETTES_SOURCES).map(([key, info]) => ({
    id: key,
    name: info.name,
    url: info.url,
    api: "api" in info ? info.api : undefined,
    note: "note" in info ? info.note : undefined,
    sections: "sections" in info ? info.sections : undefined,
  }));
}

/**
 * NOTE: Direct integration with DOU, State DOEs requires:
 * 1. Web scraping (most don't have public APIs)
 * 2. OCR for PDF processing
 * 3. Parsing of HTML/XML formats
 *
 * For production use, consider:
 * - Third-party aggregators (JusBrasil, Escavador APIs)
 * - Professional gazette monitoring services
 * - DJEN API (already implemented) for judicial publications
 */
