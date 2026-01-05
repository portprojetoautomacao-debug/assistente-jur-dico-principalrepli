import { expect, test } from "@playwright/test";

test.describe("Agent Orchestration & Observability", () => {
  test("should return healthy status from observability API", async ({ request }) => {
    const response = await request.get("/api/observability?action=health");
    if (!response.ok()) {
      console.log("Status:", response.status());
      console.log("Body:", await response.text());
    }
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.ok).toBeTruthy();
    expect(data.status).toBeDefined();
    expect(data.services).toBeDefined();
  });

  test("should list all 15 agents status", async ({ request }) => {
    const response = await request.get("/api/observability?action=agents");
    if (!response.ok()) {
      console.log("Status:", response.status());
      console.log("Body:", await response.text());
    }
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.ok).toBeTruthy();
    expect(data.total).toBe(15);
    expect(Array.isArray(data.agents)).toBeTruthy();
    expect(data.agents.length).toBe(15);

    // Check for core agents
    const agentIds = data.agents.map((a: { id: string }) => a.id);
    expect(agentIds).toContain("harvey");
    expect(agentIds).toContain("justine");
    expect(agentIds).toContain("monitor-djen");
    expect(agentIds).toContain("gestao-prazos");
    expect(agentIds).toContain("redacao-peticoes");
  });

  test("should return circuit breaker status for all services", async ({ request }) => {
    const response = await request.get("/api/observability?action=circuit-breakers");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.ok).toBeTruthy();
    expect(Array.isArray(data.breakers)).toBeTruthy();
    expect(data.breakers.length).toBeGreaterThan(0);

    // Check for key circuit breakers
    const breakerNames = data.breakers.map((b: { name: string }) => b.name);
    expect(breakerNames).toContain("gemini-api");
    expect(breakerNames).toContain("djen-api");
    expect(breakerNames).toContain("qdrant-vector-db");
  });

  test("should return task metrics and queue info", async ({ request }) => {
    const response = await request.get("/api/observability?action=metrics");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.ok).toBeTruthy();
    expect(data.metrics).toBeDefined();
    expect(data.tasks).toBeDefined();
    expect(typeof data.tasks.completed).toBe("number");
    expect(typeof data.tasks.queued).toBe("number");
  });

  test("should return hybrid execution stats", async ({ request }) => {
    const response = await request.get("/api/observability?action=hybrid-stats");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.ok).toBeTruthy();
    expect(data.stats).toBeDefined();
    expect(typeof data.stats.totalExecutions).toBe("number");
    expect(typeof data.stats.langGraphExecutions).toBe("number");
    expect(typeof data.stats.successRate).toBe("number");
  });

  test("should return full dashboard with all components", async ({ request }) => {
    const response = await request.get("/api/observability?action=full");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.ok).toBeTruthy();
    expect(data.status).toBeDefined();
    expect(data.agents).toBeDefined();
    expect(data.agents.total).toBe(15);
    expect(data.tasks).toBeDefined();
    expect(data.hybrid).toBeDefined();
    expect(data.circuitBreakers).toBeDefined();
    expect(data.services).toBeDefined();
    expect(data.metrics).toBeDefined();
  });

  test("should list available actions when no action specified", async ({ request }) => {
    const response = await request.get("/api/observability");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.ok).toBeTruthy();
    expect(Array.isArray(data.availableActions)).toBeTruthy();
    expect(data.availableActions).toContain("health");
    expect(data.availableActions).toContain("agents");
    expect(data.availableActions).toContain("full");
  });
});
