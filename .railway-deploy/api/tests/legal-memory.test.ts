import { describe, expect, it } from "vitest";
import { legalMemory } from "../../src/lib/legal-memory";

describe("legalMemory", () => {
  it("adds context and can retrieve it", async () => {
    const item = await legalMemory.addContext(
      "Petição inicial sobre contrato",
      "peca_processual",
      { processo: "123" },
      ["contrato"]
    );
    expect(item.id).toBeDefined();
    const byId = await legalMemory.getById(item.id);
    expect(byId?.content).toContain("Petição");
  });

  it("search finds added item", async () => {
    const results = await legalMemory.search({ query: "contrato", limit: 3 });
    expect(results.length).toBeGreaterThan(0);
  });

  it("updates existing item", async () => {
    const item = await legalMemory.addContext(
      "Estratégia defesa trabalhista",
      "estrategia",
      { processo: "999" }
    );
    const updated = await legalMemory.update(item.id, {
      content: "Estratégia defesa revisada",
    });
    expect(updated?.content).toContain("revisada");
  });
});
