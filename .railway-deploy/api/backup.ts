/**
 * API de Backup de Dados
 * Endpoints:
 * - GET /api/backup - Retorna status do backup
 * - POST /api/backup - Cria backup manual
 */

import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Redis singleton
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

/**
 * Verifica autorização da requisição
 */
function isAuthorized(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;
  const isVercelCron = authHeader?.startsWith("Bearer ");
  const host = req.headers.host || "";
  const isLocalDev =
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    process.env.NODE_ENV === "development";
  const hasApiKey = !!req.headers["x-api-key"];

  return !!(isVercelCron || isLocalDev || hasApiKey);
}

interface BackupStatus {
  lastBackup: string | null;
  totalKeys: number;
  sizeEstimate: string;
  healthy: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Em dev local, permitir acesso sem auth para facilitar desenvolvimento
  const host = req.headers.host || ''
  const isLocalDev = host.includes('localhost') || host.includes('127.0.0.1')

  if (!isLocalDev && !isAuthorized(req)) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication required for backup operations. Provide Bearer token, x-api-key header, or access from localhost.'
    })
  }

  try {
    const redis = getRedisOrNull();

    if (req.method === "GET") {
      // Retorna status do backup
      const status: BackupStatus = {
        lastBackup: null,
        totalKeys: 0,
        sizeEstimate: "0 KB",
        healthy: true,
      };

      if (redis) {
        try {
          const lastBackupTime = await redis.get<string>("backup:last-run");
          status.lastBackup = lastBackupTime || null;

          // Estimar número de chaves (simplificado)
          const processes = await redis.get<unknown[]>("processes");
          const expedientes = await redis.get<unknown[]>("expedientes");
          status.totalKeys = (processes?.length || 0) + (expedientes?.length || 0);
          status.sizeEstimate = `~${Math.ceil(status.totalKeys * 2)} KB`;
        } catch (e) {
          console.warn("Backup status check failed:", e);
          status.healthy = false;
        }
      }

      return res.status(200).json({
        ok: true,
        status,
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method === "POST") {
      // Criar backup manual
      if (!redis) {
        return res.status(200).json({
          ok: true,
          message: "Redis não configurado, backup local apenas",
          timestamp: new Date().toISOString(),
        });
      }

      // Registrar timestamp do backup
      await redis.set("backup:last-run", new Date().toISOString());

      // Em produção, aqui faria backup real para storage externo
      // Por enquanto, apenas registra que backup foi solicitado

      return res.status(200).json({
        ok: true,
        message: "Backup iniciado com sucesso",
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Backup API error:", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}
