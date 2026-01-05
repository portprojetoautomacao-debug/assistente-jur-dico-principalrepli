/**
 * Rate Limiter - Sliding Window Algorithm
 *
 * Implementa rate limiting por usuário/agente usando sliding window.
 * Armazena em memória por padrão, com suporte opcional a Redis.
 *
 * @module rate-limiter
 * @version 1.0.0
 * @since 2025-01-04
 *
 * @example
 * ```typescript
 * const rateLimiter = new RateLimiter();
 * if (!rateLimiter.isAllowed(`user:${userId}`, 100, 60000)) {
 *   throw new Error("Rate limit exceeded");
 * }
 * ```
 */

export interface RateLimiterConfig {
  cleanupIntervalMs?: number;
  maxKeys?: number;
}

interface RequestRecord {
  timestamps: number[];
  lastCleanup: number;
}

interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  limit: number;
}

export class RateLimiter {
  private readonly store: Map<string, RequestRecord> = new Map();
  private readonly cleanupIntervalMs: number;
  private readonly maxKeys: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: RateLimiterConfig = {}) {
    this.cleanupIntervalMs = config.cleanupIntervalMs ?? 60000;
    this.maxKeys = config.maxKeys ?? 10000;

    this.startCleanupTimer();
  }

  /**
   * Verifica se uma requisição é permitida usando sliding window.
   *
   * @param key - Identificador único (ex: `user:123`, `agent:gemini`)
   * @param limit - Número máximo de requisições permitidas na janela
   * @param windowMs - Tamanho da janela em milissegundos
   * @returns true se permitido, false se rate limit excedido
   */
  isAllowed(key: string, limit: number, windowMs: number): boolean {
    return this.check(key, limit, windowMs).allowed;
  }

  /**
   * Verifica rate limit e retorna informações detalhadas.
   *
   * @param key - Identificador único
   * @param limit - Número máximo de requisições
   * @param windowMs - Tamanho da janela em ms
   * @returns Objeto com status, remaining, resetMs
   */
  check(key: string, limit: number, windowMs: number): RateLimitInfo {
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = this.store.get(key);

    if (!record) {
      record = { timestamps: [], lastCleanup: now };
      this.store.set(key, record);
    }

    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    const currentCount = record.timestamps.length;
    const remaining = Math.max(0, limit - currentCount);
    const oldestInWindow = record.timestamps[0];
    const resetMs = oldestInWindow ? oldestInWindow + windowMs - now : 0;

    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetMs: Math.max(0, resetMs),
        limit,
      };
    }

    record.timestamps.push(now);

    return {
      allowed: true,
      remaining: remaining - 1,
      resetMs: windowMs,
      limit,
    };
  }

  /**
   * Obtém informações do rate limit sem consumir uma requisição.
   */
  peek(key: string, limit: number, windowMs: number): RateLimitInfo {
    const now = Date.now();
    const windowStart = now - windowMs;

    const record = this.store.get(key);

    if (!record) {
      return {
        allowed: true,
        remaining: limit,
        resetMs: 0,
        limit,
      };
    }

    const validTimestamps = record.timestamps.filter((ts) => ts > windowStart);
    const currentCount = validTimestamps.length;
    const remaining = Math.max(0, limit - currentCount);
    const oldestInWindow = validTimestamps[0];
    const resetMs = oldestInWindow ? oldestInWindow + windowMs - now : 0;

    return {
      allowed: currentCount < limit,
      remaining,
      resetMs: Math.max(0, resetMs),
      limit,
    };
  }

  /**
   * Reseta o rate limit para uma chave específica.
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Reseta todos os rate limits.
   */
  resetAll(): void {
    this.store.clear();
  }

  /**
   * Obtém o número de chaves ativas no store.
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Para o timer de limpeza (útil para testes).
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);

    if (typeof this.cleanupTimer === "object" && "unref" in this.cleanupTimer) {
      this.cleanupTimer.unref();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 3600000;

    if (this.store.size > this.maxKeys) {
      const entries = Array.from(this.store.entries());
      entries.sort((a, b) => a[1].lastCleanup - b[1].lastCleanup);

      const toDelete = entries.slice(0, Math.floor(this.maxKeys * 0.2));
      for (const [key] of toDelete) {
        this.store.delete(key);
      }
    }

    for (const [key, record] of this.store.entries()) {
      if (record.timestamps.length === 0 && now - record.lastCleanup > maxAge) {
        this.store.delete(key);
      }
    }
  }
}

export class RateLimiterPresets {
  private readonly limiter: RateLimiter;

  private readonly presets: Record<string, { limit: number; windowMs: number }> = {
    gemini: { limit: 60, windowMs: 60000 },
    "gemini-burst": { limit: 10, windowMs: 1000 },
    user: { limit: 100, windowMs: 60000 },
    agent: { limit: 200, windowMs: 60000 },
    api: { limit: 1000, windowMs: 60000 },
    strict: { limit: 10, windowMs: 60000 },
  };

  constructor(limiter?: RateLimiter) {
    this.limiter = limiter ?? new RateLimiter();
  }

  isAllowed(key: string, preset: keyof typeof this.presets): boolean {
    const config = this.presets[preset];
    if (!config) {
      throw new Error(`Unknown rate limit preset: ${preset}`);
    }
    return this.limiter.isAllowed(key, config.limit, config.windowMs);
  }

  check(key: string, preset: keyof typeof this.presets): RateLimitInfo {
    const config = this.presets[preset];
    if (!config) {
      throw new Error(`Unknown rate limit preset: ${preset}`);
    }
    return this.limiter.check(key, config.limit, config.windowMs);
  }

  addPreset(name: string, limit: number, windowMs: number): void {
    this.presets[name] = { limit, windowMs };
  }

  getLimiter(): RateLimiter {
    return this.limiter;
  }
}

let defaultInstance: RateLimiter | null = null;

export function getDefaultRateLimiter(): RateLimiter {
  if (!defaultInstance) {
    defaultInstance = new RateLimiter();
  }
  return defaultInstance;
}

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  return !getDefaultRateLimiter().isAllowed(key, limit, windowMs);
}
