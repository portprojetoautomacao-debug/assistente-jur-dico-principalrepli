export interface MultiSourceConfig {
  sources: PublicationSource[];
  preferredSources?: string[];
  maxConcurrentRequests?: number;
  aggregateResults?: boolean;
  deduplicateResults?: boolean;
}

export interface PublicationSearchParams {
  query?: string;
  startDate?: string;
  endDate?: string;
  sources?: string[];
  lawyerName?: string;
  oabNumber?: string;
  processNumber?: string;
  partyName?: string;
  keywords?: string[];
}

export interface UnifiedPublication {
  id: string;
  title: string;
  date: string;
  source: string;
  content: string;
  url?: string;
  sourceUrl?: string;
  publicationType?: string;
  matchType?: string;
  publicationDate?: string;
  processNumber?: string;
  tribunal?: string;
  court?: string;
}

export type PublicationSource = "djen" | "datajud" | "pje" | "diario-oficial";

export interface SourceCapabilities {
  search: boolean;
  filter: boolean;
  download: boolean;
}

export function getDefaultConfig(): MultiSourceConfig {
  return {
    sources: [],
    maxConcurrentRequests: 3,
    aggregateResults: true,
    deduplicateResults: true,
  };
}

export function getSourceCapabilities(_source: PublicationSource): SourceCapabilities {
  return {
    search: true,
    filter: true,
    download: false,
  };
}

export function getEnabledSources(): PublicationSource[] {
  return ["djen", "datajud", "pje", "diario-oficial"];
}

export interface PublicationSearchResult {
  publications: UnifiedPublication[];
  totalFound: number;
  sources: PublicationSource[];
}

export async function searchPublications(
  _params: PublicationSearchParams,
  _config?: Partial<MultiSourceConfig>
): Promise<PublicationSearchResult> {
  return {
    publications: [],
    totalFound: 0,
    sources: [],
  };
}
