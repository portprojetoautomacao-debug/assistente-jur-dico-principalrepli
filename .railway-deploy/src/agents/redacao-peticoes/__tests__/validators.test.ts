/**
 * Testes unitários para validators.ts do agente Redação de Petições
 * Seguindo padrão de testes do Google Agent Starter Pack
 */

import { describe, expect, it } from "vitest";
import { validateRedacaoPeticoesInput, ValidationError } from "../validators";

describe("validateRedacaoPeticoesInput", () => {
  const validDetalhes =
    "Elaborar petição inicial para ação de cobrança contra devedor que não honrou compromisso de pagamento";

  describe("✅ Validação de detalhes (obrigatório)", () => {
    it("deve aceitar detalhes válido", () => {
      const result = validateRedacaoPeticoesInput({
        detalhes: validDetalhes,
      });
      expect(result.detalhes).toBe(validDetalhes);
    });

    it("deve rejeitar detalhes ausente", () => {
      expect(() => validateRedacaoPeticoesInput({})).toThrow(ValidationError);
      expect(() => validateRedacaoPeticoesInput({})).toThrow(/Campo 'detalhes' é obrigatório/);
    });

    it("deve rejeitar detalhes não-string", () => {
      expect(() => validateRedacaoPeticoesInput({ detalhes: 123 })).toThrow(ValidationError);
      expect(() => validateRedacaoPeticoesInput({ detalhes: 123 })).toThrow(
        "Campo 'detalhes' deve ser uma string"
      );
    });

    it("deve rejeitar detalhes muito curto (< 20 caracteres)", () => {
      expect(() => validateRedacaoPeticoesInput({ detalhes: "curto demais" })).toThrow(
        ValidationError
      );
      expect(() => validateRedacaoPeticoesInput({ detalhes: "curto demais" })).toThrow(
        /deve ter entre 20 e 10.000 caracteres/
      );
    });

    it("deve rejeitar detalhes muito longo (> 10000 caracteres)", () => {
      const longDetalhes = "a".repeat(10001);
      expect(() => validateRedacaoPeticoesInput({ detalhes: longDetalhes })).toThrow(
        ValidationError
      );
      expect(() => validateRedacaoPeticoesInput({ detalhes: longDetalhes })).toThrow(
        /deve ter entre 20 e 10.000 caracteres/
      );
    });

    it("deve aceitar detalhes com 20 caracteres exatos", () => {
      const minDetalhes = "a".repeat(20);
      const result = validateRedacaoPeticoesInput({ detalhes: minDetalhes });
      expect(result.detalhes).toBe(minDetalhes);
    });

    it("deve aceitar detalhes com 10000 caracteres exatos", () => {
      const maxDetalhes = "a".repeat(10000);
      const result = validateRedacaoPeticoesInput({ detalhes: maxDetalhes });
      expect(result.detalhes).toBe(maxDetalhes);
    });
  });

  describe("✅ Validação de tipo (opcional com default)", () => {
    it("deve aceitar tipo 'petição inicial'", () => {
      const result = validateRedacaoPeticoesInput({
        detalhes: validDetalhes,
        tipo: "petição inicial",
      });
      expect(result.tipo).toBe("petição inicial");
    });

    it("deve aceitar tipo 'contestação'", () => {
      const result = validateRedacaoPeticoesInput({
        detalhes: validDetalhes,
        tipo: "contestação",
      });
      expect(result.tipo).toBe("contestação");
    });

    it("deve aceitar tipo 'réplica'", () => {
      const result = validateRedacaoPeticoesInput({
        detalhes: validDetalhes,
        tipo: "réplica",
      });
      expect(result.tipo).toBe("réplica");
    });

    it("deve aceitar tipo 'apelação'", () => {
      const result = validateRedacaoPeticoesInput({
        detalhes: validDetalhes,
        tipo: "apelação",
      });
      expect(result.tipo).toBe("apelação");
    });

    it("deve aceitar tipo 'agravo'", () => {
      const result = validateRedacaoPeticoesInput({
        detalhes: validDetalhes,
        tipo: "agravo",
      });
      expect(result.tipo).toBe("agravo");
    });

    it("deve aceitar tipo 'embargos'", () => {
      const result = validateRedacaoPeticoesInput({
        detalhes: validDetalhes,
        tipo: "embargos",
      });
      expect(result.tipo).toBe("embargos");
    });

    it("deve usar 'petição inicial' como default quando tipo ausente", () => {
      const result = validateRedacaoPeticoesInput({
        detalhes: validDetalhes,
      });
      expect(result.tipo).toBe("petição inicial");
    });

    it("deve rejeitar tipo inválido", () => {
      expect(() =>
        validateRedacaoPeticoesInput({
          detalhes: validDetalhes,
          tipo: "recurso especial",
        })
      ).toThrow(ValidationError);
      expect(() =>
        validateRedacaoPeticoesInput({
          detalhes: validDetalhes,
          tipo: "invalid",
        })
      ).toThrow(/Campo 'tipo' deve ser/);
    });
  });

  describe("✅ Validação de partes (opcional)", () => {
    it("deve aceitar partes válidas com autor e réu", () => {
      const result = validateRedacaoPeticoesInput({
        detalhes: validDetalhes,
        partes: {
          autor: "João da Silva",
          reu: "Empresa XYZ Ltda",
        },
      });
      expect(result.partes?.autor).toBe("João da Silva");
      expect(result.partes?.reu).toBe("Empresa XYZ Ltda");
    });

    it("deve aceitar partes apenas com autor", () => {
      const result = validateRedacaoPeticoesInput({
        detalhes: validDetalhes,
        partes: {
          autor: "João da Silva",
        },
      });
      expect(result.partes?.autor).toBe("João da Silva");
      expect(result.partes?.reu).toBeUndefined();
    });

    it("deve aceitar partes apenas com réu", () => {
      const result = validateRedacaoPeticoesInput({
        detalhes: validDetalhes,
        partes: {
          reu: "Empresa XYZ Ltda",
        },
      });
      expect(result.partes?.autor).toBeUndefined();
      expect(result.partes?.reu).toBe("Empresa XYZ Ltda");
    });

    it("deve aceitar input sem partes", () => {
      const result = validateRedacaoPeticoesInput({
        detalhes: validDetalhes,
      });
      expect(result.partes).toBeUndefined();
    });
  });

  describe("✅ Validação de pedidos (opcional)", () => {
    it("deve aceitar pedidos válidos", () => {
      const pedidos = [
        "Condenação ao pagamento de R$ 50.000,00",
        "Juros de mora desde a citação",
        "Honorários advocatícios de 20%",
      ];

      const result = validateRedacaoPeticoesInput({
        detalhes: validDetalhes,
        pedidos,
      });
      expect(result.pedidos).toEqual(pedidos);
    });

    it("deve aceitar array vazio de pedidos", () => {
      const result = validateRedacaoPeticoesInput({
        detalhes: validDetalhes,
        pedidos: [],
      });
      expect(result.pedidos).toEqual([]);
    });

    it("deve aceitar input sem pedidos", () => {
      const result = validateRedacaoPeticoesInput({
        detalhes: validDetalhes,
      });
      expect(result.pedidos).toBeUndefined();
    });
  });

  describe("✅ ValidationError customizado", () => {
    it("deve ter campo 'field' populado", () => {
      try {
        validateRedacaoPeticoesInput({});
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe("detalhes");
      }
    });

    it("deve ter campo 'receivedValue' populado", () => {
      try {
        validateRedacaoPeticoesInput({ detalhes: 123 });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).receivedValue).toBe(123);
      }
    });

    it("deve ter name 'ValidationError'", () => {
      try {
        validateRedacaoPeticoesInput({});
      } catch (error) {
        expect((error as Error).name).toBe("ValidationError");
      }
    });

    it("deve incluir tamanho no receivedValue quando detalhes excede limite", () => {
      try {
        validateRedacaoPeticoesInput({ detalhes: "curto" });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).receivedValue).toBe(5);
      }
    });
  });

  describe("✅ Integração completa", () => {
    it("deve retornar todos os campos validados", () => {
      const input = {
        tipo: "contestação" as const,
        detalhes: "Elaborar contestação para defesa em ação trabalhista movida por ex-funcionário",
        partes: {
          autor: "José da Silva",
          reu: "Empresa ABC Ltda",
        },
        pedidos: ["Improcedência total dos pedidos", "Condenação em litigância de má-fé"],
      };

      const result = validateRedacaoPeticoesInput(input);

      expect(result.tipo).toBe("contestação");
      expect(result.detalhes).toBe(
        "Elaborar contestação para defesa em ação trabalhista movida por ex-funcionário"
      );
      expect(result.partes?.autor).toBe("José da Silva");
      expect(result.partes?.reu).toBe("Empresa ABC Ltda");
      expect(result.pedidos).toHaveLength(2);
    });

    it("deve aplicar defaults quando apenas detalhes fornecido", () => {
      const result = validateRedacaoPeticoesInput({
        detalhes: validDetalhes,
      });

      expect(result.detalhes).toBe(validDetalhes);
      expect(result.tipo).toBe("petição inicial");
      expect(result.partes).toBeUndefined();
      expect(result.pedidos).toBeUndefined();
    });
  });
});
