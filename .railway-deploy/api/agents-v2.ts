/**
 * API V2 Orchestrator - /api/agents-v2
 * Minimal implementation for the new V2 panel - accepts a message/agentId and runs the hybrid executor
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { executeHybridTask, hasHybridVersion } from "../src/lib/hybrid-agents-integration.js";
import { requireApiKey } from "./lib/auth.js";
import { redactPii } from "./lib/pii.js";
import { rateLimitMiddleware } from "./lib/rate-limit.js";
import { retryWithBackoff } from "./lib/retry.js";
import { escapeHtml } from "./lib/sanitize.js";
import { withTimeout } from "./lib/timeout.js";
import { AgentTaskInputSchema, handleValidationError } from "./lib/validation.js";

const AgentsV2Schema = z.object({
  agentId: z.string().min(1),
  message: z.string().min(1).max(10000),
  sessionId: z.string().optional(),
  traces: z.boolean().optional().default(false),
  config: z
    .object({
      coordinationMode: z.enum(["fallback", "sequential", "parallel"]).optional(),
      timeoutMs: z.number().int().min(1000).max(40000).optional(),
    })
    .optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // API Key required
  if (!requireApiKey(req, res, "AUTOGEN_API_KEY")) return;

  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const origin = (req.headers && (req.headers["origin"] as string | undefined)) || "";
  if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  // Rate limit per client IP
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
    return res.status(429).json({ error: rl.error || "Rate limit exceeded" });
  }

  const parsed = AgentsV2Schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.format() });
  }
  const { agentId, message, sessionId, traces, config } = parsed.data;

  // Reject unknown agent ids quickly
  if (!hasHybridVersion(agentId)) {
    return res.status(400).json({ error: `Agent ${agentId} has no v2/hybrid implementation` });
  }

  // sanitize + redact
  const sanitized = redactPii(escapeHtml(message));

  // Build a minimal AgentTask using the existing validation schema shape
  const task = {
    id: sessionId || uuidv4(),
    agentId,
    type: "DRAFT_PETITION",
    priority: "MEDIUM",
    status: "QUEUED",
    createdAt: new Date().toISOString(),
    data: {
      description: sanitized,
    },
  } as const;

  // Validate task shape as a final guard
  const validation = AgentTaskInputSchema.safeParse(task);
  if (!validation.success) {
    return res.status(500).json({
      error: "Unable to create execution task",
      details: handleValidationError(validation.error),
    });
  }

  try {
    const exec = () =>
      executeHybridTask(agentId, task as any, {
        timeoutMs: config?.timeoutMs ?? 30000,
        coordinationMode: config?.coordinationMode,
      });
    // Wrap in timeout and retries to avoid blocking the serverless function
    const rawResult = await retryWithBackoff(() => withTimeout(30000, exec()), 2, 500);
    const result = rawResult as unknown as {
      mode?: string;
      langGraphResult?: { messages: unknown[] };
      [key: string]: unknown;
    };

    // Construct a minimal traces output when available
    const tracesOut = result.langGraphResult ? result.langGraphResult.messages : [];

    return res.status(200).json({
      success: true,
      agentId,
      mode: result.mode,
      data: result,
      traces: traces ? tracesOut : undefined,
    });
  } catch (err) {
    console.error("agent-v2 handler error:", err);
    return res
      .status(500)
      .json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
}

export const config = {
  runtime: "nodejs",
  maxDuration: 300,
};
