import { describe, it, expect } from "vitest";
import {
  validateDateComponents,
  parseBrazilianDate,
  parseDeadlineDate,
  getRelativeDateDescription,
} from "./date-utils";

describe("validateDateComponents", () => {
  describe("valid dates", () => {
    it("should accept valid dates", () => {
      expect(validateDateComponents(15, 6, 2024)).toBe(true);
      expect(validateDateComponents(1, 1, 2000)).toBe(true);
      expect(validateDateComponents(31, 12, 2024)).toBe(true);
    });

    it("should accept 31 days for months with 31 days", () => {
      expect(validateDateComponents(31, 1, 2024)).toBe(true); // Janeiro
      expect(validateDateComponents(31, 3, 2024)).toBe(true); // Março
      expect(validateDateComponents(31, 5, 2024)).toBe(true); // Maio
      expect(validateDateComponents(31, 7, 2024)).toBe(true); // Julho
      expect(validateDateComponents(31, 8, 2024)).toBe(true); // Agosto
      expect(validateDateComponents(31, 10, 2024)).toBe(true); // Outubro
      expect(validateDateComponents(31, 12, 2024)).toBe(true); // Dezembro
    });

    it("should accept 30 days for months with 30 days", () => {
      expect(validateDateComponents(30, 4, 2024)).toBe(true); // Abril
      expect(validateDateComponents(30, 6, 2024)).toBe(true); // Junho
      expect(validateDateComponents(30, 9, 2024)).toBe(true); // Setembro
      expect(validateDateComponents(30, 11, 2024)).toBe(true); // Novembro
    });

    it("should accept 29 days for February in leap years", () => {
      expect(validateDateComponents(29, 2, 2024)).toBe(true); // 2024 é bissexto
      expect(validateDateComponents(29, 2, 2020)).toBe(true); // 2020 é bissexto
      expect(validateDateComponents(29, 2, 2000)).toBe(true); // 2000 é bissexto
    });

    it("should accept 28 days for February in non-leap years", () => {
      expect(validateDateComponents(28, 2, 2023)).toBe(true);
      expect(validateDateComponents(28, 2, 2021)).toBe(true);
      expect(validateDateComponents(28, 2, 2019)).toBe(true);
    });
  });

  describe("invalid dates", () => {
    it("should reject 31 days for months with 30 days", () => {
      expect(validateDateComponents(31, 4, 2024)).toBe(false); // Abril
      expect(validateDateComponents(31, 6, 2024)).toBe(false); // Junho
      expect(validateDateComponents(31, 9, 2024)).toBe(false); // Setembro
      expect(validateDateComponents(31, 11, 2024)).toBe(false); // Novembro
    });

    it("should reject 30 and 31 days for February in non-leap years", () => {
      expect(validateDateComponents(30, 2, 2023)).toBe(false);
      expect(validateDateComponents(31, 2, 2023)).toBe(false);
      expect(validateDateComponents(29, 2, 2023)).toBe(false);
    });

    it("should reject 30 and 31 days for February in leap years", () => {
      expect(validateDateComponents(30, 2, 2024)).toBe(false);
      expect(validateDateComponents(31, 2, 2024)).toBe(false);
    });

    it("should reject invalid day values", () => {
      expect(validateDateComponents(0, 6, 2024)).toBe(false);
      expect(validateDateComponents(-1, 6, 2024)).toBe(false);
      expect(validateDateComponents(32, 1, 2024)).toBe(false);
    });

    it("should reject invalid month values", () => {
      expect(validateDateComponents(15, 0, 2024)).toBe(false);
      expect(validateDateComponents(15, 13, 2024)).toBe(false);
      expect(validateDateComponents(15, -1, 2024)).toBe(false);
    });

    it("should reject years before 2000", () => {
      expect(validateDateComponents(15, 6, 1999)).toBe(false);
      expect(validateDateComponents(15, 6, 1900)).toBe(false);
    });

    it("should reject NaN values", () => {
      expect(validateDateComponents(NaN, 6, 2024)).toBe(false);
      expect(validateDateComponents(15, NaN, 2024)).toBe(false);
      expect(validateDateComponents(15, 6, NaN)).toBe(false);
    });
  });

  describe("leap year edge cases", () => {
    it("should correctly identify leap years divisible by 4", () => {
      expect(validateDateComponents(29, 2, 2024)).toBe(true);
      expect(validateDateComponents(29, 2, 2028)).toBe(true);
    });

    it("should correctly reject century years not divisible by 400", () => {
      expect(validateDateComponents(29, 2, 2100)).toBe(false);
      expect(validateDateComponents(29, 2, 2200)).toBe(false);
    });

    it("should correctly accept century years divisible by 400", () => {
      expect(validateDateComponents(29, 2, 2000)).toBe(true);
      expect(validateDateComponents(29, 2, 2400)).toBe(true);
    });
  });
});

