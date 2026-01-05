/**
 * Vercel Serverless Function - LLM Proxy
 *
 * Suporta múltiplos provedores de IA:
 * 1. OpenAI GPT (recomendado) - OPENAI_API_KEY
 * 2. Google Gemini - GEMINI_API_KEY
 * 3. GitHub Models (gratuito) - GITHUB_TOKEN
 *
 * Prioridade: OpenAI > Gemini > GitHub Models
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { requireApiKey } from "./lib/auth.js";
import { rateLimitMiddleware } from "./lib/rate-limit.js";
import { retryWithBackoff } from "./lib/retry.js";
import { escapeHtml } from "./lib/sanitize.js";
import { withTimeout } from "./lib/timeout.js";

// Tipos para mensagens e dados
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface LLMRequest {
  model?: string;
  messages?: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  [key: string]: unknown;
}

interface LLMResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  _provider?: string;
  [key: string]: unknown;
}

// Configuração dos provedores
interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string | undefined;
  headers: (apiKey: string) => Record<string, string>;
  transformRequest?: (body: LLMRequest) => unknown;
  transformResponse?: (data: unknown) => LLMResponse;
}

type ProviderName = "OpenAI" | "Gemini";

function getConfiguredProvider(): ProviderConfig | null {
  const providers: ProviderConfig[] = [
    {
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1/chat/completions",
      apiKey: process.env.OPENAI_API_KEY,
      headers: (key) => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      }),
    },
    {
      name: "Gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
      apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY,
      headers: () => ({
        "Content-Type": "application/json",
      }),
      transformRequest: transformToGemini,
      transformResponse: transformFromGemini,
    },
  ];

  return providers.find((p) => p.apiKey) || null;
}

function safeJsonParse(input: unknown): unknown {
  if (typeof input !== "string") return input;
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

function sanitizeMessagesInPlace(messages: ChatMessage[]) {
  for (const m of messages) {
    m.content = escapeHtml(m.content);
  }
}

function resolveRequestedModel(body: LLMRequest, providerName: ProviderName): string {
  const defaultModel = providerName === "OpenAI" ? "gpt-4o-mini" : "gemini-2.5-pro";
  return (body.model as string | undefined) || defaultModel;
}

function buildTarget(
  provider: ProviderConfig,
  body: LLMRequest,
  requestedModel: string
): { targetUrl: string; requestBody: unknown } {
  if (provider.name === "Gemini") {
    const geminiModel = MODEL_MAPPING.gemini[requestedModel] || "gemini-2.5-pro";
    console.log(`[Gemini] Modelo solicitado: ${requestedModel} → ${geminiModel}`);
    return {
      targetUrl: `${provider.baseUrl}/${geminiModel}:generateContent?key=${provider.apiKey}`,
      requestBody: provider.transformRequest ? provider.transformRequest(body) : body,
    };
  }

  // OpenAI
  const mapped = MODEL_MAPPING.openai[requestedModel] || requestedModel;
  return {
    targetUrl: provider.baseUrl,
    requestBody: { ...body, model: mapped },
  };
}

async function fetchJsonOrThrow(provider: ProviderConfig, targetUrl: string, requestBody: unknown) {
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: provider.headers(provider.apiKey!),
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${provider.name} API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Mapeamento de modelos entre provedores
const MODEL_MAPPING: Record<string, Record<string, string>> = {
  openai: {
    "gpt-4o": "gpt-4o",
    "gpt-4o-mini": "gpt-4o-mini",
    "gpt-4": "gpt-4-turbo",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
  },
  gemini: {
    "gpt-4o": "gemini-2.5-pro",
    "gpt-4o-mini": "gemini-2.5-pro",
    "gpt-4": "gemini-2.5-pro",
    "gpt-3.5-turbo": "gemini-2.5-pro",
    gemini: "gemini-2.5-pro",
    "gemini-pro": "gemini-2.5-pro",
    "gemini-1.5-pro": "gemini-2.5-pro",
    "gemini-1.5-flash": "gemini-2.5-pro",
    "gemini-2.0-flash": "gemini-2.5-pro",
    "gemini-2.5-pro": "gemini-2.5-pro",
  },
};

// Transformar request para formato Gemini
function transformToGemini(body: LLMRequest): unknown {
  const messages = body.messages || [];
  const contents = messages
    .filter((m: ChatMessage) => m.role !== "system")
    .map((m: ChatMessage) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  // Adicionar system instruction se existir
  const systemMessage = messages.find((m: ChatMessage) => m.role === "system");

  return {
    contents,
    systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
    generationConfig: {
      temperature: body.temperature || 0.7,
      maxOutputTokens: body.max_tokens || 4096,
    },
  };
}

// Transformar resposta Gemini para formato OpenAI
function transformFromGemini(data: unknown): LLMResponse {
  const geminiData = data as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  };

  const candidate = geminiData.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text || "";

  return {
    id: `gemini-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: "gemini-2.5-pro",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: text,
        },
        finish_reason: candidate?.finishReason?.toLowerCase() || "stop",
      },
    ],
    usage: {
      prompt_tokens: geminiData.usageMetadata?.promptTokenCount || 0,
      completion_tokens: geminiData.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: geminiData.usageMetadata?.totalTokenCount || 0,
    },
  };
}

// Helper: Configurar CORS headers
function setupLLMCorsHeaders(res: VercelResponse, req: VercelRequest): VercelResponse | null {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const origin = (req.headers?.origin as string | undefined) || "";

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

// Helper: Obter IP do cliente
function getLLMClientIP(req: VercelRequest): string {
  return (
    (req.headers["x-forwarded-for"] as string | undefined) ||
    (req.headers["x-real-ip"] as string | undefined) ||
    "unknown"
  );
}

// Helper: Aplicar rate limiting
async function applyLLMRateLimit(clientIP: string, res: VercelResponse): Promise<boolean> {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const corsError = setupLLMCorsHeaders(res, req);
  if (corsError) return corsError;

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Only POST is supported." });
    return;
  }

  // Require LLM proxy API key
  if (process.env.NODE_ENV !== "development" && !process.env.VERCEL_ENV) {
    if (!requireApiKey(req, res, "LLM_PROXY_API_KEY")) return;
  }

  // Rate limiting
  const clientIP = getLLMClientIP(req);
  const rateLimitPassed = await applyLLMRateLimit(clientIP, res);
  if (!rateLimitPassed) return;

  const provider = getConfiguredProvider();

  if (!provider) {
    console.error("No LLM provider configured");
    res.status(500).json({
      error: "No LLM provider configured",
      message: "Configure uma das seguintes variáveis no Vercel:",
      options: [
        {
          name: "OPENAI_API_KEY",
          description: "API key da OpenAI (recomendado)",
          url: "https://platform.openai.com/api-keys",
        },
        {
          name: "GEMINI_API_KEY",
          description: "API key do Google Gemini (gratuito)",
          url: "https://aistudio.google.com/app/apikey",
        },
      ],
    });
    return;
  }

  console.log(`Using LLM provider: ${provider.name}`);

  try {
    const body = safeJsonParse(req.body);

    // Simple validation using Zod
    const ChatMessageSchema = z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string().min(1).max(20000),
    });
    const LLMRequestSchema = z.object({
      model: z.string().optional(),
      messages: z.array(ChatMessageSchema).optional(),
      temperature: z.number().optional(),
      max_tokens: z.number().optional(),
    });
    const parsed = LLMRequestSchema.safeParse(body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid request body", details: parsed.error.format() });
    }

    // sanitize message contents
    if (parsed.data.messages) sanitizeMessagesInPlace(parsed.data.messages);

    // Modelo padrão baseado no provedor
    const requestedModel = resolveRequestedModel(parsed.data, provider.name as ProviderName);

    // Construir URL e body baseado no provedor
    const { targetUrl, requestBody } = buildTarget(provider, parsed.data, requestedModel);

    // Fazer requisição
    // Make request with timeout + retry
    const data = await retryWithBackoff(
      () => withTimeout(45000, () => fetchJsonOrThrow(provider, targetUrl, requestBody)),
      3,
      500
    );

    // Response status has already been checked inside fetchFn

    // data already set from retryWithBackoff

    // Transformar resposta se necessário
    let transformed = data;
    if (provider.transformResponse) transformed = provider.transformResponse(data);

    // Adicionar metadata sobre o provedor usado
    transformed._provider = provider.name;

    res.status(200).json(transformed);
  } catch (error) {
    console.error("LLM proxy error:", error);
    res.status(500).json({
      error: "Failed to process LLM request",
      message: error instanceof Error ? error.message : "Unknown error",
      provider: provider.name,
    });
  }
}
