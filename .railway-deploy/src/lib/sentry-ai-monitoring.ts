/**
 * Sentry AI Agent Monitoring
 *
 * Instrumentação para monitorar agentes de IA seguindo o padrão Sentry AI Monitoring.
 * Baseado em: https://docs.sentry.io/platforms/python/tracing/instrumentation/custom-instrumentation/ai-agents/
 *
 * @see https://docs.sentry.io/platforms/javascript/tracing/instrumentation/custom-instrumentation/
 */

import * as Sentry from "@sentry/react";
import type { Agent, AgentTask } from "./agents";

/**
 * Atributos comuns para spans de AI Agents
 */
interface CommonAIAttributes {
  "gen_ai.system": string; // ex: "openai", "google.gemini"
  "gen_ai.request.model": string; // ex: "gpt-4", "gemini-2.5-pro"
  "gen_ai.operation.name"?: string; // ex: "chat", "invoke_agent"
  "gen_ai.agent.name"?: string; // ex: "Harvey Specter", "Mrs. Justin-e"
}

/**
 * Atributos específicos para requisições de IA
 */
interface AIRequestAttributes extends CommonAIAttributes {
  "gen_ai.request.messages"?: string; // JSON stringified
  "gen_ai.request.temperature"?: number;
  "gen_ai.request.max_tokens"?: number;
  "gen_ai.request.available_tools"?: string; // JSON stringified
  "gen_ai.request.frequency_penalty"?: number;
  "gen_ai.request.presence_penalty"?: number;
  "gen_ai.request.top_p"?: number;
  [key: string]: string | number | boolean | undefined; // Index signature para compatibilidade Sentry
}

/**
 * Atributos específicos para respostas de IA
 */
interface AIResponseAttributes {
  "gen_ai.response.text"?: string; // JSON stringified array
  "gen_ai.response.tool_calls"?: string; // JSON stringified
  "gen_ai.usage.input_tokens"?: number;
  "gen_ai.usage.output_tokens"?: number;
  "gen_ai.usage.total_tokens"?: number;
  "gen_ai.usage.input_tokens.cached"?: number;
  "gen_ai.usage.output_tokens.reasoning"?: number;
}

/**
 * Atributos para tool execution
 */
interface ToolExecutionAttributes extends CommonAIAttributes {
  "gen_ai.tool.name": string;
  "gen_ai.tool.description"?: string;
  "gen_ai.tool.type"?: "function" | "extension" | "datastore";
  "gen_ai.tool.input"?: string;
  "gen_ai.tool.output"?: string;
  [key: string]: string | number | boolean | undefined; // Index signature para compatibilidade Sentry
}

/**
 * Criar span de invocação de agente
 *
 * @example
 * ```ts
 * const span = startAgentInvokeSpan(agent, {
 *   model: "gemini-2.5-pro",
 *   provider: "google.gemini"
 * });
 *
 * try {
 *   const result = await agent.execute();
 *   finishAgentInvokeSpan(span, result);
 * } catch (error) {
 *   span.setStatus("internal_error");
 *   throw error;
 * } finally {
 *   span.end();
 * }
 * ```
 */
export function startAgentInvokeSpan(
  agent: Agent,
  options: {
    model: string;
    provider: string;
    temperature?: number;
    maxTokens?: number;
    messages?: Array<{ role: string; content: string }>;
  }
): Sentry.Span | undefined {
  const span = Sentry.startInactiveSpan({
    op: "gen_ai.invoke_agent",
    name: `invoke_agent ${agent.name}`,
    attributes: {
      "gen_ai.operation.name": "invoke_agent",
      "gen_ai.system": options.provider,
      "gen_ai.request.model": options.model,
      "gen_ai.agent.name": agent.name,
      ...(options.temperature && { "gen_ai.request.temperature": options.temperature }),
      ...(options.maxTokens && { "gen_ai.request.max_tokens": options.maxTokens }),
      ...(options.messages && {
        "gen_ai.request.messages": JSON.stringify(options.messages),
      }),
    } as AIRequestAttributes,
  });

  return span;
}

