import { useEffect, useState } from "react";
import type { Task, Project } from "@/lib/todoist-stub";

// API client que chama endpoints serverless ao invés de usar Todoist diretamente
async function apiCall<T>(action: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/todoist?action=${action}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Erro na requisição");
  }

  return data;
}

export function useTodoist() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se Todoist está configurado
    apiCall<{ configured: boolean }>("checkConfig")
      .then((data) => setIsConfigured(data.configured))
      .catch(() => setIsConfigured(false));
  }, []);

  const loadTasks = async (params?: { projectId?: string; label?: string; filter?: string }) => {
    if (!isConfigured) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await apiCall<{ tasks: Task[] }>("getTasks", params);
      setTasks(data.tasks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar tarefas";
      setError(errorMessage);
      console.error("Erro ao carregar tarefas do Todoist:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = async () => {
    if (!isConfigured) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await apiCall<{ projects: Project[] }>("getProjects");
      setProjects(data.projects);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar projetos";
      setError(errorMessage);
      console.error("Erro ao carregar projetos do Todoist:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async (params: {
    content: string;
    description?: string;
    projectId?: string;
    dueString?: string;
    priority?: number;
    labels?: string[];
  }) => {
    if (!isConfigured) {
      throw new Error("Todoist não está configurado");
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await apiCall<{ task: Task }>("addTask", params);
      setTasks((prev) => [...prev, data.task]);
      return data.task;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar tarefa";
      setError(errorMessage);
      console.error("Erro ao adicionar tarefa no Todoist:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (name: string, color?: string) => {
    if (!isConfigured) {
      throw new Error("Todoist não está configurado");
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await apiCall<{ project: Project }>("createProject", { name, color });
      setProjects((prev) => [...prev, data.project]);
      return data.project;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar projeto";
      setError(errorMessage);
      console.error("Erro ao criar projeto no Todoist:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const completeTask = async (taskId: string) => {
    if (!isConfigured) {
      throw new Error("Todoist não está configurado");
    }

    setIsLoading(true);
    setError(null);
    try {
      await apiCall("closeTask", { id: taskId });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao completar tarefa";
      setError(errorMessage);
      console.error("Erro ao completar tarefa no Todoist:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (
    taskId: string,
    params: {
      content?: string;
      description?: string;
      dueString?: string;
      priority?: number;
      labels?: string[];
    }
  ) => {
    if (!isConfigured) {
      throw new Error("Todoist não está configurado");
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await apiCall<{ task: Task }>("updateTask", { id: taskId, ...params });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
      return data.task;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar tarefa";
      setError(errorMessage);
      console.error("Erro ao atualizar tarefa no Todoist:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!isConfigured) {
      throw new Error("Todoist não está configurado");
    }

    setIsLoading(true);
    setError(null);
    try {
      await apiCall("deleteTask", { id: taskId });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao deletar tarefa";
      setError(errorMessage);
      console.error("Erro ao deletar tarefa no Todoist:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConfigured,
    tasks,
    projects,
    isLoading,
    error,
    loadTasks,
    loadProjects,
    addTask,
    createProject,
    completeTask,
    updateTask,
    deleteTask,
  };
}
