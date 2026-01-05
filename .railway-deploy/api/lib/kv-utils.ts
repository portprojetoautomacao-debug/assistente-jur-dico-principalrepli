/**
 * Vercel KV / Upstash Redis Utilities for Cron Jobs
 *
 * Este módulo fornece utilitários para interagir com um KV (Upstash Redis)
 * a partir de funções serverless (cron jobs, api routes, etc.).
 */

import { Redis } from '@upstash/redis'
import { randomUUID } from 'node:crypto'

// AgentTask type definition (inline para evitar problemas de import em serverless)
export interface AgentTask {
  id: string
  title?: string
  agentId?: string
  type: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  completedAt?: string
  result?: string
  metadata?: Record<string, unknown>
  data?: Record<string, unknown>
}

// Key prefixes para diferentes tipos de dados
export const KV_KEYS = {
  MONITORED_LAWYERS: 'monitored-lawyers',
  PUBLICATIONS: 'publications',
  AGENTS: 'autonomous-agents',
  COMPLETED_TASKS: 'completed-agent-tasks',
  ACTIVITY_LOG: 'agent-activity-log',
  LAST_DJEN_CHECK: 'last-djen-check',
  NOTIFICATION_QUEUE: 'notification-queue'
} as const

// Tipos para dados armazenados no KV
export interface MonitoredLawyer {
  id: string
  name: string
  oab: string
  email?: string
  enabled: boolean
  tribunals: string[]
}

export interface StoredPublication {
  id: string
  tribunal: string
  data: string
  tipo: string
  teor: string
  numeroProcesso?: string
  orgao?: string
  matchType: 'nome' | 'oab' | 'ambos'
  lawyerId: string
  notified: boolean
  createdAt: string
}

export interface Agent {
  id: string
  name: string
  enabled: boolean
  tasksCompleted: number
  tasksToday: number
  status: 'idle' | 'active' | 'paused' | 'processing' | 'waiting_human'
  lastActivity?: string
  continuousMode: boolean
  currentTask?: unknown
}

// Lazy-loaded KV client
let _kvClient: Redis | null = null

async function getKv(): Promise<Redis> {
  if (_kvClient) return _kvClient

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

  // Upstash Redis (recomendado para Vercel)
  if (url && token) {
    _kvClient = new Redis({
      url,
      token
    })
    return _kvClient
  }

  throw new Error('No KV storage available (Upstash Redis required)')
}

// -----------------------------------------------------------------------------
// MONITORED LAWYERS
// -----------------------------------------------------------------------------

export async function getMonitoredLawyers(): Promise<MonitoredLawyer[]> {
  try {
    const kv = await getKv()
    const lawyers = await kv.get<MonitoredLawyer[]>(KV_KEYS.MONITORED_LAWYERS)
    return lawyers ?? []
  } catch (error) {
     
    console.error('[KV] Error getting monitored lawyers:', error)
    return []
  }
}

// -----------------------------------------------------------------------------
// PUBLICATIONS
// -----------------------------------------------------------------------------

export async function storePublication(publication: StoredPublication): Promise<void> {
  try {
    const kv = await getKv()
    const key = `${KV_KEYS.PUBLICATIONS}:${publication.lawyerId}`
    const existing = (await kv.get<StoredPublication[]>(key)) ?? []

    // Evita duplicatas básicas
    const isDuplicate = existing.some(
      (p) =>
        p.tribunal === publication.tribunal &&
        p.data === publication.data &&
        p.numeroProcesso === publication.numeroProcesso
    )

    if (!isDuplicate) {
      const updated = [publication, ...existing]
      // Mantém só as últimas 1000 publicações por advogado
      const trimmed = updated.slice(0, 1000)
      await kv.set(key, trimmed)
    }
  } catch (error) {
     
    console.error('[KV] Error storing publication:', error)
    throw error
  }
}

