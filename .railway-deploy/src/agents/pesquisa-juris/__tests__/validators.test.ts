/**
 * Testes unitários para validators.ts
 * Seguindo padrão de testes do Google Agent Starter Pack
 */

import { describe, expect, it } from "vitest";
import { validatePesquisaInput, ValidationError } from "../validators";

describe("validatePesquisaInput", () => {
  describe("✅ Validação de tema (obrigatório)", () => {
    it("deve aceitar tema válido", () => {
      const result = validatePesquisaInput({ tema: "direito à greve" });
      expect(result.tema).toBe("direito à greve");
    });

    it("deve rejeitar tema ausente", () => {
      expect(() => validatePesquisaInput({})).toThrowError(ValidationError);
      expect(() => validatePesquisaInput({})).toThrowError("Campo 'tema' é obrigatório");
    });

    it("deve rejeitar tema não-string", () => {
      expect(() => validatePesquisaInput({ tema: 123 })).toThrowError(ValidationError);
      expect(() => validatePesquisaInput({ tema: 123 })).toThrowError(
        "Campo 'tema' deve ser uma string"
      );
    });

    it("deve rejeitar tema muito curto (< 3 caracteres)", () => {
      expect(() => validatePesquisaInput({ tema: "ab" })).toThrowError(ValidationError);
      expect(() => validatePesquisaInput({ tema: "ab" })).toThrowError(
        "Campo 'tema' deve ter pelo menos 3 caracteres"
      );
    });

    it("deve rejeitar tema muito longo (> 500 caracteres)", () => {
      const longTema = "a".repeat(501);
      expect(() => validatePesquisaInput({ tema: longTema })).toThrowError(ValidationError);
      expect(() => validatePesquisaInput({ tema: longTema })).toThrowError(
        /não pode exceder 500 caracteres/
      );
    });

    it("deve aceitar tema com 500 caracteres exatos", () => {
      const maxTema = "a".repeat(500);
      const result = validatePesquisaInput({ tema: maxTema });
      expect(result.tema).toBe(maxTema);
    });
  });

  describe("✅ Validação de tribunal (opcional)", () => {
    it("deve aceitar tribunal válido", () => {
      const result = validatePesquisaInput({
        tema: "greve",
        tribunal: "STF",
      });
      expect(result.tribunal).toBe("STF");
    });

    it("deve aceitar 'todos' como tribunal", () => {
      const result = validatePesquisaInput({
        tema: "greve",
        tribunal: "todos",
      });
      expect(result.tribunal).toBe("todos");
    });

    it("deve usar 'todos' como default quando tribunal ausente", () => {
      const result = validatePesquisaInput({ tema: "greve" });
      expect(result.tribunal).toBe("todos");
    });

    it("deve rejeitar tribunal inválido", () => {
      expect(() => validatePesquisaInput({ tema: "greve", tribunal: "INVALIDO" })).toThrowError(
        ValidationError
      );
      expect(() => validatePesquisaInput({ tema: "greve", tribunal: "INVALIDO" })).toThrowError(
        /Tribunal inválido/
      );
    });

    it("deve aceitar todos os tribunais válidos", () => {
      const validTribunais = ["STF", "STJ", "TST", "TRF1", "TRF2", "TRF3", "TRF4", "TRF5", "todos"];

      validTribunais.forEach((tribunal) => {
        const result = validatePesquisaInput({ tema: "greve", tribunal });
        expect(result.tribunal).toBe(tribunal);
      });
    });
  });

  describe("✅ Validação de datas", () => {
    it("deve aceitar dataInicio válida (YYYY-MM-DD)", () => {
      const result = validatePesquisaInput({
        tema: "greve",
        dataInicio: "2020-01-01",
      });
      expect(result.dataInicio).toBe("2020-01-01");
    });

    it("deve aceitar dataFim válida", () => {
      const result = validatePesquisaInput({
        tema: "greve",
        dataFim: "2024-12-31",
      });
      expect(result.dataFim).toBe("2024-12-31");
    });

    it("deve rejeitar dataInicio com formato inválido", () => {
      expect(() => validatePesquisaInput({ tema: "greve", dataInicio: "01/01/2020" })).toThrowError(
        ValidationError
      );
      expect(() => validatePesquisaInput({ tema: "greve", dataInicio: "2020-1-1" })).toThrowError(
        /Use formato YYYY-MM-DD/
      );
    });

    it("deve rejeitar dataFim com formato inválido", () => {
      expect(() => validatePesquisaInput({ tema: "greve", dataFim: "31-12-2024" })).toThrowError(
        ValidationError
      );
    });

    it("deve rejeitar dataInicio posterior a dataFim", () => {
      expect(() =>
        validatePesquisaInput({
          tema: "greve",
          dataInicio: "2024-12-31",
          dataFim: "2020-01-01",
        })
      ).toThrowError(ValidationError);
      expect(() =>
        validatePesquisaInput({
          tema: "greve",
          dataInicio: "2024-12-31",
          dataFim: "2020-01-01",
        })
      ).toThrowError(/não pode ser posterior a dataFim/);
    });

    it("deve aceitar datas iguais", () => {
      const result = validatePesquisaInput({
        tema: "greve",
        dataInicio: "2024-01-01",
        dataFim: "2024-01-01",
      });
      expect(result.dataInicio).toBe("2024-01-01");
      expect(result.dataFim).toBe("2024-01-01");
    });

    it("deve usar defaults quando datas ausentes", () => {
      const result = validatePesquisaInput({ tema: "greve" });
      expect(result.dataInicio).toBeDefined();
      expect(result.dataFim).toBeDefined();
      // Deve ter formato YYYY-MM-DD
      expect(result.dataInicio).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.dataFim).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("✅ Validação de limit", () => {
    it("deve aceitar limit válido", () => {
      const result = validatePesquisaInput({ tema: "greve", limit: 20 });
      expect(result.limit).toBe(20);
    });

    it("deve usar 10 como default quando limit ausente", () => {
      const result = validatePesquisaInput({ tema: "greve" });
      expect(result.limit).toBe(10);
    });

    it("deve rejeitar limit não-inteiro", () => {
      expect(() => validatePesquisaInput({ tema: "greve", limit: 10.5 })).toThrowError(
        ValidationError
      );
      expect(() => validatePesquisaInput({ tema: "greve", limit: 10.5 })).toThrowError(
        /deve ser um número inteiro/
      );
    });

    it("deve rejeitar limit menor que 1", () => {
      expect(() => validatePesquisaInput({ tema: "greve", limit: 0 })).toThrowError(
        ValidationError
      );
      expect(() => validatePesquisaInput({ tema: "greve", limit: 0 })).toThrowError(
        /deve ser maior que 0/
      );
    });

    it("deve rejeitar limit maior que 50", () => {
      expect(() => validatePesquisaInput({ tema: "greve", limit: 51 })).toThrowError(
        ValidationError
      );
      expect(() => validatePesquisaInput({ tema: "greve", limit: 51 })).toThrowError(
        /não pode exceder 50/
      );
    });

    it("deve rejeitar limit de 100 (acima do máximo)", () => {
      expect(() => validatePesquisaInput({ tema: "greve", limit: 100 })).toThrowError(
        ValidationError
      );
      expect(() => validatePesquisaInput({ tema: "greve", limit: 100 })).toThrowError(
        /não pode exceder 50/
      );
    });
  });

  describe("✅ Validação de relevanceThreshold", () => {
    it("deve aceitar threshold válido", () => {
      const result = validatePesquisaInput({
        tema: "greve",
        relevanceThreshold: 0.8,
      });
      expect(result.relevanceThreshold).toBe(0.8);
    });

    it("deve usar 0.7 como default quando threshold ausente", () => {
      const result = validatePesquisaInput({ tema: "greve" });
      expect(result.relevanceThreshold).toBe(0.7);
    });

    it("deve rejeitar threshold não-numérico", () => {
      expect(() =>
        validatePesquisaInput({ tema: "greve", relevanceThreshold: "0.8" })
      ).toThrowError(ValidationError);
    });

    it("deve rejeitar threshold menor que 0", () => {
      expect(() => validatePesquisaInput({ tema: "greve", relevanceThreshold: -0.1 })).toThrowError(
        ValidationError
      );
      expect(() => validatePesquisaInput({ tema: "greve", relevanceThreshold: -0.1 })).toThrowError(
        /deve estar entre 0 e 1/
      );
    });

    it("deve rejeitar threshold maior que 1", () => {
      expect(() => validatePesquisaInput({ tema: "greve", relevanceThreshold: 1.1 })).toThrowError(
        ValidationError
      );
      expect(() => validatePesquisaInput({ tema: "greve", relevanceThreshold: 1.1 })).toThrowError(
        /deve estar entre 0 e 1/
      );
    });

    it("deve aceitar threshold nos extremos (0 e 1)", () => {
      const result0 = validatePesquisaInput({
        tema: "greve",
        relevanceThreshold: 0,
      });
      expect(result0.relevanceThreshold).toBe(0);

      const result1 = validatePesquisaInput({
        tema: "greve",
        relevanceThreshold: 1,
      });
      expect(result1.relevanceThreshold).toBe(1);
    });
  });

  describe("✅ ValidationError customizado", () => {
    it("deve ter campo 'field' populado", () => {
      try {
        validatePesquisaInput({});
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe("tema");
      }
    });

    it("deve ter campo 'receivedValue' populado", () => {
      try {
        validatePesquisaInput({ tema: 123 });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).receivedValue).toBe(123);
      }
    });

    it("deve ter name 'ValidationError'", () => {
      try {
        validatePesquisaInput({});
      } catch (error) {
        expect((error as Error).name).toBe("ValidationError");
      }
    });
  });

  describe("✅ Integração completa", () => {
    it("deve retornar todos os campos validados", () => {
      const input = {
        tema: "direito à greve no serviço público",
        tribunal: "STF",
        dataInicio: "2020-01-01",
        dataFim: "2024-12-31",
        limit: 25,
        relevanceThreshold: 0.75,
      };

      const result = validatePesquisaInput(input);

      expect(result).toEqual({
        tema: "direito à greve no serviço público",
        tribunal: "STF",
        dataInicio: "2020-01-01",
        dataFim: "2024-12-31",
        limit: 25,
        relevanceThreshold: 0.75,
      });
    });

    it("deve aplicar todos os defaults quando apenas tema fornecido", () => {
      const result = validatePesquisaInput({ tema: "greve" });

      expect(result.tema).toBe("greve");
      expect(result.tribunal).toBe("todos");
      expect(result.dataInicio).toBeDefined();
      expect(result.dataFim).toBeDefined();
      expect(result.limit).toBe(10);
      expect(result.relevanceThreshold).toBe(0.7);
    });
  });
});
