/**
 * Hook para streaming de respostas de IA
 *
 * Permite receber respostas de IA em tempo real via Server-Sent Events (SSE)
 *
 * 🔥 NOVO: Captura métricas de tokens do Gemini para monitoramento de custos
 *
 * @example
 * const { streamingContent, isStreaming, error, tokens, streamChat } = useAIStreaming()
 *
 * // Iniciar streaming
 * await streamChat([
 *   { role: 'system', content: 'Você é um assistente jurídico.' },
 *   { role: 'user', content: 'Explique o que é uma petição inicial.' }
 * ])
 *
 * // streamingContent será atualizado em tempo real
 * // tokens conterá: { prompt: 150, completion: 300, total: 450 }
 */

import { createChatSpan } from "@/lib/sentry-gemini-integration-v2";
import { useCallback, useRef, useState } from "react";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface StreamEvent {
  type: "content" | "done" | "error";
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

// 🔥 NOVO: Interface para métricas de tokens
export interface TokenMetrics {
  prompt: number;
  completion: number;
  total: number;
  cost: number; // Custo estimado em USD
}

interface UseAIStreamingOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullContent: string, provider: string) => void;
  onError?: (error: string) => void;
  onTokens?: (tokens: TokenMetrics) => void; // 🔥 NOVO: Callback para métricas
  model?: string;
  temperature?: number;
  maxTokens?: number;
  // Parâmetros para Sentry AI Monitoring
  agentId?: string;
  sessionId?: string;
  conversationTurn?: number;
}

interface UseAIStreamingReturn {
  streamingContent: string;
  isStreaming: boolean;
  error: string | null;
  provider: string | null;
  tokens: TokenMetrics | null; // 🔥 NOVO: Métricas de tokens
  streamChat: (messages: Message[]) => Promise<string>;
  cancelStream: () => void;
  reset: () => void;
}

/**
 * 🔥 NOVO: Calcula custo baseado em tokens e modelo
 */
function calculateCost(tokens: { prompt?: number; completion?: number }, model: string): number {
  const promptTokens = tokens.prompt || 0;
  const completionTokens = tokens.completion || 0;

  // Pricing Gemini 2.5 Pro (por 1K tokens)
  const GEMINI_PRICING = {
    input: 0.001875, // $0.001875 per 1K input tokens
    output: 0.00375, // $0.00375 per 1K output tokens
  };

  // Pricing GPT-4o-mini (por 1K tokens)
  const GPT_PRICING = {
    input: 0.00015, // $0.00015 per 1K input tokens
    output: 0.0006, // $0.0006 per 1K output tokens
  };

  const pricing = model.includes("gpt") ? GPT_PRICING : GEMINI_PRICING;

  const inputCost = (promptTokens / 1000) * pricing.input;
  const outputCost = (completionTokens / 1000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Processa uma linha de evento SSE
 */
function parseEventLine(line: string): StreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed?.startsWith("data: ")) return null;

  try {
    return JSON.parse(trimmed.slice(6)) as StreamEvent;
  } catch {
    return null;
  }
}

/**
 * Processa eventos do stream e atualiza estado
 */
function processStreamEvent(
  event: StreamEvent,
  contentRef: { current: string },
  tokensRef: { current: TokenMetrics | null }, // 🔥 NOVO
  setStreamingContent: React.Dispatch<React.SetStateAction<string>>,
  setProvider: React.Dispatch<React.SetStateAction<string | null>>,
  setTokens: React.Dispatch<React.SetStateAction<TokenMetrics | null>>, // 🔥 NOVO
  model: string, // 🔥 NOVO
  onChunk?: (chunk: string) => void,
  onComplete?: (fullContent: string, provider: string) => void,
  onTokens?: (tokens: TokenMetrics) => void // 🔥 NOVO
): void {
  if (event.type === "content" && event.content) {
    contentRef.current += event.content;
    setStreamingContent(contentRef.current);
    onChunk?.(event.content);

    // 🔥 NOVO: Atualizar métricas de tokens
    if (event.tokens?.total) {
      const metrics: TokenMetrics = {
        prompt: event.tokens.prompt || 0,
        completion: event.tokens.completion || 0,
        total: event.tokens.total,
        cost: calculateCost(event.tokens, model),
      };

      tokensRef.current = metrics;
      setTokens(metrics);
      onTokens?.(metrics);
    }
  } else if (event.type === "done") {
    setProvider(event.provider || null);
    onComplete?.(contentRef.current, event.provider || "unknown");
  } else if (event.type === "error") {
    throw new Error(event.message || "Erro desconhecido");
  }
}

