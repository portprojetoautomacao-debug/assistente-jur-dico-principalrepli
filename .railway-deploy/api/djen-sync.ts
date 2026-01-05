/**
 * API para sincronização manual do DJEN
 *
 * Este endpoint é público e pode ser chamado pelo frontend para forçar
 * uma sincronização com a API do DJEN.
 *
 * POST /api/djen-sync - Executa sincronização para advogados monitorados
 * 🔥 INSTRUMENTADO COM SENTRY AI MONITORING V2
 */

import * as Sentry from "@sentry/node";
import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";

// Rate limiting para evitar abuso
const SYNC_COOLDOWN_MS = 60_000; // 1 minuto entre syncs
const DJEN_TIMEOUT = 15_000;

interface MonitoredLawyer {
  id: string;
  name: string;
  oab: string;
  email?: string;
  enabled: boolean;
  tribunals: string[];
}

interface StoredPublication {
  id: string;
  djenId?: number;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso?: string;
  orgao?: string;
  meio?: string;
  link?: string;
  hash?: string;
  matchType: "nome" | "oab" | "ambos";
  lawyerId: string;
  lawyerName?: string;
  lawyerOAB?: string;
  advogados?: Array<{ nome: string; numero_oab: string; uf_oab: string }>;
  notified: boolean;
  createdAt: string;
}

interface DJENComunicacao {
  id: number;
  data_disponibilizacao: string;
  siglaTribunal: string;
  tipoComunicacao: string;
  nomeOrgao: string;
  texto: string;
  numero_processo: string;
  meio: string;
  link: string;
  hash: string;
  destinatarioadvogados?: Array<{
    advogado: {
      nome: string;
      numero_oab: string;
      uf_oab: string;
    };
  }>;
}

interface DJENResponse {
  status: string;
  message: string;
  count: number;
  items: DJENComunicacao[];
}

interface DJENQueryParams {
  numeroOab?: string;
  ufOab?: string;
  nomeAdvogado?: string;
  dataInicio?: string;
  dataFim?: string;
  meio?: "D" | "E";
}

const KV_KEYS = {
  PUBLICATIONS: "publications",
  LAST_SYNC: "last-djen-sync",
  LAST_CHECK: "last-djen-check",
  MONITORED_LAWYERS: "monitored-lawyers",
  PUBLICATION_HASHES: "publication-hashes",
} as const;

// Redis singleton (evita várias conexões em cold starts)
let _kvClient: Redis | null = null;

async function getKv(): Promise<Redis> {
  if (_kvClient) return _kvClient;

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    throw new Error("Upstash Redis not configured");
  }

  _kvClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL.trim(),
    token: process.env.UPSTASH_REDIS_REST_TOKEN.trim(),
  });

  return _kvClient;
}

function parseOAB(oab: string): { numero?: string; uf?: string } {
  if (!oab || oab.length > 50) return {};
  const match = /^(?<numero>\d+)\s?[/-]?\s?(?<uf>[A-Z]{2})$/i.exec(oab);
  if (match?.groups) return { numero: match.groups.numero, uf: match.groups.uf?.toUpperCase() };

  const numOnlyMatch = /^\d+$/.exec(oab);
  if (numOnlyMatch) return { numero: numOnlyMatch[0] };

  return {};
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

// ===========================
// Helper: Build DJEN query URL
// ===========================
function buildDJENQueryUrl(params: DJENQueryParams): string {
  const queryParts: string[] = [
    ...(params.numeroOab ? [`numeroOab=${encodeURIComponent(params.numeroOab)}`] : []),
    ...(params.ufOab ? [`ufOab=${encodeURIComponent(params.ufOab)}`] : []),
    ...(params.nomeAdvogado ? [`nomeAdvogado=${encodeURIComponent(params.nomeAdvogado)}`] : []),
    ...(params.dataInicio ? [`dataDisponibilizacaoInicio=${params.dataInicio}`] : []),
    ...(params.dataFim ? [`dataDisponibilizacaoFim=${params.dataFim}`] : []),
    "itensPorPagina=50",
    `meio=${params.meio || "D"}`, // D = Digital (intimações eletrônicas)
  ];

  return `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryParts.join(
    "&"
  )}`;
}

// ===========================
// Helper: Handle DJEN response status
// ===========================
function handleDJENResponseStatus(response: Response): void {
  if (response.status === 429) {
    console.warn("[DJEN-Sync] Rate limit atingido");
  }

  if (response.status === 403) {
    console.error(
      "[DJEN-Sync] Acesso bloqueado (403) - possível bloqueio geográfico"
    );
    throw new Error(
      "API DJEN bloqueou acesso - verifique se a função está rodando no Brasil (gru1)"
    );
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}

async function consultarDJEN(
  params: DJENQueryParams
): Promise<DJENResponse | null> {
  const url = buildDJENQueryUrl(params);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DJEN_TIMEOUT);

  try {
    console.log(
      "[DJEN-Sync] Consultando:",
      url.replace(/numeroOab=[^&]*/, "numeroOab=***")
    );

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "AssistenteJuridico/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      return null;
    }

    handleDJENResponseStatus(response);

    return (await response.json()) as DJENResponse;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      console.error("[DJEN-Sync] Timeout na consulta");
      throw new Error("Timeout na consulta DJEN");
    }

    throw error;
  }
}

