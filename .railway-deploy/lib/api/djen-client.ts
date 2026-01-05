/**
 * DJEN API Client for Serverless Functions
 *
 * API do Comunica PJe (DJEN) - Consulta de publicações do Diário de Justiça Eletrônico Nacional
 * Endpoint: https://comunicaapi.pje.jus.br/api/v1/comunicacao
 *
 * Documentação oficial: https://comunicaapi.pje.jus.br/swagger/index.html
 * Versão: 1.0.3 (atualizada em 29/05/2025)
 *
 * IMPORTANTE: Esta é a API do DJEN (publicações oficiais), diferente da API DataJud (metadados processuais)
 *
 * Rate Limiting:
 * - Cabeçalhos de controle: x-ratelimit-limit, x-ratelimit-remaining
 * - Erro 429: aguardar 1 minuto antes de retomar
 * - Uso de múltiplos IPs para contornar limite é considerado abuso
 *
 * Limites de consulta (10000 resultados máximo):
 * - Pesquisas com campos textuais ou OAB
 * - Pesquisas com 5 ou menos itensPorPagina
 * - Pesquisas com dataInicio != dataFim
 * - Pesquisas com numeroProcesso
 */

export interface DJENComunicacao {
  id: number;
  data_disponibilizacao: string;
  siglaTribunal: string;
  tipoComunicacao: string;
  nomeOrgao: string;
  texto: string;
  numero_processo: string;
  meio: string; // "E" para Edital, "D" para Diário Eletrônico
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
  matchType: "nome" | "oab" | "ambos";
  advogados: Array<{
    nome: string;
    numero_oab: string;
    uf_oab: string;
  }>;
}

interface DJENQueryParams {
  numeroOab?: string;
  ufOab?: string;
  nomeAdvogado?: string;
  nomeParte?: string;
  numeroProcesso?: string;
  dataDisponibilizacaoInicio?: string;
  dataDisponibilizacaoFim?: string;
  siglaTribunal?: string;
  numeroComunicacao?: number;
  pagina?: number;
  itensPorPagina?: number; // 5 ou 100
  meio?: "E" | "D"; // E = Edital, D = Diário
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_DELAY = 1000;
const RATE_LIMIT_RETRY_DELAY = 60000; // 1 minuto conforme documentação

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Parse multiple OAB formats: "OAB/UF 123456", "OAB/UF123456", "123456/UF", "123456"
 * Returns { numero, uf } where applicable
 */
function parseOAB(numeroOAB: string): { numero?: string; uf?: string } {
  if (!numeroOAB) return {};
  // Trim and normalize
  const value = numeroOAB.trim();

  // Match patterns like "OAB/UF 123456" or "OAB/UF123456"
  const matchOABPattern = /OAB\s*\/\s*([A-Z]{2})\s*(\d+)/i.exec(value);
  if (matchOABPattern) {
    return { numero: matchOABPattern[2], uf: matchOABPattern[1].toUpperCase() };
  }

  // Match numeric with UF: "123456/UF" or "123456/UF"
  const matchNumericUF = /(\d+)\s*\/\s*([A-Z]{2})/i.exec(value);
  if (matchNumericUF) {
    return { numero: matchNumericUF[1], uf: matchNumericUF[2].toUpperCase() };
  }

  // Match simple numeric OAB
  const matchNumeric = /^(\d+)$/.exec(value);
  if (matchNumeric) {
    return { numero: matchNumeric[1] };
  }

  // Match "OAB/UF" without number
  const matchOABOnly = /OAB\s*\/\s*([A-Z]{2})/i.exec(value);
  if (matchOABOnly) {
    return { uf: matchOABOnly[1].toUpperCase() };
  }

  return {};
}

function buildQueryString(params: DJENQueryParams): string {
  const queryParams: string[] = [];

  if (params.numeroOab) queryParams.push(`numeroOab=${encodeURIComponent(params.numeroOab)}`);
  if (params.ufOab) queryParams.push(`ufOab=${encodeURIComponent(params.ufOab)}`);
  if (params.nomeAdvogado)
    queryParams.push(`nomeAdvogado=${encodeURIComponent(params.nomeAdvogado)}`);
  if (params.nomeParte) queryParams.push(`nomeParte=${encodeURIComponent(params.nomeParte)}`);
  if (params.numeroProcesso)
    queryParams.push(`numeroProcesso=${encodeURIComponent(params.numeroProcesso)}`);
  if (params.dataDisponibilizacaoInicio)
    queryParams.push(`dataDisponibilizacaoInicio=${params.dataDisponibilizacaoInicio}`);
  if (params.dataDisponibilizacaoFim)
    queryParams.push(`dataDisponibilizacaoFim=${params.dataDisponibilizacaoFim}`);
  if (params.siglaTribunal)
    queryParams.push(`siglaTribunal=${encodeURIComponent(params.siglaTribunal)}`);
  if (params.numeroComunicacao) queryParams.push(`numeroComunicacao=${params.numeroComunicacao}`);
  if (params.pagina) queryParams.push(`pagina=${params.pagina}`);
  if (params.itensPorPagina)
    queryParams.push(`itensPorPagina=${params.itensPorPagina}`);
  if (params.meio) queryParams.push(`meio=${params.meio}`);

  return queryParams.join("&");
}

/**
 * Consulta comunicações no DJEN (Diário de Justiça Eletrônico Nacional)
 * API do Comunica PJe - CNJ
 *
 * Endpoint: GET https://comunicaapi.pje.jus.br/api/v1/comunicacao
 *
 * IMPORTANTE:
 * - Não requer autenticação
 * - Requer pelo menos um dos parâmetros: siglaTribunal, texto, nomeParte, nomeAdvogado, numeroOab, numeroProcesso
 * - Ou limitado a 5 itensPorPagina
 * - Respeita rate limiting (x-ratelimit-limit, x-ratelimit-remaining)
 * - Data no formato AAAA-MM-DD
 */
async function consultarComunicacoes(
  params: DJENQueryParams,
  timeout: number = DEFAULT_TIMEOUT
): Promise<{
  response: DJENResponse | null;
  rateLimitInfo: { limit?: number; remaining?: number };
}> {
  const queryString = buildQueryString(params);
  const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryString}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Extrair informações de rate limiting
    const rateLimitInfo = {
      limit: response.headers.get("x-ratelimit-limit")
        ? parseInt(response.headers.get("x-ratelimit-limit")!)
        : undefined,
      remaining: response.headers.get("x-ratelimit-remaining")
        ? parseInt(response.headers.get("x-ratelimit-remaining")!)
        : undefined,
    };

