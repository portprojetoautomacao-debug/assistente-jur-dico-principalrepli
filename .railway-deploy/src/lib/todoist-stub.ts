/**
 * Todoist API Stub for Browser
 *
 * This is a browser-safe stub for @doist/todoist-api-typescript
 * The real API is only available server-side (in /api functions)
 *
 * Client-side code should use API routes instead of direct Todoist calls
 */

export function getTaskUrl(taskId: string): string {
  return `https://todoist.com/app/task/${taskId}`;
}

export function getProjectUrl(projectId: string): string {
  return `https://todoist.com/app/project/${projectId}`;
}

/**
 * Compat type para código antigo — agora é só um alias de Task[]
 * (no SDK oficial, getTasks retorna Task[])
 */
export type GetTasksResponse = Task[];

/**
 * Throws browser-not-supported error for all Todoist API methods
 */
function throwBrowserError(): never {
  throw new Error(
    "TodoistApi não está disponível no browser. Use os endpoints /api/todoist-* em vez de chamar o SDK direto."
  );
}

export class TodoistApi {
  constructor(_apiKey: string) {
    console.warn(
      "[Todoist Stub] TodoistApi deve ser usado apenas no server. No client, use endpoints /api/todoist-*."
    );
  }

  /**
   * SDK oficial: getTasks({ projectId?, label?, filter? }): Promise<Task[]>
   */
  async getTasks(_args?: { projectId?: string; label?: string; filter?: string }): Promise<Task[]> {
    throwBrowserError();
  }

  /**
   * Método auxiliar para compatibilidade — não existe no SDK oficial,
   * mas alguns wrappers podem usar getTasksByFilter.
   */
  async getTasksByFilter(_args?: {
    query?: string;
    cursor?: string;
    limit?: number;
  }): Promise<Task[]> {
    throwBrowserError();
  }

  async getProjects(): Promise<Project[]> {
    throwBrowserError();
  }

  async addTask(_args: {
    content: string;
    description?: string;
    projectId?: string;
    dueString?: string;
    priority?: number;
    labels?: string[];
  }): Promise<Task> {
    throwBrowserError();
  }

  async updateTask(
    _id: string,
    _args: {
      content?: string;
      description?: string;
      dueString?: string;
      priority?: number;
      labels?: string[];
    }
  ): Promise<Task> {
    throwBrowserError();
  }

  async closeTask(_id: string): Promise<void> {
    throwBrowserError();
  }

  async deleteTask(_id: string): Promise<void> {
    throwBrowserError();
  }

  async addProject(_args: { name: string; color?: string }): Promise<Project> {
    throwBrowserError();
  }
}

export interface Task {
  id: string;
  content: string;
  description?: string;
  projectId: string;
  sectionId: string | null;
  parentId: string | null;
  order?: number;
  labels?: string[];
  priority?: number;
  dueString?: string;
  dueDate?: string;
  dueDatetime?: string;
  dueLang?: string;
  assigneeId?: string;
  url?: string;
  commentCount?: number;
  isCompleted?: boolean;
  createdAt?: string;
  userId?: string;
  addedByUid?: string | null;
  assignedByUid?: string | null;
  responsibleUid?: string | null;
  syncId?: string | null;
  completedAt?: string | null;
  isCollapsed?: boolean;
}

export interface Project {
  id: string;
  name: string;
  color?: string;
  parentId?: string;
  order?: number;
  commentCount?: number;
  isShared?: boolean;
  isFavorite?: boolean;
  isInboxProject?: boolean;
  isTeamInbox?: boolean;
  viewStyle?: string;
  url?: string;
}

export interface Section {
  id: string;
  projectId: string;
  order: number;
  name: string;
}

export interface Comment {
  id: string;
  taskId?: string;
  projectId?: string;
  content: string;
  postedAt: string;
  attachment?: {
    fileName: string;
    fileType: string;
    fileUrl: string;
    resourceType: string;
  };
}

export interface Label {
  id: string;
  name: string;
  color: string;
  order: number;
  isFavorite: boolean;
}