// ===========================
// Helper: Set CORS headers
// ===========================
function setCorsHeaders(res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ===========================
// Helper: Check rate limit
// ===========================
async function checkRateLimit(
  kv: Redis,
  res: VercelResponse
): Promise<boolean> {
  const lastSync = await kv.get<string>(KV_KEYS.LAST_SYNC);
  if (!lastSync) return false;

  const elapsed = Date.now() - new Date(lastSync).getTime();
  if (elapsed < SYNC_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000);
    res.status(429).json({
      ok: false,
      error: "Rate limit",
      message: `Aguarde ${waitSeconds}s antes de sincronizar novamente`,
      retryAfter: waitSeconds,
    });
    return true;
  }
  return false;
}

// ===========================
// Helper: Create publication from DJEN item
// ===========================
function createPublication(
  item: DJENComunicacao,
  lawyer: MonitoredLawyer
): StoredPublication {
  const hash =
    item.hash ||
    `${item.siglaTribunal}-${item.data_disponibilizacao}-${item.numero_processo}`;

  return {
    id: randomUUID(),
    djenId: item.id,
    tribunal: item.siglaTribunal,
    data: item.data_disponibilizacao,
    tipo: item.tipoComunicacao || "Intimação",
    teor: item.texto?.substring(0, 2000) || "",
    numeroProcesso: item.numero_processo,
    orgao: item.nomeOrgao,
    meio: item.meio,
    link: item.link,
    hash,
    matchType: "oab",
    lawyerId: lawyer.id,
    lawyerName: lawyer.name,
    lawyerOAB: lawyer.oab,
    advogados: item.destinatarioadvogados?.map((d) => d.advogado) ?? [],
    notified: false,
    createdAt: new Date().toISOString(),
  };
}

// ===========================
// Helper: Process lawyer publications
// ===========================
async function processLawyerPublications(
  lawyer: MonitoredLawyer,
  dataInicio: string,
  dataFim: string,
  existingPubs: StoredPublication[],
  existingHashes: Set<string>
): Promise<{ total: number; newCount: number; error?: string }> {
  const { numero, uf } = parseOAB(lawyer.oab);

  if (!numero) {
    console.warn(`[DJEN-Sync] OAB inválida para ${lawyer.name}: ${lawyer.oab}`);
    return { total: 0, newCount: 0 };
  }

  const djenResponse = await consultarDJEN({
    numeroOab: numero,
    ufOab: uf,
    dataInicio,
    dataFim,
  });

  if (!djenResponse?.items) {
    return { total: 0, newCount: 0 };
  }

  let newCount = 0;
  for (const item of djenResponse.items) {
    const hash =
      item.hash ||
      `${item.siglaTribunal}-${item.data_disponibilizacao}-${item.numero_processo}`;

    if (existingHashes.has(hash)) {
      continue;
    }

    const newPublication = createPublication(item, lawyer);
    existingPubs.unshift(newPublication);
    newCount++;
  }

  return { total: djenResponse.items.length, newCount };
}

