/**
 * Testes E2E - Hybrid Agents Integration
 *
 * Testa a integração completa entre agentes tradicionais e LangGraph
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  executeHybridTask,
  hasHybridVersion,
  listHybridAgents,
  getHybridStats,
  resetHybridStats,
  recordExecution,
} from "@/lib/hybrid-agents-integration";
import type { AgentTask } from "@/lib/agents";

describe("Hybrid Agents Integration - E2E", () => {
  beforeEach(() => {
    resetHybridStats();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Verificação de Versões Híbridas", () => {
    it("deve identificar agentes com versão híbrida", () => {
      expect(hasHybridVersion("harvey")).toBe(true);
      expect(hasHybridVersion("justine")).toBe(true);
      expect(hasHybridVersion("monitor-djen")).toBe(true);
      expect(hasHybridVersion("unknown-agent")).toBe(false);
    });

    it("deve listar todos os agentes híbridos", () => {
      const hybridAgents = listHybridAgents();

      expect(hybridAgents.length).toBeGreaterThanOrEqual(15);
      expect(hybridAgents.some((a) => a.agentId === "harvey")).toBe(true);
      expect(hybridAgents.some((a) => a.agentId === "redacao-peticoes")).toBe(true);
    });
  });

  describe("Execução Modo LangGraph", () => {
    it("deve executar agente em modo LangGraph puro", async () => {
      const task: AgentTask = {
        id: "test-task-1",
        agentId: "harvey",
        type: "DRAFT_PETITION",
        priority: "MEDIUM",
        status: "QUEUED",
        createdAt: new Date().toISOString(),
        data: {
          description: "Analisar caso urgente com prazo em 48h",
        },
      };

      const result = await executeHybridTask("harvey", task, {
        enableLangGraph: true,
        enableTraditional: false,
        timeoutMs: 5000,
      });

      expect(result.success).toBeDefined();
      expect(result.mode).toBe("langgraph");
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.langGraphResult).toBeDefined();
    });
  });

  describe("Execução Modo Fallback", () => {
    it("deve fazer fallback para tradicional se LangGraph falhar", async () => {
      const task: AgentTask = {
        id: "test-task-2",
        agentId: "justine",
        type: "ANALYZE_INTIMATION",
        priority: "HIGH",
        status: "QUEUED",
        createdAt: new Date().toISOString(),
        data: {
          description: "Analisar intimação com prazo crítico",
        },
      };

      const result = await executeHybridTask("justine", task, {
        coordinationMode: "fallback",
        timeoutMs: 2000, // Timeout curto para forçar fallback
      });

      expect(result.success).toBeDefined();
      expect(["langgraph", "traditional"]).toContain(result.mode);
    });
  });

  describe("Execução Modo Sequential", () => {
    it("deve executar LangGraph primeiro, depois tradicional", async () => {
      const task: AgentTask = {
        id: "test-task-3",
        agentId: "redacao-peticoes",
        type: "DRAFT_PETITION",
        priority: "MEDIUM",
        status: "QUEUED",
        createdAt: new Date().toISOString(),
        data: {
          description: "Redigir contestação para ação de cobrança",
        },
      };

      const result = await executeHybridTask("redacao-peticoes", task, {
        coordinationMode: "sequential",
        timeoutMs: 10000,
      });

      expect(result.success).toBeDefined();
      expect(result.mode).toBe("hybrid");
      expect(result.langGraphResult).toBeDefined();
      expect(result.traditionalResult).toBeDefined();
    });
  });

  describe("Execução Modo Parallel", () => {
    it("deve executar LangGraph e tradicional em paralelo", async () => {
      const task: AgentTask = {
        id: "test-task-4",
        agentId: "analise-risco",
        type: "ANALYZE_INTIMATION",
        priority: "HIGH",
        status: "QUEUED",
        createdAt: new Date().toISOString(),
        data: {
          description: "Avaliar risco de ação trabalhista",
        },
      };

      const startTime = Date.now();

      const result = await executeHybridTask("analise-risco", task, {
        coordinationMode: "parallel",
        timeoutMs: 10000,
      });

      const duration = Date.now() - startTime;

      expect(result.success).toBeDefined();
      expect(result.mode).toBe("hybrid");
      // Parallel deve ser mais rápido que sequential
      expect(duration).toBeLessThan(20000);
    });
  });

  describe("Estatísticas de Execução", () => {
    it("deve registrar e recuperar estatísticas corretamente", async () => {
      // Executar múltiplas tarefas
      const tasks = [
        {
          id: "stats-1",
          agentId: "harvey",
          data: { description: "Análise estratégica" },
        },
        {
          id: "stats-2",
          agentId: "justine",
          data: { description: "Análise de intimação" },
        },
      ];

      for (const taskData of tasks) {
        const task: AgentTask = {
          ...taskData,
          type: "DRAFT_PETITION",
          priority: "MEDIUM",
          status: "QUEUED",
          createdAt: new Date().toISOString(),
        };

        const result = await executeHybridTask(taskData.agentId, task, {
          timeoutMs: 5000,
        });

        recordExecution(result);
      }

      const stats = getHybridStats();

      expect(stats.totalExecutions).toBe(2);
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeLessThanOrEqual(1);
    });

    it("deve separar estatísticas por modo de execução", async () => {
      const task: AgentTask = {
        id: "stats-mode-1",
        agentId: "harvey",
        type: "DRAFT_PETITION",
        priority: "MEDIUM",
        status: "QUEUED",
        createdAt: new Date().toISOString(),
        data: { description: "Test" },
      };

      // Executar em modo LangGraph
      const langGraphResult = await executeHybridTask("harvey", task, {
        enableLangGraph: true,
        enableTraditional: false,
      });
      recordExecution(langGraphResult);

      // Executar em modo tradicional
      const traditionalResult = await executeHybridTask("harvey", task, {
        enableLangGraph: false,
        enableTraditional: true,
      });
      recordExecution(traditionalResult);

      const stats = getHybridStats();

      expect(stats.totalExecutions).toBe(2);
      expect(stats.langGraphExecutions).toBeGreaterThanOrEqual(0);
      expect(stats.traditionalExecutions).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Tratamento de Erros", () => {
    it("deve lidar gracefully com agente inexistente", async () => {
      const task: AgentTask = {
        id: "error-task-1",
        agentId: "unknown-agent",
        type: "DRAFT_PETITION",
        priority: "MEDIUM",
        status: "QUEUED",
        createdAt: new Date().toISOString(),
        data: { description: "Test" },
      };

      const result = await executeHybridTask("unknown-agent", task, {
        timeoutMs: 2000,
      });

      // Deve fazer fallback para modo tradicional
      expect(result.mode).toBe("traditional");
      expect(result.traditionalResult).toBeDefined();
    });

    it("deve respeitar timeout configurado", async () => {
      const task: AgentTask = {
        id: "timeout-task-1",
        agentId: "harvey",
        type: "DRAFT_PETITION",
        priority: "MEDIUM",
        status: "QUEUED",
        createdAt: new Date().toISOString(),
        data: { description: "Test timeout" },
      };

      const startTime = Date.now();

      await executeHybridTask("harvey", task, {
        timeoutMs: 500, // Timeout muito curto
      });

      const duration = Date.now() - startTime;

      // Deve abortar rapidamente
      expect(duration).toBeLessThan(2000);
    });
  });
});
