/**
 * Debug endpoint para verificar status da fila de agentes em produção
 * GET /api/debug-agent-queue
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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const kv = getKv();
    const timestamp = new Date().toISOString();

    // Buscar dados da fila
    const taskQueue =
      ((await kv.get("agent-task-queue")) as Array<{
        id: string;
        agentId: string;
        type: string;
        status: string;
        priority?: string;
        createdAt: string;
        startedAt?: string;
        completedAt?: string;
      }>) || [];

    const completedTasks =
      ((await kv.get("completed-agent-tasks")) as Array<{
        id: string;
        agentId: string;
        type: string;
        completedAt: string;
      }>) || [];

    const queueHistory =
      ((await kv.get("agent-queue-depth-history")) as Array<{
        timestamp: string;
        queueLength: number;
        pendingCount: number;
      }>) || [];

    const scalingEvents =
      ((await kv.get("agent-queue-scaling-events")) as Array<{
        timestamp: string;
        limit: number;
        avgPending: number;
        maxPending: number;
        currentPending: number;
      }>) || [];

    // Estatísticas da fila atual
    const statusCounts = taskQueue.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const agentCounts = taskQueue.reduce(
      (acc, task) => {
        acc[task.agentId] = (acc[task.agentId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const typeCounts = taskQueue.reduce(
      (acc, task) => {
        acc[task.type] = (acc[task.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Tarefas mais antigas
    const oldestTasks = [...taskQueue]
      .filter((t) => t.status === "pending" || t.status === "queued")
      .sort(
        (a: { createdAt: string }, b: { createdAt: string }) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        agentId: t.agentId,
        type: t.type,
        status: t.status,
        createdAt: t.createdAt,
        ageMinutes: Math.round((Date.now() - new Date(t.createdAt).getTime()) / 60000),
      }));

    // Tarefas completadas recentemente
    const recentCompleted = [...completedTasks]
      .sort(
        (a: { completedAt: string }, b: { completedAt: string }) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )
      .slice(0, 10)
      .map((t) => ({
        id: t.id,
        agentId: t.agentId,
        type: t.type,
        completedAt: t.completedAt,
        ageMinutes: Math.round((Date.now() - new Date(t.completedAt).getTime()) / 60000),
      }));

    // Histórico recente da fila
    const recentHistory = queueHistory.slice(0, 12);

    // Último evento de scaling
    const lastScaling = scalingEvents[0];

    // Estimativa de processamento
    const pendingCount = statusCounts.pending || 0;
    const queuedCount = statusCounts.queued || 0;
    const totalPending = pendingCount + queuedCount;

    let estimatedLimit = 10; // padrão
    if (totalPending >= 100) estimatedLimit = 40;
    else if (totalPending >= 50) estimatedLimit = 25;

    const estimatedBatches = Math.ceil(totalPending / estimatedLimit);
    const estimatedMinutes = estimatedBatches * 15;

    return res.status(200).json({
      timestamp,
      summary: {
        totalInQueue: taskQueue.length,
        pending: pendingCount,
        queued: queuedCount,
        processing: statusCounts.in_progress || 0,
        failed: statusCounts.failed || 0,
        totalCompleted: completedTasks.length,
        estimatedProcessingTime: `${estimatedMinutes} minutos (${estimatedBatches} batches de ${estimatedLimit} tarefas)`,
      },
      breakdown: {
        byStatus: statusCounts,
        byAgent: agentCounts,
        byType: typeCounts,
      },
      oldestTasks,
      recentCompleted,
      queueHistory: recentHistory,
      lastScalingEvent: lastScaling,
      nextCronExecution: "A cada 15 minutos (vercel.json)",
      isProcessing:
        (statusCounts.in_progress || 0) > 0
          ? "Sim - tarefas sendo processadas agora"
          : "Aguardando próximo cron (máx 15 min)",
    });
  } catch (error) {
    console.error("[Debug Agent Queue] Error:", error);
    return res.status(500).json({
      error: "Failed to fetch agent queue debug info",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
