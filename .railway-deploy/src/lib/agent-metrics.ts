/**
 * Agent Metrics Collector
 *
 * Sistema de coleta e an�lise de m�tricas de performance dos agentes IA.
 * Compat�vel com Sentry AI Monitoring e dashboards customizados.
 *
 * M�tricas coletadas:
 * - Lat�ncia m�dia por agente
 * - Taxa de sucesso/erro
 * - Uso de tokens
 * - Throughput (chamadas/minuto)
 * - Tempo de execu��o por tipo de tarefa
 */

export interface AgentMetric {
  agentId: string;
  timestamp: number;
  duration: number;
  success: boolean;
  tokensUsed?: number;
  taskType?: string;
  error?: string;
}

export interface AgentStats {
  agentId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  totalTokens: number;
  throughput: number; // executions per minute
  errorRate: number; // percentage
  lastUpdated: number;
}

class AgentMetricsCollector {
  private metrics: Map<string, AgentMetric[]> = new Map();
  private readonly maxMetricsPerAgent = 1000;
  private readonly metricsWindowMs = 60 * 60 * 1000; // 1 hour

  /**
   * Registra uma nova m�trica de execu��o de agente
   */
  recordMetric(metric: AgentMetric): void {
    const agentMetrics = this.metrics.get(metric.agentId) || [];

    // Adiciona nova m�trica
    agentMetrics.push(metric);

    // Remove m�tricas antigas (fora da janela de tempo)
    const cutoffTime = Date.now() - this.metricsWindowMs;
    const filteredMetrics = agentMetrics.filter((m) => m.timestamp > cutoffTime);

    // Limita ao m�ximo de m�tricas por agente
    if (filteredMetrics.length > this.maxMetricsPerAgent) {
      filteredMetrics.shift();
    }

    this.metrics.set(metric.agentId, filteredMetrics);
  }

