/**
 * LangGraph Agent Base Class
 *
 * This module provides the base implementation for LangGraph-based agents.
 * It includes retry logic, timeout handling, and safe state management.
 *
 * Security Notes:
 * - Implements timeout protection to prevent hanging operations
 * - Automatic retry with exponential backoff
 * - No dynamic code execution (eval, Function constructor, etc.)
 * - All state mutations are immutable and type-safe
 *
 * Observability:
 * - Sentry AI Monitoring v2 integration
 * - OpenTelemetry semantic conventions
 * - Conversation tracking (sessionId, turn)
 *
 * Robustness (Baseado no Google Agent Starter Pack):
 * - Circuit Breaker para evitar cascata de falhas
 * - Graceful Degradation com fallback
 * - Métricas de execução por agente
 * - Structured Error Handling
 */

import { createChatSpan } from "@/lib/sentry-gemini-integration-v2";
import type { AgentState } from "./agent_state";
import { addMessage, updateState } from "./agent_state";
import {
  CircuitBreaker,
  agentMetrics,
  classifyGeminiError,
  createFallbackResponse,
  type ExecutionOutcome,
  type StructuredError,
} from "./agent_utils";

export interface LangGraphConfig {
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
  enableSentryTracing?: boolean;
  agentName?: string;
  enableCircuitBreaker?: boolean;
  enableGracefulDegradation?: boolean;
  circuitBreakerThreshold?: number;
}

export const DEFAULT_CONFIG: LangGraphConfig = {
  timeoutMs: 30000,
  maxRetries: 3,
  retryDelayMs: 1000,
  enableSentryTracing: true,
  agentName: "unknown-agent",
  enableCircuitBreaker: true,
  enableGracefulDegradation: true,
  circuitBreakerThreshold: 5,
};

const circuitBreakers = new Map<string, CircuitBreaker>();

export abstract class LangGraphAgent {
  protected config: LangGraphConfig;
  protected abortController: AbortController | null = null;
  protected sessionId: string;
  protected turnCounter: number = 0;
  protected circuitBreaker: CircuitBreaker;
  protected lastError: StructuredError | null = null;

  constructor(config: Partial<LangGraphConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = `${this.config.agentName}-${Date.now()}`;

    const agentName = this.config.agentName || "unknown-agent";
    if (!circuitBreakers.has(agentName)) {
      circuitBreakers.set(
        agentName,
        new CircuitBreaker(agentName, {
          failureThreshold: this.config.circuitBreakerThreshold,
          resetTimeoutMs: 30000,
        })
      );
    }
    this.circuitBreaker = circuitBreakers.get(agentName)!;
  }

  /**
   * Execute the agent with timeout, retry logic, circuit breaker e graceful degradation
   * Baseado nos padrões do Google Agent Starter Pack
   */
  async execute(state: AgentState): Promise<AgentState> {
    const startTime = Date.now();
    const agentName = this.config.agentName || "unknown-agent";

    try {
      const { result, wasDegraded } = await this.executeWithConfiguredResilience(state);
      const { outcome, isDegraded } = this.determineOutcome(result, wasDegraded);

      agentMetrics.recordExecution(
        agentName,
        outcome,
        Date.now() - startTime,
        isDegraded ? this.lastError || undefined : undefined
      );

      return result;
    } catch (error) {
      return this.handleExecuteFailure(state, agentName, startTime, error);
    }
  }

  private async executeWithConfiguredResilience(
    state: AgentState
  ): Promise<{ result: AgentState; wasDegraded: boolean }> {
    if (!this.config.enableCircuitBreaker) {
      const result = this.config.enableSentryTracing
        ? await this.executeWithTracing(state)
        : await this.executeInternal(state);
      return { result, wasDegraded: false };
    }

    let capturedError: unknown = null;
    let wasDegraded = false;

    const result = await this.circuitBreaker.execute(
      async () => {
        try {
          if (!this.config.enableSentryTracing) {
            return await this.executeInternal(state);
          }
          return await this.executeWithTracing(state);
        } catch (err) {
          capturedError = err;
          throw err;
        }
      },
      this.config.enableGracefulDegradation
        ? () => {
            wasDegraded = true;
            this.lastError = capturedError
              ? classifyGeminiError(capturedError)
              : classifyGeminiError(new Error("Circuit breaker open - service unavailable"));
            return this.createFallbackState(state, this.lastError);
          }
        : undefined
    );

    return { result, wasDegraded };
  }