export async function getPublications(lawyerId: string): Promise<StoredPublication[]> {
  try {
    const kv = await getKv()
    const key = `${KV_KEYS.PUBLICATIONS}:${lawyerId}`
    const publications = await kv.get<StoredPublication[]>(key)
    return publications ?? []
  } catch (error) {
     
    console.error('[KV] Error getting publications:', error)
    return []
  }
}

// -----------------------------------------------------------------------------
// DJEN CHECK TIMESTAMP
// -----------------------------------------------------------------------------

export async function updateLastDJENCheck(): Promise<void> {
  try {
    const kv = await getKv()
    await kv.set(KV_KEYS.LAST_DJEN_CHECK, new Date().toISOString())
  } catch (error) {
     
    console.error('[KV] Error updating last DJEN check:', error)
  }
}

export async function getLastDJENCheck(): Promise<string | null> {
  try {
    const kv = await getKv()
    const value = await kv.get<string>(KV_KEYS.LAST_DJEN_CHECK)
    return value ?? null
  } catch (error) {
     
    console.error('[KV] Error getting last DJEN check:', error)
    return null
  }
}

// -----------------------------------------------------------------------------
// AGENTS
// -----------------------------------------------------------------------------

export async function getAgents(): Promise<Agent[]> {
  try {
    const kv = await getKv()
    const agents = await kv.get<Agent[]>(KV_KEYS.AGENTS)
    return agents ?? []
  } catch (error) {
     
    console.error('[KV] Error getting agents:', error)
    return []
  }
}

export async function updateAgents(agents: Agent[]): Promise<void> {
  try {
    const kv = await getKv()
    await kv.set(KV_KEYS.AGENTS, agents)
  } catch (error) {
     
    console.error('[KV] Error updating agents:', error)
    throw error
  }
}

// -----------------------------------------------------------------------------
// COMPLETED TASKS
// -----------------------------------------------------------------------------

export async function getCompletedTasks(): Promise<AgentTask[]> {
  try {
    const kv = await getKv()
    const tasks = await kv.get<AgentTask[]>(KV_KEYS.COMPLETED_TASKS)
    return tasks ?? []
  } catch (error) {
     
    console.error('[KV] Error getting completed tasks:', error)
    return []
  }
}

export async function updateCompletedTasks(tasks: AgentTask[]): Promise<void> {
  try {
    const kv = await getKv()
    await kv.set(KV_KEYS.COMPLETED_TASKS, tasks)
  } catch (error) {
     
    console.error('[KV] Error updating completed tasks:', error)
    throw error
  }
}

// -----------------------------------------------------------------------------
// NOTIFICATION QUEUE
// -----------------------------------------------------------------------------

interface QueuedNotification {
  id: string
  type: 'publication' | 'agent' | 'system'
  title: string
  message: string
  data?: unknown
  recipientEmail?: string
  createdAt: string
  sent: boolean
}

export async function queueNotification(notification: {
  type: 'publication' | 'agent' | 'system'
  title: string
  message: string
  data?: unknown
  recipientEmail?: string
}): Promise<void> {
  try {
    const kv = await getKv()
    const currentQueue =
      (await kv.get<QueuedNotification[]>(KV_KEYS.NOTIFICATION_QUEUE)) ?? []

    const entry: QueuedNotification = {
      ...notification,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      sent: false
    }

    currentQueue.push(entry)
    await kv.set(KV_KEYS.NOTIFICATION_QUEUE, currentQueue)
  } catch (error) {
     
    console.error('[KV] Error queuing notification:', error)
  }
}

// -----------------------------------------------------------------------------
// TASK QUEUE
// -----------------------------------------------------------------------------

export async function addTaskToQueue(task: AgentTask): Promise<void> {
  try {
    const kv = await getKv()
    const queueKey = 'agent-task-queue'
    const queue = (await kv.get<AgentTask[]>(queueKey)) ?? []
    queue.push(task)
    await kv.set(queueKey, queue)
  } catch (error) {
     
    console.error('[KV] Error adding task to queue:', error)
  }
}
