/**
 * Vercel Serverless Function - LLM Streaming Proxy
 *
 * Suporta streaming de respostas de IA:
 * 1. OpenAI GPT (streaming nativo)
 * 2. Google Gemini (streaming nativo)
 *
 * Retorna Server-Sent Events (SSE) para streaming em tempo real
 *
 * 🔥 SENTRY AI MONITORING V2: Backend instrumentado com spans server-side
 * ✅ CAPTURA usageMetadata do Gemini para monitoramento de custos
 */

import * as Sentry from "@sentry/node";
import type { VercelRequest, VercelResponse } from "@vercel/node";

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

// Tipo para evento SSE
interface SSEEvent {
  type: string;
  content?: string;
  provider?: string;
  message?: string;
  // 🔥 NOVO: Métricas de tokens
  tokens?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
}

// 🔥 NOVO: Estrutura de chunk do Gemini
interface GeminiStreamChunk {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
      role?: string;
    };
    index?: number;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  modelVersion?: string;
  responseId?: string;
}

// Configuração de runtime para Edge (suporta streaming melhor)
export const config = {
  maxDuration: 60,
};

/**
 * 🔥 SENTRY AI MONITORING V2 - Helper para criar span server-side
 */
function createBackendChatSpan<T>(
  provider: "openai" | "gemini",
  model: string,
  messages: ChatMessage[],
  callback: (span: Sentry.Span | undefined) => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name: `llm_stream ${provider} ${model}`,
      op: "gen_ai.chat",
      attributes: {
        "gen_ai.operation.name": "chat",
        "gen_ai.system": provider === "gemini" ? "gcp.gemini" : "openai",
        "gen_ai.request.model": model,
        "gen_ai.request.messages": JSON.stringify(messages),
        "server.side": true,
        "vercel.function": "llm-stream",
      },
    },
    async (span) => {
      try {
        const result = await callback(span);
        span?.setStatus({ code: 1, message: "ok" });
        return result;
      } catch (error) {
        span?.setStatus({
          code: 2,
          message: error instanceof Error ? error.message : "error",
        });
        span?.setAttribute(
          "error.type",
          error instanceof Error ? error.constructor.name : "UnknownError"
        );
        throw error;
      }
    }
  );
}

// Transformar request para formato Gemini
function transformToGemini(body: LLMRequest): unknown {
  const messages = body.messages || [];
  const contents = messages
    .filter((m: ChatMessage) => m.role !== "system")
    .map((m: ChatMessage) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

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

/**
 * Configura headers CORS para a resposta
 */
function setupCorsHeaders(res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/**
 * Configura headers SSE para streaming
 */
function setupSSEHeaders(res: VercelResponse): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
}

/**
 * Cria função para enviar eventos SSE
 */
function createEventSender(res: VercelResponse): (data: SSEEvent) => void {
  return (data: SSEEvent) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
}

/**
 * Processa linha de streaming da OpenAI
 */
function processOpenAILine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed === "data: [DONE]") return null;

  if (!trimmed.startsWith("data: ")) return null;

  try {
    const json = JSON.parse(trimmed.slice(6));
    return json.choices?.[0]?.delta?.content || null;
  } catch {
    return null;
  }
}

/**
 * 🔥 MELHORADO: Processa linha de streaming do Gemini + captura tokens
 */
interface GeminiLineResult {
  text: string | null;
  tokens?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
}

function processGeminiLine(line: string): GeminiLineResult {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith("data: ")) {
    return { text: null };
  }

  try {
    const json: GeminiStreamChunk = JSON.parse(trimmed.slice(6));

    // Extrair texto
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || null;

    // 🔥 NOVO: Extrair métricas de tokens
    const tokens = json.usageMetadata ? {
      prompt: json.usageMetadata.promptTokenCount,
      completion: json.usageMetadata.candidatesTokenCount,
      total: json.usageMetadata.totalTokenCount,
    } : undefined;

    return { text, tokens };
  } catch {
    return { text: null };
  }
}

/**
 * Processa stream de resposta genérico
 */
async function processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  lineProcessor: (line: string) => string | null,
  sendEvent: (data: SSEEvent) => void
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const content = lineProcessor(line);
      if (content) {
        sendEvent({ type: "content", content });
      }
    }
  }
}

/**
 * 🔥 NOVO: Processa stream do Gemini com captura de tokens
 */