  private determineOutcome(
    result: AgentState,
    wasDegraded: boolean
  ): { outcome: ExecutionOutcome; isDegraded: boolean } {
    const isDegraded = wasDegraded || result.data?.degraded === true;

    if (isDegraded) return { outcome: "degraded", isDegraded: true };
    if (result.error) return { outcome: "failure", isDegraded: false };
    return { outcome: "success", isDegraded: false };
  }

  private handleExecuteFailure(
    state: AgentState,
    agentName: string,
    startTime: number,
    error: unknown
  ): AgentState {
    this.lastError = classifyGeminiError(error);

    if (this.config.enableGracefulDegradation) {
      console.warn(`[${agentName}] Usando fallback após erro:`, this.lastError);
      agentMetrics.recordExecution(agentName, "degraded", Date.now() - startTime, this.lastError);
      return this.createFallbackState(state, this.lastError);
    }

    agentMetrics.recordExecution(agentName, "failure", Date.now() - startTime, this.lastError);
    return this.handleExecutionError(state, error);
  }

  /**
   * Cria estado de fallback para graceful degradation
   * Inclui erro estruturado para contexto
   */
  private createFallbackState(state: AgentState, error?: StructuredError): AgentState {
    const task = (state.data?.task as string) || "tarefa não especificada";
    const fallbackMessage = createFallbackResponse(this.config.agentName || "Agente", task);

    return updateState(state, {
      currentStep: "fallback",
      completed: true,
      error: error?.message,
      data: {
        ...state.data,
        degraded: true,
        fallbackUsed: true,
        circuitBreakerState: this.circuitBreaker.getState(),
        structuredError: error
          ? {
              code: error.code,
              message: error.message,
              recoverable: error.recoverable,
              suggestedAction: error.suggestedAction,
              timestamp: error.timestamp,
            }
          : undefined,
      },
      messages: [
        ...state.messages,
        {
          role: "assistant" as const,
          content: fallbackMessage,
          timestamp: Date.now(),
        },
      ],
    });
  }

  /**
   * Retorna o último erro estruturado
   */
  getLastError(): StructuredError | null {
    return this.lastError;
  }

  /**
   * Retorna status de saúde do agente
   */
  getHealthStatus() {
    return {
      ...agentMetrics.getHealthCheck(this.config.agentName || "unknown-agent"),
      circuitBreakerState: this.circuitBreaker.getState(),
      circuitBreakerHealth: this.circuitBreaker.getHealth(),
    };
  }

  /**
   * Execute with Sentry AI Monitoring tracing
   */
  private async executeWithTracing(state: AgentState): Promise<AgentState> {
    const messages = this.prepareMessages(state);

    try {
      const result = await createChatSpan<AgentState>(
        this.buildSpanConfig(),
        messages,
        async (span) => {
          this.addConversationTracking(span);
          const executedState = await this.executeInternal(state);
          this.addResponseTracking(span, executedState);
          this.addTokenTracking(span, executedState);

          this.turnCounter++;
          return executedState;
        }
      );

      return result;
    } catch (error) {
      return this.handleExecutionError(state, error);
    }
  }

