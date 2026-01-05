import { TodoistApi } from "@doist/todoist-api-typescript";
import { config } from "./config";

/**
 * Cliente Todoist para integração com o assistente jurídico
 * Permite gerenciar tarefas jurídicas, prazos e compromissos
 */
export class TodoistClient {
  private readonly api: TodoistApi | null = null;

  constructor() {
    const apiKey = config.todoist?.apiKey;
    if (apiKey) {
      this.api = new TodoistApi(apiKey);
    }
  }

  /**
   * Verifica se o cliente está configurado
   */
  isConfigured(): boolean {
    return this.api !== null;
  }

  /**
   * Obtém a instância bruta da API do Todoist
   */
  getApi(): TodoistApi | null {
    return this.api;
  }

  /**
   * Adiciona uma tarefa jurídica
   */
  async addTask(params: {
    content: string;
    description?: string;
    projectId?: string;
    dueString?: string;
    priority?: number;
    labels?: string[];
  }) {
    if (!this.api) {
      throw new Error(
        "Todoist API não está configurada. Configure VITE_TODOIST_API_KEY no arquivo .env"
      );
    }

    return await this.api.addTask({
      content: params.content,
      description: params.description,
      projectId: params.projectId,
      dueString: params.dueString,
      priority: params.priority,
      labels: params.labels,
    });
  }

  /**
   * Lista tarefas
   * - Se `filter` for fornecido, ele é passado diretamente para a API
   * - Caso contrário, filtra por `projectId` e/ou `label`
   */
  async getTasks(params?: { projectId?: string; label?: string; filter?: string }) {
    if (!this.api) {
      throw new Error(
        "Todoist API não está configurada. Configure VITE_TODOIST_API_KEY no arquivo .env"
      );
    }

    return await this.api.getTasks({
      projectId: params?.projectId,
      label: params?.label,
      filter: params?.filter,
    } as {
      projectId?: string;
      label?: string;
      filter?: string;
    });
  }

  /**
   * Obtém projetos
   */
  async getProjects() {
    if (!this.api) {
      throw new Error(
        "Todoist API não está configurada. Configure VITE_TODOIST_API_KEY no arquivo .env"
      );
    }

    return await this.api.getProjects();
  }

  /**
   * Cria um projeto para um processo jurídico
   */
  async createProject(name: string, color?: string) {
    if (!this.api) {
      throw new Error(
        "Todoist API não está configurada. Configure VITE_TODOIST_API_KEY no arquivo .env"
      );
    }

    return await this.api.addProject({
      name,
      color,
    });
  }

  /**
   * Marca uma tarefa como concluída
   */
  async completeTask(taskId: string) {
    if (!this.api) {
      throw new Error(
        "Todoist API não está configurada. Configure VITE_TODOIST_API_KEY no arquivo .env"
      );
    }

    return await this.api.closeTask(taskId);
  }

  /**
   * Atualiza uma tarefa
   */
  async updateTask(
    taskId: string,
    params: {
      content?: string;
      description?: string;
      dueString?: string;
      priority?: number;
      labels?: string[];
    }
  ) {
    if (!this.api) {
      throw new Error(
        "Todoist API não está configurada. Configure VITE_TODOIST_API_KEY no arquivo .env"
      );
    }

    return await this.api.updateTask(taskId, {
      content: params.content,
      description: params.description,
      dueString: params.dueString,
      priority: params.priority,
      labels: params.labels,
    });
  }

  /**
   * Deleta uma tarefa
   */
  async deleteTask(taskId: string) {
    if (!this.api) {
      throw new Error(
        "Todoist API não está configurada. Configure VITE_TODOIST_API_KEY no arquivo .env"
      );
    }

    return await this.api.deleteTask(taskId);
  }
}

// Instância singleton
export const todoistClient = new TodoistClient();
