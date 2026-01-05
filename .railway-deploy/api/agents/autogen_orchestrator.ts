/**
 * AutoGen Orchestrator - Vercel Serverless Function
 *
 * This function orchestrates multi-agent workflows using the AutoGen framework.
 * It provides a serverless API for coordinating agent interactions.
 *
 * Security Notes:
 * - API key authentication required
 * - No eval() or Function constructor
 * - Input validation on all requests
 * - Timeout protection (45s max for Vercel)
 * - Rate limiting via Vercel edge config
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { executeHybridTask } from "../../src/lib/hybrid-agents-integration.js";
import { requireApiKey } from "../lib/auth.js";
import { redactPii } from "../lib/pii.js";
import { rateLimitMiddleware } from "../lib/rate-limit.js";
import { retryWithBackoff } from "../lib/retry.js";
import { escapeHtml } from "../lib/sanitize.js";
import { withTimeout } from "../lib/timeout.js";

// Configuration
const MAX_TIMEOUT_MS = 40000; // 40s (stay under Vercel 45s limit)
const MAX_ROUNDS = 10;
const _ALLOWED_AGENTS = [
  "harvey",
  "justine",
  "analise-documental",
  "monitor-djen",
  "gestao-prazos",
  "redacao-peticoes",
];

const OrchestrationRequestSchema = z.object({
  task: z.string().min(1).max(10000),
  agents: z.array(z.string()).min(1),
  maxRounds: z.number().int().min(1).max(MAX_ROUNDS).optional(),
  timeout: z.number().int().min(1000).max(MAX_TIMEOUT_MS).optional(),
});

interface AgentMessage {
  role: string;
  content: string;
  timestamp: number;
}

interface OrchestrationResult {
  success: boolean;
  messages: AgentMessage[];
  rounds: number;
  duration: number;
  error?: string;
}

type OrchestrationRequest = z.infer<typeof OrchestrationRequestSchema>;

/**
 * Validate authentication
 */
function validateAuth(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;
  const apiKey = process.env.AUTOGEN_API_KEY;

  if (!apiKey) {
    console.warn("AUTOGEN_API_KEY not configured");
    return false;
  }

  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.substring(7);

  // Constant-time comparison to prevent timing attacks
  if (token.length !== apiKey.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ apiKey.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Validate request payload
 */
// Optionally keep a small guard, but prefer Zod schema validation
function _validateRequest(body: unknown): body is OrchestrationRequest {
  return OrchestrationRequestSchema.safeParse(body).success;
}

// Helper: Verificar abort signal
function checkAbortSignal(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new Error("Operation aborted");
  }
}

// Helper: Criar task para agente específico
function createTaskForAgent(baseTask: any, agentId: string): any {
  return { ...baseTask, id: `${baseTask.id}-${agentId}`, agentId };
}

// Helper: Extrair mensagens do resultado LangGraph
function extractLangGraphMessages(langGraphResult: any, agentId: string): AgentMessage[] {
  const messages: AgentMessage[] = [];
  if (!Array.isArray(langGraphResult?.messages)) {
    return messages;
  }
  
  for (const m of langGraphResult.messages) {
    messages.push({
      role: `${agentId}:${m.role || 'agent'}`,
      content: String(m.content || ''),
      timestamp: Date.now(),
    });
  }
  return messages;
}

// Helper: Criar mensagem de conclusão
function createCompletionMessage(agentId: string, mode: string): AgentMessage {
  return {
    role: agentId,
    content: `[Done] ${agentId} completed (mode=${mode})`,
    timestamp: Date.now(),
  };
}

// Helper: Criar mensagem de erro
function createErrorMessage(agentId: string, err: unknown): AgentMessage {
  return {
    role: agentId,
    content: `[Error] ${err instanceof Error ? err.message : String(err)}`,
    timestamp: Date.now(),
  };
}

// Helper: Processar resultado de execução do agente
function processAgentResult(agentId: string, result: any, messages: AgentMessage[]): void {
  const langGraphResult = result.langGraphResult as any;
  const extractedMessages = extractLangGraphMessages(langGraphResult, agentId);
  
  if (extractedMessages.length > 0) {
    messages.push(...extractedMessages);
  } else {
    messages.push(createCompletionMessage(agentId, result.mode));
  }
}

// Helper: Processar um agente individual
async function processAgent(
  agentId: string,
  taskForAgent: any,
  messages: AgentMessage[],
  timeout?: number
): Promise<void> {
  messages.push({ role: agentId, content: `[Run] Starting ${agentId}`, timestamp: Date.now() });
  
  try {
    const result = await executeHybridTask(agentId, taskForAgent, {
      timeoutMs: timeout || 30000,
    });
    processAgentResult(agentId, result, messages);
  } catch (err) {
    messages.push(createErrorMessage(agentId, err));
    // In fallback mode we continue (timeout > 0 allows continuation)
    if (timeout && timeout > 0) {
      // Continue with next agent
    }
  }
}

/**
 * Stub orchestration - to be implemented with actual AutoGen
 */
async function orchestrateAgents(
  request: OrchestrationRequest,
  signal: AbortSignal
): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const messages: AgentMessage[] = [];

  // Add initial message
  messages.push({
    role: "system",
    content: `Task: ${request.task}`,
    timestamp: Date.now(),
  });

  // Build a shared AgentTask to pass to executeHybridTask
  const baseTask = {
    id: uuidv4(),
    agentId: "",
    type: "DRAFT_PETITION",
    priority: "MEDIUM",
    status: "QUEUED",
    createdAt: new Date().toISOString(),
    data: { description: request.task },
  } as any;

  // Execute agents according to requested coordination
  for (const agentId of request.agents) {
    checkAbortSignal(signal);
    const taskForAgent = createTaskForAgent(baseTask, agentId);
    await processAgent(agentId, taskForAgent, messages, request.timeout);
  }

  const duration = Date.now() - startTime;

  return {
    success: true,
    messages,
    rounds: 1,
    duration,
  };
}

/**
 * Main handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORS headers
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const origin = (req.headers && (req.headers["origin"] as string | undefined)) || "";
  if (origin && allowedOrigins.length > 0) {
    if (!allowedOrigins.includes(origin)) {
      res.status(403).json({ error: "Origin not allowed" });
      return;
    }
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Validate authentication
  if (!validateAuth(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Prefer standard API key middleware
  if (!requireApiKey(req, res, "AUTOGEN_API_KEY")) return;

  // Validate request (Zod)
  const parsed = OrchestrationRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request payload", details: parsed.error.format() });
    return;
  }
  const request = parsed.data as OrchestrationRequest;

  // Sanitize and redact input task text
  if (typeof request.task === "string") {
    request.task = redactPii(escapeHtml(request.task));
  }
  const timeout = request.timeout || MAX_TIMEOUT_MS;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  // Rate limiting by IP
  const clientIP =
    (req.headers["x-forwarded-for"] as string | undefined) ||
    (req.headers["x-real-ip"] as string | undefined) ||
    "unknown";
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
    return;
  }
  try {
    const exec = () => orchestrateAgents(request, controller.signal);
    const result = await retryWithBackoff(() => withTimeout(timeout, exec()), 3, 5000);

    clearTimeout(timeoutId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error("Orchestration error:", errorMessage);

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}

/**
 * Vercel configuration
 */
export const config = {
  maxDuration: 45, // Maximum for Vercel Hobby plan
  runtime: "nodejs",
};
