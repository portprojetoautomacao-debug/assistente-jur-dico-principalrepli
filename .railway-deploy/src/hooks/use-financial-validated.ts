/**
 * Hook otimizado para gest�o financeira com valida��o Zod
 */

import { validateFinancialEntry } from "@/schemas/process.schema";
import { useCallback } from "react";
import { toast } from "sonner";
import { useKV } from "./use-kv";

// Tipo FinancialEntry (compat�vel com o sistema existente)
export interface FinancialEntry {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description?: string;
  date: string;
  processId?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export function useFinancialValidated() {
  const [entries, setEntries] = useKV<FinancialEntry[]>("financial-entries", []);

  // Adicionar lan�amento financeiro com valida��o
  const addEntry = useCallback(
    (entryData: Omit<FinancialEntry, "id" | "criadoEm" | "atualizadoEm">) => {
      const now = new Date().toISOString();
      const newEntry = {
        ...entryData,
        id: crypto.randomUUID(),
        criadoEm: now,
        atualizadoEm: now,
      };

      const validation = validateFinancialEntry(newEntry);
      if (!validation.isValid) {
        console.error("Valida��o falhou:", validation.errors);
        toast.error("Dados do lan�amento inv�lidos. Verifique os campos obrigat�rios.");
        return null;
      }

      setEntries((prev) => [...prev, validation.data as FinancialEntry]);
      toast.success("Lan�amento adicionado com sucesso!");
      return validation.data as FinancialEntry;
    },
    [setEntries]
  );

  // Atualizar lan�amento com valida��o
  const updateEntry = useCallback(
    (id: string, updates: Partial<FinancialEntry>) => {
      let updated: FinancialEntry | null = null;

      setEntries((prev) =>
        prev.map((e) => {
          if (e.id === id) {
            const updatedEntry = {
              ...e,
              ...updates,
              atualizadoEm: new Date().toISOString(),
            };

            const validation = validateFinancialEntry(updatedEntry);
            if (!validation.isValid) {
              console.error("Valida��o falhou:", validation.errors);
              toast.error("Dados inv�lidos. Atualiza��o cancelada.");
              return e;
            }

            updated = validation.data as FinancialEntry;
            toast.success("Lan�amento atualizado!");
            return updated;
          }
          return e;
        })
      );

      return updated;
    },
    [setEntries]
  );

  // Remover lan�amento
  const deleteEntry = useCallback(
    (id: string) => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Lan�amento removido!");
    },
    [setEntries]
  );

  // Buscar lan�amento por ID
  const getEntryById = useCallback(
    (id: string) => {
      return entries.find((e) => e.id === id);
    },
    [entries]
  );

  // Buscar lan�amentos por tipo
  const getEntriesByType = useCallback(
    (type: "income" | "expense") => {
      return entries.filter((e) => e.type === type);
    },
    [entries]
  );

  // Buscar lan�amentos por processo
  const getEntriesByProcessId = useCallback(
    (processId: string) => {
      return entries.filter((e) => e.processId === processId);
    },
    [entries]
  );

  // Buscar lan�amentos por categoria
  const getEntriesByCategory = useCallback(
    (category: string) => {
      return entries.filter((e) => e.category === category);
    },
    [entries]
  );

  // Buscar lan�amentos por per�odo
  const getEntriesByPeriod = useCallback(
    (startDate: string, endDate: string) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return entries.filter((e) => {
        const entryDate = new Date(e.date);
        return entryDate >= start && entryDate <= end;
      });
    },
    [entries]
  );

  // Calcular total de receitas
  const getTotalIncome = useCallback(
    (startDate?: string, endDate?: string) => {
      let filtered = entries.filter((e) => e.type === "income");

      if (startDate && endDate) {
        filtered = filtered.filter((e) => {
          const entryDate = new Date(e.date);
          return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
        });
      }

      return filtered.reduce((sum, e) => sum + e.amount, 0);
    },
    [entries]
  );

  // Calcular total de despesas
  const getTotalExpense = useCallback(
    (startDate?: string, endDate?: string) => {
      let filtered = entries.filter((e) => e.type === "expense");

      if (startDate && endDate) {
        filtered = filtered.filter((e) => {
          const entryDate = new Date(e.date);
          return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
        });
      }

      return filtered.reduce((sum, e) => sum + e.amount, 0);
    },
    [entries]
  );

  // Calcular saldo (receitas - despesas)
  const getBalance = useCallback(
    (startDate?: string, endDate?: string) => {
      const income = getTotalIncome(startDate, endDate);
      const expense = getTotalExpense(startDate, endDate);
      return income - expense;
    },
    [getTotalIncome, getTotalExpense]
  );

  // Obter categorias �nicas
  const getUniqueCategories = useCallback(() => {
    const categories = entries.map((e) => e.category);
    return Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [entries]);

  // Resumo financeiro por categoria
  const getSummaryByCategory = useCallback(() => {
    const summary = new Map<string, { income: number; expense: number }>();

    entries.forEach((e) => {
      const current = summary.get(e.category) || { income: 0, expense: 0 };
      if (e.type === "income") {
        current.income += e.amount;
      } else {
        current.expense += e.amount;
      }
      summary.set(e.category, current);
    });

    return Array.from(summary.entries()).map(([category, totals]) => ({
      category,
      income: totals.income,
      expense: totals.expense,
      balance: totals.income - totals.expense,
    }));
  }, [entries]);

  return {
    entries,
    setEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntryById,
    getEntriesByType,
    getEntriesByProcessId,
    getEntriesByCategory,
    getEntriesByPeriod,
    getTotalIncome,
    getTotalExpense,
    getBalance,
    getUniqueCategories,
    getSummaryByCategory,
  };
}
