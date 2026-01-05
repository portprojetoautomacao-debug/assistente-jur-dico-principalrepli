import { describe, expect, it } from "vitest";
import {
  formatProcessNumber,
  isValidProcessNumber,
  normalizeProcessNumber,
  processNumbersMatch,
} from "./process-number-utils";

describe("process-number-utils", () => {
  describe("normalizeProcessNumber", () => {
    it("removes all non-numeric characters", () => {
      const input = "1234567-89.2024.5.02.0999";
      const expected = "12345678920245020999";
      expect(normalizeProcessNumber(input)).toBe(expected);
    });

    it("handles already normalized number", () => {
      const input = "12345678920245020999";
      expect(normalizeProcessNumber(input)).toBe(input);
    });

    it("handles undefined input", () => {
      expect(normalizeProcessNumber(undefined)).toBe("");
    });

    it("handles empty string", () => {
      expect(normalizeProcessNumber("")).toBe("");
    });

    it("removes spaces", () => {
      expect(normalizeProcessNumber("123 456 789")).toBe("123456789");
    });

    it("removes hyphens and dots", () => {
      expect(normalizeProcessNumber("123-456.789")).toBe("123456789");
    });

    it("handles special characters", () => {
      expect(normalizeProcessNumber("123/456@789#000")).toBe("123456789000");
    });
  });

  describe("processNumbersMatch", () => {
    it("matches identical normalized numbers", () => {
      const num1 = "1234567-89.2024.5.02.0999";
      const num2 = "12345678920245020999";
      expect(processNumbersMatch(num1, num2)).toBe(true);
    });

    it("matches numbers with different formatting", () => {
      const num1 = "1234567-89.2024.5.02.0999";
      const num2 = "1234567 89 2024 5 02 0999";
      expect(processNumbersMatch(num1, num2)).toBe(true);
    });

    it("returns false for different numbers", () => {
      const num1 = "1234567-89.2024.5.02.0999";
      const num2 = "7654321-98.2024.5.02.0999";
      expect(processNumbersMatch(num1, num2)).toBe(false);
    });

    it("returns false for undefined inputs", () => {
      expect(processNumbersMatch(undefined, "123")).toBe(false);
      expect(processNumbersMatch("123", undefined)).toBe(false);
      expect(processNumbersMatch(undefined, undefined)).toBe(false);
    });

    it("returns false for empty strings", () => {
      expect(processNumbersMatch("", "123")).toBe(false);
      expect(processNumbersMatch("123", "")).toBe(false);
      expect(processNumbersMatch("", "")).toBe(false);
    });

    it("is case insensitive (no letters anyway)", () => {
      const num1 = "ABC123DEF456";
      const num2 = "abc123def456";
      expect(processNumbersMatch(num1, num2)).toBe(true);
    });
  });

  describe("formatProcessNumber", () => {
    it("formats 20-digit number correctly", () => {
      const input = "12345678920245020999";
      const expected = "1234567-89.2024.5.02.0999";
      expect(formatProcessNumber(input)).toBe(expected);
    });

    it("handles already formatted number", () => {
      const input = "1234567-89.2024.5.02.0999";
      const normalized = normalizeProcessNumber(input);
      const formatted = formatProcessNumber(normalized);
      expect(formatted).toBe(input);
    });

    it("returns original for invalid length", () => {
      const input = "123456789"; // Only 9 digits
      expect(formatProcessNumber(input)).toBe(input);
    });

    it("handles 19-digit number (returns original)", () => {
      const input = "1234567892024502099";
      expect(formatProcessNumber(input)).toBe(input);
    });

    it("handles 21-digit number (returns original)", () => {
      const input = "123456789202450209990";
      expect(formatProcessNumber(input)).toBe(input);
    });

    it("formats unformatted valid number", () => {
      const input = "00012345620241234567";
      const expected = "0001234-56.2024.1.23.4567";
      expect(formatProcessNumber(input)).toBe(expected);
    });
  });

  describe("isValidProcessNumber", () => {
    it("validates 20-digit number", () => {
      const valid = "12345678920245020999";
      expect(isValidProcessNumber(valid)).toBe(true);
    });

    it("validates formatted 20-digit number", () => {
      const valid = "1234567-89.2024.5.02.0999";
      expect(isValidProcessNumber(valid)).toBe(true);
    });

    it("rejects numbers with less than 20 digits", () => {
      const invalid = "123456789";
      expect(isValidProcessNumber(invalid)).toBe(false);
    });

    it("rejects numbers with more than 20 digits", () => {
      const invalid = "123456789012345678901";
      expect(isValidProcessNumber(invalid)).toBe(false);
    });

    it("rejects undefined", () => {
      expect(isValidProcessNumber(undefined)).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isValidProcessNumber("")).toBe(false);
    });

    it("rejects non-numeric strings", () => {
      expect(isValidProcessNumber("abcdefghijklmnopqrst")).toBe(false);
    });

    it("accepts number with special characters if 20 digits", () => {
      const valid = "1234567-89.2024.5.02.0999"; // 20 digits
      expect(isValidProcessNumber(valid)).toBe(true);
    });
  });

  describe("Integration tests", () => {
    it("normalizes, validates, and formats complete flow", () => {
      const input = "1234567-89.2024.5.02.0999";

      // Normalize
      const normalized = normalizeProcessNumber(input);
      expect(normalized).toBe("12345678920245020999");

      // Validate
      expect(isValidProcessNumber(normalized)).toBe(true);

      // Format back
      const formatted = formatProcessNumber(normalized);
      expect(formatted).toBe(input);
    });

    it("matches different representations of same process", () => {
      const formats = [
        "1234567-89.2024.5.02.0999",
        "12345678920245020999",
        "1234567 89 2024 5 02 0999",
        "1234567.89.2024.5.02.0999",
      ];

      // All should match each other
      for (let i = 0; i < formats.length; i++) {
        for (let j = 0; j < formats.length; j++) {
          expect(processNumbersMatch(formats[i], formats[j])).toBe(true);
        }
      }
    });

    it("handles real CNJ process numbers", () => {
      const realNumbers = [
        "0001234-56.2024.8.09.0001",
        "5001234-56.2024.4.03.6100",
        "0800123-45.2024.5.02.0000",
      ];

      realNumbers.forEach((num) => {
        const normalized = normalizeProcessNumber(num);
        expect(normalized.length).toBe(20);
        expect(isValidProcessNumber(num)).toBe(true);
        expect(formatProcessNumber(normalized)).toBe(num);
      });
    });
  });

  describe("Edge cases", () => {
    it("handles process number with extra spaces", () => {
      const input = "  1234567-89.2024.5.02.0999  ";
      const normalized = normalizeProcessNumber(input);
      expect(normalized).toBe("12345678920245020999");
    });

    it("handles number with Unicode characters", () => {
      const input = "1234567—89․2024․5․02․0999"; // Em dash and middle dots
      const normalized = normalizeProcessNumber(input);
      expect(normalized).toBe("12345678920245020999");
    });

    it("handles partial process numbers", () => {
      expect(isValidProcessNumber("1234567-89.2024")).toBe(false);
      expect(isValidProcessNumber("1234567")).toBe(false);
    });
  });
});
