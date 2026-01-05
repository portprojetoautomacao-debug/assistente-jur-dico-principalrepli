/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Testes do TodoistClient
 *
 * Testa a classe cliente que gerencia a comunicação com a API do Todoist
 *
 * NOTA: Estes testes são skipped em ambiente browser pois o TodoistApi
 * não está disponível no browser. Use /api/todoist-* endpoints no browser.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Skip all tests in browser environment
const isBrowser = globalThis.window !== undefined && globalThis.document !== undefined;

describe.skipIf(isBrowser)("TodoistClient", () => {
  // construtor carregado dinamicamente
  let TodoistClientCtor: any;
  // instância usada em cada teste
  let client: any;

  beforeAll(async () => {
    // Só roda em ambiente Node (describe.skipIf já cuida disso, mas mantemos por segurança)
    if (isBrowser) {
      return;
    }

    const module = await import("./todoist-client");
    TodoistClientCtor = module.TodoistClient;
  });

  // Mock do config
  vi.mock("./config", () => ({
    config: {
      todoist: {
        apiKey: "test-api-key",
      },
    },
  }));

  // Mock das funções da API usando vi.hoisted para estar disponível no mock da classe
  const mocks = vi.hoisted(() => ({
    addTask: vi.fn(),
    getTasks: vi.fn(),
    getProjects: vi.fn(),
    addProject: vi.fn(),
    closeTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  }));

  // Mock do TodoistApi
  vi.mock("@doist/todoist-api-typescript", () => {
    return {
      TodoistApi: class {
        addTask = mocks.addTask;
        getTasks = mocks.getTasks;
        getProjects = mocks.getProjects;
        addProject = mocks.addProject;
        closeTask = mocks.closeTask;
        updateTask = mocks.updateTask;
        deleteTask = mocks.deleteTask;
      },
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
    client = new TodoistClientCtor();
  });

  describe("Inicialização", () => {
    it("deve criar cliente quando API key está configurada", () => {
      expect(client.isConfigured()).toBe(true);
    });

    it("deve retornar a API", () => {
      const api = client.getApi();
      expect(api).toBeDefined();
    });
  });

  describe("Adicionar Tarefas", () => {
    it("deve adicionar uma tarefa simples", async () => {
      const mockTask = {
        id: "123",
        content: "Tarefa teste",
        createdAt: "2024-01-01",
      };

      mocks.addTask.mockResolvedValue(mockTask);

      const result = await client.addTask({
        content: "Tarefa teste",
      });

      expect(mocks.addTask).toHaveBeenCalledWith({
        content: "Tarefa teste",
        description: undefined,
        projectId: undefined,
        dueString: undefined,
        priority: undefined,
        labels: undefined,
      });

      expect(result).toEqual(mockTask);
    });

    it("deve adicionar tarefa com todos os parâmetros", async () => {
      const mockTask = {
        id: "123",
        content: "Tarefa completa",
        createdAt: "2024-01-01",
      };

      mocks.addTask.mockResolvedValue(mockTask);

      await client.addTask({
        content: "Tarefa completa",
        description: "Descrição detalhada",
        projectId: "project-456",
        dueString: "tomorrow",
        priority: 4,
        labels: ["urgente", "processo"],
      });

      expect(mocks.addTask).toHaveBeenCalledWith({
        content: "Tarefa completa",
        description: "Descrição detalhada",
        projectId: "project-456",
        dueString: "tomorrow",
        priority: 4,
        labels: ["urgente", "processo"],
      });
    });
  });

  describe("Listar Tarefas", () => {
    it("deve listar todas as tarefas", async () => {
      const mockTasks = [
        { id: "1", content: "Tarefa 1" },
        { id: "2", content: "Tarefa 2" },
      ];

      mocks.getTasks.mockResolvedValue(mockTasks);

      const tasks = await client.getTasks();

      expect(mocks.getTasks).toHaveBeenCalledWith({
        projectId: undefined,
        label: undefined,
        filter: undefined,
      });

      expect(tasks).toEqual(mockTasks);
    });

    it("deve listar tarefas de um projeto específico", async () => {
      const mockTasks = [{ id: "1", content: "Tarefa do projeto" }];

      mocks.getTasks.mockResolvedValue(mockTasks);

      await client.getTasks({ projectId: "project-123" });

      expect(mocks.getTasks).toHaveBeenCalledWith({
        projectId: "project-123",
        label: undefined,
        filter: undefined,
      });
    });
  });

  describe("Gerenciar Projetos", () => {
    it("deve listar projetos", async () => {
      const mockProjects = [
        { id: "1", name: "Projeto 1" },
        { id: "2", name: "Projeto 2" },
      ];

      mocks.getProjects.mockResolvedValue(mockProjects);

      const projects = await client.getProjects();

      expect(mocks.getProjects).toHaveBeenCalled();
      expect(projects).toEqual(mockProjects);
    });

    it("deve criar um projeto", async () => {
      const mockProject = {
        id: "123",
        name: "Processo 1234567-89.2024.8.09.0000",
      };

      mocks.addProject.mockResolvedValue(mockProject);

      const project = await client.createProject("Processo 1234567-89.2024.8.09.0000");

      expect(mocks.addProject).toHaveBeenCalledWith({
        name: "Processo 1234567-89.2024.8.09.0000",
        color: undefined,
      });

      expect(project).toEqual(mockProject);
    });
  });

  describe("Completar Tarefas", () => {
    it("deve marcar tarefa como concluída", async () => {
      mocks.closeTask.mockResolvedValue({ success: true });

      const result = await client.completeTask("123");

      expect(mocks.closeTask).toHaveBeenCalledWith("123");
      expect(result).toEqual({ success: true });
    });
  });

  describe("Atualizar Tarefas", () => {
    it("deve atualizar o conteúdo da tarefa", async () => {
      const mockUpdatedTask = {
        id: "123",
        content: "Tarefa atualizada",
      };

      mocks.updateTask.mockResolvedValue(mockUpdatedTask);

      const result = await client.updateTask("123", {
        content: "Tarefa atualizada",
      });

      expect(mocks.updateTask).toHaveBeenCalledWith("123", {
        content: "Tarefa atualizada",
        description: undefined,
        dueString: undefined,
        priority: undefined,
        labels: undefined,
      });

      expect(result).toEqual(mockUpdatedTask);
    });
  });

  describe("Deletar Tarefas", () => {
    it("deve deletar uma tarefa", async () => {
      mocks.deleteTask.mockResolvedValue({ success: true });

      const result = await client.deleteTask("123");

      expect(mocks.deleteTask).toHaveBeenCalledWith("123");
      expect(result).toEqual({ success: true });
    });
  });

  describe("Tratamento de Erros", () => {
    it("deve propagar erro ao adicionar tarefa", async () => {
      mocks.addTask.mockRejectedValue(new Error("API Error"));

      await expect(client.addTask({ content: "Tarefa" })).rejects.toThrow("API Error");
    });
  });
});
