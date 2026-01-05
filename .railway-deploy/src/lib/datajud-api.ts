/**
 * DataJud API Integration
 *
 * API Pública do CNJ para consulta de processos judiciais
 * Documentação: https://www.cnj.jus.br/sistemas/datajud/api-publica/
 * Base URL: https://api-publica.datajud.cnj.jus.br/
 *
 * Requer autenticação via API Key (cadastro obrigatório no site do DataJud)
 *
 * IMPORTANTE:
 * - Consultas automáticas recomendadas: DIÁRIAS (cron 1x/dia por tribunal ou carteira)
 * - Este módulo foi pensado para:
 *    a) consulta pontual por número CNJ
 *    b) varredura diária de atualizações recentes (consultarAtualizacoesRecentesDatajud)
 */

export interface DatajudMovimento {
  codigo: number;
  nome: string;
  dataHora: string;
  complementosTabelados?: Array<{
    nome: string;
    valor?: string;
    codigo?: number;
  }>;
}

export interface DatajudProcesso {
  numeroProcesso: string;
  classe?: {
    codigo: number;
    nome: string;
  };
  sistema?: {
    codigo: number;
    nome: string;
  };
  formato?: {
    codigo: number;
    nome: string;
  };
  tribunal: string;
  grau?: string;
  orgaoJulgador?: {
    codigo?: number;
    nome: string;
  };
  assuntos?: Array<{
    codigo: number;
    nome: string;
  }>;
  dataAjuizamento?: string;
  dataHoraUltimaAtualizacao?: string;
  movimentos: DatajudMovimento[];
  nivelSigilo?: number;
}

export interface DatajudQueryParams {
  numeroProcesso: string;
  tribunal: string;
}

export interface DatajudConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

export interface TribunalInfo {
  alias: string;
  nome: string;
  codigo: string;
}

/**
 * Mapeamento de tribunais para aliases da API DataJud
 * Referência: https://api-publica.datajud.cnj.jus.br/api_publica
 */
export const TRIBUNAIS_DATAJUD: Record<string, TribunalInfo> = {
  tjsp: {
    alias: "api_publica_tjsp",
    nome: "Tribunal de Justiça de São Paulo",
    codigo: "8.26",
  },
  tjrj: {
    alias: "api_publica_tjrj",
    nome: "Tribunal de Justiça do Rio de Janeiro",
    codigo: "8.19",
  },
  tjmg: {
    alias: "api_publica_tjmg",
    nome: "Tribunal de Justiça de Minas Gerais",
    codigo: "8.13",
  },
  tjrs: {
    alias: "api_publica_tjrs",
    nome: "Tribunal de Justiça do Rio Grande do Sul",
    codigo: "8.21",
  },
  tjpr: {
    alias: "api_publica_tjpr",
    nome: "Tribunal de Justiça do Paraná",
    codigo: "8.16",
  },
  tjsc: {
    alias: "api_publica_tjsc",
    nome: "Tribunal de Justiça de Santa Catarina",
    codigo: "8.24",
  },
  trf1: {
    alias: "api_publica_trf1",
    nome: "Tribunal Regional Federal da 1ª Região",
    codigo: "4.01",
  },
  trf2: {
    alias: "api_publica_trf2",
    nome: "Tribunal Regional Federal da 2ª Região",
    codigo: "4.02",
  },
  trf3: {
    alias: "api_publica_trf3",
    nome: "Tribunal Regional Federal da 3ª Região",
    codigo: "4.03",
  },
  trf4: {
    alias: "api_publica_trf4",
    nome: "Tribunal Regional Federal da 4ª Região",
    codigo: "4.04",
  },
  trt2: {
    alias: "api_publica_trt2",
    nome: "Tribunal Regional do Trabalho da 2ª Região",
    codigo: "5.02",
  },
  tst: {
    alias: "api_publica_tst",
    nome: "Tribunal Superior do Trabalho",
    codigo: "TST",
  },
  stj: {
    alias: "api_publica_stj",
    nome: "Superior Tribunal de Justiça",
    codigo: "STJ",
  },
  stf: {
    alias: "api_publica_stf",
    nome: "Supremo Tribunal Federal",
    codigo: "STF",
  },
};

