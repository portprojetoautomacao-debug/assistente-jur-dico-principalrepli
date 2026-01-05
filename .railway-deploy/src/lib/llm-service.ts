/**
 * Unified LLM Service Layer
 *
 * Features:
 * - LLM lifecycle management (LLMOps)
 * - Model serving and optimization
 * - Unified governance and observability
 * - Advanced NLP processing capabilities
 *
 * Now using Gemini 2.5 Pro via llm-client.ts
 * Integrated with OpenTelemetry-compatible tracing
 */

import { llm as llmCall } from "./llm-client";
import { tracingService } from "./tracing";

// LLM Models supported
export type LLMModel = "gpt-4o" | "gpt-4" | "gpt-3.5-turbo";

// Performance metrics for observability
export interface LLMMetrics {
  requestId: string;
  model: LLMModel;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  cost: number;
  timestamp: string;
  success: boolean;
  error?: string;
  userId?: string;
  feature?: string;
}

// LLM Request configuration
export interface LLMRequestConfig {
  model?: LLMModel;
  temperature?: number;
  maxTokens?: number;
  useCache?: boolean;
  stream?: boolean;
  retryAttempts?: number;
  timeout?: number;
  feature?: string;
  userId?: string;
}

// Cache entry structure
interface CacheEntry {
  prompt: string;
  response: string;
  model: LLMModel;
  timestamp: number;
  hitCount: number;
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  feature?: string;
  model: LLMModel;
  promptHash: string;
  success: boolean;
  latencyMs: number;
  tokensUsed: number;
  cost: number;
  error?: string;
}

/**
 * LLM Service Class
 * Provides unified interface for all LLM operations with observability
 */
export class LLMService {
  private readonly cache: Map<string, CacheEntry> = new Map();
  private metrics: LLMMetrics[] = [];
  private auditLog: AuditLogEntry[] = [];
  private readonly CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
  private readonly MAX_CACHE_SIZE = 100;
  private readonly COST_PER_1K_TOKENS: Record<LLMModel, number> = {
    "gpt-4o": 0.015,
    "gpt-4": 0.03,
    "gpt-3.5-turbo": 0.002,
  };

  /**
   * Execute LLM request with full observability and caching
   */
  async execute(prompt: string, config: LLMRequestConfig = {}): Promise<string> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const model = config.model || "gpt-4o";
    const promptHash = this.hashPrompt(prompt);

    // Start tracing span
    const span = tracingService.startLLMSpan(model, {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      attributes: {
        "llm.request_id": requestId,
        "llm.feature": config.feature || "unknown",
        "llm.cache_enabled": config.useCache !== false,
        "llm.prompt_hash": promptHash,
      },
    });

