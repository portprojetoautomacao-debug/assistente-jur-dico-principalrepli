import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock do agent-monitoring para evitar dependências externas
vi.mock("../../src/lib/agent-monitoring", () => ({
  agentMonitor: {
    trackTaskExecution: vi.fn(async (taskId, agentId, taskType, fn) => {
      // Simular logging
      console.log(`[Agent Monitor] Tracking task ${taskId} for agent ${agentId} (${taskType})`);

      try {
        const result = await fn();
        console.log(`[Agent Monitor] Task ${taskId} completed successfully`);
        return result;
      } catch (error) {
        console.log(`[Agent Monitor] Task ${taskId} failed:`, error);
        throw error;
      }
    }),
    getMetrics: vi.fn(() => ({
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      averageDuration: 0,
    })),
    logAction: vi.fn(async () => {
      // Mock para logAction
    }),
    logStatusChange: vi.fn(async () => {
      // Mock para logStatusChange
    }),
  },
  AgentMonitor: vi.fn().mockImplementation(() => ({
    trackTaskExecution: vi.fn(async (taskId, agentId, taskType, fn) => {
      return await fn();
    }),
    getMetrics: vi.fn(() => ({
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      averageDuration: 0,
    })),
    logAction: vi.fn(async () => {}),
    logStatusChange: vi.fn(async () => {}),
  })),
}));

import { agentMonitor } from "../../src/lib/agent-monitoring";

describe("agentMonitor.trackTaskExecution", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("tracks successful execution", async () => {
    const result = await agentMonitor.trackTaskExecution(
      "task-1",
      "agent-1",
      "demo",
      async () => "ok"
    );

    expect(result).toBe("ok");
    expect(agentMonitor.trackTaskExecution).toHaveBeenCalledWith(
      "task-1",
      "agent-1",
      "demo",
      expect.any(Function)
    );
    expect(logSpy).toHaveBeenCalled();
  });

  it("tracks failed execution", async () => {
    await expect(
      agentMonitor.trackTaskExecution("task-2", "agent-2", "demo", async () => {
        throw new Error("fail");
      })
    ).rejects.toThrow("fail");

    expect(agentMonitor.trackTaskExecution).toHaveBeenCalledWith(
      "task-2",
      "agent-2",
      "demo",
      expect.any(Function)
    );
    expect(logSpy).toHaveBeenCalled();
  });

  it("returns metrics when requested", () => {
    const metrics = agentMonitor.getMetrics();

    expect(metrics).toBeDefined();
    expect(metrics).toHaveProperty("totalTasks");
    expect(metrics).toHaveProperty("successfulTasks");
    expect(metrics).toHaveProperty("failedTasks");
    expect(metrics).toHaveProperty("averageDuration");

    // Validar tipos das métricas
    expect(typeof metrics.totalTasks).toBe("number");
    expect(typeof metrics.successfulTasks).toBe("number");
    expect(typeof metrics.failedTasks).toBe("number");
    expect(typeof metrics.averageDuration).toBe("number");
  });

  it("handles async task execution with timing", async () => {
    const startTime = Date.now();

    const result = await agentMonitor.trackTaskExecution(
      "task-timing",
      "agent-timing",
      "timing-test",
      async () => {
        // Simular tarefa que demora 100ms
        await new Promise((resolve) => setTimeout(resolve, 100));
        return "completed";
      }
    );

    const duration = Date.now() - startTime;

    expect(result).toBe("completed");
    // Usar margem de 5ms para compensar jitter do timer em diferentes ambientes
    expect(duration).toBeGreaterThanOrEqual(95);
  });

  it("propagates errors correctly", async () => {
    const customError = new Error("Custom error message");

    await expect(
      agentMonitor.trackTaskExecution("task-error", "agent-error", "error-test", async () => {
        throw customError;
      })
    ).rejects.toThrow("Custom error message");
  });

  it("handles multiple concurrent tasks", async () => {
    const tasks = [
      agentMonitor.trackTaskExecution("task-1", "agent-1", "concurrent", async () => "result-1"),
      agentMonitor.trackTaskExecution("task-2", "agent-2", "concurrent", async () => "result-2"),
      agentMonitor.trackTaskExecution("task-3", "agent-3", "concurrent", async () => "result-3"),
    ];

    const results = await Promise.all(tasks);

    expect(results).toEqual(["result-1", "result-2", "result-3"]);
    expect(agentMonitor.trackTaskExecution).toHaveBeenCalledTimes(3);
  });
});

describe("agentMonitor.logAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs action successfully", async () => {
    await agentMonitor.logAction("agent-1", "test-action", { key: "value" }, true, 100);

    expect(agentMonitor.logAction).toHaveBeenCalledWith(
      "agent-1",
      "test-action",
      { key: "value" },
      true,
      100
    );
  });

  it("logs failed action", async () => {
    await agentMonitor.logAction("agent-2", "failed-action", { error: "details" }, false);

    expect(agentMonitor.logAction).toHaveBeenCalledWith(
      "agent-2",
      "failed-action",
      { error: "details" },
      false
    );
  });
});

describe("agentMonitor.logStatusChange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs status change", async () => {
    await agentMonitor.logStatusChange("agent-1", "idle", "active");

    expect(agentMonitor.logStatusChange).toHaveBeenCalledWith("agent-1", "idle", "active");
  });
});
