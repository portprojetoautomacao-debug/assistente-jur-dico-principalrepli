/**
 * Hook personalizado para gerenciar publicações DJEN
 * Reduz complexidade cognitiva do componente principal
 *
 * Estratégia de fallback:
 * 1. Tenta buscar do backend (/api/expedientes)
 * 2. Se falhar, tenta buscar diretamente da API DJEN via navegador
 *    (resolve problema de geobloqueio quando backend está fora do Brasil)
 */

import type { DJENPublication } from "@/types/djen-publication";
import { useCallback, useState } from "react";

interface ExpedientesResponse {
  success: boolean;
  expedientes: DJENPublication[];
  count: number;
  lastCheck: string | null;
  lawyersConfigured: number;
  message?: string;
}

interface MonitoredLawyer {
  id: string;
  name: string;
  oab: string;
  enabled: boolean;
}

// IMPORTANTE: Estes são dados de EXEMPLO genéricos.
// NUNCA versione dados reais de clientes/advogados.
// Configure os dados reais via variáveis de ambiente.
const DEFAULT_LAWYERS: MonitoredLawyer[] = [
  {
    id: "exemplo-advogado",
    name: process.env.DJEN_ADVOGADO_NOME || "Advogado Exemplo",
    oab: process.env.DJEN_ADVOGADO_OAB || "000000/XX",
    enabled: true,
  },
];

async function fetchFromBackend(
  baseUrl: string,
  maxItems: number,
  filter: "all" | "unread"
): Promise<ExpedientesResponse> {
  const statusParam = filter === "unread" ? "&status=unread" : "";
  const response = await fetch(`${baseUrl}/api/expedientes?limit=${maxItems * 2}${statusParam}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchMonitoredLawyers(baseUrl: string): Promise<MonitoredLawyer[]> {
  try {
    const response = await fetch(`${baseUrl}/api/lawyers`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.lawyers || [];
  } catch {
    return [];
  }
}

function loadLawyersFromStorage(): MonitoredLawyer[] {
  const stored = localStorage.getItem("monitored-lawyers");
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as MonitoredLawyer[]) : [];
  } catch {
    return [];
  }
}

function ensureDefaultLawyersPersisted(): MonitoredLawyer[] {
  localStorage.setItem("monitored-lawyers", JSON.stringify(DEFAULT_LAWYERS));
  console.log(
    "[DJEN Proxy] Usando advogados padrão:",
    DEFAULT_LAWYERS.map((l) => l.name).join(", ")
  );
  return DEFAULT_LAWYERS;
}

function normalizeDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

function buildLawyerQueryParams(lawyer: MonitoredLawyer): { numero: string; uf: string } | null {
  const { numero, uf } = parseOAB(lawyer.oab);
  if (!numero) {
    console.warn(`[DJEN Proxy] Advogado ${lawyer.name}: OAB inválida - ${lawyer.oab}`);
    return null;
  }
  if (!uf) {
    console.warn(
      `[DJEN Proxy] Advogado ${lawyer.name}: UF não especificada na OAB - ${lawyer.oab}`
    );
    return null;
  }
  return { numero, uf };
}

function convertPublication(
  lawyer: MonitoredLawyer,
  pub: Record<string, unknown>
): DJENPublication {
  return {
    id: (pub.id as string) || crypto.randomUUID(),
    tribunal: pub.siglaTribunal as string,
    data: pub.dataDisponibilizacao as string,
    tipo: (pub.tipoComunicacao as string) || "Intimação",
    teor: pub.texto as string,
    numeroProcesso: pub.numeroProcesso as string,
    orgao: pub.nomeOrgao as string,
    lawyerName: lawyer.name,
    matchType: "oab" as const,
    source: "DJEN-Proxy",
    createdAt: new Date().toISOString(),
    notified: false,
  };
}

async function fetchPublicationsForLawyer(
  baseUrl: string,
  lawyer: MonitoredLawyer,
  maxItems: number
): Promise<DJENPublication[]> {
  const params = buildLawyerQueryParams(lawyer);
  if (!params) return [];

  try {
    const hoje = normalizeDateISO(new Date());
    const url = `${baseUrl}/api/djen/publicacoes?numeroOab=${params.numero}&ufOab=${params.uf}&dataInicio=${hoje}&dataFim=${hoje}`;
    console.log(`[DJEN Proxy] Buscando via backend: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[DJEN Proxy] Erro HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (!data?.success || !Array.isArray(data.publicacoes)) return [];

    return (data.publicacoes as Array<Record<string, unknown>>)
      .slice(0, maxItems)
      .map((pub) => convertPublication(lawyer, pub));
  } catch (error) {
    console.error(`[DJEN Proxy] Erro ao buscar para ${lawyer.name}:`, error);
    return [];
  }
}

