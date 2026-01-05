/**
 * Hook para sincronização automática de contadores do processo
 * Atualiza expedientes, intimações, minutas vinculados a cada processo
 */

import { useKV } from "@/hooks/use-kv";
import { processNumbersMatch } from "@/lib/process-number-utils";
import type { Expediente, Minuta, Process } from "@/types";
import { useCallback, useEffect, useMemo } from "react";

interface ProcessStats {
  expedientes: number;
  intimacoes: number;
  minutas: number;
  documentos: number;
  lastExpediente?: string;
  lastMinuta?: string;
}

export function useProcessSync() {
  const [processes, setProcesses] = useKV<Process[]>("processes", []);
  const [expedientes] = useKV<Expediente[]>("expedientes", []);
  const [minutas] = useKV<Minuta[]>("minutas", []);

  /**
   * Encontra o ID do processo baseado no número CNJ
   */
  const findProcessIdByNumber = useCallback(
    (numeroProcesso: string | undefined): string | undefined => {
      if (!numeroProcesso) return undefined;
      const processo = (processes || []).find((p) =>
        processNumbersMatch(p.numeroCNJ, numeroProcesso)
      );
      return processo?.id;
    },
    [processes]
  );

  /**
   * Calcula estatísticas de cada processo baseado nos expedientes e minutas
   */
  const processStats = useMemo(() => {
    const stats = new Map<string, ProcessStats>();
    const processList = processes || [];
    const expedientesList = expedientes || [];
    const minutasList = minutas || [];

    // Early return se não houver processos
    if (processList.length === 0) {
      return stats;
    }

    // Inicializar stats para todos os processos
    processList.forEach((p) => {
      stats.set(p.id, {
        expedientes: 0,
        intimacoes: 0,
        minutas: 0,
        documentos: 0,
      });
    });

    // Contar expedientes por processo
    expedientesList.forEach((exp) => {
      // Tentar vincular pelo processId ou pelo numeroProcesso
      let processId = exp.processId;
      if (!processId && exp.numeroProcesso) {
        processId = findProcessIdByNumber(exp.numeroProcesso);
      }

      if (processId && stats.has(processId)) {
        const current = stats.get(processId)!;
        current.expedientes++;
        current.documentos++;

        // Contar intimações especificamente
        const isIntimacao = exp.tipo === "intimacao" || exp.type === "intimacao";
        if (isIntimacao) {
          current.intimacoes++;
        }

        // Atualizar data do último expediente
        const expDate = exp.dataRecebimento || exp.receivedAt || exp.createdAt;
        if (expDate && (!current.lastExpediente || expDate > current.lastExpediente)) {
          current.lastExpediente = expDate;
        }

        stats.set(processId, current);
      }
    });

    // Contar minutas por processo
    minutasList.forEach((min) => {
      if (min.processId && stats.has(min.processId)) {
        const current = stats.get(min.processId)!;
        current.minutas++;
        current.documentos++;

        // Atualizar data da última minuta
        if (min.criadoEm && (!current.lastMinuta || min.criadoEm > current.lastMinuta)) {
          current.lastMinuta = min.criadoEm;
        }

        stats.set(min.processId, current);
      }
    });

    return stats;
  }, [processes, expedientes, minutas, findProcessIdByNumber]);

  /**
   * Sincroniza os contadores nos processos
   * Retorna true se houve alteração
   */
  const syncProcessStats = useCallback((): boolean => {
    if (!processes || processes.length === 0) return false;

    let hasChanges = false;
    const now = new Date().toISOString();

    const updated = processes.map((p) => {
      const stats = processStats.get(p.id);
      if (!stats) return p;

      // Verificar se houve mudança nos contadores
      const hasStatChanges =
        p.expedientesCount !== stats.expedientes ||
        p.intimacoesCount !== stats.intimacoes ||
        p.minutasCount !== stats.minutas ||
        p.documentosCount !== stats.documentos;
      const hasDateChanges =
        p.lastExpedienteAt !== stats.lastExpediente || p.lastMinutaAt !== stats.lastMinuta;
      const changed = hasStatChanges || hasDateChanges;

      if (changed) {
        hasChanges = true;
        return {
          ...p,
          expedientesCount: stats.expedientes,
          intimacoesCount: stats.intimacoes,
          minutasCount: stats.minutas,
          documentosCount: stats.documentos,
          lastExpedienteAt: stats.lastExpediente,
          lastMinutaAt: stats.lastMinuta,
          updatedAt: now,
        };
      }

      return p;
    });

    if (hasChanges) {
      setProcesses(updated);
    }

    return hasChanges;
  }, [processes, processStats, setProcesses]);

  /**
   * Obtém estatísticas de um processo específico
   */
  const getProcessStats = useCallback(
    (processId: string): ProcessStats | undefined => {
      return processStats.get(processId);
    },
    [processStats]
  );

  /**
   * Obtém expedientes vinculados a um processo
   */
  const getExpedientesForProcess = useCallback(
    (processId: string): Expediente[] => {
      const processo = (processes || []).find((p) => p.id === processId);
      if (!processo) return [];

      return (expedientes || []).filter(
        (exp) =>
          exp.processId === processId || processNumbersMatch(exp.numeroProcesso, processo.numeroCNJ)
      );
    },
    [processes, expedientes]
  );

  /**
   * Obtém minutas vinculadas a um processo
   */
  const getMinutasForProcess = useCallback(
    (processId: string): Minuta[] => {
      return (minutas || []).filter((min) => min.processId === processId);
    },
    [minutas]
  );

  /**
   * Vincula automaticamente um expediente a um processo pelo número CNJ
   */
  const autoLinkExpediente = useCallback(
    (expediente: Expediente): Expediente => {
      // Se já tem processId, retorna sem alteração
      if (expediente.processId) return expediente;

      // Buscar processo pelo número
      const processId = findProcessIdByNumber(expediente.numeroProcesso);
      if (processId) {
        return { ...expediente, processId };
      }

      return expediente;
    },
    [findProcessIdByNumber]
  );

  /**
   * Efeito para escutar eventos de atualização
   */
  useEffect(() => {
    const handleProcessUpdate = () => {
      syncProcessStats();
    };

    globalThis.addEventListener("process-update-needed", handleProcessUpdate);
    globalThis.addEventListener("expediente-added", handleProcessUpdate);
    globalThis.addEventListener("minuta-added", handleProcessUpdate);

    return () => {
      globalThis.removeEventListener("process-update-needed", handleProcessUpdate);
      globalThis.removeEventListener("expediente-added", handleProcessUpdate);
      globalThis.removeEventListener("minuta-added", handleProcessUpdate);
    };
  }, [syncProcessStats]);

  return {
    processStats,
    syncProcessStats,
    getProcessStats,
    getExpedientesForProcess,
    getMinutasForProcess,
    autoLinkExpediente,
    findProcessIdByNumber,
  };
}
