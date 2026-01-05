/**
 * API para gerenciar expedientes/publicações do DJEN
 *
 * Endpoints:
 * - GET  /api/expedientes              → Lista publicações encontradas
 * - POST /api/expedientes/sync (*)     → Força sincronização com DJEN (trigger manual)
 *
 * (*) Em Vercel o ideal é ter /api/expedientes/index.ts e /api/expedientes/sync.ts,
 * mas aqui mantemos a checagem por URL/action pra compatibilizar com o código atual.
 */

import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireApiKey } from "./lib/auth.js";
import { rateLimitMiddleware } from "./lib/rate-limit.js";

const KV_KEYS = {
  PUBLICATIONS: "publications",
  LAST_CHECK: "last-djen-check",
  MONITORED_LAWYERS: "monitored-lawyers",
} as const;

interface StoredPublication {
  id: string;
  djenId?: number | string;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso?: string;
  orgao?: string;
  meio?: string;
  link?: string;
  hash?: string;
  lawyerId: string;
  lawyerName: string;
  lawyerOAB: string;
  matchType: "nome" | "oab" | "ambos";
  notified: boolean;
  createdAt: string;
}

interface MonitoredLawyer {
  id: string;
  name: string;
  oab: string;
  email?: string;
  enabled: boolean;
  tribunals: string[];
}

// Type aliases for query parameters (S4323)
type QueryParamValue = string | string[] | undefined;

// Singleton do Redis pra não abrir conexão a cada request
let _kvClient: Redis | null = null;

async function getKv(): Promise<Redis> {
  if (_kvClient) return _kvClient;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Upstash Redis not configured");
  }

  _kvClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL.trim(),
    token: process.env.UPSTASH_REDIS_REST_TOKEN.trim(),
  });

  return _kvClient;
}

// ===========================
// Helper: Filter publications
// ===========================
function filterPublications(
  publications: StoredPublication[],
  lawyerId: QueryParamValue,
  status: QueryParamValue
): StoredPublication[] {
  let filtered = [...publications];

  // Filter by lawyer
  if (typeof lawyerId === "string" && lawyerId.trim().length > 0) {
    filtered = filtered.filter((p) => p.lawyerId === lawyerId);
  }

  // Filter by unread status
  if (status === "unread") {
    filtered = filtered.filter((p) => !p.notified);
  }

  return filtered;
}

// ===========================
// Helper: Sort and limit
// ===========================
function sortAndLimit(
  publications: StoredPublication[],
  limit: string | string[] | undefined
): StoredPublication[] {
  // Sort by createdAt desc
  publications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Limit results
  const maxResults =
    typeof limit === "string" && !Number.isNaN(Number(limit)) ? Number.parseInt(limit, 10) : 50;

  return publications.slice(0, maxResults);
}

// ===========================
// Helper: Convert to expediente format
// ===========================
function toExpedienteFormat(pub: StoredPublication) {
  return {
    id: pub.id,
    type: pub.tipo || "Intimação",
    tipo: pub.tipo,
    content: pub.teor,
    teor: pub.teor,
    data: pub.data || pub.createdAt,
    receivedAt: pub.data || pub.createdAt,
    dataRecebimento: pub.data || pub.createdAt,
    analyzed: false,
    tribunal: pub.tribunal,
    numeroProcesso: pub.numeroProcesso,
    orgao: pub.orgao,
    lawyerName: pub.lawyerName,
    matchType: pub.matchType,
    source: "DJEN",
    createdAt: pub.createdAt,
  };
}

