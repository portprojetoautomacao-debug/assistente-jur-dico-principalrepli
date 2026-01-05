/**
 * Cliente centralizado para chamar o Gemini 2.5 Pro via REST
 *
 * Este módulo fornece funções helpers para interagir com a API do Google Gemini,
 * permitindo reutilização em diversos módulos do sistema jurídico:
 * - Análise de contratos
 * - Gestão de prazos
 * - Redação de minutas
 * - Análise de intimações
 * - Pesquisa jurisprudencial
 *
 * @module gemini-client
 * @see https://ai.google.dev/api/rest
 */

/** Chave da API do Gemini (definida em .env) */
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

/** Modelo padrão do Gemini */
const GEMINI_MODEL = "gemini-2.5-pro";

/** URL base da API do Gemini */
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models";

/**
 * Configurações opcionais para chamadas ao Gemini
 */
export interface GeminiOptions {
  /** Modelo a ser usado (padrão: gemini-2.5-pro) */
  model?: string;
  /** Temperatura para geração (0-1, padrão: 0.7) */
  temperature?: number;
  /** Máximo de tokens na resposta */
  maxOutputTokens?: number;
  /** Top-P para amostragem */
  topP?: number;
  /** Top-K para amostragem */
  topK?: number;
}

/**
 * Resposta estruturada do Gemini
 */
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

/**
 * Verifica se a chave do Gemini está configurada
 * @throws {Error} Se a chave não estiver definida
 */
function ensureGeminiConfigured(): void {
  if (!GEMINI_API_KEY) {
    throw new Error("Chave do Gemini não configurada. Defina VITE_GEMINI_API_KEY no .env");
  }
}

/**
 * Verifica se a API do Gemini está disponível
 * @returns {boolean} true se configurada, false caso contrário
 */
export function isGeminiAvailable(): boolean {
  return Boolean(GEMINI_API_KEY);
}

/**
 * Chamada básica ao Gemini retornando o texto bruto (concatenado)
 *
 * @param prompt - O prompt a ser enviado para o modelo
 * @param options - Configurações opcionais da chamada
 * @returns O texto gerado pelo modelo
 * @throws {Error} Se a chave não estiver configurada ou houver erro na API
 *
 * @example
 * ```typescript
 * const resposta = await geminiGenerateText('Explique o artigo 5º da CF')
 * console.log(resposta)
 * ```
 */
