import { describe, expect, it } from "vitest";
import { expedientesToProcessEvents, minutasToProcessEvents } from "./process-timeline-utils";
import type { Expediente, Minuta } from "@/types";

describe("process-timeline-utils", () => {
  describe("expedientesToProcessEvents", () => {
    it("deve converter expedientes corretamente", () => {
      const expedientes: Expediente[] = [
        {
          id: "1",
          processId: "123",
          dataRecebimento: "2023-01-01T00:00:00Z",
          titulo: "Expediente 1",
          conteudo: "Conteúdo 1",
          tipo: "intimacao",
          source: "djen",
          createdAt: "2023-01-01T00:00:00Z",
          status: "pendente",
        },
      ];

      const events = expedientesToProcessEvents(expedientes);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        id: "1",
        processId: "123",
        titulo: "Expediente 1",
        descricao: "Conteúdo 1",
        source: "djen",
      });
    });
  });

  describe("minutasToProcessEvents", () => {
    it("deve converter minutas criadas por agente com source 'ia'", () => {
      const minutas: Minuta[] = [
        {
          id: "1",
          titulo: "Minuta IA",
          conteudo: "Conteúdo IA",
          tipo: "peticao",
          status: "rascunho",
          criadoEm: "2023-01-01T00:00:00Z",
          atualizadoEm: "2023-01-01T00:00:00Z",
          autor: "Agente",
          criadoPorAgente: true,
        },
      ];

      const events = minutasToProcessEvents(minutas);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        id: "1",
        titulo: "Minuta IA",
        source: "ia",
      });
    });

    it("deve converter minutas manuais com source 'manual'", () => {
      const minutas: Minuta[] = [
        {
          id: "2",
          titulo: "Minuta Manual",
          conteudo: "Conteúdo Manual",
          tipo: "peticao",
          status: "rascunho",
          criadoEm: "2023-01-01T00:00:00Z",
          atualizadoEm: "2023-01-01T00:00:00Z",
          autor: "Advogado",
          criadoPorAgente: false,
        },
      ];

      const events = minutasToProcessEvents(minutas);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        id: "2",
        titulo: "Minuta Manual",
        source: "manual",
      });
    });
  });
});
