/**
 * Testes de fluxo completo de agentes
 * Valida comunicação, coordenação e execução de tarefas entre agentes
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Agent, AgentTask } from "./agents";
import {
  processTaskWithAI,
  agendarRetryTarefa,
  calcularAtrasoRetry,
  initializeAgents,
} from "./agents";

describe("Agent Workflow Integration Tests", () => {
  describe("Task Lifecycle", () => {
    it("should complete a task successfully from queued to completed", async () => {
      const task: AgentTask = {
        id: "task-1",
        agentId: "analise-documental",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {
          documentText: "Contrato de prestação de serviços",
          documentType: "contrato",
        },
      };

      const agent: Agent = {
        id: "analise-documental",
        name: "Análise Documental",
        description: "Analisa documentos jurídicos",
        type: "analyzer",
        status: "idle",
        enabled: true,
        lastActivity: "",
        continuousMode: false,
      };

      const result = await processTaskWithAI(task, agent);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.message).toBeTruthy();
    });

    it("should handle task with retry mechanism", () => {
      const task: AgentTask = {
        id: "task-retry",
        agentId: "monitor-djen",
        type: "MONITOR_DJEN",
        priority: "high",
        status: "failed",
        createdAt: new Date().toISOString(),
        data: {},
        retryCount: 0,
        maxRetries: 3,
      };

      const retriedTask = agendarRetryTarefa(task);

      expect(retriedTask.status).toBe("pending_retry");
      expect(retriedTask.retryCount).toBe(1);
      expect(retriedTask.nextRunAt).toBeDefined();
      expect(new Date(retriedTask.nextRunAt!).getTime()).toBeGreaterThan(Date.now());
    });

    it("should fail task after max retries exceeded", () => {
      const task: AgentTask = {
        id: "task-max-retry",
        agentId: "gestao-prazos",
        type: "CALCULATE_DEADLINE",
        priority: "high",
        status: "failed",
        createdAt: new Date().toISOString(),
        data: {},
        retryCount: 3,
        maxRetries: 3,
      };

      const retriedTask = agendarRetryTarefa(task);

      expect(retriedTask.status).toBe("failed");
      expect(retriedTask.retryCount).toBe(4);
      expect(retriedTask.error).toContain("Máximo de 3 tentativas excedido");
    });
  });

  describe("Retry Backoff Strategy", () => {
    it("should calculate exponential backoff correctly", () => {
      const baseMs = 10_000; // 10 seconds
      const maxMs = 10 * 60 * 1_000; // 10 minutes

      // First retry: ~10s (with jitter)
      const delay1 = calcularAtrasoRetry(0, baseMs, maxMs);
      expect(delay1).toBeGreaterThanOrEqual(8_500); // 10s * 0.85
      expect(delay1).toBeLessThanOrEqual(11_500); // 10s * 1.15

      // Second retry: ~20s (with jitter)
      const delay2 = calcularAtrasoRetry(1, baseMs, maxMs);
      expect(delay2).toBeGreaterThanOrEqual(17_000); // 20s * 0.85
      expect(delay2).toBeLessThanOrEqual(23_000); // 20s * 1.15

      // Third retry: ~40s (with jitter)
      const delay3 = calcularAtrasoRetry(2, baseMs, maxMs);
      expect(delay3).toBeGreaterThanOrEqual(34_000); // 40s * 0.85
      expect(delay3).toBeLessThanOrEqual(46_000); // 40s * 1.15
    });

    it("should cap delay at maximum value", () => {
      const baseMs = 10_000;
      const maxMs = 60_000; // 1 minute max

      // Very high retry count should be capped
      const delay = calcularAtrasoRetry(10, baseMs, maxMs);
      expect(delay).toBeLessThanOrEqual(maxMs);
    });

    it("should handle negative retry count gracefully", () => {
      const delay = calcularAtrasoRetry(-1);
      expect(delay).toBeGreaterThan(0);
      expect(delay).toBeLessThan(20_000); // Should be similar to retry 0
    });
  });

  describe("Agent Initialization", () => {
    it("should initialize all default agents", () => {
      const agents = initializeAgents([]);

      expect(agents.length).toBeGreaterThan(0);
      expect(agents.some((a) => a.id === "harvey")).toBe(true);
      expect(agents.some((a) => a.id === "justine")).toBe(true);
      expect(agents.some((a) => a.id === "monitor-djen")).toBe(true);
    });

    it("should preserve existing agent configurations", () => {
      const existingAgents: Agent[] = [
        {
          id: "harvey",
          name: "Harvey Custom",
          description: "Custom Harvey",
          type: "strategic",
          status: "active",
          enabled: false, // Disabled
          lastActivity: "2024-01-01",
          continuousMode: true,
        },
      ];

      const agents = initializeAgents(existingAgents);

      const harvey = agents.find((a) => a.id === "harvey");
      expect(harvey).toBeDefined();
      expect(harvey?.enabled).toBe(false); // Should preserve disabled state
      expect(harvey?.continuousMode).toBe(true);
    });

    it("should have all agents with required properties", () => {
      const agents = initializeAgents([]);

      for (const agent of agents) {
        expect(agent.id).toBeTruthy();
        expect(agent.name).toBeTruthy();
        expect(agent.description).toBeTruthy();
        expect(agent.type).toBeTruthy();
        expect(agent.status).toBeTruthy();
        expect(typeof agent.enabled).toBe("boolean");
        expect(typeof agent.continuousMode).toBe("boolean");
      }
    });
  });

  describe("Task Priority and Urgency", () => {
    it("should process critical priority tasks", async () => {
      const task: AgentTask = {
        id: "critical-task",
        agentId: "redacao-peticoes",
        type: "DRAFT_PETITION",
        priority: "critical",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {
          petitionType: "urgente",
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      };

      const agent: Agent = {
        id: "redacao-peticoes",
        name: "Redação de Petições",
        description: "Redige petições",
        type: "writer",
        status: "idle",
        enabled: true,
        lastActivity: "",
        continuousMode: false,
      };

      const result = await processTaskWithAI(task, agent);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should handle low priority tasks", async () => {
      const task: AgentTask = {
        id: "low-priority-task",
        agentId: "organizacao-arquivos",
        type: "ORGANIZE_FILES",
        priority: "low",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {
          processNumber: "1234567-89.2024.8.26.0100",
        },
      };

      const agent: Agent = {
        id: "organizacao-arquivos",
        name: "Organização de Arquivos",
        description: "Organiza arquivos",
        type: "organizer",
        status: "idle",
        enabled: true,
        lastActivity: "",
        continuousMode: false,
      };

      const result = await processTaskWithAI(task, agent);

      expect(result.success).toBe(true);
    });
  });

  describe("Task Metadata and Traceability", () => {
    it("should track task creator", () => {
      const task: AgentTask = {
        id: "traced-task",
        agentId: "compliance",
        type: "COMPLIANCE_CHECK",
        priority: "high",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {},
        criadoPor: "sistema",
        processoNumero: "1234567-89.2024.8.26.0100",
      };

      expect(task.criadoPor).toBe("sistema");
      expect(task.processoNumero).toBeTruthy();
    });

    it("should track task chaining", () => {
      const parentTask: AgentTask = {
        id: "parent-task",
        agentId: "analise-documental",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "completed",
        createdAt: new Date().toISOString(),
        data: {},
      };

      const childTask: AgentTask = {
        id: "child-task",
        agentId: "redacao-peticoes",
        type: "DRAFT_PETITION",
        priority: "medium",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {},
        sourceTaskId: parentTask.id,
      };

      expect(childTask.sourceTaskId).toBe(parentTask.id);
    });

    it("should track task updates", () => {
      const task: AgentTask = {
        id: "updated-task",
        agentId: "gestao-prazos",
        type: "CALCULATE_DEADLINE",
        priority: "high",
        status: "processing",
        createdAt: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        data: {},
      };

      expect(task.atualizadoEm).toBeTruthy();
      expect(new Date(task.atualizadoEm!).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("Agent Performance Metrics", () => {
    it("should track processing time", async () => {
      const task: AgentTask = {
        id: "perf-task",
        agentId: "pesquisa-juris",
        type: "RESEARCH_PRECEDENTS",
        priority: "medium",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {
          query: "jurisprudência sobre rescisão indireta",
        },
      };

      const agent: Agent = {
        id: "pesquisa-juris",
        name: "Pesquisa Jurisprudencial",
        description: "Pesquisa jurisprudência",
        type: "researcher",
        status: "idle",
        enabled: true,
        lastActivity: "",
        continuousMode: false,
      };

      const startTime = Date.now();
      const result = await processTaskWithAI(task, agent);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      // Processing time may not always be tracked, so check if defined
      if (result.processingTimeMs !== undefined) {
        expect(result.processingTimeMs).toBeGreaterThan(0);
        expect(result.processingTimeMs).toBeLessThanOrEqual(endTime - startTime + 100);
      } else {
        // If not tracked, at least verify the task completed in reasonable time
        expect(endTime - startTime).toBeLessThan(30000); // 30 seconds max
      }
    });

    it("should track confidence scores", async () => {
      const task: AgentTask = {
        id: "confidence-task",
        agentId: "analise-risco",
        type: "RISK_ANALYSIS",
        priority: "high",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {
          processType: "trabalhista",
          value: 50000,
        },
      };

      const agent: Agent = {
        id: "analise-risco",
        name: "Análise de Risco",
        description: "Analisa riscos",
        type: "analyzer",
        status: "idle",
        enabled: true,
        lastActivity: "",
        continuousMode: false,
      };

      const result = await processTaskWithAI(task, agent);

      expect(result.success).toBe(true);
      if (result.confidence !== undefined) {
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    });
  });
});
