// lib/ai/core-agent.ts
// Núcleo genérico de agente com padrão ReAct (Reasoning + Acting)
// Baseado em best practices 2024/2025: LangChain, AutoGen, ReAct pattern
// Motor reutilizável e observável para TODOS os agentes

import type { GlobalToolContext } from "./tools";

export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

// Estrutura de trace para observabilidade (padrão LangSmith/LangChain)
export interface AgentTrace {
  timestamp: string;
  step: number;
  type: "thought" | "action" | "observation" | "final";
  content: string;
  toolUsed?: string;
  duration?: number;
  error?: string;
}

export interface LlmClient {
  chat(messages: ChatMessage[]): Promise<string>;
}

// Context com telemetria e observabilidade
export interface ToolContext {
  traceId?: string; // Para correlacionar logs distribuídos
  agentId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

export interface Tool {
  name: string;
  description: string;
  run: (args: Record<string, unknown>, ctx: GlobalToolContext) => Promise<unknown>;
}

export interface MemoryStore {
  load(sessionId: string): Promise<ChatMessage[]>;
  save(sessionId: string, history: ChatMessage[]): Promise<void>;
}

export interface AgentPersona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  toolNames: string[]; // quais tools esse agente pode usar
}

export interface AgentOptions {
  llm: LlmClient;
  tools: Tool[];
  persona: AgentPersona;
  toolContext: ToolContext;
  sessionId?: string;
  maxSteps?: number;
  memoryStore?: MemoryStore;
}

// ===== Implementação simples de memória em RAM (dev) =====
// Em produção, trocar por UpstashMemoryStore usando /api/kv

const inMemoryStore = new Map<string, ChatMessage[]>();

export const InMemoryMemoryStore: MemoryStore = {
  async load(sessionId: string) {
    return inMemoryStore.get(sessionId) ?? [];
  },
  async save(sessionId: string, history: ChatMessage[]) {
    inMemoryStore.set(sessionId, history);
  },
};

// ===== Núcleo do agente =====

export class SimpleAgent {
  private readonly maxSteps: number;
  private readonly sessionId: string;
  private readonly memoryStore: MemoryStore;

  constructor(private readonly opts: AgentOptions) {
    this.maxSteps = opts.maxSteps ?? 6;
    this.sessionId = opts.sessionId ?? `session-${opts.persona.id}`;
    this.memoryStore = opts.memoryStore ?? InMemoryMemoryStore;
  }

  private buildSystemMessage(): ChatMessage {
    const allowedTools = this.opts.tools
      .filter((t) => this.opts.persona.toolNames.includes(t.name))
      .map((t) => `- ${t.name}: ${t.description}`)
      .join("\n");

    return {
      role: "system",
      content: `
Você é o agente "${this.opts.persona.name}".

Descrição do seu papel:
${this.opts.persona.description}

Instruções gerais:
${this.opts.persona.systemPrompt}

Você tem acesso às seguintes ferramentas, que pode chamar quando precisar de dados externos ou executar ações:

${allowedTools}

PROTOCOLO DE RESPOSTA (OBRIGATÓRIO):

Sempre responda ESTRITAMENTE em JSON válido, usando um destes formatos:

1) Para chamar uma ferramenta:
{
  "action": "tool",
  "tool": "NOME_DA_FERRAMENTA",
  "args": { ... }
}

2) Para resposta final ao usuário/sistema:
{
  "action": "final",
  "answer": "texto da resposta final aqui"
}
`.trim(),
    };
  }

  private allowedTools(): Tool[] {
    const set = new Set(this.opts.persona.toolNames);
    return this.opts.tools.filter((t) => set.has(t.name));
  }

  // ===== Helper functions for run() - Reduced Cognitive Complexity =====

  private createThoughtTrace(step: number, userInput: string): AgentTrace {
    return {
      timestamp: new Date().toISOString(),
      step,
      type: "thought",
      content: `Analisando: ${userInput.substring(0, 100)}...`,
    };
  }

