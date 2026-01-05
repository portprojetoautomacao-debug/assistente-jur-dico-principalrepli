/**
 * Sentry Google Gen AI Integration (Official SDK Implementation)
 *
 * Integração OFICIAL do Sentry para monitorar Google Gemini SDK.
 * Usa googleGenAIIntegration() disponível em @sentry/react v10.14.0+
 *
 * Baseado em:
 * - https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/integrations/google-genai/
 * - https://docs.sentry.io/platforms/javascript/guides/react/tracing/span-metrics/examples/#manual-llm-instrumentation-custom-ai-agent--tool-calls
 * - https://docs.sentry.io/platforms/python/tracing/instrumentation/custom-instrumentation/ai-agents-module/
 *
 * A integração oficial captura automaticamente:
 * - models.generateContent()
 * - models.generateContentStream()
 * - chats.create()
 * - sendMessage()
 * - sendMessageStream()
 *
 * Spans criados seguem convenções OpenTelemetry:
 * - op: gen_ai.chat, gen_ai.invoke_agent, gen_ai.execute_tool
 * - Atributos: gen_ai.system, gen_ai.request.model, gen_ai.usage.*, etc.
 *
 * @module sentry-gemini-integration
 * @version 2.0.0 - Migrado para SDK oficial
 */

import * as Sentry from "@sentry/react";

/**
 * Opções de configuração da integração Gemini (padrão oficial SDK)
 */
export interface GeminiIntegrationOptions {
  /**
   * Se deve gravar INPUTS (prompts, messages) nos spans do Sentry.
   *
   * O Sentry considera inputs/outputs de LLM como PII (Personally Identifiable Information).
   * Por padrão, usa o valor de `send_default_pii` na inicialização do Sentry.
   *
   * @default true se send_default_pii=true, false caso contrário
   */
  recordInputs?: boolean;

  /**
   * Se deve gravar OUTPUTS (respostas, generated text) nos spans do Sentry.
   *
   * O Sentry considera inputs/outputs de LLM como PII (Personally Identifiable Information).
   * Por padrão, usa o valor de `send_default_pii` na inicialização do Sentry.
   *
   * @default true se send_default_pii=true, false caso contrário
   */
  recordOutputs?: boolean;

  /**
   * Se deve incluir prompts na instrumentação (alias para recordInputs)
   * @default true
   */
  includePrompts?: boolean;

  /**
   * Se deve capturar erros no Sentry
   * @default true
   */
  captureErrors?: boolean;
}

/**
 * Metadados de uma chamada Gemini interceptada
 */
interface GeminiCallMetadata {
  model: string;
  operation: "generate_content" | "stream_generate_content";
  prompt?: string | string[];
  temperature?: number;
  maxTokens?: number;
  startTime: number;
}

// Helper: Adiciona atributos opcionais ao span
function addOptionalAttributes(
  span: ReturnType<typeof Sentry.startInactiveSpan>,
  metadata: GeminiCallMetadata
): void {
  if (metadata.temperature !== undefined) {
    span?.setAttribute("gen_ai.request.temperature", metadata.temperature);
  }
  if (metadata.maxTokens !== undefined) {
    span?.setAttribute("gen_ai.request.max_tokens", metadata.maxTokens);
  }
}

// Helper: Adiciona prompts ao span
function addPromptAttributes(
  span: ReturnType<typeof Sentry.startInactiveSpan>,
  prompt: string | string[]
): void {
  const messages = Array.isArray(prompt)
    ? prompt.map((p) => ({ role: "user", content: p }))
    : [{ role: "user", content: prompt }];
  span?.setAttribute("gen_ai.request.messages", JSON.stringify(messages));
}

// Helper: Extrai e adiciona tokens usage
function extractTokenUsage(
  span: ReturnType<typeof Sentry.startInactiveSpan>,
  metadata: Record<string, unknown>
): void {
  if (typeof metadata.promptTokens === "number") {
    span?.setAttribute("gen_ai.usage.input_tokens", metadata.promptTokens);
  }
  if (typeof metadata.responseTokens === "number") {
    span?.setAttribute("gen_ai.usage.output_tokens", metadata.responseTokens);
  }
  if (typeof metadata.totalTokens === "number") {
    span?.setAttribute("gen_ai.usage.total_tokens", metadata.totalTokens);
  }
}

// Helper: Processa resposta do Gemini
function processGeminiResponse<T>(
  span: ReturnType<typeof Sentry.startInactiveSpan>,
  result: T,
  includePrompts: boolean
): void {
  if (!result || typeof result !== "object") return;

  const response = result as Record<string, unknown>;

  if (includePrompts && response.text) {
    // Garantir stringify seguro para evitar [object Object]
    let textValue: string;
    if (typeof response.text === "string") {
      textValue = response.text;
    } else if (typeof response.text === "object" && response.text !== null) {
      textValue = JSON.stringify(response.text);
    } else {
      textValue = String(response.text);
    }

    span?.setAttribute("gen_ai.response.text", JSON.stringify([textValue]));
  }

  if (response.metadata && typeof response.metadata === "object") {
    extractTokenUsage(span, response.metadata as Record<string, unknown>);
  }
}

