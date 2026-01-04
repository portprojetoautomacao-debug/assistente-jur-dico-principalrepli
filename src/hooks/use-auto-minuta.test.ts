/**
 * Testes para useAutoMinuta hook
 * Valida o processamento em batch de múltiplas tarefas
 */

import type { AgentTask } from "@/lib/agents";
import * as minutaServiceModule from "@/services/minuta-service";
import type { Minuta } from "@/types/minuta";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoMinuta } from "./use-auto-minuta";
import * as kvModule from "./use-kv";

// Mock dependencies
vi.mock("./use-kv");
vi.mock("@/services/minuta-service");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useAutoMinuta", () => {
  const mockMinutas: Minuta[] = [];
  const mockSetMinutas = vi.fn();
  const mockCompletedTasks: AgentTask[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    mockMinutas.length = 0;
    mockCompletedTasks.length = 0;

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock as unknown as Storage;

    // Mock useKV
    vi.spyOn(kvModule, "useKV").mockImplementation((key: string, defaultValue: unknown) => {
      if (key === "minutas") {
        return [mockMinutas, mockSetMinutas] as [unknown, typeof mockSetMinutas];
      }
      if (key === "completed-agent-tasks") {
        return [mockCompletedTasks, vi.fn()] as [unknown, typeof vi.fn];
      }
      return [defaultValue, vi.fn()] as [unknown, typeof vi.fn];
    });

    // Mock createMinutaFromAgentTask
    vi.spyOn(minutaServiceModule, "createMinutaFromAgentTask").mockImplementation((task) => ({
      id: `minuta-${task.id}`,
      titulo: `Minuta da tarefa ${task.id}`,
      conteudo: "Conteúdo da minuta",
      tipo: "peticao",
      status: "rascunho",
      criadoPorAgente: true,
      taskId: task.id,
      createdAt: new Date().toISOString(),
    }));
  });

  describe("Processamento em Batch", () => {
    it("deve processar múltiplas tarefas completadas em batch", async () => {
      // Criar 3 tarefas completadas
      const tasks: AgentTask[] = [
        {
          id: "task-1",
          agentId: "redacao-peticoes",
          type: "DRAFT_PETITION",
          status: "completed",
          priority: "medium",
          createdAt: new Date().toISOString(),
          result: {
            success: true,
            message: "Petição criada",
            data: { draft: "Conteúdo da petição 1" },
          },
          data: {},
        },
        {
          id: "task-2",
          agentId: "redacao-peticoes",
          type: "DRAFT_PETITION",
          status: "completed",
          priority: "medium",
          createdAt: new Date().toISOString(),
          result: {
            success: true,
            message: "Petição criada",
            data: { draft: "Conteúdo da petição 2" },
          },
          data: {},
        },
        {
          id: "task-3",
          agentId: "redacao-peticoes",
          type: "DRAFT_PETITION",
          status: "completed",
          priority: "medium",
          createdAt: new Date().toISOString(),
          result: {
            success: true,
            message: "Petição criada",
            data: { draft: "Conteúdo da petição 3" },
          },
          data: {},
        },
      ];

      // Atualizar mock com as tarefas
      mockCompletedTasks.push(...tasks);

      // Renderizar hook
      const { rerender } = renderHook(() => useAutoMinuta());

      // Forçar re-render para triggar useEffect
      rerender();

      // Aguardar processamento
      await waitFor(() => {
        expect(mockSetMinutas).toHaveBeenCalled();
      });

      // Verificar que setMinutas foi chamado apenas UMA vez com TODAS as 3 minutas
      expect(mockSetMinutas).toHaveBeenCalledTimes(1);

      // Verificar que a função foi chamada com callback que adiciona as 3 minutas
      const setMinutasCallback = mockSetMinutas.mock.calls[0][0];
      const updatedMinutas = setMinutasCallback([]);

      expect(updatedMinutas).toHaveLength(3);
      expect(updatedMinutas[0].id).toBe("minuta-task-1");
      expect(updatedMinutas[1].id).toBe("minuta-task-2");
      expect(updatedMinutas[2].id).toBe("minuta-task-3");

      // Verificar que localStorage foi atualizado apenas uma vez
      expect(localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "processed-petition-tasks",
        expect.stringContaining("task-1")
      );
    });

    it("deve atualizar processedTasksCount apenas uma vez", async () => {
      const tasks: AgentTask[] = [
        {
          id: "task-1",
          agentId: "redacao-peticoes",
          type: "DRAFT_PETITION",
          status: "completed",
          priority: "medium",
          createdAt: new Date().toISOString(),
          result: {
            success: true,
            message: "Petição criada",
            data: { draft: "Conteúdo 1" },
          },
          data: {},
        },
        {
          id: "task-2",
          agentId: "redacao-peticoes",
          type: "DRAFT_PETITION",
          status: "completed",
          priority: "medium",
          createdAt: new Date().toISOString(),
          result: {
            success: true,
            message: "Petição criada",
            data: { draft: "Conteúdo 2" },
          },
          data: {},
        },
      ];

      mockCompletedTasks.push(...tasks);

      const { result, rerender } = renderHook(() => useAutoMinuta());
      rerender();

      await waitFor(() => {
        expect(mockSetMinutas).toHaveBeenCalled();
      });

      // Verificar que stats reflete o count correto
      expect(result.current.processedTasksCount).toBe(2);
    });
  });

  describe("Tratamento de Erros", () => {
    it("deve continuar processando outras tarefas mesmo se uma falhar", async () => {
      // Mock para falhar na segunda tarefa
      vi.spyOn(minutaServiceModule, "createMinutaFromAgentTask").mockImplementation((task) => {
        if (task.id === "task-fail") {
          throw new Error("Erro simulado");
        }
        return {
          id: `minuta-${task.id}`,
          titulo: `Minuta da tarefa ${task.id}`,
          conteudo: "Conteúdo",
          tipo: "peticao",
          status: "rascunho",
          criadoPorAgente: true,
          taskId: task.id,
          createdAt: new Date().toISOString(),
        };
      });

      const tasks: AgentTask[] = [
        {
          id: "task-1",
          agentId: "redacao-peticoes",
          type: "DRAFT_PETITION",
          status: "completed",
          priority: "medium",
          createdAt: new Date().toISOString(),
          result: {
            success: true,
            message: "OK",
            data: { draft: "Conteúdo 1" },
          },
          data: {},
        },
        {
          id: "task-fail",
          agentId: "redacao-peticoes",
          type: "DRAFT_PETITION",
          status: "completed",
          priority: "medium",
          createdAt: new Date().toISOString(),
          result: {
            success: true,
            message: "OK",
            data: { draft: "Conteúdo fail" },
          },
          data: {},
        },
        {
          id: "task-3",
          agentId: "redacao-peticoes",
          type: "DRAFT_PETITION",
          status: "completed",
          priority: "medium",
          createdAt: new Date().toISOString(),
          result: {
            success: true,
            message: "OK",
            data: { draft: "Conteúdo 3" },
          },
          data: {},
        },
      ];

      mockCompletedTasks.push(...tasks);

      const { rerender } = renderHook(() => useAutoMinuta());
      rerender();

      await waitFor(() => {
        expect(mockSetMinutas).toHaveBeenCalled();
      });

      // Verificar que 2 minutas foram criadas (task-1 e task-3)
      const setMinutasCallback = mockSetMinutas.mock.calls[0][0];
      const updatedMinutas = setMinutasCallback([]);

      expect(updatedMinutas).toHaveLength(2);
      expect(updatedMinutas[0].id).toBe("minuta-task-1");
      expect(updatedMinutas[1].id).toBe("minuta-task-3");
    });

    it("não deve atualizar estado se nenhuma minuta for criada", async () => {
      // Tarefas sem draft
      const tasks: AgentTask[] = [
        {
          id: "task-no-draft",
          agentId: "redacao-peticoes",
          type: "DRAFT_PETITION",
          status: "completed",
          priority: "medium",
          createdAt: new Date().toISOString(),
          result: {
            success: true,
            message: "OK",
            data: {}, // Sem draft
          },
          data: {},
        },
      ];

      mockCompletedTasks.push(...tasks);

      const { rerender } = renderHook(() => useAutoMinuta());
      rerender();

      // Aguardar um pouco para garantir que o useEffect rodou
      await new Promise((resolve) => setTimeout(resolve, 100));

      // setMinutas não deve ter sido chamado
      expect(mockSetMinutas).not.toHaveBeenCalled();
    });
  });

  describe("Estatísticas", () => {
    it("deve retornar estatísticas corretas", () => {
      const minutasWithStats: Minuta[] = [
        {
          id: "1",
          titulo: "Minuta 1",
          conteudo: "Conteúdo",
          tipo: "peticao",
          status: "pendente-revisao",
          criadoPorAgente: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          titulo: "Minuta 2",
          conteudo: "Conteúdo",
          tipo: "peticao",
          status: "aprovada",
          criadoPorAgente: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          titulo: "Minuta 3",
          conteudo: "Conteúdo",
          tipo: "peticao",
          status: "rascunho",
          criadoPorAgente: false,
          createdAt: new Date().toISOString(),
        },
      ];

      mockMinutas.push(...minutasWithStats);

      const { result } = renderHook(() => useAutoMinuta());

      expect(result.current.minutasTotal).toBe(3);
      expect(result.current.minutasPendentesRevisao).toBe(1);
      expect(result.current.minutasCriadasPorAgente).toBe(2);
    });
  });
});
