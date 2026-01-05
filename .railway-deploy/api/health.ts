/**
 * Health Check API Endpoint
 *
 * Provides a comprehensive health check for the application including:
 * - API status
 * - Service dependencies (Redis, Qdrant, DSPy, Gemini)
 * - Agent system status
 * - Memory usage
 *
 * Endpoints:
 * - GET /api/health - Basic health check
 * - GET /api/health?detailed=true - Detailed health with all services
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

// ============================================================================
// TYPES
// ============================================================================

interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "down" | "not-configured";
  latency?: number;
  message?: string;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "down";
  timestamp: string;
  version: string;
  uptime: number;
  services?: Record<string, ServiceHealth>;
  memory?: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  agents?: {
    total: number;
    active: number;
  };
}

// ============================================================================
// SERVICE HEALTH CHECKS
// ============================================================================

async function checkRedis(): Promise<ServiceHealth> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return {
      name: "redis",
      status: "not-configured",
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
      return { name: "redis", status: "healthy", latency };
    }
    return {
      name: "redis",
      status: "degraded",
      latency,
      message: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      name: "redis",
      status: "down",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkQdrant(): Promise<ServiceHealth> {
  const url = process.env.VITE_QDRANT_URL || process.env.QDRANT_URL;
  const apiKey = process.env.VITE_QDRANT_API_KEY || process.env.QDRANT_API_KEY;

  if (!url || !apiKey) {
    return {
      name: "qdrant",
      status: "not-configured",
      message: "Missing Qdrant credentials",
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
      return { name: "qdrant", status: "healthy", latency };
    }
    return {
      name: "qdrant",
      status: "degraded",
      latency,
      message: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      name: "qdrant",
      status: "down",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkDSPy(): Promise<ServiceHealth> {
  const url = process.env.VITE_DSPY_URL || process.env.DSPY_URL || "http://localhost:8765";
  const token = process.env.VITE_DSPY_API_TOKEN || process.env.DSPY_API_TOKEN;

  if (!token) {
    return {
      name: "dspy",
      status: "not-configured",
      message: "Missing DSPy API token",
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
      return { name: "dspy", status: "healthy", latency };
    }
    return {
      name: "dspy",
      status: "degraded",
      latency,
      message: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      name: "dspy",
      status: "down",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function checkGemini(): ServiceHealth {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return {
      name: "gemini",
      status: "not-configured",
      message: "Missing Gemini API key",
    };
  }

  // Gemini doesn't have a health endpoint, just check if key is configured
  return {
    name: "gemini",
    status: "healthy",
    message: "API key configured",
  };
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const detailed = req.query.detailed === "true";

  try {
    const response: HealthResponse = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.VITE_APP_VERSION || "1.0.0",
      uptime: Math.floor(process.uptime()),
    };

    if (detailed) {
      // Check all services in parallel
      const [redis, qdrant, dspy] = await Promise.all([checkRedis(), checkQdrant(), checkDSPy()]);

      const gemini = checkGemini();

      response.services = {
        redis,
        qdrant,
        dspy,
        gemini,
      };

      // Memory info
      const mem = process.memoryUsage();
      response.memory = {
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        rss: mem.rss,
        external: mem.external,
      };

      // Agent info (static for now, could be dynamic in production)
      response.agents = {
        total: 15,
        active: 9, // 9 agents are enabled by default
      };

      // Calculate overall status
      const services = Object.values(response.services);
      const configuredServices = services.filter((s) => s.status !== "not-configured");
      const healthyServices = configuredServices.filter((s) => s.status === "healthy");

      if (configuredServices.length === 0) {
        response.status = "healthy"; // No configured services to check
      } else if (healthyServices.length === configuredServices.length) {
        response.status = "healthy";
      } else if (healthyServices.length >= configuredServices.length * 0.5) {
        response.status = "degraded";
      } else {
        response.status = "down";
      }
    }

    const statusCode = response.status === "down" ? 503 : 200;
    res.status(statusCode).json(response);
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "down",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
