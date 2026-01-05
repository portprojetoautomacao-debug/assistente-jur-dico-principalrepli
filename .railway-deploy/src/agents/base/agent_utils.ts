/**
 * Agent Utilities - Padrões de Robustez Baseados no Google ADK
 *
 * Este módulo implementa padrões de resiliência identificados no Agent Starter Pack:
 * - Graceful Degradation com fallback
 * - Circuit Breaker para evitar cascata de falhas
 * - Validação de configuração
 * - Health checks
 * - Structured error handling
 */

export interface ServiceHealth {
  serviceName: string;
  status: "healthy" | "degraded" | "unhealthy";
  lastCheck: number;
  errorCount: number;
  lastError?: string;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxCalls: number;
}

export type CircuitState = "closed" | "open" | "half-open";

const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  halfOpenMaxCalls: 3,
};

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount = 0;
  private lastFailureTime = 0;
  private halfOpenCalls = 0;
  private config: CircuitBreakerConfig;
  private serviceName: string;

  constructor(serviceName: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.serviceName = serviceName;
    this.config = { ...DEFAULT_CIRCUIT_CONFIG, ...config };
  }

  async execute<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    if (this.state === "open") {
      if (this.shouldAttemptReset()) {
        this.state = "half-open";
        this.halfOpenCalls = 0;
      } else {
        console.warn(`[CircuitBreaker:${this.serviceName}] Circuit OPEN - using fallback`);
        if (fallback) {
          return fallback();
        }
        throw new Error(`Service ${this.serviceName} is unavailable (circuit open)`);
      }
    }

    if (this.state === "half-open" && this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
      console.warn(`[CircuitBreaker:${this.serviceName}] Half-open limit reached - using fallback`);
      if (fallback) {
        return fallback();
      }
      throw new Error(`Service ${this.serviceName} is unavailable (half-open limit)`);
    }

    try {
      if (this.state === "half-open") {
        this.halfOpenCalls++;
      }

      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      if (fallback) {
        console.warn(`[CircuitBreaker:${this.serviceName}] Execution failed - using fallback`);
        return fallback();
      }
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === "half-open") {
      console.info(`[CircuitBreaker:${this.serviceName}] Recovery successful - closing circuit`);
    }
    this.failureCount = 0;
    this.state = "closed";
  }

  private onFailure(error: unknown): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[CircuitBreaker:${this.serviceName}] Failure ${this.failureCount}/${this.config.failureThreshold}: ${errorMessage}`
    );

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = "open";
      console.error(
        `[CircuitBreaker:${this.serviceName}] Circuit OPENED after ${this.failureCount} failures`
      );
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs;
  }

  getState(): CircuitState {
    return this.state;
  }

  getHealth(): ServiceHealth {
    return {
      serviceName: this.serviceName,
      status:
        this.state === "closed" ? "healthy" : this.state === "half-open" ? "degraded" : "unhealthy",
      lastCheck: Date.now(),
      errorCount: this.failureCount,
    };
  }
}

export function validateEnvironment(requiredVars: string[]): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const varName of requiredVars) {
    const value =
      process.env[varName] ||
      (typeof import.meta !== "undefined" && (import.meta as any).env?.[varName]);
    if (!value) {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

export function validateGeminiConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    errors.push("GEMINI_API_KEY ou VITE_GEMINI_API_KEY não configurada");
  } else if (!apiKey.startsWith("AIza")) {
    errors.push("API Key do Gemini em formato inválido (deve começar com 'AIza')");
  } else if (apiKey.length < 30) {
    errors.push("API Key do Gemini muito curta");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export interface StructuredError {
  code: string;
  message: string;
  context: Record<string, unknown>;
  timestamp: number;
  recoverable: boolean;
  suggestedAction?: string;
}

export function createStructuredError(
  code: string,
  message: string,
  context: Record<string, unknown> = {},
  recoverable = true,
  suggestedAction?: string
): StructuredError {
  return {
    code,
    message,
    context,
    timestamp: Date.now(),
    recoverable,
    suggestedAction,
  };
}

export const ErrorCodes = {
  GEMINI_API_ERROR: "GEMINI_API_ERROR",
  GEMINI_RATE_LIMIT: "GEMINI_RATE_LIMIT",
  GEMINI_QUOTA_EXCEEDED: "GEMINI_QUOTA_EXCEEDED",
  GEMINI_INVALID_KEY: "GEMINI_INVALID_KEY",
  AGENT_TIMEOUT: "AGENT_TIMEOUT",
  AGENT_EXECUTION_ERROR: "AGENT_EXECUTION_ERROR",
  TOOL_EXECUTION_ERROR: "TOOL_EXECUTION_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export function classifyGeminiError(error: unknown): StructuredError {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("429") || message.includes("rate limit")) {
    return createStructuredError(
      ErrorCodes.GEMINI_RATE_LIMIT,
      "Limite de requisições atingido",
      { originalError: message },
      true,
      "Aguarde alguns segundos e tente novamente"
    );
  }

  if (message.includes("403") || message.includes("quota")) {
    return createStructuredError(
      ErrorCodes.GEMINI_QUOTA_EXCEEDED,
      "Cota de uso excedida",
      { originalError: message },
      false,
      "Verifique sua cota no Google AI Studio"
    );
  }

  if (message.includes("401") || message.includes("API key")) {
    return createStructuredError(
      ErrorCodes.GEMINI_INVALID_KEY,
      "Chave de API inválida",
      { originalError: message },
      false,
      "Configure VITE_GEMINI_API_KEY corretamente"
    );
  }

  if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
    return createStructuredError(
      ErrorCodes.NETWORK_ERROR,
      "Timeout na comunicação com Gemini",
      { originalError: message },
      true,
      "Verifique sua conexão e tente novamente"
    );
  }

  return createStructuredError(
    ErrorCodes.GEMINI_API_ERROR,
    "Erro ao comunicar com Gemini",
    { originalError: message },
    true
  );
}

export interface GracefulDegradationResult<T> {
  result: T;
  degraded: boolean;
  source: "primary" | "fallback" | "cache" | "default";
  latencyMs: number;
}

export async function withGracefulDegradation<T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => T,
  options: {
    timeoutMs?: number;
    serviceName?: string;
  } = {}
): Promise<GracefulDegradationResult<T>> {
  const startTime = Date.now();
  const { timeoutMs = 25000, serviceName = "unknown" } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const result = await Promise.race([
      primaryFn(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs)),
    ]);

    clearTimeout(timeoutId);

    return {
      result,
      degraded: false,
      source: "primary",
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    console.warn(`[GracefulDegradation:${serviceName}] Primary failed, using fallback:`, error);

    return {
      result: fallbackFn(),
      degraded: true,
      source: "fallback",
      latencyMs: Date.now() - startTime,
    };
  }
}

export interface AgentHealthCheck {
  agentName: string;
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    geminiApi: boolean;
    configuration: boolean;
    lastExecution: boolean;
  };
  lastSuccessfulExecution?: number;
  errorRate: number;
  avgLatencyMs: number;
}

export type ExecutionOutcome = "success" | "failure" | "degraded";

class AgentMetricsCollector {
  private metrics: Map<
    string,
    {
      executions: number;
      failures: number;
      degradedExecutions: number;
      totalLatencyMs: number;
      lastSuccess?: number;
      lastDegradation?: number;
      lastError?: StructuredError;
    }
  > = new Map();

  recordExecution(
    agentName: string,
    outcome: ExecutionOutcome,
    latencyMs: number,
    error?: StructuredError
  ): void {
    const current = this.metrics.get(agentName) || {
      executions: 0,
      failures: 0,
      degradedExecutions: 0,
      totalLatencyMs: 0,
    };

    current.executions++;
    current.totalLatencyMs += latencyMs;

    switch (outcome) {
      case "success":
        current.lastSuccess = Date.now();
        break;
      case "degraded":
        current.degradedExecutions++;
        current.lastDegradation = Date.now();
        if (error) current.lastError = error;
        break;
      case "failure":
        current.failures++;
        if (error) current.lastError = error;
        break;
    }

    this.metrics.set(agentName, current);
  }

  getHealthCheck(agentName: string): Partial<AgentHealthCheck> & {
    degradedRate?: number;
    lastError?: StructuredError;
    lastDegradation?: number;
  } {
    const metrics = this.metrics.get(agentName);

    if (!metrics) {
      return {
        agentName,
        status: "healthy",
        errorRate: 0,
        avgLatencyMs: 0,
        degradedRate: 0,
      };
    }

    const errorRate = metrics.executions > 0 ? metrics.failures / metrics.executions : 0;
    const degradedRate =
      metrics.executions > 0 ? metrics.degradedExecutions / metrics.executions : 0;
    const avgLatencyMs = metrics.executions > 0 ? metrics.totalLatencyMs / metrics.executions : 0;

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (errorRate > 0.5) {
      status = "unhealthy";
    } else if (errorRate > 0.1 || degradedRate > 0.3) {
      status = "degraded";
    }

    return {
      agentName,
      status,
      lastSuccessfulExecution: metrics.lastSuccess,
      lastDegradation: metrics.lastDegradation,
      errorRate,
      degradedRate,
      avgLatencyMs,
      lastError: metrics.lastError,
    };
  }

  getAllMetrics(): Record<string, ReturnType<AgentMetricsCollector["getHealthCheck"]>> {
    const result: Record<string, ReturnType<AgentMetricsCollector["getHealthCheck"]>> = {};
    for (const agentName of this.metrics.keys()) {
      result[agentName] = this.getHealthCheck(agentName);
    }
    return result;
  }

  getAgentNames(): string[] {
    return Array.from(this.metrics.keys());
  }
}

export const agentMetrics = new AgentMetricsCollector();

export function createFallbackResponse(agentName: string, task: string): string {
  const fallbackMessages: Record<string, string> = {
    "Harvey Specter": `[Modo Offline] Não foi possível processar a análise estratégica no momento. 
Sugestão: Revise manualmente os seguintes pontos:
1. Verifique a legislação aplicável (CPC/15, CC/02)
2. Consulte jurisprudência recente sobre o tema
3. Avalie os riscos processuais envolvidos

Tarefa original: ${task.substring(0, 200)}...`,

    "Mrs. Justine": `[Modo Offline] Análise de intimações temporariamente indisponível.
Ações recomendadas:
1. Verifique manualmente o prazo no DJEN
2. Calcule o prazo contando dias úteis (Art. 219 CPC)
3. Anote a data limite no sistema de controle

Tarefa original: ${task.substring(0, 200)}...`,

    default: `[Modo Offline] O agente ${agentName} está temporariamente indisponível.
Por favor, tente novamente em alguns instantes ou realize a tarefa manualmente.

Tarefa: ${task.substring(0, 200)}...`,
  };

  return fallbackMessages[agentName] || fallbackMessages.default;
}