// ===========================
// Handler: GET /api/expedientes
// ===========================
async function handleGetExpedientes(
  req: VercelRequest,
  res: VercelResponse,
  kv: Redis
): Promise<VercelResponse> {
  const { lawyerId, limit, status } = req.query;

  const allPublications = (await kv.get<StoredPublication[]>(KV_KEYS.PUBLICATIONS)) ?? [];

  const filtered = filterPublications(allPublications, lawyerId, status);
  const publications = sortAndLimit(filtered, limit);

  const lastCheck = await kv.get<string>(KV_KEYS.LAST_CHECK);
  const lawyers = (await kv.get<MonitoredLawyer[]>(KV_KEYS.MONITORED_LAWYERS)) ?? [];

  const expedientes = publications.map(toExpedienteFormat);

  const message =
    lawyers.length === 0
      ? "Nenhum advogado configurado. Use POST /api/lawyers para adicionar."
      : `${lawyers.length} advogado(s) monitorado(s)`;

  return res.status(200).json({
    success: true,
    expedientes,
    publications,
    count: publications.length,
    lastCheck,
    lawyersConfigured: lawyers.length,
    message,
  });
}

// ===========================
// Helper: Build base URL
// ===========================
function buildBaseUrl(req: VercelRequest): string {
  if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim().length > 0) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NODE_ENV === "production") {
    return `https://${req.headers.host}`;
  }
  return "http://localhost:3000";
}

// ===========================
// Handler: POST /api/expedientes/sync
// ===========================
async function handlePostSync(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
  // Require API key to trigger manual sync
  if (!requireApiKey(req, res, "DJEN_SYNC_API_KEY")) return res;

  // Rate limit
  const clientIP =
    (req.headers["x-forwarded-for"] as string | undefined) ||
    (req.headers["x-real-ip"] as string | undefined) ||
    "unknown";
  const rl = await rateLimitMiddleware(clientIP);
  Object.entries(rl.headers || {}).forEach(([k, v]) => res.setHeader(k, v));
  if (!rl.allowed) {
    res.setHeader(
      "Retry-After",
      Math.max(
        1,
        Math.ceil((Number(rl.headers["X-RateLimit-Reset"]) - Date.now()) / 1000)
      ).toString()
    );
    return res.status(429).json({ error: rl.error || "Rate limit exceeded" });
  }

  const baseUrl = buildBaseUrl(req);
  const cronUrl = `${baseUrl}/api/cron?action=djen-monitor`;

  const response = await fetch(cronUrl, {
    method: "POST",
    headers: {
      Authorization: "Bearer manual-sync-token",
    },
  });

  const result = await response.json().catch(() => ({}));

  return res.status(200).json({
    success: true,
    message: "Sincronização iniciada",
    result,
  });
}

// ===========================
// Helper: Check if sync request
// ===========================
function isSyncRequest(req: VercelRequest): boolean {
  const action = typeof req.query.action === "string" ? req.query.action : undefined;
  const isSyncByAction = action === "sync";
  const isSyncByPath = req.url?.includes("/sync") ?? false;
  return isSyncByAction || isSyncByPath;
}

// ===========================
// Helper: Set CORS headers
// ===========================
function setCorsHeaders(res: VercelResponse): void {
  const allowed = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (allowed.length > 0) {
    res.setHeader("Access-Control-Allow-Origin", allowed[0]);
    res.setHeader("Vary", "Origin");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/**
 * Handler for GET /api/expedientes?action=pending
 * Delegates to /api/djen/check for next pending intimation
 */
async function handlePending(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/djen-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "next-pending",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        ok: false,
        error: errorData.error || "Erro ao buscar intimação",
        detalhes: errorData,
      });
    }

    const data = await response.json();

    return res.status(200).json({
      ok: true,
      intimacao: data.intimacao || data,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[API Expedientes Pending] Erro:", error);
    return res.status(500).json({
      ok: false,
      error: "Erro ao buscar intimação",
      message: error.message,
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const kv = await getKv();

    if (req.method === "GET") {
      return handleGetExpedientes(req, res, kv);
    }

    if (req.method === "POST" && isSyncRequest(req)) {
      return handlePostSync(req, res);
    }

    if (req.method === "GET" && req.query.action === "pending") {
      return handlePending(req, res);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[API Expedientes] Error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      hint: "Verifique se UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN estão configurados na Vercel",
    });
  }
}
