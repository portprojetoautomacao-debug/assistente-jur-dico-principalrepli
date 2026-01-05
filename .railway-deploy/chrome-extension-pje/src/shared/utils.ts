/**
 * Utilitários compartilhados
 */

import { CNJ_CLEAN_REGEX } from "./constants";

/**
 * Remove formatação do número CNJ
 */
export function cleanProcessNumber(numero: string): string {
  return numero.replace(/\D/g, "");
}

/**
 * Valida número CNJ (20 dígitos)
 */
export function isValidCNJ(numero: string): boolean {
  const clean = cleanProcessNumber(numero);
  return CNJ_CLEAN_REGEX.test(clean) && clean.length === 20;
}

/**
 * Formata número CNJ
 */
export function formatCNJ(numero: string): string {
  const clean = cleanProcessNumber(numero);
  if (clean.length !== 20) return numero;

  const match = clean.match(/^(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})$/);
  if (!match) return numero;

  const [, nnnnnnn, dd, aaaa, j, tr, oooo] = match;
  return `${nnnnnnn}-${dd}.${aaaa}.${j}.${tr}.${oooo}`;
}

/**
 * Parse data brasileira para Date
 */
export function parseDate(dateStr: string): Date {
  // Formatos: "05/12/2025 14:03", "05/12/2025"
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (match) {
    const [, day, month, year, hour = "0", minute = "0"] = match;
    return new Date(
      Number.parseInt(year),
      Number.parseInt(month) - 1,
      Number.parseInt(day),
      Number.parseInt(hour),
      Number.parseInt(minute)
    );
  }
  return new Date();
}

/**
 * Formata timestamp relativo
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Agora mesmo";
  if (minutes === 1) return "Há 1 minuto";
  if (minutes < 60) return `Há ${minutes} minutos`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "Há 1 hora";
  if (hours < 24) return `Há ${hours} horas`;

  return date.toLocaleString("pt-BR");
}

/**
 * Sleep async
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function com backoff exponencial
 */
export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (attempts <= 1) throw error;
    await sleep(delay);
    return retry(fn, attempts - 1, delay * 2);
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = undefined;
      func(...args);
    };

    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
}