  private createErrorTrace(
    step: number,
    content: string,
    duration: number,
    error: string
  ): AgentTrace {
    return {
      timestamp: new Date().toISOString(),
      step,
      type: "observation",
      content,
      duration,
      error,
    };
  }

  private tryParseJSON(rawContent: string): {
    parsed: Record<string, unknown> | null;
    error?: string;
  } {
    try {
      return { parsed: JSON.parse(rawContent) };
    } catch {
      return { parsed: null, error: "JSON parsing failed" };
    }
  }

  private async handleFinalAction(actionData: {
    parsed: Record<string, unknown>;
    step: number;
    stepDuration: number;
    history: ChatMessage[];
    userInput: string;
    traces: AgentTrace[];
    usedTools: string[];
    startTime: number;
  }): Promise<{
    answer: string;
    steps: number;
    usedTools: string[];
    traces: AgentTrace[];
    totalDuration: number;
  }> {
    const { parsed, step, stepDuration, history, userInput, traces, usedTools, startTime } =
      actionData;
    const answer = parsed.answer ?? "";
    const answerContent = typeof answer === "string" ? answer : JSON.stringify(answer);

    traces.push({
      timestamp: new Date().toISOString(),
      step,
      type: "final",
      content: answerContent,
      duration: stepDuration,
    });

    const newHistory: ChatMessage[] = [
      ...history,
      { role: "user", content: userInput },
      { role: "assistant", content: answerContent },
    ];
    await this.memoryStore.save(this.sessionId, newHistory);

    return {
      answer: answerContent,
      steps: step + 1,
      usedTools,
      traces,
      totalDuration: Date.now() - startTime,
    };
  }

  private async executeTool(
    tool: Tool,
    toolArgs: Record<string, unknown>,
    toolName: string,
    step: number,
    traces: AgentTrace[],
    usedTools: string[]
  ): Promise<unknown> {
    const toolStart = Date.now();

    traces.push({
      timestamp: new Date().toISOString(),
      step,
      type: "action",
      content: `Executando: ${toolName}`,
      toolUsed: toolName,
    });

    try {
      const enrichedContext: GlobalToolContext = {
        ...(this.opts.toolContext as GlobalToolContext),
        traceId: `trace-${Date.now()}`,
        agentId: this.opts.persona.id,
        sessionId: this.sessionId,
      };

      const result = await tool.run(toolArgs, enrichedContext);
      usedTools.push(toolName);

      traces.push({
        timestamp: new Date().toISOString(),
        step,
        type: "observation",
        content: `Resultado: ${JSON.stringify(result).substring(0, 200)}...`,
        toolUsed: toolName,
        duration: Date.now() - toolStart,
      });

      return result;
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));

      traces.push({
        timestamp: new Date().toISOString(),
        step,
        type: "observation",
        content: `Erro: ${error.message}`,
        toolUsed: toolName,
        duration: Date.now() - toolStart,
        error: error.message,
      });