const DEFAULT_BASE_URL = "https://api-publica.datajud.cnj.jus.br";
const DEFAULT_TIMEOUT = 30000;

export class DatajudAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public tribunal?: string,
    public numeroProcesso?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "DatajudAPIError";
  }
}

/**
 * Obtém a API Key do DataJud da configuração
 * A API Key deve ser configurada no arquivo .env como VITE_DATAJUD_API_KEY
 */
function getApiKey(configApiKey?: string): string | null {
  const apiKey = configApiKey || import.meta.env.VITE_DATAJUD_API_KEY;

  if (!apiKey || apiKey === "your-datajud-api-key-here") {
    return null;
  }

  return apiKey;
}

/**
 * Valida o formato do número CNJ de processo
 * Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
 */
export function validarNumeroCNJ(numero: string): boolean {
  const numeroLimpo = numero.replaceAll(/[^\d.-]/g, "");

  const regex = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;

  return regex.test(numeroLimpo);
}

/**
 * Extrai o código do tribunal do número CNJ
 * Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
 * Onde J.TR identifica o segmento e tribunal
 */
export function extrairTribunalDoCNJ(numeroCNJ: string): string | null {
  if (!validarNumeroCNJ(numeroCNJ)) {
    return null;
  }

  const partes = numeroCNJ.split(".");
  if (partes.length < 4) {
    return null;
  }

  const segmento = partes[2]; // J
  const tribunal = partes[3]; // TR

  return `${segmento}.${tribunal}`;
}

/**
 * Determina o alias do tribunal baseado no código ou nome
 */
export function determinarAliasTribunal(tribunalInput: string): string | null {
  const tribunalLower = tribunalInput.toLowerCase().trim();

  // Verifica se é uma chave direta
  if (TRIBUNAIS_DATAJUD[tribunalLower]) {
    return TRIBUNAIS_DATAJUD[tribunalLower].alias;
  }

  // Procura pelo código do tribunal ou parte do nome
  for (const [, info] of Object.entries(TRIBUNAIS_DATAJUD)) {
    if (info.codigo === tribunalInput || info.nome.toLowerCase().includes(tribunalLower)) {
      return info.alias;
    }
  }

  return null;
}

// ===== Helper functions for consultarProcessoDatajud (reduced CC) =====

function validateDatajudParams(
  numeroProcesso: string,
  tribunal: string,
  configApiKey?: string
): { apiKey: string; tribunalAlias: string } {
  if (!validarNumeroCNJ(numeroProcesso)) {
    throw new DatajudAPIError(
      "Número de processo CNJ inválido. Use o formato: NNNNNNN-DD.AAAA.J.TR.OOOO",
      400,
      tribunal,
      numeroProcesso
    );
  }

  const apiKey = getApiKey(configApiKey);
  if (!apiKey) {
    throw new DatajudAPIError(
      "API Key do DataJud não configurada. Configure VITE_DATAJUD_API_KEY no arquivo .env",
      401,
      tribunal,
      numeroProcesso
    );
  }

  const tribunalAlias = determinarAliasTribunal(tribunal);
  if (!tribunalAlias) {
    throw new DatajudAPIError(
      `Tribunal não suportado ou não reconhecido: ${tribunal}`,
      400,
      tribunal,
      numeroProcesso
    );
  }

  return { apiKey, tribunalAlias };
}

