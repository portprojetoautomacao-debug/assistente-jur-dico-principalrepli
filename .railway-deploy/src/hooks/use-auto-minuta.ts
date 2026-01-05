/**
 * Hook para criar minutas automaticamente quando agentes de redação completam tarefas
 *
 * Este hook monitora tarefas completadas pelo agente 'redacao-peticoes' e
 * automaticamente cria minutas no sistema com status 'pendente-revisao'
 *
 * ✨ REFATORADO: Usa minuta-service.ts centralizado
 */

import { useKV } from "@/hooks/use-kv";
import type { AgentTask } from "@/lib/agents";
import { createMinutaFromAgentTask } from "@/services/minuta-service";
import type { Minuta } from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// Tipos de documento para mapeamento
const DOCUMENT_TYPE_MAP: Record<string, Minuta["tipo"]> = {
  petição: "peticao",
  peticao: "peticao",
  "petição inicial": "peticao",
  contestação: "peticao",
  contestacao: "peticao",
  manifestação: "peticao",
  manifestacao: "peticao",
  defesa: "peticao",
  recurso: "recurso",
  apelação: "recurso",
  apelacao: "recurso",
  agravo: "recurso",
  embargos: "recurso",
  contrato: "contrato",
  acordo: "contrato",
  parecer: "parecer",
  procuração: "procuracao",
  procuracao: "procuracao",
};

function _determineMinutaTipo(documentType?: string): Minuta["tipo"] {
  if (!documentType) return "peticao";

  const type = documentType.toLowerCase().trim();

  // Busca correspondência exata primeiro
  if (DOCUMENT_TYPE_MAP[type]) return DOCUMENT_TYPE_MAP[type];

  // Busca parcial
  for (const [key, value] of Object.entries(DOCUMENT_TYPE_MAP)) {
    if (type.includes(key)) return value;
  }

  return "outro";
}

export function useAutoMinuta() {
  const [minutas, setMinutas] = useKV<Minuta[]>("minutas", []);
  const [completedTasks] = useKV<AgentTask[]>("completed-agent-tasks", []);

  // Rastrear tarefas já processadas para evitar duplicatas
  const processedTasksRef = useRef<Set<string>>(new Set());
  // Track count in state to safely return from hook
  const [processedTasksCount, setProcessedTasksCount] = useState(0);

  // Carregar tarefas já processadas do localStorage
  useEffect(() => {
    if (globalThis.window === undefined) {
      return; // Server-side rendering - não fazer nada
    }

    // Schedule to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      try {
        const stored = localStorage.getItem("processed-petition-tasks");
        if (stored) {
          const parsed = JSON.parse(stored) as string[];
          processedTasksRef.current = new Set(parsed);
          setProcessedTasksCount(parsed.length);
        }
      } catch (e) {
        console.error("[AutoMinuta] Erro ao carregar tarefas processadas:", e);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  // Monitorar tarefas completadas do agente de redação
  useEffect(() => {
    if (!completedTasks || completedTasks.length === 0) return;

    // Filtrar tarefas de redação completadas que ainda não foram processadas
    const petitionTasks = completedTasks.filter(
      (task) =>
        task.agentId === "redacao-peticoes" &&
        task.type === "DRAFT_PETITION" &&
        task.status === "completed" &&
        task.result?.data?.draft &&
        !processedTasksRef.current.has(task.id)
    );

    if (petitionTasks.length === 0) return;

    // ✅ FIX: Processar todas as tarefas em batch e atualizar estado apenas uma vez
    const newMinutas: Minuta[] = [];

    // Processar cada tarefa nova
    for (const task of petitionTasks) {
      const resultData = (task.result?.data || {}) as {
        draft?: string;
        confidence?: number;
        needsReview?: boolean;
        suggestions?: string[];
        metadata?: Record<string, unknown>;
      };

      if (!resultData.draft) continue;

      // ✅ Usar serviço centralizado para criar minuta
      let newMinuta: Minuta | null = null;

      try {
        newMinuta = createMinutaFromAgentTask(task);

        if (!newMinuta) {
          console.warn("[AutoMinuta] createMinutaFromAgentTask retornou null para task:", task.id);
          continue;
        }

        // Adicionar à lista de novas minutas
        newMinutas.push(newMinuta);

        // Marcar como processada no ref
        processedTasksRef.current.add(task.id);

        // Notificar usuário individualmente
        toast.success(`📝 Nova minuta criada pelo Agente de Redação!`, {
          description: newMinuta.titulo,
          duration: 8000,
          action: {
            label: "Ver Minutas",
            onClick: () => {
              // Navegar para minutas (se tiver router)
              globalThis.window.location.hash = "#minutas";
            },
          },
        });

        console.log("[AutoMinuta] Minuta criada automaticamente:", {
          id: newMinuta.id,
          titulo: newMinuta.titulo,
          taskId: task.id,
        });
      } catch (error) {
        console.error("[AutoMinuta] Erro ao criar minuta:", error);
        toast.error("Erro ao criar minuta automática", {
          description: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    // ✅ FIX: Atualizar estado apenas uma vez após processar todas as tarefas
    if (newMinutas.length > 0) {
      // Adicionar todas as novas minutas de uma vez
      setMinutas((current) => [...(current || []), ...newMinutas]);

      // Salvar no localStorage e atualizar contador apenas uma vez
      try {
        localStorage.setItem(
          "processed-petition-tasks",
          JSON.stringify([...processedTasksRef.current])
        );
        setProcessedTasksCount(processedTasksRef.current.size);
      } catch (e) {
        console.error("[AutoMinuta] Erro ao salvar tarefas processadas:", e);
      }

      // Disparar evento único para sincronização de contadores no CRM
      globalThis.dispatchEvent(new CustomEvent("minuta-added"));
    }
  }, [completedTasks, setMinutas]);

  // Compute stats using useMemo to avoid recalculating on each render
  const stats = useMemo(
    () => ({
      minutasTotal: minutas?.length || 0,
      minutasPendentesRevisao: minutas?.filter((m) => m.status === "pendente-revisao").length || 0,
      minutasCriadasPorAgente: minutas?.filter((m) => m.criadoPorAgente).length || 0,
      processedTasksCount,
    }),
    [minutas, processedTasksCount]
  );

  // Retornar estatísticas úteis
  return stats;
}
