/**
 * Hook otimizado para gest�o de expedientes com valida��o Zod
 *
 * Migrado de use-expedientes.ts para adicionar valida��o completa
 * e garantir integridade dos dados.
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { useKV } from "./use-kv";
import { validateExpediente } from "@/schemas/expediente.schema";
import { normalizeProcessNumber } from "@/lib/process-number-utils";
import type { Process, Expediente } from "@/types";

export function useExpedientesValidated() {
  const [expedientes, setExpedientes] = useKV<Expediente[]>("expedientes", []);
  const [processes] = useKV<Process[]>("processes", []);

  /**
   * Tenta vincular automaticamente o expediente a um processo existente
   */
  const autoLinkToProcess = useCallback(
    (expediente: Expediente): Expediente => {
      // Se j� tem processId, retorna sem altera��o
      if (expediente.processId) return expediente;

      // Buscar processo pelo n�mero CNJ
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
    },
    [processes]
  );

  /**
   * Dispara evento para sincroniza��o dos contadores do processo
   */
  const triggerProcessSync = useCallback(() => {
    globalThis.dispatchEvent(new CustomEvent("expediente-added"));
  }, []);

  /**
   * Adicionar expediente com valida��o
   */
  const addExpediente = useCallback(
    (expedienteData: Omit<Expediente, "id" | "createdAt">) => {
      const now = new Date().toISOString();
      const newExpediente = {
        ...expedienteData,
        id: crypto.randomUUID(),
        createdAt: now,
      };

      const validation = validateExpediente(newExpediente);

      if (!validation.isValid) {
        console.error("Valida��o falhou:", validation.errors);
        toast.error("Dados do expediente inv�lidos. Verifique os campos obrigat�rios.");
        return null;
      }

      // Auto-vincular ao processo antes de salvar
      const linkedExpediente = autoLinkToProcess(validation.data as Expediente);

      setExpedientes((prev) => [...prev, linkedExpediente]);
      toast.success("Expediente criado com sucesso!");

      // Disparar sincroniza��o dos contadores
      triggerProcessSync();

      return linkedExpediente;
    },
    [setExpedientes, autoLinkToProcess, triggerProcessSync]
  );

  /**
   * Adicionar m�ltiplos expedientes com valida��o
   */
  const addExpedientes = useCallback(
    (novosExpedientes: Omit<Expediente, "id" | "createdAt">[]) => {
      const now = new Date().toISOString();
      const validados: Expediente[] = [];
      const erros: string[] = [];

      for (const exp of novosExpedientes) {
        const newExpediente = {
          ...exp,
          id: crypto.randomUUID(),
          createdAt: now,
        };

        const validation = validateExpediente(newExpediente);

        if (validation.isValid) {
          const linked = autoLinkToProcess(validation.data as Expediente);
          validados.push(linked);
        } else {
          erros.push(`Expediente inv�lido: ${JSON.stringify(validation.errors)}`);
        }
      }

      if (validados.length > 0) {
        setExpedientes((prev) => [...prev, ...validados]);
        toast.success(`${validados.length} expediente(s) adicionado(s)!`);
        triggerProcessSync();
      }

      if (erros.length > 0) {
        console.error("Erros ao adicionar expedientes:", erros);
        toast.error(`${erros.length} expediente(s) com erro de valida��o.`);
      }

      return { validados, erros };
    },
    [setExpedientes, autoLinkToProcess, triggerProcessSync]
  );

  /**
   * Atualizar expediente com valida��o
   */
  const updateExpediente = useCallback(
    (id: string, updates: Partial<Expediente>) => {
      let updated: Expediente | null = null;

      setExpedientes((prev) =>
        prev.map((exp) => {
          if (exp.id === id) {
            const updatedExpediente = {
              ...exp,
              ...updates,
            };

            const validation = validateExpediente(updatedExpediente);

            if (!validation.isValid) {
              console.error("Valida��o falhou:", validation.errors);
              toast.error("Dados inv�lidos. Atualiza��o cancelada.");
              return exp;
            }

            updated = validation.data as Expediente;
            toast.success("Expediente atualizado!");
            triggerProcessSync();

            return updated;
          }
          return exp;
        })
      );

      return updated;
    },
    [setExpedientes, triggerProcessSync]
  );

  /**
   * Remover expediente
   */
  const deleteExpediente = useCallback(
    (id: string) => {
      setExpedientes((prev) => prev.filter((exp) => exp.id !== id));
      toast.success("Expediente removido!");
      triggerProcessSync();
    },
    [setExpedientes, triggerProcessSync]
  );

  /**
   * Buscar expediente por ID
   */
  const getExpedienteById = useCallback(
    (id: string) => {
      return expedientes.find((exp) => exp.id === id);
    },
    [expedientes]
  );

  /**
   * Obt�m expedientes vinculados a um processo espec�fico
   */
  const getExpedientesByProcessId = useCallback(
    (processId: string) => {
      const processo = (processes || []).find((p) => p.id === processId);
      if (!processo) return [];

      return expedientes.filter(
        (exp) =>
          exp.processId === processId ||
          normalizeProcessNumber(exp.numeroProcesso) === normalizeProcessNumber(processo.numeroCNJ)
      );
    },
    [expedientes, processes]
  );

  /**
   * Buscar expedientes n�o lidos
   */
  const expedientesNaoLidos = useCallback(() => {
    return expedientes.filter((exp) => !exp.lido);
  }, [expedientes]);

  /**
   * Buscar expedientes por status
   */
  const getExpedientesByStatus = useCallback(
    (status: Expediente["status"]) => {
      return expedientes.filter((exp) => exp.status === status);
    },
    [expedientes]
  );

  /**
   * Buscar expedientes por prioridade
   */
  const getExpedientesByPrioridade = useCallback(
    (prioridade: Expediente["prioridade"]) => {
      return expedientes.filter((exp) => exp.prioridade === prioridade);
    },
    [expedientes]
  );

  /**
   * Buscar expedientes urgentes (prazos pr�ximos)
   */
  const getExpedientesUrgentes = useCallback(() => {
    return expedientes.filter((exp) => {
      if (!exp.prazo) return false;
      const dataFinal = new Date(exp.prazo.dataFinal);
      const hoje = new Date();
      const diffDias = Math.ceil((dataFinal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return diffDias <= 3 && diffDias >= 0;
    });
  }, [expedientes]);

  return {
    expedientes: expedientes || [],
    setExpedientes,
    addExpediente,
    addExpedientes,
    updateExpediente,
    deleteExpediente,
    getExpedienteById,
    getExpedientesByProcessId,
    expedientesNaoLidos,
    getExpedientesByStatus,
    getExpedientesByPrioridade,
    getExpedientesUrgentes,
  };
}
