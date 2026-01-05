/**
 * Cliente DJEN compartilhado
 * Centraliza toda a lógica de integração com a API do DJEN
 */

import { SafeLogger } from "./safe-logger.js";

const logger = new SafeLogger("DJEN");

// Type aliases para evitar repetição de union types (SonarCloud S4323)
type DJENMeio = "D" | "E";
export type DJENMatchType = "nome" | "oab" | "ambos";

export interface DJENComunicacao {
  id: number;
  data_disponibilizacao: string;
  siglaTribunal: string;
  tipoComunicacao: string;
  nomeOrgao: string;
  texto: string;
  numero_processo: string;
  meio: string;
  link: string;
  tipoDocumento: string;
  nomeClasse: string;
  codigoClasse: string;
  numeroComunicacao: number;
  ativo: boolean;
  hash: string;
  datadisponibilizacao: string;
  meiocompleto: string;
  numeroprocessocommascara: string;
  destinatarios: Array<{
    nome: string;
    polo: string;
    comunicacao_id: number;
  }>;
  destinatarioadvogados: Array<{
    id: number;
    comunicacao_id: number;
    advogado_id: number;
    created_at: string;
    updated_at: string;
    advogado: {
      id: number;
      nome: string;
      numero_oab: string;
      uf_oab: string;
    };
  }>;
}

export interface DJENResponse {
  status: string;
  message: string;
  count: number;
  items: DJENComunicacao[];
}

export interface DJENFilteredResult {
  id: number;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso: string;
  orgao: string;
  meio: string;
  link: string;
  hash: string;
  matchType: DJENMatchType;
  advogados: Array<{
    nome: string;
    numero_oab: string;
    uf_oab: string;
  }>;
}

export interface DJENQueryParams {
  numeroOab?: string;
  ufOab?: string;
  nomeAdvogado?: string;
  siglaTribunal?: string;
  dataDisponibilizacaoInicio?: string;
  dataDisponibilizacaoFim?: string;
  pagina?: number;
  itensPorPagina?: number;
  meio?: "E" | "D";
}

// Constantes
const DJEN_TIMEOUT = 10000; // Reduzido para 10s
const DJEN_DELAY = 500; // Reduzido para 500ms
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Utilitários de texto
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .trim();
}

// ===== OAB parsing helpers (reduces S3776) =====

function parseOABWithPattern(value: string): { numero?: string; uf?: string } | null {
  const matchOABPattern = /OAB\s{0,5}\/\s{0,5}([A-Z]{2})\s{0,5}(\d+)/i.exec(value);
  if (matchOABPattern) {
    return { numero: matchOABPattern[2], uf: matchOABPattern[1].toUpperCase() };
  }
  return null;
}

function parseOABNumericUF(value: string): { numero?: string; uf?: string } | null {
  // SEGURANÇA: Limitar repetições para evitar ReDoS
  const matchNumericUF = /(\d{1,10})\s{0,2}\/\s{0,2}([A-Z]{2})/i.exec(value);
  if (matchNumericUF) {
    return { numero: matchNumericUF[1], uf: matchNumericUF[2].toUpperCase() };
  }
  return null;
}

function parseOABNumericOnly(value: string): { numero?: string; uf?: string } | null {
  const matchNumeric = /^(\d+)$/.exec(value);
  return matchNumeric ? { numero: matchNumeric[0] } : null;
}

export function parseOAB(numeroOAB: string): { numero?: string; uf?: string } {
  if (!numeroOAB || numeroOAB.length > 50) return {};
  const value = numeroOAB.trim();

  return parseOABWithPattern(value) ?? parseOABNumericUF(value) ?? parseOABNumericOnly(value) ?? {};
}

/**
 * Constrói query string para API DJEN
 */
export function buildDJENQueryString(params: DJENQueryParams): string {
  const queryParts: string[] = [];

  const addParam = (key: string, value: string | number | undefined) => {
    if (value !== undefined) {
      queryParts.push(`${key}=${encodeURIComponent(String(value))}`);
    }
  };

  addParam("numeroOab", params.numeroOab);
  addParam("ufOab", params.ufOab);
  addParam("nomeAdvogado", params.nomeAdvogado);
  addParam("dataDisponibilizacaoInicio", params.dataDisponibilizacaoInicio);
  addParam("dataDisponibilizacaoFim", params.dataDisponibilizacaoFim);
  addParam("siglaTribunal", params.siglaTribunal);
  addParam("pagina", params.pagina);
  addParam("itensPorPagina", params.itensPorPagina);
  addParam("meio", params.meio);

  return queryParts.join("&");
}