  /**
   * Obt�m estat�sticas agregadas de um agente
   */
  getAgentStats(agentId: string): AgentStats | null {
    const agentMetrics = this.metrics.get(agentId);

    if (!agentMetrics || agentMetrics.length === 0) {
      return null;
    }

    const totalExecutions = agentMetrics.length;
    const successfulExecutions = agentMetrics.filter((m) => m.success).length;
    const failedExecutions = totalExecutions - successfulExecutions;

    // Calcula lat�ncia m�dia
    const totalDuration = agentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageLatency = totalDuration / totalExecutions;

    // Calcula percentis de lat�ncia
    const sortedDurations = agentMetrics.map((m) => m.duration).sort((a, b) => a - b);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p99Index = Math.floor(sortedDurations.length * 0.99);
    const p95Latency = sortedDurations[p95Index] || 0;
    const p99Latency = sortedDurations[p99Index] || 0;

    // Calcula total de tokens
    const totalTokens = agentMetrics.reduce((sum, m) => sum + (m.tokensUsed || 0), 0);

    // Calcula throughput (execu��es por minuto)
    const oldestTimestamp = Math.min(...agentMetrics.map((m) => m.timestamp));
    const timeWindowMs = Date.now() - oldestTimestamp;
    const throughput = (totalExecutions / timeWindowMs) * 60 * 1000;

    // Calcula taxa de erro
    const errorRate = (failedExecutions / totalExecutions) * 100;

    return {
      agentId,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageLatency,
      p95Latency,
      p99Latency,
      totalTokens,
      throughput,
      errorRate,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Obt�m estat�sticas de todos os agentes
   */
  getAllStats(): AgentStats[] {
    const stats: AgentStats[] = [];

    for (const agentId of this.metrics.keys()) {
      const agentStats = this.getAgentStats(agentId);
      if (agentStats) {
        stats.push(agentStats);
      }
    }

    // Ordena por total de execu��es (mais ativo primeiro)
    return stats.sort((a, b) => b.totalExecutions - a.totalExecutions);
  }

  /**
   * Detecta agentes com problemas de performance
   */
  getUnhealthyAgents(
    thresholds: {
      maxLatencyMs?: number;
      maxErrorRate?: number;
    } = {}
  ): AgentStats[] {
    const { maxLatencyMs = 5000, maxErrorRate = 10 } = thresholds;

    const allStats = this.getAllStats();

    return allStats.filter((stats) => {
      // Precisa ter execu��es suficientes para avaliar
      if (stats.totalExecutions < 5) return false;

      // Verifica lat�ncia P95
      if (stats.p95Latency > maxLatencyMs) return true;

      // Verifica taxa de erro
      if (stats.errorRate > maxErrorRate) return true;

      return false;
    });
  }

  /**
   * Limpa m�tricas antigas (para economizar mem�ria)
   */
  cleanup(): void {
    const cutoffTime = Date.now() - this.metricsWindowMs;

    for (const [agentId, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter((m) => m.timestamp > cutoffTime);

      if (filteredMetrics.length === 0) {
        this.metrics.delete(agentId);
      } else {
        this.metrics.set(agentId, filteredMetrics);
      }
    }
  }

  /**
   * Exporta m�tricas para formato compat�vel com Sentry
   */
  exportForSentry(agentId: string): Record<string, number> {
    const stats = this.getAgentStats(agentId);

    if (!stats) {
      return {};
    }

    return {
      "agent.total_executions": stats.totalExecutions,
      "agent.success_rate": (stats.successfulExecutions / stats.totalExecutions) * 100 || 0,
      "agent.error_rate": stats.errorRate,
      "agent.avg_latency_ms": stats.averageLatency,
      "agent.p95_latency_ms": stats.p95Latency,
      "agent.p99_latency_ms": stats.p99Latency,
      "agent.total_tokens": stats.totalTokens,
      "agent.throughput_per_min": stats.throughput,
    };
  }

  /**
   * Reseta todas as m�tricas
   */
  reset(): void {
    this.metrics.clear();
  }
}

// Singleton instance
export const metricsCollector = new AgentMetricsCollector();

// Cleanup automático a cada 5 minutos
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;
if (typeof setInterval !== "undefined") {
  cleanupIntervalId = setInterval(
    () => {
      metricsCollector.cleanup();
    },
    5 * 60 * 1000
  );
}

/**
 * Limpa o interval de cleanup (útil para testes e HMR)
 */
export function stopMetricsCleanup(): void {
  if (cleanupIntervalId !== null) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
}

/**
 * Hook React para acessar m�tricas em tempo real
 */
export function useAgentMetrics(agentId?: string) {
  if (agentId) {
    return metricsCollector.getAgentStats(agentId);
  }

  return metricsCollector.getAllStats();
}

/**
 * Middleware para tracking autom�tico de m�tricas
 */
export function withMetrics<T extends (...args: any[]) => Promise<any>>(agentId: string, fn: T): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;
    let tokensUsed: number | undefined;

    try {
      const result = await fn(...args);

      // Extrai tokens se dispon�vel no resultado
      if (result && typeof result === "object" && "tokensUsed" in result) {
        tokensUsed = result.tokensUsed;
      }

      return result;
    } catch (e) {
      success = false;
      error = e instanceof Error ? e.message : "Unknown error";
      throw e;
    } finally {
      const duration = Date.now() - startTime;

      metricsCollector.recordMetric({
        agentId,
        timestamp: Date.now(),
        duration,
        success,
        tokensUsed,
        error,
      });
    }
  }) as T;
}

/**
 * Detecta agentes com problemas de performance
 */
export function getUnhealthyAgents(thresholds: {
  maxLatencyMs?: number;
  maxErrorRate?: number;
}): AgentStats[] {
  const { maxLatencyMs = 5000, maxErrorRate = 10 } = thresholds;

  const allStats = metricsCollector.getAllStats();

  return allStats.filter((stats) => {
    // Precisa ter execu��es suficientes para avaliar
    if (stats.totalExecutions < 5) return false;

    // Verifica lat�ncia P95
    if (stats.p95Latency > maxLatencyMs) return true;

    // Verifica taxa de erro
    if (stats.errorRate > maxErrorRate) return true;

    return false;
  });
}
