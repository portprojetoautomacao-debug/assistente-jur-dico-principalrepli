/**
 * Tipos compartilhados entre Content Script, Background e Backend
 */

export interface ProcessoPJe {
  numero: string; // Número CNJ sem formatação (20 dígitos)
  numeroFormatado: string; // Formato: 1234567-89.2024.8.13.0223
  classe: string; // Ex: "Guarda", "Alimentos", etc
  assunto: string;
  parteAutor: string;
  parteReu: string;
  vara: string;
  comarca: string;
  ultimoMovimento: {
    descricao: string;
    data: string; // Formato: "05/12/2025 14:03"
    timestamp: number;
  };
  situacao: "ativo" | "baixado" | "arquivado";
  valor?: string;
  distribuicao: string;
}

export interface Expediente {
  id: string;
  processNumber: string;
  description: string;
  type: "intimacao" | "citacao" | "despacho" | "decisao" | "sentenca" | "outro";
  createdAt: string; // ISO 8601
  source: "pje-extension";
  metadata: {
    vara: string;
    comarca: string;
    timestamp: number;
    previousMovement?: string;
  };
}

export interface SyncMessage {
  type:
    | "SYNC_PROCESSOS"
    | "SYNC_EXPEDIENTES"
    | "SYNC_DOCUMENTO"
    | "EXTRACT_DOCUMENT"
    | "FORCE_SYNC"
    | "PING";
  data?: ProcessoPJe[] | Expediente[] | DocumentoPJe;
  timestamp: number;
}

export interface SyncResponse {
  success: boolean;
  synced?: number;
  created?: number;
  error?: string;
}

/**
 * Documento extraído do PJe (certidão, mandado, etc)
 */
export interface DocumentoPJe {
  id: string;
  tipo:
    | "certidao"
    | "mandado"
    | "despacho"
    | "sentenca"
    | "decisao"
    | "peticao"
    | "contestacao"
    | "outro";
  conteudo: string;
  dataExtracao: string; // ISO 8601
  metadados: {
    numeroProcesso?: string;
    classe?: string;
    autor?: string;
    reu?: string;
    comarca?: string;
    vara?: string;
    cpfs?: string[];
    datas?: string[];
    dataJuntada?: string;
    descricao?: string;
  };
}

export interface StorageData {
  apiKey?: string;
  processos?: ProcessoPJe[];
  processos_timestamp?: number;
  expedientes_today?: Expediente[];
  documentos?: DocumentoPJe[];
  lastSync?: number;
  enabled?: boolean;
  crawlerQueue?: CrawlJob[];
  crawlerResults?: Record<string, CrawlResult>;
}

/**
 * Job de crawling
 */
export interface CrawlJob {
  id: string;
  processNumber: string;
  processNumberFormatted: string;
  status: "pending" | "processing" | "completed" | "failed";
  retries: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  tabId?: number;
  error?: string;
  pages: string[];
  metadata: {
    classe?: string;
    vara?: string;
    comarca?: string;
    parteAutor?: string;
    parteReu?: string;
  };
}

/**
 * Resultado do crawling de um processo
 */
export interface CrawlResult {
  processNumber: string;
  processNumberFormatted: string;
  crawledAt: string;
  dados: Record<string, string>;
  partes: PartePJe[];
  movimentos: Movimento[];
  documentos: DocumentoPJe[];
  expedientes: Expediente[];
  textoCompleto: string;
}

/**
 * Status do crawler
 */
export interface CrawlStatus {
  isRunning: boolean;
  isPaused: boolean;
  queueSize: number;
  activeJobs: number;
  completedJobs: number;
  pendingJobs: number;
  failedJobs: number;
}

/**
 * Parte do processo
 */
export interface PartePJe {
  nome: string;
  tipo: "autor" | "reu" | "terceiro" | "outro";
  documento?: string;
  advogados?: string[];
}

/**
 * Movimento processual
 */
export interface Movimento {
  data: string;
  descricao: string;
  tipo:
    | "sentenca"
    | "decisao"
    | "despacho"
    | "intimacao"
    | "citacao"
    | "juntada"
    | "publicacao"
    | "outros";
  timestamp: number;
}