      return { error: true, message: error.message };
    }
  }

  // ===== Additional helpers for run() - Further CC reduction =====

  private handleInvalidJSON(
    rawContent: string,
    error: string,
    step: number,
    stepDuration: number,
    messages: ChatMessage[],
    traces: AgentTrace[]
  ): void {
    traces.push(
      this.createErrorTrace(step, "Resposta inválida - solicitando correção", stepDuration, error)
    );
    messages.push(
      { role: "assistant", content: rawContent },
      {
        role: "user",
        content:
          "Sua resposta não está em JSON válido. Reformule seguindo exatamente o formato especificado.",
      }
    );
  }

  private handleToolNotFound(
    toolName: string,
    raw: string,
    step: number,
    stepDuration: number,
    messages: ChatMessage[],
    traces: AgentTrace[]
  ): void {
    traces.push(
      this.createErrorTrace(
        step,
        `Tool '${toolName}' não disponível`,
        stepDuration,
        `Tool not found: ${toolName}`
      )
    );
    messages.push(
      { role: "assistant", content: raw },
      {
        role: "user",
        content: `A ferramenta "${toolName}" não está disponível para este agente. Use apenas as ferramentas listadas.`,
      }
    );
  }

  private handleInvalidAction(
    raw: string,
    step: number,
    stepDuration: number,
    messages: ChatMessage[],
    traces: AgentTrace[]
  ): void {
    traces.push(
      this.createErrorTrace(
        step,
        "Formato de resposta inválido",
        stepDuration,
        "Invalid action format"
      )
    );
    messages.push(
      { role: "assistant", content: raw },
      {
        role: "user",
        content:
          'Sua resposta JSON deve ter "action":"tool" ou "action":"final". Reformule seguindo o formato.',
      }
    );
  }

  private async handleToolAction(
    parsed: Record<string, unknown>,
    raw: string,
    step: number,
    stepDuration: number,
    messages: ChatMessage[],
    traces: AgentTrace[],
    usedTools: string[]
  ): Promise<boolean> {
    const toolName = typeof parsed.tool === "string" ? parsed.tool : String(parsed.tool || "");
    const toolArgs = (parsed.args ?? {}) as Record<string, unknown>;
    const tool = this.allowedTools().find((t) => t.name === toolName);

    if (!tool) {
      this.handleToolNotFound(toolName, raw, step, stepDuration, messages, traces);
      return false;
    }

    const result = await this.executeTool(tool, toolArgs, toolName, step, traces, usedTools);
    messages.push(
      { role: "assistant", content: raw },
      {
        role: "user",
        content: `Resultado da ferramenta "${toolName}": ${JSON.stringify(result)}. Agora decida o próximo passo ou finalize a resposta.`,
      }
    );
    return true;
  }

  private buildMaxStepsResponse(
    usedTools: string[],
    traces: AgentTrace[],
    startTime: number
  ): {
    answer: string;
    steps: number;
    usedTools: string[];
    traces: AgentTrace[];
    totalDuration: number;
  } {
    return {
      answer:
        "Não consegui concluir a tarefa dentro do limite de passos configurado para o agente.",
      steps: this.maxSteps,
      usedTools,
      traces,
      totalDuration: Date.now() - startTime,
    };
  }

  // ===== Main run() method - Further refactored =====

  async run(userInput: string): Promise<{
    answer: string;
    steps: number;
    usedTools: string[];
    traces: AgentTrace[];
    totalDuration: number;
  }> {
    const startTime = Date.now();
    const history = await this.memoryStore.load(this.sessionId);
    const usedTools: string[] = [];
    const traces: AgentTrace[] = [];

    const messages: ChatMessage[] = [
      this.buildSystemMessage(),
      ...history,
      { role: "user", content: userInput },
    ];

    for (let step = 0; step < this.maxSteps; step++) {
      const stepStart = Date.now();
      traces.push(this.createThoughtTrace(step, userInput));

      const raw = await this.opts.llm.chat(messages);
      const stepDuration = Date.now() - stepStart;
      const rawContent = typeof raw === "string" ? raw : JSON.stringify(raw);

      const { parsed, error } = this.tryParseJSON(rawContent);

      if (!parsed) {
        this.handleInvalidJSON(rawContent, error!, step, stepDuration, messages, traces);
        continue;
      }

      if (parsed.action === "final") {
        return this.handleFinalAction({
          parsed,
          step,
          stepDuration,
          history,
          userInput,
          traces,
          usedTools,
          startTime,
        });
      }

      if (parsed.action === "tool") {
        await this.handleToolAction(parsed, raw, step, stepDuration, messages, traces, usedTools);
        continue;
      }

      this.handleInvalidAction(raw, step, stepDuration, messages, traces);
    }

    return this.buildMaxStepsResponse(usedTools, traces, startTime);
  }
}
