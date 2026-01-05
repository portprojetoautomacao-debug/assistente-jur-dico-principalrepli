/**
 * Biblioteca de regex seguros e utilitários de string
 * Centraliza padrões usados em múltiplos arquivos
 */

/**
 * Parse número OAB no formato "OAB/UF 123456" ou "OAB UF 123456"
 * Usado em: api/cron.ts, api/lib/djen-client.ts, src/lib/djen-api.ts, src/lib/cron.ts
 *
 * Regex seguro: /OAB\s?\/\s?([A-Z]{2})\s+(\d+)/i
 */
export function parseOAB(text: string): { uf: string; numero: string } | null {
  const regex = /OAB\s?\/?\s?([A-Z]{2})\s+(\d+)/i;
  const match = regex.exec(text);

  if (!match) return null;

  return {
    uf: match[1].toUpperCase(),
    numero: match[2],
  };
}

/**
 * Parse número CNJ (padrão: NNNNNNN-DD.AAAA.J.TT.OOOO)
 * Usado em múltiplos arquivos
 */
export function parseCNJ(text: string): string | null {
  const regex = /(\d{7}-?\d{2}\.?\d{4}\.?\d\.?\d{2}\.?\d{4})/;
  const match = regex.exec(text);
  return match ? match[1] : null;
}

/**
 * Valida número CNJ completo
 */
export function isValidCNJ(numero: string): boolean {
  // Formato: NNNNNNN-DD.AAAA.J.TT.OOOO
  const regex = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
  return regex.test(numero);
}

/**
 * Formata número CNJ (adiciona pontuação se necessário)
 */
export function formatCNJ(numero: string): string {
  // Remove tudo que não é dígito ou hífen
  const cleaned = numero.replaceAll(/[^\d-]/g, "");

  // Se já está formatado
  if (/^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/.test(numero)) {
    return numero;
  }

  // Formatar: NNNNNNNDDAAAAJTTOOOO → NNNNNNN-DD.AAAA.J.TT.OOOO
  if (cleaned.length === 20) {
    return `${cleaned.slice(0, 7)}-${cleaned.slice(7, 9)}.${cleaned.slice(9, 13)}.${cleaned.slice(13, 14)}.${cleaned.slice(14, 16)}.${cleaned.slice(16, 20)}`;
  }

  return numero; // Retorna original se não conseguir formatar
}

/**
 * Extrai múltiplos números CNJ de texto
 */
export function extractAllCNJ(text: string): string[] {
  const regex = /\d{7}-?\d{2}\.?\d{4}\.?\d\.?\d{2}\.?\d{4}/g;
  const matches: string[] = [];

  for (const match of text.matchAll(regex)) {
    matches.push(match[0]);
  }

  return matches;
}

/**
 * Parse partes do processo (autor vs réu)
 * Detecta padrões "X vs Y", "X x Y", "X v. Y"
 */
export function parsePartes(text: string): { autor: string; reu: string } | null {
  // Usar split ao invés de regex complexo - limitar espaços
  const parts = text.split(/\s{1,2}(?:vs?\.?|x)\s{1,2}/i);

  if (parts.length !== 2) return null;

  return {
    autor: parts[0].trim(),
    reu: parts[1].trim(),
  };
}

/**
 * Extrai variáveis de template {{variavel}}
 * Seguro: usa matchAll ao invés de exec loop
 */
export function extractTemplateVariables(content: string): string[] {
  const regex = /\{\{([^}]{1,50})\}\}/g;
  const variables: string[] = [];

  for (const match of content.matchAll(regex)) {
    variables.push(match[1].trim());
  }

  return variables;
}

/**
 * Substitui variáveis de template
 */
export function replaceTemplateVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(String.raw`\{\{\s*${key}\s*\}\}`, "g");
    result = result.replace(regex, value);
  }

  return result;
}
