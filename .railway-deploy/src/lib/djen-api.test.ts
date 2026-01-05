import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  validarFormatoData,
  validarNumeroOAB,
  getTribunaisDisponiveis,
  DJENAPIError,
  consultarDJEN,
} from "./djen-api";

describe("DJEN API - Validações", () => {
  describe("validarFormatoData", () => {
    it("deve aceitar formato AAAA-MM-DD válido", () => {
      expect(validarFormatoData("2025-01-16")).toBe(true);
      expect(validarFormatoData("2024-12-31")).toBe(true);
      expect(validarFormatoData("2023-06-15")).toBe(true);
    });

    it("deve rejeitar formatos inválidos", () => {
      expect(validarFormatoData("16/01/2025")).toBe(false);
      expect(validarFormatoData("2025/01/16")).toBe(false);
      expect(validarFormatoData("01-16-2025")).toBe(false);
      expect(validarFormatoData("2025-1-16")).toBe(false);
      expect(validarFormatoData("invalid")).toBe(false);
    });

    it("deve rejeitar datas inexistentes", () => {
      expect(validarFormatoData("2025-13-01")).toBe(false);
      expect(validarFormatoData("2025-02-30")).toBe(false);
      expect(validarFormatoData("2025-04-31")).toBe(false);
    });
  });

  describe("validarNumeroOAB", () => {
    it("deve aceitar formato OAB/UF número válido", () => {
      expect(validarNumeroOAB("OAB/MG 123456")).toBe(true);
      expect(validarNumeroOAB("OAB/SP 999999")).toBe(true);
      expect(validarNumeroOAB("OAB/RJ 1")).toBe(true);
      expect(validarNumeroOAB("oab/mg 123")).toBe(true);
      expect(validarNumeroOAB("123456")).toBe(true); // Aceita apenas números
    });

    it("deve rejeitar formatos inválidos", () => {
      expect(validarNumeroOAB("OAB 123456")).toBe(false);
      expect(validarNumeroOAB("MG 123456")).toBe(false);
      expect(validarNumeroOAB("OAB/MG")).toBe(false);
      expect(validarNumeroOAB("OAB/MGX 123")).toBe(false);
    });
  });

  describe("getTribunaisDisponiveis", () => {
    it("deve retornar lista de tribunais", () => {
      const tribunais = getTribunaisDisponiveis();
      expect(tribunais).toBeInstanceOf(Array);
      expect(tribunais.length).toBeGreaterThan(0);
      expect(tribunais).toContain("TJSP");
      expect(tribunais).toContain("TST");
      expect(tribunais).toContain("TJMG");
    });

    it("deve retornar array imutável", () => {
      const tribunais1 = getTribunaisDisponiveis();
      const tribunais2 = getTribunaisDisponiveis();
      expect(tribunais1).not.toBe(tribunais2);
    });
  });
});

describe("DJEN API - Classe de Erro", () => {
  it("deve criar erro com mensagem e tribunal", () => {
    const erro = new DJENAPIError("Erro de teste", "TJSP");
    expect(erro.message).toBe("Erro de teste");
    expect(erro.tribunal).toBe("TJSP");
    expect(erro.name).toBe("DJENAPIError");
  });

  it("deve criar erro com status code", () => {
    const erro = new DJENAPIError("Erro HTTP", "TJMG", 404);
    expect(erro.statusCode).toBe(404);
    expect(erro.tribunal).toBe("TJMG");
  });

  it("deve ser instância de Error", () => {
    const erro = new DJENAPIError("Teste");
    expect(erro).toBeInstanceOf(Error);
    expect(erro).toBeInstanceOf(DJENAPIError);
  });
});

