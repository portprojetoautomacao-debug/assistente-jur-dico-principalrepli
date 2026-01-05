/**
 * API endpoint para diagnóstico de tarefas falhadas
 * GET /api/failed-tasks-analysis
 *
 * Analisa todas as tarefas falhadas e agrupa por tipo de erro
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

    // Filtrar tarefas falhadas
    const failedTasks = taskQueue.filter((t) => t.status === "failed");

    // Agrupar por tipo de erro
    const errorGroups: Record<
      string,
      Array<{
        taskId: string;
        agentId: string;
        type: string;
        error: string;
        createdAt: string;
      }>
    > = {};

    failedTasks.forEach((task) => {
      const errorMsg = task.error || "Erro desconhecido";
      const errorKey = extractErrorKey(errorMsg);

      if (!errorGroups[errorKey]) {
        errorGroups[errorKey] = [];
      }

      errorGroups[errorKey].push({
        taskId: task.id,
        agentId: task.agentId,
        type: task.type,
        error: errorMsg,
        createdAt: task.createdAt,
      });
    });

    // Estatísticas
    const errorStats = Object.entries(errorGroups).map(([errorKey, tasks]) => {
      const sortedTasks = [...tasks].sort(
        (a: { createdAt: string }, b: { createdAt: string }) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      return {
        errorType: errorKey,
        count: tasks.length,
        affectedAgents: [...new Set(tasks.map((t) => t.agentId))],
        affectedTaskTypes: [...new Set(tasks.map((t) => t.type))],
        firstOccurrence: sortedTasks[0]?.createdAt,
        lastOccurrence: sortedTasks[sortedTasks.length - 1]?.createdAt,
        examples: tasks.slice(0, 3), // Primeiros 3 exemplos
      };
    });

    // Ordenar por contagem (mais frequente primeiro)
    const sortedErrorStats = [...errorStats].sort(
      (a: { count: number }, b: { count: number }) => b.count - a.count
    );

    // Análise de padrões
    const patterns = analyzeErrorPatterns(failedTasks);

    return res.status(200).json({
      summary: {
        totalFailed: failedTasks.length,
        totalInQueue: taskQueue.length,
        failureRate: `${((failedTasks.length / taskQueue.length) * 100).toFixed(1)}%`,
        uniqueErrorTypes: Object.keys(errorGroups).length,
      },
      errorGroups: sortedErrorStats,
      patterns,
      recommendations: generateRecommendations(sortedErrorStats, patterns),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Failed Tasks Analysis] Error:", error);
    return res.status(500).json({
      error: "Failed to analyze failed tasks",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Extrai chave de erro genérica para agrupamento
 */
function extractErrorKey(errorMsg: string): string {
  // Gemini API errors
  if (errorMsg.includes("404") && errorMsg.includes("models/gemini")) {
    return "GEMINI_MODEL_NOT_FOUND";
  }
  if (errorMsg.includes("Gemini error")) {
    return "GEMINI_API_ERROR";
  }
  if (errorMsg.includes("timeout") || errorMsg.includes("timed out")) {
    return "TIMEOUT_ERROR";
  }
  if (errorMsg.includes("Network") || errorMsg.includes("fetch")) {
    return "NETWORK_ERROR";
  }
  if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
    return "AUTH_ERROR";
  }
  if (errorMsg.includes("Rate limit") || errorMsg.includes("429")) {
    return "RATE_LIMIT_ERROR";
  }
  if (errorMsg.includes("validation") || errorMsg.includes("Invalid input")) {
    return "VALIDATION_ERROR";
  }

  // Erro genérico
  return "OTHER_ERROR";
}

/**
 * Analisa padrões nos erros
 */
function analyzeErrorPatterns(
  failedTasks: Array<{
    agentId: string;
    type: string;
    error?: string;
    createdAt: string;
  }>
) {
  const patterns: Record<string, unknown> = {};

  // Padrão 1: Todos os erros de um mesmo agente
  const byAgent: Record<string, number> = {};
  failedTasks.forEach((t) => {
    byAgent[t.agentId] = (byAgent[t.agentId] || 0) + 1;
  });
  patterns.mostFailedAgent = Object.entries(byAgent).sort(
    (a: [string, number], b: [string, number]) => b[1] - a[1]
  )[0];

  // Padrão 2: Todos os erros de um mesmo tipo de tarefa
  const byType: Record<string, number> = {};
  failedTasks.forEach((t) => {
    byType[t.type] = (byType[t.type] || 0) + 1;
  });
  patterns.mostFailedTaskType = Object.entries(byType).sort(
    (a: [string, number], b: [string, number]) => b[1] - a[1]
  )[0];

  // Padrão 3: Horários de maior incidência
  const byHour: Record<number, number> = {};
  failedTasks.forEach((t) => {
    const hour = new Date(t.createdAt).getHours();
    byHour[hour] = (byHour[hour] || 0) + 1;
  });
  patterns.peakFailureHour = Object.entries(byHour).sort(
    (a: [string, number], b: [string, number]) => b[1] - a[1]
  )[0];

  // Padrão 4: Mesma mensagem de erro repetida
  const errorCounts: Record<string, number> = {};
  failedTasks.forEach((t) => {
    const key = extractErrorKey(t.error || "");
    errorCounts[key] = (errorCounts[key] || 0) + 1;
  });
  patterns.mostCommonError = Object.entries(errorCounts).sort(
    (a: [string, number], b: [string, number]) => b[1] - a[1]
  )[0];

  return patterns;
}

/**
 * Gera recomendações baseadas nos erros
 */
function generateRecommendations(
  errorStats: Array<{ errorType: string; count: number; affectedAgents: string[] }>,
  patterns: Record<string, unknown>
): string[] {
  const recommendations: string[] = [];

  errorStats.forEach((stat) => {
    if (stat.errorType === "GEMINI_MODEL_NOT_FOUND") {
      recommendations.push(
        "🔧 CRÍTICO: Modelo Gemini não encontrado. Verifique GEMINI_API_KEY e nome do modelo em src/lib/gemini-config.ts"
      );
    }

    if (stat.errorType === "TIMEOUT_ERROR" && stat.count > 5) {
      recommendations.push(
        `⏱️ ${stat.count} timeouts detectados. Considere aumentar timeout em api/agents.ts ou otimizar prompts.`
      );
    }

    if (stat.errorType === "RATE_LIMIT_ERROR") {
      recommendations.push(
        "🚦 Rate limit atingido. Implemente backoff exponencial ou reduza throughput do cron."
      );
    }

    if (stat.errorType === "AUTH_ERROR") {
      recommendations.push(
        "🔐 Erro de autenticação. Verifique variáveis de ambiente no Vercel (GEMINI_API_KEY)."
      );
    }

    if (stat.errorType === "NETWORK_ERROR" && stat.count > 10) {
      recommendations.push(
        "🌐 Múltiplos erros de rede. Verifique conectividade com API Gemini ou implemente retry logic."
      );
    }
  });

  // Recomendação baseada em padrões
  if (patterns.mostCommonError && Array.isArray(patterns.mostCommonError)) {
    const [errorType, count] = patterns.mostCommonError;
    if (typeof count === "number" && count > errorStats.length * 0.8) {
      recommendations.push(
        `⚠️ ${Math.round((count / errorStats.length) * 100)}% dos erros são do tipo "${errorType}". Priorize correção deste erro.`
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ Nenhuma recomendação automática. Revisar logs manualmente.");
  }

  return recommendations;
}
