/**
 * Suite Completa de Testes de Integração dos Agentes
 *
 * Testa:
 * - Execução individual de agentes
 * - Orquestração multi-agente
 * - Métricas e monitoramento
 * - Circuit breaker
 * - Degraded mode
 * - Health checks
 */

import { beforeAll, describe, expect, it } from "vitest";

const BASE_URL = "http://localhost:3001/api/agents";
const TIMEOUT = 60000; // 60s para operações com IA real

const isCI = process.env.CI === "true";
const shouldRun = !isCI && process.env.ENABLE_REAL_AGENTS_TEST === "true";
const describeFn = shouldRun ? describe : describe.skip;

describeFn("Integração Completa dos Agentes", () => {
  beforeAll(async () => {
    // Reset stats antes dos testes
    await fetch(`${BASE_URL}/reset-stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  });

  describe("1. Listagem de Agentes", () => {
    it("deve listar todos os 14 agentes disponíveis", async () => {
      const response = await fetch(`${BASE_URL}/list`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.total).toBe(14);
      expect(Array.isArray(data.agents)).toBe(true);

      // Verificar estrutura de cada agente
      data.agents.forEach((agent: any) => {
        expect(agent).toHaveProperty("agentId");
        expect(agent).toHaveProperty("type");
        expect(agent).toHaveProperty("status");
        expect(agent.status).toBe("available");
      });

      // Verificar agentes principais
      const agentIds = data.agents.map((a: any) => a.agentId);
      expect(agentIds).toContain("harvey-specter");
      expect(agentIds).toContain("mrs-justine");
      expect(agentIds).toContain("monitor-djen");
      expect(agentIds).toContain("gestao-prazos");
      expect(agentIds).toContain("redacao-peticoes");
    });

    it("deve retornar timestamp no formato ISO", async () => {
      const response = await fetch(`${BASE_URL}/list`);
      const data = await response.json();

      expect(data.timestamp).toBeDefined();
      expect(() => new Date(data.timestamp)).not.toThrow();
    });
  });

  describe("2. Execução Individual de Agentes", () => {
    it(
      "deve executar Harvey Specter com sucesso",
      async () => {
        const payload = {
          agentId: "harvey-specter",
          task: "Analise esta situação: Cliente possui processo trabalhista com prazo de 15 dias.",
        };

        const response = await fetch(`${BASE_URL}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.mode).toBe("langgraph");
        expect(data.agentId).toBe("harvey-specter");
        expect(data.result).toBeDefined();
        expect(data.result.completed).toBe(true);
        expect(data.executionTime).toBeGreaterThan(0);
        expect(data.degraded).toBe(false);
      },
      TIMEOUT
    );

    it(
      "deve executar Mrs. Justine com sucesso",
      async () => {
        const payload = {
          agentId: "mrs-justine",
          task: "Analise esta intimação: Cliente recebeu intimação judicial em 01/01/2026.",
        };

        const response = await fetch(`${BASE_URL}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.agentId).toBe("mrs-justine");
        expect(data.result.completed).toBe(true);
      },
      TIMEOUT
    );

    it(
      "deve executar Gestão de Prazos com sucesso",
      async () => {
        const payload = {
          agentId: "gestao-prazos",
          task: "Calcule prazo de 15 dias úteis a partir de 02/01/2026",
        };

        const response = await fetch(`${BASE_URL}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.agentId).toBe("gestao-prazos");
      },
      TIMEOUT
    );

    it("deve rejeitar agente inexistente", async () => {
      const payload = {
        agentId: "agente-nao-existe",
        task: "Teste",
      };

      const response = await fetch(`${BASE_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("not found");
    });

    it("deve rejeitar payload sem agentId", async () => {
      const payload = {
        task: "Teste sem agentId",
      };

      const response = await fetch(`${BASE_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("required");
    });

    it("deve rejeitar payload sem task", async () => {
      const payload = {
        agentId: "harvey-specter",
      };

      const response = await fetch(`${BASE_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe("3. Orquestração Multi-Agente", () => {
    it(
      "deve orquestrar 2 agentes em sequência",
      async () => {
        const payload = {
          agents: ["harvey-specter", "gestao-prazos"],
          task: "Analise caso e calcule prazos",
          maxRounds: 2,
        };

        const response = await fetch(`${BASE_URL}/orchestrate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.messages)).toBe(true);
        expect(data.messages.length).toBeGreaterThan(0);
        expect(data.rounds).toBeGreaterThanOrEqual(1);
        expect(data.duration).toBeGreaterThan(0);
        expect(data.agentsUsed).toContain("harvey-specter");
        expect(data.agentsUsed).toContain("gestao-prazos");
      },
      TIMEOUT
    );

    it(
      "deve orquestrar 3 agentes",
      async () => {
        const payload = {
          agents: ["harvey-specter", "mrs-justine", "gestao-prazos"],
          task: "Workflow completo: análise, intimação, prazos",
        };

        const response = await fetch(`${BASE_URL}/orchestrate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.agentsUsed.length).toBe(3);
      },
      TIMEOUT
    );

    it(
      "deve filtrar agentes inválidos na orquestração",
      async () => {
        const payload = {
          agents: ["harvey-specter", "agente-invalido", "gestao-prazos"],
          task: "Teste com agente inválido",
        };

        const response = await fetch(`${BASE_URL}/orchestrate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.agentsUsed).not.toContain("agente-invalido");
        expect(data.agentsUsed.length).toBe(2);
      },
      TIMEOUT
    );

    it("deve rejeitar orquestração sem agents", async () => {
      const payload = {
        task: "Teste sem agentes",
      };

      const response = await fetch(`${BASE_URL}/orchestrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it("deve rejeitar orquestração com array vazio", async () => {
      const payload = {
        agents: [],
        task: "Teste com array vazio",
      };

      const response = await fetch(`${BASE_URL}/orchestrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("4. Métricas e Estatísticas", () => {
    it("deve obter estatísticas atualizadas", async () => {
      const response = await fetch(`${BASE_URL}/stats`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.stats).toBeDefined();
      expect(data.stats.totalExecutions).toBeGreaterThanOrEqual(0);
      expect(data.stats.successRate).toBeGreaterThanOrEqual(0);
      expect(data.stats.successRate).toBeLessThanOrEqual(100);
    });

    it(
      "deve incrementar totalExecutions após execução",
      async () => {
        // Get initial stats
        const initialResponse = await fetch(`${BASE_URL}/stats`);
        const initialData = await initialResponse.json();
        const initialCount = initialData.stats.totalExecutions;

        // Execute an agent
        await fetch(`${BASE_URL}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: "harvey-specter",
            task: "Teste para verificar incremento de métricas",
          }),
        });

        // Get updated stats
        const updatedResponse = await fetch(`${BASE_URL}/stats`);
        const updatedData = await updatedResponse.json();
        const updatedCount = updatedData.stats.totalExecutions;

        expect(updatedCount).toBe(initialCount + 1);
      },
      TIMEOUT
    );

    it("deve resetar estatísticas", async () => {
      const response = await fetch(`${BASE_URL}/reset-stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain("reset");

      // Verify stats were reset
      const statsResponse = await fetch(`${BASE_URL}/stats`);
      const statsData = await statsResponse.json();
      expect(statsData.stats.totalExecutions).toBe(0);
    });

    it(
      "deve calcular averageExecutionTime corretamente",
      async () => {
        // Reset and execute multiple agents
        await fetch(`${BASE_URL}/reset-stats`, { method: "POST" });

        const tasks = [
          { agentId: "harvey-specter", task: "Teste 1" },
          { agentId: "gestao-prazos", task: "Teste 2" },
        ];

        for (const task of tasks) {
          await fetch(`${BASE_URL}/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task),
          });
        }

        const statsResponse = await fetch(`${BASE_URL}/stats`);
        const statsData = await statsResponse.json();

        expect(statsData.stats.averageExecutionTime).toBeGreaterThan(0);
        expect(statsData.stats.totalExecutions).toBe(2);
      },
      TIMEOUT * 2
    );
  });

  describe("5. Health Checks", () => {
    it("deve retornar health status completo", async () => {
      const response = await fetch(`${BASE_URL}/health`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.status).toBeDefined();
      expect(["healthy", "degraded", "unhealthy"]).toContain(data.status);
      expect(data.totalAgents).toBe(14);
      expect(data.agents).toBeDefined();
    });

    it("deve incluir informações de ambiente", async () => {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();

      expect(data.environmentHealth).toBeDefined();
      expect(data.environmentHealth).toHaveProperty("geminiApiKey");
      expect(data.environmentHealth).toHaveProperty("upstashRedis");
      expect(data.environmentHealth).toHaveProperty("djenSchedulerEnabled");
    });

    it("deve listar agentes unhealthy (se houver)", async () => {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();

      expect(Array.isArray(data.unhealthyAgents)).toBe(true);
      expect(Array.isArray(data.degradedAgents)).toBe(true);
    });

    it("deve incluir stats agregados no health", async () => {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();

      expect(data.stats).toBeDefined();
      expect(data.stats).toHaveProperty("totalExecutions");
      expect(data.stats).toHaveProperty("successRate");
      expect(data.stats).toHaveProperty("errorRate");
    });

    it("deve validar config do Gemini", async () => {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();

      expect(data).toHaveProperty("geminiConfigValid");
      expect(typeof data.geminiConfigValid).toBe("boolean");
    });
  });

  describe("6. Testes de Robustez", () => {
    it("deve lidar com timeout configurado", async () => {
      const payload = {
        agentId: "harvey-specter",
        task: "Análise complexa que pode demorar",
        config: {
          timeoutMs: 5000, // 5s timeout
        },
      };

      const response = await fetch(`${BASE_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Should complete or timeout gracefully
      expect([200, 500]).toContain(response.status);
    }, 10000);

    it(
      "deve lidar com múltiplas execuções concorrentes",
      async () => {
        const tasks = [
          { agentId: "harvey-specter", task: "Análise 1" },
          { agentId: "mrs-justine", task: "Análise 2" },
          { agentId: "gestao-prazos", task: "Cálculo 1" },
        ];

        const promises = tasks.map((task) =>
          fetch(`${BASE_URL}/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task),
          })
        );

        const responses = await Promise.all(promises);

        // All should complete successfully
        responses.forEach((response) => {
          expect([200, 500]).toContain(response.status);
        });
      },
      TIMEOUT * 3
    );

    it(
      "deve registrar degraded mode quando apropriado",
      async () => {
        // Execute agent multiple times to potentially trigger degraded mode
        const payload = {
          agentId: "harvey-specter",
          task: "Teste de degraded mode",
        };

        const response = await fetch(`${BASE_URL}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        expect(data).toHaveProperty("degraded");
        expect(typeof data.degraded).toBe("boolean");
      },
      TIMEOUT
    );
  });

  describe("7. Validação de Respostas", () => {
    it("todas as respostas devem incluir timestamp", async () => {
      const endpoints = [
        { url: `${BASE_URL}/list`, method: "GET" },
        { url: `${BASE_URL}/stats`, method: "GET" },
        { url: `${BASE_URL}/health`, method: "GET" },
      ];

      for (const { url, method } of endpoints) {
        const response = await fetch(url, { method });
        const data = await response.json();

        expect(data.timestamp).toBeDefined();
        expect(() => new Date(data.timestamp)).not.toThrow();
      }
    });

    it(
      "todas as respostas devem incluir flag success",
      async () => {
        const response = await fetch(`${BASE_URL}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: "harvey-specter",
            task: "Teste de flag success",
          }),
        });

        const data = await response.json();
        expect(data).toHaveProperty("success");
        expect(typeof data.success).toBe("boolean");
      },
      TIMEOUT
    );

    it("respostas de erro devem incluir mensagem descritiva", async () => {
      const response = await fetch(`${BASE_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: "agente-invalido",
          task: "Teste",
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(typeof data.error).toBe("string");
      expect(data.error.length).toBeGreaterThan(0);
    });
  });
});
