import type { PremonicaoJuridica, Process } from "@/types";

import { extractJSON } from "./json-utils";

/**
 * Gera a informação do processo formatada
 */
function buildProcessInfo(processData?: Process): string {
  if (!processData) return "";

  return `**Título:** ${processData.titulo}
**Autor:** ${processData.autor}
**Réu:** ${processData.reu}
**Status Atual:** ${processData.status}
**Comarca:** ${processData.comarca}
**Vara:** ${processData.vara}\n`;
}

/**
 * Extrai texto da resposta da API (suporta vários formatos)
 */
function extractResponseText(data: Record<string, unknown>): string {
  return (
    (data.response as { text?: string })?.text ??
    (data.response as string) ??
    (data.choices as Array<{ message?: { content?: string }; text?: string }>)?.[0]?.message
      ?.content ??
    (data.choices as Array<{ text?: string }>)?.[0]?.text ??
    (data.message as { content?: string })?.content ??
    ""
  );
}

/**
 * Corrige JSON truncado fechando strings e chaves abertas
 */
function fixTruncatedJson(truncated: string): Record<string, unknown> {
  let fixed = truncated;

  // PASSO 1: Fechar strings abertas PRIMEIRO (antes de adicionar chaves)
  const quoteCount = (fixed.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    fixed += '"';
  }

  // PASSO 2: Contar e adicionar chaves faltantes
  const openBraces = (fixed.match(/\{/g) || []).length;
  const closeBraces = (fixed.match(/\}/g) || []).length;
  fixed += "}".repeat(Math.max(0, openBraces - closeBraces));

  return JSON.parse(fixed) as Record<string, unknown>;
}

/**
 * Tenta extrair e parsear JSON truncado
 */
function tryParseTruncatedJson(cleaned: string): Record<string, unknown> | null {
  const jsonStr = extractJSON(cleaned);
  if (!jsonStr) return null;

  try {
    return fixTruncatedJson(jsonStr);
  } catch {
    console.warn(
      "[PremonicaoService] JSON truncado não pôde ser corrigido:",
      jsonStr.substring(0, 200)
    );
    return null;
  }
}

/**
 * Tenta extrair o primeiro bloco JSON da resposta
 */
function tryParseJsonBlock(cleaned: string): Record<string, unknown> | null {
  // Buscar JSON de forma segura sem regex greedy
  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;

  try {
    const jsonStr = cleaned.substring(startIdx, endIdx + 1);
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    return tryParseTruncatedJson(cleaned);
  }
}

/**
 * Limpa e faz parse do JSON da resposta
 */
function parseJsonResponse(responseText: string): Record<string, unknown> {
  // Remover markdown code blocks
  const cleaned = responseText
    .replaceAll(/```json\s*/gi, "")
    .replaceAll(/```\s*/g, "")
    .trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const parsed = tryParseJsonBlock(cleaned);
    if (parsed) return parsed;

    console.error("[PremonicaoService] Falha ao parsear JSON:", cleaned.substring(0, 500));
    throw new Error("Resposta não contém JSON reconhecível");
  }
}

/**
 * Normaliza a probabilidade para estar entre 0 e 100
 */
function normalizeProbability(value: unknown): number {
  let prob = Number(value);
  if (!Number.isFinite(prob)) prob = 50;
  return Math.min(100, Math.max(0, prob));
}

/**
 * Valida e faz fetch para API LLM
 */