/**
 * Finalizar span de invocação de agente com resultado
 */
export function finishAgentInvokeSpan(
  span: Sentry.Span | undefined,
  result: {
    output?: string | string[];
    tokensUsed?: {
      input?: number;
      output?: number;
      total?: number;
      cached?: number;
    };
    toolCalls?: Array<{ name: string; type: string; arguments: string }>;
  }
): void {
  if (!span) return;

  const attributes: Partial<AIResponseAttributes> = {};

  // Normalizar output para array de strings
  if (result.output) {
    const outputArray = Array.isArray(result.output) ? result.output : [result.output];
    attributes["gen_ai.response.text"] = JSON.stringify(outputArray);
  }

  // Token usage
  if (result.tokensUsed) {
    if (result.tokensUsed.input) {
      attributes["gen_ai.usage.input_tokens"] = result.tokensUsed.input;
    }
    if (result.tokensUsed.output) {
      attributes["gen_ai.usage.output_tokens"] = result.tokensUsed.output;
    }
    if (result.tokensUsed.total) {
      attributes["gen_ai.usage.total_tokens"] = result.tokensUsed.total;
    }
    if (result.tokensUsed.cached) {
      attributes["gen_ai.usage.input_tokens.cached"] = result.tokensUsed.cached;
    }
  }

  // Tool calls
  if (result.toolCalls && result.toolCalls.length > 0) {
    attributes["gen_ai.response.tool_calls"] = JSON.stringify(result.toolCalls);
  }

  // Aplicar atributos ao span
  Object.entries(attributes).forEach(([key, value]) => {
    span.setAttribute(key, value);
  });

  span.setStatus({ code: 1 }); // OK
}

/**
 * Criar span de chat/completion com IA
 *
 * @example
 * ```ts
 * const span = startAIChatSpan({
 *   model: "gpt-4",
 *   provider: "openai",
 *   messages: [{ role: "user", content: "Analise este processo" }]
 * });
 *
 * const response = await callLLM();
 * finishAIChatSpan(span, response);
 * span.end();
 * ```
 */
export function startAIChatSpan(options: {
  model: string;
  provider: string;
  operationName?: string;
  messages?: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  availableTools?: Array<{ name: string; description: string }>;
}): Sentry.Span | undefined {
  const operation = options.operationName || "chat";

  const span = Sentry.startInactiveSpan({
    op: `gen_ai.${operation}`,
    name: `${operation} ${options.model}`,
    attributes: {
      "gen_ai.operation.name": operation,
      "gen_ai.system": options.provider,
      "gen_ai.request.model": options.model,
      ...(options.messages && {
        "gen_ai.request.messages": JSON.stringify(options.messages),
      }),
      ...(options.temperature !== undefined && {
        "gen_ai.request.temperature": options.temperature,
      }),
      ...(options.maxTokens && { "gen_ai.request.max_tokens": options.maxTokens }),
      ...(options.availableTools && {
        "gen_ai.request.available_tools": JSON.stringify(options.availableTools),
      }),
    } as AIRequestAttributes,
  });

  return span;
}

/**
 * Finalizar span de chat com resposta
 */
export function finishAIChatSpan(
  span: Sentry.Span | undefined,
  response: {
    text?: string | string[];
    tokensUsed?: {
      input?: number;
      output?: number;
      total?: number;
    };
    toolCalls?: Array<{ name: string; type: string; arguments: string }>;
  }
): void {
  if (!span) return;

  const attributes: Partial<AIResponseAttributes> = {};

  if (response.text) {
    const textArray = Array.isArray(response.text) ? response.text : [response.text];
    attributes["gen_ai.response.text"] = JSON.stringify(textArray);
  }

  if (response.tokensUsed) {
    if (response.tokensUsed.input)
      attributes["gen_ai.usage.input_tokens"] = response.tokensUsed.input;
    if (response.tokensUsed.output)
      attributes["gen_ai.usage.output_tokens"] = response.tokensUsed.output;
    if (response.tokensUsed.total)
      attributes["gen_ai.usage.total_tokens"] = response.tokensUsed.total;
  }

  if (response.toolCalls) {
    attributes["gen_ai.response.tool_calls"] = JSON.stringify(response.toolCalls);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    span.setAttribute(key, value);
  });

  span.setStatus({ code: 1 });
}

