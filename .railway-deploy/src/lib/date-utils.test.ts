import { describe, expect, it } from "vitest";
import { parseBrazilianDate, validateDateComponents } from "./date-utils";

describe("validateDateComponents", () => {
  describe("datas válidas", () => {
    it("deve aceitar datas válidas", () => {
      expect(validateDateComponents(15, 6, 2024)).toBe(true);
      expect(validateDateComponents(1, 1, 2000)).toBe(true);
      expect(validateDateComponents(31, 12, 2024)).toBe(true);
    });

    it("deve aceitar 31 dias para meses com 31 dias", () => {
      expect(validateDateComponents(31, 1, 2024)).toBe(true); // Janeiro
      expect(validateDateComponents(31, 3, 2024)).toBe(true); // Março
      expect(validateDateComponents(31, 5, 2024)).toBe(true); // Maio
      expect(validateDateComponents(31, 7, 2024)).toBe(true); // Julho
      expect(validateDateComponents(31, 8, 2024)).toBe(true); // Agosto
      expect(validateDateComponents(31, 10, 2024)).toBe(true); // Outubro
      expect(validateDateComponents(31, 12, 2024)).toBe(true); // Dezembro
    });

    it("deve aceitar 30 dias para meses com 30 dias", () => {
      expect(validateDateComponents(30, 4, 2024)).toBe(true); // Abril
      expect(validateDateComponents(30, 6, 2024)).toBe(true); // Junho
      expect(validateDateComponents(30, 9, 2024)).toBe(true); // Setembro
      expect(validateDateComponents(30, 11, 2024)).toBe(true); // Novembro
    });

    it("deve aceitar 29 dias para fevereiro em anos bissextos", () => {
      expect(validateDateComponents(29, 2, 2024)).toBe(true); // 2024 é bissexto
      expect(validateDateComponents(29, 2, 2020)).toBe(true); // 2020 é bissexto
      expect(validateDateComponents(29, 2, 2000)).toBe(true); // 2000 é bissexto
    });

    it("deve aceitar 28 dias para fevereiro em anos não bissextos", () => {
      expect(validateDateComponents(28, 2, 2023)).toBe(true);
      expect(validateDateComponents(28, 2, 2021)).toBe(true);
      expect(validateDateComponents(28, 2, 2019)).toBe(true);
    });
  });

  describe("datas inválidas - BUG CRÍTICO CORRIGIDO", () => {
    it("deve rejeitar 31 dias para meses com 30 dias", () => {
      expect(validateDateComponents(31, 4, 2024)).toBe(false); // Abril
      expect(validateDateComponents(31, 6, 2024)).toBe(false); // Junho
      expect(validateDateComponents(31, 9, 2024)).toBe(false); // Setembro
      expect(validateDateComponents(31, 11, 2024)).toBe(false); // Novembro
    });

    it("deve rejeitar 30 e 31 dias para fevereiro em anos não bissextos", () => {
      expect(validateDateComponents(30, 2, 2023)).toBe(false);
      expect(validateDateComponents(31, 2, 2023)).toBe(false);
      expect(validateDateComponents(29, 2, 2023)).toBe(false);
    });

    it("deve rejeitar 30 e 31 dias para fevereiro em anos bissextos", () => {
      expect(validateDateComponents(30, 2, 2024)).toBe(false);
      expect(validateDateComponents(31, 2, 2024)).toBe(false);
    });

    it("deve rejeitar valores de dia inválidos", () => {
      expect(validateDateComponents(0, 6, 2024)).toBe(false);
      expect(validateDateComponents(-1, 6, 2024)).toBe(false);
      expect(validateDateComponents(32, 1, 2024)).toBe(false);
    });

    it("deve rejeitar valores de mês inválidos", () => {
      expect(validateDateComponents(15, 0, 2024)).toBe(false);
      expect(validateDateComponents(15, 13, 2024)).toBe(false);
      expect(validateDateComponents(15, -1, 2024)).toBe(false);
    });

    it("deve rejeitar anos anteriores a 2000", () => {
      expect(validateDateComponents(15, 6, 1999)).toBe(false);
      expect(validateDateComponents(15, 6, 1900)).toBe(false);
    });

    it("deve rejeitar valores NaN", () => {
      expect(validateDateComponents(NaN, 6, 2024)).toBe(false);
      expect(validateDateComponents(15, NaN, 2024)).toBe(false);
      expect(validateDateComponents(15, 6, NaN)).toBe(false);
    });
  });

  describe("casos extremos do ano bissexto", () => {
    it("deve identificar corretamente os anos bissextos divisíveis por 4", () => {
      expect(validateDateComponents(29, 2, 2024)).toBe(true);
      expect(validateDateComponents(29, 2, 2028)).toBe(true);
    });

    it("deve rejeitar corretamente anos centenários que não sejam divisíveis por 400", () => {
      expect(validateDateComponents(29, 2, 2100)).toBe(false);
      expect(validateDateComponents(29, 2, 2200)).toBe(false);
    });

    it("deve aceitar corretamente anos centenários divisíveis por 400", () => {
      expect(validateDateComponents(29, 2, 2000)).toBe(true);
      expect(validateDateComponents(29, 2, 2400)).toBe(true);
    });
  });
});

describe("parseBrazilianDate", () => {
  it("deve analisar o formato de data brasileiro válido", () => {
    const date = parseBrazilianDate("15/06/2024");
    expect(date).not.toBeNull();
    expect(date?.getUTCDate()).toBe(15);
    expect(date?.getUTCMonth()).toBe(5); // indexado a partir de 0
    expect(date?.getUTCFullYear()).toBe(2024);
  });

  it("deve lidar com datas com espaços", () => {
    const date = parseBrazilianDate("15 / 06 / 2024");
    expect(date).not.toBeNull();
    expect(date?.getUTCDate()).toBe(15);
  });

  it("deve retornar null para formato inválido", () => {
    expect(parseBrazilianDate("2024-06-15")).toBeNull();
    expect(parseBrazilianDate("15-06-2024")).toBeNull();
    expect(parseBrazilianDate("15/06")).toBeNull();
    expect(parseBrazilianDate("invalid")).toBeNull();
  });

  it("deve retornar null para datas inválidas - BUG CRÍTICO CORRIGIDO", () => {
    expect(parseBrazilianDate("31/02/2024")).toBeNull(); // 31 de fevereiro
    expect(parseBrazilianDate("31/04/2024")).toBeNull(); // 31 de abril
    expect(parseBrazilianDate("29/02/2023")).toBeNull(); // 29 de fevereiro em ano não bissexto
    expect(parseBrazilianDate("32/01/2024")).toBeNull(); // Dia > 31
    expect(parseBrazilianDate("15/13/2024")).toBeNull(); // Mês > 12
  });

  it("deve retornar null para datas anteriores a 2000", () => {
    expect(parseBrazilianDate("15/06/1999")).toBeNull();
  });
});