// ===========================
// Main sync logic
// 🔥 INSTRUMENTADO COM SENTRY AI MONITORING V2
// ===========================
async function executeSyncForLawyers(
  kv: Redis,
  enabledLawyers: MonitoredLawyer[]
): Promise<{ totalPublications: number; newPublications: number; errors: string[] }> {
  return Sentry.startSpan(
    {
      name: "invoke_agent Monitor DJEN",
      op: "gen_ai.invoke_agent",
      attributes: {
        "gen_ai.operation.name": "invoke_agent",
        "gen_ai.agent.name": "Monitor DJEN",
        "gen_ai.system": "custom-llm", // Não usa LLM diretamente
        "job.type": "background-sync",
        "job.name": "djen-monitor",
        "lawyers.count": enabledLawyers.length,
        "server.side": true,
        "vercel.function": "djen-sync",
      },
    },
    async (span) => {
      const hoje = new Date();
      const dataFim = formatDate(hoje);
      const dataInicio = formatDate(new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000));

      let totalPublications = 0;
      let newPublications = 0;
      const errors: string[] = [];

      const existingPubs = (await kv.get<StoredPublication[]>(KV_KEYS.PUBLICATIONS)) ?? [];
      const existingHashes = new Set(
        existingPubs.map((p) => p.hash || `${p.tribunal}-${p.data}-${p.numeroProcesso ?? ""}`)
      );

      for (const lawyer of enabledLawyers) {
        try {
          const result = await processLawyerPublications(
            lawyer,
            dataInicio,
            dataFim,
            existingPubs,
            existingHashes
          );
          totalPublications += result.total;
          newPublications += result.newCount;

          // Delay to avoid rate limit
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
          errors.push(`${lawyer.name}: ${errorMsg}`);
          console.error(`[DJEN-Sync] Erro para ${lawyer.name}:`, error);
        }
      }

      // Save publications (max 1000)
      await kv.set(KV_KEYS.PUBLICATIONS, existingPubs.slice(0, 1000));

      // Update timestamps
      const now = new Date().toISOString();
      await kv.set(KV_KEYS.LAST_SYNC, now);
      await kv.set(KV_KEYS.LAST_CHECK, now);

      // Atributos de conclusão para Sentry
      span?.setAttribute("publications.total", totalPublications);
      span?.setAttribute("publications.new", newPublications);
      span?.setAttribute("errors.count", errors.length);
      span?.setAttribute("sync.completed", true);
      if (errors.length > 0) {
        span?.setAttribute("sync.errors", JSON.stringify(errors.slice(0, 5))); // Max 5 erros
      }

      return { totalPublications, newPublications, errors };
    }
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const startTime = Date.now();

  try {
    const kv = await getKv();

    // Rate limiting check
    if (await checkRateLimit(kv, res)) {
      return;
    }

    // Get enabled lawyers
    const lawyers =
      (await kv.get<MonitoredLawyer[]>(KV_KEYS.MONITORED_LAWYERS)) ?? [];
    const enabledLawyers = lawyers.filter((l) => l.enabled);

    if (enabledLawyers.length === 0) {
      return res.status(200).json({
        ok: true,
        message: "Nenhum advogado configurado para monitoramento",
        lawyersChecked: 0,
        publicationsFound: 0,
      });
    }

    // Execute sync
    const { totalPublications, newPublications, errors } =
      await executeSyncForLawyers(kv, enabledLawyers);

    const duration = Date.now() - startTime;

    return res.status(200).json({
      ok: true,
      message:
        newPublications > 0
          ? `Encontradas ${newPublications} novas publicações`
          : "Nenhuma nova publicação encontrada",
      result: {
        lawyersChecked: enabledLawyers.length,
        publicationsFound: totalPublications,
        newPublications,
        duration: `${duration}ms`,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("[DJEN-Sync] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Erro interno",
      hint: "Verifique se o Upstash Redis está configurado e se a região da função é gru1 (São Paulo) para acessar a API do PJ-e.",
    });
  }
}
