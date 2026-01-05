import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  generateHealthCheck,
  handleCronHealthRequest,
  handleSparkLoaded,
  handleWatchdogRequest,
} from "./lib/status-logic.js";

/**
 * Configura headers CORS
 */
function setCorsHeaders(res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/**
 * Verifica se é requisição Spark Loaded
 */
function isSparkLoadedRequest(type: string, url?: string): boolean {
  return type === "loaded" || url?.includes("/loaded") || false;
}

/**
 * Processa requisição Spark Loaded
 */
async function processSparkLoadedRequest(
  req: VercelRequest,
  res: VercelResponse
): Promise<boolean> {
  if (handleSparkLoaded(req, res)) {
    return true;
  }
  return false;
}

/**
 * Roteia requisição para handler apropriado
 */
async function routeRequest(
  type: string | undefined,
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (isSparkLoadedRequest(type || "", req.url)) {
    if (await processSparkLoadedRequest(req, res)) {
      return;
    }
  }

  if (type === "watchdog") {
    await handleWatchdogRequest(req, res);
    return;
  }

  if (type === "cron-health") {
    await handleCronHealthRequest(req, res);
    return;
  }

  generateHealthCheck(res);
}

/**
 * Status Endpoint
 * Combines Health Check and Spark Loaded functionality
 *
 * Access:
 * - /api/status?type=health (Health Check)
 * - /api/status?type=loaded (Spark Loaded)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.status(200).end();
    return;
  }

  const type = req.query.type as string | undefined;
  await routeRequest(type, req, res);
}
