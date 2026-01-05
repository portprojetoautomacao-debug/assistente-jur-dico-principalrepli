/**
 * KV API endpoint
 *
 * Handles GET and POST requests for key-value storage
 * - GET:  Retrieve value by key
 * - POST: Set value for key
 * - POST ?action=init: Initialize configuration with agents and lawyer data
 *
 * Suporta Upstash Redis (recomendado em Vercel)
 */

import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleError, withErrorHandler } from "./lib/error-handler.js";
import { rateLimitMiddleware } from "./lib/rate-limit.js";
import { SafeLogger } from "./lib/safe-logger.js";

const logger = new SafeLogger("KV");

// ===== Redis singleton (Upstash) =====

const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

let _redisClient: Redis | null = null;

function getRedisOrNull(): Redis | null {
  if (!redisUrl || !redisToken) return null;
  _redisClient ??= new Redis({
    url: redisUrl,
    token: redisToken,
  });
  return _redisClient;
}

// ===== Configuração inicial dos agentes =====

function getDefaultAgentes() {
  return [
    {
      id: "agent-djen-monitor",
      name: "Agente de Monitoramento DJEN",
      type: "monitor",
      enabled: true,
      status: "active",
      capabilities: [
        "Monitoramento 24/7",
        "Detecção de publicações",
        "Alertas em tempo real",
        "Análise de relevância",
      ],
      lastActivity: null as string | null,
    },
    {
      id: "agent-deadline-calculator",
      name: "Agente Calculador de Prazos",
      type: "calculator",
      enabled: true,
      status: "active",
      capabilities: [
        "Cálculo de prazos processuais",
        "Considera feriados e recessos",
        "Alertas de vencimento",
        "Análise de urgência",
      ],
      lastActivity: null as string | null,
    },
    {
      id: "agent-document-analyzer",
      name: "Agente Analisador de Documentos",
      type: "analyzer",
      enabled: true,
      status: "active",
      capabilities: [
        "Análise de petições",
        "Extração de dados",
        "Identificação de prazos",
        "Resumo automático",
      ],
      lastActivity: null as string | null,
    },
    {
      id: "agent-legal-writer",
      name: "Agente Redator Jurídico",
      type: "writer",
      enabled: true,
      status: "active",
      capabilities: [
        "Redação de peças",
        "Sugestão de teses",
        "Formatação ABNT",
        "Revisão jurídica",
      ],
      lastActivity: null as string | null,
    },
    {
      id: "agent-jurisprudence-researcher",
      name: "Agente Pesquisador de Jurisprudência",
      type: "researcher",
      enabled: true,
      status: "active",
      capabilities: [
        "Busca de precedentes",
        "Análise de tendências",
        "Resumo de decisões",
        "Recomendações estratégicas",
      ],
      lastActivity: null as string | null,
    },
    {
      id: "agent-strategic-advisor",
      name: "Agente Estratégico",
      type: "strategic",
      enabled: true,
      status: "active",
      capabilities: [
        "Análise de riscos",
        "Planejamento processual",
        "Probabilidade de êxito",
        "Sugestões táticas",
      ],
      lastActivity: null as string | null,
    },
    {
      id: "agent-calendar-sync",
      name: "Agente de Sincronização de Agenda",
      type: "calendar",
      enabled: true,
      status: "active",
      capabilities: [
        "Sincronização Google Calendar",
        "Lembretes automáticos",
        "Gestão de compromissos",
        "Alertas de audiências",
      ],
      lastActivity: null as string | null,
    },
  ];
}

function getDefaultAdvogado() {
  return {
    id: "lawyer-thiago-bodevan",
    name: "Thiago Bodevan Veiga",
    oab: "184404/MG",
    email: "thiagobodevanadvocacia@gmail.com",
    tribunals: ["TJMG", "TRT3", "TST", "STJ", "TRF1"],
    enabled: true,
  };
}

// ===== Init de configuração (agentes + advogado monitorado) =====

