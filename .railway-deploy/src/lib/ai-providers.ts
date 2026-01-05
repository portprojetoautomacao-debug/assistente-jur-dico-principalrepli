/**
 * Multi-Provider AI Integration
 *
 * Sistema unificado de integração com múltiplos provedores de IA para o
 * Assistente Jurídico PJe. Implementa padrão de fallback automático.
 *
 * @module ai-providers
 * @version 2.1.0
 * @since 2025-11-28
 *
 * Provedores suportados (em ordem de prioridade):
 * 1. Gemini 2.5 Pro (principal) - Google AI
 * 2. GitHub Models (free tier) - Azure-hosted
 * 3. Hugging Face Inference API (free tier)
 * 4. Azure OpenAI (quando assinatura ativa)
 *
 * Funcionalidades:
 * - Fallback automático entre provedores
 * - Retry com exponential backoff
 * - Validação centralizada de API keys
 * - Logging detalhado para debug
 *
 * @example
 * ```typescript
 * import { aiClient } from '@/lib/ai-providers'
 *
 * const result = await aiClient.chat(
 *   [
 *     { role: 'user', content: 'Analise este contrato...' }
 *   ],
 *   { provider: 'gemini', model: 'gemini-2.5-pro' }
 * )
 * ```
 */

// ============================================================================
// TYPES & CONFIG
// ============================================================================

/** Mensagens em formato OpenAI-style */
export type AIChatRole = "system" | "user" | "assistant";

export interface AIChatMessage {
  role: AIChatRole;
  content: string;
}

/** Provedores suportados */
export type AIProvider = "gemini" | "azure" | "huggingface" | "github";

/** Configuração de modelo de IA */
export interface AIModelConfig {
  /** Provedor de IA a ser utilizado */
  provider: AIProvider;
  /** Nome/ID do modelo */
  model: string;
  /** Chave de API (opcional, usa env vars por padrão) */
  apiKey?: string;
  /** Endpoint customizado (opcional) */
  endpoint?: string;
}

/** Configuração de retry para chamadas de API */
export interface RetryConfig {
  /** Número máximo de tentativas (default: 3) */
  maxRetries: number;
  /** Delay inicial em ms (default: 1000) */
  initialDelay: number;
  /** Fator de multiplicação do delay (default: 2) */
  backoffFactor: number;
  /** Delay máximo em ms (default: 10000) */
  maxDelay: number;
}

/** Configuração padrão de retry */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffFactor: 2,
  maxDelay: 10000,
};

// Azure AI Configuration (quando assinatura ativa)
export const AZURE_AI_CONFIG = {
  endpoint: "https://thiagobodevanveiga-1800-resource.cognitiveservices.azure.com/",
  resourceGroup: "rg-thiagobodevanveiga-1800",
  resourceName: "thiagobodevanveiga-1800-resource",
  deployments: {
    // alias → deployment name
    "gpt-4": "gpt-4.1",
    embedding: "text-embedding-3-small",
  },
};

// Hugging Face Configuration (free tier)
export const HUGGINGFACE_CONFIG = {
  baseUrl: "https://api-inference.huggingface.co/models",
  models: {
    "qwen-7b": "Qwen/Qwen2.5-7B-Instruct",
    "qwen-1.5b": "Qwen/Qwen2.5-1.5B-Instruct",
    "phi-3": "microsoft/Phi-3-mini-4k-instruct",
    "mistral-7b": "mistralai/Mistral-7B-Instruct-v0.3",
    "llama-8b": "meta-llama/Llama-3.1-8B-Instruct",
  },
};

// GitHub Models Configuration (free com GitHub)
export const GITHUB_MODELS_CONFIG = {
  baseUrl: "https://models.inference.ai.azure.com",
  models: {
    "gpt-4o": "gpt-4o",
    "gpt-4o-mini": "gpt-4o-mini",
    "phi-3": "Phi-3-mini-4k-instruct",
    "llama-8b": "Meta-Llama-3.1-8B-Instruct",
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Executa uma função com retry e exponential backoff.
 * Útil para lidar com falhas temporárias de API.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, initialDelay, backoffFactor, maxDelay } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Não faz retry se for erro de autenticação ou configuração
      const msg = lastError.message || "";
      if (
        msg.includes("API key") ||
        msg.includes("não configurada") ||
        msg.includes("401") ||
        msg.includes("403")
      ) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        console.warn(
          `[AI Provider] Tentativa ${attempt}/${maxRetries} falhou. ` +
            `Retry em ${delay}ms. Erro: ${msg}`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }
  }

  throw lastError || new Error("Todas as tentativas falharam");
}

