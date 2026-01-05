/**
 * Testes unitários para validators.ts do agente Gestão de Prazos
 * Seguindo padrão de testes do Google Agent Starter Pack
 */

import { describe, expect, it } from "vitest";
import { validateGestaoPrazosInput, ValidationError } from "../validators";

describe("validateGestaoPrazosInput", () => {
  const validInput = {
    tipoProcesso: "cível",
    dataPublicacao: "2024-01-15",
    prazoEmDias: 15,
  };

  describe("✅ Validação de tipoProcesso (obrigatório)", () => {
    it("deve aceitar tipoProcesso 'cível'", () => {
      const result = validateGestaoPrazosInput({ ...validInput, tipoProcesso: "cível" });
      expect(result.tipoProcesso).toBe("cível");
    });

    it("deve aceitar tipoProcesso 'trabalhista'", () => {
      const result = validateGestaoPrazosInput({ ...validInput, tipoProcesso: "trabalhista" });
      expect(result.tipoProcesso).toBe("trabalhista");
    });

    it("deve aceitar tipoProcesso 'penal'", () => {
      const result = validateGestaoPrazosInput({ ...validInput, tipoProcesso: "penal" });
      expect(result.tipoProcesso).toBe("penal");
    });

    it("deve aceitar tipoProcesso 'tributário'", () => {
      const result = validateGestaoPrazosInput({ ...validInput, tipoProcesso: "tributário" });
      expect(result.tipoProcesso).toBe("tributário");
    });

    it("deve rejeitar tipoProcesso ausente", () => {
      expect(() =>
        validateGestaoPrazosInput({
          dataPublicacao: "2024-01-15",
          prazoEmDias: 15,
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateGestaoPrazosInput({
          dataPublicacao: "2024-01-15",
          prazoEmDias: 15,
        })
      ).toThrow(/Campo 'tipoProcesso' é obrigatório/);
    });

    it("deve rejeitar tipoProcesso inválido", () => {
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          tipoProcesso: "administrativo",
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          tipoProcesso: "invalid",
        })
      ).toThrow(/Campo 'tipoProcesso' deve ser um dos seguintes/);
    });
  });

  describe("✅ Validação de dataPublicacao (obrigatório)", () => {
    it("deve aceitar dataPublicacao válida (YYYY-MM-DD)", () => {
      const result = validateGestaoPrazosInput(validInput);
      expect(result.dataPublicacao).toBe("2024-01-15");
    });

    it("deve rejeitar dataPublicacao ausente", () => {
      expect(() =>
        validateGestaoPrazosInput({
          tipoProcesso: "cível",
          prazoEmDias: 15,
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateGestaoPrazosInput({
          tipoProcesso: "cível",
          prazoEmDias: 15,
        })
      ).toThrow(/Campo 'dataPublicacao' é obrigatório/);
    });

    it("deve rejeitar dataPublicacao com formato inválido (DD/MM/YYYY)", () => {
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          dataPublicacao: "15/01/2024",
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          dataPublicacao: "15/01/2024",
        })
      ).toThrow(/Use formato YYYY-MM-DD/);
    });

    it("deve rejeitar dataPublicacao com formato inválido (DD-MM-YYYY)", () => {
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          dataPublicacao: "15-01-2024",
        })
      ).toThrow(ValidationError);
    });

    it("deve rejeitar dataPublicacao futura", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split("T")[0];

      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          dataPublicacao: futureDateStr,
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          dataPublicacao: futureDateStr,
        })
      ).toThrow(/não pode ser futura/);
    });

    it("deve aceitar dataPublicacao de hoje", () => {
      const today = new Date().toISOString().split("T")[0];
      const result = validateGestaoPrazosInput({
        ...validInput,
        dataPublicacao: today,
      });
      expect(result.dataPublicacao).toBe(today);
    });
  });

  describe("✅ Validação de prazoEmDias (obrigatório)", () => {
    it("deve aceitar prazoEmDias válido", () => {
      const result = validateGestaoPrazosInput(validInput);
      expect(result.prazoEmDias).toBe(15);
    });

    it("deve rejeitar prazoEmDias ausente", () => {
      expect(() =>
        validateGestaoPrazosInput({
          tipoProcesso: "cível",
          dataPublicacao: "2024-01-15",
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateGestaoPrazosInput({
          tipoProcesso: "cível",
          dataPublicacao: "2024-01-15",
        })
      ).toThrow(/Campo 'prazoEmDias' é obrigatório/);
    });

    it("deve rejeitar prazoEmDias não-numérico", () => {
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          prazoEmDias: "quinze",
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          prazoEmDias: "15",
        })
      ).toThrow(/deve ser um número/);
    });

    it("deve rejeitar prazoEmDias menor que 1", () => {
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          prazoEmDias: 0,
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          prazoEmDias: -5,
        })
      ).toThrow(/deve estar entre 1 e 365/);
    });

    it("deve rejeitar prazoEmDias maior que 365", () => {
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          prazoEmDias: 366,
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          prazoEmDias: 400,
        })
      ).toThrow(/deve estar entre 1 e 365/);
    });

    it("deve aceitar prazoEmDias nos extremos (1 e 365)", () => {
      const result1 = validateGestaoPrazosInput({
        ...validInput,
        prazoEmDias: 1,
      });
      expect(result1.prazoEmDias).toBe(1);

      const result365 = validateGestaoPrazosInput({
        ...validInput,
        prazoEmDias: 365,
      });
      expect(result365.prazoEmDias).toBe(365);
    });
  });

  describe("✅ Validação de processNumber (opcional)", () => {
    it("deve aceitar processNumber válido", () => {
      const result = validateGestaoPrazosInput({
        ...validInput,
        processNumber: "0001234-56.2024.8.26.0100",
      });
      expect(result.processNumber).toBe("0001234-56.2024.8.26.0100");
    });

    it("deve aceitar input sem processNumber", () => {
      const result = validateGestaoPrazosInput(validInput);
      expect(result.processNumber).toBeUndefined();
    });

    it("deve rejeitar processNumber não-string", () => {
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          processNumber: 12345,
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          processNumber: 12345,
        })
      ).toThrow("Campo 'processNumber' deve ser uma string");
    });
  });

  describe("✅ Validação de considerarFeriados (opcional)", () => {
    it("deve aceitar considerarFeriados true", () => {
      const result = validateGestaoPrazosInput({
        ...validInput,
        considerarFeriados: true,
      });
      expect(result.considerarFeriados).toBe(true);
    });

    it("deve aceitar considerarFeriados false", () => {
      const result = validateGestaoPrazosInput({
        ...validInput,
        considerarFeriados: false,
      });
      expect(result.considerarFeriados).toBe(false);
    });

    it("deve usar false como default quando considerarFeriados ausente", () => {
      const result = validateGestaoPrazosInput(validInput);
      expect(result.considerarFeriados).toBe(false);
    });

    it("deve rejeitar considerarFeriados não-boolean", () => {
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          considerarFeriados: "sim",
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          considerarFeriados: 1,
        })
      ).toThrow("Campo 'considerarFeriados' deve ser um boolean");
    });
  });

  describe("✅ Validação de considerarRecessoForense (opcional)", () => {
    it("deve aceitar considerarRecessoForense true", () => {
      const result = validateGestaoPrazosInput({
        ...validInput,
        considerarRecessoForense: true,
      });
      expect(result.considerarRecessoForense).toBe(true);
    });

    it("deve aceitar considerarRecessoForense false", () => {
      const result = validateGestaoPrazosInput({
        ...validInput,
        considerarRecessoForense: false,
      });
      expect(result.considerarRecessoForense).toBe(false);
    });

    it("deve usar false como default quando considerarRecessoForense ausente", () => {
      const result = validateGestaoPrazosInput(validInput);
      expect(result.considerarRecessoForense).toBe(false);
    });

    it("deve rejeitar considerarRecessoForense não-boolean", () => {
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          considerarRecessoForense: "true",
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateGestaoPrazosInput({
          ...validInput,
          considerarRecessoForense: 0,
        })
      ).toThrow("Campo 'considerarRecessoForense' deve ser um boolean");
    });
  });

  describe("✅ ValidationError customizado", () => {
    it("deve ter campo 'field' populado", () => {
      try {
        validateGestaoPrazosInput({});
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe("tipoProcesso");
      }
    });

    it("deve ter campo 'receivedValue' populado", () => {
      try {
        validateGestaoPrazosInput({
          ...validInput,
          tipoProcesso: "invalid",
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).receivedValue).toBe("invalid");
      }
    });

    it("deve ter name 'ValidationError'", () => {
      try {
        validateGestaoPrazosInput({});
      } catch (error) {
        expect((error as Error).name).toBe("ValidationError");
      }
    });
  });

  describe("✅ Integração completa", () => {
    it("deve retornar todos os campos validados", () => {
      const input = {
        processNumber: "0001234-56.2024.8.26.0100",
        tipoProcesso: "trabalhista",
        dataPublicacao: "2024-01-15",
        prazoEmDias: 8,
        considerarFeriados: true,
        considerarRecessoForense: true,
      };

      const result = validateGestaoPrazosInput(input);

      expect(result).toEqual({
        processNumber: "0001234-56.2024.8.26.0100",
        tipoProcesso: "trabalhista",
        dataPublicacao: "2024-01-15",
        prazoEmDias: 8,
        considerarFeriados: true,
        considerarRecessoForense: true,
      });
    });

    it("deve aplicar defaults quando apenas campos obrigatórios fornecidos", () => {
      const result = validateGestaoPrazosInput({
        tipoProcesso: "cível",
        dataPublicacao: "2024-01-15",
        prazoEmDias: 15,
      });

      expect(result.tipoProcesso).toBe("cível");
      expect(result.dataPublicacao).toBe("2024-01-15");
      expect(result.prazoEmDias).toBe(15);
      expect(result.processNumber).toBeUndefined();
      expect(result.considerarFeriados).toBe(false);
      expect(result.considerarRecessoForense).toBe(false);
    });
  });
});
