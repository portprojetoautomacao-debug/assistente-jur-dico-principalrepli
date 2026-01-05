import { describe, expect, it } from "vitest";
import { ExpedienteExtractor } from "../src/content/extractors/expediente-extractor";
import { ProcessoPJe } from "../src/shared/types";

describe("ExpedienteExtractor", () => {
  const extractor = new ExpedienteExtractor();

  const createMockProcesso = (movimento: string): ProcessoPJe => ({
    numero: "50005764620218130223",
    numeroFormatado: "5000576-46.2021.8.13.0223",
    classe: "Teste",
    assunto: "Teste",
    parteAutor: "Autor",
    parteReu: "Réu",
    vara: "Vara Teste",
    comarca: "Comarca Teste",
    ultimoMovimento: {
      descricao: movimento,
      data: "05/12/2025 14:03",
      timestamp: Date.now(),
    },
    situacao: "ativo",
    distribuicao: "05/12/2025",
  });

  it("deve detectar intimação", () => {
    const processos = [createMockProcesso("Publicado Intimação em 05/12/2025")];
    const expedientes = extractor.extractExpedientes(processos);

    expect(expedientes).toHaveLength(1);
    expect(expedientes[0].type).toBe("intimacao");
  });

  it("deve detectar citação", () => {
    const processos = [createMockProcesso("Expedida citação")];
    const expedientes = extractor.extractExpedientes(processos);

    expect(expedientes[0].type).toBe("citacao");
  });

  it("deve detectar despacho", () => {
    const processos = [createMockProcesso("Proferido despacho de mero expediente")];
    const expedientes = extractor.extractExpedientes(processos);

    expect(expedientes[0].type).toBe("despacho");
  });

  it("deve detectar decisão", () => {
    const processos = [createMockProcesso("Proferida decisão interlocutória")];
    const expedientes = extractor.extractExpedientes(processos);

    expect(expedientes[0].type).toBe("decisao");
  });

  it("deve detectar sentença", () => {
    const processos = [createMockProcesso("Proferida sentença")];
    const expedientes = extractor.extractExpedientes(processos);

    expect(expedientes[0].type).toBe("sentenca");
  });

  it("deve ignorar movimentos irrelevantes", () => {
    const processos = [
      createMockProcesso("Juntada de petição"),
      createMockProcesso("Conclusos para despacho"),
      createMockProcesso("Vista ao MP"),
    ];
    const expedientes = extractor.extractExpedientes(processos);

    expect(expedientes).toHaveLength(0);
  });

  it("deve gerar IDs únicos", () => {
    const processos = [
      createMockProcesso("Publicado Intimação"),
      createMockProcesso("Expedida citação"),
    ];
    const expedientes = extractor.extractExpedientes(processos);

    expect(expedientes[0].id).not.toBe(expedientes[1].id);
  });

  it("deve incluir metadata completo", () => {
    const processos = [createMockProcesso("Publicado Intimação")];
    const expedientes = extractor.extractExpedientes(processos);

    expect(expedientes[0].metadata).toMatchObject({
      vara: "Vara Teste",
      comarca: "Comarca Teste",
    });
    expect(expedientes[0].metadata.timestamp).toBeGreaterThan(0);
  });
});