    // Handle rate limiting
    if (response.status === 429) {
      console.warn(
        `[DJEN] Rate limit exceeded. Aguarde 1 minuto antes de nova requisição.`
      );
      return { response: null, rateLimitInfo };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      console.warn(`[DJEN] Resposta não é JSON`);
      return { response: null, rateLimitInfo };
    }

    const data = (await response.json()) as DJENResponse;

    console.log(
      `[DJEN] Consulta retornou ${data.count} comunicações. Rate limit: ${rateLimitInfo.remaining}/${rateLimitInfo.limit}`
    );

    return { response: data, rateLimitInfo };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[DJEN] Error querying comunicacoes:`, error);
    return { response: null, rateLimitInfo: {} };
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ===== Helper functions for consultarDJENForLawyer (reduced CC) =====

interface LawyerQueryContext {
  nomeAdvogado?: string;
  numeroOabNumerico?: string;
  ufOab?: string;
  queryDataInicio: string;
  queryDataFim: string;
  meio?: "D" | "E";
}

function parseOABForQuery(numeroOAB?: string): {
  numero?: string;
  uf?: string;
} {
  if (!numeroOAB) return {};
  const parsed = parseOAB(numeroOAB);
  return { numero: parsed.numero, uf: parsed.uf };
}

function buildDJENQueryParams(
  tribunal: string,
  ctx: LawyerQueryContext
): DJENQueryParams {
  const params: DJENQueryParams = {
    siglaTribunal: tribunal,
    dataDisponibilizacaoInicio: ctx.queryDataInicio,
    dataDisponibilizacaoFim: ctx.queryDataFim,
    itensPorPagina: 100,
    pagina: 1,
  };
  if (ctx.nomeAdvogado) params.nomeAdvogado = ctx.nomeAdvogado;
  if (ctx.numeroOabNumerico) params.numeroOab = ctx.numeroOabNumerico;
  if (ctx.ufOab) params.ufOab = ctx.ufOab;
  if (ctx.meio) params.meio = ctx.meio;
  return params;
}

function determineAdvogadoMatch(
  dest: { advogado: { nome: string; numero_oab: string; uf_oab: string } },
  ctx: LawyerQueryContext
): "nome" | "oab" | "ambos" | null {
  const matchNome = ctx.nomeAdvogado
    ? normalizeText(dest.advogado.nome).includes(
        normalizeText(ctx.nomeAdvogado)
      )
    : false;
  const matchOab = ctx.numeroOabNumerico
    ? dest.advogado.numero_oab === ctx.numeroOabNumerico &&
      dest.advogado.uf_oab === ctx.ufOab
    : false;

  if (matchNome && matchOab) return "ambos";
  if (matchOab) return "oab";
  if (matchNome) return "nome";
  return null;
}

function findAdvogadoInComunicacao(
  comunicacao: DJENComunicacao,
  ctx: LawyerQueryContext
): { found: boolean; matchType: "nome" | "oab" | "ambos" } {
  let matchType: "nome" | "oab" | "ambos" = "nome";
  const found = comunicacao.destinatarioadvogados.some((dest) => {
    const type = determineAdvogadoMatch(dest, ctx);
    if (type) {
      matchType = type;
      return true;
    }
    return false;
  });
  return { found, matchType };
}

function mapComunicacaoToResult(
  comunicacao: DJENComunicacao,
  matchType: "nome" | "oab" | "ambos"
): DJENFilteredResult {
  return {
    id: comunicacao.id,
    tribunal: comunicacao.siglaTribunal,
    data: comunicacao.data_disponibilizacao,
    tipo: comunicacao.tipoComunicacao,
    teor: comunicacao.texto,
    numeroProcesso: comunicacao.numero_processo,
    orgao: comunicacao.nomeOrgao,
    meio: comunicacao.meiocompleto || comunicacao.meio,
    link: comunicacao.link,
    hash: comunicacao.hash,
    matchType,
    advogados: comunicacao.destinatarioadvogados.map((dest) => ({
      nome: dest.advogado.nome,
      numero_oab: dest.advogado.numero_oab,
      uf_oab: dest.advogado.uf_oab,
    })),
  };
}

async function processTribunalQuery(
  tribunal: string,
  ctx: LawyerQueryContext,
  resultados: DJENFilteredResult[],
  erros: Array<{ tribunal: string; erro: string }>
): Promise<boolean> {
  console.log(
    `[DJEN] Consultando ${tribunal} para ${
      ctx.nomeAdvogado || ctx.numeroOabNumerico
    }`
  );

  const queryParams = buildDJENQueryParams(tribunal, ctx);
  const { response, rateLimitInfo } = await consultarComunicacoes(
    queryParams,
    DEFAULT_TIMEOUT
  );

  if (!response) {
    console.warn(`[DJEN] Rate limit atingido ou erro na consulta de ${tribunal}`);
    erros.push({
      tribunal,
      erro: "Rate limit excedido. Aguarde 1 minuto antes de nova tentativa.",
    });
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_DELAY));
    return true;
  }

  for (const comunicacao of response.items) {
    const { found, matchType } = findAdvogadoInComunicacao(comunicacao, ctx);
    if (found) {
      resultados.push(mapComunicacaoToResult(comunicacao, matchType));
    }
  }

  if (rateLimitInfo.remaining !== undefined && rateLimitInfo.remaining < 10) {
    console.warn(
      `[DJEN] Rate limit baixo: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} requisições restantes`
    );
  }

  return false;
}

// ===== Main refactored function =====

/**
 * Consulta comunicações DJEN para um advogado específico
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

  const defaultDate = formatDate(new Date());
  const oabInfo = parseOABForQuery(numeroOAB);

  const ctx: LawyerQueryContext = {
    nomeAdvogado,
    numeroOabNumerico: oabInfo.numero,
    ufOab: oabInfo.uf,
    queryDataInicio: dataInicio || defaultDate,
    queryDataFim: dataFim || dataInicio || defaultDate,
    meio,
  };

  const resultados: DJENFilteredResult[] = [];
  const erros: Array<{ tribunal: string; erro: string }> = [];
  let rateLimitWarning = false;

  for (let i = 0; i < tribunais.length; i++) {
    try {
      const hitRateLimit = await processTribunalQuery(
        tribunais[i],
        ctx,
        resultados,
        erros
      );
      rateLimitWarning = rateLimitWarning || hitRateLimit;

      if (i < tribunais.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, DEFAULT_DELAY));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      erros.push({ tribunal: tribunais[i], erro: errorMessage });
      console.error(`[DJEN] Erro consultando ${tribunais[i]}:`, errorMessage);
    }
  }

  console.log(
    `[DJEN] Consulta finalizada: ${resultados.length} comunicações encontradas em ${tribunais.length} tribunais`
  );

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
