/**
 * React Hook for Hybrid Agents System
 *
 * Integra agentes LangGraph com sistema tradicional
 * Fornece interface unificada para execução de tarefas
 */

import type { AgentTask } from "@/lib/agents";
import {
  executeHybridTask,
  getHybridStats,
  hasHybridVersion,
  listHybridAgents,
  recordExecution,
  type HybridExecutionConfig,
  type HybridExecutionResult,
  type HybridStats,
} from "@/lib/hybrid-agents-integration";
import { useCallback, useEffect, useState } from "react";

export interface UseHybridAgentsOptions {
  /**
   * Habilita execução LangGraph automaticamente
   */
  autoEnableLangGraph?: boolean;

  /**
   * Modo de coordenação padrão
   */
  defaultCoordinationMode?: HybridExecutionConfig["coordinationMode"];

  /**
   * Timeout padrão para execução
   */
  defaultTimeout?: number;
}

export interface HybridAgentInfo {
  agentId: string;
  hasHybridVersion: boolean;
  type?: string;
}

export function useHybridAgents(options: UseHybridAgentsOptions = {}) {
  const {
    autoEnableLangGraph = true,
    defaultCoordinationMode = "fallback",
    defaultTimeout = 30000,
  } = options;

  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<HybridExecutionResult | null>(null);
  const [stats, setStats] = useState<HybridStats>(getHybridStats());
  const [error, setError] = useState<Error | null>(null);

  /**
   * Atualiza estatísticas
   */
  const refreshStats = useCallback(() => {
    setStats(getHybridStats());
  }, []);

  /**
   * Executa tarefa usando sistema híbrido
   */
  const executeTask = useCallback(
    async (
      agentId: string,
      task: AgentTask,
      config?: Partial<HybridExecutionConfig>
    ): Promise<HybridExecutionResult> => {
      setIsExecuting(true);
      setError(null);

      try {
        const executionConfig: HybridExecutionConfig = {
          enableLangGraph: autoEnableLangGraph,
          enableTraditional: true,
          coordinationMode: defaultCoordinationMode,
          timeoutMs: defaultTimeout,
          ...config,
        };

        const result = await executeHybridTask(agentId, task, executionConfig);

        recordExecution(result);
        setLastResult(result);
        refreshStats();

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsExecuting(false);
      }
    },
    [autoEnableLangGraph, defaultCoordinationMode, defaultTimeout, refreshStats]
  );

  /**
   * Verifica se agente tem versão híbrida
   */
  const checkHybridVersion = useCallback((agentId: string): boolean => {
    return hasHybridVersion(agentId);
  }, []);

  /**
   * Lista todos os agentes com versão híbrida
   */
  const getHybridAgents = useCallback((): HybridAgentInfo[] => {
    const hybridList = listHybridAgents();

    return hybridList.map((item) => ({
      agentId: item.agentId,
      hasHybridVersion: true,
      type: item.type,
    }));
  }, []);

  /**
   * Atualiza stats periodicamente
   */
  useEffect(() => {
    const interval = setInterval(refreshStats, 5000); // A cada 5s
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    // Estado
    isExecuting,
    lastResult,
    stats,
    error,

    // Ações
    executeTask,
    checkHybridVersion,
    getHybridAgents,
    refreshStats,
  };
}

/**
 * Hook simplificado para execução única
 */
export function useHybridTaskExecution() {
  const [result, setResult] = useState<HybridExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (agentId: string, task: AgentTask, config?: Partial<HybridExecutionConfig>) => {
      setLoading(true);
      setError(null);

      try {
        const executionResult = await executeHybridTask(agentId, task, config);
        recordExecution(executionResult);
        setResult(executionResult);
        return executionResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { result, loading, error, execute };
}
