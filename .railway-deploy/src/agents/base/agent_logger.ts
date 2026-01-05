/**
 * Logger estruturado para agentes
 * Baseado no padrão Google Agent Starter Pack
 */

import * as Sentry from "@sentry/react";
import { isProduction } from "@/lib/env-utils";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  agentName?: string;
  sessionId?: string;
  attempt?: number;
  maxRetries?: number;
  errorType?: string;
  errorMessage?: string;
  [key: string]: unknown;
}

interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
}

/**
 * Logger estruturado com suporte a contexto
 * Facilita debugging e monitoramento de agentes
 */
class AgentLogger {
  private readonly enableConsole: boolean;
  private readonly enableSentry: boolean;

  constructor() {
    this.enableConsole = true; // Sempre habilitar console em dev
    this.enableSentry = isProduction(); // Sentry apenas em produção
  }

  /**
   * Log de debug (verbose)
   */
  debug(message: string, context: LogContext = {}): void {
    this.log("debug", message, context);
  }

  /**
   * Log de informação (operações normais)
   */
  info(message: string, context: LogContext = {}): void {
    this.log("info", message, context);
  }

  /**
   * Log de aviso (situações anormais mas recuperáveis)
   */
  warn(message: string, context: LogContext = {}): void {
    this.log("warn", message, context);
  }

  /**
   * Log de erro (falhas que precisam atenção)
   */
  error(message: string, context: LogContext = {}): void {
    this.log("error", message, context);
  }

  /**
   * Método interno de logging
   */
  private log(level: LogLevel, message: string, context: LogContext): void {
    const structuredLog: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    // Console logging (desenvolvimento)
    if (this.enableConsole) {
      const prefix = this.getPrefix(level);
      const agentInfo = context.agentName ? `[${context.agentName}]` : "";
      console[level === "debug" ? "log" : level](`${prefix} ${agentInfo} ${message}`, context);
    }

    // Sentry logging (produção)
    if (this.enableSentry && level === "error") {
      this.sendToSentry(structuredLog);
    }
  }

  /**
   * Retorna prefixo colorido por nível de log
   */
  private getPrefix(level: LogLevel): string {
    const prefixes = {
      debug: "🔍 [DEBUG]",
      info: "ℹ️  [INFO]",
      warn: "⚠️  [WARN]",
      error: "❌ [ERROR]",
    };
    return prefixes[level];
  }

  /**
   * Envia erro para Sentry em produção
   * Captura exceções com contexto completo do agente
   */
  private sendToSentry(log: StructuredLog): void {
    Sentry.withScope((scope) => {
      scope.setTag("agent.name", log.context.agentName || "unknown");
      scope.setTag("error.type", log.context.errorType || "unknown");
      scope.setTag("agent.step", (log.context.step as string) || "unknown");
      scope.setLevel("error");

      scope.setContext("agent_context", {
        ...log.context,
        timestamp: log.timestamp,
        logLevel: log.level,
      });

      Sentry.addBreadcrumb({
        category: "agent",
        message: log.message,
        level: "error",
        data: {
          agentName: log.context.agentName,
          errorType: log.context.errorType,
          step: log.context.step,
          sessionId: log.context.sessionId,
        },
      });

      Sentry.captureException(new Error(log.message));
    });
  }
}

// Singleton
export const logger = new AgentLogger();

/**
 * Helper para logar tentativas de retry
 */
export function logRetryAttempt(
  agentName: string,
  attempt: number,
  maxRetries: number,
  delayMs: number
): void {
  logger.info("agent_retry_attempt", {
    agentName,
    attempt: attempt + 1,
    maxRetries,
    delayMs,
  });
}

/**
 * Helper para logar sucesso após retry
 */
export function logRetrySuccess(agentName: string, successfulAttempt: number): void {
  logger.info("agent_retry_succeeded", {
    agentName,
    successfulAttempt,
  });
}

/**
 * Helper para logar esgotamento de retries
 */
export function logRetryExhausted(
  agentName: string,
  totalAttempts: number,
  lastError: string
): void {
  logger.error("agent_retry_exhausted", {
    agentName,
    totalAttempts,
    lastError,
  });
}

/**
 * Helper para logar validação de input falha
 */
export function logValidationError(
  agentName: string,
  field: string,
  errorMessage: string,
  receivedValue: unknown
): void {
  logger.error("input_validation_failed", {
    agentName,
    field,
    errorMessage,
    receivedValue,
  });
}

/**
 * Helper para logar execução de agente
 */
export function logAgentExecution(
  agentName: string,
  step: string,
  data: Record<string, unknown> = {}
): void {
  logger.info("agent_execution_step", {
    agentName,
    step,
    ...data,
  });
}

/**
 * Helper para logar erro estruturado
 */
export function logStructuredError(
  agentName: string,
  errorType: string,
  errorMessage: string,
  context: Record<string, unknown> = {}
): void {
  logger.error("agent_execution_failed", {
    agentName,
    errorType,
    errorMessage,
    ...context,
  });
}