  /**
   * Prepare messages for Sentry span
   */
  private prepareMessages(state: AgentState) {
    return state.messages.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: String(m.content),
    }));
  }

  /**
   * Build Sentry span configuration
   */
  private buildSpanConfig() {
    return {
      agentName: this.config.agentName || "unknown-agent",
      system: "gemini" as const,
      model: "gemini-2.5-pro",
      temperature: 0.7,
      maxTokens: 2000,
    };
  }

  /**
   * Add conversation tracking attributes to span
   */
  private addConversationTracking(span: any) {
    span?.setAttribute("conversation.session_id", this.sessionId);
    span?.setAttribute("conversation.turn", this.turnCounter);
    span?.setAttribute("gen_ai.agent.name", this.config.agentName || "unknown");
  }

  /**
   * Add response tracking to span
   */
  private addResponseTracking(span: any, executedState: AgentState) {
    if (!this.hasMessages(executedState)) {
      return;
    }

    const lastMessage = this.getLastMessage(executedState);
    span?.setAttribute(
      "gen_ai.response.text",
      JSON.stringify([{ role: lastMessage.role, content: lastMessage.content }])
    );
  }

  /**
   * Add token usage tracking to span
   */
  private addTokenTracking(span: any, executedState: AgentState) {
    const tokensUsed = executedState.data?.tokensUsed;
    if (tokensUsed) {
      span?.setAttribute("gen_ai.usage.total_tokens", tokensUsed);
    }
  }

  /**
   * Check if state has messages
   */
  private hasMessages(state: AgentState): boolean {
    return Boolean(state.messages && state.messages.length > 0);
  }

  /**
   * Get last message from state
   */
  private getLastMessage(state: AgentState) {
    return state.messages[state.messages.length - 1];
  }

  /**
   * Handle execution error
   */
  private handleExecutionError(state: AgentState, error: unknown): AgentState {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[${this.config.agentName}] Execution error:`, error);

    return updateState(state, {
      error: errorMessage,
      completed: true,
    });
  }

  /**
   * Internal execution logic (without tracing wrapper)
   */
  private async executeInternal(state: AgentState): Promise<AgentState> {
    let currentState = state;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      const result = await this.attemptExecution(currentState, attempt);

      if (result.success) {
        return result.state;
      }

      // Continue to next attempt if not the last one
      if (this.isLastAttempt(attempt)) {
        return result.state;
      }

      currentState = result.state;
      await this.applyBackoffDelay(attempt);
    }

    return currentState;
  }

  /**
   * Attempt single execution with timeout
   */
  private async attemptExecution(
    state: AgentState,
    attempt: number
  ): Promise<{ success: boolean; state: AgentState }> {
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      if (process.env.DEBUG_TESTS === "true") {
        console.debug(`[${this.config.agentName}] Attempt ${attempt} starting`);
      }
      this.abortController = new AbortController();
      timeoutId = this.setupTimeout();

      const resultState = await this.run(state, this.abortController.signal);

      if (process.env.DEBUG_TESTS === "true") {
        console.debug(`[${this.config.agentName}] Attempt ${attempt} succeeded`);
      }
      return { success: true, state: resultState };
    } catch (error) {
      const errorState = this.handleAttemptError(state, error, attempt);
      return { success: false, state: errorState };
    } finally {
      this.clearTimeout(timeoutId);
    }
  }

  /**
   * Setup execution timeout
   */
  private setupTimeout(): NodeJS.Timeout {
    return setTimeout(() => {
      this.abortController?.abort();
    }, this.config.timeoutMs);
  }

  /**
   * Clear timeout if exists
   */
  private clearTimeout(timeoutId: NodeJS.Timeout | null) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if current attempt is the last one
   */
  private isLastAttempt(attempt: number): boolean {
    return attempt === this.config.maxRetries;
  }

  /**
   * Handle error during execution attempt
   */
  private handleAttemptError(state: AgentState, error: unknown, attempt: number): AgentState {
    if (process.env.DEBUG_TESTS === "true") {
      console.debug(`[${this.config.agentName}] Attempt ${attempt} failed:`, error);
    }
    if (this.isLastAttempt(attempt)) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return updateState(state, {
        error: errorMessage,
        completed: true,
      });
    }

    return updateState(state, {
      retryCount: attempt + 1,
    });
  }

  /**
   * Apply exponential backoff delay
   */
  private async applyBackoffDelay(attempt: number): Promise<void> {
    const delay = this.config.retryDelayMs * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Abstract method to be implemented by concrete agents
   */
  protected abstract run(state: AgentState, signal: AbortSignal): Promise<AgentState>;

  /**
   * Safely abort the current execution
   */
  abort(): void {
    this.abortController?.abort();
  }

  /**
   * Helper to add a message to state
   */
  protected addAgentMessage(
    state: AgentState,
    content: string,
    role: "assistant" | "tool" = "assistant"
  ): AgentState {
    return addMessage(state, { role, content });
  }

  /**
   * Get current session ID for tracking
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current turn number
   */
  getTurnCounter(): number {
    return this.turnCounter;
  }
}
