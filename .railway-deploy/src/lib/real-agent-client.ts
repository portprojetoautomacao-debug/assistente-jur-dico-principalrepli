/**
 * Client para interagir com agentes reais (backend)
 * Substitui as simulações por chamadas reais à API
 * Agora com suporte a STREAMING para respostas em tempo real
 */

import type { Agent, AgentTask, AgentTaskResult } from "./agents";
import {
  finishAgentInvokeSpan,
  finishAIChatSpan,
  startAgentInvokeSpan,
  startAIChatSpan,
} from "./sentry-ai-monitoring";

interface ProcessTaskAPIResponse {
  result: AgentTaskResult;
}

interface FetchTasksAPIResponse {
  tasks?: AgentTask[];
}

interface StreamingCallbacks {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

interface StreamingChunk {
  type: string;
  content?: string;
  message?: string;
}

// ===========================
// Helper functions - Extracted to reduce CC
// ===========================

/**
 * Processa uma linha SSE e retorna a ação a ser tomada
 */
function parseSSELine(line: string): StreamingChunk | null {
  const trimmed = line.trim();
  if (!trimmed?.startsWith("data: ")) return null;

  try {
    return JSON.parse(trimmed.slice(6)) as StreamingChunk;
  } catch {
    return null;
  }
}

/**
 * Processa um chunk parseado e atualiza o conteúdo
 */
function processStreamingChunk(
  chunk: StreamingChunk,
  currentContent: string,
  callbacks?: StreamingCallbacks
): { content: string; shouldThrow?: Error } {
  if (chunk.type === "content" && chunk.content) {
    callbacks?.onChunk?.(chunk.content);
    return { content: currentContent + chunk.content };
  }

  if (chunk.type === "done") {
    callbacks?.onComplete?.(currentContent);
    return { content: currentContent };
  }

  if (chunk.type === "error" && chunk.message) {
    return { content: currentContent, shouldThrow: new Error(chunk.message) };
  }

  return { content: currentContent };
}

/**
 * Processa todas as linhas do buffer SSE
 */
function processSSEBuffer(
  lines: string[],
  currentContent: string,
  callbacks?: StreamingCallbacks
): string {
  let content = currentContent;

  for (const line of lines) {
    const chunk = parseSSELine(line);
    if (!chunk) continue;

    const result = processStreamingChunk(chunk, content, callbacks);
    content = result.content;

    if (result.shouldThrow) {
      throw result.shouldThrow;
    }
  }

  return content;
}

/**
 * Lê o stream e processa chunks
 */
async function readStreamContent(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  callbacks?: StreamingCallbacks
): Promise<string> {
  const decoder = new TextDecoder();
  let fullContent = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    fullContent = processSSEBuffer(lines, fullContent, callbacks);
  }

  return fullContent;
}

/**
 * Cria o resultado de sucesso para streaming
 */
function createStreamingSuccessResult(content: string): AgentTaskResult {
  return {
    success: true,
    message: content || "Tarefa processada com sucesso",
    data: { content, streamedAt: new Date().toISOString() },
    confidence: 0.9,
  };
}

// ===========================
// Main streaming function - Refactored
// ===========================

/**
 * Processa uma tarefa usando o backend real COM STREAMING
 */
