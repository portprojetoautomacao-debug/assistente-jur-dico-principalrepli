/**
 * Agent Tracing Integration
 *
 * Integração de tracing compatível com OpenTelemetry com o sistema de Agentes IA.
 * Fornece instrumentação automática para execução de agentes e processamento de tarefas.
 */

import { tracingService } from "./tracing";

import type { AgentSpan, SpanAttributes } from "./tracing";

import type { Agent, AgentTask, AgentTaskResult } from "./agents";

// ============================================================================
// AGENT EXECUTION TRACING
// ============================================================================

/**
 * Trace da execução de uma tarefa de agente
 */
export async function traceAgentTask<T>(
  agent: Agent,
  task: AgentTask,
  executor: (span: AgentSpan) => Promise<T>
): Promise<T> {
  const span = tracingService.startAgentSpan(agent.id, agent.name, {
    sessionId: `task-${task.id}`,
    attributes: {
      "task.id": task.id,
      "task.type": task.type,
      "task.priority": task.priority,
      "agent.type": agent.type,
      "agent.autonomy_level": 0,
    },
  });

  try {
    // Evento de início da tarefa
    try {
      tracingService.addEvent(span, "task.started", {
        "task.data": JSON.stringify(task.data),
      });
    } catch {
      // ignora erro de stringify circular
      tracingService.addEvent(span, "task.started");
    }

    const result = await executor(span);

    // Evento de conclusão
    tracingService.addEvent(span, "task.completed");

    await tracingService.endSpan(span, "ok");
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    tracingService.recordException(span, err);
    await tracingService.endSpan(span, "error", err.message);
    throw error;
  }
}

/**
 * Trace de uso de ferramenta pelo agente
 */
export function traceToolUsage(
  agentSpan: AgentSpan,
  toolName: string,
  toolInput: unknown,
  toolOutput: unknown
): void {
  let safeInput = "";
  let safeOutput = "";

  try {
    safeInput = JSON.stringify(toolInput).substring(0, 500);
  } catch {
    safeInput = "[unserializable input]";
  }

  try {
    safeOutput = JSON.stringify(toolOutput).substring(0, 500);
  } catch {
    safeOutput = "[unserializable output]";
  }

  tracingService.addEvent(agentSpan, "tool.used", {
    "tool.name": toolName,
    "tool.input": safeInput,
    "tool.output": safeOutput,
  });

  const spanAny = agentSpan as AgentSpan & { toolsUsed?: string[] };
  if (Array.isArray(spanAny.toolsUsed)) {
    spanAny.toolsUsed.push(toolName);
  } else {
    spanAny.toolsUsed = [toolName];
  }
}

/**
 * Trace de passo de agente
 */
export function traceAgentStep(
  agentSpan: AgentSpan,
  stepNumber: number,
  stepDescription: string,
  attributes?: SpanAttributes
): void {
  const spanAny = agentSpan as AgentSpan & { stepNumber?: number };
  spanAny.stepNumber = stepNumber;

  const eventAttributes: SpanAttributes = {
    "step.description": stepDescription,
  };

  if (attributes) {
    Object.assign(eventAttributes, attributes);
  }

  tracingService.addEvent(agentSpan, `step.${stepNumber}`, eventAttributes);
}

// ============================================================================
// LLM CALL TRACING
// ============================================================================

/**
 * Trace de chamada ao LLM dentro da execução do agente
 */
export async function traceLLMCall<T>(
  parentSpan: AgentSpan,
  model: string,
  promptLength: number,
  executor: () => Promise<{
    result: T;
    tokens: { prompt: number; completion: number };
  }>
): Promise<T> {
  const parentContext = (parentSpan as AgentSpan & { context?: unknown }).context;

  const llmSpan = tracingService.startLLMSpan(model, {
    parentContext,
    attributes: {
      "llm.prompt_length": promptLength,
    },
  });

  try {
    const { result, tokens } = await executor();

    await tracingService.endLLMSpan(llmSpan, {
      promptTokens: tokens.prompt,
      completionTokens: tokens.completion,
      success: true,
    });

    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    await tracingService.endLLMSpan(llmSpan, {
      promptTokens: promptLength,
      completionTokens: 0,
      success: false,
      error: err,
    });

    throw error;
  }
}

// ============================================================================
// TASK RESULT TRACING
// ============================================================================

/**
 * Registra o resultado da tarefa no span
 */
export function traceTaskResult(span: AgentSpan, result: AgentTaskResult): void {
  tracingService.setAttributes(span, {
    "task.success": result.success,
    "task.message": result.message || "",
    "task.has_suggestions": Boolean(result.suggestions?.length),
    "task.has_next_steps": Boolean(result.nextSteps?.length),
  });

  if (result.error) {
    tracingService.addEvent(span, "task.error", {
      "error.message": result.error,
    });
  }

  if (result.suggestions?.length) {
    tracingService.addEvent(span, "task.suggestions", {
      "suggestions.count": result.suggestions.length,
      "suggestions.list": result.suggestions.join(", "),
    });
  }
}

// ============================================================================
// AGENT LIFECYCLE TRACING
// ============================================================================

/**
 * Trace de mudança de estado do agente
 */
export function traceAgentStateChange(
  agentId: string,
  agentName: string,
  previousState: string,
  newState: string,
  reason?: string
): void {
  const span = tracingService.startSpan(`agent.state_change.${agentId}`, {
    kind: "internal",
    attributes: {
      "agent.id": agentId,
      "agent.name": agentName,
      "state.previous": previousState,
      "state.new": newState,
      "state.reason": reason || "unknown",
    },
  });

  tracingService.endSpan(span, "ok");
}