// ===== consultarComunicacoes helpers (reduces S3776) =====

interface RateLimitInfo {
  limit?: number;
  remaining?: number;
}

interface ConsultaResult {
  response: DJENResponse | null;
  rateLimitInfo: RateLimitInfo;
  retryAfter?: number;
}

function extractRateLimitInfo(response: Response): RateLimitInfo {
  const limit = response.headers.get("x-ratelimit-limit");
  const remaining = response.headers.get("x-ratelimit-remaining");
  return {
    limit: limit ? Number.parseInt(limit, 10) : undefined,
    remaining: remaining ? Number.parseInt(remaining, 10) : undefined,
  };
}

function handleRateLimit(response: Response, retryCount: number): ConsultaResult {
  const retryAfterHeader = response.headers.get("retry-after");
  const retryAfter = retryAfterHeader
    ? Number.parseInt(retryAfterHeader, 10)
    : RETRY_DELAY * Math.pow(2, retryCount);

  logger.warn("Rate limit DJEN atingido", { retryAfter, retryCount });

  return {
    response: null,
    rateLimitInfo: extractRateLimitInfo(response),
    retryAfter,
  };
}

async function handleRetry(
  params: DJENQueryParams,
  retryCount: number,
  errorType: "timeout" | "error",
  error?: unknown
): Promise<ConsultaResult> {
  if (errorType === "timeout") {
    logger.error("Timeout na consulta DJEN", { retryCount });
  } else {
    logger.error("Erro na consulta DJEN", error, { retryCount });
  }

  if (retryCount >= MAX_RETRIES) {
    return { response: null, rateLimitInfo: {} };
  }

  const delay = RETRY_DELAY * Math.pow(2, retryCount);
  logger.info(`Tentando novamente em ${delay}ms`, { retryCount: retryCount + 1 });

  await new Promise((resolve) => setTimeout(resolve, delay));
  return consultarComunicacoes(params, retryCount + 1);
}

/**
 * Executa consulta à API DJEN com retry e circuit breaker
 * Refactored to reduce cognitive complexity (S3776)
 */
export async function consultarComunicacoes(
  params: DJENQueryParams,
  retryCount: number = 0
): Promise<ConsultaResult> {
  const queryString = buildDJENQueryString(params);
  const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryString}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DJEN_TIMEOUT);

  try {
    logger.debug("Consultando DJEN", { url: url.replaceAll(/numeroOab=[^&]*/g, "numeroOab=***") });

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      return handleRateLimit(response, retryCount);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as DJENResponse;
    logger.debug("Consulta DJEN bem-sucedida", { count: data.count });

    return { response: data, rateLimitInfo: extractRateLimitInfo(response) };
  } catch (error) {
    clearTimeout(timeoutId);
    const errorType = error instanceof Error && error.name === "AbortError" ? "timeout" : "error";
    return handleRetry(params, retryCount, errorType, error);
  }
}

// ===== Helper functions for consultarDJENForLawyer (reduces S3776) =====

interface AdvogadoMatch {
  matchType: DJENMatchType;
  matched: boolean;
}

function checkAdvogadoMatch(
  dest: { advogado: { nome: string; numero_oab: string; uf_oab: string } },
  nomeAdvogado: string | undefined,
  numeroOabNumerico: string | undefined,
  ufOab: string | undefined
): AdvogadoMatch {
  const matchNome = nomeAdvogado
    ? normalizeText(dest.advogado.nome).includes(normalizeText(nomeAdvogado))
    : false;
  const matchOab = numeroOabNumerico
    ? dest.advogado.numero_oab === numeroOabNumerico && dest.advogado.uf_oab === ufOab
    : false;

  let matchType: DJENMatchType = "nome";
  const matched = matchNome || matchOab;
  if (matchNome && matchOab) matchType = "ambos";
  else if (matchOab) matchType = "oab";

  return { matchType, matched };
}

