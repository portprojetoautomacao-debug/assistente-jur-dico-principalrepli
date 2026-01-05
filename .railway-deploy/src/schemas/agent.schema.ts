/**
 * Schemas Zod para valida��o de Agentes IA e suas Tarefas
 *
 * Este arquivo centraliza a valida��o de:
 * - Agentes aut�nomos (15 agentes do sistema)
 * - Tarefas de agentes (AgentTask)
 * - Resultados de tarefas
 *
 * @module agent.schema
 */

import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const AgentTypeEnum = z.enum([
  "analyzer",
  "intimation-analyzer",
  "monitor",
  "calculator",
  "writer",
  "organizer",
  "researcher",
  "strategic",
  "compliance",
  "translator",
  "communicator",
  "financial",
  "contract-reviewer",
  "risk-analyst",
]);

export const AgentTaskTypeEnum = z.enum([
  "analyze_document",
  "analyze_intimation",
  "monitor_djen",
  "calculate_deadline",
  "draft_petition",
  "check_datajud",
  "organize_files",
  "research_precedents",
  "risk_analysis",
  "contract_review",
  "client_communication",
  "billing_analysis",
  "case_strategy",
  "legal_translation",
  "compliance_check",
]);

export const TaskPriorityEnum = z.enum(["low", "medium", "high", "urgent", "critical"]);

export const TaskStatusEnum = z.enum([
  "queued",
  "processing",
  "completed",
  "failed",
  "human_intervention",
  "cancelled",
]);

export const AgentStatusEnum = z.enum([
  "active",
  "idle",
  "processing",
  "paused",
  "error",
  "waiting_human",
]);

/**
 * Enum para capacidades válidas de agentes
 */
export const AgentCapabilityEnum = z.enum([
  "strategic-analysis",
  "performance-monitoring",
  "risk-identification",
  "data-analysis",
  "intimation-analysis",
  "deadline-identification",
  "task-generation",
  "priority-assessment",
  "document-analysis",
  "text-extraction",
  "entity-recognition",
  "classification",
  "djen-monitoring",
  "publication-detection",
  "notification",
  "datajud-integration",
  "deadline-calculation",
  "business-days",
  "holiday-detection",
  "alert-generation",
  "document-drafting",
  "legal-writing",
  "template-generation",
  "precedent-integration",
  "file-organization",
  "categorization",
  "indexing",
  "duplicate-detection",
  "jurisprudence-search",
  "precedent-analysis",
  "case-law-research",
  "trend-analysis",
  "risk-assessment",
  "probability-analysis",
  "financial-impact",
  "mitigation-strategies",
  "contract-analysis",
  "clause-review",
  "compliance-check",
  "client-communication",
  "report-generation",
  "language-simplification",
  "personalization",
  "financial-monitoring",
  "profitability-analysis",
  "receivables-tracking",
  "metrics-calculation",
  "strategic-planning",
  "option-analysis",
  "cost-benefit",
  "success-probability",
  "legal-translation",
  "term-explanation",
  "glossary-creation",
  "language-adaptation",
  "lgpd-verification",
  "ethics-review",
  "regulatory-audit",
]);

// ============================================================================
// AGENT SCHEMA
// ============================================================================

/**
 * Schema para valida��o de Agente IA
 */
