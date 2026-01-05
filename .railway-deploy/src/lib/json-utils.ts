/**
 * Utilitários para extração e parsing seguro de JSON
 * Centraliza lógica duplicada em 10+ arquivos
 */

/**
 * Extrai JSON de texto que pode conter markdown ou outros caracteres
 * Substituição segura para regex /\{[\s\S]*\}/
 */
export function extractJSON(text: string): string | null {
  const startIdx = text.indexOf("{");
  if (startIdx === -1) return null;

  const endIdx = text.lastIndexOf("}");
  if (endIdx === -1 || endIdx <= startIdx) return null;

  return text.substring(startIdx, endIdx + 1);
}

/**
 * Extrai array JSON de texto
 */
export function extractJSONArray(text: string): string | null {
  const startIdx = text.indexOf("[");
  if (startIdx === -1) return null;

  const endIdx = text.lastIndexOf("]");
  if (endIdx === -1 || endIdx <= startIdx) return null;

  return text.substring(startIdx, endIdx + 1);
}

/**
 * Extrai JSON ou array de texto (tenta ambos)
 */
export function extractJSONOrArray(text: string): string | null {
  const objStart = text.indexOf("{");
  const arrStart = text.indexOf("[");

  // Se nenhum encontrado
  if (objStart === -1 && arrStart === -1) return null;

  // Se só objeto
  if (objStart !== -1 && arrStart === -1) return extractJSON(text);

  // Se só array
  if (arrStart !== -1 && objStart === -1) return extractJSONArray(text);

  // Ambos existem - pegar o primeiro
  if (objStart < arrStart) {
    return extractJSON(text);
  } else {
    return extractJSONArray(text);
  }
}

/**
 * Extrai conteúdo de code block markdown (```json ou ```)
 */
export function extractCodeBlock(text: string, language = ""): string | null {
  const marker = language ? `\`\`\`${language}` : "```";
  const startIdx = text.indexOf(marker);
  if (startIdx === -1) return null;

  const contentStart = startIdx + marker.length;
  const endIdx = text.indexOf("```", contentStart);
  if (endIdx === -1) return null;

  return text.substring(contentStart, endIdx).trim();
}

/**
 * Parse JSON com fallback para fixar JSON truncado/malformado
 */
export function parseJSONSafe<T = unknown>(jsonStr: string, fallback?: T): T | null {
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // Tentar limpar e parsear novamente
    const cleaned = jsonStr.trim();

    // Remover trailing commas
    const withoutTrailingCommas = cleaned.replaceAll(/,(\s*[}\]])/g, "$1");

    try {
      return JSON.parse(withoutTrailingCommas) as T;
    } catch {
      return fallback ?? null;
    }
  }
}

/**
 * Extrai e parseia JSON de resposta LLM
 * Combina limpeza de markdown + extração + parsing
 */
export function extractAndParseJSON<T = unknown>(response: string, fallback?: T): T | null {
  // 1. Tentar extrair de code block primeiro
  const codeBlock = extractCodeBlock(response, "json") || extractCodeBlock(response);
  if (codeBlock) {
    const parsed = parseJSONSafe<T>(codeBlock, fallback);
    if (parsed) return parsed;
  }

  // 2. Tentar extrair JSON direto
  const jsonStr = extractJSONOrArray(response);
  if (!jsonStr) return fallback ?? null;

  // 3. Parse
  return parseJSONSafe<T>(jsonStr, fallback);
}

/**
 * Remove markdown de texto (usado em respostas LLM)
 */
export function cleanMarkdown(text: string): string {
  return text
    .replaceAll(/```json\s*/g, "")
    .replaceAll(/```\s*/g, "")
    .replaceAll(/^\s*[\r\n]/gm, "")
    .trim();
}
