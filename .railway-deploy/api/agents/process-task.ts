/**
 * API para processar tarefas de agentes com IA real
 *
 * POST /api/agents/process-task
 * Body: { task, agent }
 *
 * Usa Gemini API para análise real de intimações
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireApiKey } from "../lib/auth.js";
import { analyzeWithGemini } from "../lib/gemini-analyzer.js";
import { redactPii } from "../lib/pii.js";
import { rateLimitMiddleware } from "../lib/rate-limit.js";
import { retryWithBackoff } from "../lib/retry.js";
import { escapeHtml } from "../lib/sanitize.js";
import { AnalysisResult, applyDeadlineDates, parseAIResponse } from "../lib/task-helpers.js";
import { withTimeout } from "../lib/timeout.js";
import {
    AgentInputSchema,
    AgentTaskInputSchema,
    handleValidationError,
} from "../lib/validation.js";

/**
 * Tipos válidos de deadline para cálculo de prazos processuais
 */
const DEADLINE_TYPES = ["corridos", "úteis"] as const;
type DeadlineType = (typeof DEADLINE_TYPES)[number];

/**
 * Verifica se um tipo de deadline é válido
 */
function isValidDeadlineType(type: unknown): type is DeadlineType {
  return typeof type === "string" && DEADLINE_TYPES.includes(type as DeadlineType);
}

interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
  data: {
    publicationId?: string;
    text?: string;
    processNumber?: string;
    tribunal?: string;
    type?: string;
    source?: string;
    description?: string;
    [key: string]: unknown;
  };
}

interface Agent {
  id: string;
  type: string;
  name: string;
}

/**
 * Valida o texto da intimação
 */
function validateIntimationText(text: string): boolean {
  return !!text && text.length >= 50;
}

/**
 * Constrói contexto para análise
 */
function buildAnalysisContext(task: AgentTask): string {
  const processNumber = task.data.processNumber || "N/A";
  const tribunal = task.data.tribunal || "N/A";
  const documentType = task.data.type || "Intimação";
  return `Processo: ${processNumber} | Tribunal: ${tribunal} | Tipo: ${documentType}`;
}

/**
 * Processa rota de análise de intimação
 */
async function handleIntimationRoute(task: AgentTask): Promise<AnalysisResult> {
  const text = task.data.text || "";

  if (!validateIntimationText(text)) {
    return {
      success: false,
      error: "Texto da intimação muito curto ou vazio",
    };
  }

  const context = buildAnalysisContext(task);

  try {
    const aiResponse = await analyzeWithGemini(text, context);
    const analysisData = parseAIResponse(aiResponse, task.data.type || "Intimação");
    applyDeadlineDates(analysisData);

    return {
      success: true,
      data: analysisData,
      message: `Análise concluída - ${analysisData.suggestedActions?.length || 0} ações sugeridas`,
    };
  } catch (error) {
    console.error("[Process Task] Error analyzing intimation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido na análise",
    };
  }
}

/**
 * Processa rotas de monitoramento
 */
function handleMonitoringRoute(taskType: string): AnalysisResult {
  return {
    success: true,
    message: `Tarefa ${taskType} processada pelo sistema`,
  };
}

/**
 * Processa tarefas genéricas/desconhecidas
 */
function handleDefaultRoute(task: AgentTask): AnalysisResult {
  // Se existir deadline em task.data, cria estrutura mínima de análise
  if (
    task.data?.deadline &&
    typeof task.data.deadline === "object" &&
    "days" in task.data.deadline &&
    "type" in task.data.deadline
  ) {
    const days = Number(task.data.deadline.days);
    const type = task.data.deadline.type;

    // Validação: days deve ser > 0 e type deve ser válido
    if (days > 0 && isValidDeadlineType(type)) {
      const analysisData: AnalysisResult["data"] = {
        summary: `Tarefa ${task.type} sem análise detalhada`,
        deadline: {
          days,
          type,
          startDate: "",
          endDate: "",
        },
        suggestedActions: [],
        priority: "medium",
        documentType: task.data.type || "Desconhecido",
        nextSteps: [],
      };
      applyDeadlineDates(analysisData);

      return {
        success: true,
        message: `Tarefa ${task.type} concluída (sem conteúdo para análise)`,
        data: analysisData,
      };
    }
  }

  return {
    success: true,
    message: `Tarefa ${task.type} concluída (sem conteúdo para análise)`,
  };
}

/**
 * Verifica se tarefa é de análise
 */
function isAnalysisTask(taskType: string): boolean {
  return taskType === "analyze_intimation" || taskType === "analyze_document";
}