async function processGeminiStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  sendEvent: (data: SSEEvent) => void,
  span?: Sentry.Span
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  let lastTokens: { prompt?: number; completion?: number; total?: number } | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const result = processGeminiLine(line);
      
      if (result.text) {
        sendEvent({ 
          type: "content", 
          content: result.text,
          tokens: result.tokens, // 🔥 Enviar tokens ao cliente
        });
      }

      // 🔥 Armazenar último valor de tokens (será o final)
      if (result.tokens) {
        lastTokens = result.tokens;
      }
    }
  }

  // 🔥 Adicionar métricas finais ao Sentry span
  if (span && lastTokens) {
    span.setAttribute("gen_ai.usage.input_tokens", lastTokens.prompt || 0);
    span.setAttribute("gen_ai.usage.output_tokens", lastTokens.completion || 0);
    span.setAttribute("gen_ai.usage.total_tokens", lastTokens.total || 0);

    // 🔥 Calcular custo (Gemini 2.5 Pro pricing)
    // Input: $0.001875 per 1K tokens
    // Output: $0.00375 per 1K tokens
    const inputCost = ((lastTokens.prompt || 0) / 1000) * 0.001875;
    const outputCost = ((lastTokens.completion || 0) / 1000) * 0.00375;
    const totalCost = inputCost + outputCost;
    
    span.setAttribute("gen_ai.cost.input", inputCost);
    span.setAttribute("gen_ai.cost.output", outputCost);
    span.setAttribute("gen_ai.cost.total", totalCost);

    console.log(`[Gemini] Tokens: ${lastTokens.total} | Custo: $${totalCost.toFixed(4)}`);
  }
}

/**
 * Executa streaming com OpenAI
 * 🔥 INSTRUMENTADO COM SENTRY AI MONITORING V2
 */
async function streamOpenAI(
  body: LLMRequest,
  openaiKey: string,
  requestedModel: string,
  sendEvent: (data: SSEEvent) => void
): Promise<void> {
  console.log("[LLM-Stream] Using OpenAI streaming");

  return createBackendChatSpan(
    "openai",
    requestedModel.includes("gemini") ? "gpt-4o-mini" : requestedModel,
    body.messages || [],
    async (span) => {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          ...body,
          model: requestedModel.includes("gemini") ? "gpt-4o-mini" : requestedModel,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI error: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      await processStream(reader, processOpenAILine, sendEvent);

      // Adicionar atributos de conclusão
      span?.setAttribute("stream.completed", true);
      sendEvent({ type: "done", provider: "OpenAI" });
    }
  );
}

/**
 * 🔥 MELHORADO: Executa streaming com Gemini + captura tokens
 * 🔥 INSTRUMENTADO COM SENTRY AI MONITORING V2
 */
async function streamGemini(
  body: LLMRequest,
  geminiKey: string,
  requestedModel: string,
  sendEvent: (data: SSEEvent) => void
): Promise<void> {
  console.log("[LLM-Stream] Using Gemini streaming");

  const geminiBody = transformToGemini(body);

  // Normaliza o nome do modelo para garantir versão válida
  let model = requestedModel;
  if (!model || model === "gemini" || !model.startsWith("gemini-")) {
    model = "gemini-2.5-pro"; // Modelo padrão válido
    console.log(`[LLM-Stream] Modelo normalizado: ${requestedModel} → ${model}`);
  }

  return createBackendChatSpan("gemini", model, body.messages || [], async (span) => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${geminiKey}&alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    // 🔥 NOVO: Usar processador com captura de tokens
    await processGeminiStream(reader, sendEvent, span);

    // Adicionar atributos de conclusão
    span?.setAttribute("stream.completed", true);
    sendEvent({ type: "done", provider: "Gemini" });
  });
}

/**
 * Determina qual provedor usar baseado nas chaves disponíveis
 */
function determineProvider(openaiKey?: string, geminiKey?: string): "openai" | "gemini" | null {
  if (openaiKey) return "openai";
  if (geminiKey) return "gemini";
  return null;
}

/**
 * Valida se a requisição tem os dados necessários
 */
function validateRequest(body: unknown): LLMRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  const request = body as LLMRequest;
  if (!request.messages || !Array.isArray(request.messages)) {
    throw new Error("Messages array is required");
  }

  return request;
}

/**
 * Processa a requisição de streaming baseada no provedor disponível
 */
async function processStreamingRequest(
  validatedBody: LLMRequest,
  provider: "openai" | "gemini",
  sendEvent: (data: SSEEvent) => void,
  openaiKey?: string,
  geminiKey?: string
): Promise<void> {
  // Definir modelo padrão baseado no provedor
  const defaultModel = provider === "openai" ? "gpt-4o-mini" : "gemini-2.5-pro";
  const requestedModel = validatedBody.model || defaultModel;

  if (provider === "openai" && openaiKey) {
    await streamOpenAI(validatedBody, openaiKey, requestedModel, sendEvent);
  } else if (provider === "gemini" && geminiKey) {
    await streamGemini(validatedBody, geminiKey, requestedModel, sendEvent);
  } else {
    throw new Error("No valid provider configuration found");
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  setupCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Headers para SSE
  setupSSEHeaders(res);

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const validatedBody = validateRequest(body);

    // Helper para enviar SSE
    const sendEvent = createEventSender(res);

    // Verificar provedor disponível
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const provider = determineProvider(openaiKey, geminiKey);

    if (!provider) {
      throw new Error("No LLM provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY");
    }

    await processStreamingRequest(validatedBody, provider, sendEvent, openaiKey, geminiKey);
  } catch (error) {
    console.error("[LLM-Stream] Error:", error);
    const sendEvent = createEventSender(res);
    sendEvent({
      type: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    res.end();
  }
}
