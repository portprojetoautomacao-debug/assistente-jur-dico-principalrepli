/**
 * Schemas de Validação para Rotas de Minutas
 *
 * Define schemas Zod para validação de entrada nas rotas de minutas.
 */

import { z } from "zod";

/**
 * Enum de tipos de minuta
 */
const MinutaTipoEnum = z.enum(["peticao", "contrato", "parecer", "recurso", "procuracao", "outro"]);

/**
 * Enum de status de minuta
 */
const MinutaStatusEnum = z.enum([
  "rascunho",
  "em-revisao",
  "pendente-revisao",
  "finalizada",
  "arquivada",
]);

/**
 * Schema para criação de minuta
 */
export const CreateMinutaSchema = z.object({
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  conteudo: z.string().min(1, "Conteúdo é obrigatório"),
  tipo: MinutaTipoEnum,
  status: MinutaStatusEnum.optional().default("rascunho"),
  processId: z.string().optional(),
  autor: z.string().min(2, "Autor é obrigatório"),
  criadoPorAgente: z.boolean().optional(),
  agenteId: z.string().optional(),
  templateId: z.string().optional(),
  expedienteId: z.string().optional(),
  variaveis: z.record(z.string(), z.string()).optional(),
});

export type CreateMinutaInput = z.infer<typeof CreateMinutaSchema>;

/**
 * Schema para atualização de minuta
 */
export const UpdateMinutaSchema = z.object({
  titulo: z.string().min(3).optional(),
  conteudo: z.string().min(1).optional(),
  tipo: MinutaTipoEnum.optional(),
  status: MinutaStatusEnum.optional(),
  processId: z.string().optional(),
  autor: z.string().min(2).optional(),
  criadoPorAgente: z.boolean().optional(),
  agenteId: z.string().optional(),
  templateId: z.string().optional(),
  expedienteId: z.string().optional(),
  googleDocsId: z.string().optional(),
  googleDocsUrl: z.string().url().optional(),
  variaveis: z.record(z.string(), z.string()).optional(),
});

export type UpdateMinutaInput = z.infer<typeof UpdateMinutaSchema>;

/**
 * Schema para parâmetros de rota com ID
 */
export const MinutaIdParamSchema = z.object({
  id: z.string().uuid("ID deve ser um UUID válido"),
});

export type MinutaIdParam = z.infer<typeof MinutaIdParamSchema>;

/**
 * Schema para query de busca de minutas
 */
export const MinutasQuerySchema = z.object({
  status: MinutaStatusEnum.optional(),
  tipo: MinutaTipoEnum.optional(),
  autor: z.string().optional(),
  processId: z.string().optional(),
  criadoPorAgente: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100))
    .optional(),
  offset: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().nonnegative())
    .optional(),
});

export type MinutasQuery = z.infer<typeof MinutasQuerySchema>;
