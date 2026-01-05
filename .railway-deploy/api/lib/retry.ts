/**
 * Simple retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  initialMs = 200
): Promise<T> {
  let attempt = 0;
  let lastErr: unknown = undefined;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      attempt++;
      if (attempt > retries) break;
      const backoff = Math.floor(initialMs * Math.pow(2, attempt));
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

export default retryWithBackoff;
/**
 * Retry logic com backoff exponencial
 * Para operações que podem falhar temporariamente
 */

import { SafeLogger } from "./safe-logger.js";

const logger = new SafeLogger("Retry");

export interface RetryConfig {
  maxAttempts: number; // Número máximo de tentativas
  baseDelay: number; // Delay base em ms
  maxDelay: number; // Delay máximo em ms
  backoffFactor: number; // Fator de multiplicação do delay
  jitter: boolean; // Adicionar jitter aleatório
  retryCondition?: (error: Error) => boolean; // Condição para retry
}

export interface RetryStats {
  attempts: number;
  totalDelay: number;
  lastError?: Error;
  success: boolean;
}

/**
 * Erros que geralmente são retryáveis
 */
export const RETRYABLE_ERRORS: string[] = [
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EPIPE",
  "ECONNABORTED",
];

/**
 * Verifica se um erro é retryável
 */
export function isRetryableError(error: Error): boolean {
  const errorCode = (error as Error & { code?: string }).code;
  const errorName = error.name;

  // Erros de rede comuns
  if (errorCode && RETRYABLE_ERRORS.includes(errorCode)) {
    return true;
  }

  // Erros HTTP 5xx
  if (errorName === "HTTPError") {
    const statusCode = (error as Error & { statusCode?: number }).statusCode;
    if (typeof statusCode === "number" && statusCode >= 500 && statusCode < 600) {
      return true;
    }
  }

  // Timeouts
  if (errorName === "TimeoutError" || error.message.toLowerCase().includes("timeout")) {
    return true;
  }

  // Rate limits (mas com backoff maior)
  if (errorCode === "429" || error.message.toLowerCase().includes("rate limit")) {
    return true;
  }

  return false;
}

/**
 * Calcula delay para próxima tentativa
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
  const delay = Math.min(exponentialDelay, config.maxDelay);

  if (config.jitter) {
    // SECURITY: Math.random() é seguro aqui - usado apenas para jitter de retry,
    // não para geração de tokens/senhas. Não requer crypto.randomBytes().
    const jitterRange = delay * 0.25;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;
    return Math.max(0, delay + jitter);
  }

  return delay;
}

/**
 * Executa operação com retry
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<{ result: T; stats: RetryStats }> {
  const fullConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    jitter: true,
    retryCondition: isRetryableError,
    ...config,
  };

  let lastError: Error | null = null;
  let totalDelay = 0;

  for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
    try {
      const result = await operation();

      return {
        result,
        stats: {
          attempts: attempt,
          totalDelay,
          success: true,
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      // Verifica se deve tentar novamente
      const shouldRetry =
        attempt < fullConfig.maxAttempts &&
        (!fullConfig.retryCondition || fullConfig.retryCondition(err));

      if (!shouldRetry) {
        break;
      }

      // Calcula delay para próxima tentativa
      const delay = calculateDelay(attempt, fullConfig);
      totalDelay += delay;

      logger.warn(
        `Tentativa ${attempt}/${fullConfig.maxAttempts} falhou, tentando novamente em ${delay}ms`,
        { error: err.message, delay, totalDelay }
      );

      // Aguarda antes da próxima tentativa
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Todas as tentativas falharam
  throw new Error(
    `Operação falhou após ${fullConfig.maxAttempts} tentativas. Último erro: ${lastError?.message}`
  );
}

/**
 * Retry com configuração específica para APIs externas
 */
export const apiRetryConfig: Partial<RetryConfig> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
  retryCondition: (error) =>
    isRetryableError(error) ||
    error.message.toLowerCase().includes("fetch failed") ||
    error.message.toLowerCase().includes("network error"),
};

/**
 * Retry com configuração específica para DJEN API
 */
export const djenRetryConfig: Partial<RetryConfig> = {
  maxAttempts: 2,
  baseDelay: 2000,
  maxDelay: 15000,
  backoffFactor: 2,
  jitter: false, // DJEN não gosta de muitos requests simultâneos
  retryCondition: (error) => {
    const msg = error.message.toLowerCase();
    const statusCode = (error as Error & { statusCode?: number }).statusCode;

    return (
      error.name === "TimeoutError" ||
      msg.includes("timeout") ||
      (typeof statusCode === "number" && statusCode >= 500 && statusCode < 600)
    );
  },
};

/**
 * Retry com configuração específica para Spark API
 */
export const sparkRetryConfig: Partial<RetryConfig> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 8000,
  backoffFactor: 1.5,
  jitter: true,
  retryCondition: isRetryableError,
};

/**
 * Wrapper para operações HTTP com retry automático
 */
export async function httpWithRetry<T>(
  url: string,
  options: RequestInit,
  retryConfig: Partial<RetryConfig> = apiRetryConfig
): Promise<{ result: T; stats: RetryStats }> {
  return withRetry<T>(async () => {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as Error & { statusCode: number }).statusCode = response.status;
      throw error;
    }

    const json = (await response.json()) as T;
    return json;
  }, retryConfig);
}

/**
 * Classe para operações que precisam de retry stateful
 */
export class RetryableOperation<T> {
  private attempts = 0;
  private lastError?: Error;
  private readonly config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true,
      retryCondition: isRetryableError,
      ...config,
    };
  }

  async execute(operation: () => Promise<T>): Promise<T> {
    this.attempts++;

    try {
      const result = await operation();
      // Reset em caso de sucesso
      this.attempts = 0;
      this.lastError = undefined;
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.lastError = err;

      if (this.attempts >= this.config.maxAttempts) {
        throw new Error(`Operação falhou após ${this.attempts} tentativas: ${err.message}`);
      }

      const shouldRetry = !this.config.retryCondition || this.config.retryCondition(err);

      if (!shouldRetry) {
        throw err;
      }

      // Aguarda antes de tentar novamente
      const delay = calculateDelay(this.attempts, this.config);
      logger.warn(
        `RetryableOperation tentativa ${this.attempts}/${this.config.maxAttempts} em ${delay}ms`,
        { error: err.message, delay }
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      // Tenta novamente recursivamente
      return this.execute(operation);
    }
  }

  getAttempts(): number {
    return this.attempts;
  }

  getLastError(): Error | undefined {
    return this.lastError;
  }
}
