/**
 * Index central para todos os schemas Zod do sistema
 *
 * Centraliza exports de:
 * - Schemas de processo, cliente, minuta, financeiro
 * - Schemas de agentes IA e tarefas
 * - Schemas de expedientes
 * - Validadores e helpers
 *
 * @module schemas
 */

// ============================================================================
// EXPORTS DE PROCESS SCHEMA
// ============================================================================

export {
  // Schemas
  processSchema,
  prazoSchema,
  clienteSchema,
  minutaSchema,
  financialEntrySchema,
  numeroCNJSchema,
  cpfSchema,
  cnpjSchema,
  telefoneSchema,
  emailSchema,

  // Types
  type ProcessValidated,
  type PrazoValidated,
  type ClienteValidated,
  type MinutaValidated,
  type FinancialEntryValidated,

  // Validadores
  validateProcess,
  validateCliente,
  validateMinuta,
  validateFinancialEntry,
  isValidCPF,
  isValidCNPJ,
} from "./process.schema";

// ============================================================================
// EXPORTS DE AGENT SCHEMA
// ============================================================================

export {
  // Schemas
  agentSchema,
  agentTaskSchema,
  agentTaskResultSchema,

  // Enums
  AgentTypeEnum,
  AgentTaskTypeEnum,
  TaskPriorityEnum,
  TaskStatusEnum,
  AgentStatusEnum,

  // Types
  type Agent,
  type AgentTask,
  type AgentTaskResult,
  type AgentType,
  type AgentTaskType,
  type TaskPriority,
  type TaskStatus,
  type AgentStatus,

  // Validadores
  validateAgent,
  validateAgentTask,
  validateAgentTaskResult,

  // Helpers
  canProcessTask,
  isTaskExpired,
  getRetryDelay,
} from "./agent.schema";

// ============================================================================
// EXPORTS DE EXPEDIENTE SCHEMA
// ============================================================================

export {
  // Schemas
  expedienteSchema,

  // Enums
  ExpedienteTipoEnum,
  ExpedienteSourceEnum,
  ExpedienteStatusEnum,
  ExpedientePrioridadeEnum,

  // Types
  type Expediente,
  type ExpedienteTipo,
  type ExpedienteSource,
  type ExpedienteStatus,
  type ExpedientePrioridade,

  // Validadores
  validateExpediente,
  validateExpedientes,

  // Helpers
  isPrazoVencendo,
  isPrazoVencido,
  determinarPrioridade,
  extrairNumeroProcesso,
} from "./expediente.schema";
