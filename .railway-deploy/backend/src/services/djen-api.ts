/**
 * Cliente para API do DJEN (Diário de Justiça Eletrônico Nacional)
 * Documentação: https://comunicaapi.pje.jus.br/
 */

const DJEN_API_URL = "https://comunicaapi.pje.jus.br/api/v1/comunicacao";

interface DJENPublicacao {
  id: string;
  siglaTribunal: string;
  tipoComunicacao: string;
  numeroProcesso: string;
  texto: string;
  dataDisponibilizacao: string;
  nomeOrgao: string;
}

interface BuscarPublicacoesParams {
  numeroOab: string;
  ufOab: string;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
}

/**
 * Busca publicações do DJEN para um advogado específico
 *
 * ATENÇÃO: A API do CNJ só aceita requisições originadas do Brasil.
 * Requisições de fora do país retornam erro 403/451 (geobloqueio).
 */
export async function buscarPublicacoesDJEN(
  params: BuscarPublicacoesParams
): Promise<DJENPublicacao[]> {
  const url = new URL(`${DJEN_API_URL}/expedientes`);
  url.searchParams.set("numeroOab", params.numeroOab);
  url.searchParams.set("ufOab", params.ufOab);
  url.searchParams.set("meio", "D"); // D=Diário, E=Eletrônico
  url.searchParams.set("dataDisponibilizacaoInicio", params.dataInicio);
  url.searchParams.set("dataDisponibilizacaoFim", params.dataFim);

  console.log(`📡 Buscando DJEN: ${url.toString()}`);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Assistente-Juridico-PJe/1.0",
      },
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 451) {
        throw new Error(
          `API bloqueada geograficamente (erro ${response.status}). ` +
            `A API do CNJ só aceita requisições do Brasil.`
        );
      }
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // A API retorna um array de objetos com estrutura:
    // { idExpediente, siglaTribunal, tipoComunicacao, numeroProcesso, ... }
    const publicacoes: DJENPublicacao[] = (data || []).map((item: any) => ({
      id: item.idExpediente || `${item.numeroProcesso}-${Date.now()}`,
      siglaTribunal: item.siglaTribunal || "",
      tipoComunicacao: item.tipoComunicacao || "",
      numeroProcesso: item.numeroProcesso || "",
      texto: item.teor || item.texto || "",
      dataDisponibilizacao: item.dataDisponibilizacao || new Date().toISOString(),
      nomeOrgao: item.nomeOrgao || "",
    }));

    console.log(`✅ DJEN API: ${publicacoes.length} publicações encontradas`);
    return publicacoes;
  } catch (error) {
    console.error(`❌ Erro ao buscar DJEN:`, error);
    throw error;
  }
}
