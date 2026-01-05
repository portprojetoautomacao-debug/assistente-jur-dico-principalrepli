/**
 * Agent Cache - Sistema de Cache Redis/Memória para Resultados de Agentes
 *
 * Implementa cache híbrido (Redis + fallback em memória) para:
 * - Respostas de agentes (TTL: 1 hora)
 * - Embeddings (TTL: 24 horas - determinísticos)
 * - Pesquisas Qdrant (TTL: 15 minutos)
 *
 * @module agent-cache
 * @version 1.0.0
 * @since 2025-01-04
 */

import { Redis } from "@upstash/redis";
import { getEnv } from "./env-helper.js";

export interface CacheConfig {
  ttlSeconds?: number;
  prefix?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
  usingRedis: boolean;
}

interface MemoryCacheEntry<T> {
  value: T;
  expiresAt: number;
}

export const CACHE_TTL = {
  AGENT_RESPONSE: 3600,
  EMBEDDINGS: 86400,
  QDRANT_SEARCH: 900,
  SHORT: 300,
  MEDIUM: 1800,
  LONG: 7200,
} as const;

export type CacheTTLType = keyof typeof CACHE_TTL;

export class AgentCache {
  private redis: Redis | null = null;
  private readonly memoryCache: Map<string, MemoryCacheEntry<unknown>> = new Map();
  private readonly defaultTtl: number;
  private readonly prefix: string;
  private stats: Omit<CacheStats, "size" | "hitRate" | "usingRedis">;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: CacheConfig = {}) {
    this.defaultTtl = config.ttlSeconds ?? CACHE_TTL.AGENT_RESPONSE;
    this.prefix = config.prefix ?? "agent:";
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };

    this.initializeRedis();
    this.startCleanupTimer();
  }

  private initializeRedis(): void {
    const url = getEnv("UPSTASH_REDIS_REST_URL").trim();
    const token = getEnv("UPSTASH_REDIS_REST_TOKEN").trim();

    if (url && token) {
      try {
        this.redis = new Redis({ url, token });
        console.log("[AgentCache] Redis inicializado com sucesso");
      } catch (error) {
        console.warn("[AgentCache] Falha ao inicializar Redis, usando cache em memória", error);
        this.redis = null;
      }
    } else {
      console.log("[AgentCache] Redis não configurado, usando cache em memória");
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000);

    if (typeof this.cleanupTimer === "object" && "unref" in this.cleanupTimer) {
      this.cleanupTimer.unref();
    }
  }

  private cleanupExpiredEntries(): void {
    if (this.redis) return;

    const now = Date.now();
    const entries = Array.from(this.memoryCache.entries());
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  private buildKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  public buildAgentKey(agentName: string, hash: string): string {
    return `${agentName}:${hash}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.buildKey(key);

    try {
      if (this.redis) {
        const value = await this.redis.get<T>(fullKey);
        if (value !== null && value !== undefined) {
          this.stats.hits++;
          return value;
        }
        this.stats.misses++;
        return null;
      }

      const entry = this.memoryCache.get(fullKey) as MemoryCacheEntry<T> | undefined;
      if (entry) {
        if (entry.expiresAt > Date.now()) {
          this.stats.hits++;
          return entry.value;
        }
        this.memoryCache.delete(fullKey);
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      console.error("[AgentCache] Erro ao obter do cache", { key, error });
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const fullKey = this.buildKey(key);
    const ttl = ttlSeconds ?? this.defaultTtl;

    try {
      if (this.redis) {
        await this.redis.setex(fullKey, ttl, value);
      } else {
        this.memoryCache.set(fullKey, {
          value,
          expiresAt: Date.now() + ttl * 1000,
        });
      }
      this.stats.sets++;
    } catch (error) {
      console.error("[AgentCache] Erro ao salvar no cache", { key, error });
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.buildKey(key);

    try {
      if (this.redis) {
        await this.redis.del(fullKey);
      } else {
        this.memoryCache.delete(fullKey);
      }
      this.stats.deletes++;
    } catch (error) {
      console.error("[AgentCache] Erro ao deletar do cache", { key, error });
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.redis) {
        let cursor = 0;
        const pattern = `${this.prefix}*`;

        do {
          const result = await this.redis.scan(cursor, { match: pattern, count: 100 });
          cursor = Number(result[0]);
          const keys = result[1];

          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        } while (cursor !== 0);
      } else {
        const keysToDelete = Array.from(this.memoryCache.keys()).filter((key) =>
          key.startsWith(this.prefix)
        );
        for (const key of keysToDelete) {
          this.memoryCache.delete(key);
        }
      }
      console.log("[AgentCache] Cache limpo");
    } catch (error) {
      console.error("[AgentCache] Erro ao limpar cache", error);
    }
  }

  async invalidateByPrefix(agentPrefix: string): Promise<number> {
    const fullPrefix = this.buildKey(agentPrefix);
    let deletedCount = 0;

    try {
      if (this.redis) {
        let cursor = 0;
        const pattern = `${fullPrefix}*`;

        do {
          const result = await this.redis.scan(cursor, { match: pattern, count: 100 });
          cursor = Number(result[0]);
          const keys = result[1];

          if (keys.length > 0) {
            await this.redis.del(...keys);
            deletedCount += keys.length;
          }
        } while (cursor !== 0);
      } else {
        const keysToDelete = Array.from(this.memoryCache.keys()).filter((key) =>
          key.startsWith(fullPrefix)
        );
        for (const key of keysToDelete) {
          this.memoryCache.delete(key);
          deletedCount++;
        }
      }

      console.log(`[AgentCache] Invalidadas ${deletedCount} chaves com prefixo: ${agentPrefix}`);
      return deletedCount;
    } catch (error) {
      console.error("[AgentCache] Erro ao invalidar por prefixo", { agentPrefix, error });
      return 0;
    }
  }

  async invalidateAgent(agentName: string): Promise<number> {
    return this.invalidateByPrefix(`${agentName}:`);
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.memoryCache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      usingRedis: this.redis !== null,
    };
  }

  resetStats(): void {
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }

  isUsingRedis(): boolean {
    return this.redis !== null;
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

export class AgentCachePresets {
  private readonly agentResponseCache: AgentCache;
  private readonly embeddingsCache: AgentCache;
  private readonly qdrantSearchCache: AgentCache;

  constructor() {
    this.agentResponseCache = new AgentCache({
      ttlSeconds: CACHE_TTL.AGENT_RESPONSE,
      prefix: "agent:response:",
    });

    this.embeddingsCache = new AgentCache({
      ttlSeconds: CACHE_TTL.EMBEDDINGS,
      prefix: "agent:embeddings:",
    });

    this.qdrantSearchCache = new AgentCache({
      ttlSeconds: CACHE_TTL.QDRANT_SEARCH,
      prefix: "agent:qdrant:",
    });
  }

  async getAgentResponse<T>(agentName: string, hash: string): Promise<T | null> {
    return this.agentResponseCache.get<T>(`${agentName}:${hash}`);
  }

  async setAgentResponse<T>(agentName: string, hash: string, value: T): Promise<void> {
    await this.agentResponseCache.set(`${agentName}:${hash}`, value);
  }

  async getEmbedding(hash: string): Promise<number[] | null> {
    return this.embeddingsCache.get<number[]>(hash);
  }

  async setEmbedding(hash: string, embedding: number[]): Promise<void> {
    await this.embeddingsCache.set(hash, embedding);
  }

  async getQdrantSearch<T>(queryHash: string): Promise<T | null> {
    return this.qdrantSearchCache.get<T>(queryHash);
  }

  async setQdrantSearch<T>(queryHash: string, results: T): Promise<void> {
    await this.qdrantSearchCache.set(queryHash, results);
  }

  async invalidateAgent(agentName: string): Promise<number> {
    return this.agentResponseCache.invalidateAgent(agentName);
  }

  async clearAll(): Promise<void> {
    await Promise.all([
      this.agentResponseCache.clear(),
      this.embeddingsCache.clear(),
      this.qdrantSearchCache.clear(),
    ]);
  }

  getAllStats(): Record<string, CacheStats> {
    return {
      agentResponse: this.agentResponseCache.getStats(),
      embeddings: this.embeddingsCache.getStats(),
      qdrantSearch: this.qdrantSearchCache.getStats(),
    };
  }

  destroy(): void {
    this.agentResponseCache.destroy();
    this.embeddingsCache.destroy();
    this.qdrantSearchCache.destroy();
  }
}

let defaultInstance: AgentCache | null = null;
let presetsInstance: AgentCachePresets | null = null;

export function getDefaultAgentCache(): AgentCache {
  if (!defaultInstance) {
    defaultInstance = new AgentCache();
  }
  return defaultInstance;
}

export function getAgentCachePresets(): AgentCachePresets {
  if (!presetsInstance) {
    presetsInstance = new AgentCachePresets();
  }
  return presetsInstance;
}

export function createHashKey(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export async function cachedAgentCall<T>(
  agentName: string,
  input: string,
  operation: () => Promise<T>,
  ttlType: CacheTTLType = "AGENT_RESPONSE"
): Promise<T> {
  const cache = getDefaultAgentCache();
  const hash = createHashKey(input);
  const key = `${agentName}:${hash}`;

  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const result = await operation();
  await cache.set(key, result, CACHE_TTL[ttlType]);
  return result;
}
