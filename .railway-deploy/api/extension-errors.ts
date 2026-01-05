import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withErrorHandler } from "./lib/error-handler.js";
import { SafeLogger } from "./lib/safe-logger.js";

const logger = new SafeLogger("ExtensionErrors");

export default withErrorHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  // Autenticação mínima: verificar X-API-Key se a variável estiver configurada
  const expectedKey = process.env.EXTENSION_ERRORS_API_KEY?.trim();
  // Support both Request.headers.get and plain object header access in tests
  const getHeader = (key: string) => {
    if (!req.headers) return undefined;
    // Headers object from Vercel may have a get method
    const headersObj: any = req.headers as any;
    if (typeof headersObj.get === "function") {
      return (
        headersObj.get(key) ??
        headersObj[key] ??
        headersObj[key.toLowerCase()] ??
        headersObj[key.toUpperCase()]
      );
    }
    return headersObj[key];
  };
  // Try case-insensitive keys if not found
  const getHeaderCaseInsensitive = (key: string) => {
    const capitalize = (k: string) =>
      k
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join("-");
    const variants = [key, key.toLowerCase(), key.toUpperCase(), capitalize(key)];
    for (const v of variants) {
      const val = getHeader(v);
      if (val) return val;
    }
    return undefined;
  };
  const providedKey =
    getHeaderCaseInsensitive("x-api-key") ||
    getHeaderCaseInsensitive("X-API-Key") ||
    getHeaderCaseInsensitive("x-extension-api-key") ||
    getHeaderCaseInsensitive("X-Extension-Api-Key");
  if (expectedKey && (!providedKey || providedKey !== expectedKey)) {
    logger.warn("Unauthorized attempt to POST /api/extension-errors");
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  // Validação simples do corpo
  const body = req.body;
  if (!body || typeof body !== "object") {
    res.status(400).json({ ok: false, error: "Invalid body" });
    return;
  }

  // Store in Redis if available
  try {
    // Lazy import to avoid Upstash import cost on lambda warmups
    const { Redis } = await import("@upstash/redis");

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    let client: any = null;
    if (redisUrl && redisToken) client = new Redis({ url: redisUrl, token: redisToken });

    if (client) {
      try {
        await client.lpush("extension-errors", JSON.stringify(body));
        // Set an expiration of 30 days on the list to avoid unbounded growth
        try {
          await client.expire("extension-errors", 60 * 60 * 24 * 30);
        } catch (e) {
          // Not critical, log and continue
          logger.warn("Failed setting TTL on extension-errors key", e);
        }
      } catch (e) {
        // fallback: log
        logger.warn("Failed storing extension error in redis", e);
      }
    } else {
      logger.warn("No redis configured; skipping storage for extension errors");
    }
  } catch (e) {
    logger.warn("Failed to import redis", e);
  }

  res.status(200).json({ ok: true });
  return;
});
