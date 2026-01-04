/**
 * Teste de Integração REAL - Agentes LangGraph
 * ⚠️ SEM MOCKS - Usa API Anthropic real
 * 
 * Para executar: npm run test:integration
 * Requer: servidor rodando em localhost:3001
 */

import { describe, expect, it } from "vitest";

// Skip tests if server is not available
const SERVER_URL = process.env.TEST_SERVER_URL || "http://localhost:3001";
const skipIfNoServer = process.env.SKIP_INTEGRATION_TESTS === "true";

describe.skipIf(skipIfNoServer)("Agentes LangGraph - Integração Real", () => {
  it("deve listar agentes disponíveis", async () => {
    const response = await fetch(`${SERVER_URL}/api/agents/list`);
    const agents = await response.json();

    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThan(0);

    // Verificar estrutura dos agentes
    const firstAgent = agents[0];
    expect(firstAgent).toHaveProperty("id");
    expect(firstAgent).toHaveProperty("name");
    expect(firstAgent).toHaveProperty("type");
  });

  it("deve executar tarefa com agente harvey-specter REAL", async () => {
    const task = {
      agentId: "harvey-specter",
      task: "Analise brevemente a seguinte situação: Cliente precisa de orientação sobre processo trabalhista.",
      context: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    };

    const response = await fetch(`${SERVER_URL}/api/agents/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });

    expect(response.ok).toBe(true);

    const result = await response.json();

    expect(result).toBeDefined();
    expect(result.agentId).toBe("harvey-specter");
    expect(result.result).toBeDefined();
    expect(typeof result.result).toBe("string");
    expect(result.result.length).toBeGreaterThan(0);
    expect(result.executionTime).toBeGreaterThan(0);

    console.log("✅ Resposta do agente:", result.result.substring(0, 100) + "...");
  }, 60000); // 60s timeout para chamada API real

  it("deve obter estatísticas reais de execução", async () => {
    const response = await fetch(`${SERVER_URL}/api/agents/stats`);
    const stats = await response.json();

    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("totalExecutions");
    expect(stats).toHaveProperty("successRate");
    expect(typeof stats.totalExecutions).toBe("number");
  });
});
