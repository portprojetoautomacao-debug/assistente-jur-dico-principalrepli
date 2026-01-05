/**
 * Rate Limiting básico usando Upstash Redis
 * Implementa proteção contra abuso de API
 */

import { Redis } from "@upstash/redis";

export interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requests por janela
  keyPrefix?: string; // Prefixo para chaves Redis
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalRequests: number;
}

export class RateLimiter {
  private readonly redis?: Redis;
  private readonly inMemoryStore?: Map<string, number[]>;
  private readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    const forceInMemory = process.env.USE_INMEMORY_RATE_LIMIT === "true";
    const isMockHost = url?.includes("mock-redis.") || url?.includes("fake.");

    if (!forceInMemory && url && token && !isMockHost) {
      this.redis = new Redis({
        url,
        token,
      });
    } else {
      // Fallback to in-memory store for development/testing environments
      console.warn(
        "[RateLimit] Upstash Redis não configurado ou mock — usando fallback InMemoryRedis"
      );
      this.inMemoryStore = new Map();
    }

    this.config = {
      keyPrefix: "ratelimit:",
      ...config,
    };
  }

  /**
   * Getter para configuração (usado por middleware)
   */
  getConfig(): RateLimitConfig {
    return this.config;
  }

  /**
   * Helper: Calcular reset time baseado no primeiro timestamp
   */
  private calculateResetTime(rawRange: any, now: number): number {
    if (!Array.isArray(rawRange) || rawRange.length < 2) {
      return now + this.config.windowMs;
    }

    const score = rawRange[1];
    if (score === undefined || score === null || Number.isNaN(Number(score))) {
      return now + this.config.windowMs;
    }

    const firstTs = typeof score === "number" ? score : Number.parseInt(String(score), 10);
    return firstTs + this.config.windowMs;
  }

  /**
   * Helper: Verificar rate limit usando Redis
   */
  private async checkWithRedis(
    redisKey: string,
    now: number,
    windowStart: number
  ): Promise<RateLimitResult> {
    // Remove requests fora da janela e conta requests atuais
    const multi = this.redis!.multi();
    multi.zremrangebyscore(redisKey, 0, windowStart);
    multi.zcard(redisKey);
    multi.zrange(redisKey, 0, -1, { withScores: true });

    const results = await multi.exec();
    const currentCount = typeof results[1] === "number" ? results[1] : 0;
    const rawRange = results[2];

    if (currentCount >= this.config.maxRequests) {
      return this.createRateLimitExceededResult(currentCount, rawRange, now);
    }

    return await this.createAllowedResult(redisKey, currentCount, now);
  }

  /**
   * Helper: Criar resultado quando limite é excedido
   */
  private createRateLimitExceededResult(
    currentCount: number,
    rawRange: any,
    now: number
  ): RateLimitResult {
    const resetTime = this.calculateResetTime(rawRange, now);
    return {
      allowed: false,
      remaining: 0,
      resetTime,
      totalRequests: currentCount,
    };
  }

  /**
   * Helper: Criar resultado quando request é permitido
   */
  private async createAllowedResult(
    redisKey: string,
    currentCount: number,
    now: number
  ): Promise<RateLimitResult> {
    // Adiciona o novo request
    await this.redis!.zadd(redisKey, { score: now, member: now.toString() });

    // Define TTL para limpeza automática (2x a janela)
    const ttlSeconds = Math.ceil(this.config.windowMs / 1000) * 2;
    await this.redis!.expire(redisKey, ttlSeconds);

    return {
      allowed: true,
      remaining: this.config.maxRequests - currentCount - 1,
      resetTime: now + this.config.windowMs,
      totalRequests: currentCount + 1,
    };
  }

  /**
   * Verifica se o request é permitido
   */
  async check(key: string): Promise<RateLimitResult> {
    const prefix = this.config.keyPrefix ?? "ratelimit:";
    const redisKey = `${prefix}${key}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    try {
      if (this.redis) {
        return await this.checkWithRedis(redisKey, now, windowStart);
      }

      // In-memory fallback
      const arr = this.inMemoryStore!.get(redisKey) || [];
      const filtered = arr.filter((t) => t >= windowStart);
      if (filtered.length >= this.config.maxRequests) {
        const firstTs = filtered[0];
        return {
          allowed: false,
          remaining: 0,
          resetTime: firstTs + this.config.windowMs,
          totalRequests: filtered.length,
        };
      }

      const newArr = [...filtered, now];
      this.inMemoryStore!.set(redisKey, newArr);

      return {
        allowed: true,
        remaining: this.config.maxRequests - newArr.length,
        resetTime: now + this.config.windowMs,
        totalRequests: newArr.length,
      };
    } catch (error) {
      console.error("[RateLimit] Erro:", error);
      // Em caso de erro, permite o request (fail-open)
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
        totalRequests: 1,
      };
    }
  }

  /**
   * Reseta o contador para uma chave
   */
  async reset(key: string): Promise<void> {
    const prefix = this.config.keyPrefix ?? "ratelimit:";
    const redisKey = `${prefix}${key}`;
    if (this.redis) {
      await this.redis.del(redisKey);
      return;
    }
    this.inMemoryStore?.delete(redisKey);
  }
}

// Instâncias globais de rate limiters
export const globalRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 100, // 100 requests por minuto
  keyPrefix: "ratelimit:global:",
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 100, // 100 requests por minuto por IP
  keyPrefix: "ratelimit:api:",
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 10, // 10 tentativas de auth por 15 min
  keyPrefix: "ratelimit:auth:",
});

/**
 * Middleware de rate limiting para APIs
 */
export async function rateLimitMiddleware(
  identifier: string,
  limiter: RateLimiter = apiRateLimiter
): Promise<{ allowed: boolean; headers: Record<string, string>; error?: string }> {
  const result = await limiter.check(identifier);

  const cfg = limiter.getConfig();

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": cfg.maxRequests.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetTime.toString(),
    "X-RateLimit-Used": result.totalRequests.toString(),
  };

  if (!result.allowed) {
    const seconds = Math.max(0, Math.ceil((result.resetTime - Date.now()) / 1000));
    return {
      allowed: false,
      headers,
      error: `Rate limit exceeded. Try again in ${seconds} seconds.`,
    };
  }

  return { allowed: true, headers };
}
