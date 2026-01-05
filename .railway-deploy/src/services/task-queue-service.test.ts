/**
 * Testes unitários para task-queue-service.ts
 */

import { describe, expect, it } from "vitest";
import type { DeadLetterTask, TaskWithRetry } from "./task-queue-service";
import {
  calculateQueueMetrics,
  calculateRetryDelay,
  canRetryTask,
  getFailedTasks,
  getReadyTasks,
  handleTaskResult,
  isTaskReadyForRetry,
  moveTaskToDLQ,
  prepareTaskForRetry,
} from "./task-queue-service";

describe("task-queue-service", () => {
  describe("calculateRetryDelay", () => {
    it("deve calcular delay com exponential backoff", () => {
      const config = {
        maxRetries: 3,
        retryDelayMs: 1000,
        maxRetryDelayMs: 30000,
        exponentialBackoff: true,
      };

      const delay0 = calculateRetryDelay(0, config);
      const delay1 = calculateRetryDelay(1, config);
      const delay2 = calculateRetryDelay(2, config);

      expect(delay0).toBeGreaterThanOrEqual(800); // 1000 * 2^0 ± 20%
      expect(delay0).toBeLessThanOrEqual(1200);

      expect(delay1).toBeGreaterThanOrEqual(1600); // 1000 * 2^1 ± 20%
      expect(delay1).toBeLessThanOrEqual(2400);

      expect(delay2).toBeGreaterThanOrEqual(3200); // 1000 * 2^2 ± 20%
      expect(delay2).toBeLessThanOrEqual(4800);
    });

    it("deve respeitar o limite máximo de delay", () => {
      const config = {
        maxRetries: 10,
        retryDelayMs: 1000,
        maxRetryDelayMs: 5000,
        exponentialBackoff: true,
      };

      const delay = calculateRetryDelay(10, config);

      expect(delay).toBeLessThanOrEqual(6000); // maxRetryDelayMs + jitter
    });

    it("deve retornar delay fixo sem exponential backoff", () => {
      const config = {
        maxRetries: 3,
        retryDelayMs: 2000,
        maxRetryDelayMs: 10000,
        exponentialBackoff: false,
      };

      const delay0 = calculateRetryDelay(0, config);
      const delay1 = calculateRetryDelay(1, config);
      const delay2 = calculateRetryDelay(2, config);

      // Todos devem estar próximos de 2000ms ± jitter
      expect(delay0).toBeGreaterThanOrEqual(1600);
      expect(delay0).toBeLessThanOrEqual(2400);

      expect(delay1).toBeGreaterThanOrEqual(1600);
      expect(delay1).toBeLessThanOrEqual(2400);

      expect(delay2).toBeGreaterThanOrEqual(1600);
      expect(delay2).toBeLessThanOrEqual(2400);
    });
  });

  describe("canRetryTask", () => {
    it("deve permitir retry se abaixo do limite", () => {
      const task: TaskWithRetry = {
        id: "task-1",
        agentId: "harvey",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {},
        retryCount: 1,
      };

      const config = {
        maxRetries: 3,
        retryDelayMs: 1000,
        maxRetryDelayMs: 10000,
        exponentialBackoff: true,
      };

      expect(canRetryTask(task, config)).toBe(true);
    });

    it("deve negar retry se atingiu o limite", () => {
      const task: TaskWithRetry = {
        id: "task-1",
        agentId: "harvey",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {},
        retryCount: 3,
      };

      const config = {
        maxRetries: 3,
        retryDelayMs: 1000,
        maxRetryDelayMs: 10000,
        exponentialBackoff: true,
      };

      expect(canRetryTask(task, config)).toBe(false);
    });
  });

  describe("isTaskReadyForRetry", () => {
    it("deve retornar true se não tem nextRetryAt", () => {
      const task: TaskWithRetry = {
        id: "task-1",
        agentId: "harvey",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {},
        retryCount: 0,
      };

      expect(isTaskReadyForRetry(task)).toBe(true);
    });

    it("deve retornar false se nextRetryAt está no futuro", () => {
      const futureDate = new Date(Date.now() + 10000).toISOString();

      const task: TaskWithRetry = {
        id: "task-1",
        agentId: "harvey",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {},
        retryCount: 1,
        nextRetryAt: futureDate,
      };

      expect(isTaskReadyForRetry(task)).toBe(false);
    });

    it("deve retornar true se nextRetryAt já passou", () => {
      const pastDate = new Date(Date.now() - 10000).toISOString();

      const task: TaskWithRetry = {
        id: "task-1",
        agentId: "harvey",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {},
        retryCount: 1,
        nextRetryAt: pastDate,
      };

      expect(isTaskReadyForRetry(task)).toBe(true);
    });
  });

  describe("prepareTaskForRetry", () => {
    it("deve incrementar retryCount e definir nextRetryAt", () => {
      const task: TaskWithRetry = {
        id: "task-1",
        agentId: "harvey",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "failed",
        createdAt: new Date().toISOString(),
        data: {},
        retryCount: 0,
      };

      const config = {
        maxRetries: 3,
        retryDelayMs: 1000,
        maxRetryDelayMs: 10000,
        exponentialBackoff: true,
      };

      const prepared = prepareTaskForRetry(task, "Test error", config);

      expect(prepared.retryCount).toBe(1);
      expect(prepared.lastError).toBe("Test error");
      expect(prepared.status).toBe("queued");
      expect(prepared.nextRetryAt).toBeDefined();

      const nextRetryDate = new Date(prepared.nextRetryAt!).getTime();
      const now = Date.now();

      expect(nextRetryDate).toBeGreaterThan(now);
    });
  });

  describe("moveTaskToDLQ", () => {
    it("deve criar DeadLetterTask com timestamp e erro final", () => {
      const task: TaskWithRetry = {
        id: "task-1",
        agentId: "harvey",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "failed",
        createdAt: new Date().toISOString(),
        data: {},
        retryCount: 3,
      };

      const dlqTask = moveTaskToDLQ(task, "Max retries exceeded");

      expect(dlqTask.movedToDLQAt).toBeDefined();
      expect(dlqTask.finalError).toBe("Max retries exceeded");
      expect(dlqTask.status).toBe("failed");
    });
  });

  describe("getReadyTasks", () => {
    it("deve filtrar apenas tarefas prontas", () => {
      const now = Date.now();
      const past = new Date(now - 10000).toISOString();
      const future = new Date(now + 10000).toISOString();

      const queue: TaskWithRetry[] = [
        {
          id: "task-1",
          agentId: "harvey",
          type: "ANALYZE_DOCUMENT",
          priority: "medium",
          status: "queued",
          createdAt: past,
          data: {},
          retryCount: 0,
        },
        {
          id: "task-2",
          agentId: "harvey",
          type: "ANALYZE_DOCUMENT",
          priority: "medium",
          status: "queued",
          createdAt: past,
          data: {},
          retryCount: 1,
          nextRetryAt: future,
        },
        {
          id: "task-3",
          agentId: "harvey",
          type: "ANALYZE_DOCUMENT",
          priority: "medium",
          status: "processing",
          createdAt: past,
          data: {},
          retryCount: 0,
        },
      ];

      const ready = getReadyTasks(queue);

      expect(ready).toHaveLength(1);
      expect(ready[0].id).toBe("task-1");
    });
  });

  describe("getFailedTasks", () => {
    it("deve filtrar tarefas que atingiram maxRetries", () => {
      const config = {
        maxRetries: 3,
        retryDelayMs: 1000,
        maxRetryDelayMs: 10000,
        exponentialBackoff: true,
      };

      const queue: TaskWithRetry[] = [
        {
          id: "task-1",
          agentId: "harvey",
          type: "ANALYZE_DOCUMENT",
          priority: "medium",
          status: "failed",
          createdAt: new Date().toISOString(),
          data: {},
          retryCount: 3,
        },
        {
          id: "task-2",
          agentId: "harvey",
          type: "ANALYZE_DOCUMENT",
          priority: "medium",
          status: "failed",
          createdAt: new Date().toISOString(),
          data: {},
          retryCount: 2,
        },
      ];

      const failed = getFailedTasks(queue, config);

      expect(failed).toHaveLength(1);
      expect(failed[0].id).toBe("task-1");
    });
  });

  describe("handleTaskResult", () => {
    const config = {
      maxRetries: 3,
      retryDelayMs: 1000,
      maxRetryDelayMs: 10000,
      exponentialBackoff: true,
    };

    it("deve completar tarefa em caso de sucesso", () => {
      const task: TaskWithRetry = {
        id: "task-1",
        agentId: "harvey",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "processing",
        createdAt: new Date().toISOString(),
        data: {},
        retryCount: 0,
      };

      const result = handleTaskResult(task, { success: true }, config);

      expect(result.action).toBe("complete");
      expect(result.updatedTask.status).toBe("completed");
      expect(result.updatedTask.completedAt).toBeDefined();
    });

    it("deve preparar retry em caso de falha com retries disponíveis", () => {
      const task: TaskWithRetry = {
        id: "task-1",
        agentId: "harvey",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "processing",
        createdAt: new Date().toISOString(),
        data: {},
        retryCount: 1,
      };

      const result = handleTaskResult(task, { success: false, error: "Test error" }, config);

      expect(result.action).toBe("retry");
      expect(result.updatedTask.status).toBe("queued");
      expect(result.updatedTask.retryCount).toBe(2);
      expect((result.updatedTask as TaskWithRetry).nextRetryAt).toBeDefined();
    });

    it("deve mover para DLQ quando esgotados os retries", () => {
      const task: TaskWithRetry = {
        id: "task-1",
        agentId: "harvey",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "processing",
        createdAt: new Date().toISOString(),
        data: {},
        retryCount: 3,
      };

      const result = handleTaskResult(task, { success: false, error: "Final error" }, config);

      expect(result.action).toBe("move_to_dlq");
      expect(result.updatedTask.status).toBe("failed");
      expect("movedToDLQAt" in result.updatedTask).toBe(true);
    });
  });

  describe("calculateQueueMetrics", () => {
    it("deve calcular métricas corretamente", () => {
      const queue: TaskWithRetry[] = [
        {
          id: "task-1",
          agentId: "harvey",
          type: "ANALYZE_DOCUMENT",
          priority: "medium",
          status: "queued",
          createdAt: new Date().toISOString(),
          data: {},
          retryCount: 0,
        },
        {
          id: "task-2",
          agentId: "harvey",
          type: "ANALYZE_DOCUMENT",
          priority: "medium",
          status: "processing",
          createdAt: new Date().toISOString(),
          data: {},
          retryCount: 1,
        },
        {
          id: "task-3",
          agentId: "harvey",
          type: "ANALYZE_DOCUMENT",
          priority: "medium",
          status: "completed",
          createdAt: new Date().toISOString(),
          data: {},
          retryCount: 2,
        },
        {
          id: "task-4",
          agentId: "harvey",
          type: "ANALYZE_DOCUMENT",
          priority: "medium",
          status: "failed",
          createdAt: new Date().toISOString(),
          data: {},
          retryCount: 3,
        },
      ];

      const dlq: DeadLetterTask[] = [
        {
          id: "task-5",
          agentId: "harvey",
          type: "ANALYZE_DOCUMENT",
          priority: "medium",
          status: "failed" as const,
          createdAt: new Date().toISOString(),
          data: {},
          retryCount: 3,
          movedToDLQAt: new Date().toISOString(),
          finalError: "Error",
        },
      ];

      const metrics = calculateQueueMetrics(queue, dlq);

      expect(metrics.total).toBe(4);
      expect(metrics.queued).toBe(1);
      expect(metrics.processing).toBe(1);
      expect(metrics.completed).toBe(1);
      expect(metrics.failed).toBe(1);
      expect(metrics.inDLQ).toBe(1);
      expect(metrics.averageRetries).toBe(1.5); // (0+1+2+3)/4
      expect(metrics.successRate).toBe(25); // 1 completed / 4 total
    });
  });
});
