/**
 * Tracing Service - OpenTelemetry Compatible
 *
 * Provides distributed tracing for AI agents and LLM operations.
 * Compatible with:
 * - OpenTelemetry
 * - Sentry
 * - Azure Monitor / Application Insights
 * - Microsoft Foundry
 * - Datadog
 *
 * @author Assistente Jurídico PJe
 */

// Trace Span Types
export type SpanKind = "internal" | "server" | "client" | "producer" | "consumer";
export type SpanStatus = "unset" | "ok" | "error";

// Trace Context for distributed tracing
export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  traceFlags: number;
  traceState?: string;
}

// Span Attributes (OpenTelemetry compatible)
export interface SpanAttributes {
  [key: string]: string | number | boolean | string[] | number[] | undefined;
}

// Span Event
export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: SpanAttributes;
}

// Span Link
export interface SpanLink {
  context: TraceContext;
  attributes?: SpanAttributes;
}

// Complete Span Structure
export interface Span {
  name: string;
  kind: SpanKind;
  context: TraceContext;
  parentContext?: TraceContext;
  startTime: number;
  endTime?: number;
  status: SpanStatus;
  statusMessage?: string;
  attributes: SpanAttributes;
  events: SpanEvent[];
  links: SpanLink[];
}

// Agent-specific trace types
export interface AgentSpan extends Span {
  agentId: string;
  agentName: string;
  sessionId?: string;
  stepNumber?: number;
  toolsUsed?: string[];
  tokensUsed?: number;
  cost?: number;
}

// LLM-specific trace types
export interface LLMSpan extends Span {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  temperature?: number;
  maxTokens?: number;
  responseTime: number;
}

// Trace Exporter Interface
export interface TraceExporter {
  name: string;
  export(spans: Span[]): Promise<void>;
  shutdown(): Promise<void>;
}

/**
 * Console Exporter - For development/debugging
 */
class ConsoleExporter implements TraceExporter {
  name = "console";

  async export(spans: Span[]): Promise<void> {
    spans.forEach((span) => {
      const duration = span.endTime ? span.endTime - span.startTime : 0;
      console.log(
        `[TRACE] ${span.name} | ${span.kind} | ${duration}ms | ${span.status}`,
        span.attributes
      );
    });
  }

  async shutdown(): Promise<void> {
    // No cleanup needed
  }
}

/**
 * Memory Exporter - Stores traces in memory for querying
 */
class MemoryExporter implements TraceExporter {
  readonly name = "memory";
  private spans: Span[] = [];
  private readonly maxSpans = 1000;

  async export(spans: Span[]): Promise<void> {
    this.spans.push(...spans);
    // Keep only last maxSpans
    if (this.spans.length > this.maxSpans) {
      this.spans = this.spans.slice(-this.maxSpans);
    }
  }

  async shutdown(): Promise<void> {
    this.spans = [];
  }

  getSpans(): Span[] {
    return [...this.spans];
  }

  getSpansByTraceId(traceId: string): Span[] {
    return this.spans.filter((s) => s.context.traceId === traceId);
  }

  getSpansByName(name: string): Span[] {
    return this.spans.filter((s) => s.name.includes(name));
  }

  clear(): void {
    this.spans = [];
  }
}

/**
 * HTTP Exporter - Sends traces to remote endpoint
 */
class HTTPExporter implements TraceExporter {
  readonly name = "http";
  private readonly endpoint: string;
  private readonly headers: Record<string, string>;

  constructor(endpoint: string, headers: Record<string, string> = {}) {
    this.endpoint = endpoint;
    this.headers = headers;
  }

  async export(spans: Span[]): Promise<void> {
    try {
      await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.headers,
        },
        body: JSON.stringify({ spans }),
      });
    } catch (error) {
      console.error("[Tracing] Failed to export spans:", error);
    }
  }

  async shutdown(): Promise<void> {
    // No cleanup needed
  }
}

/**
 * Tracing Service Class
 */
class TracingService {
  private readonly exporters: TraceExporter[] = [];
  private readonly activeSpans: Map<string, Span> = new Map();
  private readonly memoryExporter: MemoryExporter;
  private enabled = true;
  private samplingRate = 1; // 100% by default

