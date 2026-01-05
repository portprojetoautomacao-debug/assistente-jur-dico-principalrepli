/**
 * Schemas Zod para valida��o de Expedientes
 *
 * Expedientes s�o documentos/intima��es recebidos de fontes externas
 * (DJEN, DataJud, PJe, manual) que geram tarefas para os agentes.
 *
 * @module expediente.schema
 */

import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const ExpedienteTipoEnum = z.enum([
  "intimacao",
  "citacao",
  "notificacao",
  "despacho",
  "decisao",
  "sentenca",
  "acordao",
  "certidao",
  "mandado",
  "oficio",
  "outro",
]);

export const ExpedienteSourceEnum = z.enum([
  "DJEN",
  "DataJud",
  "PJe",
  "manual",
  "email",
  "whatsapp",
]);

export const ExpedienteStatusEnum = z.enum([
  "pendente",
  "em-analise",
  "processado",
  "arquivado",
  "erro",
]);

export const ExpedientePrioridadeEnum = z.enum(["baixa", "media", "alta", "urgente", "critica"]);

// ============================================================================
// EXPEDIENTE SCHEMA
// ============================================================================

/**
 * Schema para valida��o de Expediente
 */
export const expedienteSchema = z.object({
  // Campos obrigat�rios
  id: z.string().uuid("ID do expediente deve ser UUID v�lido"),
  processId: z.string().min(1, "ID do processo � obrigat�rio"),
  tipo: ExpedienteTipoEnum,
  descricao: z.string().min(1, "Descri��o � obrigat�ria"),
  dataPublicacao: z.string().datetime("Data de publica��o inv�lida"),
  source: ExpedienteSourceEnum,
  status: ExpedienteStatusEnum.default("pendente"),
  prioridade: ExpedientePrioridadeEnum.default("media"),

  // Campos opcionais - Conte�do
  conteudo: z.string().optional(),
  conteudoOriginal: z.string().optional(),
  resumo: z.string().optional(),

  // Campos opcionais - Prazo
  prazo: z
    .object({
      dataFinal: z.string().datetime(),
      diasUteis: z.number().int().nonnegative(),
      diasCorridos: z.number().int().nonnegative(),
      tipo: z.enum(["uteis", "corridos"]),
      urgente: z.boolean().default(false),
    })
    .optional(),

  // Campos opcionais - Partes
  partes: z
    .object({
      autor: z.string().optional(),
      reu: z.string().optional(),
      advogadoAutor: z.string().optional(),
      advogadoReu: z.string().optional(),
    })
    .optional(),

  // Campos opcionais - Tribunal
  tribunal: z
    .object({
      nome: z.string().optional(),
      instancia: z.enum(["primeira", "segunda", "superior"]).optional(),
      vara: z.string().optional(),
      comarca: z.string().optional(),
      juiz: z.string().optional(),
    })
    .optional(),

  // Campos opcionais - Arquivos
  arquivos: z
    .array(
      z.object({
        id: z.string().uuid(),
        nome: z.string(),
        url: z.string().url(),
        tipo: z.string(),
        tamanho: z.number().nonnegative(),
        uploadedAt: z.string().datetime(),
      })
    )
    .optional(),

  // Campos opcionais - An�lise de IA
  analiseIA: z
    .object({
      realizada: z.boolean().default(false),
      agenteId: z.string().optional(),
      confidence: z.number().min(0).max(1).optional(),
      proximasAcoes: z.array(z.string()).optional(),
      tarefasGeradas: z.array(z.string()).optional(),
      observacoes: z.string().optional(),
    })
    .optional(),

  // Campos opcionais - Timestamps
  processadoEm: z.string().datetime().optional(),
  arquivadoEm: z.string().datetime().optional(),
  criadoEm: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
  atualizadoEm: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),

  // Campos opcionais - Autor
  criadoPor: z
    .object({
      tipo: z.enum(["usuario", "agente", "sistema"]),
      id: z.string().optional(),
      nome: z.string().optional(),
    })
    .optional(),

  // Metadados
  metadata: z
    .record(z.string(), z.unknown())
    .describe("Metadados adicionais do expediente")
    .optional(),

  // Tags
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Valida dados de um expediente
 */
export function validateExpediente(data: unknown): {
  isValid: boolean;
  data?: z.infer<typeof expedienteSchema>;
  errors?: z.ZodIssue[];
} {
  const result = expedienteSchema.safeParse(data);

  if (result.success) {
    return { isValid: true, data: result.data };
  }

  return { isValid: false, errors: result.error.issues };
}

/**
 * Valida array de expedientes
 */
export function validateExpedientes(data: unknown): {
  isValid: boolean;
  data?: Array<z.infer<typeof expedienteSchema>>;
  errors?: z.ZodIssue[];
} {
  const arraySchema = z.array(expedienteSchema);
  const result = arraySchema.safeParse(data);

  if (result.success) {
    return { isValid: true, data: result.data };
  }

  return { isValid: false, errors: result.error.issues };
}

// ============================================================================
// BUSINESS LOGIC HELPERS
// ============================================================================

/**
 * Verifica se expediente est� com prazo vencendo (pr�ximos 3 dias)
 */
export function isPrazoVencendo(expediente: z.infer<typeof expedienteSchema>): boolean {
  if (!expediente.prazo) return false;

  const dataFinal = new Date(expediente.prazo.dataFinal).getTime();
  const hoje = Date.now();
  const diffDias = Math.ceil((dataFinal - hoje) / (1000 * 60 * 60 * 24));

  return diffDias <= 3 && diffDias >= 0;
}

/**
 * Verifica se expediente est� com prazo vencido
 */
export function isPrazoVencido(expediente: z.infer<typeof expedienteSchema>): boolean {
  if (!expediente.prazo) return false;

  const dataFinal = new Date(expediente.prazo.dataFinal).getTime();
  const hoje = Date.now();

  return dataFinal < hoje;
}

/**
 * Determina prioridade autom�tica baseada em prazo e tipo
 */
export function determinarPrioridade(
  expediente: Partial<z.infer<typeof expedienteSchema>>
): z.infer<typeof ExpedientePrioridadeEnum> {
  // Tipos cr�ticos
  if (["citacao", "intimacao", "mandado"].includes(expediente.tipo || "")) {
    if (expediente.prazo?.urgente) return "critica";
    if (expediente.prazo && isPrazoVencendo(expediente as z.infer<typeof expedienteSchema>))
      return "urgente";
    return "alta";
  }

  // Senten�as e ac�rd�os
  if (["sentenca", "acordao"].includes(expediente.tipo || "")) {
    return "alta";
  }

  // Despachos e decis�es
  if (["despacho", "decisao"].includes(expediente.tipo || "")) {
    return "media";
  }

  // Outros
  return "baixa";
}

/**
 * Extrai n�mero do processo de descri��o ou conte�do
 */
export function extrairNumeroProcesso(texto: string): string | null {
  // Regex para n�mero CNJ: NNNNNNN-DD.AAAA.J.TT.OOOO
  const regexCNJ = /(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/g;
  const match = texto.match(regexCNJ);

  return match ? match[0] : null;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Expediente = z.infer<typeof expedienteSchema>;
export type ExpedienteTipo = z.infer<typeof ExpedienteTipoEnum>;
export type ExpedienteSource = z.infer<typeof ExpedienteSourceEnum>;
export type ExpedienteStatus = z.infer<typeof ExpedienteStatusEnum>;
export type ExpedientePrioridade = z.infer<typeof ExpedientePrioridadeEnum>;
