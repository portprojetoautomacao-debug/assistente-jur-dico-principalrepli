/**
 * DataJud API Client for Serverless Functions
 *
 * API Pública DataJud - CNJ (Base Nacional de Dados do Poder Judiciário)
 * Endpoint: https://api-publica.datajud.cnj.jus.br/{alias}/_search
 *
 * IMPORTANTE: Esta é a API DataJud (metadados processuais), diferente da API DJEN (publicações)
 */

export interface DataJudProcess {
  numeroProcesso: string;
  tribunal: string;
  dataAjuizamento: string;
  classe?: {
    codigo: string;
    nome: string;
  };
  orgaoJulgador?: {
    codigo: string;
    nome: string;
  };
  partes?: Array<{
    nome: string;
    tipo: string;
    polo: string;
  }>;
  advogados?: Array<{
    nome: string;
    numeroOAB: string;
    tipo: string;
  }>;
  assuntos?: Array<{
    codigo: string;
    nome: string;
  }>;
  movimentos?: Array<{
    data: string;
    nome: string;
  }>;
}

interface DataJudQueryParams {
  tribunal: string;
  dataInicio: string;
  dataFim: string;
  nomeAdvogado?: string;
  numeroOAB?: string;
  ufOAB?: string;
}

// Mapeamento de tribunais para endpoints DataJud API
const DATAJUD_ENDPOINTS: Record<string, string> = {
  TJMG: "api_publica_tjmg",
  TRT3: "api_publica_trt3",
  TST: "api_publica_tst",
  STJ: "api_publica_stj",
  TRF1: "api_publica_trf1",
  TJES: "api_publica_tjes",
  TJSP: "api_publica_tjsp",
};

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_DELAY = 1000;

/**
 * Consulta processos no DataJud (metadados processuais)
 * API Pública DataJud - CNJ
 *
 * Endpoint: POST https://api-publica.datajud.cnj.jus.br/{alias}/_search
 *
 * IMPORTANTE:
 * - Requer API Key pública: Authorization: APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==
 * - Formato de query: Elasticsearch DSL
 * - Retorna metadados de processos (não publicações do diário)
 */
async function consultarProcessosDataJud(
  params: DataJudQueryParams,
  timeout: number = DEFAULT_TIMEOUT
): Promise<DataJudProcess[]> {
  const endpoint = DATAJUD_ENDPOINTS[params.tribunal];

  if (!endpoint) {
    console.warn(`[DataJud] Tribunal ${params.tribunal} não configurado`);
    return [];
  }

  // API Key pública do DataJud (CNJ)
  const apiKey =
    process.env.DATAJUD_API_KEY || "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

  // Tipos para query Elasticsearch
  interface ElasticsearchQuery {
    match?: Record<string, string>;
    bool?: {
      must: ElasticsearchQuery[];
    };
  }

  // Construir query Elasticsearch
  const query = {
    query: {
      bool: {
        must: [] as ElasticsearchQuery[],
        filter: [
          {
            range: {
              dataAjuizamento: {
                gte: params.dataInicio,
                lte: params.dataFim,
              },
            },
          },
        ],
      },
    },
    size: 100,
    _source: [
      "numeroProcesso",
      "dataAjuizamento",
      "classe",
      "orgaoJulgador",
      "partes",
      "advogados",
      "assuntos",
      "movimentos",
    ],
  };

  // Adicionar filtros por advogado/OAB
  if (params.nomeAdvogado) {
    query.query.bool.must.push({
      match: {
        "advogados.nome": params.nomeAdvogado,
      },
    });
  }

  if (params.numeroOAB && params.ufOAB) {
    query.query.bool.must.push({
      match: {
        "advogados.numeroOAB": `${params.numeroOAB}/${params.ufOAB}`,
      },
    });
  }

  const url = `https://api-publica.datajud.cnj.jus.br/${endpoint}/_search`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `APIKey ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(query),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // DataJud retorna formato Elasticsearch
    const hits = data.hits?.hits || [];

    return hits.map((hit: { _source?: Record<string, unknown> }) => ({
      numeroProcesso: hit._source?.numeroProcesso || "",
      tribunal: params.tribunal,
      dataAjuizamento: hit._source?.dataAjuizamento || "",
      classe: hit._source?.classe,
      orgaoJulgador: hit._source?.orgaoJulgador,
      partes: hit._source?.partes || [],
      advogados: hit._source?.advogados || [],
      assuntos: hit._source?.assuntos || [],
      movimentos: hit._source?.movimentos || [],
    }));
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[DataJud] Error querying ${params.tribunal}:`, error);
    return [];
  }
}

/**
 * Consulta processos no DataJud para um advogado específico
 */
export async function consultarDataJudForLawyer(
  tribunais: string[],
  nomeAdvogado?: string,
  numeroOAB?: string,
  dataInicio?: string,
  dataFim?: string
): Promise<{
  resultados: DataJudProcess[];
  erros: Array<{ tribunal: string; erro: string }>;
}> {
  if (!nomeAdvogado && !numeroOAB) {
    throw new Error("É necessário fornecer pelo menos um termo de busca");
  }

  const hoje = new Date();
  const defaultDate = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  const queryDataInicio = dataInicio || defaultDate;
  const queryDataFim = dataFim || dataInicio || defaultDate;

  let numeroOABParsed: string | undefined;
  let ufOAB: string | undefined;

  if (numeroOAB) {
    const matchUF = /OAB\/([A-Z]{2})/i.exec(numeroOAB);
    const matchNum = /OAB\/[A-Z]{2}\s*(\d+)/i.exec(numeroOAB);
    ufOAB = matchUF ? matchUF[1].toUpperCase() : undefined;
    numeroOABParsed = matchNum ? matchNum[1] : undefined;
  }

  const resultados: DataJudProcess[] = [];
  const erros: Array<{ tribunal: string; erro: string }> = [];

  for (const tribunal of tribunais) {
    try {
      const processos = await consultarProcessosDataJud(
        {
          tribunal,
          dataInicio: queryDataInicio,
          dataFim: queryDataFim,
          nomeAdvogado,
          numeroOAB: numeroOABParsed,
          ufOAB,
        },
        DEFAULT_TIMEOUT
      );

      resultados.push(...processos);

      // Delay entre requisições
      await new Promise((resolve) => setTimeout(resolve, DEFAULT_DELAY));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      erros.push({ tribunal, erro: errorMessage });
    }
  }

  return { resultados, erros };
}
