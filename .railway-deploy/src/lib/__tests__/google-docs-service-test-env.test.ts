import { googleDocsService } from "@/lib/google-docs-service";
import { describe, expect, it } from "vitest";

describe("GoogleDocsService - Test Environment Detection", () => {
  it("should detect test environment and skip initialization", async () => {
    // Em ambiente de teste, initialize() não deve lançar erro ou timeout
    // O service detecta automaticamente que está em modo test
    await expect(googleDocsService.initialize()).resolves.not.toThrow();

    // Deve marcar como inicializado mesmo sem carregar scripts reais
    const status = googleDocsService.getStatus();
    expect(status.initialized).toBe(true);
  });

  it("should not timeout when initializing in test environment", async () => {
    // Teste que a inicialização completa em menos de 1 segundo
    // (sem timeout de 15s do loadGoogleScripts)
    const startTime = Date.now();

    await googleDocsService.initialize();

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // Deve completar em menos de 1s
  });
});