async function handleInitConfig(_req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const agentes = getDefaultAgentes();
    const advogado = getDefaultAdvogado();

    const redis = getRedisOrNull();
    if (!redis) {
      throw new Error("No KV storage available (Upstash Redis required)");
    }

    await Promise.all([
      redis.set("autonomous-agents", agentes),
      redis.set("monitored-lawyers", [advogado]),
      redis.set("agent-task-queue", []),
      redis.set("completed-agent-tasks", []),
    ]);

    res.status(200).json({
      ok: true,
      message: "Configuração inicializada com sucesso!",
      data: {
        agentes: agentes.length,
        advogado: {
          name: advogado.name,
          oab: advogado.oab,
          email: advogado.email,
          tribunals: advogado.tribunals,
        },
        keys: [
          "autonomous-agents",
          "monitored-lawyers",
          "agent-task-queue",
          "completed-agent-tasks",
        ],
      },
    });
  } catch (error) {
    console.error("Error initializing config:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to initialize configuration",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

// ===== Handlers para operações KV =====

/**
 * Configura headers CORS
 */
function setupCorsHeaders(res: VercelResponse): void {
  const allowed = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  if (allowed.length > 0) {
    // Use first origin as allowed if single origin, or set to the origin list
    // The header doesn't accept multiple origins; for multiple we use requested origin verification in handler
    res.setHeader("Access-Control-Allow-Origin", allowed[0]);
    res.setHeader("Vary", "Origin");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/**
 * Extrai IP do cliente
 */
function getClientIP(req: VercelRequest): string {
  return (
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string | undefined) ||
    "unknown"
  );
}

/**
 * Aplica rate limiting
 */
async function applyRateLimit(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  const clientIP = getClientIP(req);
  const rateLimitResult = await rateLimitMiddleware(clientIP);

  Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (!rateLimitResult.allowed) {
    const resetSeconds = Math.max(
      1,
      Math.ceil((Number(rateLimitResult.headers["X-RateLimit-Reset"]) - Date.now()) / 1000)
    );

    res.setHeader("Retry-After", resetSeconds.toString());
    res.status(429).json({
      error: rateLimitResult.error || "Rate limit exceeded",
    });
    return false;
  }

  return true;
}

/**
 * Handler GET /api/kv?key=...
 */
async function handleGetKey(redis: Redis, req: VercelRequest, res: VercelResponse): Promise<void> {
  const { key } = req.query;

  if (!key || typeof key !== "string") {
    res.status(400).json({ error: "Key parameter is required" });
    return;
  }

  const value = await redis.get(key);
  res.status(200).json({ key, value: value ?? null });
}

/**
 * Handler batch-get: ler várias chaves de uma vez
 */
async function handleBatchGet(redis: Redis, keys: unknown, res: VercelResponse): Promise<void> {
  const validKeys = (keys as unknown[])
    .filter((k: unknown): k is string => typeof k === "string")
    .slice(0, 50);

  const values: Record<string, unknown> = {};

  if (validKeys.length > 0) {
    const pipeline = redis.pipeline();
    for (const k of validKeys) {
      pipeline.get(k);
    }
    const results = await pipeline.exec();

    for (let i = 0; i < validKeys.length; i++) {
      values[validKeys[i]] = results[i] ?? null;
    }
  }

  res.status(200).json({ success: true, values });
}

/**
 * Handler batch-set: gravar várias chaves de uma vez
 */
async function handleBatchSet(redis: Redis, entries: unknown, res: VercelResponse): Promise<void> {
  const validEntries = (entries as unknown[])
    .filter(
      (e: unknown): e is { key: string; value: unknown } =>
        !!e &&
        typeof e === "object" &&
        "key" in e &&
        "value" in e &&
        typeof (e as Record<string, unknown>).key === "string"
    )
    .slice(0, 50);

  if (validEntries.length > 0) {
    const pipeline = redis.pipeline();
    for (const entry of validEntries) {
      pipeline.set(entry.key, entry.value);
    }
    await pipeline.exec();
  }

  res.status(200).json({ success: true, count: validEntries.length });
}

/**
 * Handler set simples key/value
 */
async function handleSetKey(
  redis: Redis,
  key: string,
  value: unknown,
  res: VercelResponse
): Promise<void> {
  await redis.set(key, value);
  res.status(200).json({ success: true, key });
}

/**
 * Resposta fallback quando não há KV configurado
 */
function handleFallbackResponse(
  req: VercelRequest,
  res: VercelResponse,
  body: Record<string, unknown> | null
): void {
  console.warn("No KV storage available");
  if (req.method === "GET") {
    res.status(200).json({ key: req.query.key, value: null, fallback: true });
  } else if (req.method === "POST") {
    res.status(200).json({ success: true, key: body?.key ?? null, fallback: true });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

// ===== POST request handlers - Extracted to reduce CC =====

interface PostRequestBody {
  key?: unknown;
  value?: unknown;
  action?: unknown;
  keys?: unknown;
  entries?: unknown;
}

/**
 * Processa requisição POST para batch-get
 */
async function tryHandleBatchGet(
  redis: Redis,
  body: PostRequestBody,
  res: VercelResponse
): Promise<boolean> {
  if (body.action !== "batch-get" || !Array.isArray(body.keys)) {
    return false;
  }
  await handleBatchGet(redis, body.keys, res);
  return true;
}

/**
 * Processa requisição POST para batch-set
 */
async function tryHandleBatchSet(
  redis: Redis,
  body: PostRequestBody,
  res: VercelResponse
): Promise<boolean> {
  if (body.action !== "batch-set" || !Array.isArray(body.entries)) {
    return false;
  }
  await handleBatchSet(redis, body.entries, res);
  return true;
}

/**
 * Resultado de validação do POST request
 */
interface ValidationResult {
  valid: boolean;
  key?: string;
  value?: unknown;
  errorMessage?: string;
}

/**
 * Valida os parâmetros de entrada para set simples
 * Retorna resultado da validação sem efeitos colaterais
 */
function validateSetInput(body: PostRequestBody): ValidationResult {
  const { key, value } = body;

  if (!key || typeof key !== "string") {
    return { valid: false, errorMessage: "Key is required in request body" };
  }

  if (value === undefined) {
    return { valid: false, errorMessage: "Value is required in request body" };
  }

  // ⚠️ Valida tamanho do payload (max 4.5MB para evitar 413)
  const valueStr = JSON.stringify(value);
  const sizeInMB = Buffer.byteLength(valueStr, "utf8") / 1024 / 1024;
  const MAX_SIZE_MB = 4.5; // Vercel limit: 4.5MB body size

  if (sizeInMB > MAX_SIZE_MB) {
    logger.warn(`Payload muito grande: ${sizeInMB.toFixed(2)}MB (max ${MAX_SIZE_MB}MB)`, { key });
    return {
      valid: false,
      errorMessage: `Payload muito grande: ${sizeInMB.toFixed(2)}MB. Máximo: ${MAX_SIZE_MB}MB. Considere dividir os dados ou limpar dados antigos.`,
    };
  }

  return { valid: true, key, value };
}

/**
 * Processa requisição POST para set simples
 * Retorna true se processado com sucesso, false se houve erro de validação
 */
async function tryHandleSimpleSet(
  redis: Redis,
  body: PostRequestBody,
  res: VercelResponse
): Promise<boolean> {
  const validation = validateSetInput(body);

  if (!validation.valid) {
    res.status(400).json({ error: validation.errorMessage });
    return false; // validation error - not successfully handled
  }

  await handleSetKey(redis, validation.key!, validation.value, res);
  return true; // success
}

/**
 * Handler para requisições POST
 * Tenta handlers na ordem: batch-get, batch-set, set simples
 */
async function handlePostRequest(
  redis: Redis,
  body: PostRequestBody,
  res: VercelResponse
): Promise<void> {
  // Tenta cada handler em sequência
  if (await tryHandleBatchGet(redis, body, res)) return;
  if (await tryHandleBatchSet(redis, body, res)) return;

  // Simple set é o fallback - se validação falhar, a resposta de erro já foi enviada
  const setResult = await tryHandleSimpleSet(redis, body, res);
  if (!setResult) {
    // Validation error response already sent by tryHandleSimpleSet
    return;
  }
}

/**
 * Parse body se vier como string
 */
function parseRequestBody(body: unknown): Record<string, unknown> | null {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      console.warn("Failed to parse request body");
      return null;
    }
  }
  return body as Record<string, unknown> | null;
}

// ===== Handler principal - Refactored =====

export default withErrorHandler(async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  // CORS / preflight
  if (req.method === "OPTIONS") {
    setupCorsHeaders(res);
    res.status(200).end();
    return;
  }

  setupCorsHeaders(res);

  // Rate limiting por IP
  const rateLimitPassed = await applyRateLimit(req, res);
  if (!rateLimitPassed) return;

  const clientIP = getClientIP(req);
  logger.info("KV API request", {
    method: req.method,
    url: req.url,
    ip: clientIP,
  });

  const action = typeof req.query.action === "string" ? req.query.action : undefined;

  // POST ?action=init → inicializa configuração
  if (action === "init" && req.method === "POST") {
    await handleInitConfig(req, res);
    return;
  }

  const body = parseRequestBody(req.body);
  const redis = getRedisOrNull();

  // Se não houver KV configurado, responde em modo "fallback"
  if (!redis) {
    handleFallbackResponse(req, res, body);
    return;
  }

  try {
    // GET /api/kv?key=...
    if (req.method === "GET") {
      await handleGetKey(redis, req, res);
      return;
    }

    // POST /api/kv
    if (req.method === "POST") {
      await handlePostRequest(redis, body ?? {}, res);
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    logger.error("KV API Error", error);
    handleError(error, res, "KV API");
  }
}, "KV API");
