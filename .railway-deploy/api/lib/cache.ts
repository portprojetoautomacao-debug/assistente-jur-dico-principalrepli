/**
 * Cache Redis com TTL e circuit breaker
 * Cache inteligente para reduzir chamadas a APIs externas
 */

import { Redis } from "@upstash/redis";
import { withCircuitBreaker } from "./circuit-breaker.js";
import { SafeLogger } from "./safe-logger.js";

const logger = new SafeLogger("Cache");

export interface CacheConfig {
  ttl: number; // Tempo de vida em segundos
  prefix?: string; // Prefixo para chaves
  compress?: boolean; // Compressão de dados grandes
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
}

class RedisCache {
  private readonly redis: Redis;
  private readonly config: CacheConfig;
  private stats: CacheStats;
  private readonly name: string;

  constructor(name: string, config: CacheConfig) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Upstash Redis não configurado para cache");
    }

    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    this.name = name;
    this.config = {
      prefix: "cache:",
      compress: false,
      ...config,
    };

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
    };
  }

  /**
   * Gera chave de cache com prefixo
   */
  private getKey(key: string): string {
    return `${this.config.prefix}${this.name}:${key}`;
  }

  /**
   * Obtém valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.getKey(key);

      const result = await withCircuitBreaker(async () => {
        const value = await this.redis.get(cacheKey);
        return value;
      }, "redis");

      if (result === null) {
        this.stats.misses++;
        logger.debug(`Cache miss: ${key}`);
        return null;
      }

      this.stats.hits++;
      logger.debug(`Cache hit: ${key}`);
      return result as T;
    } catch (error) {
      this.stats.errors++;
      logger.error("Erro ao obter do cache", error, { key });
      return null;
    }
  }

  /**
   * Define valor no cache com TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const cacheKey = this.getKey(key);
      const expiry = ttl ?? this.config.ttl;

      const result = await withCircuitBreaker(async () => {
        await this.redis.setex(cacheKey, expiry, value);
        return true;
      }, "redis");

      if (result) {
        this.stats.sets++;
        logger.debug(`Cache set: ${key} (TTL: ${expiry}s)`);
      }

      return result;
    } catch (error) {
      this.stats.errors++;
      logger.error("Erro ao salvar no cache", error, { key });
      return false;
    }
  }

  /**
   * Remove valor do cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const cacheKey = this.getKey(key);

      const result = await withCircuitBreaker(async () => {
        await this.redis.del(cacheKey);
        return true;
      }, "redis");

      if (result) {
        this.stats.deletes++;
        logger.debug(`Cache delete: ${key}`);
      }

      return result;
    } catch (error) {
      this.stats.errors++;
      logger.error("Erro ao remover do cache", error, { key });
      return false;
    }
  }

  /**
   * Verifica se chave existe no cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const cacheKey = this.getKey(key);

      return await withCircuitBreaker(async () => {
        const result = await this.redis.exists(cacheKey);
        return result === 1;
      }, "redis");
    } catch (error) {
      this.stats.errors++;
      logger.error("Erro ao verificar existência no cache", error, { key });
      return false;
    }
  }

  /**
   * Obtém ou define valor (cache aside pattern)
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    // Tenta obter do cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Se não está no cache, executa factory
    const value = await factory();

    // Salva no cache (não bloqueia a resposta)
    this.set(key, value, ttl).catch((error) => {
      logger.error("Erro ao salvar no cache após factory", error, { key });
    });

    return value;
  }

  /**
   * Limpa todo o cache deste namespace
   */
  async clear(): Promise<boolean> {
    try {
      // Usa SCAN para encontrar todas as chaves com o prefixo
      const pattern = this.getKey("*");

      return await withCircuitBreaker(async () => {
        let cursor = 0;
        const keys: string[] = [];

        do {
          const result = await this.redis.scan(cursor, { match: pattern, count: 100 });
          cursor = Number(result[0]);
          keys.push(...result[1]);
        } while (cursor !== 0);

        if (keys.length > 0) {
          await this.redis.del(...keys);
          logger.info(`Cache cleared: ${keys.length} keys removed`);
        }

        return true;
      }, "redis");
    } catch (error) {
      this.stats.errors++;
      logger.error("Erro ao limpar cache", error);
      return false;
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;

    return { ...this.stats };
  }

  /**
   * Reseta estatísticas
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
    };
  }
}

// Instâncias globais de cache
export const djenCache = new RedisCache("djen", {
  ttl: 3600, // 1 hora
  prefix: "cache:",
});

export const sparkCache = new RedisCache("spark", {
  ttl: 1800, // 30 minutos
  prefix: "cache:",
});

export const generalCache = new RedisCache("general", {
  ttl: 300, // 5 minutos
  prefix: "cache:",
});

/**
 * Cache com retry automático
 */
export async function cachedOperation<T>(
  cache: RedisCache,
  key: string,
  operation: () => Promise<T>,
  ttl?: number,
  maxRetries: number = 2
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Tenta obter do cache primeiro
      const cached = await cache.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Executa operação
      const result = await operation();

      // Salva no cache
      await cache.set(key, result, ttl);

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Tentativa ${attempt + 1} falhou`, { key, error: lastError.message });

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Operação falhou após todas as tentativas");
}
