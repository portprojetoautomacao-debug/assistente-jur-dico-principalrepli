import { useKV } from "@/hooks/use-kv";
import type { Process } from "@/types";

export function useProcesses() {
  const [processes, setProcesses] = useKV<Process[]>("processes", []);

  const addProcess = (process: Process) => {
    setProcesses((current) => [...(current || []), process]);
  };

  const updateProcess = (processId: string, updates: Partial<Process>) => {
    setProcesses((current) =>
      (current || []).map((p) =>
        p.id === processId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      )
    );
  };

  const deleteProcess = (processId: string) => {
    setProcesses((current) => (current || []).filter((p) => p.id !== processId));
  };

  const getProcessById = (processId: string) => {
    return (processes || []).find((p) => p.id === processId);
  };

  const getActiveProcesses = () => {
    return (processes || []).filter((p) => p.status === "ativo");
  };

  const getProcessesByStatus = (status: Process["status"]) => {
    return (processes || []).filter((p) => p.status === status);
  };

  return {
    processes: processes || [],
    addProcess,
    updateProcess,
    deleteProcess,
    getProcessById,
    getActiveProcesses,
    getProcessesByStatus,
  };
}