export const agentSchema = z.object({
  // Campos obrigat�rios
  id: z.string().min(1, "ID do agente � obrigat�rio"),
  name: z.string().min(1, "Nome do agente � obrigat�rio"),
  type: AgentTypeEnum,
  description: z.string().min(10, "Descri��o deve ter pelo menos 10 caracteres"),
  capabilities: z.array(AgentCapabilityEnum).min(1, "Agente deve ter pelo menos 1 capacidade"),
  active: z.boolean(),
  status: AgentStatusEnum.default("idle"),

  // Campos opcionais
  icon: z.string().optional(),
  color: z.string().optional(),
  lastActive: z.string().datetime().optional(),
  tasksCompleted: z.number().int().nonnegative().default(0),
  tasksQueued: z.number().int().nonnegative().default(0),
  successRate: z.number().min(0).max(100).optional(),
  avgProcessingTime: z.number().nonnegative().optional(),

  // Configura��es
  config: z
    .object({
      maxConcurrentTasks: z.number().int().positive().default(3),
      timeout: z.number().int().positive().default(30000),
      retryAttempts: z.number().int().nonnegative().default(3),
      priority: TaskPriorityEnum.default("medium"),
    })
    .optional(),

  // Metadados
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema para valida��o de Tarefa de Agente
 */
export const agentTaskSchema = z.object({
  // Campos obrigat�rios
  id: z.string().uuid("ID da tarefa deve ser UUID v�lido"),
  agentId: z.string().min(1, "ID do agente � obrigat�rio"),
  type: AgentTaskTypeEnum,
  priority: TaskPriorityEnum,
  status: TaskStatusEnum,
  createdAt: z.string().datetime("Data de cria��o inv�lida"),
  data: z.record(z.string(), z.unknown()).default({}),

  // Campos opcionais de execu��o
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  processingTimeMs: z.number().int().nonnegative().optional(),

  // Resultado e erro
  result: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),

  // Retry control
  retryCount: z.number().int().nonnegative().default(0),
  maxRetries: z.number().int().nonnegative().default(3),

  // Timeout
  timeout: z.number().int().positive().default(30000),

  // Relacionamentos
  processId: z.string().optional(),
  expedienteId: z.string().optional(),
  parentTaskId: z.string().optional(),

  // Metadados
  metadata: z
    .object({
      source: z.enum(["user", "agent", "cron", "webhook"]).optional(),
      triggeredBy: z.string().optional(),
      confidence: z.number().min(0).max(1).optional(),
      needsReview: z.boolean().optional(),
    })
    .optional(),
});

/**
 * Schema para resultado de tarefa de agente
 */
export const agentTaskResultSchema = z.object({
  success: z.boolean(),
  data: z.record(z.string(), z.unknown()).optional(),
  message: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  processingTimeMs: z.number().int().nonnegative().optional(),
  tokensUsed: z.number().int().nonnegative().optional(),
  warnings: z.array(z.string()).optional(),
  suggestedActions: z.array(z.string()).optional(),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Valida dados de um agente
 */
export function validateAgent(data: unknown): {
  isValid: boolean;
  data?: z.infer<typeof agentSchema>;
  errors?: z.ZodIssue[];
} {
  const result = agentSchema.safeParse(data);

  if (result.success) {
    return { isValid: true, data: result.data };
  }

  return { isValid: false, errors: result.error.issues };
}

/**
 * Valida dados de uma tarefa de agente
 */
export function validateAgentTask(data: unknown): {
  isValid: boolean;
  data?: z.infer<typeof agentTaskSchema>;
  errors?: z.ZodIssue[];
} {
  const result = agentTaskSchema.safeParse(data);

  if (result.success) {
    return { isValid: true, data: result.data };
  }

  return { isValid: false, errors: result.error.issues };
}

/**
 * Valida resultado de tarefa de agente
 */
export function validateAgentTaskResult(data: unknown): {
  isValid: boolean;
  data?: z.infer<typeof agentTaskResultSchema>;
  errors?: z.ZodIssue[];
} {
  const result = agentTaskResultSchema.safeParse(data);

  if (result.success) {
    return { isValid: true, data: result.data };
  }

  return { isValid: false, errors: result.error.issues };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Agent = z.infer<typeof agentSchema>;
export type AgentTask = z.infer<typeof agentTaskSchema>;
export type AgentTaskResult = z.infer<typeof agentTaskResultSchema>;
export type AgentType = z.infer<typeof AgentTypeEnum>;
export type AgentTaskType = z.infer<typeof AgentTaskTypeEnum>;
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;
export type TaskStatus = z.infer<typeof TaskStatusEnum>;
export type AgentStatus = z.infer<typeof AgentStatusEnum>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Verifica se uma tarefa pode ser processada
 */
export function canProcessTask(task: AgentTask, agent: Agent): boolean {
  return (
    agent.active &&
    agent.status !== "error" &&
    agent.status !== "paused" &&
    task.status === "queued" &&
    task.retryCount < task.maxRetries
  );
}

/**
 * Verifica se uma tarefa est� expirada (timeout)
 */
export function isTaskExpired(task: AgentTask): boolean {
  if (!task.startedAt || task.status !== "processing") return false;

  const startTime = new Date(task.startedAt).getTime();
  const now = Date.now();
  const elapsed = now - startTime;

  return elapsed > task.timeout;
}

/**
 * Calcula pr�ximo retry delay (exponential backoff)
 */
export function getRetryDelay(retryCount: number): number {
  const baseDelay = 1000; // 1 segundo
  const maxDelay = 60000; // 1 minuto
  const delay = baseDelay * Math.pow(2, retryCount);
  return Math.min(delay, maxDelay);
}
