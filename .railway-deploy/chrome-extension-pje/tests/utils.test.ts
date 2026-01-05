import { describe, expect, it, vi } from "vitest";
import
  {
    cleanProcessNumber,
    formatCNJ,
    formatRelativeTime,
    isValidCNJ,
    parseDate,
    retry,
    sleep,
  } from "../src/shared/utils";

describe("Utils", () => {
  describe("cleanProcessNumber", () => {
    it("deve remover formatação CNJ", () => {
      expect(cleanProcessNumber("5000576-46.2021.8.13.0223")).toBe("50005764620218130223");
      expect(cleanProcessNumber("1234567-89.2024.5.02.0999")).toBe("12345678920245020999");
    });

    it("deve remover todos os caracteres não-numéricos", () => {
      expect(cleanProcessNumber("ABC-123.456/789")).toBe("123456789");
    });
  });

  describe("isValidCNJ", () => {
    it("deve validar número CNJ com 20 dígitos", () => {
      expect(isValidCNJ("5000576-46.2021.8.13.0223")).toBe(true);
      expect(isValidCNJ("50005764620218130223")).toBe(true);
    });

    it("deve rejeitar número com menos de 20 dígitos", () => {
      expect(isValidCNJ("123456")).toBe(false);
      expect(isValidCNJ("123-45.2021.8.13.0223")).toBe(false);
    });
  });

  describe("formatCNJ", () => {
    it("deve formatar número CNJ corretamente", () => {
      expect(formatCNJ("50005764620218130223")).toBe("5000576-46.2021.8.13.0223");
      expect(formatCNJ("12345678920245020999")).toBe("1234567-89.2024.5.02.0999");
    });

    it("deve retornar original se não tiver 20 dígitos", () => {
      expect(formatCNJ("123")).toBe("123");
    });
  });

  describe("parseDate", () => {
    it("deve fazer parse de data brasileira com hora", () => {
      const date = parseDate("05/12/2025 14:03");
      expect(date.getDate()).toBe(5);
      expect(date.getMonth()).toBe(11); // Dezembro = 11
      expect(date.getFullYear()).toBe(2025);
      expect(date.getHours()).toBe(14);
      expect(date.getMinutes()).toBe(3);
    });

    it("deve fazer parse de data brasileira sem hora", () => {
      const date = parseDate("05/12/2025");
      expect(date.getDate()).toBe(5);
      expect(date.getMonth()).toBe(11);
      expect(date.getFullYear()).toBe(2025);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
    });

    it("deve retornar data atual se formato inválido", () => {
      const before = Date.now();
      const date = parseDate("invalid");
      const after = Date.now();

      expect(date.getTime()).toBeGreaterThanOrEqual(before);
      expect(date.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe("formatRelativeTime", () => {
    it('deve formatar "Agora mesmo"', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe("Agora mesmo");
    });

    it("deve formatar minutos", () => {
      const date = new Date(Date.now() - 5 * 60000); // 5 min atrás
      expect(formatRelativeTime(date)).toBe("Há 5 minutos");
    });

    it("deve formatar 1 minuto", () => {
      const date = new Date(Date.now() - 60000);
      expect(formatRelativeTime(date)).toBe("Há 1 minuto");
    });

    it("deve formatar horas", () => {
      const date = new Date(Date.now() - 2 * 3600000); // 2h atrás
      expect(formatRelativeTime(date)).toBe("Há 2 horas");
    });

    it("deve formatar 1 hora", () => {
      const date = new Date(Date.now() - 3600000);
      expect(formatRelativeTime(date)).toBe("Há 1 hora");
    });
  });

  describe("sleep", () => {
    it("deve aguardar tempo especificado", async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(95); // Margem de erro
    });
  });

  describe("retry", () => {
    it("deve retornar sucesso na primeira tentativa", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const result = await retry(fn, 3, 10);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("deve fazer retry em caso de erro", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockRejectedValueOnce(new Error("fail 2"))
        .mockResolvedValue("success");

      const result = await retry(fn, 3, 10);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("deve lançar erro após esgotar tentativas", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("fail"));

      await expect(retry(fn, 3, 10)).rejects.toThrow("fail");
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });
});
