/**
 * Schemas de Validação para Rotas de Agentes
 *
 * Define schemas Zod para validação de entrada nas rotas de agentes.
 */

import { z } from "zod";

/**
 * Schema para execução de agente
 */
export const ExecuteAgentSchema = z.object({
  agentId: z.string().min(1, "agentId é obrigatório"),
  task: z.string().min(10, "task deve ter no mínimo 10 caracteres"),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timeout: z.number().int().positive().optional(),
});

export type ExecuteAgentInput = z.infer<typeof ExecuteAgentSchema>;

/**
 * Schema para orquestração de múltiplos agentes
 */
export const OrchestrationRequestSchema = z.object({
  mode: z.enum(["parallel", "sequential", "fallback"]),
  agents: z
    .array(
      z.object({
        agentId: z.string().min(1, "agentId é obrigatório"),
        task: z.string().min(1, "task é obrigatório"),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .min(1, "É necessário fornecer pelo menos um agente"),
  maxParallelism: z.number().int().positive().max(10).optional(),
  fallbackStrategy: z.enum(["next-agent", "abort"]).optional(),
});

export type OrchestrationRequestInput = z.infer<typeof OrchestrationRequestSchema>;

/**
 * Schema para parâmetros de rota com agentId
 */
export const AgentIdParamSchema = z.object({
  agentId: z.string().min(1, "agentId é obrigatório"),
});

export type AgentIdParam = z.infer<typeof AgentIdParamSchema>;