describe("DJEN API - Integração", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it("deve lançar erro se não houver termo de busca", async () => {
    await expect(
      consultarDJEN({
        tribunais: ["TJSP"],
        searchTerms: {},
      })
    ).rejects.toThrow("É necessário fornecer pelo menos um termo de busca");
  });

  it("deve processar resposta vazia corretamente", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => [],
    } as Response);

    const resultado = await consultarDJEN({
      tribunais: ["TJSP"],
      searchTerms: { nomeAdvogado: "Teste" },
      dataInicio: "2025-01-16",
    });

    expect(resultado.resultados).toHaveLength(0);
    expect(resultado.erros).toHaveLength(0);
    expect(resultado.totalConsultado).toBe(0);
  });

  it("deve filtrar publicações por nome do advogado", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => [
        {
          tribunal: "TJSP",
          data_disponibilizacao: "2025-01-16",
          tipo_comunicacao: "Intimação",
          inteiro_teor: "Advogado: João Silva - OAB/SP 123456",
        },
        {
          tribunal: "TJSP",
          data_disponibilizacao: "2025-01-16",
          tipo_comunicacao: "Despacho",
          inteiro_teor: "Processo sem advogado mencionado",
        },
      ],
    } as Response);

    const resultado = await consultarDJEN({
      tribunais: ["TJSP"],
      searchTerms: { nomeAdvogado: "João Silva" },
      dataInicio: "2025-01-16",
    });

    expect(resultado.resultados).toHaveLength(1);
    expect(resultado.resultados[0].matchType).toBe("nome");
    expect(resultado.totalConsultado).toBe(2);
  });

  it("deve identificar match por OAB", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => [
        {
          tribunal: "TJMG",
          data_disponibilizacao: "2025-01-16",
          tipo_comunicacao: "Sentença",
          inteiro_teor: "Advogado: Maria Santos - OAB/MG 999999",
        },
      ],
    } as Response);

    const resultado = await consultarDJEN({
      tribunais: ["TJMG"],
      searchTerms: { numeroOAB: "OAB/MG 999999" },
      dataInicio: "2025-01-16",
    });

    expect(resultado.resultados).toHaveLength(1);
    expect(resultado.resultados[0].matchType).toBe("oab");
  });

  it("deve identificar match por nome e OAB", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => [
        {
          tribunal: "TST",
          data_disponibilizacao: "2025-01-16",
          tipo_comunicacao: "Intimação",
          inteiro_teor: "Advogado: Pedro Costa - OAB/RJ 555555",
        },
      ],
    } as Response);

    const resultado = await consultarDJEN({
      tribunais: ["TST"],
      searchTerms: {
        nomeAdvogado: "Pedro Costa",
        numeroOAB: "OAB/RJ 555555",
      },
      dataInicio: "2025-01-16",
    });

    expect(resultado.resultados).toHaveLength(1);
    expect(resultado.resultados[0].matchType).toBe("ambos");
  });

  it("deve coletar erros de tribunais que falharem", async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers(),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => [],
      } as Response);

    const resultado = await consultarDJEN({
      tribunais: ["TJSP", "TJMG"],
      searchTerms: { nomeAdvogado: "Teste" },
      dataInicio: "2025-01-16",
    });

    expect(resultado.erros).toHaveLength(1);
    expect(resultado.erros[0].tribunal).toBe("TJSP");
    expect(resultado.erros[0].erro).toContain("404");
  });

  it("deve usar data atual se não especificada", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => [],
    } as Response);

    await consultarDJEN({
      tribunais: ["TJSP"],
      searchTerms: { nomeAdvogado: "Teste" },
    });

    const chamada = vi.mocked(globalThis.fetch).mock.calls[0];
    const url = chamada[0] as string;

    const hoje = new Date().toISOString().split("T")[0];
    expect(url).toContain(hoje);
  });

  it("deve aplicar delay entre requisições", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => [],
    } as Response);

    const inicio = Date.now();

    await consultarDJEN({
      tribunais: ["TJSP", "TJMG"],
      searchTerms: { nomeAdvogado: "Teste" },
      delayBetweenRequests: 100,
    });

    const duracao = Date.now() - inicio;

    expect(duracao).toBeGreaterThanOrEqual(100);
  });
});
