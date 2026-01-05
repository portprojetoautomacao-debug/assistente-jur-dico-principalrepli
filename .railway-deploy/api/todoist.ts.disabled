/**
 * Todoist API Proxy
 * Executa operações Todoist no servidor para evitar expor API key no cliente
 * 
 * Endpoint: /api/todoist
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TodoistApi } from '@doist/todoist-api-typescript';

// Inicializar cliente Todoist
const todoistApiKey = process.env.TODOIST_API_KEY || process.env.VITE_TODOIST_API_KEY;
const todoistClient = todoistApiKey ? new TodoistApi(todoistApiKey) : null;

// ============================================================================
// Handlers extraídos para reduzir Cognitive Complexity (S3776)
// ============================================================================

async function handleGetTasks(req: VercelRequest, res: VercelResponse): Promise<void> {
  const source = req.method === 'POST' ? req.body : req.query;
  const projectId = typeof source?.projectId === 'string' ? source.projectId : undefined;
  const label = typeof source?.label === 'string' ? source.label : undefined;
  const filter = typeof source?.filter === 'string' ? source.filter : undefined;
  const cursor = typeof source?.cursor === 'string' ? source.cursor : undefined;
  const limit = parseLimit(source?.limit);

  const response = filter
    ? await todoistClient!.getTasksByFilter({ query: filter, cursor, limit })
    : await todoistClient!.getTasks({ projectId, label, cursor, limit });

  res.status(200).json({ ok: true, tasks: response.results, nextCursor: response.nextCursor ?? null });
}

function parseLimit(value: unknown): number | undefined {
  if (typeof value === 'string') return Number.parseInt(value, 10);
  if (typeof value === 'number') return value;
  return undefined;
}

async function handleGetProjects(res: VercelResponse): Promise<void> {
  const projects = await todoistClient!.getProjects();
  res.status(200).json({ ok: true, projects });
}

async function handleAddTask(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST required for addTask' });
    return;
  }

  const { content, description, projectId, dueString, priority, labels } = req.body;
  
  if (!content) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  const task = await todoistClient!.addTask({
    content, description, projectId, dueString, priority, labels
  });

  res.status(200).json({ ok: true, task });
}

async function handleUpdateTask(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST required for updateTask' });
    return;
  }

  const { id, content, description, dueString, priority, labels } = req.body;
  
  if (!id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }

  const task = await todoistClient!.updateTask(id, {
    content, description, dueString, priority, labels
  });

  res.status(200).json({ ok: true, task });
}

async function handleCloseTask(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST required for closeTask' });
    return;
  }

  const { id } = req.body;
  
  if (!id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }

  await todoistClient!.closeTask(id);
  res.status(200).json({ ok: true, message: 'Task closed' });
}

async function handleDeleteTask(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST required for deleteTask' });
    return;
  }

  const { id } = req.body;
  
  if (!id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }

  await todoistClient!.deleteTask(id);
  res.status(200).json({ ok: true, message: 'Task deleted' });
}

async function handleCreateProject(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST required for createProject' });
    return;
  }

  const { name, color } = req.body;
  
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const project = await todoistClient!.addProject({ name, color });
  res.status(200).json({ ok: true, project });
}

// ============================================================================
// Action dispatcher
// ============================================================================

type ActionHandler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

const ACTION_HANDLERS: Record<string, ActionHandler> = {
  getTasks: handleGetTasks,
  getProjects: (_req, res) => handleGetProjects(res),
  addTask: handleAddTask,
  updateTask: handleUpdateTask,
  closeTask: handleCloseTask,
  deleteTask: handleDeleteTask,
  createProject: handleCreateProject,
  checkConfig: async (_req, res) => {
    res.status(200).json({ ok: true, configured: true, message: 'Todoist API configured' });
  }
};

const VALID_ACTIONS = Object.keys(ACTION_HANDLERS).join(', ');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!todoistClient) {
    return res.status(500).json({ 
      error: 'Todoist API key not configured',
      configured: false
    });
  }

  const action = req.query.action as string;
  const actionHandler = ACTION_HANDLERS[action];

  if (!actionHandler) {
    return res.status(400).json({ 
      error: `Invalid action. Valid actions: ${VALID_ACTIONS}`
    });
  }

  try {
    await actionHandler(req, res);
  } catch (error) {
    console.error('[Todoist API] Error:', error);
    
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
