// lib/ai/http-llm-client.ts
// Cliente HTTP para comunicação com /api/llm-proxy (Spark LLM)

import type { ChatMessage, LlmClient } from "./core-agent";

export interface HttpLlmClientOptions {
  /** Ex: "https://assistente-juridico-github.vercel.app/api/llm-proxy" */
  baseUrl: string;
  apiKey?: string; // se o proxy exigir auth
  timeout?: number; // timeout em ms (padrão: 30s)
  maxRetries?: number; // número de tentativas (padrão: 3)
}

export class HttpLlmClient implements LlmClient {
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(private readonly opts: HttpLlmClientOptions) {
    this.timeout = opts.timeout ?? 30000; // 30s
    this.maxRetries = opts.maxRetries ?? 3;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const res = await fetch(this.opts.baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.opts.apiKey
              ? { Authorization: `Bearer ${this.opts.apiKey}` }
              : {}),
          },
          body: JSON.stringify({ messages }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erro no LLM proxy: ${res.status} - ${text}`);
        }

        const data = await res.json();
        // adapte se o seu /api/llm-proxy devolver outra chave:
        const content = data.answer ?? data.output ?? data.result ?? data.content ?? "";
        
        if (!content) {
          throw new Error("LLM retornou resposta vazia");
        }

        return String(content);
      } catch (e: unknown) {
        lastError = e instanceof Error ? e : new Error(String(e));
        
        // Se for erro de timeout ou rede, tenta novamente
        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    throw lastError ?? new Error("Falha ao comunicar com LLM após múltiplas tentativas");
  }
}