  constructor() {
    this.memoryExporter = new MemoryExporter();
    this.exporters.push(this.memoryExporter);

    // Add console exporter in development (supports both Vite and Node.js)
    const isDev =
      (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") ||
      (typeof import.meta !== "undefined" && import.meta.env?.DEV);
    if (isDev) {
      this.exporters.push(new ConsoleExporter());
    }
  }

  /**
   * Generate unique trace ID (W3C compatible)
   */
  generateTraceId(): string {
    // Use crypto.randomUUID() and convert to hex string (32 chars)
    return crypto.randomUUID().replace(/-/g, "");
  }

  /**
   * Generate unique span ID
   */
  generateSpanId(): string {
    // Generate 16 hex chars using crypto
    return crypto.randomUUID().replace(/-/g, "").substring(0, 16);
  }

  /**
   * Create trace context
   */
  createTraceContext(parentContext?: TraceContext): TraceContext {
    return {
      traceId: parentContext?.traceId || this.generateTraceId(),
      spanId: this.generateSpanId(),
      parentSpanId: parentContext?.spanId,
      traceFlags: 1, // Sampled
    };
  }

  /**
   * Start a new span
   */
  startSpan(
    name: string,
    options: {
      kind?: SpanKind;
      parentContext?: TraceContext;
      attributes?: SpanAttributes;
      links?: SpanLink[];
    } = {}
  ): Span {
    // Tracing desabilitado => span no-op
    if (!this.enabled) {
      return this.createNoOpSpan(name);
    }

    // Sampling check using crypto for better randomness
    const randomValue = crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1);
    if (randomValue > this.samplingRate) {
      // Return a no-op span
      return this.createNoOpSpan(name);
    }

    const context = this.createTraceContext(options.parentContext);

    const span: Span = {
      name,
      kind: options.kind || "internal",
      context,
      parentContext: options.parentContext,
      startTime: Date.now(),
      status: "unset",
      attributes: options.attributes || {},
      events: [],
      links: options.links || [],
    };

    this.activeSpans.set(context.spanId, span);
    return span;
  }

  /**
   * Create no-op span for unsampled/disabled traces
   */
  private createNoOpSpan(name: string): Span {
    return {
      name,
      kind: "internal",
      context: {
        traceId: "00000000000000000000000000000000",
        spanId: "0000000000000000",
        traceFlags: 0,
      },
      startTime: Date.now(),
      status: "unset",
      attributes: {},
      events: [],
      links: [],
    };
  }

  /**
   * End a span
   */
  async endSpan(span: Span, status?: SpanStatus, statusMessage?: string): Promise<void> {
    // No-op span (não amostrado ou tracing off)
    if (span.context.traceFlags === 0) {
      return;
    }

    span.endTime = Date.now();
    span.status = status || "ok";
    span.statusMessage = statusMessage;

    this.activeSpans.delete(span.context.spanId);

    // Export to all exporters
    await Promise.all(
      this.exporters.map((exporter) =>
        exporter
          .export([span])
          .catch((err) => console.error(`[Tracing] ${exporter.name} export failed:`, err))
      )
    );
  }

  /**
   * Add event to span
   */
  addEvent(span: Span, name: string, attributes?: SpanAttributes): void {
    span.events.push({
      name,
      timestamp: Date.now(),
      attributes,
    });
  }

  /**
   * Set span attribute
   */
  setAttribute(span: Span, key: string, value: string | number | boolean): void {
    span.attributes[key] = value;
  }

  /**
   * Set multiple span attributes
   */
  setAttributes(span: Span, attributes: SpanAttributes): void {
    Object.assign(span.attributes, attributes);
  }

  /**
   * Record exception in span
   */
  recordException(span: Span, error: Error): void {
    this.addEvent(span, "exception", {
      "exception.type": error.name,
      "exception.message": error.message,
      "exception.stacktrace": error.stack,
    });
    span.status = "error";
    span.statusMessage = error.message;
  }

  /**
   * Start Agent Span
   */
  startAgentSpan(
    agentId: string,
    agentName: string,
    options: {
      sessionId?: string;
      parentContext?: TraceContext;
      attributes?: SpanAttributes;
    } = {}
  ): AgentSpan {
    const span = this.startSpan(`agent.${agentId}`, {
      kind: "internal",
      parentContext: options.parentContext,
      attributes: {
        "agent.id": agentId,
        "agent.name": agentName,
        "agent.session_id": options.sessionId || "",
        ...options.attributes,
      },
    }) as AgentSpan;

    span.agentId = agentId;
    span.agentName = agentName;
    span.sessionId = options.sessionId;
    span.toolsUsed = [];

    return span;
  }

  /**
   * Start LLM Span
   */
  startLLMSpan(
    model: string,
    options: {
      parentContext?: TraceContext;
      temperature?: number;
      maxTokens?: number;
      attributes?: SpanAttributes;
    } = {}
  ): LLMSpan {
    const span = this.startSpan(`llm.${model}`, {
      kind: "client",
      parentContext: options.parentContext,
      attributes: {
        "llm.model": model,
        "llm.temperature": options.temperature,
        "llm.max_tokens": options.maxTokens,
        ...options.attributes,
      },
    }) as LLMSpan;

    span.model = model;
    span.promptTokens = 0;
    span.completionTokens = 0;
    span.totalTokens = 0;
    span.responseTime = 0;

    return span;
  }

