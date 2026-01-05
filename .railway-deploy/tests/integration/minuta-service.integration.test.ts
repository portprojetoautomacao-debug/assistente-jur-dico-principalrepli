/**
 * Teste de Integração REAL - Minutas Service
 * ⚠️ SEM MOCKS - Usa PostgreSQL real
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inicializarTabelaMinutas } from "../../backend/src/db/minutas";
import * as minutaService from "../../backend/src/services/minuta-service";

const shouldRun = process.env.ENABLE_DB_TEST === "true";
const describeFn = shouldRun ? describe : describe.skip;

describeFn("Minuta Service - Integração Real", () => {
  let testMinutaId: string;

  beforeAll(async () => {
    // Inicializar tabela real no PostgreSQL
    await inicializarTabelaMinutas();
    console.log("✅ Tabela minutas inicializada");
  });

  afterAll(async () => {
    // Limpar dados de teste criados
    if (testMinutaId) {
      try {
        await minutaService.deleteMinuta(testMinutaId);
        console.log(`🧹 Minuta de teste ${testMinutaId} removida`);
      } catch (error) {
        console.warn("Erro ao limpar minuta de teste:", error);
      }
    }
  });

  it("deve criar minuta no banco de dados real", async () => {
    const novaMinuta = {
      titulo: `Teste Integração - ${Date.now()}`,
      conteudo: "Conteúdo de teste para integração real",
      categoria: "teste" as const,
    };

    const minuta = await minutaService.createMinuta(novaMinuta);

    expect(minuta).toBeDefined();
    expect(minuta.id).toBeDefined();
    expect(minuta.titulo).toBe(novaMinuta.titulo);
    expect(minuta.conteudo).toBe(novaMinuta.conteudo);
    expect(minuta.dataCriacao).toBeDefined();
    expect(minuta.dataModificacao).toBeDefined();

    testMinutaId = minuta.id;
  });

  it("deve buscar minuta criada do banco real", async () => {
    expect(testMinutaId).toBeDefined();

    const minuta = await minutaService.getMinutaById(testMinutaId);

    expect(minuta).toBeDefined();
    expect(minuta?.id).toBe(testMinutaId);
  });

  it("deve listar todas as minutas do banco real", async () => {
    const minutas = await minutaService.getAllMinutas();

    expect(Array.isArray(minutas)).toBe(true);
    expect(minutas.length).toBeGreaterThan(0);

    // Verificar que nossa minuta de teste está na lista
    const minutaTeste = minutas.find((m) => m.id === testMinutaId);
    expect(minutaTeste).toBeDefined();
  });

  it("deve atualizar minuta no banco real", async () => {
    const conteudoAtualizado = "Conteúdo atualizado via teste de integração";

    const minutaAtualizada = await minutaService.updateMinuta(testMinutaId, {
      conteudo: conteudoAtualizado,
    });

    expect(minutaAtualizada).toBeDefined();
    expect(minutaAtualizada?.conteudo).toBe(conteudoAtualizado);
    expect(minutaAtualizada?.dataModificacao).not.toBe(minutaAtualizada?.dataCriacao);
  });

  it("deve deletar minuta do banco real", async () => {
    await minutaService.deleteMinuta(testMinutaId);

    const minutaDeletada = await minutaService.getMinutaById(testMinutaId);
    expect(minutaDeletada).toBeNull();

    // Limpar referência para não tentar deletar novamente
    testMinutaId = "";
  });
});
