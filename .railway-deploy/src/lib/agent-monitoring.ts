/**
 * Agent Monitoring - Sistema de Observabilidade para Agentes IA
 *
 * ============================================================================
 * PLANO MESTRE - FASE 4: Monitoramento e Observabilidade
 * ============================================================================
 * - Rastreamento de ações dos agentes
 * - Métricas de performance e sucesso
 * - Integração com Sentry para alertas
 */

import { Redis } from "@upstash/redis";
import { AgentStatus } from "./agents.js";
import { getEnv } from "./env-helper.js";

// ============================================================================
// TIPOS PARA FUNÇÕES DE MONITORAMENTO
// ============================================================================

type CaptureErrorFn = (error: Error, context?: Record<string, unknown>) => void;
type CaptureMessageFn = (message: string, level?: string) => void;
type TrackMetricFn = (name: string, value?: number, tags?: Record<string, string>) => void;
type WithSpanFn = <T>(
  name: string,
  op: string,
  callback: () => Promise<T>,
  attributes?: Record<string, string | number>
) => Promise<T>;

interface SentryFunctions {
  captureError: CaptureErrorFn;
  captureMessage: CaptureMessageFn;
  trackMetric: TrackMetricFn;
  withSpan: WithSpanFn;
}

// ============================================================================
// STUBS PARA AMBIENTE SERVERLESS (Node.js / Vercel Functions)
// ============================================================================

const isServerSide = globalThis.window === undefined;

// Funções stub para ambiente serverless
const stubFunctions: SentryFunctions = {
  captureError: (error: Error, context?: Record<string, unknown>) => {
    console.error("[AgentMonitor] Error captured:", error.message, context);
  },
  captureMessage: (message: string, level: string = "info") => {
    console.log(`[AgentMonitor] [${level}] ${message}`);
  },
  trackMetric: (_name: string, _value: number = 1, _tags?: Record<string, string>) => {
    // No-op em serverless - métricas são opcionais
  },
  withSpan: async <T>(
    _name: string,
    _op: string,
    callback: () => Promise<T>,
    _attributes?: Record<string, string | number>
  ): Promise<T> => {
    return callback();
  },
};

// Carrega funções reais do Sentry apenas no browser
let _sentryFunctions: SentryFunctions | null = null;

async function getSentryFunctions(): Promise<SentryFunctions> {
  if (isServerSide) {
    return stubFunctions;
  }

  if (!_sentryFunctions) {
    try {
      const errorTracking = await import("../services/error-tracking.js");
      _sentryFunctions = {
        captureError: errorTracking.captureError,
        captureMessage: errorTracking.captureMessage as CaptureMessageFn,
        trackMetric: errorTracking.trackMetric,
        withSpan: errorTracking.withSpan,
      };
    } catch {
      // Fallback se o import falhar
      _sentryFunctions = stubFunctions;
    }
  }

  return _sentryFunctions;
}

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

export interface AgentActionLog {
  agentId: string;
  action: string;
  details?: Record<string, unknown>;
  timestamp: string;
  success: boolean;
  durationMs?: number;
}

export class AgentMonitor {
  private static instance: AgentMonitor;

  private constructor() {}

  public static getInstance(): AgentMonitor {
    if (!AgentMonitor.instance) {
      AgentMonitor.instance = new AgentMonitor();
    }
    return AgentMonitor.instance;
  }

  /**
   * Registra uma ação executada por um agente
   */
  public async logAction(
    agentId: string,
    action: string,
    details?: Record<string, unknown>,
    success: boolean = true,
    durationMs?: number
  ) {
    const log: AgentActionLog = {
      agentId,
      action,
      details,
      timestamp: new Date().toISOString(),
      success,
      durationMs,
    };

    // Log no console (dev)
    console.log(`[AgentMonitor] ${agentId} -> ${action} (${success ? "OK" : "FAIL"})`, log);

    // Enviar métrica para Sentry (apenas no browser)
    const sentry = await getSentryFunctions();
    sentry.trackMetric("agent_action_count", 1, {
      agentId,
      action,
      success: String(success),
    });

    if (durationMs) {
      sentry.trackMetric("agent_action_duration", durationMs, {
        agentId,
        action,
      });
    }

    if (!success) {
      sentry.captureMessage(`Agent Action Failed: ${agentId} - ${action}`, "warning");
    }

    // Persistir no Redis (apenas se estiver disponível)
    const redis = getRedisOrNull();
    if (redis) {
      try {
        // Buscar logs existentes
        const existingLogs = await redis.get<AgentActionLog[]>("agent-logs");
        const logs = existingLogs ?? [];

        // Manter apenas os últimos 50 logs para não estourar o limite
        const newLogs = [log, ...logs].slice(0, 50);
        await redis.set("agent-logs", newLogs);
      } catch (error) {
        console.error("[AgentMonitor] Failed to persist log to Redis", error);
      }
    }
  }

  /**
   * Monitora a execução de uma tarefa
   */
  public async trackTaskExecution<T>(
    taskId: string,
    agentId: string,
    taskType: string,
    executionFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance === undefined ? Date.now() : performance.now();
    const sentry = await getSentryFunctions();

    try {
      // Envolve a execução em um span
      const result = await sentry.withSpan(
        `agent_task_${taskType}`,
        "agent.task",
        async () => await executionFn(),
        { agentId, taskId, taskType }
      );

      const duration = (performance === undefined ? Date.now() : performance.now()) - startTime;
      await this.logAction(agentId, `execute_task_${taskType}`, { taskId }, true, duration);

      sentry.trackMetric("agent_task_success", 1, { agentId, taskType });

      return result;
    } catch (error) {
      const duration = (performance === undefined ? Date.now() : performance.now()) - startTime;
      await this.logAction(agentId, `execute_task_${taskType}`, { taskId, error }, false, duration);

      sentry.trackMetric("agent_task_failure", 1, { agentId, taskType });
      sentry.captureError(error instanceof Error ? error : new Error(String(error)), {
        agentId,
        taskId,
        taskType,
      });

      throw error;
    }
  }

  /**
   * Registra mudança de status do agente
   */
  public async logStatusChange(agentId: string, oldStatus: AgentStatus, newStatus: AgentStatus) {
    console.log(`[AgentMonitor] ${agentId}: ${oldStatus} -> ${newStatus}`);
    const sentry = await getSentryFunctions();
    sentry.trackMetric("agent_status_change", 1, {
      agentId,
      from: oldStatus,
      to: newStatus,
    });
  }
}

export const agentMonitor = AgentMonitor.getInstance();
