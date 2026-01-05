/**
 * API endpoint para buscar "pensamentos" dos agentes em tempo real
 * GET /api/agent-thinking?taskId={id} - Pensamentos de uma tarefa específica
 * GET /api/agent-thinking - Todos os pensamentos recentes
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";

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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const kv = getKv();
    const { taskId } = req.query;

    if (taskId && typeof taskId === "string") {
      // Buscar pensamentos de uma tarefa específica
      const taskThinking =
        ((await kv.get(`task-thinking:${taskId}`)) as Array<{
          id: string;
          taskId: string;
          agentId: string;
          agentName: string;
          taskType: string;
          stage: string;
          details: Record<string, unknown>;
          timestamp: string;
        }>) || [];

      return res.status(200).json({
        taskId,
        thinking: taskThinking,
        count: taskThinking.length,
      });
    }

    // Buscar todos os pensamentos recentes
    const allThinking =
      ((await kv.get("agent-thinking-logs")) as Array<{
        id: string;
        taskId: string;
        agentId: string;
        agentName: string;
        taskType: string;
        stage: string;
        details: Record<string, unknown>;
        timestamp: string;
      }>) || [];

    // Agrupar por tarefa
    const byTask = allThinking.reduce(
      (acc, log) => {
        if (!acc[log.taskId]) {
          acc[log.taskId] = [];
        }
        acc[log.taskId].push(log);
        return acc;
      },
      {} as Record<string, typeof allThinking>
    );

    // Buscar tarefas ativas para enriquecer dados
    const taskQueue =
      ((await kv.get("agent-task-queue")) as Array<{
        id: string;
        agentId: string;
        type: string;
        status: string;
        priority?: string;
        data?: Record<string, unknown>;
        createdAt: string;
        startedAt?: string;
      }>) || [];

    const activeTasks = taskQueue
      .filter((t) => t.status === "in_progress" || t.status === "processing")
      .map((task) => {
        const thinking = byTask[task.id] || [];
        const latestThinking = thinking[thinking.length - 1];

        return {
          taskId: task.id,
          agentId: task.agentId,
          agentName: latestThinking?.agentName || "Desconhecido",
          taskType: task.type,
          status: task.status,
          priority: task.priority,
          data: task.data,
          createdAt: task.createdAt,
          startedAt: task.startedAt,
          thinking,
          currentStage: latestThinking?.stage || "INICIANDO",
          currentDetails: latestThinking?.details || {},
          thinkingCount: thinking.length,
        };
      });

    // Últimos pensamentos (últimos 50)
    const recentThinking = allThinking.slice(0, 50);

    return res.status(200).json({
      activeTasks,
      recentThinking,
      totalThinking: allThinking.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Agent Thinking API] Error:", error);
    return res.status(500).json({
      error: "Failed to fetch agent thinking",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