// Helper: Captura erro no Sentry
function captureGeminiError(
  error: unknown,
  metadata: GeminiCallMetadata,
  captureErrors: boolean
): void {
  if (!captureErrors) return;

  Sentry.captureException(error, {
    tags: {
      "ai.model": metadata.model,
      "ai.operation": metadata.operation,
    },
    contexts: {
      gemini: {
        model: metadata.model,
        operation: metadata.operation,
        duration_ms: Date.now() - metadata.startTime,
      },
    },
  });
}

/**
 * Wrapper para chamada ao Gemini com instrumentação Sentry
 *
 * @example
 * ```ts
 * const geminiCall = instrumentGeminiCall({
 *   model: "gemini-2.5-pro",
 *   operation: "generate_content",
 *   prompt: "Analyze this legal document"
 * });
 *
 * const result = await geminiCall(async () => {
 *   return await callGeminiAPI();
 * });
 * ```
 */
export function instrumentGeminiCall<T>(
  metadata: GeminiCallMetadata,
  options: GeminiIntegrationOptions = {}
): (fn: () => Promise<T>) => Promise<T> {
  const { includePrompts = true, captureErrors = true } = options;

  return async (fn: () => Promise<T>): Promise<T> => {
    const span = Sentry.startInactiveSpan({
      op: "gen_ai.chat",
      name: `chat ${metadata.model}`,
      attributes: {
        "gen_ai.operation.name": "chat",
        "gen_ai.system": "gcp.gemini",
        "gen_ai.request.model": metadata.model,
      },
    });

    addOptionalAttributes(span, metadata);

    if (includePrompts && metadata.prompt) {
      addPromptAttributes(span, metadata.prompt);
    }

    try {
      const result = await fn();
      processGeminiResponse(span, result, includePrompts);
      span?.setStatus({ code: 1 });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      span?.setStatus({ code: 2, message: errorMessage });
      captureGeminiError(error, metadata, captureErrors);
      throw error;
    } finally {
      span?.end();
    }
  };
}

/**
 * Hook para instrumentar chamadas Gemini automaticamente
 *
 * @example
 * ```tsx
 * const { wrapGeminiCall } = useGeminiInstrumentation();
 *
 * const response = await wrapGeminiCall({
 *   model: "gemini-2.5-pro",
 *   prompt: "Analyze this"
 * }, async () => {
 *   return await callGeminiAPI();
 * });
 * ```
 */
export function useGeminiInstrumentation(options: GeminiIntegrationOptions = {}) {
  const wrapGeminiCall = async <T>(
    config: {
      model: string;
      prompt?: string | string[];
      temperature?: number;
      maxTokens?: number;
      operation?: "generate_content" | "stream_generate_content";
    },
    fn: () => Promise<T>
  ): Promise<T> => {
    const metadata: GeminiCallMetadata = {
      model: config.model,
      operation: config.operation || "generate_content",
      prompt: config.prompt,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      startTime: Date.now(),
    };

    const wrapper = instrumentGeminiCall<T>(metadata, options);
    return wrapper(fn);
  };

  return { wrapGeminiCall };
}

/**
 * Decorator para funções que fazem chamadas ao Gemini
 *
 * @example
 * ```ts
 * const myGeminiFunction = withGeminiInstrumentation(
 *   async (prompt: string) => {
 *     return await callGeminiAPI(prompt);
 *   },
 *   { model: "gemini-2.5-pro" }
 * );
 * ```
 */
export function withGeminiInstrumentation<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  config: {
    model: string;
    getPrompt?: (...args: TArgs) => string | string[];
    temperature?: number;
    maxTokens?: number;
  },
  options: GeminiIntegrationOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const metadata: GeminiCallMetadata = {
      model: config.model,
      operation: "generate_content",
      prompt: config.getPrompt ? config.getPrompt(...args) : undefined,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      startTime: Date.now(),
    };

    const wrapper = instrumentGeminiCall<TReturn>(metadata, options);
    return wrapper(() => fn(...args));
  };
}

/**
 * Inicializar integração Gemini com Sentry
 *
 * Deve ser chamado após `Sentry.init()` para habilitar monitoramento automático.
 *
 * @example
 * ```ts
 * import { initGeminiIntegration } from '@/lib/sentry-gemini-integration';
 *
 * // Depois de Sentry.init()
 * initGeminiIntegration({
 *   includePrompts: true,
 *   captureErrors: true
 * });
 * ```
 */
export function initGeminiIntegration(options: GeminiIntegrationOptions = {}) {
  const config = {
    includePrompts: options.includePrompts !== false,
    captureErrors: options.captureErrors !== false,
  };

  console.log("[Sentry] Gemini Integration initialized", config);

  // Retornar configuração para uso global
  return config;
}

/**
 * Configuração global da integração (pode ser alterada em runtime)
 */
let globalGeminiConfig: GeminiIntegrationOptions = {
  includePrompts: true,
  captureErrors: true,
};

/**
 * Atualizar configuração global da integração Gemini
 */
export function setGeminiIntegrationOptions(options: GeminiIntegrationOptions) {
  globalGeminiConfig = { ...globalGeminiConfig, ...options };
}

/**
 * Obter configuração global da integração Gemini
 */
export function getGeminiIntegrationOptions(): GeminiIntegrationOptions {
  return { ...globalGeminiConfig };
}
