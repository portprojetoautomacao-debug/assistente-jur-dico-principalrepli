import { describe, expect, it } from "vitest";
import { expedienteSchema } from "../expediente.schema";

describe("expedienteSchema", () => {
  it("should validate a correct expediente object", () => {
    const validExpediente = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      processId: "proc_456",
      tipo: "intimacao" as const,
      descricao: "Conteúdo da intimação judicial",
      dataPublicacao: new Date("2024-12-08T10:00:00Z").toISOString(),
      source: "DJEN" as const,
      status: "pendente" as const,
      prioridade: "alta" as const,
    };

    expect(() => expedienteSchema.parse(validExpediente)).not.toThrow();
  });

  it("should throw on invalid tipo", () => {
    const invalidExpediente = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      processId: "proc_456",
      tipo: "invalid-type",
      descricao: "Content",
      dataPublicacao: new Date("2024-12-08T10:00:00Z").toISOString(),
      source: "DJEN",
    };

    expect(() => expedienteSchema.parse(invalidExpediente)).toThrow();
  });

  it("should throw on invalid status", () => {
    const invalidExpediente = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      processId: "proc_456",
      tipo: "intimacao",
      descricao: "Content",
      dataPublicacao: new Date("2024-12-08T10:00:00Z").toISOString(),
      source: "DJEN",
      status: "invalid-status",
    };

    expect(() => expedienteSchema.parse(invalidExpediente)).toThrow();
  });

  it("should accept expediente without optional fields", () => {
    const minimalExpediente = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      processId: "proc_456",
      tipo: "despacho" as const,
      descricao: "Conteúdo do despacho",
      dataPublicacao: new Date("2024-12-08T10:00:00Z").toISOString(),
      source: "DJEN" as const,
    };

    expect(() => expedienteSchema.parse(minimalExpediente)).not.toThrow();
  });

  it("should validate all tipo values", () => {
    const tipos = ["intimacao", "despacho", "decisao", "sentenca", "acordao", "outro"];

    tipos.forEach((tipo) => {
      const expediente = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        processId: "proc_123",
        tipo,
        descricao: `Conteúdo ${tipo}`,
        dataPublicacao: new Date("2024-12-08T10:00:00Z").toISOString(),
        source: "DJEN" as const,
      };

      expect(() => expedienteSchema.parse(expediente)).not.toThrow();
    });
  });

  it("should validate all status values", () => {
    const statuses = ["pendente", "em-analise", "processado", "arquivado", "erro"];

    statuses.forEach((status) => {
      const expediente = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        processId: "proc_123",
        tipo: "intimacao" as const,
        descricao: "Content",
        dataPublicacao: new Date("2024-12-08T10:00:00Z").toISOString(),
        source: "DJEN" as const,
        status,
      };

      expect(() => expedienteSchema.parse(expediente)).not.toThrow();
    });
  });

  it("should validate all prioridade values", () => {
    const prioridades = ["baixa", "media", "alta", "urgente", "critica"];

    prioridades.forEach((prioridade) => {
      const expediente = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        processId: "proc_123",
        tipo: "intimacao" as const,
        descricao: "Content",
        dataPublicacao: new Date("2024-12-08T10:00:00Z").toISOString(),
        source: "DJEN" as const,
        prioridade,
      };

      expect(() => expedienteSchema.parse(expediente)).not.toThrow();
    });
  });
});
