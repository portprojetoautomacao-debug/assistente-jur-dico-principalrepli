// lib/ai/circuit-breaker.ts
// Circuit Breaker Pattern para resiliência de APIs
// Baseado em: Netflix Hystrix, resilience4j patterns

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Número de falhas para abrir circuito
  successThreshold: number;      // Sucessos necessários para fechar
  timeout: number;               // Tempo em ms para tentar HALF_OPEN
  resetTimeout: number;          // Tempo para resetar contadores
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  lastStateChange: number;
}

/**
 * Circuit Breaker para proteção de APIs externas
 * Estados: CLOSED (normal) → OPEN (bloqueado) → HALF_OPEN (teste)
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailureTime?: number;
  private lastStateChange = Date.now();
  private readonly config: CircuitBreakerConfig;
  private readonly name: string;

  constructor(name: string, config?: Partial<CircuitBreakerConfig>) {
    this.name = name;
    this.config = {
      failureThreshold: config?.failureThreshold ?? 5,
      successThreshold: config?.successThreshold ?? 2,
      timeout: config?.timeout ?? 60000, // 60s
      resetTimeout: config?.resetTimeout ?? 300000, // 5min
    };
  }

  /**
   * Executa função protegida por circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Se circuito está OPEN, rejeitar imediatamente
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - (this.lastFailureTime ?? 0);

      // Se passou o timeout, tentar HALF_OPEN
      if (timeSinceLastFailure >= this.config.timeout) {
        this.state = 'HALF_OPEN';
        this.lastStateChange = Date.now();
        console.log(`[CircuitBreaker:${this.name}] OPEN → HALF_OPEN (tentando recuperação)`);
      } else {
        throw new Error(`Circuit breaker OPEN: ${this.name} (retry em ${Math.ceil((this.config.timeout - timeSinceLastFailure) / 1000)}s)`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Registra sucesso
   */
  private onSuccess() {
    this.failures = 0;

    if (this.state === 'HALF_OPEN') {
      this.successes++;

      // Se atingiu threshold de sucessos, fechar circuito
      if (this.successes >= this.config.successThreshold) {
        this.state = 'CLOSED';
        this.successes = 0;
        this.lastStateChange = Date.now();
        console.log(`[CircuitBreaker:${this.name}] HALF_OPEN → CLOSED (recuperado)`);
      }
    }
  }

  /**
   * Registra falha
   */
  private onFailure() {
    this.lastFailureTime = Date.now();
    this.failures++;
    this.successes = 0;

    // Se atingiu threshold de falhas, abrir circuito
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.lastStateChange = Date.now();
      console.error(`[CircuitBreaker:${this.name}] CLOSED → OPEN (${this.failures} falhas consecutivas)`);
    }

    // Se estava HALF_OPEN e falhou, voltar para OPEN
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.lastStateChange = Date.now();
      console.error(`[CircuitBreaker:${this.name}] HALF_OPEN → OPEN (falha na recuperação)`);
    }
  }

  /**
   * Força reset do circuit breaker
   */
  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.lastStateChange = Date.now();
    console.log(`[CircuitBreaker:${this.name}] RESET manual`);
  }

  /**
   * Obtém estatísticas atuais
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
    };
  }

  /**
   * Verifica se circuito está disponível
   */
  isAvailable(): boolean {
    return this.state !== 'OPEN';
  }
}

/**
 * Registry de circuit breakers para todas as APIs
 */
export class CircuitBreakerRegistry {
  private static readonly breakers = new Map<string, CircuitBreaker>();

  /**
   * Obtém ou cria circuit breaker
   */
  static get(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(name);

    if (!breaker) {
      breaker = new CircuitBreaker(name, config);
      this.breakers.set(name, breaker);
    }

    return breaker;
  }

  /**
   * Lista todos os circuit breakers
   */
  static getAll(): Map<string, CircuitBreakerStats> {
    const stats = new Map<string, CircuitBreakerStats>();

    this.breakers.forEach((breaker, name) => {
      stats.set(name, breaker.getStats());
    });

    return stats;
  }

  /**
   * Reseta todos os circuit breakers
   */
  static resetAll() {
    this.breakers.forEach((breaker) => {
      breaker.reset();
    });
  }
}
