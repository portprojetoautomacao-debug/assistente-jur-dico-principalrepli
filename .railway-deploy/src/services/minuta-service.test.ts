/**
 * Testes unitários para minuta-service.ts
 *
 * @jest-environment jsdom
 */

import { describe, expect, it } from "vitest";
import {
  createMinuta,
  createMinutaFromAgentTask,
  determineMinutaTipo,
  updateMinuta,
  validateMinutaForFinalization,
  type MinutaInput,
} from "./minuta-service";

describe("minuta-service", () => {
  describe("determineMinutaTipo", () => {
    it("deve retornar 'peticao' para tipos de petição", () => {
      expect(determineMinutaTipo("Petição Inicial")).toBe("peticao");
      expect(determineMinutaTipo("contestação")).toBe("peticao");
      expect(determineMinutaTipo("MANIFESTAÇÃO")).toBe("peticao");
      expect(determineMinutaTipo("defesa")).toBe("peticao");
    });

    it("deve retornar 'recurso' para tipos de recurso", () => {
      expect(determineMinutaTipo("Recurso de Apelação")).toBe("recurso");
      expect(determineMinutaTipo("agravo")).toBe("recurso");
      expect(determineMinutaTipo("EMBARGOS")).toBe("recurso");
    });

    it("deve retornar 'contrato' para contratos", () => {
      expect(determineMinutaTipo("Contrato de Prestação de Serviços")).toBe("contrato");
      expect(determineMinutaTipo("acordo")).toBe("contrato");
    });

    it("deve retornar 'parecer' para pareceres", () => {
      expect(determineMinutaTipo("Parecer Jurídico")).toBe("parecer");
    });

    it("deve retornar 'procuracao' para procurações", () => {
      expect(determineMinutaTipo("Procuração Ad Judicia")).toBe("procuracao");
      expect(determineMinutaTipo("procuracao")).toBe("procuracao");
    });

    it("deve retornar 'peticao' por padrão quando vazio", () => {
      expect(determineMinutaTipo()).toBe("peticao");
      expect(determineMinutaTipo("")).toBe("peticao");
    });

    it("deve retornar 'outro' para tipos desconhecidos", () => {
      expect(determineMinutaTipo("Documento Desconhecido")).toBe("outro");
      expect(determineMinutaTipo("XYZ123")).toBe("outro");
    });
  });

  describe("createMinuta", () => {
    it("deve criar uma minuta válida", () => {
      const input: MinutaInput = {
        titulo: "Petição Inicial - Caso Teste",
        tipo: "peticao",
        conteudo:
          "Conteúdo da petição com mais de 100 caracteres para passar na validação de finalização",
        status: "rascunho",
        autor: "Advogado Teste",
      };

      const minuta = createMinuta(input);

      expect(minuta).toMatchObject({
        titulo: input.titulo,
        tipo: input.tipo,
        conteudo: input.conteudo,
        status: input.status,
        autor: input.autor,
      });
      expect(minuta.id).toBeDefined();
      expect(minuta.criadoEm).toBeDefined();
      expect(minuta.atualizadoEm).toBeDefined();
      expect(minuta.variaveis).toEqual({});
    });

    it("deve gerar ID único automaticamente", () => {
      const input: MinutaInput = {
        titulo: "Teste",
        tipo: "peticao",
        conteudo: "Conteúdo",
        status: "rascunho",
        autor: "Teste",
      };

      const minuta1 = createMinuta(input);
      const minuta2 = createMinuta(input);

      expect(minuta1.id).not.toBe(minuta2.id);
    });

    it("deve aceitar ID customizado", () => {
      const customId = "550e8400-e29b-41d4-a716-446655440000"; // UUID válido
      const input: MinutaInput = {
        id: customId,
        titulo: "Teste",
        tipo: "peticao",
        conteudo: "Conteúdo",
        status: "rascunho",
        autor: "Teste",
      };

      const minuta = createMinuta(input);
      expect(minuta.id).toBe(customId);
    });

    it("deve lançar erro para título vazio", () => {
      const input: MinutaInput = {
        titulo: "",
        tipo: "peticao",
        conteudo: "Conteúdo",
        status: "rascunho",
        autor: "Teste",
      };

      expect(() => createMinuta(input)).toThrow("Minuta inválida");
    });

    it("deve lançar erro para conteúdo vazio", () => {
      const input: MinutaInput = {
        titulo: "Título",
        tipo: "peticao",
        conteudo: "",
        status: "rascunho",
        autor: "Teste",
      };

      expect(() => createMinuta(input)).toThrow("Minuta inválida");
    });

    it("deve aceitar campos opcionais", () => {
      const input: MinutaInput = {
        titulo: "Teste",
        tipo: "peticao",
        conteudo: "Conteúdo",
        status: "rascunho",
        autor: "Teste",
        processId: "proc-123",
        expedienteId: "exp-456",
        criadoPorAgente: true,
        agenteId: "redacao-peticoes",
        googleDocsId: "doc-789",
        googleDocsUrl: "https://docs.google.com/document/d/doc-789",
      };

      const minuta = createMinuta(input);

      expect(minuta.processId).toBe("proc-123");
      expect(minuta.expedienteId).toBe("exp-456");
      expect(minuta.criadoPorAgente).toBe(true);
      expect(minuta.agenteId).toBe("redacao-peticoes");
      expect(minuta.googleDocsId).toBe("doc-789");
      expect(minuta.googleDocsUrl).toBe("https://docs.google.com/document/d/doc-789");
    });
  });

  describe("createMinutaFromAgentTask", () => {
    it("deve criar minuta a partir de task de agente válida", () => {
      const task = {
        id: "task-123",
        agentId: "redacao-peticoes",
        data: {
          documentType: "Contestação",
          processNumber: "1234567-89.2024.8.02.0001",
          processId: "proc-123",
          expedienteId: "exp-456",
        },
        result: {
          data: {
            draft: "Excelentíssimo Senhor Doutor Juiz...",
            confidence: 0.95,
          },
        },
      };

      const minuta = createMinutaFromAgentTask(task);

      expect(minuta).not.toBeNull();
      expect(minuta?.titulo).toContain("Contestação");
      expect(minuta?.titulo).toContain("1234567-89.2024.8.02.0001");
      expect(minuta?.tipo).toBe("peticao");
      expect(minuta?.conteudo).toBe("Excelentíssimo Senhor Doutor Juiz...");
      expect(minuta?.status).toBe("pendente-revisao");
      expect(minuta?.autor).toBe("Agente Redação (IA)");
      expect(minuta?.criadoPorAgente).toBe(true);
      expect(minuta?.agenteId).toBe("redacao-peticoes");
      expect(minuta?.processId).toBe("proc-123");
      expect(minuta?.expedienteId).toBe("exp-456");
    });

    it("deve retornar null se draft não existir", () => {
      const task = {
        id: "task-123",
        agentId: "redacao-peticoes",
        data: {},
        result: {
          data: {},
        },
      };

      const minuta = createMinutaFromAgentTask(task);
      expect(minuta).toBeNull();
    });

    it("deve retornar null se result.data for undefined", () => {
      const task = {
        id: "task-123",
        agentId: "redacao-peticoes",
        data: {},
      };

      const minuta = createMinutaFromAgentTask(task);
      expect(minuta).toBeNull();
    });

    it("deve usar valores padrão para campos opcionais", () => {
      const task = {
        id: "task-123",
        agentId: "redacao-peticoes",
        data: {},
        result: {
          data: {
            draft: "Conteúdo da petição",
          },
        },
      };

      const minuta = createMinutaFromAgentTask(task);

      expect(minuta).not.toBeNull();
      expect(minuta?.titulo).toContain("Petição");
      expect(minuta?.titulo).toContain("Novo Processo");
      expect(minuta?.tipo).toBe("peticao");
    });
  });

  describe("updateMinuta", () => {
    it("deve atualizar minuta existente", async () => {
      const existing = createMinuta({
        titulo: "Título Original",
        tipo: "peticao",
        conteudo: "Conteúdo Original",
        status: "rascunho",
        autor: "Teste",
      });

      // Aguarda 10ms para garantir timestamp diferente em ambientes com pouca resolução
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = updateMinuta(existing, {
        titulo: "Título Atualizado",
        status: "em-revisao",
      });

      expect(updated.id).toBe(existing.id);
      expect(updated.criadoEm).toBe(existing.criadoEm);
      expect(updated.titulo).toBe("Título Atualizado");
      expect(updated.status).toBe("em-revisao");
      expect(updated.atualizadoEm).not.toBe(existing.atualizadoEm);
    });

    it("deve validar atualização", () => {
      const existing = createMinuta({
        titulo: "Teste",
        tipo: "peticao",
        conteudo: "Conteúdo",
        status: "rascunho",
        autor: "Teste",
      });

      expect(() =>
        updateMinuta(existing, {
          titulo: "", // Título vazio inválido
        })
      ).toThrow("Minuta inválida");
    });
  });

  describe("validateMinutaForFinalization", () => {
    it("deve validar minuta com conteúdo suficiente", () => {
      const minuta = createMinuta({
        titulo: "Petição Inicial - Caso Válido",
        tipo: "peticao",
        conteudo:
          "Excelentíssimo Senhor Doutor Juiz de Direito, vem o autor, por seu advogado, apresentar a presente petição inicial com mais de 100 caracteres para validação.",
        status: "em-revisao",
        autor: "Advogado Teste",
      });

      const validation = validateMinutaForFinalization(minuta);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("deve rejeitar minuta com conteúdo muito curto", () => {
      const minuta = createMinuta({
        titulo: "Teste",
        tipo: "peticao",
        conteudo: "Conteúdo curto",
        status: "em-revisao",
        autor: "Teste",
      });

      const validation = validateMinutaForFinalization(minuta);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("Conteúdo muito curto para uma minuta válida");
    });

    it("deve rejeitar minuta com título muito curto", () => {
      const minuta = createMinuta({
        titulo: "ABC",
        tipo: "peticao",
        conteudo:
          "Conteúdo suficiente para passar na validação de tamanho mínimo de 100 caracteres conforme regras do sistema.",
        status: "em-revisao",
        autor: "Teste",
      });

      const validation = validateMinutaForFinalization(minuta);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("Título muito curto");
    });

    it("deve rejeitar minuta arquivada", () => {
      const minuta = createMinuta({
        titulo: "Teste Arquivado",
        tipo: "peticao",
        conteudo:
          "Conteúdo suficiente para passar na validação de tamanho mínimo de 100 caracteres conforme regras do sistema.",
        status: "arquivada",
        autor: "Teste",
      });

      const validation = validateMinutaForFinalization(minuta);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("Não é possível finalizar uma minuta arquivada");
    });

    it("deve acumular múltiplos erros", () => {
      const minuta = createMinuta({
        titulo: "AB",
        tipo: "peticao",
        conteudo: "Curto",
        status: "arquivada",
        autor: "Teste",
      });

      const validation = validateMinutaForFinalization(minuta);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(1);
    });
  });
});