async function fetchLLMResponse(promptText: string) {
  const response = await fetch("/api/llm-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemini-2.5-pro",
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente jurídico especializado em análise preditiva de processos judiciais brasileiros. Sempre responda apenas com JSON válido, sem markdown, sem comentários e sem texto fora do objeto JSON.",
        },
        { role: "user", content: promptText },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    console.error("[PremonicaoService] Erro na resposta:", response.status, response.statusText);
    throw new Error(`Erro na API: ${response.status}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}

/**
 * Valida se resposta foi truncada (finish_reason: max_tokens)
 */
function checkResponseTruncation(data: Record<string, unknown>): void {
  if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    return;
  }

  const firstChoice = data.choices[0] as Record<string, unknown>;
  if (firstChoice.finish_reason === "max_tokens") {
    console.warn(
      "[PremonicaoService] Resposta truncada (max_tokens). Considere aumentar max_tokens."
    );
    throw new Error(
      "Análise incompleta - resposta muito longa. Tente novamente com um processo mais simples."
    );
  }
}

/**
 * Normaliza os dados brutos do parse em PremonicaoJuridica
 */
function normalizePremonicaoData(cnj: string, parsed: Record<string, unknown>): PremonicaoJuridica {
  const prob = normalizeProbability(parsed.probabilidade_exito);
  const analise =
    typeof parsed.analise_ia === "string" && parsed.analise_ia.trim()
      ? parsed.analise_ia.trim()
      : "Análise não disponível";

  const estrategias: string[] = Array.isArray(parsed.estrategias_recomendadas)
    ? parsed.estrategias_recomendadas.filter(
        (e): e is string => typeof e === "string" && e.trim() !== ""
      )
    : [];

  type PrecedenteRaw = {
    id?: string;
    tribunal?: string;
    numero?: string;
    tema?: string;
    resumo_relevancia?: string;
    link?: string;
  };

  const precedentes: PremonicaoJuridica["precedentes_relevantes"] = Array.isArray(
    parsed.precedentes_relevantes
  )
    ? (parsed.precedentes_relevantes as PrecedenteRaw[]).map((p) => ({
        id: p.id || crypto.randomUUID(),
        tribunal: p.tribunal || "N/A",
        numero: p.numero || "N/A",
        tema: p.tema || "N/A",
        resumo_relevancia: p.resumo_relevancia || "N/A",
        link: p.link || "",
      }))
    : [];

  return {
    processo_cnj: cnj,
    probabilidade_exito: prob,
    analise_ia: analise,
    estrategias_recomendadas: estrategias,
    precedentes_relevantes: precedentes,
  };
}

export async function generatePremonicaoJuridica(
  cnj: string,
  processData?: Process
): Promise<PremonicaoJuridica> {
  const processInfo = buildProcessInfo(processData);

  const promptText = `Você é um assistente jurídico especializado em análise preditiva de processos judiciais brasileiros.

Analise o seguinte processo judicial e forneça uma estimativa completa de probabilidade de êxito:

**Processo CNJ:** ${cnj}
${processInfo}

Sua tarefa é retornar um objeto JSON com a seguinte estrutura EXATA (sem markdown, apenas o JSON):

{
  "probabilidade_exito": <número entre 0 e 100>,
  "analise_ia": "<explicação clara e objetiva em 200-500 caracteres sobre a análise do caso, considerando jurisprudência, fatos, e contexto jurídico brasileiro>",
  "estrategias_recomendadas": [
    "<estratégia processual específica 1>",
    "<estratégia processual específica 2>",
    "<estratégia processual específica 3>",
    "<estratégia processual específica 4 (opcional)>"
  ],
  "precedentes_relevantes": [
    {
      "id": "STJ - REsp XXXXX",
      "tribunal": "STJ",
      "numero": "REsp XXXXX",
      "tema": "<tema jurídico relevante>",
      "resumo_relevancia": "<resumo de 120-300 caracteres explicando por que este precedente é relevante para o caso>",
      "link": "https://processo.stj.jus.br/processo/julgamento/eletronico/documento/?num_registro=XXXXX"
    },
    {
      "id": "TRF1 - AC XXXXX",
      "tribunal": "TRF1",
      "numero": "AC XXXXX",
      "tema": "<tema jurídico relevante>",
      "resumo_relevancia": "<resumo de 120-300 caracteres>",
      "link": "https://www.trf1.jus.br/jurisprudencia"
    }
  ]
}

INSTRUÇÕES IMPORTANTES:
1. A probabilidade deve ser realista considerando jurisprudência brasileira
2. A análise deve mencionar pontos fortes E fracos do caso
3. As estratégias devem ser acionáveis e específicas para o direito brasileiro
4. Inclua 2-4 precedentes relevantes de tribunais superiores (STJ, STF, TRF)
5. Os links dos precedentes podem ser genéricos (URLs dos sites dos tribunais)
6. Use linguagem jurídica clara mas acessível
7. Considere prazos processuais e prescrição quando relevante

Retorne APENAS o objeto JSON, sem texto adicional antes ou depois.`;

  try {
    console.log("[PremonicaoService] Gerando análise preditiva para:", cnj);

    const data = await fetchLLMResponse(promptText);
    checkResponseTruncation(data);

    const responseText = extractResponseText(data);

    // Validações de resposta vazia
    if (!responseText || typeof responseText !== "string") {
      console.warn("[PremonicaoService] Resposta inválida:", {
        type: typeof responseText,
        isEmpty: !responseText,
        dataKeys: Object.keys(data),
        hasChoices: "choices" in data,
        dataPreview: JSON.stringify(data).substring(0, 500),
      });
      throw new Error(
        "Resposta vazia da API de IA. Verifique a chave API (Gemini API key reportada como leaked)."
      );
    }

    if (responseText.trim().length === 0) {
      console.warn("[PremonicaoService] Resposta vazia (string vazia)");
      throw new Error("Resposta vazia da API de IA. Tente novamente em alguns segundos.");
    }

    console.log(
      "[PremonicaoService] Resposta recebida (",
      responseText.length,
      "chars):",
      responseText.substring(0, 200)
    );

    const parsed = parseJsonResponse(responseText);
    return normalizePremonicaoData(cnj, parsed);
  } catch (error) {
    console.error("[PremonicaoService] Erro ao gerar premonição:", error);
    throw new Error("Não foi possível gerar a análise preditiva. Tente novamente.");
  }
}
