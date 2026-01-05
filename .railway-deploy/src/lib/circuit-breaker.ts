/**
 * Circuit Breaker - Proteção para APIs Externas
 *
 * Implementa o padrão Circuit Breaker para proteger chamadas a APIs externas.
 * Estados: CLOSED (normal), OPEN (bloqueado), HALF_OPEN (testando).
 *
 * @module circuit-breaker
 * @version 1.0.0
 * @since 2025-01-04
 *
 * @example
 * ```typescript
 * const circuitBreaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeout: 30000
 * });
 * const result = await circuitBreaker.execute(() => callGeminiAPI());
 * ```
 */

export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export interface CircuitBreakerConfig {
  failureThreshold?: number;
  successThreshold?: number;
  resetTimeout?: number;
  halfOpenMaxCalls?: number;
  timeout?: number;
  name?: string;
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
  onFailure?: (error: Error) => void;
  onSuccess?: () => void;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly state: CircuitState,
    public readonly nextAttemptMs?: number
  ) {
    super(message);
    this.name = "CircuitBreakerError";
  }
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private lastStateChange = Date.now();
  private halfOpenCalls = 0;
  private totalCalls = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;

  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly resetTimeout: number;
  private readonly halfOpenMaxCalls: number;
  private readonly timeout: number;
  private readonly name: string;
  private readonly onStateChange?: (from: CircuitState, to: CircuitState) => void;
  private readonly onFailure?: (error: Error) => void;
  private readonly onSuccess?: () => void;

  constructor(config: CircuitBreakerConfig = {}) {
    this.failureThreshold = config.failureThreshold ?? 5;
    this.successThreshold = config.successThreshold ?? 2;
    this.resetTimeout = config.resetTimeout ?? 30000;
    this.halfOpenMaxCalls = config.halfOpenMaxCalls ?? 3;
    this.timeout = config.timeout ?? 30000;
    this.name = config.name ?? "default";
    this.onStateChange = config.onStateChange;
    this.onFailure = config.onFailure;
    this.onSuccess = config.onSuccess;
  }

  /**
   * Executa uma função protegida pelo circuit breaker.
   *
   * @param fn - Função async a ser executada
   * @returns Resultado da função
   * @throws CircuitBreakerError se circuito está aberto
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalCalls++;

    if (!this.canExecute()) {
      const nextAttemptMs = this.getNextAttemptTime();
      throw new CircuitBreakerError(
        `Circuit breaker "${this.name}" is ${this.state}. ` +
          `Next attempt in ${Math.ceil(nextAttemptMs / 1000)}s`,
        this.state,
        nextAttemptMs
      );
    }

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++;
    }

    try {
      const result = await this.executeWithTimeout(fn);
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Verifica se uma execução é permitida no estado atual.
   */
  canExecute(): boolean {
    this.checkStateTransition();

    switch (this.state) {
      case CircuitState.CLOSED:
        return true;
      case CircuitState.OPEN:
        return false;
      case CircuitState.HALF_OPEN:
        return this.halfOpenCalls < this.halfOpenMaxCalls;
      default:
        return false;
    }
  }

  /**
   * Obtém o estado atual do circuit breaker.
   */
  getState(): CircuitState {
    this.checkStateTransition();
    return this.state;
  }

  /**
   * Obtém estatísticas do circuit breaker.
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Força a transição para um estado específico.
   */
  forceState(newState: CircuitState): void {
    this.transitionTo(newState);
  }

  /**
   * Reseta o circuit breaker para o estado inicial.
   */
  reset(): void {
    this.failures = 0;
    this.successes = 0;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.halfOpenCalls = 0;
    this.transitionTo(CircuitState.CLOSED);
  }

  /**
   * Obtém tempo até próxima tentativa quando circuito está aberto.
   */
  getNextAttemptTime(): number {
    if (this.state !== CircuitState.OPEN) {
      return 0;
    }
    const elapsed = Date.now() - this.lastStateChange;
    return Math.max(0, this.resetTimeout - elapsed);
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Circuit breaker "${this.name}" timeout after ${this.timeout}ms`));
      }, this.timeout);

      fn()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private recordSuccess(): void {
    this.successes++;
    this.totalSuccesses++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;
    this.lastSuccessTime = Date.now();

    this.onSuccess?.();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.consecutiveSuccesses >= this.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  private recordFailure(error: Error): void {
    this.failures++;
    this.totalFailures++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = Date.now();

    this.onFailure?.(error);

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      if (this.consecutiveFailures >= this.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  private checkStateTransition(): void {
    if (this.state === CircuitState.OPEN) {
      const elapsed = Date.now() - this.lastStateChange;
      if (elapsed >= this.resetTimeout) {
        this.transitionTo(CircuitState.HALF_OPEN);
      }
    }
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state === newState) return;

    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();

    if (newState === CircuitState.HALF_OPEN) {
      this.halfOpenCalls = 0;
      this.consecutiveSuccesses = 0;
    } else if (newState === CircuitState.CLOSED) {
      this.failures = 0;
      this.consecutiveFailures = 0;
      this.halfOpenCalls = 0;
    }

    this.onStateChange?.(oldState, newState);

    console.log(`[CircuitBreaker:${this.name}] State changed: ${oldState} -> ${newState}`);
  }
}

const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(name: string, config?: CircuitBreakerConfig): CircuitBreaker {
  let cb = circuitBreakers.get(name);
  if (!cb) {
    cb = new CircuitBreaker({ ...config, name });
    circuitBreakers.set(name, cb);
  }
  return cb;
}

export function resetAllCircuitBreakers(): void {
  for (const cb of circuitBreakers.values()) {
    cb.reset();
  }
}

export function getAllCircuitBreakerStats(): Record<string, CircuitBreakerStats> {
  const stats: Record<string, CircuitBreakerStats> = {};
  for (const [name, cb] of circuitBreakers.entries()) {
    stats[name] = cb.getStats();
  }
  return stats;
}

export const geminiCircuitBreaker = new CircuitBreaker({
  name: "gemini",
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeout: 30000,
  timeout: 30000,
  onStateChange: (from, to) => {
    console.warn(`[Gemini API] Circuit breaker: ${from} -> ${to}`);
  },
  onFailure: (error) => {
    console.error(`[Gemini API] Call failed:`, error.message);
  },
});

export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  config?: CircuitBreakerConfig
): Promise<T> {
  const cb = getCircuitBreaker(name, config);
  return cb.execute(fn);
}
