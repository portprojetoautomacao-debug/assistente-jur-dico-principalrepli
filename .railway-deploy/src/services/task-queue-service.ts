/**
 * Serviço de fila de tarefas robusto com retry e dead letter queue
 *
 * Evita perda de tarefas em caso de falhas temporárias de IA/API
 *
 * @module task-queue-service
 * @version 1.0.0
 */

import type { AgentTask } from "@/lib/agents";
import * as Sentry from "@sentry/react";

// ============================================================================
// TYPES
// ============================================================================

export interface TaskQueueConfig {
  maxRetries: number;
  retryDelayMs: number;
  maxRetryDelayMs: number;
  exponentialBackoff: boolean;
}

export interface TaskWithRetry extends AgentTask {
  retryCount: number;
  nextRetryAt?: string;
  lastError?: string;
}

export interface DeadLetterTask extends TaskWithRetry {
  movedToDLQAt: string;
  finalError: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: TaskQueueConfig = {
  maxRetries: 3,
  retryDelayMs: 1000, // 1s
  maxRetryDelayMs: 30_000, // 30s
  exponentialBackoff: true,
};

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Calcula o delay para o próximo retry usando exponential backoff
 */
export function calculateRetryDelay(
  retryCount: number,
  config: TaskQueueConfig = DEFAULT_CONFIG
): number {
  if (!config.exponentialBackoff) {
    return config.retryDelayMs;
  }

  // 2^retryCount * baseDelay, com limite máximo
  const delay = Math.min(config.retryDelayMs * Math.pow(2, retryCount), config.maxRetryDelayMs);

  // Adiciona jitter de ±20% para evitar thundering herd
  const jitter = delay * 0.2 * (Math.random() - 0.5);

  return Math.floor(delay + jitter);
}

/**
 * Verifica se uma tarefa pode ser retentada
 */
export function canRetryTask(
  task: TaskWithRetry,
  config: TaskQueueConfig = DEFAULT_CONFIG
): boolean {
  return task.retryCount < config.maxRetries;
}

/**
 * Verifica se uma tarefa está pronta para retry
 */
export function isTaskReadyForRetry(task: TaskWithRetry): boolean {
  if (!task.nextRetryAt) return true;

  const now = Date.now();
  const retryAt = new Date(task.nextRetryAt).getTime();

  return now >= retryAt;
}

/**
 * Prepara tarefa para próximo retry
 */
export function prepareTaskForRetry(
  task: TaskWithRetry,
  error: string,
  config: TaskQueueConfig = DEFAULT_CONFIG
): TaskWithRetry {
  const retryCount = task.retryCount + 1;

  // Sentry breadcrumb: tarefa entrando em retry
  Sentry.addBreadcrumb({
    category: "task-queue",
    message: `Task ${task.id} preparing for retry ${retryCount}`,
    level: "info",
    data: {
      taskId: task.id,
      agentId: task.agentId,
      taskType: task.type,
      retryCount,
      error,
    },
  });
  const delayMs = calculateRetryDelay(retryCount, config);
  const nextRetryAt = new Date(Date.now() + delayMs).toISOString();

  return {
    ...task,
    retryCount,
    nextRetryAt,
    lastError: error,
    status: "queued" as const,
  };
}

/**
 * Move tarefa para Dead Letter Queue
 */
export function moveTaskToDLQ(task: TaskWithRetry, finalError: string): DeadLetterTask {
  // Sentry error: tarefa movida para DLQ após todos os retries
  Sentry.captureException(new Error(`Task moved to DLQ: ${finalError}`), {
    level: "warning",
    tags: {
      taskId: task.id,
      agentId: task.agentId,
      taskType: task.type,
    },
    extra: {
      retryCount: task.retryCount,
      lastError: task.lastError,
      finalError,
      taskData: task.data,
    },
  });

  return {
    ...task,
    movedToDLQAt: new Date().toISOString(),
    finalError,
    status: "failed" as const,
  };
}

// ============================================================================
// QUEUE MANAGEMENT
// ============================================================================

/**
 * Filtra tarefas prontas para execução
 */
export function getReadyTasks(queue: TaskWithRetry[]): TaskWithRetry[] {
  return queue.filter((task) => task.status === "queued" && isTaskReadyForRetry(task));
}

/**
 * Filtra tarefas que falharam e devem ir para DLQ
 */
export function getFailedTasks(
  queue: TaskWithRetry[],
  config: TaskQueueConfig = DEFAULT_CONFIG
): TaskWithRetry[] {
  return queue.filter((task) => task.status === "failed" && task.retryCount >= config.maxRetries);
}

/**
 * Processa resultado de execução de tarefa
 */
export function handleTaskResult(
  task: TaskWithRetry,
  result: { success: boolean; error?: string },
  config: TaskQueueConfig = DEFAULT_CONFIG
): {
  action: "complete" | "retry" | "move_to_dlq";
  updatedTask: TaskWithRetry | DeadLetterTask;
} {
  if (result.success) {
    // Sentry breadcrumb: tarefa completada com sucesso
    Sentry.addBreadcrumb({
      category: "task-queue",
      message: `Task ${task.id} completed successfully`,
      level: "info",
      data: {
        taskId: task.id,
        agentId: task.agentId,
        taskType: task.type,
        retryCount: task.retryCount,
      },
    });

    return {
      action: "complete",
      updatedTask: {
        ...task,
        status: "completed" as const,
        completedAt: new Date().toISOString(),
      },
    };
  }

  const error = result.error || "Unknown error";

  if (canRetryTask(task, config)) {
    return {
      action: "retry",
      updatedTask: prepareTaskForRetry(task, error, config),
    };
  }

  return {
    action: "move_to_dlq",
    updatedTask: moveTaskToDLQ(task, error),
  };
}

// ============================================================================
// MONITORING & METRICS
// ============================================================================

export interface QueueMetrics {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  inDLQ: number;
  averageRetries: number;
  successRate: number;
}

/**
 * Calcula métricas da fila e envia para Sentry
 */
export function calculateQueueMetrics(queue: TaskWithRetry[], dlq: DeadLetterTask[]): QueueMetrics {
  const total = queue.length;
  const queued = queue.filter((t) => t.status === "queued").length;
  const processing = queue.filter((t) => t.status === "processing").length;
  const completed = queue.filter((t) => t.status === "completed").length;
  const failed = queue.filter((t) => t.status === "failed").length;
  const inDLQ = dlq.length;

  const totalRetries = queue.reduce((sum, t) => sum + t.retryCount, 0);
  const averageRetries = total > 0 ? totalRetries / total : 0;

  const successRate = total > 0 ? (completed / total) * 100 : 0;

  const metrics: QueueMetrics = {
    total,
    queued,
    processing,
    completed,
    failed,
    inDLQ,
    averageRetries,
    successRate,
  };

  // Envia métricas para Sentry como breadcrumb
  Sentry.addBreadcrumb({
    category: "task-queue",
    message: "Queue metrics calculated",
    level: "info",
    data: metrics,
  });

  // Se taxa de falha > 50%, envia alerta
  if (total > 5 && successRate < 50) {
    Sentry.captureMessage("Task queue success rate below 50%", {
      level: "warning",
      tags: {
        component: "task-queue",
        successRate: successRate.toFixed(2),
      },
      extra: { ...metrics },
    });
  }

  // Se DLQ tem muitas tarefas, envia alerta
  if (inDLQ > 10) {
    Sentry.captureMessage(`Dead Letter Queue has ${inDLQ} tasks`, {
      level: "warning",
      tags: {
        component: "task-queue",
        dlqSize: inDLQ.toString(),
      },
      extra: { ...metrics },
    });
  }

  return metrics;
}
