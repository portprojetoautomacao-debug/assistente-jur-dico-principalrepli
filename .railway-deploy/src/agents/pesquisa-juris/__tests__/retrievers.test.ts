/**
 * Testes unitários para retrievers.ts
 * Seguindo padrão de testes do Google Agent Starter Pack
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { JurisprudenceRetriever, formatPrecedentes, type Precedente } from "../retrievers";
import type { PesquisaJurisInput } from "../validators";

describe("JurisprudenceRetriever", () => {
  let retriever: JurisprudenceRetriever;

  beforeEach(() => {
    retriever = new JurisprudenceRetriever();
  });

  describe("✅ search() - Busca principal", () => {
    it("deve retornar resultados com estrutura correta", async () => {
      const input: PesquisaJurisInput = {
        tema: "direito à greve",
        tribunal: "STF",
        dataInicio: "2020-01-01",
        dataFim: "2024-12-31",
        limit: 10,
        relevanceThreshold: 0.7,
      };

      const result = await retriever.search(input);

      expect(result).toHaveProperty("precedentes");
      expect(result).toHaveProperty("totalFound");
      expect(result).toHaveProperty("avgRelevance");
      expect(result).toHaveProperty("query");
      expect(result).toHaveProperty("executionTimeMs");
      expect(Array.isArray(result.precedentes)).toBe(true);
    });

    it("deve respeitar limite de resultados", async () => {
      const input: PesquisaJurisInput = {
        tema: "horas extras",
        tribunal: "todos",
        limit: 3,
        relevanceThreshold: 0.5,
        dataInicio: "2020-01-01",
        dataFim: "2024-12-31",
      };

      const result = await retriever.search(input);

      expect(result.precedentes.length).toBeLessThanOrEqual(3);
    });

    it("deve filtrar por threshold de relevância", async () => {
      const input: PesquisaJurisInput = {
        tema: "greve",
        tribunal: "todos",
        limit: 50,
        relevanceThreshold: 0.9,
        dataInicio: "2020-01-01",
        dataFim: "2024-12-31",
      };

      const result = await retriever.search(input);

      // Todos os precedentes devem ter relevância >= 0.9
      result.precedentes.forEach((p) => {
        expect(p.relevancia).toBeGreaterThanOrEqual(0.9);
      });
    });

    it("deve filtrar por tribunal quando especificado", async () => {
      const input: PesquisaJurisInput = {
        tema: "greve",
        tribunal: "STF",
        limit: 10,
        relevanceThreshold: 0.5,
        dataInicio: "2020-01-01",
        dataFim: "2024-12-31",
      };

      const result = await retriever.search(input);

      // Todos os precedentes devem ser do STF
      result.precedentes.forEach((p) => {
        expect(p.tribunal).toBe("STF");
      });
    });

    it("deve retornar query no resultado", async () => {
      const input: PesquisaJurisInput = {
        tema: "adicional de insalubridade",
        tribunal: "todos",
        limit: 10,
        relevanceThreshold: 0.7,
        dataInicio: "2020-01-01",
        dataFim: "2024-12-31",
      };

      const result = await retriever.search(input);

      expect(result.query).toBe("adicional de insalubridade");
    });

    it("deve medir tempo de execução", async () => {
      const input: PesquisaJurisInput = {
        tema: "greve",
        tribunal: "todos",
        limit: 10,
        relevanceThreshold: 0.7,
        dataInicio: "2020-01-01",
        dataFim: "2024-12-31",
      };

      const result = await retriever.search(input);

      expect(result.executionTimeMs).toBeGreaterThan(0);
      expect(result.executionTimeMs).toBeLessThan(5000); // Menos de 5s
    });

    it("deve calcular relevância média corretamente", async () => {
      const input: PesquisaJurisInput = {
        tema: "greve",
        tribunal: "todos",
        limit: 10,
        relevanceThreshold: 0.5,
        dataInicio: "2020-01-01",
        dataFim: "2024-12-31",
      };

      const result = await retriever.search(input);

      if (result.precedentes.length > 0) {
        const manualAvg =
          result.precedentes.reduce((sum, p) => sum + p.relevancia, 0) / result.precedentes.length;

        expect(result.avgRelevance).toBeCloseTo(manualAvg, 2);
      } else {
        expect(result.avgRelevance).toBe(0);
      }
    });

    it("deve lançar erro estruturado em caso de falha", async () => {
      // Mock para forçar erro
      const badRetriever = new JurisprudenceRetriever();
      vi.spyOn(badRetriever as any, "generateEmbeddings").mockRejectedValue(
        new Error("Embedding API down")
      );

      const input: PesquisaJurisInput = {
        tema: "greve",
        tribunal: "todos",
        limit: 10,
        relevanceThreshold: 0.7,
        dataInicio: "2020-01-01",
        dataFim: "2024-12-31",
      };

      await expect(badRetriever.search(input)).rejects.toThrowError(
        /Calling retrieval tool with query/
      );
      await expect(badRetriever.search(input)).rejects.toThrowError(/greve/);
      await expect(badRetriever.search(input)).rejects.toThrowError(/Error: Embedding API down/);
    });
  });

  describe("✅ Estrutura de Precedente", () => {
    it("precedentes devem ter campos obrigatórios", async () => {
      const input: PesquisaJurisInput = {
        tema: "greve",
        tribunal: "todos",
        limit: 1,
        relevanceThreshold: 0.5,
        dataInicio: "2020-01-01",
        dataFim: "2024-12-31",
      };

      const result = await retriever.search(input);

      if (result.precedentes.length > 0) {
        const p = result.precedentes[0];

        expect(p).toHaveProperty("titulo");
        expect(p).toHaveProperty("ementa");
        expect(p).toHaveProperty("relevancia");
        expect(p).toHaveProperty("tribunal");
        expect(p).toHaveProperty("data");
        expect(typeof p.titulo).toBe("string");
        expect(typeof p.ementa).toBe("string");
        expect(typeof p.relevancia).toBe("number");
        expect(typeof p.tribunal).toBe("string");
        expect(typeof p.data).toBe("string");
      }
    });

    it("relevancia deve estar entre 0 e 1", async () => {
      const input: PesquisaJurisInput = {
        tema: "greve",
        tribunal: "todos",
        limit: 10,
        relevanceThreshold: 0.0,
        dataInicio: "2020-01-01",
        dataFim: "2024-12-31",
      };

      const result = await retriever.search(input);

      result.precedentes.forEach((p) => {
        expect(p.relevancia).toBeGreaterThanOrEqual(0);
        expect(p.relevancia).toBeLessThanOrEqual(1);
      });
    });

    it("data deve ter formato válido (YYYY-MM-DD)", async () => {
      const input: PesquisaJurisInput = {
        tema: "greve",
        tribunal: "todos",
        limit: 10,
        relevanceThreshold: 0.5,
        dataInicio: "2020-01-01",
        dataFim: "2024-12-31",
      };

      const result = await retriever.search(input);

      result.precedentes.forEach((p) => {
        expect(p.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });
});

describe("formatPrecedentes", () => {
  const mockPrecedentes: Precedente[] = [
    {
      titulo: "STF - Tema 1234",
      ementa: "Direito constitucional à greve...",
      relevancia: 0.95,
      tribunal: "STF",
      data: "2023-05-15",
      numeroProcesso: "RE 654432",
      relator: "Min. Roberto Barroso",
      tags: ["direito constitucional", "greve"],
    },
    {
      titulo: "STJ - REsp 987654",
      ementa: "Adicional de insalubridade...",
      relevancia: 0.82,
      tribunal: "STJ",
      data: "2023-08-22",
      numeroProcesso: "REsp 987654/SP",
      relator: "Min. Maria Isabel Gallotti",
    },
  ];

  it("deve formatar precedentes corretamente", () => {
    const formatted = formatPrecedentes(mockPrecedentes);

    expect(formatted).toContain("STF - RE 654432");
    expect(formatted).toContain("Direito constitucional à greve");
    expect(formatted).toContain("Relevância: 95%");
    expect(formatted).toContain("Data: 2023-05-15");
    expect(formatted).toContain("Min. Roberto Barroso");
  });

  it("deve numerar precedentes sequencialmente", () => {
    const formatted = formatPrecedentes(mockPrecedentes);

    expect(formatted).toContain("1. **STF");
    expect(formatted).toContain("2. **STJ");
  });

  it("deve incluir tags quando disponíveis", () => {
    const formatted = formatPrecedentes(mockPrecedentes);

    expect(formatted).toContain("Tags: direito constitucional, greve");
  });

  it("deve incluir relator quando disponível", () => {
    const formatted = formatPrecedentes(mockPrecedentes);

    expect(formatted).toContain("Relator: Min. Roberto Barroso");
    expect(formatted).toContain("Relator: Min. Maria Isabel Gallotti");
  });

  it("deve retornar mensagem quando nenhum precedente encontrado", () => {
    const formatted = formatPrecedentes([]);

    expect(formatted).toContain("Nenhum precedente encontrado");
  });

  it("deve separar precedentes com ---", () => {
    const formatted = formatPrecedentes(mockPrecedentes);

    expect(formatted).toContain("---");
    // Deve ter 1 separador para 2 precedentes
    expect((formatted.match(/---/g) || []).length).toBe(1);
  });

  it("deve converter relevância para porcentagem", () => {
    const singlePrecedente: Precedente[] = [
      {
        titulo: "Teste",
        ementa: "Teste ementa",
        relevancia: 0.756,
        tribunal: "STF",
        data: "2024-01-01",
      },
    ];

    const formatted = formatPrecedentes(singlePrecedente);

    expect(formatted).toContain("Relevância: 76%"); // 0.756 * 100 = 75.6 -> 76%
  });

  it("deve omitir relator quando não disponível", () => {
    const withoutRelator: Precedente[] = [
      {
        titulo: "Teste",
        ementa: "Teste ementa",
        relevancia: 0.8,
        tribunal: "STF",
        data: "2024-01-01",
      },
    ];

    const formatted = formatPrecedentes(withoutRelator);

    expect(formatted).not.toContain("Relator:");
  });

  it("deve omitir tags quando não disponíveis", () => {
    const withoutTags: Precedente[] = [
      {
        titulo: "Teste",
        ementa: "Teste ementa",
        relevancia: 0.8,
        tribunal: "STF",
        data: "2024-01-01",
      },
    ];

    const formatted = formatPrecedentes(withoutTags);

    expect(formatted).not.toContain("Tags:");
  });
});