export async function geminiGenerateText(
  prompt: string,
  options: GeminiOptions = {}
): Promise<string> {
  ensureGeminiConfigured();

  const model = options.model || GEMINI_MODEL;
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  };

  // Adiciona configuração de geração se houver opções customizadas
  if (
    options.temperature !== undefined ||
    options.maxOutputTokens !== undefined ||
    options.topP !== undefined ||
    options.topK !== undefined
  ) {
    requestBody.generationConfig = {
      ...(options.temperature !== undefined && {
        temperature: options.temperature,
      }),
      ...(options.maxOutputTokens !== undefined && {
        maxOutputTokens: options.maxOutputTokens,
      }),
      ...(options.topP !== undefined && { topP: options.topP }),
      ...(options.topK !== undefined && { topK: options.topK }),
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Erro ao chamar Gemini: ${res.status} ${res.statusText} ${errorText}`);
  }

  const data = (await res.json()) as GeminiResponse;

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("")
      .trim() ?? "";

  if (!text) {
    throw new Error("Resposta vazia do Gemini");
  }

  return text;
}

/**
 * Helper para prompts que retornam JSON estruturado.
 * - Envia o prompt
 * - Lê o texto de volta
 * - Tenta fazer JSON.parse
 * - Lida com blocos de código markdown (```json ... ```)
 *
 * @template T - Tipo esperado do JSON retornado
 * @param prompt - O prompt que deve retornar JSON
 * @param options - Configurações opcionais da chamada
 * @returns O objeto parseado do tipo T
 * @throws {Error} Se não retornar um JSON válido
 *
 * @example
 * ```typescript
 * interface Analise {
 *   risco: 'baixo' | 'medio' | 'alto'
 *   pontos: string[]
 * }
 *
 * const resultado = await geminiGenerateJSON<Analise>(`
 *   Analise este contrato e retorne JSON:
 *   ${textoContrato}
 * `)
 * console.log(resultado.risco)
 * ```
 */
export async function geminiGenerateJSON<T = unknown>(
  prompt: string,
  options: GeminiOptions = {}
): Promise<T> {
  const rawText = await geminiGenerateText(prompt, options);

  // Tenta extrair JSON de bloco de código markdown se presente
  let jsonText = rawText;
  const codeBlockStart = rawText.indexOf("```");
  const codeBlockEnd = rawText.indexOf("```", codeBlockStart + 3);
  if (codeBlockStart !== -1 && codeBlockEnd !== -1) {
    let blockContent = rawText.substring(codeBlockStart + 3, codeBlockEnd).trim();
    // Remove 'json' prefix if present
    if (blockContent.startsWith("json")) {
      blockContent = blockContent.substring(4).trim();
    }
    jsonText = blockContent;
  }

  try {
    const parsed = JSON.parse(jsonText) as T;
    return parsed;
  } catch (error) {
    console.error("Erro ao fazer parse do JSON retornado pelo Gemini:", {
      rawPreview: rawText.slice(0, 400),
      parseError: error,
    });
    throw new Error(
      "A IA não retornou um JSON válido. Tente novamente ou ajuste o prompt/entrada."
    );
  }
}

/**
 * Gera texto com contexto de sistema (system instruction)
 *
 * @param systemPrompt - Instrução de sistema para o modelo
 * @param userPrompt - Prompt do usuário
 * @param options - Configurações opcionais da chamada
 * @returns O texto gerado pelo modelo
 *
 * @example
 * ```typescript
 * const resposta = await geminiGenerateWithSystem(
 *   'Você é um advogado especialista em direito trabalhista.',
 *   'Qual o prazo para ajuizar ação trabalhista?'
 * )
 * ```
 */
export async function geminiGenerateWithSystem(
  systemPrompt: string,
  userPrompt: string,
  options: GeminiOptions = {}
): Promise<string> {
  ensureGeminiConfigured();

  const model = options.model || GEMINI_MODEL;
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody: Record<string, unknown> = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
  };

  // Adiciona configuração de geração se houver opções customizadas
  if (
    options.temperature !== undefined ||
    options.maxOutputTokens !== undefined ||
    options.topP !== undefined ||
    options.topK !== undefined
  ) {
    requestBody.generationConfig = {
      ...(options.temperature !== undefined && {
        temperature: options.temperature,
      }),
      ...(options.maxOutputTokens !== undefined && {
        maxOutputTokens: options.maxOutputTokens,
      }),
      ...(options.topP !== undefined && { topP: options.topP }),
      ...(options.topK !== undefined && { topK: options.topK }),
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Erro ao chamar Gemini: ${res.status} ${res.statusText} ${errorText}`);
  }

  const data = (await res.json()) as GeminiResponse;

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("")
      .trim() ?? "";

  if (!text) {
    throw new Error("Resposta vazia do Gemini");
  }

  return text;
}

/**
 * Gera JSON com contexto de sistema
 *
 * @template T - Tipo esperado do JSON retornado
 * @param systemPrompt - Instrução de sistema para o modelo
 * @param userPrompt - Prompt do usuário que deve retornar JSON
 * @param options - Configurações opcionais da chamada
 * @returns O objeto parseado do tipo T
 *
 * @example
 * ```typescript
 * const analise = await geminiGenerateJSONWithSystem<RiskAnalysis>(
 *   'Você é um advogado especialista em contratos.',
 *   `Analise este contrato: ${texto}. Retorne JSON com riskLevel e risks.`
 * )
 * ```
 */
export async function geminiGenerateJSONWithSystem<T = unknown>(
  systemPrompt: string,
  userPrompt: string,
  options: GeminiOptions = {}
): Promise<T> {
  const rawText = await geminiGenerateWithSystem(systemPrompt, userPrompt, options);

  // Tenta extrair JSON de bloco de código markdown se presente
  let jsonText = rawText;
  const codeBlockStart = rawText.indexOf("```");
  const codeBlockEnd = rawText.indexOf("```", codeBlockStart + 3);
  if (codeBlockStart !== -1 && codeBlockEnd !== -1) {
    let blockContent = rawText.substring(codeBlockStart + 3, codeBlockEnd).trim();
    if (blockContent.startsWith("json")) {
      blockContent = blockContent.substring(4).trim();
    }
    jsonText = blockContent;
  }

  try {
    const parsed = JSON.parse(jsonText) as T;
    return parsed;
  } catch (error) {
    console.error("Erro ao fazer parse do JSON retornado pelo Gemini:", {
      rawPreview: rawText.slice(0, 400),
      parseError: error,
    });
    throw new Error(
      "A IA não retornou um JSON válido. Tente novamente ou ajuste o prompt/entrada."
    );
  }
}

/**
 * Analisa tokens usados em uma resposta (útil para monitoramento de custos)
 *
 * @param prompt - Prompt para análise
 * @returns Métricas de uso de tokens
 */
export async function geminiCountTokens(prompt: string): Promise<{
  promptTokens: number;
  estimatedCost: number;
}> {
  ensureGeminiConfigured();

  const url = `${GEMINI_API_URL}/${GEMINI_MODEL}:countTokens?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Erro ao contar tokens: ${res.status}`);
  }

  const data = (await res.json()) as { totalTokens?: number };
  const tokens = data.totalTokens || 0;

  // Estimativa de custo baseada em preços públicos do Gemini Pro
  // (ajustar conforme pricing atual)
  const estimatedCost = tokens * 0.000001; // exemplo: $0.001 por 1000 tokens

  return {
    promptTokens: tokens,
    estimatedCost,
  };
}