function buildDJENQueryParams(
  tribunal: string,
  queryDataInicio: string,
  queryDataFim: string,
  nomeAdvogado: string | undefined,
  numeroOabNumerico: string | undefined,
  ufOab: string | undefined,
  meio: DJENMeio | undefined
): DJENQueryParams {
  const queryParams: DJENQueryParams = {
    siglaTribunal: tribunal,
    dataDisponibilizacaoInicio: queryDataInicio,
    dataDisponibilizacaoFim: queryDataFim,
    itensPorPagina: 100,
    pagina: 1,
  };

  if (nomeAdvogado) queryParams.nomeAdvogado = nomeAdvogado;
  if (numeroOabNumerico) queryParams.numeroOab = numeroOabNumerico;
  if (ufOab) queryParams.ufOab = ufOab;
  if (meio) queryParams.meio = meio;

  return queryParams;
}

function processComunicacao(
  comunicacao: DJENComunicacao,
  nomeAdvogado: string | undefined,
  numeroOabNumerico: string | undefined,
  ufOab: string | undefined
): DJENFilteredResult | null {
  let matchType: DJENMatchType = "nome";

  const temAdvogado =
    comunicacao.destinatarioadvogados?.some((dest) => {
      const result = checkAdvogadoMatch(dest, nomeAdvogado, numeroOabNumerico, ufOab);
      if (result.matched) {
        matchType = result.matchType;
        return true;
      }
      return false;
    }) || false;

  if (!temAdvogado) return null;

  return {
    id: comunicacao.id,
    tribunal: comunicacao.siglaTribunal,
    data: comunicacao.data_disponibilizacao,
    tipo: comunicacao.tipoComunicacao,
    teor: comunicacao.texto || "Ver documento completo",
    numeroProcesso: comunicacao.numero_processo,
    orgao: comunicacao.nomeOrgao,
    meio: comunicacao.meiocompleto || comunicacao.meio,
    link: comunicacao.link,
    hash: comunicacao.hash,
    matchType,
    advogados:
      comunicacao.destinatarioadvogados?.map((dest) => ({
        nome: dest.advogado.nome,
        numero_oab: dest.advogado.numero_oab,
        uf_oab: dest.advogado.uf_oab,
      })) || [],
  };
}

// ===== Tribunal query helpers (reduces S3776) =====

interface TribunalQueryResult {
  resultados: DJENFilteredResult[];
  error?: string;
  rateLimitHit: boolean;
}

function handleQueryError(retryAfter: number | undefined): {
  error: string;
  rateLimitHit: boolean;
} {
  const errorMsg = retryAfter
    ? `Rate limit - tentar novamente em ${retryAfter}s`
    : "Erro na consulta ou timeout";
  return { error: errorMsg, rateLimitHit: !!retryAfter };
}

function processTribunalResponse(
  response: DJENResponse,
  nomeAdvogado: string | undefined,
  numeroOabNumerico: string | undefined,
  ufOab: string | undefined
): DJENFilteredResult[] {
  const resultados: DJENFilteredResult[] = [];
  for (const comunicacao of response.items) {
    const resultado = processComunicacao(comunicacao, nomeAdvogado, numeroOabNumerico, ufOab);
    if (resultado) resultados.push(resultado);
  }
  return resultados;
}

async function queryTribunal(
  tribunal: string,
  queryDataInicio: string,
  queryDataFim: string,
  nomeAdvogado: string | undefined,
  numeroOabNumerico: string | undefined,
  ufOab: string | undefined,
  meio: "D" | "E" | undefined
): Promise<TribunalQueryResult> {
  const queryParams = buildDJENQueryParams(
    tribunal,
    queryDataInicio,
    queryDataFim,
    nomeAdvogado,
    numeroOabNumerico,
    ufOab,
    meio
  );

  const { response, retryAfter } = await consultarComunicacoes(queryParams);

  if (!response) {
    const { error, rateLimitHit } = handleQueryError(retryAfter);
    return { resultados: [], error, rateLimitHit };
  }

  const resultados = processTribunalResponse(response, nomeAdvogado, numeroOabNumerico, ufOab);
  return { resultados, rateLimitHit: false };
}

/**
 * Consulta comunicações para um advogado específico
 * Refactored to reduce cognitive complexity (S3776)
 */
