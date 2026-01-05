/**
 * Utilitários para manipulação de números de processo CNJ
 */

/**
 * Normaliza número de processo removendo caracteres não numéricos
 * @param numero - Número do processo no formato CNJ ou qualquer string
 * @returns String contendo apenas dígitos
 * @example
 * normalizeProcessNumber("1234567-89.2024.5.02.0999") // "12345678920245020999"
 */
export function normalizeProcessNumber(numero: string | undefined): string {
  if (!numero) return "";
  return numero.replace(/\D/g, "");
}

/**
 * Verifica se dois números de processo são equivalentes
 * Compara apenas os dígitos, ignorando formatação
 * @param num1 - Primeiro número de processo
 * @param num2 - Segundo número de processo
 * @returns true se os números são equivalentes
 * @example
 * processNumbersMatch("1234567-89.2024", "12345678920240000") // true
 */
export function processNumbersMatch(num1: string | undefined, num2: string | undefined): boolean {
  if (!num1 || !num2) return false;
  return normalizeProcessNumber(num1) === normalizeProcessNumber(num2);
}

/**
 * Formata número CNJ no padrão oficial
 * @param numero - Número do processo (apenas dígitos)
 * @returns String formatada no padrão NNNNNNN-DD.AAAA.J.TT.OOOO
 * @example
 * formatProcessNumber("12345678920245020999") // "1234567-89.2024.5.02.0999"
 */
export function formatProcessNumber(numero: string): string {
  const normalized = normalizeProcessNumber(numero);
  if (normalized.length !== 20) return numero; // Retorna original se não tiver 20 dígitos

  return `${normalized.slice(0, 7)}-${normalized.slice(7, 9)}.${normalized.slice(9, 13)}.${normalized.slice(13, 14)}.${normalized.slice(14, 16)}.${normalized.slice(16, 20)}`;
}

/**
 * Valida se um número de processo está no formato CNJ válido
 * @param numero - Número do processo
 * @returns true se o número é válido (20 dígitos)
 */
export function isValidProcessNumber(numero: string | undefined): boolean {
  if (!numero) return false;
  const normalized = normalizeProcessNumber(numero);
  return normalized.length === 20;
}
