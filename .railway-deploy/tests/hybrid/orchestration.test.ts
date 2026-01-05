/**
 * Testes E2E - Agent Orchestration
 *
 * Testa os 4 padrões de orquestração de agentes
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AgentOrchestrator, OrchestrationPatterns } from "@/lib/ai/agent-orchestrator";
import { SimpleAgent, InMemoryMemoryStore } from "@/lib/ai/core-agent";
import { HttpLlmClient } from "@/lib/ai/http-llm-client";

describe("Agent Orchestration - E2E", () => {
  let orchestrator: AgentOrchestrator;
  let mockAgents: Map<string, SimpleAgent>;

  beforeEach(() => {
    // Setup mock agents
    mockAgents = new Map();

    const llmClient = new HttpLlmClient("/api/llm-proxy");

    // Mock agent responses
    class MockAgent extends SimpleAgent {
      async run(input: string) {
        return {
          answer: `Mock response for: ${input}`,
          steps: 1,
          usedTools: [],
          traces: [],
          totalDuration: 100,
        };
      }
    }

    mockAgents.set("harvey", new MockAgent({
      llm: llmClient,
      tools: [],
      persona: {
        id: "harvey",
        name: "Harvey Specter",
        description: "Strategic legal advisor",
        systemPrompt: "You are Harvey Specter",
        toolNames: [],
      },
      toolContext: { baseUrl: "http://localhost" },
    }));

    mockAgents.set("justine", new MockAgent({
      llm: llmClient,
      tools: [],
      persona: {
        id: "justine",
        name: "Mrs. Justin-e",
        description: "Intimation analyzer",
        systemPrompt: "You are Mrs. Justin-e",
        toolNames: [],
      },
      toolContext: { baseUrl: "http://localhost" },
    }));

    mockAgents.set("gestao-prazos", new MockAgent({
      llm: llmClient,
      tools: [],
      persona: {
        id: "gestao-prazos",
        name: "Gestão de Prazos",
        description: "Deadline calculator",
        systemPrompt: "You calculate deadlines",
        toolNames: [],
      },
      toolContext: { baseUrl: "http://localhost" },
    }));
  });

  describe("Sequential Orchestration", () => {
    it("deve executar agentes em sequência respeitando dependências", async () => {
      orchestrator = new AgentOrchestrator(mockAgents, "sequential");

      const tasks = OrchestrationPatterns.intimacaoWorkflow();

      const result = await orchestrator.orchestrate(tasks);

      expect(result.success).toBe(true);
      expect(result.results.size).toBe(3);
      expect(result.traces.length).toBe(3);

      // Verifica ordem de execução
      expect(result.traces[0].taskId).toBe("analyze-intimacao");
      expect(result.traces[1].taskId).toBe("calculate-deadline");
      expect(result.traces[2].taskId).toBe("create-task");
    });

    it("deve interromper se uma tarefa falhar", async () => {
      orchestrator = new AgentOrchestrator(mockAgents, "sequential");

      // Criar tarefa com agente inexistente
      const tasks = [
        {
          id: "task-1",
          assignedTo: "nonexistent-agent",
          input: "Test",
          priority: "high" as const,
        },
        {
          id: "task-2",
          assignedTo: "harvey",
          input: "Test 2",
          priority: "medium" as const,
          dependencies: ["task-1"],
        },
      ];

      const result = await orchestrator.orchestrate(tasks);

      expect(result.success).toBe(false);
      expect(result.traces.some((t) => t.error)).toBe(true);
    });
  });

  describe("Parallel Orchestration", () => {
    it("deve executar agentes em paralelo independentemente", async () => {
      orchestrator = new AgentOrchestrator(mockAgents, "parallel");

      const tasks = OrchestrationPatterns.caseAnalysisParallel("PROC-123");

      const startTime = Date.now();
      const result = await orchestrator.orchestrate(tasks);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.results.size).toBe(tasks.length);

      // Parallel deve ser mais rápido que sequential
      // (Considerando que cada task mock demora ~100ms)
      expect(duration).toBeLessThan(tasks.length * 200);
    });

    it("não deve bloquear se um agente falhar", async () => {
      orchestrator = new AgentOrchestrator(mockAgents, "parallel");

      const tasks = [
        {
          id: "task-1",
          assignedTo: "harvey",
          input: "Valid task",
          priority: "high" as const,
        },
        {
          id: "task-2",
          assignedTo: "nonexistent-agent",
          input: "Invalid task",
          priority: "medium" as const,
        },
        {
          id: "task-3",
          assignedTo: "justine",
          input: "Another valid task",
          priority: "medium" as const,
        },
      ];

      const result = await orchestrator.orchestrate(tasks);

      // Deve ter sucesso parcial
      expect(result.success).toBe(false);
      expect(result.results.size).toBe(2); // 2 sucessos, 1 falha
      expect(result.traces.length).toBe(3);
      expect(result.traces.some((t) => t.error)).toBe(true);
      expect(result.traces.some((t) => !t.error)).toBe(true);
    });
  });

  describe("Hierarchical Orchestration", () => {
    it("deve permitir coordenador delegar para subordinados", async () => {
      orchestrator = new AgentOrchestrator(mockAgents, "hierarchical");

      const tasks = OrchestrationPatterns.strategicReview();

      const result = await orchestrator.orchestrate(tasks);

      expect(result.success).toBe(true);
      expect(result.traces.length).toBeGreaterThan(0);

      // Primeiro trace deve ser do coordenador (harvey)
      expect(result.traces[0].agentId).toBe("harvey");
    });
  });

  describe("Collaborative Orchestration", () => {
    it("deve permitir votação entre múltiplos agentes", async () => {
      orchestrator = new AgentOrchestrator(mockAgents, "collaborative");

      const tasks = [
        {
          id: "consensus-task",
          assignedTo: "harvey", // Não importa, todos votam
          input: "Avaliar viabilidade de recurso",
          priority: "critical" as const,
        },
      ];

      const result = await orchestrator.orchestrate(tasks);

      expect(result.success).toBe(true);
      expect(result.traces.length).toBe(mockAgents.size); // Todos agentes votaram
      expect(result.results.has("consensus-task")).toBe(true);
    });

    it("deve escolher resultado majoritário", async () => {
      orchestrator = new AgentOrchestrator(mockAgents, "collaborative");

      const tasks = [
        {
          id: "vote-task",
          assignedTo: "any",
          input: "Test consensus",
          priority: "high" as const,
        },
      ];

      const result = await orchestrator.orchestrate(tasks);

      expect(result.success).toBe(true);

      const consensusResult = result.results.get("vote-task");
      expect(consensusResult).toBeDefined();
    });
  });

  describe("Topological Sort (Dependências)", () => {
    it("deve ordenar tarefas respeitando dependências", async () => {
      orchestrator = new AgentOrchestrator(mockAgents, "sequential");

      // Criar DAG complexo de dependências
      const tasks = [
        {
          id: "task-C",
          assignedTo: "harvey",
          input: "C",
          priority: "low" as const,
          dependencies: ["task-A", "task-B"],
        },
        {
          id: "task-A",
          assignedTo: "justine",
          input: "A",
          priority: "high" as const,
        },
        {
          id: "task-B",
          assignedTo: "gestao-prazos",
          input: "B",
          priority: "medium" as const,
          dependencies: ["task-A"],
        },
      ];

      const result = await orchestrator.orchestrate(tasks);

      expect(result.success).toBe(true);

      // Verifica ordem: A deve executar antes de B, B antes de C
      const aIndex = result.traces.findIndex((t) => t.taskId === "task-A");
      const bIndex = result.traces.findIndex((t) => t.taskId === "task-B");
      const cIndex = result.traces.findIndex((t) => t.taskId === "task-C");

      expect(aIndex).toBeLessThan(bIndex);
      expect(bIndex).toBeLessThan(cIndex);
    });

    it("deve detectar dependências circulares", async () => {
      orchestrator = new AgentOrchestrator(mockAgents, "sequential");

      // Criar dependência circular
      const tasks = [
        {
          id: "task-A",
          assignedTo: "harvey",
          input: "A",
          priority: "medium" as const,
          dependencies: ["task-B"],
        },
        {
          id: "task-B",
          assignedTo: "justine",
          input: "B",
          priority: "medium" as const,
          dependencies: ["task-A"], // Circular!
        },
      ];

      await expect(orchestrator.orchestrate(tasks)).rejects.toThrow("Dependência circular");
    });
  });

  describe("Timeouts e Resiliência", () => {
    it("deve respeitar timeout por tarefa", async () => {
      orchestrator = new AgentOrchestrator(mockAgents, "sequential");

      const tasks = [
        {
          id: "timeout-task",
          assignedTo: "harvey",
          input: "Test",
          priority: "high" as const,
          timeout: 50, // 50ms timeout (muito curto)
        },
      ];

      const result = await orchestrator.orchestrate(tasks);

      // Deve falhar por timeout
      const trace = result.traces[0];
      expect(trace.error).toBeDefined();
      expect(trace.error).toContain("timeout");
    });
  });
});
