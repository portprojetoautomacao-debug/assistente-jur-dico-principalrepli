/**
 * @fileoverview Documenta��o da API Interna - Guia de Refer�ncia
 *
 * Este arquivo documenta as APIs internas mais usadas do sistema,
 * facilitando o desenvolvimento e manuten��o.
 *
 * @author Assistente Jur�dico PJe Team
 * @version 1.0.0
 */

/**
 * ======================
 * HOOKS PRINCIPAIS
 * ======================
 */

/**
 * Hook para gest�o de processos com valida��o Zod
 *
 * @example
 * ```typescript
 * const { processes, addProcess, updateProcess, deleteProcess } = useProcessesValidated();
 *
 * // Adicionar processo (valida automaticamente)
 * const newProcess = addProcess({
 *   numeroCNJ: '1234567-89.2024.5.02.0999',
 *   titulo: 'A��o Trabalhista',
 *   autor: 'Jo�o Silva',
 *   reu: 'Empresa XYZ',
 *   status: 'ativo',
 * });
 *
 * // Atualizar processo
 * updateProcess(newProcess.id, { status: 'concluido' });
 * ```
 *
 * @returns {Object} Fun��es e estado de processos
 * @see src/hooks/use-processes-validated.ts
 */
export type UseProcessesValidated = ReturnType<
  typeof import("./hooks/use-processes-validated").useProcessesValidated
>;

/**
 * Hook para gest�o de agentes IA aut�nomos
 *
 * @example
 * ```typescript
 * const { agents, tasks, addTask, toggleAgent } = useAutonomousAgents();
 *
 * // Criar tarefa para agente
 * addTask({
 *   id: crypto.randomUUID(),
 *   agentId: 'redacao-peticoes',
 *   type: 'draft_petition',
 *   priority: 'high',
 *   data: { processId: '123' }
 * });
 * ```
 *
 * @see src/hooks/use-autonomous-agents.ts
 */
export type UseAutonomousAgents = ReturnType<
  typeof import("./hooks/use-autonomous-agents").useAutonomousAgents
>;

/**
 * ======================
 * SERVI�OS DE IA
 * ======================
 */

/**
 * Servi�o de streaming de IA (Gemini 2.5 Pro)
 *
 * @example
 * ```typescript
 * const { streamChat, isStreaming, streamingContent } = useAIStreaming({
 *   agentId: 'harvey-specter',
 *   sessionId: 'session-123',
 * });
 *
 * const response = await streamChat([
 *   { role: 'system', content: 'Voc� � um assistente jur�dico' },
 *   { role: 'user', content: 'Analise este processo' }
 * ]);
 * ```
 *
 * @see src/hooks/use-ai-streaming.ts
 */
export type UseAIStreaming = ReturnType<typeof import("./hooks/use-ai-streaming").useAIStreaming>;

/**
 * ======================
 * INTEGRA��ES EXTERNAS
 * ======================
 */

/**
 * API do DJEN (Di�rio de Justi�a Eletr�nico Nacional)
 *
 * @example
 * ```typescript
 * import { consultarDJENForLawyer } from '@/lib/api/djen-client';
 *
 * const { resultados, erros } = await consultarDJENForLawyer(
 *   ['TJMG', 'TRT3'],
 *   'Thiago Bodevan Veiga',
 *   '184404',
 *   undefined,
 *   undefined,
 *   'D' // Di�rio Digital
 * );
 * ```
 *
 * @see src/lib/api/djen-client.ts
 * @apiEndpoint https://comunicaapi.pje.jus.br/api/v1/comunicacao
 */

/**
 * ======================
 * SCHEMAS DE VALIDA��O
 * ======================
 */

/**
 * Schema Zod para valida��o de processos
 *
 * @example
 * ```typescript
 * import { processSchema, validateProcess } from '@/schemas/process.schema';
 *
 * const validation = validateProcess(processData);
 * if (!validation.isValid) {
 *   console.error('Erros:', validation.errors);
 * } else {
 *   // validation.data � do tipo ProcessValidated
 *   saveProcess(validation.data);
 * }
 * ```
 *
 * @see src/schemas/process.schema.ts
 */

/**
 * ======================
 * COMPONENTES UI
 * ======================
 */

/**
 * Skeleton Loaders - Componentes de loading profissionais
 *
 * @example
 * ```typescript
 * import { ProcessCardSkeleton, DashboardSkeleton } from '@/components/ui/skeletons';
 *
 * // Em loading states
 * {isLoading ? <ProcessCardSkeleton /> : <ProcessCard process={data} />}
 * ```
 *
 * @see src/components/ui/skeletons.tsx
 */

/**
 * ======================
 * MONITORAMENTO
 * ======================
 */

/**
 * Sentry - Error Tracking e Performance Monitoring
 *
 * @example
 * ```typescript
 * import { captureException, setUserContext } from '@/lib/monitoring';
 *
 * // Ap�s login
 * setUserContext({ id: user.id, email: user.email, role: 'advogado' });
 *
 * // Capturar erro customizado
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureException(error, { processId: '123', action: 'create_petition' });
 * }
 * ```
 *
 * @see src/lib/monitoring.ts
 * @compliance LGPD - Dados sens�veis s�o filtrados automaticamente
 */

/**
 * ======================
 * TIPOS PRINCIPAIS
 * ======================
 */

export type { Process, Prazo, Cliente, Minuta, FinancialEntry } from "./types";
export type { AgentTask } from "./lib/agents";
export type { ProcessValidated, PrazoValidated } from "./schemas/process.schema";
