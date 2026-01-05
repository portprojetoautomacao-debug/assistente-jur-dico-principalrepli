/**
 * DJEN Browser Capture Service
 *
 * Captura publicações DJEN diretamente do navegador do usuário.
 * Resolve problema de geobloqueio quando o backend está fora do Brasil.
 *
 * A API do DJEN (https://comunicaapi.pje.jus.br) só aceita requisições
 * originárias do Brasil. Quando o servidor está fora do Brasil,
 * usamos o navegador do usuário como intermediário.
 *
 * ARQUITETURA:
 * Frontend (Brasil) → API DJEN (Brasil) → Retorna dados ao frontend
 */

const DJEN_API_URL = "https://comunicaapi.pje.jus.br/api/v1/comunicacao";

export interface DJENPublicacao {
  id: string;
  siglaTribunal: string;
  tipoComunicacao: string;
  nomeOrgao: string;
  numeroProcesso: string;
  dataDisponibilizacao: string;
  dataPublicacao: string;
  texto: string;
  meio: string;
  link?: string;
  advogados: Array<{
    nome: string;
    numeroOAB: string;
    ufOAB: string;
  }>;
  destinatarios: Array<{
    nome: string;
    polo: string;
  }>;
}

export interface DJENApiResponse {
  status: string;
  message: string;
  count: number;
  items: DJENPublicacao[];
}

export interface CaptureResult {
  success: boolean;
  publicacoes: DJENPublicacao[];
  count: number;
  error?: string;
  isGeoBlocked?: boolean;
}

export interface DJENSearchParams {
  numeroOab?: string;
  ufOab?: string;
  dataInicio?: string;
  dataFim?: string;
  siglaTribunal?: string;
  meio?: "D" | "E";
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isGeoBlockedError(status: number): boolean {
  return status === 403 || status === 451;
}

/**
 * Busca publicações DJEN diretamente da API oficial via navegador.
 *
 * @param params - Parâmetros de busca
 * @returns Resultado da captura com publicações encontradas
 */
export async function buscarDJENNoBrowser(params: DJENSearchParams): Promise<CaptureResult> {
  try {
    const queryParams = new URLSearchParams();

    queryParams.append("meio", params.meio || "D");

    if (params.numeroOab) {
      queryParams.append("numeroOab", params.numeroOab);
    }

    if (params.ufOab) {
      queryParams.append("ufOab", params.ufOab.toUpperCase());
    }

    if (params.siglaTribunal) {
      queryParams.append("siglaTribunal", params.siglaTribunal);
    }

    const dataInicio = params.dataInicio || formatDate(new Date());
    queryParams.append("dataDisponibilizacaoInicio", dataInicio);
    queryParams.append("dataDisponibilizacaoFim", params.dataFim || dataInicio);

    const url = `${DJEN_API_URL}?${queryParams.toString()}`;

    console.log("[DJEN Browser] Buscando publicações:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });

    if (!response.ok) {
      if (isGeoBlockedError(response.status)) {
        console.warn("[DJEN Browser] API bloqueada geograficamente (403/451)");
        return {
          success: false,
          publicacoes: [],
          count: 0,
          error:
            "API DJEN bloqueada. A API só aceita requisições do Brasil. " +
            "Verifique sua conexão ou use uma VPN brasileira.",
          isGeoBlocked: true,
        };
      }

      throw new Error(`API retornou ${response.status}: ${response.statusText}`);
    }

    const data: DJENApiResponse = await response.json();
    const publicacoes = data.items || [];

    console.log(`[DJEN Browser] Capturadas ${publicacoes.length} publicações`);

    return {
      success: true,
      publicacoes,
      count: data.count || publicacoes.length,
    };
  } catch (error) {
    console.error("[DJEN Browser] Erro ao capturar:", error);

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

    const isNetworkError =
      errorMessage.includes("Failed to fetch") ||
      errorMessage.includes("NetworkError") ||
      errorMessage.includes("CORS");

    return {
      success: false,
      publicacoes: [],
      count: 0,
      error: isNetworkError
        ? "Erro de rede ao acessar API DJEN. Possível bloqueio geográfico ou CORS."
        : errorMessage,
      isGeoBlocked: isNetworkError,
    };
  }
}

/**
 * Busca publicações para múltiplos advogados.
 */
export async function buscarMultiplosAdvogados(
  advogados: Array<{ numeroOab: string; ufOab: string }>
): Promise<Map<string, CaptureResult>> {
  const resultados = new Map<string, CaptureResult>();

  for (const adv of advogados) {
    const chave = `${adv.numeroOab}/${adv.ufOab}`;

    try {
      const resultado = await buscarDJENNoBrowser({
        numeroOab: adv.numeroOab,
        ufOab: adv.ufOab,
      });
      resultados.set(chave, resultado);

      if (advogados.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch {
      resultados.set(chave, {
        success: false,
        publicacoes: [],
        count: 0,
        error: "Erro ao buscar publicações",
      });
    }
  }

  return resultados;
}

/**
 * Converte publicação da API para formato interno do widget.
 */
export function converterParaFormatoInterno(
  pub: DJENPublicacao,
  lawyerName: string = "Advogado"
): {
  id: string;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso?: string;
  orgao?: string;
  lawyerName: string;
  matchType: "nome" | "oab" | "ambos";
  source: string;
  createdAt: string;
  notified: boolean;
} {
  return {
    id: pub.id || crypto.randomUUID(),
    tribunal: pub.siglaTribunal,
    data: pub.dataDisponibilizacao,
    tipo: pub.tipoComunicacao || "Intimação",
    teor: pub.texto,
    numeroProcesso: pub.numeroProcesso,
    orgao: pub.nomeOrgao,
    lawyerName,
    matchType: "oab",
    source: "DJEN-Browser",
    createdAt: new Date().toISOString(),
    notified: false,
  };
}

/**
 * Verifica se a API DJEN está acessível do navegador atual.
 * Útil para determinar se o usuário está no Brasil.
 */
export async function verificarAcessoAPI(): Promise<{
  acessivel: boolean;
  mensagem: string;
}> {
  try {
    const response = await fetch(`${DJEN_API_URL}?meio=D&itensPorPagina=1`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      return {
        acessivel: true,
        mensagem: "API DJEN acessível. Você está no Brasil.",
      };
    }

    if (isGeoBlockedError(response.status)) {
      return {
        acessivel: false,
        mensagem: "API DJEN bloqueada geograficamente. " + "A API só aceita requisições do Brasil.",
      };
    }

    return {
      acessivel: false,
      mensagem: `API retornou erro ${response.status}`,
    };
  } catch {
    return {
      acessivel: false,
      mensagem: "Erro de rede ao verificar acesso à API DJEN.",
    };
  }
}