export async function processTaskWithStreamingAI(
  task: AgentTask,
  agent: Agent,
  callbacks?: StreamingCallbacks
): Promise<AgentTaskResult> {
  // 🔍 Sentry AI Monitoring - Instrumentação
  const agentSpan = startAgentInvokeSpan(agent, {
    model: "gemini-2.5-pro",
    provider: "google.gemini",
    temperature: 0.7,
    maxTokens: 4096,
  });

  const chatSpan = startAIChatSpan({
    model: "gemini-2.5-pro",
    provider: "google.gemini",
    operationName: "chat",
    temperature: 0.7,
    maxTokens: 4096,
  });

  try {
    const systemPrompt = buildAgentSystemPrompt(agent);
    const userPrompt = buildTaskPrompt(task);

    const response = await fetch("/api/llm-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`Streaming API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const fullContent = await readStreamContent(reader, callbacks);

    // 🔍 Finalizar spans com resultado
    finishAIChatSpan(chatSpan, {
      text: fullContent,
      // Token usage não disponível no streaming, mas pode ser estimado
    });

    finishAgentInvokeSpan(agentSpan, {
      output: fullContent,
    });

    chatSpan?.setStatus({ code: 1 });
    agentSpan?.setStatus({ code: 1 });

    return createStreamingSuccessResult(fullContent);
  } catch (error) {
    console.error("[Streaming Agent] Error:", error);

    // 🔍 Marcar spans como erro
    const errorMessage = error instanceof Error ? error.message : String(error);
    chatSpan?.setStatus({ code: 2, message: errorMessage });
    agentSpan?.setStatus({ code: 2, message: errorMessage });

    callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    // 🔍 Finalizar spans
    chatSpan?.end();
    agentSpan?.end();
  }
}

/**
 * Prompts do sistema para cada tipo de agente
 */
const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  harvey: `Você é Harvey Specter, estrategista jurídico do escritório.
Analise com visão macro, identifique riscos e oportunidades.
Responda de forma direta e estratégica.`,

  justine: `Você é Mrs. Justin-e, especialista em análise de intimações judiciais brasileiras.
Identifique prazos, tipo de documento, urgência e ações necessárias.
Retorne análises estruturadas em JSON quando possível.`,

  "analise-documental": `Você é o Agente de Análise Documental.
Extraia informações relevantes de documentos jurídicos.
Classifique e organize dados de forma estruturada.`,

  "monitor-djen": `Você é o Monitor DJEN.
Acompanhe publicações do Diário de Justiça Eletrônico.
Identifique intimações relevantes para o escritório.`,

  "gestao-prazos": `Você é o Gestor de Prazos.
Calcule prazos processuais considerando dias úteis e feriados.
Alerte sobre prazos críticos.`,

  "redacao-peticoes": `Você é um Redator Jurídico Profissional.
Crie petições, recursos e manifestações em linguagem jurídica formal.
Use estrutura correta e cite legislação quando apropriado.`,

  "pesquisa-juris": `Você é um Pesquisador de Jurisprudência.
Busque precedentes relevantes do STF, STJ e tribunais regionais.
Fundamentação sólida para petições.`,

  "analise-risco": `Você é um Analista de Riscos Processuais.
Avalie viabilidade de casos e probabilidade de sucesso.
Calcule custos vs benefícios.`,

  "estrategia-processual": `Você é um Consultor de Estratégia Processual.
Sugira estratégias baseadas em dados e precedentes.
Otimize chances de êxito.`,
};

/**
 * Gera prompt padrão para agente desconhecido
 */
function getDefaultAgentPrompt(agentName: string): string {
  return `Você é ${agentName}, um agente especializado do escritório jurídico.
Execute tarefas de forma eficiente e profissional.`;
}

/**
 * Constrói o system prompt baseado no tipo de agente
 */
function buildAgentSystemPrompt(agent: Agent): string {
  return AGENT_SYSTEM_PROMPTS[agent.id] || getDefaultAgentPrompt(agent.name);
}

/**
 * Constrói o prompt da tarefa
 */
function buildTaskPrompt(task: AgentTask): string {
  const data = task.data || {};

  let prompt = `**Tarefa: ${task.type}**\n`;
  prompt += `Prioridade: ${task.priority}\n\n`;

  // Helper para stringify seguro
  const safeStringify = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (typeof val === "object" && val !== null) return JSON.stringify(val);
    return String(val);
  };

  if (data.description) {
    prompt += `Descrição: ${safeStringify(data.description)}\n\n`;
  }

  if (data.content || data.teor) {
    const contentValue = data.content || data.teor;
    prompt += `Conteúdo:\n${String(contentValue)}\n\n`;
  }

  if (data.processNumber) {
    prompt += `Processo: ${safeStringify(data.processNumber)}\n`;
  }

  if (data.expedienteId) {
    prompt += `ID do Expediente: ${safeStringify(data.expedienteId)}\n`;
  }

  prompt += `\nExecute a tarefa e forneça uma resposta estruturada.`;

  return prompt;
}

/**
 * Processa uma tarefa usando o backend real (Spark LLM)
 */
