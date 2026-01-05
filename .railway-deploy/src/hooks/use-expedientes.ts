import { normalizeProcessNumber } from "@/lib/process-number-utils";
import type { Expediente, Process } from "@/types";
import { useKV } from "./use-kv";

/**
 * Hook para gerenciar expedientes (intimações, publicações, etc.)
 * Inclui auto-vinculação ao processo e disparo de eventos de sincronização
 */
export function useExpedientes() {
  const [expedientes, setExpedientes] = useKV<Expediente[]>("expedientes", []);
  const [processes] = useKV<Process[]>("processes", []);

  /**
   * Tenta vincular automaticamente o expediente a um processo existente
   */
  const autoLinkToProcess = (expediente: Expediente): Expediente => {
    // Se já tem processId, retorna sem alteração
    if (expediente.processId) return expediente;

    // Buscar processo pelo número CNJ
    if (expediente.numeroProcesso) {
      const normalizedNum = normalizeProcessNumber(expediente.numeroProcesso);
      const processo = (processes || []).find(
        (p) => normalizeProcessNumber(p.numeroCNJ) === normalizedNum
      );
      if (processo) {
        return { ...expediente, processId: processo.id };
      }
    }

    return expediente;
  };

  /**
   * Dispara evento para sincronização dos contadores do processo
   */
  const triggerProcessSync = () => {
    globalThis.dispatchEvent(new CustomEvent("expediente-added"));
  };

  const addExpediente = (expediente: Expediente) => {
    // Auto-vincular ao processo antes de salvar
    const linkedExpediente = autoLinkToProcess(expediente);
    setExpedientes([...expedientes, linkedExpediente]);
    // Disparar sincronização dos contadores
    triggerProcessSync();
  };

  const addExpedientes = (novosExpedientes: Expediente[]) => {
    // Auto-vincular todos os expedientes
    const linkedExpedientes = novosExpedientes.map(autoLinkToProcess);
    setExpedientes([...expedientes, ...linkedExpedientes]);
    // Disparar sincronização dos contadores
    triggerProcessSync();
  };

  const updateExpediente = (id: string, updates: Partial<Expediente>) => {
    setExpedientes(
      expedientes.map((exp: Expediente) => (exp.id === id ? { ...exp, ...updates } : exp))
    );
    triggerProcessSync();
  };

  const deleteExpediente = (id: string) => {
    setExpedientes(expedientes.filter((exp: Expediente) => exp.id !== id));
    triggerProcessSync();
  };

  const getExpedienteById = (id: string) => {
    return expedientes.find((exp: Expediente) => exp.id === id);
  };

  /**
   * Obtém expedientes vinculados a um processo específico
   */
  const getExpedientesByProcessId = (processId: string) => {
    const processo = (processes || []).find((p) => p.id === processId);
    if (!processo) return [];

    return expedientes.filter(
      (exp) =>
        exp.processId === processId ||
        normalizeProcessNumber(exp.numeroProcesso) === normalizeProcessNumber(processo.numeroCNJ)
    );
  };

  const expedientesNaoLidos = expedientes.filter((exp: Expediente) => !exp.lido);

  return {
    expedientes,
    expedientesNaoLidos,
    addExpediente,
    addExpedientes,
    updateExpediente,
    deleteExpediente,
    getExpedienteById,
    getExpedientesByProcessId,
  };
}