/**
 * Valida se uma string parece ser uma API key válida.
 * Verifica padrões comuns de chaves de API.
 */
export function isValidApiKey(key: string | null | undefined, provider?: string): boolean {
  if (!key || key.length < 10) return false;

  // Validações específicas por provedor
  switch (provider) {
    case "gemini":
      // Chaves Gemini: AIza... ou GEM-...
      return /^(AIza[\w-]{20,}|GEM-[\w-]{16,}|[\w-]{32,})$/.test(key);
    case "github":
      // Tokens GitHub: ghp_... ou gho_...
      return /^(ghp_|gho_|github_pat_)\w{20,}$/.test(key) || key.length >= 20;
    case "huggingface":
      // Tokens HuggingFace: hf_...
      return /^hf_\w{20,}$/.test(key) || key.length >= 20;
    case "azure":
      // Chaves Azure: 32 caracteres hex
      return /^[\da-f]{32}$/i.test(key) || key.length >= 20;
    default:
      // Validação genérica: pelo menos 20 caracteres alfanuméricos
      return key.length >= 20;
  }
}

// ============================================================================
// GEMINI CLIENT (PRINCIPAL - GEMINI 2.5 PRO)
// ============================================================================

/**
 * Cliente para API do Google Gemini (Gemini 2.5 Pro)
 *
 * Responsável por toda comunicação com a API Generative Language do Google.
 * Implementa retry automático e validação de API key.
 */
export class GeminiClient {
  private readonly apiKey: string | null;
  private readonly baseUrl = "https://generativelanguage.googleapis.com/v1/models";
  private readonly retryConfig: RetryConfig;

  /**
   * Cria uma instância do GeminiClient.
   *
   * @param apiKey - Chave de API (opcional, usa env vars por padrão)
   * @param retryConfig - Configuração de retry (opcional)
   */
  constructor(apiKey?: string, retryConfig?: Partial<RetryConfig>) {
    // Tenta pegar API key de forma flexível (suporta Vite e Node.js)
    if (apiKey) {
      this.apiKey = String(apiKey);
    } else {
      // Primeiro tenta process.env (Node.js), depois import.meta.env (Vite)
      const processEnvKey =
        typeof process !== "undefined" && process.env
          ? process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
          : null;

      const importMetaEnvKey =
        typeof import.meta !== "undefined" && import.meta.env
          ? (import.meta.env.VITE_GEMINI_API_KEY ?? import.meta.env.VITE_GEMINI_API_KEY_BACKEND)
          : null;

      const envKey = processEnvKey || importMetaEnvKey;
      this.apiKey = envKey ? String(envKey) : null;
    }

    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

    // Valida a chave no construtor (apenas warning, não bloqueia)
    if (this.apiKey && !isValidApiKey(this.apiKey, "gemini")) {
      console.warn("[GeminiClient] API key pode estar em formato inválido");
    }
  }

  /**
   * Verifica se o cliente está configurado com uma API key.
   */
  isConfigured(): boolean {
    return !!this.apiKey && isValidApiKey(this.apiKey, "gemini");
  }

  /**
   * Converte mensagens OpenAI-style em um texto único com rótulos.
   * Mantém o contexto sistema/usuário/assistente.
   */
  private buildPromptFromMessages(messages: AIChatMessage[]): string {
    return messages
      .map((m) => {
        if (m.role === "system") return `# Sistema\n${m.content}`;
        if (m.role === "user") return `# Usuário\n${m.content}`;
        return `# Assistente\n${m.content}`;
      })
      .join("\n\n");
  }

