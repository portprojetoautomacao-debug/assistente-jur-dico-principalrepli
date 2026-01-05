/**
 * Hook para sincronização em tempo real com a extensão Chrome do PJe
 *
 * Features:
 * - Escuta mensagens SYNC_PROCESSOS e SYNC_EXPEDIENTES
 * - Converte ProcessoPJe → Process e Expediente → ProcessEvent
 * - Atualiza automaticamente o estado do app
 * - Indicador visual de conexão com extensão
 * - Contador de novos itens sincronizados
 */

// Tipos da extensão Chrome (redeclarados para evitar dependências cruzadas)
interface ProcessoPJe {
  numero: string;
  numeroFormatado: string;
  classe: string;
  assunto: string;
  parteAutor: string;
  parteReu: string;
  vara: string;
  comarca: string;
  situacao: "ativo" | "baixado" | "arquivado";
  valor?: string;
  distribuicao: string;
  ultimoMovimento: {
    descricao: string;
    data: string;
    timestamp: number;
  };
}

interface Expediente {
  id: string;
  processNumber: string;
  description: string;
  type: "intimacao" | "citacao" | "despacho" | "decisao" | "sentenca" | "outro";
  createdAt: string;
  source: "pje-extension";
  metadata: {
    vara: string;
    comarca: string;
    timestamp: number;
  };
}

interface SyncMessage {
  type: "SYNC_PROCESSOS" | "SYNC_EXPEDIENTES" | "PING" | "SYNC_ERROR" | "FORCE_SYNC";
  data?: ProcessoPJe[] | Expediente[];
  timestamp?: number;
}

import { useKV } from "@/hooks/use-kv";
import type { Process, ProcessEvent } from "@/types";
import { useCallback, useEffect, useState } from "react";

export interface PJERealTimeSyncState {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  newProcessosCount: number;
  newExpedientesCount: number;
  totalProcessos: number;
  totalExpedientes: number;
  error: string | null;
}

export interface PJERealTimeSyncHook extends PJERealTimeSyncState {
  forceSync: () => void;
  clearNewCounts: () => void;
  acknowledgeError: () => void;
}

/**
 * Converter ProcessoPJe (extensão) → Process (app)
 */
