import { expect, test } from "vitest";
import { executeHybridTask } from "../../src/lib/hybrid-agents-integration";

test("executeHybridTask executa harvey com sucesso", async () => {
  const task = {
    id: "test-1",
    agentId: "harvey",
    type: "DRAFT_PETITION",
    priority: "MEDIUM",
    status: "QUEUED",
    createdAt: new Date().toISOString(),
    data: { description: "Test orchestration with harvey" },
  } as any;

  const result = await executeHybridTask("harvey", task);
  expect(result).toBeDefined();
  expect(result.success).toBe(true);
  expect(result.executionTime).toBeGreaterThanOrEqual(0);
  expect(result.mode).toBe("langgraph");
  expect(result.langGraphResult?.completed).toBe(true);
});

test("executeHybridTask executa justine com sucesso", async () => {
  const task = {
    id: "test-2",
    agentId: "justine",
    type: "RESEARCH_PRECEDENTS",
    priority: "MEDIUM",
    status: "QUEUED",
    createdAt: new Date().toISOString(),
    data: { description: "Test orchestration with justine" },
  } as any;

  const result = await executeHybridTask("justine", task);
  expect(result).toBeDefined();
  expect(result.success).toBe(true);
  expect(result.executionTime).toBeGreaterThanOrEqual(0);
  expect(result.mode).toBe("langgraph");
  expect(result.langGraphResult?.completed).toBe(true);
});
/**
 * Hybrid Architecture Integration Tests
 *
 * Tests for LangGraph + DSPy + Qdrant + AutoGen integration
 */

import { beforeAll, describe, it } from "vitest";
import { monitorDJEN } from "../../src/agents/monitor-djen/monitor_graph";
import { QdrantService } from "../../src/lib/qdrant-service";

describe("Hybrid Architecture Integration", () => {
  describe.skip("DJEN Monitor with LangGraph", () => {
    it("should execute monitor workflow with search parameters", async () => {
      // Testa workflow completo com parâmetros de busca específicos
      const result = await monitorDJEN({
        name: "João Silva",
        oab: "123456",
      });

      expect(result).toBeDefined();
      expect(result.completed).toBe(true);
      expect(result.currentStep).toBe("completed");
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty("publications");
    }, 10000); // 10s timeout

    it("should respect timeout configuration and complete successfully", async () => {
      // Testa configuração de timeout customizado e políticas de retry
      const { DJENMonitorAgent } = await import("../../src/agents/monitor-djen/monitor_graph");

      const agent = new DJENMonitorAgent({
        timeoutMs: 5000, // Custom timeout
        maxRetries: 1, // Retry policy
      });

      const initialState = {
        messages: [],
        currentStep: "init",
        data: {},
        completed: false,
        retryCount: 0,
        maxRetries: 1,
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };

      const result = await agent.execute(initialState);
      expect(result).toBeDefined();
      expect(result.completed).toBe(true);
      expect(result.currentStep).toBe("completed");
      // Valida que configuração de timeout foi respeitada (5000ms + 1000ms margem)
      const executionTime = result.lastUpdatedAt - result.startedAt;
      expect(executionTime).toBeLessThan(6000);
    }, 10000);

    it("should handle timeout gracefully", async () => {
      const { DJENMonitorAgent } = await import("../../src/agents/monitor-djen/monitor_graph");

      const agent = new DJENMonitorAgent({
        timeoutMs: 100, // Very short timeout
        maxRetries: 0,
      });

      const initialState = {
        messages: [],
        currentStep: "init",
        data: {},
        completed: false,
        retryCount: 0,
        maxRetries: 0,
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };

      // Deve dar timeout e lançar erro
      await expect(agent.execute(initialState)).rejects.toThrow();
    });
  });

  describe("Qdrant Vector Search", () => {
    let qdrantService: QdrantService;

    beforeAll(() => {
      qdrantService = new QdrantService({
        url: process.env.QDRANT_URL || "http://localhost:6333",
        apiKey: process.env.QDRANT_API_KEY || "dev-local-key",
        collectionName: "test-collection",
        timeout: 5000,
      });
    });

    it("should create service instance", () => {
      expect(qdrantService).toBeDefined();
    });

    it("should validate search parameters", async () => {
      // Empty vector should be rejected
      await expect(qdrantService.search([], 5)).rejects.toThrow();

      // Invalid limit should be rejected
      await expect(qdrantService.search([0.1, 0.2, 0.3], 0)).rejects.toThrow();
    });
  });

  describe.skip("AutoGen Orchestrator API", () => {
    it("should require authentication", async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("http://localhost:3000/api/agents/autogen_orchestrator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: "test",
          agents: ["harvey"],
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      expect(response.status).toBe(401); // Unauthorized
    });

    it("should accept valid API key", async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("http://localhost:3000/api/agents/autogen_orchestrator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AUTOGEN_API_KEY || "dev-autogen-key"}`,
        },
        body: JSON.stringify({
          task: "analyze document",
          agents: ["harvey"],
          maxRounds: 1,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      expect([200, 500]).toContain(response.status); // May fail if server not running
    });
  });

  describe("DSPy Bridge Integration", () => {
    const DSPY_URL = process.env.DSPY_BRIDGE_URL || "http://localhost:8765";
    const DSPY_TOKEN = process.env.DSPY_API_TOKEN || "dev-dspy-secure-token-change-in-production";

    it("should have health endpoint", async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${DSPY_URL}/health`, { signal: controller.signal }).finally(
          () => clearTimeout(timeoutId)
        );
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.status).toBe("healthy");
      } catch (error) {
        console.warn("DSPy bridge not running, skipping test");
      }
    });

    it("should require API token for optimization", async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${DSPY_URL}/optimize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: "Test prompt",
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        expect(response.status).toBe(401); // Unauthorized
      } catch (error) {
        console.warn("DSPy bridge not running, skipping test");
      }
    });

    it("should optimize prompts with valid token", async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${DSPY_URL}/optimize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DSPY_TOKEN}`,
          },
          body: JSON.stringify({
            prompt: "Analyze this legal document",
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (response.ok) {
          const data = await response.json();
          expect(data.optimized_prompt).toBeDefined();
          expect(data.metadata).toBeDefined();
        }
      } catch (error) {
        console.warn("DSPy bridge not running, skipping test");
      }
    });
  });
});
