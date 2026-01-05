/**
 * API de Observabilidade Completa
 * Endpoints:
 * - GET /api/observability?action=circuit-breakers - Status dos circuit breakers
 * - GET /api/observability?action=metrics - Métricas gerais
 * - GET /api/observability?action=health - Health check detalhado
 * - GET /api/observability?action=agents - Status de todos os 15 agentes
 * - GET /api/observability?action=hybrid-stats - Estatísticas do sistema híbrido
 * - GET /api/observability?action=tasks - Tarefas em execução/fila
 * - GET /api/observability?action=full - Dashboard completo
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireApiKey } from "./lib/auth.js";
import { rateLimitMiddleware } from "./lib/rate-limit.js";

// ============================================================================
// TYPES
// ============================================================================

interface CircuitBreakerStatus {
  name: string;
  state: "closed" | "open" | "half-open";
  failures: number;
  lastFailure: string | null;
  successRate: number;
  lastCheck: string;
}

interface SystemMetrics {
  uptime: number;
  requestsTotal: number;
  errorsTotal: number;
  avgResponseTime: number;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

interface AgentStatusInfo {
  id: string;
  name: string;
  status: "active" | "idle" | "processing" | "paused" | "error" | "degraded";
  enabled: boolean;
  type: string;
  lastActivity: string;
  capabilities: string[];
  hasHybridVersion: boolean;
  recentFailures: number;
  circuitBreakerState: "closed" | "open" | "half-open";
}

interface TaskQueueInfo {
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  pendingRetry: number;
  humanIntervention: number;
}

interface HybridStatsInfo {
  totalExecutions: number;
  langGraphExecutions: number;
  traditionalExecutions: number;
  hybridExecutions: number;
  averageExecutionTime: number;
  successRate: number;
}

interface ServiceHealthInfo {
  name: string;
  status: "healthy" | "degraded" | "down" | "not-configured";
  latency?: number;
  lastCheck: string;
  message?: string;
}

interface FullDashboard {
  status: "healthy" | "degraded" | "critical";
  timestamp: string;
  agents: {
    total: number;
    active: number;
    idle: number;
    processing: number;
    error: number;
    list: AgentStatusInfo[];
  };
  tasks: TaskQueueInfo;
  hybrid: HybridStatsInfo;
  circuitBreakers: CircuitBreakerStatus[];
  services: ServiceHealthInfo[];
  metrics: SystemMetrics;
}

// ============================================================================
// 15 AGENTES COMPLETOS
// ============================================================================

const DEFAULT_AGENTS: AgentStatusInfo[] = [
  {
    id: "harvey",
    name: "Harvey Specter",
    status: "idle",
    enabled: true,
    type: "strategic",
    lastActivity: "Aguardando tarefas",
    capabilities: [
      "strategic-analysis",
      "performance-monitoring",
      "risk-identification",
      "data-analysis",
    ],
    hasHybridVersion: true,
    recentFailures: 0,
    circuitBreakerState: "closed",
  },
  {
    id: "justine",
    name: "Mrs. Justin-e",
    status: "idle",
    enabled: true,
    type: "intimation-analyzer",
    lastActivity: "Aguardando tarefas",
    capabilities: [
      "intimation-analysis",
      "deadline-identification",
      "task-generation",
      "priority-assessment",
    ],
    hasHybridVersion: true,
    recentFailures: 0,
    circuitBreakerState: "closed",
  },
  {
    id: "analise-documental",
    name: "Analisador de Documentos",
    status: "idle",
    enabled: true,
    type: "analyzer",
    lastActivity: "Aguardando tarefas",
    capabilities: ["document-analysis", "text-extraction", "entity-recognition", "classification"],
    hasHybridVersion: true,
    recentFailures: 0,
    circuitBreakerState: "closed",
  },
  {
    id: "monitor-djen",
    name: "Monitor DJEN",
    status: "idle",
    enabled: true,
    type: "monitor",
    lastActivity: "Aguardando tarefas",
    capabilities: [
      "djen-monitoring",
      "publication-detection",
      "notification",
      "datajud-integration",
    ],
    hasHybridVersion: true,
    recentFailures: 0,
    circuitBreakerState: "closed",
  },
  {
    id: "gestao-prazos",
    name: "Gestão de Prazos",
    status: "idle",
    enabled: true,
    type: "calculator",
    lastActivity: "Aguardando tarefas",
    capabilities: [
      "deadline-calculation",
      "business-days",
      "holiday-detection",
      "alert-generation",
    ],
    hasHybridVersion: true,
    recentFailures: 0,
    circuitBreakerState: "closed",
  },
  {
    id: "redacao-peticoes",
    name: "Redator de Petições",
    status: "idle",
    enabled: true,
    type: "writer",
    lastActivity: "Aguardando tarefas",
    capabilities: [
      "document-drafting",
      "legal-writing",
      "template-generation",
      "precedent-integration",
    ],
    hasHybridVersion: true,
    recentFailures: 0,
    circuitBreakerState: "closed",
  },
  {
    id: "organizacao-arquivos",
    name: "Organizador de Arquivos",
    status: "idle",
    enabled: false,
    type: "organizer",
    lastActivity: "Aguardando tarefas",
    capabilities: ["file-organization", "categorization", "indexing", "duplicate-detection"],
    hasHybridVersion: true,
    recentFailures: 0,
    circuitBreakerState: "closed",
  },
  {
    id: "pesquisa-juris",
    name: "Pesquisador de Jurisprudência",
    status: "idle",
    enabled: true,
    type: "researcher",
    lastActivity: "Aguardando tarefas",
    capabilities: [
      "jurisprudence-search",
      "precedent-analysis",
      "case-law-research",
      "trend-analysis",
    ],
    hasHybridVersion: true,
    recentFailures: 0,
    circuitBreakerState: "closed",
  },
  {
    id: "analise-risco",
    name: "Análise de Risco",
    status: "idle",
    enabled: true,
    type: "risk-analyzer",
    lastActivity: "Aguardando tarefas",
    capabilities: [
      "risk-assessment",
      "probability-analysis",
      "financial-impact",
      "mitigation-strategies",
    ],
    hasHybridVersion: true,
    recentFailures: 0,
    circuitBreakerState: "closed",
  },
  {
    id: "revisao-contratual",
    name: "Revisor Contratual",
    status: "idle",
    enabled: false,
    type: "contract-reviewer",
    lastActivity: "Aguardando tarefas",
    capabilities: ["contract-analysis", "clause-review", "compliance-check", "risk-identification"],
    hasHybridVersion: true,
    recentFailures: 0,
    circuitBreakerState: "closed",
  },
  {
    id: "comunicacao-clientes",
    name: "Comunicação com Clientes",
    status: "idle",
    enabled: false,
    type: "communicator",
    lastActivity: "Aguardando tarefas",
    capabilities: [
      "client-communication",
      "report-generation",
      "language-simplification",
      "personalization",
    ],
    hasHybridVersion: true,
    recentFailures: 0,
    circuitBreakerState: "closed",
  },
  {
    id: "financeiro",
    name: "Análise Financeira",
    status: "idle",
    enabled: false,
    type: "financial-analyzer",
    lastActivity: "Aguardando tarefas",
    capabilities: [
      "financial-monitoring",
      "profitability-analysis",
      "receivables-tracking",
      "metrics-calculation",
    ],
    hasHybridVersion: true,
    recentFailures: 0,
    circuitBreakerState: "closed",
  },
  {
    id: "estrategia-processual",
    name: "Estratégia Processual",
    status: "idle",
    enabled: true,
    type: "strategy-advisor",
    lastActivity: "Aguardando tarefas",
    capabilities: ["strategic-planning", "option-analysis", "cost-benefit", "success-probability"],
    hasHybridVersion: true,
    recentFailures: 0,
    circuitBreakerState: "closed",
  },
  {
    id: "traducao-juridica",
    name: "Tradutor Jurídico",
    status: "idle",
    enabled: false,
    type: "translator",
    lastActivity: "Aguardando tarefas",
    capabilities: [
      "legal-translation",
      "term-explanation",
      "glossary-creation",
      "language-adaptation",
    ],
    hasHybridVersion: true,
    recentFailures: 0,
    circuitBreakerState: "closed",
  },
  {
    id: "compliance",
    name: "Compliance",
    status: "idle",
    enabled: false,
    type: "compliance-checker",
    lastActivity: "Aguardando tarefas",
    capabilities: ["compliance-check", "lgpd-verification", "ethics-review", "regulatory-audit"],
    hasHybridVersion: true,
    recentFailures: 0,
    circuitBreakerState: "closed",
  },
];

/**
 * Verifica autorização da requisição
 */
