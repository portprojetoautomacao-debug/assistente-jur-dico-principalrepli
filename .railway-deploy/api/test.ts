import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

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

// Logger simples
const logger = {
  info: (message: string) => console.log(`[Test] ${message}`),
  error: (message: string, error?: unknown) => console.error(`[Test] ERROR: ${message}`, error),
  warn: (message: string) => console.warn(`[Test] WARNING: ${message}`),
};

/**
 * Handler: GET /api/test?action=logs
 * Handler: GET /api/test?action=memory
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action as string;

  try {
    if (action === "logs") {
      const redis = getRedisOrNull();
      if (!redis) {
        logger.warn("No Redis available for logs");
        return res.status(200).json({ logs: [], redisAvailable: false });
      }

      const logsData = await redis.get("agent-logs");
      const logs = Array.isArray(logsData) ? logsData : [];
      return res.status(200).json({ logs, redisAvailable: true });
    }

    if (action === "memory") {
      const redis = getRedisOrNull();
      if (!redis) {
        logger.warn("No Redis available for memory");
        return res.status(200).json({ memory: [], redisAvailable: false });
      }

      const memoryData = await redis.get("legal-memory");
      const memory = Array.isArray(memoryData) ? memoryData : [];
      return res.status(200).json({ memory, redisAvailable: true });
    }

    return res.status(400).json({
      error: "Invalid action. Use: logs or memory",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Test handler error", error);

    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}