/**
 * Trace de ativação/desativação de agente
 */
export function traceAgentToggle(agentId: string, agentName: string, enabled: boolean): void {
  const span = tracingService.startSpan(`agent.toggle.${agentId}`, {
    kind: "internal",
    attributes: {
      "agent.id": agentId,
      "agent.name": agentName,
      "agent.enabled": enabled,
    },
  });

  tracingService.addEvent(span, enabled ? "agent.enabled" : "agent.disabled");
  tracingService.endSpan(span, "ok");
}

// ============================================================================
// QUEUE TRACING
// ============================================================================

/**
 * Trace de tarefa adicionada à fila
 */
export function traceTaskQueued(task: AgentTask): void {
  const span = tracingService.startSpan("task.queued", {
    kind: "producer",
    attributes: {
      "task.id": task.id,
      "task.type": task.type,
      "task.priority": task.priority,
      "task.agent_id": task.agentId,
    },
  });

  tracingService.endSpan(span, "ok");
}

/**
 * Trace de tarefa retirada da fila para processamento
 */
export function traceTaskDequeued(task: AgentTask, agentId: string): void {
  const span = tracingService.startSpan("task.dequeued", {
    kind: "consumer",
    attributes: {
      "task.id": task.id,
      "task.type": task.type,
      "task.agent_id": agentId,
      "task.queue_time_ms": Date.now() - new Date(task.createdAt).getTime(),
    },
  });

  tracingService.endSpan(span, "ok");
}

// ============================================================================
// HUMAN INTERACTION TRACING
// ============================================================================

/**
 * Trace de solicitação de intervenção humana
 */
export function traceHumanInterventionRequired(task: AgentTask, reason: string): void {
  const span = tracingService.startSpan("human.intervention_required", {
    kind: "internal",
    attributes: {
      "task.id": task.id,
      "task.type": task.type,
      "intervention.reason": reason,
    },
  });

  tracingService.addEvent(span, "awaiting_human");
  tracingService.endSpan(span, "ok");
}

/**
 * Trace de conclusão de intervenção humana
 */
export function traceHumanInterventionCompleted(
  taskId: string,
  duration: number,
  approved: boolean
): void {
  const span = tracingService.startSpan("human.intervention_completed", {
    kind: "internal",
    attributes: {
      "task.id": taskId,
      "intervention.duration_ms": duration,
      "intervention.approved": approved,
    },
  });

  tracingService.addEvent(span, approved ? "human.approved" : "human.rejected");
  tracingService.endSpan(span, "ok");
}

// ============================================================================
// METRICS HELPERS
// ============================================================================

/**
 * Interface para trace básico
 */
interface TraceEntry {
  endTime?: number;
  startTime?: number;
  status?: string;
  statusMessage?: string;
  events?: Array<{ name: string; attributes?: Record<string, unknown> }>;
  attributes?: Record<string, unknown>;
}

/**
 * Métricas de execução do agente a partir dos traces
 */
export function getAgentMetrics(agentId: string): {
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  toolUsage: Record<string, number>;
  recentErrors: string[];
} {
  const traces = tracingService.getTracesByName(`agent.${agentId}`) as TraceEntry[];

  const executions = traces.filter((t) => t.endTime);
  const successful = executions.filter((t) => t.status === "ok");
  const failed = executions.filter((t) => t.status === "error");

  const durations = executions
    .map((t) => (t.endTime ?? 0) - (t.startTime ?? 0))
    .filter((d) => d > 0);

  const avgDuration =
    durations.length > 0
      ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length
      : 0;

  const toolUsage: Record<string, number> = {};

  executions.forEach((t) => {
    const events = t.events || [];
    events
      .filter((e) => e.name === "tool.used")
      .forEach((e) => {
        const tool = e.attributes?.["tool.name"] as string | undefined;
        if (tool) {
          toolUsage[tool] = (toolUsage[tool] || 0) + 1;
        }
      });
  });

  const recentErrors = failed.slice(-5).map((t) => t.statusMessage || "Unknown error");

  return {
    totalExecutions: executions.length,
    successRate: executions.length > 0 ? (successful.length / executions.length) * 100 : 0,
    avgDuration,
    toolUsage,
    recentErrors,
  };
}

/**
 * Métricas de uso do LLM a partir dos traces
 */
export function getLLMMetrics(): {
  totalCalls: number;
  totalTokens: number;
  avgResponseTime: number;
  errorRate: number;
  tokensByModel: Record<string, number>;
} {
  const traces = tracingService.getTracesByName("llm.") as TraceEntry[];

  const calls = traces.filter((t) => t.endTime);
  const failed = calls.filter((t) => t.status === "error");

  let totalTokens = 0;
  const tokensByModel: Record<string, number> = {};
  const responseTimes: number[] = [];

  calls.forEach((t) => {
    const tokens = (t.attributes?.["llm.total_tokens"] as number | undefined) ?? 0;
    const model = (t.attributes?.["llm.model"] as string | undefined) || "unknown";
    const responseTime = (t.attributes?.["llm.response_time_ms"] as number | undefined) ?? 0;

    totalTokens += tokens;
    tokensByModel[model] = (tokensByModel[model] || 0) + tokens;

    if (responseTime > 0) {
      responseTimes.push(responseTime);
    }
  });

  const avgResponseTime =
    responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

  return {
    totalCalls: calls.length,
    totalTokens,
    avgResponseTime,
    errorRate: calls.length > 0 ? (failed.length / calls.length) * 100 : 0,
    tokensByModel,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { tracingService, withTracing } from "./tracing";
export type { AgentSpan, Span, TraceContext } from "./tracing";
