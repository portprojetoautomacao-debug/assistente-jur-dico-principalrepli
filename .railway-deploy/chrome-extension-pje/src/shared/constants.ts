/**
 * Constantes compartilhadas
 */

export const BACKEND_URL = "https://assistente-juridico-github.vercel.app";

export const API_ENDPOINTS = {
  PJE_SYNC: "/api/pje-sync",
  STATUS: "/api/status",
  GENERATE_KEY: "/api/generate-api-key",
} as const;

export const STORAGE_KEYS = {
  API_KEY: "apiKey",
  PROCESSOS: "processos",
  PROCESSOS_TIMESTAMP: "processos_timestamp",
  EXPEDIENTES_TODAY: "expedientes_today",
  LAST_SYNC: "lastSync",
  ERRORS: "errors",
  ENABLED: "enabled",
  // Crawler keys
  CRAWLER_QUEUE: "crawler_queue",
  CRAWLER_RESULTS: "crawler_results",
  CRAWLER_STATUS: "crawler_status",
} as const;

export const SYNC_INTERVAL = 60000; // 1 minuto
export const DEBOUNCE_DELAY = 1000; // 1 segundo
export const RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 2000; // 2 segundos

export const PJE_SELECTORS = {
  // Seletores reais do PJe TJMG (RichFaces) + seletores de teste
  PROCESSO_ROW:
    ".processo-row, tr.rich-table-row, tr.rich-table-firstrow, .linha-processo, [id*='processoForm'] tr",
  NUMERO_PROCESSO: "a[id*='numero'], .numero-processo, td:first-child a, span[id*='numero']",
  CLASSE: ".classe-judicial, td.classe, span[id*='classe']",
  ASSUNTO: ".assunto, td.assunto, span[id*='assunto']",
  PARTE_AUTOR: ".polo-ativo, .autor, span[id*='autor'], span[id*='poloAtivo']",
  PARTE_REU: ".polo-passivo, .reu, span[id*='reu'], span[id*='poloPassivo']",
  VARA: ".orgao-julgador, .vara, span[id*='orgao'], span[id*='vara']",
  MOVIMENTO: ".ultimo-movimento, .movimento, span[id*='movimento'], span[id*='ultimoMovimento']",
  DATA: ".data, span[id*='data'], td.data",
  SITUACAO: ".situacao, span[id*='situacao'], span[id*='status']",
  // Seletores de abas do PJe
  TAB_EXPEDIENTES: "#tabExpedientes_shifted, [id*='tabExpedientes']",
  TAB_ACERVO: "#tabAcervo_shifted, [id*='tabAcervo']",
  TAB_CONSULTA: "#tabConsultaProcesso_shifted, [id*='tabConsulta']",
} as const;

export const CNJ_REGEX = /(\d{7})-?(\d{2})\.?(\d{4})\.?(\d{1})\.?(\d{2})\.?(\d{4})/;
export const CNJ_CLEAN_REGEX = /^\d{20}$/;