function isAuthorized(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;
  const isVercelCron = authHeader?.startsWith("Bearer ");

  const host = req.headers.host || "";
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  const isLocalDev =
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    process.env.NODE_ENV === "development";
  const isVercelApp =
    host.includes("vercel.app") || origin.includes("vercel.app") || referer.includes("vercel.app");
  const hasApiKey = !!req.headers["x-api-key"];

  return !!(isVercelCron || isLocalDev || isVercelApp || hasApiKey);
}

// Helper: Checar Qdrant
async function checkQdrantHealth(): Promise<ServiceHealthInfo> {
  const now = new Date().toISOString();
  const url = process.env.VITE_QDRANT_URL || process.env.QDRANT_URL;
  const apiKey = process.env.VITE_QDRANT_API_KEY || process.env.QDRANT_API_KEY;
  
  if (!url || !apiKey) {
    return {
      name: "qdrant",
      status: "not-configured",
      lastCheck: now,
      message: "Missing QDRANT_URL or QDRANT_API_KEY",
    };
  }
  
  try {
    const start = Date.now();
    const response = await fetch(`${url}/collections`, {
      headers: { "api-key": apiKey },
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;
    
    if (response.ok) {
      return { name: "qdrant", status: "healthy", latency, lastCheck: now };
    }
    
    return {
      name: "qdrant",
      status: "degraded",
      latency,
      lastCheck: now,
      message: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      name: "qdrant",
      status: "down",
      lastCheck: now,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper: Checar DSPy
async function checkDspyHealth(): Promise<ServiceHealthInfo> {
  const now = new Date().toISOString();
  const url = process.env.VITE_DSPY_URL || process.env.DSPY_URL || "http://localhost:8765";
  const token = process.env.VITE_DSPY_API_TOKEN || process.env.DSPY_API_TOKEN;
  
  if (!token) {
    return {
      name: "dspy",
      status: "not-configured",
      lastCheck: now,
      message: "Missing DSPY_API_TOKEN",
    };
  }
  
  try {
    const start = Date.now();
    const response = await fetch(`${url}/health`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;
    
    if (response.ok) {
      return { name: "dspy", status: "healthy", latency, lastCheck: now };
    }
    
    return {
      name: "dspy",
      status: "degraded",
      latency,
      lastCheck: now,
      message: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      name: "dspy",
      status: "down",
      lastCheck: now,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper: Checar Gemini
function checkGeminiHealth(): ServiceHealthInfo {
  const now = new Date().toISOString();
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return {
      name: "gemini",
      status: "not-configured",
      lastCheck: now,
      message: "Missing GEMINI_API_KEY",
    };
  }
  
  return { name: "gemini", status: "healthy", lastCheck: now, message: "API key configured" };
}

// Helper: Checar Redis
async function checkRedisHealth(): Promise<ServiceHealthInfo> {
  const now = new Date().toISOString();
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    return {
      name: "redis",
      status: "not-configured",
      lastCheck: now,
      message: "Missing Upstash Redis credentials",
    };
  }
  
  try {
    const start = Date.now();
    const response = await fetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;
    
    if (response.ok) {
      return { name: "redis", status: "healthy", latency, lastCheck: now };
    }
    
    return {
      name: "redis",
      status: "degraded",
      latency,
      lastCheck: now,
      message: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      name: "redis",
      status: "down",
      lastCheck: now,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper: Checar AutoGen
function checkAutogenHealth(): ServiceHealthInfo {
  const now = new Date().toISOString();
  const apiKey = process.env.AUTOGEN_API_KEY;
  
  if (!apiKey) {
    return {
      name: "autogen",
      status: "not-configured",
      lastCheck: now,
      message: "Missing AUTOGEN_API_KEY",
    };
  }
  
  return { name: "autogen", status: "healthy", lastCheck: now, message: "API key configured" };
}

async function checkServiceHealth(service: string): Promise<ServiceHealthInfo> {
  switch (service) {
    case "qdrant":
      return checkQdrantHealth();
    case "dspy":
      return checkDspyHealth();
    case "gemini":
      return checkGeminiHealth();
    case "redis":
      return checkRedisHealth();
    case "autogen":
      return checkAutogenHealth();
    default:
      return { name: service, status: "not-configured", lastCheck: new Date().toISOString() };
  }
}

// REMOVED: _legacyCheckServiceHealth - Use checkServiceHealth() instead
// This function was deprecated and duplicated logic already present in helpers above

// ============================================================================
// CIRCUIT BREAKERS
// ============================================================================

// Simulação de circuit breakers (em produção viria de um serviço real)
function getCircuitBreakers(): CircuitBreakerStatus[] {
  const now = new Date().toISOString();
  return [
    {
      name: "gemini-api",
      state: "closed",
      failures: 0,
      lastFailure: null,
      successRate: 100,
      lastCheck: now,
    },
    {
      name: "datajud-api",
      state: "closed",
      failures: 0,
      lastFailure: null,
      successRate: 100,
      lastCheck: now,
    },
    {
      name: "djen-api",
      state: "closed",
      failures: 0,
      lastFailure: null,
      successRate: 100,
      lastCheck: now,
    },
    {
      name: "upstash-redis",
      state: "closed",
      failures: 0,
      lastFailure: null,
      successRate: 100,
      lastCheck: now,
    },
    {
      name: "qdrant-vector-db",
      state: "closed",
      failures: 0,
      lastFailure: null,
      successRate: 100,
      lastCheck: now,
    },
    {
      name: "dspy-bridge",
      state: "closed",
      failures: 0,
      lastFailure: null,
      successRate: 100,
      lastCheck: now,
    },
  ];
}

// ============================================================================
// METRICS
// ============================================================================

// Métricas simuladas (em produção viria de monitoring real)
function getMetrics(): SystemMetrics {
  return {
    uptime: Math.floor(process.uptime()),
    requestsTotal: 0,
    errorsTotal: 0,
    avgResponseTime: 0,
    memoryUsage: {
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
    },
  };
}

// ============================================================================
// HYBRID STATS
// ============================================================================

function getHybridStats(): HybridStatsInfo {
  // Em produção, isso viria do módulo hybrid-agents-integration
  return {
    totalExecutions: 0,
    langGraphExecutions: 0,
    traditionalExecutions: 0,
    hybridExecutions: 0,
    averageExecutionTime: 0,
    successRate: 0,
  };
}

// ============================================================================
// TASK QUEUE
// ============================================================================

function getTaskQueue(): TaskQueueInfo {
  // Em produção, isso viria do sistema de tarefas
  return {
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    pendingRetry: 0,
    humanIntervention: 0,
  };
}

// ============================================================================
// FULL DASHBOARD
// ============================================================================

async function getFullDashboard(): Promise<FullDashboard> {
  const agents = DEFAULT_AGENTS;
  const activeAgents = agents.filter((a) => a.enabled && a.status !== "error");
  const idleAgents = agents.filter((a) => a.status === "idle");
  const processingAgents = agents.filter((a) => a.status === "processing");
  const errorAgents = agents.filter((a) => a.status === "error");

  const services = await Promise.all([
    checkServiceHealth("qdrant"),
    checkServiceHealth("dspy"),
    checkServiceHealth("gemini"),
    checkServiceHealth("redis"),
    checkServiceHealth("autogen"),
  ]);

  const healthyServices = services.filter((s) => s.status === "healthy").length;
  const totalServices = services.length;
  const healthRatio = healthyServices / totalServices;

  let status: "healthy" | "degraded" | "critical" = "healthy";
  if (healthRatio < 0.5) status = "critical";
  else if (healthRatio < 1) status = "degraded";

  return {
    status,
    timestamp: new Date().toISOString(),
    agents: {
      total: agents.length,
      active: activeAgents.length,
      idle: idleAgents.length,
      processing: processingAgents.length,
      error: errorAgents.length,
      list: agents,
    },
    tasks: getTaskQueue(),
    hybrid: getHybridStats(),
    circuitBreakers: getCircuitBreakers(),
    services,
    metrics: getMetrics(),
  };
}

// Helper: Configurar CORS para observability
function setupObservabilityCorsHeaders(res: VercelResponse, req: VercelRequest): VercelResponse | null {
  const allowed = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const origin = (req.headers?.origin as string | undefined) || "";
  
  if (origin && allowed.length > 0) {
    if (!allowed.includes(origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (allowed.length === 0) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  return null;
}

// Helper: Obter IP do cliente
function getObservabilityClientIP(req: VercelRequest): string {
  return (
    (req.headers["x-forwarded-for"] as string | undefined) ||
    (req.headers["x-real-ip"] as string | undefined) ||
    "unknown"
  );
}

// Helper: Aplicar rate limiting
async function applyObservabilityRateLimit(clientIP: string, res: VercelResponse): Promise<boolean> {
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
    res.status(429).json({ error: rl.error || "Rate limit exceeded" });
    return false;
  }
  
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const corsError = setupObservabilityCorsHeaders(res, req);
  if (corsError) return corsError;

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limit
  const clientIP = getObservabilityClientIP(req);
  const rateLimitPassed = await applyObservabilityRateLimit(clientIP, res);
  if (!rateLimitPassed) return;

  // Authorization check
  if (!isAuthorized(req) && !requireApiKey(req, res, "OBSERVABILITY_API_KEY")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const actionParam = req.query.action;
    const action = Array.isArray(actionParam) ? actionParam[0] : actionParam;

    switch (action) {
      case "circuit-breakers":
        return res.status(200).json({
          ok: true,
          summary: {
            total: 6,
            healthy: 6,
            degraded: 0,
            failed: 0,
          },
          breakers: getCircuitBreakers(),
          timestamp: new Date().toISOString(),
        });

      case "metrics":
        return res.status(200).json({
          ok: true,
          metrics: getMetrics(),
          tasks: getTaskQueue(),
          timestamp: new Date().toISOString(),
        });

      case "health": {
        const services = await Promise.all([
          checkServiceHealth("qdrant"),
          checkServiceHealth("dspy"),
          checkServiceHealth("gemini"),
          checkServiceHealth("redis"),
          checkServiceHealth("autogen"),
        ]);

        const healthyCount = services.filter((s) => s.status === "healthy").length;
        const configuredCount = services.filter((s) => s.status !== "not-configured").length;

        let overallStatus: "healthy" | "degraded" | "critical" = "healthy";
        if (configuredCount > 0 && healthyCount < configuredCount * 0.5) {
          overallStatus = "critical";
        } else if (healthyCount < configuredCount) {
          overallStatus = "degraded";
        }

        return res.status(200).json({
          ok: true,
          status: overallStatus,
          services: services.reduce(
            (acc, s) => {
              acc[s.name] = s.status;
              return acc;
            },
            {} as Record<string, string>
          ),
          serviceDetails: services,
          timestamp: new Date().toISOString(),
        });
      }

      case "agents":
        return res.status(200).json({
          ok: true,
          total: DEFAULT_AGENTS.length,
          active: DEFAULT_AGENTS.filter((a) => a.enabled).length,
          agents: DEFAULT_AGENTS,
          timestamp: new Date().toISOString(),
        });

      case "hybrid-stats":
        return res.status(200).json({
          ok: true,
          stats: getHybridStats(),
          timestamp: new Date().toISOString(),
        });

      case "tasks":
        return res.status(200).json({
          ok: true,
          tasks: getTaskQueue(),
          timestamp: new Date().toISOString(),
        });

      case "full": {
        const dashboard = await getFullDashboard();
        return res.status(200).json({
          ok: true,
          ...dashboard,
        });
      }

      default:
        return res.status(200).json({
          ok: true,
          availableActions: [
            "circuit-breakers",
            "metrics",
            "health",
            "agents",
            "hybrid-stats",
            "tasks",
            "full",
          ],
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error("Observability API error:", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}