function handleDatajudResponseError(
  response: Response,
  tribunal: string,
  numeroProcesso: string
): never {
  if (response.status === 401 || response.status === 403) {
    throw new DatajudAPIError(
      "API Key inválida ou sem permissão. Verifique suas credenciais no site do DataJud",
      response.status,
      tribunal,
      numeroProcesso
    );
  }

  if (response.status === 404) {
    throw new DatajudAPIError(
      "Processo não encontrado no tribunal especificado",
      response.status,
      tribunal,
      numeroProcesso
    );
  }

  throw new DatajudAPIError(
    `Erro HTTP ${response.status}: ${response.statusText}`,
    response.status,
    tribunal,
    numeroProcesso
  );
}

function handleDatajudCatchError(
  error: unknown,
  timeout: number,
  tribunal: string,
  numeroProcesso: string
): never {
  if (error instanceof DatajudAPIError) {
    throw error;
  }

  if (error instanceof Error && error.name === "AbortError") {
    throw new DatajudAPIError(
      `Timeout após ${timeout}ms aguardando resposta do DataJud`,
      408,
      tribunal,
      numeroProcesso
    );
  }

  if (error instanceof Error) {
    throw new DatajudAPIError(`Erro de rede: ${error.message}`, 0, tribunal, numeroProcesso, error);
  }

  throw new DatajudAPIError(
    "Erro desconhecido ao consultar DataJud",
    0,
    tribunal,
    numeroProcesso,
    error
  );
}

function sortMovimentosByDate(processo: DatajudProcesso): void {
  if (processo.movimentos && Array.isArray(processo.movimentos)) {
    processo.movimentos.sort((a, b) => {
      const dateA = new Date(a.dataHora).getTime();
      const dateB = new Date(b.dataHora).getTime();
      return dateB - dateA;
    });
  }
}

// ===== Main refactored function =====

/**
 * Consulta um processo no DataJud pelo número CNJ
 * Uso principal: consulta pontual (ex.: ao abrir o processo no painel)
 */
