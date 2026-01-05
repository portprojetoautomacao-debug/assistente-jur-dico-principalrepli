import { z } from "zod";

export const BaseEmailSchema = z.object({
  type: z.enum(["test", "notification", "urgent", "daily_summary"]),
  to: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  subject: z.string().max(256).optional(),
  message: z.string().max(5000).optional(),
});

export const TestEmailSchema = BaseEmailSchema.extend({
  type: z.literal("test"),
  to: z.union([z.string().email(), z.array(z.string().email())]),
});

export const NotificationEmailSchema = BaseEmailSchema.extend({
  type: z.literal("notification"),
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1).max(256),
  message: z.string().min(1).max(5000),
  actionUrl: z.string().url().optional(),
});

export const UrgentEmailSchema = BaseEmailSchema.extend({
  type: z.literal("urgent"),
  to: z.union([z.string().email(), z.array(z.string().email())]),
  processNumber: z.string().min(3),
  deadline: z.string().min(3),
});

export const DailySummarySchema = BaseEmailSchema.extend({
  type: z.literal("daily_summary"),
  to: z.union([z.string().email(), z.array(z.string().email())]),
  summary: z.object({
    processesMonitored: z.number().nonnegative(),
    deadlinesFound: z.number().nonnegative(),
    documentsGenerated: z.number().nonnegative(),
    errorsCount: z.number().nonnegative(),
  }),
});

export const EmailUnion = z.discriminatedUnion("type", [
  TestEmailSchema,
  NotificationEmailSchema,
  UrgentEmailSchema,
  DailySummarySchema,
]);

export type EmailRequest = z.infer<typeof EmailUnion>;

export default EmailUnion;
/**
 * Validações Zod para entrada de dados
 * Centraliza todas as validações de API
 */

// --- Tipos de Agente ---

export const AgentTaskTypeSchema = z.enum([
  "ANALYZE_DOCUMENT",
  "ANALYZE_INTIMATION",
  "CALCULATE_DEADLINE",
  "MONITOR_DJEN",
  "DRAFT_PETITION",
  "RESEARCH_PRECEDENTS",
  "CLIENT_COMMUNICATION",
  "CHECK_DATAJUD",
  "RISK_ANALYSIS",
  "BILLING_ANALYSIS",
  "ORGANIZE_FILES",
  "COMPLIANCE_CHECK",
  "LEGAL_TRANSLATION",
  "CONTRACT_REVIEW",
  "CASE_STRATEGY",
]);

export const TaskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const TaskStatusSchema = z.enum(["QUEUED", "PROCESSING", "COMPLETED", "FAILED"]);

export const AgentTaskSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
  type: AgentTaskTypeSchema,
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  createdAt: z.string().datetime(),
  data: z.record(z.string(), z.unknown()),
  error: z.string().optional(),
  completedAt: z.string().datetime().optional(),
  processingTimeMs: z.number().optional(),
});

// Input-friendly schema for API requests that may not use UUIDs
export const AgentTaskInputSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
  type: z.string().min(1),
  priority: z.string().min(1),
  status: z.string().min(1),
  createdAt: z.string().min(1),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional().default({}),
});

export const AgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  type: z.string().min(1),
  capabilities: z.array(z.string()).optional().default([]),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).optional(),
  lastActive: z.string().datetime().optional(),
});

export const AgentInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  type: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  status: z.string().optional(),
  lastActive: z.string().optional(),
});

// --- Validações de API ---

const ProcessQueueRequestSchema = z.object({
  maxTasks: z.number().min(1).max(50).optional().default(10),
  priority: TaskPrioritySchema.optional(),
  agentId: z.string().optional(),
});

const ProcessTaskRequestSchema = z.object({
  task: AgentTaskSchema,
  agent: AgentSchema,
});

// --- Utilitários ---

export function handleValidationError(error: z.ZodError) {
  const issues = error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

  return {
    ok: false,
    error: "Validation failed",
    issues,
    timestamp: new Date().toISOString(),
  };
}

export function validateProcessQueueRequest(data: unknown) {
  try {
    const parsed = ProcessQueueRequestSchema.parse(data);
    return { success: true, ...parsed };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: handleValidationError(err) };
    }
    return {
      success: false,
      error: { ok: false, error: "Unknown validation error" },
    };
  }
}

export function validateProcessTaskRequest(data: unknown) {
  try {
    const parsed = ProcessTaskRequestSchema.parse(data);
    return { success: true, task: parsed.task, agent: parsed.agent };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: handleValidationError(err) };
    }
    return {
      success: false,
      error: { ok: false, error: "Unknown validation error" },
    };
  }
}

// --- PJe specific validations ---
export const ProcessoPJESchema = z.object({
  numero: z.string().min(1),
  numeroFormatado: z.string().optional(),
  classe: z.string().optional(),
  assunto: z.string().optional(),
  parteAutor: z.string().optional(),
  parteReu: z.string().optional(),
  vara: z.string().optional(),
  comarca: z.string().optional(),
  ultimoMovimento: z.object({
    descricao: z.string(),
    data: z.string().optional(),
    timestamp: z.number(),
  }),
  situacao: z.enum(["ativo", "baixado", "arquivado"]).optional(),
  valor: z.string().optional(),
  distribuicao: z.string().optional(),
});

export const ExpedienteSchema = z.object({
  id: z.string().min(1),
  processNumber: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["intimacao", "citacao", "despacho", "decisao", "sentenca", "outro"]),
  createdAt: z.string().min(1),
  source: z.string().optional(),
  metadata: z
    .object({
      vara: z.string().optional(),
      comarca: z.string().optional(),
      timestamp: z.number(),
      previousMovement: z.string().optional(),
    })
    .optional(),
});

export function validateProcessos(data: unknown) {
  try {
    const arr = z.array(ProcessoPJESchema).parse(data);
    return { success: true, data: arr };
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: handleValidationError(err) };
    return { success: false, error: { ok: false, error: "Unknown validation error" } };
  }
}

export function validateExpedientes(data: unknown) {
  try {
    const arr = z.array(ExpedienteSchema).parse(data);
    return { success: true, data: arr };
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: handleValidationError(err) };
    return { success: false, error: { ok: false, error: "Unknown validation error" } };
  }
}