function parseOAB(oab: string): { numero?: string; uf?: string } {
  if (!oab) return {};

  const normalized = oab.trim().toUpperCase();

  const matchNumericUF = /(\d+)[\s/-]{1,2}([A-Z]{2})/i.exec(normalized);
  if (matchNumericUF) {
    return { numero: matchNumericUF[1], uf: matchNumericUF[2].toUpperCase() };
  }

  const matchUFNumeric = /([A-Z]{2})[\s/-]{1,2}(\d+)/i.exec(normalized);
  if (matchUFNumeric) {
    return { numero: matchUFNumeric[2], uf: matchUFNumeric[1].toUpperCase() };
  }

  const matchOABPattern = /OAB[\s/-]{1,3}([A-Z]{2})[\s]{1,2}(\d+)/i.exec(normalized);
  if (matchOABPattern) {
    return { numero: matchOABPattern[2], uf: matchOABPattern[1].toUpperCase() };
  }

  const matchNumeric = /^(\d+)$/.exec(normalized);
  if (matchNumeric) {
    return { numero: matchNumeric[1] };
  }

  return {};
}

async function fetchFromBackendProxy(
  baseUrl: string,
  maxItems: number
): Promise<{
  expedientes: DJENPublication[];
  lawyersConfigured: number;
  isGeoBlocked?: boolean;
  error?: string;
}> {
  let lawyers = await fetchMonitoredLawyers(baseUrl);
  if (lawyers.length === 0) lawyers = loadLawyersFromStorage();
  if (lawyers.length === 0) lawyers = ensureDefaultLawyersPersisted();

  const enabledLawyers = lawyers.filter((l) => l.enabled);

  if (enabledLawyers.length === 0) {
    return {
      expedientes: [],
      lawyersConfigured: 0,
    };
  }

  const allPublications: DJENPublication[] = [];

  for (const lawyer of enabledLawyers) {
    const pubs = await fetchPublicationsForLawyer(baseUrl, lawyer, maxItems);
    if (pubs.length) allPublications.push(...pubs);

    if (enabledLawyers.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return {
    expedientes: allPublications.slice(0, maxItems),
    lawyersConfigured: enabledLawyers.length,
  };
}

export function useDJENPublications(maxItems: number, filter: "all" | "unread") {
  const [publications, setPublications] = useState<DJENPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [lawyersCount, setLawyersCount] = useState(0);
  const [isGeoBlocked, setIsGeoBlocked] = useState(false);

  const fetchPublications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsGeoBlocked(false);

      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

      try {
        const data = await fetchFromBackend(baseUrl, maxItems, filter);

        if (data.success) {
          setPublications(data.expedientes.slice(0, maxItems));
          setLastCheck(data.lastCheck);
          setLawyersCount(data.lawyersConfigured);
          return;
        }
      } catch (backendError) {
        console.warn("[DJENWidget] Backend indisponível, tentando browser-direct:", backendError);
      }

      console.log("[DJENWidget] Tentando busca via proxy backend...");
      const browserResult = await fetchFromBackendProxy(baseUrl, maxItems);

      if (browserResult.isGeoBlocked) {
        setIsGeoBlocked(true);
        setError(
          browserResult.error ||
            "API DJEN bloqueada geograficamente. Acesso permitido apenas do Brasil."
        );
        setLawyersCount(browserResult.lawyersConfigured);
        return;
      }

      setPublications(browserResult.expedientes);
      setLawyersCount(browserResult.lawyersConfigured);
      setLastCheck(new Date().toISOString());
    } catch (err) {
      console.error("[DJENWidget] Fetch error:", err);
      setError("Não foi possível carregar publicações");
    } finally {
      setLoading(false);
    }
  }, [maxItems, filter]);

  return {
    publications,
    loading,
    error,
    lastCheck,
    lawyersCount,
    fetchPublications,
    isGeoBlocked,
  };
}