/**
 * Criar span de execução de ferramenta
 *
 * @example
 * ```ts
 * const span = startToolExecutionSpan({
 *   toolName: "query_database",
 *   model: "gpt-4",
 *   provider: "openai",
 *   toolInput: JSON.stringify({ query: "SELECT * FROM cases" })
 * });
 *
 * const result = await executeTool();
 * finishToolExecutionSpan(span, { output: JSON.stringify(result) });
 * span.end();
 * ```
 */
export function startToolExecutionSpan(options: {
  toolName: string;
  model: string;
  provider: string;
  toolDescription?: string;
  toolType?: "function" | "extension" | "datastore";
  toolInput?: string;
}): Sentry.Span | undefined {
  const span = Sentry.startInactiveSpan({
    op: "gen_ai.execute_tool",
    name: `execute_tool ${options.toolName}`,
    attributes: {
      "gen_ai.system": options.provider,
      "gen_ai.request.model": options.model,
      "gen_ai.tool.name": options.toolName,
      ...(options.toolDescription && { "gen_ai.tool.description": options.toolDescription }),
      ...(options.toolType && { "gen_ai.tool.type": options.toolType }),
      ...(options.toolInput && { "gen_ai.tool.input": options.toolInput }),
    } as ToolExecutionAttributes,
  });

  return span;
}

/**
 * Finalizar span de execução de ferramenta
 */
export function finishToolExecutionSpan(
  span: Sentry.Span | undefined,
  result: { output?: string }
): void {
  if (!span) return;

  if (result.output) {
    span.setAttribute("gen_ai.tool.output", result.output);
  }

  span.setStatus({ code: 1 });
}

/**
 * Criar span de handoff entre agentes
 *
 * @example
 * ```ts
 * const span = createHandoffSpan(currentAgent, nextAgent);
 * // Handoff logic...
 * span.end();
 * ```
 */
export function createHandoffSpan(fromAgent: Agent, toAgent: Agent): Sentry.Span | undefined {
  const span = Sentry.startInactiveSpan({
    op: "gen_ai.handoff",
    name: `handoff from ${fromAgent.name} to ${toAgent.name}`,
    attributes: {
      "gen_ai.agent.from": fromAgent.name,
      "gen_ai.agent.to": toAgent.name,
    },
  });

  // Handoff span apenas marca a transição
  span?.setStatus({ code: 1 });
  return span;
}

/**
 * Helper para instrumentar processamento de tarefa de agente
 */
export async function instrumentAgentTask<T>(
  agent: Agent,
  task: AgentTask,
  taskProcessor: () => Promise<T>,
  options: {
    model: string;
    provider: string;
  }
): Promise<T> {
  // Extrair descrição da tarefa (pode estar em data.description ou type)
  const taskDescription =
    (task.data as { description?: string })?.description || task.type || "Unknown task";

  const span = startAgentInvokeSpan(agent, {
    model: options.model,
    provider: options.provider,
    messages: [{ role: "user", content: taskDescription }],
  });

  try {
    const result = await taskProcessor();

    // Se o resultado tiver informações de tokens, adicionar ao span
    if (typeof result === "object" && result !== null) {
      const resultObj = result as Record<string, unknown>;
      if ("tokensUsed" in resultObj || "output" in resultObj) {
        finishAgentInvokeSpan(span, resultObj as Parameters<typeof finishAgentInvokeSpan>[1]);
      }
    }

    span?.setStatus({ code: 1 });
    return result;
  } catch (error) {
    span?.setStatus({ code: 2, message: error instanceof Error ? error.message : "Unknown error" });
    throw error;
  } finally {
    span?.end();
  }
}