  /**
   * Envia uma conversa para o modelo Gemini e retorna a resposta (texto).
   *
   * - Default de modelo: gemini-2.5-pro
   * - Usa endpoint oficial: v1/models/gemini-2.5-pro:generateContent
   * - Extrai texto de candidates[0].content.parts[].text
   */
  async chat(
    model: string,
    messages: AIChatMessage[],
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        "Gemini API key não configurada. " +
          "Configure uma das variáveis: VITE_GEMINI_API_KEY, VITE_GEMINI_API_KEY_BACKEND ou VITE_GOOGLE_API_KEY (deprecated)"
      );
    }

    const modelId = model || "gemini-2.5-pro";
    const prompt = this.buildPromptFromMessages(messages);

    const url = `${this.baseUrl}/${modelId}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const doRequest = async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: options.maxTokens || 1024,
            temperature: options.temperature ?? 0.7,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} ${errorText}`);
      }

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const parts = data.candidates?.[0]?.content?.parts || [];
      const text = parts
        .map((p) => p.text || "")
        .join("\n")
        .trim();

      if (!text) {
        throw new Error("Gemini retornou resposta vazia");
      }

      return text;
    };

    return withRetry(doRequest, this.retryConfig);
  }

  /**
   * Verifica disponibilidade básica do modelo gemini-2.5-pro
   * com uma chamada "ping" barata.
   */
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    const url = `${
      this.baseUrl
    }/gemini-2.5-pro:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    try {
      const ok = await withRetry(
        async () => {
          const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: "ping" }] }],
              generationConfig: { maxOutputTokens: 1, temperature: 0 },
            }),
          });
          return resp.ok;
        },
        { maxRetries: 2, initialDelay: 500, maxDelay: 1500 }
      );

      return ok;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// HUGGING FACE CLIENT
// ============================================================================

/**
 * Hugging Face Inference Client
 * Free tier: ~30k tokens/mês
 */
export class HuggingFaceClient {
  private readonly apiKey: string | null;
  private readonly baseUrl = HUGGINGFACE_CONFIG.baseUrl;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || (import.meta?.env?.VITE_HUGGINGFACE_API_KEY ?? "") || null;
  }

  async chat(
    model: string,
    messages: AIChatMessage[],
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<string> {
    const modelId =
      HUGGINGFACE_CONFIG.models[model as keyof typeof HUGGINGFACE_CONFIG.models] || model;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    const prompt =
      messages
        .map((m) => {
          if (m.role === "system") return `<|system|>\n${m.content}`;
          if (m.role === "user") return `<|user|>\n${m.content}`;
          return `<|assistant|>\n${m.content}`;
        })
        .join("\n") + "\n<|assistant|>\n";

    const doRequest = async () => {
      const response = await fetch(`${this.baseUrl}/${modelId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: options.maxTokens || 1024,
            temperature: options.temperature ?? 0.7,
            return_full_text: false,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HuggingFace API error: ${error}`);
      }

      const result = await response.json();

      if (Array.isArray(result)) {
        return result[0]?.generated_text || "";
      }

      return result.generated_text || "";
    };

    return withRetry(doRequest, { maxRetries: 2, initialDelay: 1000 });
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/microsoft/Phi-3-mini-4k-instruct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs: "Hi",
          parameters: { max_new_tokens: 1 },
        }),
      });
      // 503 = modelo carregando, mas endpoint existe
      return response.ok || response.status === 503;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// GITHUB MODELS CLIENT
// ============================================================================

/**
 * GitHub Models Client
 * Free com conta GitHub
 */
export class GitHubModelsClient {
  private readonly apiKey: string;
  private readonly baseUrl = GITHUB_MODELS_CONFIG.baseUrl;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    } else {
      const processEnvKey =
        typeof process !== "undefined" && process.env
          ? process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN
          : null;
      const importMetaEnvKey =
        typeof import.meta !== "undefined" && import.meta.env
          ? import.meta.env.VITE_GITHUB_TOKEN
          : null;
      this.apiKey = processEnvKey || importMetaEnvKey || "";
    }
  }

  async chat(
    model: string,
    messages: AIChatMessage[],
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("GitHub Models token ausente (VITE_GITHUB_TOKEN)");
    }

    const modelId =
      GITHUB_MODELS_CONFIG.models[model as keyof typeof GITHUB_MODELS_CONFIG.models] || model;

    const doRequest = async () => {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          max_tokens: options.maxTokens || 1024,
          temperature: options.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub Models API error: ${error}`);
      }

      const result = await response.json();
      return result.choices?.[0]?.message?.content || "";
    };

    return withRetry(doRequest, { maxRetries: 2, initialDelay: 1000 });
  }
}

// ============================================================================
// AZURE OPENAI CLIENT
// ============================================================================

/**
 * Azure OpenAI Client
 * Requer assinatura Azure ativa
 */
export class AzureOpenAIClient {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly apiVersion = "2024-02-15-preview";

  constructor(endpoint?: string, apiKey?: string) {
    this.endpoint = endpoint || AZURE_AI_CONFIG.endpoint;
    if (apiKey) {
      this.apiKey = apiKey;
    } else {
      const processEnvKey =
        typeof process !== "undefined" && process.env
          ? process.env.AZURE_OPENAI_KEY || process.env.VITE_AZURE_OPENAI_KEY
          : null;
      const importMetaEnvKey =
        typeof import.meta !== "undefined" && import.meta.env
          ? import.meta.env.VITE_AZURE_OPENAI_KEY
          : null;
      this.apiKey = processEnvKey || importMetaEnvKey || "";
    }
  }