export async function consultarProcessoDatajud(
  params: DatajudQueryParams,
  config?: DatajudConfig
): Promise<DatajudProcesso> {
  const { numeroProcesso, tribunal } = params;
  const {
    apiKey: configApiKey,
    baseUrl = DEFAULT_BASE_URL,
    timeout = DEFAULT_TIMEOUT,
  } = config || {};

  const { apiKey, tribunalAlias } = validateDatajudParams(numeroProcesso, tribunal, configApiKey);

  const numeroProcessoLimpo = numeroProcesso.replaceAll(/[^\d]/g, "");
  const url = `${baseUrl}/${tribunalAlias}/_search`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const body = {
      query: { match: { numeroProcesso: numeroProcessoLimpo } },
      size: 1,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `APIKey ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      handleDatajudResponseError(response, tribunal, numeroProcesso);
    }

    const data = await response.json();

    if (!data.hits?.hits?.length) {
      throw new DatajudAPIError("Processo não encontrado", 404, tribunal, numeroProcesso);
    }

    const processo = data.hits.hits[0]._source as DatajudProcesso;
    sortMovimentosByDate(processo);

    return processo;
  } catch (error) {
    clearTimeout(timeoutId);
    handleDatajudCatchError(error, timeout, tribunal, numeroProcesso);
  }
}

/**
 * Configuração para varredura diária automática
 * - Pensado para rodar 1x/dia por tribunal (cron)
 */
export interface DatajudDailyScanParams {
  tribunal: string; // ex: 'tjmg', 'tjsp', 'trf1' (aceita alias, código ou parte do nome)
  dias?: number; // quantos dias para trás (default: 1 → DIÁRIO)
  maxResultados?: number; // limite de processos retornados (default: 100)
}

/**
 * Varre o DataJud em busca de processos ATUALIZADOS recentemente
 * - Uso típico: job DIÁRIO / AUTOMÁTICO → monitoramento 24/7
 * - Filtra por dataHoraUltimaAtualizacao em um range (últimos N dias)
 *
 * Estratégia sugerida:
 * - Rodar 1x/dia por tribunal de interesse
 * - Relacionar resultados com sua carteira via número CNJ (join com sua base)
 */
export async function consultarAtualizacoesRecentesDatajud(
  params: DatajudDailyScanParams,
  config?: DatajudConfig
): Promise<DatajudProcesso[]> {
  const { tribunal, dias = 1, maxResultados = 100 } = params;

  const {
    apiKey: configApiKey,
    baseUrl = DEFAULT_BASE_URL,
    timeout = DEFAULT_TIMEOUT,
  } = config || {};

  const apiKey = getApiKey(configApiKey);
  if (!apiKey) {
    throw new DatajudAPIError(
      "API Key do DataJud não configurada. Configure VITE_DATAJUD_API_KEY no arquivo .env",
      401,
      tribunal
    );
  }

  const tribunalAlias = determinarAliasTribunal(tribunal);
  if (!tribunalAlias) {
    throw new DatajudAPIError(
      `Tribunal não suportado ou não reconhecido: ${tribunal}`,
      400,
      tribunal
    );
  }

  // Calcula intervalo (últimos N dias)
  const agora = new Date();
  const fim = agora.toISOString();
  const inicioDate = new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000);
  const inicio = inicioDate.toISOString();

  const url = `${baseUrl}/${tribunalAlias}/_search`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const body = {
      size: maxResultados,
      sort: [
        {
          dataHoraUltimaAtualizacao: {
            order: "desc",
          },
        },
      ],
      query: {
        range: {
          dataHoraUltimaAtualizacao: {
            gte: inicio,
            lte: fim,
          },
        },
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `APIKey ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new DatajudAPIError(
          "API Key inválida ou sem permissão. Verifique suas credenciais no site do DataJud",
          response.status,
          tribunal
        );
      }

      throw new DatajudAPIError(
        `Erro HTTP ${response.status}: ${response.statusText}`,
        response.status,
        tribunal
      );
    }

    const data = await response.json();

    if (!data.hits?.hits?.length) {
      // Para varredura diária, não tratar como erro: apenas "nada novo"
      return [];
    }

    const processos: DatajudProcesso[] = data.hits.hits.map((hit: { _source: DatajudProcesso }) => {
      const proc = hit._source;

      if (proc.movimentos && Array.isArray(proc.movimentos)) {
        proc.movimentos.sort((a, b) => {
          const dateA = new Date(a.dataHora).getTime();
          const dateB = new Date(b.dataHora).getTime();
          return dateB - dateA;
        });
      }

      return proc;
    });

    return processos;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof DatajudAPIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new DatajudAPIError(
          `Timeout após ${timeout}ms aguardando resposta do DataJud (varredura diária)`,
          408,
          tribunal
        );
      }

      throw new DatajudAPIError(
        `Erro de rede na varredura diária: ${error.message}`,
        0,
        tribunal,
        undefined,
        error
      );
    }

    throw new DatajudAPIError(
      "Erro desconhecido na varredura diária do DataJud",
      0,
      tribunal,
      undefined,
      error
    );
  }
}

/**
 * Retorna a lista de tribunais disponíveis
 */
export function getTribunaisDisponiveis(): Array<{
  value: string;
  label: string;
}> {
  return Object.entries(TRIBUNAIS_DATAJUD).map(([key, info]) => ({
    value: key,
    label: info.nome,
  }));
}

/**
 * Verifica se a API Key está configurada
 */
export function isApiKeyConfigured(): boolean {
  return getApiKey() !== null;
}

/**
 * Formata o número CNJ para exibição
 */
export function formatarNumeroCNJ(numero: string): string {
  const digitos = numero.replaceAll(/\D/g, "");

  if (digitos.length === 20) {
    return `${digitos.slice(0, 7)}-${digitos.slice(7, 9)}.${digitos.slice(
      9,
      13
    )}.${digitos.slice(13, 14)}.${digitos.slice(14, 16)}.${digitos.slice(16, 20)}`;
  }

  return numero;
}
