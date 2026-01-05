/**
 * Hook para sincronização em tempo real da Timeline Processual
 * Monitora expedientes vindos da extensão Chrome PJe
 */

import { createProcessTimeline } from "@/lib/process-timeline-utils";
import type { Expediente, ProcessEvent } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { useKV } from "./use-kv";

interface TimelineSyncOptions {
  processId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
}

export function useTimelineSync(options: TimelineSyncOptions = {}) {
  const {
    processId,
    autoRefresh = true,
    refreshInterval = 30000, // 30 segundos
  } = options;

  const [expedientes] = useKV<Expediente[]>("expedientes", []);
  const [events, setEvents] = useState<ProcessEvent[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [newEventsCount, setNewEventsCount] = useState(0);

  // Filtra e transforma expedientes em eventos de timeline
  const refreshTimeline = useCallback(() => {
    if (!expedientes || expedientes.length === 0) {
      setEvents([]);
      return;
    }

    // Filtra expedientes do processo atual (se especificado)
    const filtered = processId
      ? expedientes.filter((exp) => {
          // Tenta múltiplos formatos de número de processo
          const expNumber = exp.numeroProcesso || exp.processId || "";
          return (
            expNumber === processId ||
            expNumber.replaceAll(/\D/g, "") === processId.replaceAll(/\D/g, "")
          );
        })
      : expedientes;

    // Converte para ProcessEvent[]
    const timeline = createProcessTimeline(filtered, []);

    // Detecta novos eventos
    const previousCount = events.length;
    const newCount = timeline.length;
    if (newCount > previousCount) {
      setNewEventsCount(newCount - previousCount);
    }

    setEvents(timeline);
    setLastUpdate(new Date());
  }, [expedientes, processId, events.length]);

  // Auto-refresh periódico
  useEffect(() => {
    if (!autoRefresh) return;

    refreshTimeline();
    const interval = setInterval(refreshTimeline, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshTimeline]);

  // Refresh inicial
  useEffect(() => {
    refreshTimeline();
  }, [refreshTimeline]);

  // Marca notificação de novos eventos como lida
  const markAsRead = useCallback(() => {
    setNewEventsCount(0);
  }, []);

  return {
    events, // ProcessEvent[] para usar no ProcessTimelineViewer
    expedientes: processId
      ? expedientes.filter((exp) => {
          const expNumber = exp.numeroProcesso || exp.processId || "";
          return (
            expNumber === processId ||
            expNumber.replaceAll(/\D/g, "") === processId.replaceAll(/\D/g, "")
          );
        })
      : expedientes,
    lastUpdate,
    newEventsCount,
    markAsRead,
    refresh: refreshTimeline,
  };
}