function convertProcessoPJeToProcess(pje: ProcessoPJe): Process {
  const now = new Date().toISOString();

  return {
    id: `pje-${pje.numero}`,
    numeroCNJ: pje.numeroFormatado,
    titulo: `${pje.classe} - ${pje.assunto}`,
    autor: pje.parteAutor,
    reu: pje.parteReu,
    comarca: pje.comarca,
    vara: pje.vara,
    status:
      pje.situacao === "ativo" ? "ativo" : pje.situacao === "baixado" ? "concluido" : "arquivado",
    fase: pje.ultimoMovimento?.descricao || "Em andamento",
    valor: pje.valor
      ? Number.parseFloat(pje.valor.replace(/[^\d,]/g, "").replace(",", "."))
      : undefined,
    dataDistribuicao: pje.distribuicao || now,
    dataUltimaMovimentacao: pje.ultimoMovimento?.timestamp
      ? new Date(pje.ultimoMovimento.timestamp).toISOString()
      : now,
    notas: `Sincronizado do PJe em ${new Date().toLocaleString("pt-BR")}`,
    prazos: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Converter Expediente (extensão) → ProcessEvent (app)
 */
function convertExpedienteToProcessEvent(exp: Expediente): ProcessEvent {
  return {
    id: exp.id,
    processId: `pje-${exp.processNumber.replace(/\D/g, "")}`,
    dataHora: exp.createdAt,
    titulo: exp.description,
    descricao: exp.description,
    tipo: exp.type === "intimacao" ? "intimacao" : exp.type === "despacho" ? "despacho" : "outro",
    documentoUrl: undefined, // Pode ser preenchido depois se houver PDF
    documentoTipo: undefined,
  };
}

function isValidSyncMessage(message: unknown): message is SyncMessage {
  if (!message || typeof message !== "object") return false;
  return typeof (message as SyncMessage).type === "string";
}

function shouldIgnoreMessage(event: MessageEvent<SyncMessage>): boolean {
  return event.source !== window && event.origin !== window.location.origin;
}

function dedupeById<T extends { id: string }>(incoming: T[], existing: T[]): T[] {
  const existingIds = new Set(existing.map((e) => e.id));
  return incoming.filter((e) => !existingIds.has(e.id));
}

function dedupeByNumeroCNJ(incoming: Process[], existing: Process[]): Process[] {
  const existingNumbers = new Set(existing.map((p) => p.numeroCNJ));
  return incoming.filter((p) => !existingNumbers.has(p.numeroCNJ));
}

/**
 * Hook principal
 */
export function usePJERealTimeSync(): PJERealTimeSyncHook {
  const [processes, setProcesses] = useKV<Process[]>("processes", []);
  const [processEvents, setProcessEvents] = useKV<ProcessEvent[]>("processEvents", []);

  const [state, setState] = useState<PJERealTimeSyncState>({
    isConnected: false,
    isSyncing: false,
    lastSyncAt: null,
    newProcessosCount: 0,
    newExpedientesCount: 0,
    totalProcessos: processes?.length || 0,
    totalExpedientes: processEvents?.length || 0,
    error: null,
  });

  /**
   * Handler para mensagens da extensão Chrome
   */
  const handleExtensionMessage = useCallback(
    (event: MessageEvent<SyncMessage>) => {
      // Validar origem (apenas mensagens da própria janela ou da extensão)
      if (shouldIgnoreMessage(event)) return;

      const message = event.data as unknown;
      if (!isValidSyncMessage(message)) return;

      console.log("[PJE Sync] Mensagem recebida:", message.type);

      try {
        switch (message.type) {
          case "PING": {
            // Extensão está viva - marcar como conectada
            setState((prev) => ({
              ...prev,
              isConnected: true,
              error: null,
            }));
            break;
          }

          case "SYNC_PROCESSOS": {
            const processosPJe = message.data as ProcessoPJe[];

            if (!Array.isArray(processosPJe) || processosPJe.length === 0) {
              console.warn("[PJE Sync] SYNC_PROCESSOS com array vazio");
              return;
            }

            setState((prev) => ({ ...prev, isSyncing: true }));

            // Converter e adicionar processos
            const newProcesses = processosPJe.map(convertProcessoPJeToProcess);
            const currentProcesses = processes || [];

            const uniqueNewProcesses = dedupeByNumeroCNJ(newProcesses, currentProcesses);

            if (uniqueNewProcesses.length > 0) {
              setProcesses([...currentProcesses, ...uniqueNewProcesses]);

              setState((prev) => ({
                ...prev,
                isSyncing: false,
                isConnected: true,
                lastSyncAt: new Date().toISOString(),
                newProcessosCount: prev.newProcessosCount + uniqueNewProcesses.length,
                totalProcessos: currentProcesses.length + uniqueNewProcesses.length,
                error: null,
              }));

              console.log(`[PJE Sync] ${uniqueNewProcesses.length} novos processos sincronizados`);
            } else {
              setState((prev) => ({
                ...prev,
                isSyncing: false,
                isConnected: true,
                lastSyncAt: new Date().toISOString(),
              }));
              console.log("[PJE Sync] Nenhum processo novo (todos já existiam)");
            }

            break;
          }

          case "SYNC_EXPEDIENTES": {
            const expedientes = message.data as Expediente[];

            if (!Array.isArray(expedientes) || expedientes.length === 0) {
              console.warn("[PJE Sync] SYNC_EXPEDIENTES com array vazio");
              return;
            }

            setState((prev) => ({ ...prev, isSyncing: true }));

            // Converter e adicionar expedientes
            const newEvents = expedientes.map(convertExpedienteToProcessEvent);
            const currentEvents = processEvents || [];

            const uniqueNewEvents = dedupeById(newEvents, currentEvents);

            if (uniqueNewEvents.length > 0) {
              setProcessEvents([...currentEvents, ...uniqueNewEvents]);

              setState((prev) => ({
                ...prev,
                isSyncing: false,
                isConnected: true,
                lastSyncAt: new Date().toISOString(),
                newExpedientesCount: prev.newExpedientesCount + uniqueNewEvents.length,
                totalExpedientes: currentEvents.length + uniqueNewEvents.length,
                error: null,
              }));

              console.log(`[PJE Sync] ${uniqueNewEvents.length} novos expedientes sincronizados`);
            } else {
              setState((prev) => ({
                ...prev,
                isSyncing: false,
                isConnected: true,
                lastSyncAt: new Date().toISOString(),
              }));
              console.log("[PJE Sync] Nenhum expediente novo (todos já existiam)");
            }

            break;
          }

          default:
            // Ignorar outros tipos de mensagem
            break;
        }
      } catch (error) {
        console.error("[PJE Sync] Erro ao processar mensagem:", error);
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        }));
      }
    },
    [processes, processEvents, setProcesses, setProcessEvents]
  );

  /**
   * Forçar sincronização (envia mensagem FORCE_SYNC para extensão)
   */
  const forceSync = useCallback(() => {
    console.log("[PJE Sync] Forçando sincronização...");

    const message: SyncMessage = {
      type: "FORCE_SYNC",
      timestamp: Date.now(),
    };

    window.postMessage(message, window.location.origin);

    setState((prev) => ({
      ...prev,
      isSyncing: true,
      error: null,
    }));

    // Timeout de 10s para sincronização
    setTimeout(() => {
      setState((prev) => {
        if (prev.isSyncing) {
          return {
            ...prev,
            isSyncing: false,
            error: "Timeout: Extensão não respondeu em 10 segundos",
          };
        }
        return prev;
      });
    }, 10000);
  }, []);

  /**
   * Limpar contadores de novos itens
   */
  const clearNewCounts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      newProcessosCount: 0,
      newExpedientesCount: 0,
    }));
  }, []);

  /**
   * Reconhecer erro (limpar mensagem de erro)
   */
  const acknowledgeError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * Setup: Registrar listener de mensagens e enviar PING inicial
   */
  useEffect(() => {
    console.log("[PJE Sync] Inicializando hook de sincronização...");

    // Registrar listener
    window.addEventListener("message", handleExtensionMessage);

    // Enviar PING para verificar se extensão está ativa
    const pingMessage: SyncMessage = {
      type: "PING",
      timestamp: Date.now(),
    };
    window.postMessage(pingMessage, window.location.origin);

    // Verificar conexão a cada 30s
    // Rastrear timeout para limpeza adequada
    let connectionTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const connectionCheckInterval = setInterval(() => {
      window.postMessage(pingMessage, window.location.origin);

      // Limpar timeout anterior antes de criar novo
      if (connectionTimeoutId !== null) {
        clearTimeout(connectionTimeoutId);
      }

      // Se não receber resposta em 5s, marcar como desconectado
      connectionTimeoutId = setTimeout(() => {
        setState((prev) => {
          if (prev.isConnected && !prev.isSyncing) {
            return {
              ...prev,
              isConnected: false,
            };
          }
          return prev;
        });
        connectionTimeoutId = null;
      }, 5000);
    }, 30000);

    // Cleanup
    return () => {
      window.removeEventListener("message", handleExtensionMessage);
      clearInterval(connectionCheckInterval);
      if (connectionTimeoutId !== null) {
        clearTimeout(connectionTimeoutId);
      }
      console.log("[PJE Sync] Hook desmontado");
    };
  }, [handleExtensionMessage]);

  return {
    ...state,
    forceSync,
    clearNewCounts,
    acknowledgeError,
  };
}
