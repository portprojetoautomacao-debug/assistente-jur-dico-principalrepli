/**
 * Serviço centralizado para criação e gestão de minutas
 *
 * Este serviço é a ÚNICA fonte de verdade para criação de minutas,
 * evitando duplicação de lógica entre backend e frontend.
 *
 * @module minuta-service
 * @version 1.0.0
 */

import type { Minuta } from "@/types";
import { z } from "zod";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const MinutaSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string().min(1, "Título é obrigatório"),
  processId: z.string().optional(),
  tipo: z.enum(["peticao", "contrato", "parecer", "recurso", "procuracao", "outro"]),
  conteudo: z.string().min(1, "Conteúdo é obrigatório"),
  status: z.enum(["rascunho", "em-revisao", "pendente-revisao", "finalizada", "arquivada"]),
  criadoEm: z.string().datetime(),
  atualizadoEm: z.string().datetime(),
  autor: z.string().min(1),
  googleDocsId: z.string().optional(),
  googleDocsUrl: z.string().url().optional(),
  criadoPorAgente: z.boolean().optional(),
  agenteId: z.string().optional(),
  templateId: z.string().optional(),
  expedienteId: z.string().optional(),
  variaveis: z.record(z.string(), z.string()).optional(),
});

export type MinutaInput = Omit<Minuta, "id" | "criadoEm" | "atualizadoEm"> & {
  id?: string;
};

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Determina o tipo de minuta baseado no documentType
 */
export function determineMinutaTipo(documentType?: string): Minuta["tipo"] {
  if (!documentType) return "peticao";

  const type = documentType.toLowerCase().trim();

  const typeMap: Record<string, Minuta["tipo"]> = {
    petição: "peticao",
    peticao: "peticao",
    "petição inicial": "peticao",
    contestação: "peticao",
    contestacao: "peticao",
    manifestação: "peticao",
    manifestacao: "peticao",
    defesa: "peticao",
    recurso: "recurso",
    apelação: "recurso",
    apelacao: "recurso",
    agravo: "recurso",
    embargos: "recurso",
    contrato: "contrato",
    acordo: "contrato",
    parecer: "parecer",
    procuração: "procuracao",
    procuracao: "procuracao",
  };

  // Busca correspondência exata
  if (typeMap[type]) return typeMap[type];

  // Busca parcial
  for (const [key, value] of Object.entries(typeMap)) {
    if (type.includes(key)) return value;
  }

  return "outro";
}

/**
 * Cria uma nova minuta com validação
 *
 * @throws {Error} Se os dados forem inválidos
 */
export function createMinuta(input: MinutaInput): Minuta {
  const now = new Date().toISOString();

  const minuta: Minuta = {
    id: input.id || crypto.randomUUID(),
    titulo: input.titulo,
    processId: input.processId,
    tipo: input.tipo,
    conteudo: input.conteudo,
    status: input.status,
    criadoEm: now,
    atualizadoEm: now,
    autor: input.autor,
    googleDocsId: input.googleDocsId,
    googleDocsUrl: input.googleDocsUrl,
    criadoPorAgente: input.criadoPorAgente,
    agenteId: input.agenteId,
    templateId: input.templateId,
    expedienteId: input.expedienteId,
    variaveis: input.variaveis || {},
  };

  // Validar com Zod
  const result = MinutaSchema.safeParse(minuta);

  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    throw new Error(`Minuta inválida: ${errors}`);
  }

  return result.data;
}

/**
 * Cria minuta a partir de tarefa de agente (DRAFT_PETITION)
 */
export function createMinutaFromAgentTask(task: {
  id: string;
  agentId: string;
  data: {
    documentType?: string;
    processNumber?: string;
    processId?: string;
    expedienteId?: string;
  };
  result?: {
    data?: {
      draft?: string;
      confidence?: number;
      needsReview?: boolean;
    };
  };
}): Minuta | null {
  const draft = task.result?.data?.draft;
  if (!draft) return null;

  const { documentType, processNumber, processId, expedienteId } = task.data;

  return createMinuta({
    titulo: `[Agente] ${documentType || "Petição"} - ${processNumber || "Novo Processo"}`,
    processId,
    tipo: determineMinutaTipo(documentType),
    conteudo: draft,
    status: "pendente-revisao",
    autor: "Agente Redação (IA)",
    criadoPorAgente: true,
    agenteId: task.agentId,
    expedienteId,
    variaveis: {},
  });
}

/**
 * Atualiza uma minuta existente
 */
export function updateMinuta(
  existing: Minuta,
  updates: Partial<Omit<Minuta, "id" | "criadoEm">>
): Minuta {
  const updated: Minuta = {
    ...existing,
    ...updates,
    atualizadoEm: new Date().toISOString(),
  };

  // Validar
  const result = MinutaSchema.safeParse(updated);

  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    throw new Error(`Minuta inválida: ${errors}`);
  }

  return result.data;
}

/**
 * Valida se uma minuta está pronta para finalização
 */
export function validateMinutaForFinalization(minuta: Minuta): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!minuta.conteudo || minuta.conteudo.trim().length < 100) {
    errors.push("Conteúdo muito curto para uma minuta válida");
  }

  if (!minuta.titulo || minuta.titulo.trim().length < 5) {
    errors.push("Título muito curto");
  }

  if (minuta.status === "arquivada") {
    errors.push("Não é possível finalizar uma minuta arquivada");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
