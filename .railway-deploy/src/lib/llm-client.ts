/**
 * LLM Client - Gemini 2.5 Pro Implementation
 *
 * Este módulo fornece uma interface unificada para operações com Gemini 2.5 Pro.
 * Todas as chamadas vão para o backend proxy: /api/llm-proxy (não-streaming) ou /api/llm-stream (streaming).
 *
 * SEM SIMULAÇÕES - Todas as chamadas vão para APIs reais do Google Gemini.
 */

const LLM_PROXY_URL = "/api/llm-proxy";
const LLM_STREAM_URL = "/api/llm-stream";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface StreamCallbacks {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Call Gemini API and get a text response
 */
export async function llm(
  prompt: string,
  model: string = "gemini-2.5-pro",
  jsonMode: boolean = false
): Promise<string> {
  const messages: LLMMessage[] = [{ role: "user", content: prompt }];

  const response = await callLLMProxy(messages, {
    model,
    temperature: jsonMode ? 0 : 0.7,
  });

  if (jsonMode) {
    // Parse and re-stringify to ensure valid JSON
    try {
      const parsed = JSON.parse(response);
      return JSON.stringify(parsed);
    } catch {
      // If not valid JSON, return as-is
      return response;
    }
  }

  return response;
}

/**
 * Generate text using Gemini
 */
export async function generateText(prompt: string, options: LLMOptions = {}): Promise<string> {
  const messages: LLMMessage[] = [{ role: "user", content: prompt }];

  return callLLMProxy(messages, options);
}

/**
 * Generate JSON using Gemini
 */
export async function generateJSON<T = unknown>(
  prompt: string,
  options: LLMOptions = {}
): Promise<T> {
  const systemPrompt =
    "Você é um assistente que sempre responde com JSON válido. Nunca inclua explicações fora da estrutura JSON.";

  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `${prompt}\n\nResponda apenas com JSON válido.` },
  ];

  const response = await callLLMProxy(messages, {
    ...options,
    temperature: 0, // Lower temperature for more consistent JSON
  });

  try {
    // Try to extract JSON from response without greedy regex
    const openBraceIdx = response.indexOf("{");
    const openBracketIdx = response.indexOf("[");
    const startIdx = Math.min(
      openBraceIdx >= 0 ? openBraceIdx : Infinity,
      openBracketIdx >= 0 ? openBracketIdx : Infinity
    );
    const endIdx = Math.max(response.lastIndexOf("}"), response.lastIndexOf("]"));

    if (startIdx !== Infinity && endIdx !== -1 && endIdx >= startIdx) {
      const jsonStr = response.substring(startIdx, endIdx + 1);
      return JSON.parse(jsonStr) as T;
    }
    return JSON.parse(response) as T;
  } catch (error) {
    console.error("Failed to parse JSON response:", response);
    throw new Error(`Invalid JSON response from Gemini: ${error}`);
  }
}

/**
 * Stream text from Gemini 2.5 Pro via SSE (Server-Sent Events)
 * Usa streaming REAL - não simulado
 */
export async function* streamText(
  prompt: string,
  options: LLMOptions = {}
): AsyncGenerator<string, void, unknown> {
  const messages: LLMMessage[] = [{ role: "user", content: prompt }];

  const response = await fetch(LLM_STREAM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      model: options.model || "gemini-2.5-pro",
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`Streaming API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Streaming não suportado");

  yield* processSSEResponse(reader);
}

/**
 * Stream text with callbacks (alternativa ao generator)
 */
export async function streamTextWithCallbacks(
  prompt: string,
  callbacks: StreamCallbacks,
  options: LLMOptions = {}
): Promise<string> {
  let fullContent = "";

  try {
    for await (const chunk of streamText(prompt, options)) {
      fullContent += chunk;
      callbacks.onChunk?.(chunk);
    }
    callbacks.onComplete?.(fullContent);
    return fullContent;
  } catch (error) {
    callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Chat with Gemini using message history
 */
export async function chat(messages: LLMMessage[], options: LLMOptions = {}): Promise<string> {
  return callLLMProxy(messages, options);
}

/**
 * Chat with Gemini using streaming (retorna AsyncGenerator)
 */
export async function* chatStream(
  messages: LLMMessage[],
  options: LLMOptions = {}
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(LLM_STREAM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      model: options.model || "gemini-2.5-pro",
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`Streaming API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Streaming não suportado");

  yield* processSSEResponse(reader);
}

/**
 * Internal function to call the LLM proxy (non-streaming)
 */
async function callLLMProxy(messages: LLMMessage[], options: LLMOptions = {}): Promise<string> {
  try {
    const response = await fetch(LLM_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        model: options.model || "gemini-2.5-pro",
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Handle different response formats
    if (data.response) {
      return data.response;
    }
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    if (data.text) {
      return data.text;
    }
    if (typeof data === "string") {
      return data;
    }

    throw new Error("Unexpected response format from Gemini API");
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw error;
  }
}

/**
 * Verifica se um erro é um erro de streaming para re-throw
 */
function isStreamingError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("streaming");
}

/**
 * Processa JSON parseado de uma linha SSE
 * @throws Error se for um erro de streaming
 */
function processSSEJson(json: {
  type?: string;
  content?: string;
  message?: string;
  error?: string;
}): string | null {
  if (json.type === "error") {
    throw new Error(json.message || json.error || "Erro desconhecido no streaming");
  }
  if (json.type === "content" && json.content) {
    return json.content;
  }
  // json.type === 'done' → fim do stream
  return null;
}

/**
 * Parse a single SSE line and extract content or throw on error
 * @returns The content string if valid, null otherwise
 */
function parseSSELine(line: string): string | null {
  const trimmed = line.trim();

  // Early return para linhas inválidas (SonarCloud S3776)
  if (!trimmed) return null;
  if (!trimmed.startsWith("data: ")) return null;

  try {
    const json = JSON.parse(trimmed.slice(6));
    return processSSEJson(json);
  } catch (parseError) {
    if (isStreamingError(parseError)) throw parseError;
    console.warn("Failed to parse SSE line:", trimmed, parseError);
    return null;
  }
}

/**
 * Helper to process SSE response stream
 * Refactored to reduce cognitive complexity (S3776)
 */
async function* processSSEResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<string, void, unknown> {
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const content = parseSSELine(line);
        if (content) yield content;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Export como namespace (compatibilidade)
export const gemini = {
  llm,
  generateText,
  generateJSON,
  streamText,
  streamTextWithCallbacks,
  chat,
  chatStream,
};

export default gemini;
