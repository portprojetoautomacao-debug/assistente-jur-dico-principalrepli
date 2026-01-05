/**
 * Testes unitários para validators.ts do agente Mrs. Justine
 * Seguindo padrão de testes do Google Agent Starter Pack
 */

import { describe, expect, it } from "vitest";
import { validateJustineInput, ValidationError } from "../validators";

describe("validateJustineInput", () => {
  describe("✅ Validação de task (obrigatório)", () => {
    it("deve aceitar task válida", () => {
      const result = validateJustineInput({
        task: "Analisar intimações do Diário de Justiça Eletrônico",
      });
      expect(result.task).toBe("Analisar intimações do Diário de Justiça Eletrônico");
    });

    it("deve rejeitar task ausente", () => {
      expect(() => validateJustineInput({})).toThrow(ValidationError);
      expect(() => validateJustineInput({})).toThrow(/Campo 'task' é obrigatório/);
    });

    it("deve rejeitar task não-string", () => {
      expect(() => validateJustineInput({ task: 123 })).toThrow(ValidationError);
      expect(() => validateJustineInput({ task: 123 })).toThrow("Campo 'task' deve ser uma string");
    });

    it("deve rejeitar task muito curta (< 10 caracteres)", () => {
      expect(() => validateJustineInput({ task: "curta" })).toThrow(ValidationError);
      expect(() => validateJustineInput({ task: "curta" })).toThrow(
        /deve ter entre 10 e 5000 caracteres/
      );
    });

    it("deve rejeitar task muito longa (> 5000 caracteres)", () => {
      const longTask = "a".repeat(5001);
      expect(() => validateJustineInput({ task: longTask })).toThrow(ValidationError);
      expect(() => validateJustineInput({ task: longTask })).toThrow(
        /deve ter entre 10 e 5000 caracteres/
      );
    });

    it("deve aceitar task com 5000 caracteres exatos", () => {
      const maxTask = "a".repeat(5000);
      const result = validateJustineInput({ task: maxTask });
      expect(result.task).toBe(maxTask);
    });

    it("deve aceitar task com 10 caracteres exatos", () => {
      const minTask = "a".repeat(10);
      const result = validateJustineInput({ task: minTask });
      expect(result.task).toBe(minTask);
    });
  });

  describe("✅ Validação de publications (opcional)", () => {
    it("deve aceitar publications válido", () => {
      const publications = [
        {
          id: "pub-001",
          court: "TJSP",
          date: "2024-01-15",
          content: "Intimação para manifestação",
          processNumber: "0001234-56.2024.8.26.0100",
        },
      ];

      const result = validateJustineInput({
        task: "Analisar intimações recentes",
        publications,
      });
      expect(result.publications).toEqual(publications);
    });

    it("deve aceitar input sem publications", () => {
      const result = validateJustineInput({
        task: "Analisar intimações recentes",
      });
      expect(result.publications).toBeUndefined();
    });

    it("deve rejeitar publications não-array", () => {
      expect(() =>
        validateJustineInput({
          task: "Analisar intimações recentes",
          publications: "invalid",
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateJustineInput({
          task: "Analisar intimações recentes",
          publications: { id: "pub-001" },
        })
      ).toThrow("Campo 'publications' deve ser um array");
    });

    it("deve aceitar array vazio de publications", () => {
      const result = validateJustineInput({
        task: "Analisar intimações recentes",
        publications: [],
      });
      expect(result.publications).toEqual([]);
    });
  });

  describe("✅ Validação de priority (opcional)", () => {
    it("deve aceitar priority 'low'", () => {
      const result = validateJustineInput({
        task: "Analisar intimações recentes",
        priority: "low",
      });
      expect(result.priority).toBe("low");
    });

    it("deve aceitar priority 'medium'", () => {
      const result = validateJustineInput({
        task: "Analisar intimações recentes",
        priority: "medium",
      });
      expect(result.priority).toBe("medium");
    });

    it("deve aceitar priority 'high'", () => {
      const result = validateJustineInput({
        task: "Analisar intimações recentes",
        priority: "high",
      });
      expect(result.priority).toBe("high");
    });

    it("deve aceitar priority 'critical'", () => {
      const result = validateJustineInput({
        task: "Analisar intimações recentes",
        priority: "critical",
      });
      expect(result.priority).toBe("critical");
    });

    it("deve aceitar input sem priority", () => {
      const result = validateJustineInput({
        task: "Analisar intimações recentes",
      });
      expect(result.priority).toBeUndefined();
    });

    it("deve rejeitar priority inválido", () => {
      expect(() =>
        validateJustineInput({
          task: "Analisar intimações recentes",
          priority: "urgent",
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateJustineInput({
          task: "Analisar intimações recentes",
          priority: "invalid",
        })
      ).toThrow(/Campo 'priority' deve ser um dos seguintes/);
    });
  });

  describe("✅ ValidationError customizado", () => {
    it("deve ter campo 'field' populado", () => {
      try {
        validateJustineInput({});
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe("task");
      }
    });

    it("deve ter campo 'receivedValue' populado", () => {
      try {
        validateJustineInput({ task: 123 });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).receivedValue).toBe(123);
      }
    });

    it("deve ter name 'ValidationError'", () => {
      try {
        validateJustineInput({});
      } catch (error) {
        expect((error as Error).name).toBe("ValidationError");
      }
    });
  });

  describe("✅ Integração completa", () => {
    it("deve retornar todos os campos validados", () => {
      const input = {
        task: "Analisar intimações do TJSP para cliente ABC",
        publications: [
          {
            id: "pub-001",
            court: "TJSP",
            date: "2024-01-15",
            content: "Intimação para manifestação em 15 dias",
          },
        ],
        priority: "high" as const,
      };

      const result = validateJustineInput(input);

      expect(result.task).toBe("Analisar intimações do TJSP para cliente ABC");
      expect(result.publications).toHaveLength(1);
      expect(result.priority).toBe("high");
    });

    it("deve aceitar input apenas com task", () => {
      const result = validateJustineInput({
        task: "Analisar intimações recentes",
      });

      expect(result.task).toBe("Analisar intimações recentes");
      expect(result.publications).toBeUndefined();
      expect(result.priority).toBeUndefined();
    });
  });
});