  /**
   * End LLM Span with token counts
   */
  async endLLMSpan(
    span: LLMSpan,
    result: {
      promptTokens: number;
      completionTokens: number;
      success: boolean;
      error?: Error;
    }
  ): Promise<void> {
    span.promptTokens = result.promptTokens;
    span.completionTokens = result.completionTokens;
    span.totalTokens = result.promptTokens + result.completionTokens;
    span.responseTime = Date.now() - span.startTime;

    this.setAttributes(span, {
      "llm.prompt_tokens": result.promptTokens,
      "llm.completion_tokens": result.completionTokens,
      "llm.total_tokens": span.totalTokens,
      "llm.response_time_ms": span.responseTime,
    });

    if (result.error) {
      this.recordException(span, result.error);
    }

    await this.endSpan(span, result.success ? "ok" : "error");
  }

  /**
   * Add exporter
   */
  addExporter(exporter: TraceExporter): void {
    this.exporters.push(exporter);
  }

  /**
   * Configure HTTP exporter
   */
  configureHTTPExporter(endpoint: string, headers?: Record<string, string>): void {
    this.exporters.push(new HTTPExporter(endpoint, headers));
  }

  /**
   * Set sampling rate (0 - 1.0)
   */
  setSamplingRate(rate: number): void {
    this.samplingRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Enable/disable tracing
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Get all traces from memory
   */
  getTraces(): Span[] {
    return this.memoryExporter.getSpans();
  }

  /**
   * Alias for getTraces() for compatibility
   */
  getSpans(): Span[] {
    return this.getTraces();
  }

  /**
   * Get traces by trace ID
   */
  getTraceById(traceId: string): Span[] {
    return this.memoryExporter.getSpansByTraceId(traceId);
  }

  /**
   * Get traces by name
   */
  getTracesByName(name: string): Span[] {
    return this.memoryExporter.getSpansByName(name);
  }

  /**
   * Clear all traces from memory
   */
  clearTraces(): void {
    this.memoryExporter.clear();
  }

  /**
   * Alias for clearTraces() for compatibility
   */
  clear(): void {
    this.clearTraces();
  }

  /**
   * Get tracing statistics
   */
  getStats(): {
    totalSpans: number;
    activeSpans: number;
    exporters: string[];
    samplingRate: number;
    enabled: boolean;
  } {
    return {
      totalSpans: this.memoryExporter.getSpans().length,
      activeSpans: this.activeSpans.size,
      exporters: this.exporters.map((e) => e.name),
      samplingRate: this.samplingRate,
      enabled: this.enabled,
    };
  }

  /**
   * Shutdown all exporters
   */
  async shutdown(): Promise<void> {
    await Promise.all(this.exporters.map((e) => e.shutdown()));
  }
}

// Export singleton instance
export const tracingService = new TracingService();

// Convenience functions
export const startSpan = tracingService.startSpan.bind(tracingService);
export const endSpan = tracingService.endSpan.bind(tracingService);
export const startAgentSpan = tracingService.startAgentSpan.bind(tracingService);
export const startLLMSpan = tracingService.startLLMSpan.bind(tracingService);
export const endLLMSpan = tracingService.endLLMSpan.bind(tracingService);
export const addEvent = tracingService.addEvent.bind(tracingService);
export const setAttribute = tracingService.setAttribute.bind(tracingService);
export const recordException = tracingService.recordException.bind(tracingService);
export const getTraces = tracingService.getTraces.bind(tracingService);

/**
 * Decorator-style tracing for async functions
 */
export function withTracing<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options?: {
    kind?: SpanKind;
    attributes?: SpanAttributes;
  }
): Promise<T> {
  const span = tracingService.startSpan(name, options);

  return fn(span)
    .then((result) => {
      tracingService.endSpan(span, "ok");
      return result;
    })
    .catch((error) => {
      tracingService.recordException(span, error as Error);
      tracingService.endSpan(span, "error", (error as Error).message);
      throw error;
    });
}

/**
 * Trace context propagation helpers
 */
export function injectTraceContext(
  span: Span,
  headers: Record<string, string>
): Record<string, string> {
  const flagsHex = span.context.traceFlags.toString(16).padStart(2, "0");

  return {
    ...headers,
    // W3C traceparent: version-traceId-spanId-flags
    traceparent: `00-${span.context.traceId}-${span.context.spanId}-${flagsHex}`,
    tracestate: span.context.traceState || "",
  };
}

export function extractTraceContext(
  headers: Record<string, string | string[] | undefined>
): TraceContext | undefined {
  const traceparent = headers["traceparent"];
  if (!traceparent || typeof traceparent !== "string") {
    return undefined;
  }

  const parts = traceparent.split("-");
  if (parts.length !== 4) {
    return undefined;
  }

  return {
    traceId: parts[1],
    spanId: parts[2],
    traceFlags: Number.parseInt(parts[3], 16),
  };
}