/**
 * Lê o stream de resposta e processa os eventos
 */
async function processStreamResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  contentRef: { current: string },
  tokensRef: { current: TokenMetrics | null }, // 🔥 NOVO
  setStreamingContent: React.Dispatch<React.SetStateAction<string>>,
  setProvider: React.Dispatch<React.SetStateAction<string | null>>,
  setTokens: React.Dispatch<React.SetStateAction<TokenMetrics | null>>, // 🔥 NOVO
  model: string, // 🔥 NOVO
  onChunk?: (chunk: string) => void,
  onComplete?: (fullContent: string, provider: string) => void,
  onTokens?: (tokens: TokenMetrics) => void // 🔥 NOVO
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
      const event = parseEventLine(line);
      if (!event) continue;
      processStreamEvent(
        event,
        contentRef,
        tokensRef,
        setStreamingContent,
        setProvider,
        setTokens,
        model,
        onChunk,
        onComplete,
        onTokens
      );
    }
  }
}

export function useAIStreaming(options: UseAIStreamingOptions = {}): UseAIStreamingReturn {
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenMetrics | null>(null); // 🔥 NOVO

  const abortControllerRef = useRef<AbortController | null>(null);
  const contentRef = useRef("");
  const tokensRef = useRef<TokenMetrics | null>(null); // 🔥 NOVO

  const {
    onChunk,
    onComplete,
    onError,
    onTokens, // 🔥 NOVO
    model = "gpt-4o-mini",
    temperature = 0.7,
    maxTokens = 2000,
    agentId = "harvey-specter",
    sessionId,
    conversationTurn = 0,
  } = options;

  const reset = useCallback(() => {
    setStreamingContent("");
    setError(null);
    setProvider(null);
    setTokens(null); // 🔥 NOVO
    contentRef.current = "";
    tokensRef.current = null; // 🔥 NOVO
  }, []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const streamChat = useCallback(
    async (messages: Message[]): Promise<string> => {
      // Cancelar stream anterior se existir
      cancelStream();
      reset();

      setIsStreaming(true);
      contentRef.current = "";
      tokensRef.current = null; // 🔥 NOVO

      abortControllerRef.current = new AbortController();

      // 🔥 SENTRY AI MONITORING V2 - Instrumentação oficial
      const finalSessionId = sessionId || `harvey-${Date.now()}`;

      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

        // Criar span Sentry para rastrear a chamada LLM completa
        const result = await createChatSpan(
          {
            agentName: agentId,
            system: "gemini" as const,
            model,
            temperature,
            maxTokens,
          },
          messages,
          async (span) => {
            // Adicionar atributos de conversação ao span
            span?.setAttribute("conversation.session_id", finalSessionId);
            span?.setAttribute("conversation.turn", conversationTurn);

            const response = await fetch(`${baseUrl}/api/llm-stream`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens: maxTokens,
              }),
              signal: abortControllerRef.current!.signal,
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error("Streaming não suportado");
            }

            await processStreamResponse(
              reader,
              contentRef,
              tokensRef,
              setStreamingContent,
              setProvider,
              setTokens,
              model,
              onChunk,
              onComplete,
              onTokens
            );

            // 🔥 Adicionar métricas de tokens ao span (se disponível)
            if (tokensRef.current) {
              span?.setAttribute("gen_ai.usage.input_tokens", tokensRef.current.prompt);
              span?.setAttribute("gen_ai.usage.output_tokens", tokensRef.current.completion);
              span?.setAttribute("gen_ai.usage.total_tokens", tokensRef.current.total);
              span?.setAttribute("gen_ai.cost.total", tokensRef.current.cost);
            }

            // Adicionar resposta ao span
            span?.setAttribute("gen_ai.response.text", JSON.stringify([contentRef.current]));

            return contentRef.current;
          }
        );

        return result;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Cancelamento intencional, não é erro
          return contentRef.current;
        }

        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
        setError(errorMessage);
        onError?.(errorMessage);
        throw err;
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [
      model,
      temperature,
      maxTokens,
      onChunk,
      onComplete,
      onError,
      onTokens,
      cancelStream,
      reset,
      sessionId,
      conversationTurn,
      agentId,
    ]
  );

  return {
    streamingContent,
    isStreaming,
    error,
    provider,
    tokens, // 🔥 NOVO: Exportar métricas de tokens
    streamChat,
    cancelStream,
    reset,
  };
}

export default useAIStreaming;
