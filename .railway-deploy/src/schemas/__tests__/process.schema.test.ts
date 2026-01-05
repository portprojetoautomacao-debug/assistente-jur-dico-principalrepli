import { describe, expect, it } from "vitest";
import { processSchema } from "../process.schema";

describe("processSchema", () => {
  it("should validate a correct process object", () => {
    const validProcess = {
      id: "proc_123",
      numeroCNJ: "1234567-89.2024.5.02.0999",
      titulo: "Ação Trabalhista",
      autor: "João Silva",
      reu: "Empresa XYZ Ltda",
      status: "ativo",
      comarca: "São Paulo",
      vara: "1ª Vara do Trabalho de São Paulo",
      dataDistribuicao: new Date().toISOString(),
      dataUltimaMovimentacao: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      prazos: [],
    };

    expect(() => processSchema.parse(validProcess)).not.toThrow();
  });

  it("should throw on missing required fields", () => {
    const invalidProcess = {
      id: "proc_123",
      // numeroCNJ missing
      titulo: "Test",
    };

    expect(() => processSchema.parse(invalidProcess)).toThrow();
  });

  it("should validate numero CNJ format", () => {
    const validNumeros = [
      "1234567-89.2024.5.02.0999",
      "0000001-00.2024.8.01.0001",
      "9999999-99.2099.1.99.9999",
    ];

    validNumeros.forEach((numeroCNJ) => {
      const process = {
        id: "proc_test",
        numeroCNJ,
        titulo: "Test Process",
        autor: "Test Author",
        reu: "Test Reu",
        status: "ativo" as const,
        dataDistribuicao: new Date().toISOString(),
        dataUltimaMovimentacao: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        prazos: [],
      };

      expect(() => processSchema.parse(process)).not.toThrow();
    });
  });

  it("should throw on invalid numero CNJ format", () => {
    const invalidNumeros = ["123456", "1234567-89.2024", "invalid-format", "1234567-89.2024.5.02"];

    invalidNumeros.forEach((numeroCNJ) => {
      const process = {
        id: "proc_test",
        numeroCNJ,
        titulo: "Test Process",
        autor: "Test Author",
        reu: "Test Reu",
        status: "ativo" as const,
        dataDistribuicao: new Date().toISOString(),
        dataUltimaMovimentacao: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        prazos: [],
      };

      expect(() => processSchema.parse(process)).toThrow();
    });
  });

  it("should validate all status values", () => {
    const statuses = ["ativo", "suspenso", "arquivado", "concluido"] as const;

    statuses.forEach((status) => {
      const process = {
        id: `proc_${status}`,
        numeroCNJ: "1234567-89.2024.5.02.0999",
        titulo: "Test Process for Status",
        autor: "Test Author",
        reu: "Test Reu",
        status,
        dataDistribuicao: new Date().toISOString(),
        dataUltimaMovimentacao: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        prazos: [],
      };

      expect(() => processSchema.parse(process)).not.toThrow();
    });
  });

  it("should accept process without optional fields", () => {
    const minimalProcess = {
      id: "proc_min",
      numeroCNJ: "1234567-89.2024.5.02.0999",
      titulo: "Minimal Process",
      autor: "Minimal Author",
      reu: "Minimal Reu",
      status: "ativo" as const,
      dataDistribuicao: new Date().toISOString(),
      dataUltimaMovimentacao: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      prazos: [],
    };

    expect(() => processSchema.parse(minimalProcess)).not.toThrow();
  });

  it("should validate with all optional fields", () => {
    const fullProcess = {
      id: "proc_full",
      numeroCNJ: "1234567-89.2024.5.02.0999",
      titulo: "Full Process",
      autor: "Author Name",
      reu: "Reu Name",
      status: "ativo" as const,
      valorCausa: 50000,
      comarca: "São Paulo",
      vara: "1ª Vara Cível",
      fase: "Instrução",
      valor: 50000,
      notas: "Notas do processo",
      expedientesCount: 5,
      intimacoesCount: 3,
      minutasCount: 2,
      documentosCount: 10,
      observacoes: "Observações gerais",
      dataDistribuicao: new Date().toISOString(),
      dataUltimaMovimentacao: new Date().toISOString(),
      lastExpedienteAt: new Date().toISOString(),
      lastMinutaAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      prazos: [],
    };

    expect(() => processSchema.parse(fullProcess)).not.toThrow();
  });
});