export async function processTaskWithRealAI(
  task: AgentTask,
  agent: Agent
): Promise<AgentTaskResult> {
  // Criar spans Sentry para monitoramento de AI Agents
  const agentSpan = startAgentInvokeSpan(agent, {
    model: "gemini-2.5-pro",
    provider: "google.gemini",
    temperature: 0.7,
    maxTokens: 4096,
  });

  const chatSpan = startAIChatSpan({
    model: "gemini-2.5-pro",
    provider: "google.gemini",
    operationName: "chat",
    temperature: 0.7,
    maxTokens: 4096,
  });

  try {
    const response = await fetch("/api/agents/process-task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task,
        agent: {
          id: agent.id,
          type: agent.type,
          name: agent.name,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as ProcessTaskAPIResponse;

    if (!data || typeof data !== "object" || !data.result) {
      throw new Error("Invalid API response: missing result");
    }

    // Finalizar spans com dados da resposta
    const dataDescription = data.result.data?.description;
    const resultOutput =
      data.result.message ||
      (typeof dataDescription === "string" ? dataDescription : undefined) ||
      "Task completed";

    finishAgentInvokeSpan(agentSpan, {
      output: resultOutput,
      tokensUsed: data.result.tokensUsed
        ? {
            total: data.result.tokensUsed,
          }
        : undefined,
    });

    finishAIChatSpan(chatSpan, {
      text: resultOutput,
      tokensUsed: data.result.tokensUsed
        ? {
            total: data.result.tokensUsed,
          }
        : undefined,
    });
    return data.result;
  } catch (error) {
    console.error("[Real Agent Client] Error processing task:", error);

    // Marcar spans como erro
    agentSpan?.setStatus({
      code: 2,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    chatSpan?.setStatus({
      code: 2,
      message: error instanceof Error ? error.message : "Unknown error",
    });

    throw error;
  } finally {
    // Sempre finalizar os spans
    agentSpan?.end();
    chatSpan?.end();
  }
}

/**
 * Busca tarefas pendentes do backend
 */
export async function fetchPendingTasks(agentId?: string): Promise<AgentTask[]> {
  try {
    const url = agentId
      ? `/api/agents/tasks?agentId=${encodeURIComponent(agentId)}&status=queued`
      : "/api/agents/tasks?status=queued";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as FetchTasksAPIResponse;

    return Array.isArray(data.tasks) ? data.tasks : [];
  } catch (error) {
    console.error("[Real Agent Client] Error fetching tasks:", error);
    return [];
  }
}

/**
 * Envia uma tarefa para a fila de processamento
 */
export async function queueTask(task: AgentTask): Promise<void> {
  try {
    const response = await fetch("/api/agents/queue-task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task }),
    });

    if (!response.ok) {
      throw new Error(`Failed to queue task: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error("[Real Agent Client] Error queueing task:", error);
    throw error;
  }
}

/**
 * Monitora DJEN usando o endpoint real
 */
export async function monitorDJEN(tribunais: string[]): Promise<unknown> {
  try {
    const response = await fetch("/api/djen/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tribunais }),
    });

    if (!response.ok) {
      throw new Error(`DJEN API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[Real Agent Client] Error monitoring DJEN:", error);
    throw error;
  }
}

/**
 * Calcula prazos usando lógica real de dias úteis
 */
export async function calculateRealDeadline(
  startDate: Date,
  businessDays: number,
  tribunalCode?: string
): Promise<unknown> {
  try {
    const response = await fetch("/api/deadline/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: startDate.toISOString(),
        businessDays,
        tribunalCode,
      }),
    });

    if (!response.ok) {
      throw new Error(`Deadline API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[Real Agent Client] Error calculating deadline:", error);
    throw error;
  }
}

/**
 * Verifica se o modo de agentes reais está habilitado
 * SEMPRE retorna true - não há mais modo simulado
 */
export function isRealAgentsEnabled(): boolean {
  // Agentes SEMPRE usam IA real - não há mais modo simulado
  return true;
}

/**
 * @deprecated Modo simulado foi removido. Agentes sempre usam IA real.
 */
export function setRealAgentsMode(_enabled: boolean): void {
  console.warn(
    "[DEPRECATED] setRealAgentsMode: Modo simulado foi removido. Agentes sempre usam IA real."
  );
  // Função mantida apenas para compatibilidade - não faz nada
}