export async function consultarDJENForLawyer(
  tribunais: string[],
  nomeAdvogado?: string,
  numeroOAB?: string,
  dataInicio?: string,
  dataFim?: string,
  meio?: "D" | "E"
): Promise<{
  resultados: DJENFilteredResult[];
  erros: Array<{ tribunal: string; erro: string }>;
  rateLimitWarning?: boolean;
}> {
  if (!nomeAdvogado && !numeroOAB) {
    throw new Error("É necessário fornecer pelo menos nomeAdvogado ou numeroOAB");
  }

  const defaultDate = new Date().toISOString().split("T")[0];
  const queryDataInicio = dataInicio || defaultDate;
  const queryDataFim = dataFim || queryDataInicio;

  const parsedOAB = numeroOAB ? parseOAB(numeroOAB) : { numero: undefined, uf: undefined };
  const numeroOabNumerico = parsedOAB.numero;
  const ufOab = parsedOAB.uf;

  return await queryAllTribunais(
    tribunais,
    queryDataInicio,
    queryDataFim,
    nomeAdvogado,
    numeroOabNumerico,
    ufOab,
    meio
  );
}

/**
 * Processa resultado de query de tribunal individual
 */
function processQueryResult(
  queryResult: TribunalQueryResult,
  tribunal: string,
  resultados: DJENFilteredResult[],
  erros: Array<{ tribunal: string; erro: string }>
): boolean {
  if (queryResult.error) {
    erros.push({ tribunal, erro: queryResult.error });
    return queryResult.rateLimitHit;
  }
  resultados.push(...queryResult.resultados);
  return false;
}

/**
 * Consulta todos os tribunais com delay entre requisições
 */
async function queryAllTribunais(
  tribunais: string[],
  queryDataInicio: string,
  queryDataFim: string,
  nomeAdvogado: string | undefined,
  numeroOabNumerico: string | undefined,
  ufOab: string | undefined,
  meio: "D" | "E" | undefined
): Promise<{
  resultados: DJENFilteredResult[];
  erros: Array<{ tribunal: string; erro: string }>;
  rateLimitWarning?: boolean;
}> {
  const resultados: DJENFilteredResult[] = [];
  const erros: Array<{ tribunal: string; erro: string }> = [];
  let rateLimitWarning = false;

  for (let i = 0; i < tribunais.length; i++) {
    const tribunal = tribunais[i];
    try {
      const queryResult = await queryTribunal(
        tribunal,
        queryDataInicio,
        queryDataFim,
        nomeAdvogado,
        numeroOabNumerico,
        ufOab,
        meio
      );

      const hitRateLimit = processQueryResult(queryResult, tribunal, resultados, erros);
      if (hitRateLimit) rateLimitWarning = true;

      // Delay entre tribunais
      if (i < tribunais.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, DJEN_DELAY));
      }
    } catch (error) {
      erros.push({
        tribunal,
        erro: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  return { resultados, erros, rateLimitWarning: rateLimitWarning || undefined };
}

/**
 * Download de caderno completo do DJEN (arquivo compactado)
 * Endpoint: GET /api/v1/caderno/{sigla_tribunal}/{data}/{meio}
 *
 * ATENÇÃO: Este endpoint retorna metadados e URL temporária (5 minutos) para download
 * Os cadernos do dia atual são disponibilizados a partir das 02:00
 *
 * @param siglaTribunal - Sigla do tribunal (ex: 'TJMG', 'TRT3')
 * @param data - Data no formato AAAA-MM-DD
 * @param meio - 'E' para Edital, 'D' para Diário Eletrônico
 */
export async function downloadCadernoDJEN(
  siglaTribunal: string,
  data: string,
  meio: "E" | "D" = "D"
): Promise<{
  tribunal: string;
  sigla_tribunal: string;
  meio: string;
  status: string;
  versao: string;
  data: string;
  total_comunicacoes: number;
  numero_paginas: number;
  hash: string;
  url: string; // URL temporária válida por 5 minutos
} | null> {
  const url = `https://comunicaapi.pje.jus.br/api/v1/caderno/${siglaTribunal}/${data}/${meio}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[DJEN] Erro ao baixar caderno: HTTP ${response.status}`);
      return null;
    }

    const caderno = await response.json();
    console.log(
      `[DJEN] Caderno disponível: ${caderno.total_comunicacoes} comunicações, ${caderno.numero_paginas} páginas`
    );

    return caderno;
  } catch (error) {
    console.error(`[DJEN] Erro ao baixar caderno:`, error);
    return null;
  }
}