describe("parseBrazilianDate", () => {
  it("should parse valid Brazilian date format", () => {
    const date = parseBrazilianDate("15/06/2024");
    expect(date).not.toBeNull();
    expect(date?.getUTCDate()).toBe(15);
    expect(date?.getUTCMonth()).toBe(5); // 0-indexed
    expect(date?.getUTCFullYear()).toBe(2024);
  });

  it("should handle dates with spaces", () => {
    const date = parseBrazilianDate("15 / 06 / 2024");
    expect(date).not.toBeNull();
    expect(date?.getUTCDate()).toBe(15);
  });

  it("should return null for invalid format", () => {
    expect(parseBrazilianDate("2024-06-15")).toBeNull();
    expect(parseBrazilianDate("15-06-2024")).toBeNull();
    expect(parseBrazilianDate("15/06")).toBeNull();
    expect(parseBrazilianDate("invalid")).toBeNull();
  });

  it("should return null for invalid dates", () => {
    expect(parseBrazilianDate("31/02/2024")).toBeNull(); // Feb 31st
    expect(parseBrazilianDate("31/04/2024")).toBeNull(); // April 31st
    expect(parseBrazilianDate("29/02/2023")).toBeNull(); // Feb 29 in non-leap year
    expect(parseBrazilianDate("32/01/2024")).toBeNull(); // Day > 31
    expect(parseBrazilianDate("15/13/2024")).toBeNull(); // Month > 12
  });

  it("should return null for dates before 2000", () => {
    expect(parseBrazilianDate("15/06/1999")).toBeNull();
  });
});

describe("parseDeadlineDate", () => {
  it("should parse Brazilian format dates", () => {
    const date = parseDeadlineDate("15/06/2024");
    expect(date).not.toBeNull();
    expect(date?.getUTCDate()).toBe(15);
  });

  it("should parse ISO format dates", () => {
    const date = parseDeadlineDate("2024-06-15");
    expect(date).not.toBeNull();
  });

  it("should return null for invalid dates", () => {
    expect(parseDeadlineDate("31/02/2024")).toBeNull();
    expect(parseDeadlineDate("invalid")).toBeNull();
  });
});

describe("getRelativeDateDescription", () => {
  it("should return 'Agora mesmo' for recent dates", () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
    expect(getRelativeDateDescription(recent.toISOString())).toBe("Agora mesmo");
  });

  it("should return hours for dates within 24 hours", () => {
    const now = new Date();
    const hoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago
    expect(getRelativeDateDescription(hoursAgo.toISOString())).toBe("5h atrás");
  });

  it("should return 'Ontem' for yesterday", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
    expect(getRelativeDateDescription(yesterday.toISOString())).toBe("Ontem");
  });

  it("should return days for dates within a week", () => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    expect(getRelativeDateDescription(daysAgo.toISOString())).toBe("3 dias atrás");
  });

  it("should return formatted date for dates older than a week", () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
    const result = getRelativeDateDescription(weekAgo.toISOString());
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/); // DD/MM/YYYY format
  });
});
