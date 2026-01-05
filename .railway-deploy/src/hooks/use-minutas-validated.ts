/**
 * Hook otimizado para gestão de minutas com validação Zod
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { useKV } from "./use-kv";
import { validateMinuta, type MinutaValidated as _MinutaValidated } from "@/schemas/process.schema";

// Tipo Minuta (compatível com o sistema existente)
export interface Minuta {
  id: string;
  titulo: string;
  processId?: string;
  tipo: "peticao" | "contrato" | "parecer" | "recurso" | "procuracao" | "outro";
  conteudo: string;
  status: "rascunho" | "em-revisao" | "pendente-revisao" | "finalizada" | "arquivada";
  criadoEm: string;
  atualizadoEm: string;
  autor: string;
  googleDocsId?: string;
  googleDocsUrl?: string;
  criadoPorAgente?: boolean;
  agenteId?: string;
  templateId?: string;
  expedienteId?: string;
  variaveis?: Record<string, string>;
}

export function useMinutasValidated() {
  const [minutas, setMinutas] = useKV<Minuta[]>("minutas", []);

  // Adicionar minuta com validação
  const addMinuta = useCallback(
    (minutaData: Omit<Minuta, "id" | "criadoEm" | "atualizadoEm">) => {
      const now = new Date().toISOString();
      const newMinuta = {
        ...minutaData,
        id: crypto.randomUUID(),
        criadoEm: now,
        atualizadoEm: now,
      };

      const validation = validateMinuta(newMinuta);
      if (!validation.isValid) {
        console.error("Validação falhou:", validation.errors);
        toast.error("Dados da minuta inválidos. Verifique os campos obrigatórios.");
        return null;
      }

      setMinutas((prev) => [...prev, validation.data as Minuta]);
      toast.success("Minuta criada com sucesso!");
      return validation.data as Minuta;
    },
    [setMinutas]
  );

  // Atualizar minuta com validação
  const updateMinuta = useCallback(
    (id: string, updates: Partial<Minuta>) => {
      let updated: Minuta | null = null;

      setMinutas((prev) =>
        prev.map((m) => {
          if (m.id === id) {
            const updatedMinuta = {
              ...m,
              ...updates,
              atualizadoEm: new Date().toISOString(),
            };

            const validation = validateMinuta(updatedMinuta);
            if (!validation.isValid) {
              console.error("Validação falhou:", validation.errors);
              toast.error("Dados inválidos. Atualização cancelada.");
              return m;
            }

            updated = validation.data as Minuta;
            toast.success("Minuta atualizada!");
            return updated;
          }
          return m;
        })
      );

      return updated;
    },
    [setMinutas]
  );

  // Remover minuta
  const deleteMinuta = useCallback(
    (id: string) => {
      setMinutas((prev) => prev.filter((m) => m.id !== id));
      toast.success("Minuta removida!");
    },
    [setMinutas]
  );

  // Buscar minuta por ID
  const getMinutaById = useCallback(
    (id: string) => {
      return minutas.find((m) => m.id === id);
    },
    [minutas]
  );

  // Buscar minutas por processo
  const getMinutasByProcessId = useCallback(
    (processId: string) => {
      return minutas.filter((m) => m.processId === processId);
    },
    [minutas]
  );

  // Buscar minutas por status
  const getMinutasByStatus = useCallback(
    (status: Minuta["status"]) => {
      return minutas.filter((m) => m.status === status);
    },
    [minutas]
  );

  // Minutas pendentes de revisão
  const getMinutasPendentesRevisao = useCallback(() => {
    return minutas.filter((m) => m.status === "pendente-revisao");
  }, [minutas]);

  // Minutas criadas por agentes IA
  const getMinutasCriadasPorAgente = useCallback(() => {
    return minutas.filter((m) => m.criadoPorAgente === true);
  }, [minutas]);

  // Buscar minutas por tipo
  const getMinutasByTipo = useCallback(
    (tipo: Minuta["tipo"]) => {
      return minutas.filter((m) => m.tipo === tipo);
    },
    [minutas]
  );

  // Atualizar status da minuta (workflow)
  const updateMinutaStatus = useCallback(
    (id: string, status: Minuta["status"]) => {
      return updateMinuta(id, { status });
    },
    [updateMinuta]
  );

  return {
    minutas,
    setMinutas,
    addMinuta,
    updateMinuta,
    deleteMinuta,
    getMinutaById,
    getMinutasByProcessId,
    getMinutasByStatus,
    getMinutasPendentesRevisao,
    getMinutasCriadasPorAgente,
    getMinutasByTipo,
    updateMinutaStatus,
  };
}