  /**
   * deploymentOrAlias:
   * - 'gpt-4', 'embedding', etc. → mapeia via AZURE_AI_CONFIG.deployments
   * - se não houver alias, usa valor bruto como nome do deployment
   */
  async chat(
    deploymentOrAlias: string,
    messages: AIChatMessage[],
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Azure OpenAI API key não configurada (VITE_AZURE_OPENAI_KEY)");
    }

    const deployments = AZURE_AI_CONFIG.deployments;
    const deployment =
      deployments[deploymentOrAlias as keyof typeof deployments] || deploymentOrAlias;

    const url = `${this.endpoint}openai/deployments/${deployment}/chat/completions?api-version=${this.apiVersion}`;

    const doRequest = async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey,
        },
        body: JSON.stringify({
          messages,
          max_tokens: options.maxTokens || 1024,
          temperature: options.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Azure OpenAI API error: ${error}`);
      }

      const result = await response.json();
      return result.choices?.[0]?.message?.content || "";
    };

    return withRetry(doRequest, { maxRetries: 2, initialDelay: 1000 });
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.endpoint}openai/models?api-version=${this.apiVersion}`, {
        headers: { "api-key": this.apiKey },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// UNIFIED AI CLIENT (GEMINI FIRST)
// ============================================================================

/**
 * UnifiedAIClient
 *
 * - Provedor principal: Gemini (gemini-2.5-pro)
 * - Fallbacks: GitHub → HuggingFace → Azure
 *
 * Uso:
 *   const { content, provider, model } = await aiClient.chat(messages, {
 *     provider: 'gemini' | 'github' | 'huggingface' | 'azure',
 *     model: 'gemini-2.5-pro' | 'gpt-4o' | ...
 *   })
 */
export class UnifiedAIClient {
  private readonly gemini: GeminiClient;
  private readonly huggingface: HuggingFaceClient;
  private readonly github: GitHubModelsClient;
  private readonly azure: AzureOpenAIClient;
  private preferredProvider: AIModelConfig["provider"] = "gemini";

  constructor() {
    this.gemini = new GeminiClient();
    this.huggingface = new HuggingFaceClient();
    this.github = new GitHubModelsClient();
    this.azure = new AzureOpenAIClient();
  }

  setPreferredProvider(provider: AIModelConfig["provider"]) {
    this.preferredProvider = provider;
  }

  async chat(
    messages: AIChatMessage[],
    options: {
      model?: string;
      provider?: AIModelConfig["provider"];
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<{ content: string; provider: string; model: string }> {
    const requested = options.provider || this.preferredProvider;

    // Monta lista de provedores, sem duplicatas, na ordem de preferência:
    // pedido → gemini → github → huggingface → azure
    const rawOrder: AIModelConfig["provider"][] = [
      requested,
      "gemini",
      "github",
      "huggingface",
      "azure",
    ];

    const providers: AIModelConfig["provider"][] = [];
    for (const p of rawOrder) {
      if (!providers.includes(p)) providers.push(p);
    }

    for (const p of providers) {
      try {
        let content: string;
        let model: string;

        switch (p) {
          case "gemini": {
            model = options.model || "gemini-2.5-pro";
            content = await this.gemini.chat(model, messages, options);
            return { content, provider: "gemini", model };
          }

          case "github": {
            model = options.model || "gpt-4o-mini";
            content = await this.github.chat(model, messages, options);
            return { content, provider: "github", model };
          }

          case "huggingface": {
            model = options.model || "phi-3";
            content = await this.huggingface.chat(model, messages, options);
            return { content, provider: "huggingface", model };
          }

          case "azure": {
            if (await this.azure.isAvailable()) {
              // Usa alias lógico, mapeado dentro do AzureOpenAIClient
              model = options.model || "gpt-4";
              content = await this.azure.chat(model, messages, options);
              return { content, provider: "azure", model };
            }
            continue;
          }

          default:
            continue;
        }
      } catch (error) {
        console.warn(`Provider ${p} failed:`, error);
        continue;
      }
    }

    throw new Error("All AI providers failed");
  }

  async getAvailableProviders(): Promise<string[]> {
    const available: string[] = [];

    if (await this.gemini.isAvailable()) {
      available.push("gemini");
    }

    if (await this.huggingface.isAvailable()) {
      available.push("huggingface");
    }

    if (import.meta?.env?.VITE_GITHUB_TOKEN) {
      available.push("github");
    }

    if (await this.azure.isAvailable()) {
      available.push("azure");
    }

    return available;
  }
}

// Singleton para uso direto no app
export const aiClient = new UnifiedAIClient();
