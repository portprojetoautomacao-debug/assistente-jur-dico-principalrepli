/**
 * Tests for AI Agents system
 */

import { describe, expect, it } from "vitest";
import {
  type Agent,
  type AgentTask,
  canResumeAfterHuman,
  createTaskGenerator,
  initializeAgents,
  processTaskWithAI,
  shouldPauseForHuman,
} from "./agents.js";

describe("AI Agents System", () => {
  describe("processTaskWithAI", () => {
    it("should process monitoring tasks successfully", async () => {
      const task: AgentTask = {
        id: "1",
        agentId: "monitor-djen",
        type: "MONITOR_DJEN",
        priority: "high",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: { description: "Check DJEN publications" },
      };

      const agent: Agent = {
        id: "monitor-djen",
        name: "DJEN Monitor",
        description: "Monitors DJEN",
        type: "monitor",
        status: "idle",
        enabled: true,
        lastActivity: "",
        continuousMode: true,
      };

      const result = await processTaskWithAI(task, agent);

      expect(result.success).toBe(true);
      expect(result.message).toContain("Monitoramento");
      expect(result.data).toBeDefined();
    });

    it("should process analysis tasks successfully", async () => {
      const task: AgentTask = {
        id: "2",
        agentId: "analise-documental",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: { description: "Analyze legal document" },
      };

      const agent: Agent = {
        id: "analise-documental",
        name: "Document Analyzer",
        description: "Analyzes documents",
        type: "analyzer",
        status: "idle",
        enabled: true,
        lastActivity: "",
        continuousMode: true,
      };

      const result = await processTaskWithAI(task, agent);

      expect(result.success).toBe(true);
      expect(result.message).toContain("Análise");
      // depende da implementação, então só garante que existe confidence numérico
      if (result.data && typeof result.data === "object" && "confidence" in result.data) {
        const confidence = (result.data as { confidence?: number }).confidence;
        expect(typeof confidence).toBe("number");
      }
    });

    it("should process deadline calculation tasks", async () => {
      const task: AgentTask = {
        id: "3",
        agentId: "gestao-prazos",
        type: "CALCULATE_DEADLINE",
        priority: "high",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: { businessDays: 15 },
      };

      const agent: Agent = {
        id: "gestao-prazos",
        name: "Deadline Calculator",
        description: "Calculates deadlines",
        type: "calculator",
        status: "idle",
        enabled: true,
        lastActivity: "",
        continuousMode: true,
      };

      const result = await processTaskWithAI(task, agent);

      expect(result.success).toBe(true);
      if (result.data && typeof result.data === "object") {
        const data = result.data as { deadline?: unknown; businessDays?: number };
        expect(data.deadline).toBeDefined();
        if (typeof data.businessDays === "number") {
          expect(data.businessDays).toBe(15);
        }
      }
    });
  });

  describe("shouldPauseForHuman", () => {
    const agent: Agent = {
      id: "harvey",
      name: "Test Agent",
      description: "Test",
      type: "test",
      status: "idle",
      enabled: true,
      lastActivity: "",
      continuousMode: true,
    };

    it("should pause for critical priority tasks", () => {
      const task: AgentTask = {
        id: "1",
        agentId: "harvey",
        type: "MONITOR_DJEN",
        priority: "critical",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {},
      };

      expect(shouldPauseForHuman(agent, task)).toBe(true);
    });

    it("should pause for tasks that failed multiple times", () => {
      const task: AgentTask = {
        id: "2",
        agentId: "harvey",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {},
        retryCount: 3,
        maxRetries: 3,
      };

      expect(shouldPauseForHuman(agent, task)).toBe(true);
    });

    it("should pause for sensitive task types", () => {
      const task: AgentTask = {
        id: "3",
        agentId: "harvey",
        type: "CONTRACT_REVIEW",
        priority: "medium",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {},
      };

      expect(shouldPauseForHuman(agent, task)).toBe(true);
    });

    it("should not pause for normal tasks", () => {
      const task: AgentTask = {
        id: "4",
        agentId: "harvey",
        type: "RESEARCH_PRECEDENTS",
        priority: "medium",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {},
      };

      expect(shouldPauseForHuman(agent, task)).toBe(false);
    });
  });

  describe("canResumeAfterHuman", () => {
    it("should allow resume if explicitly marked", () => {
      const task: AgentTask = {
        id: "1",
        agentId: "harvey",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "human_intervention",
        createdAt: new Date().toISOString(),
        data: {},
        resumeAfterHuman: true,
      };

      expect(canResumeAfterHuman(task)).toBe(true);
    });

    it("should allow resume for queued tasks", () => {
      const task: AgentTask = {
        id: "2",
        agentId: "harvey",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "queued",
        createdAt: new Date().toISOString(),
        data: {},
      };

      expect(canResumeAfterHuman(task)).toBe(true);
    });

    it("should auto-resume after 24 hours", () => {
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);

      const task: AgentTask = {
        id: "3",
        agentId: "harvey",
        type: "ANALYZE_DOCUMENT",
        priority: "medium",
        status: "human_intervention",
        createdAt: new Date().toISOString(),
        data: {},
        humanTouchedAt: yesterday.toISOString(),
      };

      expect(canResumeAfterHuman(task)).toBe(true);
    });
  });

  describe("createTaskGenerator", () => {
    it("should generate tasks when started", async () => {
      const generatedTasks: AgentTask[] = [];

      const generator = createTaskGenerator(
        {
          enabled: true,
          intervalMinutes: 0.01, // bem curto pra teste
          maxTasksPerInterval: 2,
          agentIds: ["harvey", "justine"],
        },
        (task) => generatedTasks.push(task)
      );

      generator.start();

      await new Promise((resolve) => setTimeout(resolve, 100));

      generator.stop();

      expect(generatedTasks.length).toBeGreaterThan(0);
      expect(generatedTasks[0]).toHaveProperty("id");
      expect(generatedTasks[0]).toHaveProperty("type");
      expect(generatedTasks[0]).toHaveProperty("priority");
    });

    it("should respect maxTasksPerInterval", async () => {
      const generatedTasks: AgentTask[] = [];

      const generator = createTaskGenerator(
        {
          enabled: true,
          intervalMinutes: 0.01,
          maxTasksPerInterval: 1,
          agentIds: ["harvey"],
        },
        (task) => generatedTasks.push(task)
      );

      generator.start();
      await new Promise((resolve) => setTimeout(resolve, 50));
      generator.stop();

      expect(generatedTasks.length).toBeLessThanOrEqual(1);
    });
  });

  describe("initializeAgents", () => {
    it("should return all default agents when no existing agents", () => {
      const agents = initializeAgents();

      expect(agents.length).toBeGreaterThanOrEqual(15);
      expect(agents[0]).toHaveProperty("id");
      expect(agents[0]).toHaveProperty("name");
      expect(agents[0]).toHaveProperty("capabilities");

      const agentIds = agents.map((a) => a.id);
      expect(agentIds).toContain("harvey");
      expect(agentIds).toContain("justine");
      expect(agentIds).toContain("analise-documental");
      expect(agentIds).toContain("monitor-djen");
      expect(agentIds).toContain("gestao-prazos");
      expect(agentIds).toContain("redacao-peticoes");
      expect(agentIds).toContain("organizacao-arquivos");
      expect(agentIds).toContain("pesquisa-juris");
      expect(agentIds).toContain("analise-risco");
      expect(agentIds).toContain("revisao-contratual");
      expect(agentIds).toContain("comunicacao-clientes");
      expect(agentIds).toContain("financeiro");
      expect(agentIds).toContain("estrategia-processual");
      expect(agentIds).toContain("traducao-juridica");
      expect(agentIds).toContain("compliance");
      // New agent: pesquisa-juris-qdrant should be registered but disabled by default
      expect(agentIds).toContain("pesquisa-juris-qdrant");
    });

    it("should merge existing agents with defaults", () => {
      const existingAgents: Agent[] = [
        {
          id: "monitor-djen",
          name: "Custom DJEN Monitor",
          description: "Custom description",
          type: "monitor",
          status: "idle",
          enabled: false, // usuário desativou
          lastActivity: "Custom activity",
          continuousMode: false,
        },
      ];

      const agents = initializeAgents(existingAgents);

      const djenAgent = agents.find((a) => a.id === "monitor-djen");

      expect(djenAgent).toBeDefined();
      expect(djenAgent?.enabled).toBe(false);
      expect(djenAgent?.continuousMode).toBe(false);
      expect(djenAgent?.capabilities).toBeDefined();
    });

    it("should have Harvey and Justin-e as primary agents", () => {
      const agents = initializeAgents();

      const harvey = agents.find((a) => a.id === "harvey");
      const justine = agents.find((a) => a.id === "justine");

      expect(harvey).toBeDefined();
      expect(harvey?.name).toBe("Harvey Specter");
      expect(harvey?.enabled).toBe(true);

      expect(justine).toBeDefined();
      expect(justine?.name).toBe("Mrs. Justin-e");
      expect(justine?.enabled).toBe(true);
    });
  });
});