    try {
      // Check cache first
      if (config.useCache !== false) {
        const cached = this.getFromCache(promptHash, model);
        if (cached) {
          this.recordCacheHit(requestId, model, config);
          return cached;
        }
      }

      // Execute LLM request with retry logic
      const response = await this.executeWithRetry(prompt, model, config.retryAttempts || 3);

      // Calculate metrics
      const latencyMs = Date.now() - startTime;
      const estimatedTokens = this.estimateTokens(prompt, response);
      const cost = this.calculateCost(estimatedTokens, model);

      // Record metrics
      this.recordMetrics({
        requestId,
        model,
        promptTokens: Math.floor(estimatedTokens * 0.6),
        completionTokens: Math.floor(estimatedTokens * 0.4),
        totalTokens: estimatedTokens,
        latencyMs,
        cost,
        timestamp: new Date().toISOString(),
        success: true,
        userId: config.userId,
        feature: config.feature,
      });

      // Record audit log
      this.recordAudit({
        id: requestId,
        timestamp: new Date().toISOString(),
        userId: config.userId,
        feature: config.feature,
        model,
        promptHash,
        success: true,
        latencyMs,
        tokensUsed: estimatedTokens,
        cost,
      });

      // Update cache
      if (config.useCache !== false) {
        this.addToCache(promptHash, response, model);
      }

      // End tracing span with success
      await tracingService.endLLMSpan(span, {
        promptTokens: Math.floor(estimatedTokens * 0.6),
        completionTokens: Math.floor(estimatedTokens * 0.4),
        success: true,
      });

      return response;
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // End tracing span with error
      await tracingService.endLLMSpan(span, {
        promptTokens: 0,
        completionTokens: 0,
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
      });

      // Record failure metrics
      this.recordMetrics({
        requestId,
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs,
        cost: 0,
        timestamp: new Date().toISOString(),
        success: false,
        error: errorMessage,
        userId: config.userId,
        feature: config.feature,
      });

      // Record audit log
      this.recordAudit({
        id: requestId,
        timestamp: new Date().toISOString(),
        userId: config.userId,
        feature: config.feature,
        model,
        promptHash,
        success: false,
        latencyMs,
        tokensUsed: 0,
        cost: 0,
        error: errorMessage,
      });

      throw error;
    }
  }

  /**
   * Execute LLM request with retry logic
   */
  private async executeWithRetry(
    prompt: string,
    model: LLMModel,
    maxAttempts: number
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await llmCall(prompt, model);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        // Wait before retry (exponential backoff)
        if (attempt < maxAttempts) {
          const waitMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
      }
    }

    throw lastError || new Error("All retry attempts failed");
  }

  /**
   * Execute LLM request with structured JSON output
   */
  async executeJSON<T = unknown>(prompt: string, config: LLMRequestConfig = {}): Promise<T> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const model = config.model || "gpt-4o";

    try {
      const jsonPrompt = prompt;
      const response = await llmCall(jsonPrompt, model, true);

      const latencyMs = Date.now() - startTime;
      const estimatedTokens = this.estimateTokens(prompt, JSON.stringify(response));
      const cost = this.calculateCost(estimatedTokens, model);

      this.recordMetrics({
        requestId,
        model,
        promptTokens: Math.floor(estimatedTokens * 0.6),
        completionTokens: Math.floor(estimatedTokens * 0.4),
        totalTokens: estimatedTokens,
        latencyMs,
        cost,
        timestamp: new Date().toISOString(),
        success: true,
        userId: config.userId,
        feature: config.feature,
      });

      return response as T;
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      this.recordMetrics({
        requestId,
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs,
        cost: 0,
        timestamp: new Date().toISOString(),
        success: false,
        error: errorMessage,
        userId: config.userId,
        feature: config.feature,
      });

      throw error;
    }
  }

  /**
   * Batch processing for multiple prompts
   * Inspired by Databricks distributed processing
   */
  async executeBatch(
    prompts: Array<{ id: string; prompt: string }>,
    config: LLMRequestConfig = {}
  ): Promise<Array<{ id: string; result: string; error?: string }>> {
    const results = await Promise.allSettled(
      prompts.map(async ({ id, prompt }) => {
        const result = await this.execute(prompt, config);
        return { id, result };
      })
    );

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          id: prompts[index].id,
          result: "",
          error: result.reason?.message || "Unknown error",
        };
      }
    });
  }

  /**
   * Get cache from storage
   */
  private getFromCache(promptHash: string, model: LLMModel): string | null {
    const key = `${promptHash}-${model}`;
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if cache is still valid
    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    // Increment hit count
    entry.hitCount++;
    return entry.response;
  }

  /**
   * Add response to cache
   */
  private addToCache(promptHash: string, response: string, model: LLMModel): void {
    const key = `${promptHash}-${model}`;

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      )[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      prompt: promptHash,
      response,
      model,
      timestamp: Date.now(),
      hitCount: 0,
    });
  }

  /**
   * Hash prompt for cache key
   */
  private hashPrompt(prompt: string): string {
    // Simple hash function (in production, use crypto.subtle)
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.codePointAt(i) ?? 0;
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Estimate tokens (rough approximation)
   */
  private estimateTokens(prompt: string, response: string): number {
    const text = prompt + response;
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost based on tokens
   */
  private calculateCost(tokens: number, model: LLMModel): number {
    return (tokens / 1000) * this.COST_PER_1K_TOKENS[model];
  }

  /**
   * Record metrics
   */
  private recordMetrics(metrics: LLMMetrics): void {
    this.metrics.push(metrics);
    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Record cache hit
   */
  private recordCacheHit(requestId: string, model: LLMModel, config: LLMRequestConfig): void {
    this.recordMetrics({
      requestId,
      model,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs: 0,
      cost: 0,
      timestamp: new Date().toISOString(),
      success: true,
      userId: config.userId,
      feature: config.feature,
    });
  }

  /**
   * Record audit log
   */
  private recordAudit(entry: AuditLogEntry): void {
    this.auditLog.push(entry);
    // Keep only last 1000 entries in memory
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  /**
   * Get metrics for observability dashboard
   */
  getMetrics(timeRangeMs?: number): LLMMetrics[] {
    if (!timeRangeMs) return this.metrics;

    const cutoff = Date.now() - timeRangeMs;
    return this.metrics.filter((m) => new Date(m.timestamp).getTime() > cutoff);
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(timeRangeMs: number = 24 * 60 * 60 * 1000) {
    const metrics = this.getMetrics(timeRangeMs);

    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageLatency: 0,
        totalCost: 0,
        totalTokens: 0,
        cacheHitRate: 0,
        requestsByModel: {} as Record<LLMModel, number>,
        requestsByFeature: {} as Record<string, number>,
      };
    }

    const successCount = metrics.filter((m) => m.success).length;
    const cacheHits = metrics.filter((m) => m.totalTokens === 0 && m.success).length;

    const requestsByModel = metrics.reduce(
      (acc, m) => {
        acc[m.model] = (acc[m.model] || 0) + 1;
        return acc;
      },
      {} as Record<LLMModel, number>
    );

    const requestsByFeature = metrics.reduce(
      (acc, m) => {
        if (m.feature) {
          acc[m.feature] = (acc[m.feature] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalRequests: metrics.length,
      successRate: (successCount / metrics.length) * 100,
      averageLatency: metrics.reduce((sum, m) => sum + m.latencyMs, 0) / metrics.length,
      totalCost: metrics.reduce((sum, m) => sum + m.cost, 0),
      totalTokens: metrics.reduce((sum, m) => sum + m.totalTokens, 0),
      cacheHitRate: (cacheHits / metrics.length) * 100,
      requestsByModel,
      requestsByFeature,
    };
  }

  /**
   * Get audit log
   */
  getAuditLog(limit: number = 100): AuditLogEntry[] {
    return this.auditLog.slice(-limit).reverse();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      totalHits: entries.reduce((sum, e) => sum + e.hitCount, 0),
      averageAge:
        entries.length > 0
          ? entries.reduce((sum, e) => sum + (Date.now() - e.timestamp), 0) / entries.length
          : 0,
    };
  }
}

// Export singleton instance
export const llmService = new LLMService();
