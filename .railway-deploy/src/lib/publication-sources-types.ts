/**
 * Unified types for multi-source legal publication monitoring
 * Supports DJEN, DataJud, PJe, Court Portals, and Official Gazettes
 */

export type PublicationSource =
  | "djen" // DJEN via Comunica API (already implemented)
  | "datajud" // DataJud CNJ API (already implemented)
  | "pje_direct" // PJe Direct API
  | "tjsp_portal" // TJSP Portal
  | "tjmg_portal" // TJMG Portal
  | "trf_portal" // TRF Portals (1-5)
  | "tst_portal" // TST Portal
  | "diario_oficial" // Official Gazettes (Estado/Federal/Municipal)
  | "jusbrasil" // JusBrasil API (third-party aggregator)
  | "escavador"; // Escavador API (third-party)

/**
 * Tipos de match padronizados entre fontes (DJEN, DataJud, etc.)
 * Mantém a semântica de "o que exatamente bateu" na publicação.
 */
export type PublicationMatchType =
  | "lawyer_name"
  | "oab_number"
  | "process_number"
  | "party_name"
  | "keyword";

export interface UnifiedPublication {
  // Identification
  id: string;
  source: PublicationSource;
  sourceUrl?: string;

  // Content
  title: string;
  content: string;
  publicationType: string;

  // Case info
  processNumber?: string;
  tribunal?: string;
  court?: string;

  // Parties
  parts?: string[];
  lawyers?: string[];
  lawyerOAB?: string[];

  // Dates (ISO strings: yyyy-MM-dd ou yyyy-MM-ddTHH:mm:ssZ)
  publicationDate: string;
  availabilityDate?: string;
  deadlineDate?: string;

  // Metadata
  officialGazette?: string;
  pageNumber?: string;
  section?: string;

  // Match info
  matchReason?: string;
  matchType?: PublicationMatchType;
  confidence?: number;

  // Raw data da fonte original (DJEN, DataJud, etc.)
  rawData?: unknown;
}

export interface PublicationSourceConfig {
  source: PublicationSource;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  rateLimit?: {
    requestsPerMinute: number;
    delayBetweenRequests: number;
  };
  customHeaders?: Record<string, string>;
}

export interface PublicationSearchParams {
  // Lawyer identification
  lawyerName?: string;
  oabNumber?: string;
  oabUF?: string;

  // Party identification
  partyName?: string;
  cpfCnpj?: string;

  // Case identification
  processNumber?: string;
  tribunals?: string[];

  // Date range (ISO yyyy-MM-dd)
  startDate?: string;
  endDate?: string;

  // Keywords
  keywords?: string[];

  // Filters
  publicationType?: string[];
  sources?: PublicationSource[];
}

export interface PublicationSearchResult {
  publications: UnifiedPublication[];
  totalFound: number;
  sources: {
    source: PublicationSource;
    count: number;
    status: "success" | "error" | "not_configured";
    error?: string;
    duration?: number; // ms
  }[];
  searchParams: PublicationSearchParams;
  timestamp: string; // ISO
}

export interface SourceCapabilities {
  source: PublicationSource;
  name: string;
  description: string;
  official: boolean;
  requiresAuth: boolean;
  supportsRealtime: boolean;
  coverage: {
    tribunals?: string[];
    states?: string[];
    nationwide: boolean;
  };
  features: {
    lawyerSearch: boolean;
    oabSearch: boolean;
    processSearch: boolean;
    partySearch: boolean;
    keywordSearch: boolean;
    historicalData: boolean;
    alerts: boolean;
  };
  limits?: {
    maxDateRange?: number; // days
    maxResultsPerRequest?: number;
    rateLimit?: string;
  };
  status: "active" | "beta" | "planned" | "deprecated";
}
