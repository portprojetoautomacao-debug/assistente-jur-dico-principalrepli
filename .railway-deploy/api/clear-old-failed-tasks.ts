/**
 * API endpoint para limpar tarefas falhadas antigas
 * POST /api/clear-old-failed-tasks
 *
 * Remove tarefas com status 'failed' mais antigas que 24 horas
 */

import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const getKv = (): Redis => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Upstash Redis não configurado");
  }

  return new Redis({ url, token });
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const kv = getKv();

    // Buscar fila de tarefas
    const taskQueue =
      ((await kv.get("agent-task-queue")) as Array<{
        id: string;
        agentId: string;
        type: string;
        status: string;
        priority?: string;
        error?: string;
        data?: Record<string, unknown>;
        createdAt: string;
        startedAt?: string;
        completedAt?: string;
      }>) || [];

    const now = Date.now();
    const cutoffTime = now - 24 * 60 * 60 * 1000; // 24 horas atrás

    // Separar tarefas que devem ser mantidas
    const tasksToKeep = taskQueue.filter((task) => {
      // Manter todas as tarefas não-falhadas
      if (task.status !== "failed") return true;

      // Manter tarefas falhadas recentes (últimas 24h)
      const taskTime = new Date(task.createdAt).getTime();
      return taskTime > cutoffTime;
    });

    // Contar tarefas removidas
    const removedCount = taskQueue.length - tasksToKeep.length;
    const failedBefore = taskQueue.filter((t) => t.status === "failed").length;
    const failedAfter = tasksToKeep.filter((t) => t.status === "failed").length;

    // Salvar fila atualizada
    await kv.set("agent-task-queue", tasksToKeep);

    return res.status(200).json({
      success: true,
      message: `${removedCount} tarefas antigas removidas`,
      stats: {
        totalBefore: taskQueue.length,
        totalAfter: tasksToKeep.length,
        failedBefore,
        failedAfter,
        removed: removedCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Clear Old Failed Tasks] Error:", error);
    return res.status(500).json({
      error: "Failed to clear old tasks",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