/**
 * Verifica se tarefa é de monitoramento
 */
function isMonitoringTask(taskType: string): boolean {
  return taskType === "monitor-djen" || taskType === "check-deadlines";
}

// Helper: Configurar CORS headers
function setupCorsHeaders(
  res: VercelResponse,
  origin: string,
  allowedOrigins: string[]
): VercelResponse | null {
  if (origin && allowedOrigins.length > 0) {
    if (!allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (allowedOrigins.length === 0) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return null;
}

// Helper: Validar e parsear request body
function validateRequestBody(
  req: VercelRequest,
  res: VercelResponse
): { safeTask: AgentTask; safeAgent: Agent } | null {
  const { task, agent } = req.body as { task: unknown; agent: unknown };

  const parsedTask = AgentTaskInputSchema.safeParse(task);
  if (!parsedTask.success) {
    res.status(400).json({
      error: "Invalid task payload",
      details: handleValidationError(parsedTask.error),
    });
    return null;
  }

  const parsedAgent = AgentInputSchema.safeParse(agent);
  if (!parsedAgent.success) {
    res.status(400).json({
      error: "Invalid agent payload",
      details: handleValidationError(parsedAgent.error),
    });
    return null;
  }

  return {
    safeTask: parsedTask.data,
    safeAgent: {
      id: parsedAgent.data.id,
      type: parsedAgent.data.type || "unknown",
      name: parsedAgent.data.name || "Unnamed Agent",
    },
  };
}

// Helper: Sanitizar dados da task
function sanitizeTaskData(task: AgentTask): void {
  if (task.data && typeof task.data.text === "string") {
    const escaped = escapeHtml(task.data.text) as unknown as string;
    task.data.text = redactPii(escaped) as unknown as string;
  }
}

// Helper: Obter IP do cliente
function getClientIP(req: VercelRequest): string {
  return (
    (req.headers?.["x-forwarded-for"] as string | undefined) ||
    (req.headers?.["x-real-ip"] as string | undefined) ||
    "unknown"
  );
}

// Helper: Aplicar rate limiting
async function applyRateLimit(clientIP: string, res: VercelResponse): Promise<boolean> {
  const rl = await rateLimitMiddleware(clientIP);
  Object.entries(rl.headers || {}).forEach(([k, v]) => res.setHeader(k, v));

  if (!rl.allowed) {
    res.setHeader(
      "Retry-After",
      Math.max(
        1,
        Math.ceil((Number(rl.headers["X-RateLimit-Reset"]) - Date.now()) / 1000)
      ).toString()
    );
    res.status(429).json({ error: rl.error || "Rate limit exceeded" });
    return false;
  }

  return true;
}

// Handler principal
export async function dispatchTask(task: AgentTask, _agent: Agent): Promise<AnalysisResult> {
  if (isAnalysisTask(task.type)) {
    return await handleIntimationRoute(task);
  }

  if (isMonitoringTask(task.type)) {
    return handleMonitoringRoute(task.type);
  }

  return handleDefaultRoute(task);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS - only allow origins configured in ALLOWED_ORIGINS
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const origin = (req.headers?.["origin"] as string | undefined) || "";

  const corsError = setupCorsHeaders(res, origin, allowedOrigins);
  if (corsError) return corsError;

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth - require AUTOGEN_API_KEY for agent processing
  if (!requireApiKey(req, res, "AUTOGEN_API_KEY")) return;

  // Rate limiting by client IP
  const clientIP = getClientIP(req);
  const rateLimitPassed = await applyRateLimit(clientIP, res);
  if (!rateLimitPassed) return;

  // Validate request body
  const validated = validateRequestBody(req, res);
  if (!validated) return;

  const { safeTask, safeAgent } = validated;

  // Sanitize and redact PII from text fields to avoid injection and leak
  sanitizeTaskData(safeTask);

  console.log(
    `[Process Task] Processing task ${safeTask.id} for agent ${safeAgent.name} (${safeAgent.id})`
  );

  try {
    // Always use timeout + retry for calls to LLM
    const exec = async () => dispatchTask(safeTask as any, safeAgent as any);
    const result: AnalysisResult = await retryWithBackoff(
      () => withTimeout(45_000, exec()),
      3,
      500
    );

    console.log(
      `[Process Task] Task ${safeTask.id} completed: ${result.success ? "success" : "failed"}`
    );

    return res.status(200).json({
      success: true,
      taskId: safeTask.id,
      agentId: safeAgent.id,
      result,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Process Task] Fatal error:", error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      taskId: safeTask.id,
      agentId: safeAgent.id,
    });
  }
}
