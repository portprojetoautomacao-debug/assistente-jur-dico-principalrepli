/**
 * Testes unitários para validators.ts do agente Harvey Specter
 * Seguindo padrão de testes do Google Agent Starter Pack
 */

import { describe, expect, it } from "vitest";
import { validateHarveyInput, ValidationError } from "../validators";

describe("validateHarveyInput", () => {
  describe("✅ Validação de task (obrigatório)", () => {
    it("deve aceitar task válida", () => {
      const result = validateHarveyInput({
        task: "Analisar estratégia para ação trabalhista contra empresa X",
      });
      expect(result.task).toBe("Analisar estratégia para ação trabalhista contra empresa X");
    });

    it("deve rejeitar task ausente", () => {
      expect(() => validateHarveyInput({})).toThrow(ValidationError);
      expect(() => validateHarveyInput({})).toThrow(/Campo 'task' é obrigatório/);
    });

    it("deve rejeitar task não-string", () => {
      expect(() => validateHarveyInput({ task: 123 })).toThrow(ValidationError);
      expect(() => validateHarveyInput({ task: 123 })).toThrow("Campo 'task' deve ser uma string");
    });

    it("deve rejeitar task muito curta (< 10 caracteres)", () => {
      expect(() => validateHarveyInput({ task: "curta" })).toThrow(ValidationError);
      expect(() => validateHarveyInput({ task: "curta" })).toThrow(
        /deve ter pelo menos 10 caracteres/
      );
    });

    it("deve rejeitar task muito longa (> 2000 caracteres)", () => {
      const longTask = "a".repeat(2001);
      expect(() => validateHarveyInput({ task: longTask })).toThrow(ValidationError);
      expect(() => validateHarveyInput({ task: longTask })).toThrow(
        /não pode exceder 2000 caracteres/
      );
    });

    it("deve aceitar task com 2000 caracteres exatos", () => {
      const maxTask = "a".repeat(2000);
      const result = validateHarveyInput({ task: maxTask });
      expect(result.task).toBe(maxTask);
    });

    it("deve aceitar task com 10 caracteres exatos", () => {
      const minTask = "a".repeat(10);
      const result = validateHarveyInput({ task: minTask });
      expect(result.task).toBe(minTask);
    });
  });

  describe("✅ Validação de processNumber (opcional)", () => {
    it("deve aceitar processNumber válido", () => {
      const result = validateHarveyInput({
        task: "Analisar estratégia processual",
        processNumber: "0001234-56.2024.8.19.0001",
      });
      expect(result.processNumber).toBe("0001234-56.2024.8.19.0001");
    });

    it("deve aceitar input sem processNumber", () => {
      const result = validateHarveyInput({
        task: "Analisar estratégia processual",
      });
      expect(result.processNumber).toBeUndefined();
    });

    it("deve rejeitar processNumber não-string", () => {
      expect(() =>
        validateHarveyInput({
          task: "Analisar estratégia processual",
          processNumber: 12345,
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateHarveyInput({
          task: "Analisar estratégia processual",
          processNumber: 12345,
        })
      ).toThrow("Campo 'processNumber' deve ser uma string");
    });
  });

  describe("✅ Validação de context (opcional)", () => {
    it("deve aceitar context válido", () => {
      const result = validateHarveyInput({
        task: "Analisar estratégia processual",
        context: "Caso envolve disputa trabalhista com rescisão indireta",
      });
      expect(result.context).toBe("Caso envolve disputa trabalhista com rescisão indireta");
    });

    it("deve aceitar input sem context", () => {
      const result = validateHarveyInput({
        task: "Analisar estratégia processual",
      });
      expect(result.context).toBeUndefined();
    });

    it("deve rejeitar context não-string", () => {
      expect(() =>
        validateHarveyInput({
          task: "Analisar estratégia processual",
          context: { info: "objeto" },
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateHarveyInput({
          task: "Analisar estratégia processual",
          context: { info: "objeto" },
        })
      ).toThrow("Campo 'context' deve ser uma string");
    });

    it("deve rejeitar context muito longo (> 5000 caracteres)", () => {
      const longContext = "a".repeat(5001);
      expect(() =>
        validateHarveyInput({
          task: "Analisar estratégia processual",
          context: longContext,
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateHarveyInput({
          task: "Analisar estratégia processual",
          context: longContext,
        })
      ).toThrow(/não pode exceder 5000 caracteres/);
    });

    it("deve aceitar context com 5000 caracteres exatos", () => {
      const maxContext = "a".repeat(5000);
      const result = validateHarveyInput({
        task: "Analisar estratégia processual",
        context: maxContext,
      });
      expect(result.context).toBe(maxContext);
    });
  });

  describe("✅ Validação de urgency (opcional)", () => {
    it("deve aceitar urgency 'low'", () => {
      const result = validateHarveyInput({
        task: "Analisar estratégia processual",
        urgency: "low",
      });
      expect(result.urgency).toBe("low");
    });

    it("deve aceitar urgency 'medium'", () => {
      const result = validateHarveyInput({
        task: "Analisar estratégia processual",
        urgency: "medium",
      });
      expect(result.urgency).toBe("medium");
    });

    it("deve aceitar urgency 'high'", () => {
      const result = validateHarveyInput({
        task: "Analisar estratégia processual",
        urgency: "high",
      });
      expect(result.urgency).toBe("high");
    });

    it("deve usar 'medium' como default quando urgency ausente", () => {
      const result = validateHarveyInput({
        task: "Analisar estratégia processual",
      });
      expect(result.urgency).toBe("medium");
    });

    it("deve rejeitar urgency inválido", () => {
      expect(() =>
        validateHarveyInput({
          task: "Analisar estratégia processual",
          urgency: "critical",
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateHarveyInput({
          task: "Analisar estratégia processual",
          urgency: "urgent",
        })
      ).toThrow(/Campo 'urgency' inválido/);
    });
  });

  describe("✅ ValidationError customizado", () => {
    it("deve ter campo 'field' populado", () => {
      try {
        validateHarveyInput({});
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe("task");
      }
    });

    it("deve ter campo 'receivedValue' populado", () => {
      try {
        validateHarveyInput({ task: 123 });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).receivedValue).toBe(123);
      }
    });

    it("deve ter name 'ValidationError'", () => {
      try {
        validateHarveyInput({});
      } catch (error) {
        expect((error as Error).name).toBe("ValidationError");
      }
    });
  });

  describe("✅ Integração completa", () => {
    it("deve retornar todos os campos validados", () => {
      const input = {
        task: "Analisar estratégia para ação trabalhista",
        processNumber: "0001234-56.2024.8.19.0001",
        context: "Caso de rescisão indireta por assédio moral",
        urgency: "high",
      };

      const result = validateHarveyInput(input);

      expect(result).toEqual({
        task: "Analisar estratégia para ação trabalhista",
        processNumber: "0001234-56.2024.8.19.0001",
        context: "Caso de rescisão indireta por assédio moral",
        urgency: "high",
      });
    });

    it("deve aplicar defaults quando apenas task fornecida", () => {
      const result = validateHarveyInput({
        task: "Analisar estratégia processual",
      });

      expect(result.task).toBe("Analisar estratégia processual");
      expect(result.processNumber).toBeUndefined();
      expect(result.context).toBeUndefined();
      expect(result.urgency).toBe("medium");
    });
  });
});
