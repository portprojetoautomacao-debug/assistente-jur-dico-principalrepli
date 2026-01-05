/**
 * Legal Memory - Sistema de Memória de Longo Prazo para Agentes Jurídicos
 *
 * ============================================================================
 * PLANO MESTRE - FASE 3: Memória Jurídica
 * ============================================================================
 * - Armazenamento de contexto jurídico relevante
 * - Recuperação de precedentes e estratégias anteriores
 * - Interface para futura integração com Vector DB
 */

import { Redis } from "@upstash/redis";
import { z } from "zod";
import { getEnv } from "./env-helper.js";

// ============================================================================
// REDIS HELPER
// ============================================================================

const redisUrl = getEnv("UPSTASH_REDIS_REST_URL").trim();
const redisToken = getEnv("UPSTASH_REDIS_REST_TOKEN").trim();

let _redisClient: Redis | null = null;

function getRedisOrNull(): Redis | null {
  if (!redisUrl || !redisToken) return null;
  _redisClient ??= new Redis({
    url: redisUrl,
    token: redisToken,
  });
  return _redisClient;
}

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export const LegalContextTypeSchema = z.enum([
  "precedente",
  "estrategia",
  "peca_processual",
  "decisao_judicial",
  "artigo_lei",
  "anotacao_usuario",
]);

export type LegalContextType = z.infer<typeof LegalContextTypeSchema>;

export const LegalContextItemSchema = z.object({
  id: z.string(),
  type: LegalContextTypeSchema,
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  relevanceScore: z.number().optional(), // 0 a 1
});

export type LegalContextItem = z.infer<typeof LegalContextItemSchema>;

export interface LegalMemorySearchOptions {
  query: string;
  type?: LegalContextType;
  limit?: number;
  minRelevance?: number;
  tags?: string[];
}

// ============================================================================
// CLASS
// ============================================================================

export class LegalMemory {
  private static instance: LegalMemory;
  private readonly memoryCache: Map<string, LegalContextItem> = new Map();

  private constructor() {
    // Inicialização (futuramente conectar com Vector DB)
  }

  public static getInstance(): LegalMemory {
    if (!LegalMemory.instance) {
      LegalMemory.instance = new LegalMemory();
    }
    return LegalMemory.instance;
  }

  /**
   * Carrega memória do KV Storage
   */
  private async loadFromKV(): Promise<void> {
    try {
      const redis = getRedisOrNull();
      if (!redis) {
        console.warn("[LegalMemory] No Redis available");
        return;
      }

      const items = await redis.get<LegalContextItem[]>("legal-memory");
      if (items && Array.isArray(items)) {
        this.memoryCache.clear();
        for (const item of items) {
          this.memoryCache.set(item.id, item);
        }
        console.log(`[LegalMemory] Carregados ${items.length} itens do Redis`);
      }
    } catch (error) {
      console.error("[LegalMemory] Failed to load from Redis", error);
    }
  }

  /**
   * Adiciona um novo item ao contexto jurídico
   */
  public async addContext(
    content: string,
    type: LegalContextType,
    metadata: Record<string, unknown> = {},
    tags: string[] = []
  ): Promise<LegalContextItem> {
    const item: LegalContextItem = {
      id: crypto.randomUUID(),
      type,
      content,
      metadata,
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      relevanceScore: 1,
    };

    // Validação Zod
    const validatedItem = LegalContextItemSchema.parse(item);

    // Armazenar (por enquanto em memória/cache)
    this.memoryCache.set(validatedItem.id, validatedItem);

    // Persistir no Redis (apenas se estiver disponível)
    const redis = getRedisOrNull();
    if (redis) {
      try {
        // Buscar memória existente
        const existingMemory = await redis.get<LegalContextItem[]>("legal-memory");
        const memory = existingMemory ?? [];

        // Adicionar novo item
        const newMemory = [...memory, validatedItem];
        await redis.set("legal-memory", newMemory);
      } catch (error) {
        console.error("[LegalMemory] Failed to persist to Redis", error);
      }
    }

    console.log(`[LegalMemory] Contexto adicionado: ${validatedItem.id} (${type})`);
    return validatedItem;
  }

  /**
   * Busca contexto relevante baseado em uma query
   * (Simulação de busca semântica por enquanto)
   */
  public async search(options: LegalMemorySearchOptions): Promise<LegalContextItem[]> {
    // Se cache estiver vazio, tenta carregar do KV
    if (this.memoryCache.size === 0) {
      await this.loadFromKV();
    }

    const { query, type, limit = 5, tags } = options;
    const results: LegalContextItem[] = [];

    // Busca simples por string inclusion (placeholder para busca vetorial)
    for (const item of this.memoryCache.values()) {
      if (type && item.type !== type) continue;
      if (tags && tags.length > 0) {
        const hasTag = tags.some((t) => item.tags?.includes(t));
        if (!hasTag) continue;
      }

      if (item.content.toLowerCase().includes(query.toLowerCase())) {
        results.push(item);
      }
    }

    return results.slice(0, limit);
  }

  /**
   * Recupera um item específico pelo ID
   */
  public async getById(id: string): Promise<LegalContextItem | null> {
    return this.memoryCache.get(id) || null;
  }

  /**
   * Atualiza um item de memória
   */
  public async update(
    id: string,
    updates: Partial<Omit<LegalContextItem, "id" | "createdAt">>
  ): Promise<LegalContextItem | null> {
    const item = this.memoryCache.get(id);
    if (!item) return null;

    const updatedItem = {
      ...item,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Validar novamente
    const validated = LegalContextItemSchema.parse(updatedItem);
    this.memoryCache.set(id, validated);

    return validated;
  }
}

// Export singleton helper
export const legalMemory = LegalMemory.getInstance();
