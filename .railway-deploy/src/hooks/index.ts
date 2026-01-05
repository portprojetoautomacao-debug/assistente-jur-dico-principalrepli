/**
 * Index de Hooks - Exportação centralizada
 * Facilita imports e mantém API consistente
 */

// Hooks de validação e gestão de dados
export { useProcessesValidated } from "./use-processes-validated";
export { useClientesValidated } from "./use-clientes-validated";
export { useMinutasValidated } from "./use-minutas-validated";
export { useFinancialValidated } from "./use-financial-validated";

// Hooks existentes (re-export para conveniência)
export { useKV } from "./use-kv";
export { useAutonomousAgents } from "./use-autonomous-agents";
export { useAIStreaming } from "./use-ai-streaming";
export { useNotifications } from "./use-notifications";
export { useAnalytics } from "./use-analytics";

// Tipos exportados dos hooks
export type { Cliente } from "./use-clientes-validated";
export type { Minuta } from "./use-minutas-validated";
export type { FinancialEntry } from "./use-financial-validated";
