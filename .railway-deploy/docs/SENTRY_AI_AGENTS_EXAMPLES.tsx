/**
 * EXEMPLOS DE USO - Sentry AI Agents Monitoring
 *
 * Este arquivo demonstra como usar a integração Sentry com Google Gemini
 * seguindo as convenções oficiais OpenTelemetry do Sentry.
 *
 * Baseado em:
 * - https://docs.sentry.io/platforms/javascript/guides/react/tracing/span-metrics/examples/#manual-llm-instrumentation-custom-ai-agent--tool-calls
 * - https://docs.sentry.io/platforms/python/tracing/instrumentation/custom-instrumentation/ai-agents-module/
 */

import * as Sentry from "@sentry/react";
import { useEffect, useState } from "react";
import {
  createChatSpan,
  createExecuteToolSpan,
  createHandoffSpan,
  createInvokeAgentSpan,
  useAIInstrumentation,
  type AIAgentConfig,
  type AIConversationMetadata,
} from "../src/lib/sentry-gemini-integration-v2";

// ============================================
// EXEMPLO 1: Chamada simples de agente
// ============================================

export async function exemploInvokeAgentSimples() {
  const agentConfig: AIAgentConfig = {
    agentName: "Harvey Specter",
    system: "gcp.gemini",
    model: "gemini-2.5-pro",
    temperature: 0.7,
  };

  const conversationMetadata: AIConversationMetadata = {
    sessionId: `session_${Date.now()}`,
    turn: 1,
    messages: [
      { role: "system", content: "You are a legal assistant." },
      { role: "user", content: "Analyze this intimation" },
    ],
  };

  const result = await createInvokeAgentSpan(agentConfig, conversationMetadata, async (span) => {
    // Simula chamada à API Gemini
    const response = await callGeminiAPI("Analyze this intimation");

    // Adiciona atributos de resposta
    span?.setAttribute("gen_ai.response.text", JSON.stringify([response.text]));
    span?.setAttribute("gen_ai.response.id", response.id);
    span?.setAttribute("gen_ai.usage.input_tokens", response.usage.promptTokens);
    span?.setAttribute("gen_ai.usage.output_tokens", response.usage.responseTokens);
    span?.setAttribute("gen_ai.usage.total_tokens", response.usage.totalTokens);

    return response;
  });

  return result;
}

// ============================================
// EXEMPLO 2: Chat com histórico de mensagens
// ============================================

export async function exemploChatComHistorico() {
  const agentConfig: AIAgentConfig = {
    agentName: "Legal Analyst",
    system: "gcp.gemini",
    model: "gemini-2.5-pro",
  };

  const messages = [
    { role: "system" as const, content: "You are a legal document analyzer." },
    { role: "user" as const, content: "What is the deadline for this intimation?" },
  ];

  const response = await createChatSpan(agentConfig, messages, async (span) => {
    // Chama API
    const result = await callGeminiAPI(messages[messages.length - 1].content);

    // Atributos de resposta
    span?.setAttribute("gen_ai.response.text", JSON.stringify([result.text]));
    span?.setAttribute("gen_ai.usage.input_tokens", result.usage.promptTokens);
    span?.setAttribute("gen_ai.usage.output_tokens", result.usage.responseTokens);

    return result;
  });

  return response;
}

// ============================================
// EXEMPLO 3: Agente com execução de ferramentas
// ============================================

export async function exemploAgenteComFerramentas() {
  const agentConfig: AIAgentConfig = {
    agentName: "Mrs. Justin-e",
    system: "gcp.gemini",
    model: "gemini-2.5-pro",
  };

  const conversation: AIConversationMetadata = {
    sessionId: `session_${Date.now()}`,
    turn: 1,
  };

  const result = await createInvokeAgentSpan(agentConfig, conversation, async (agentSpan) => {
    // 1. Chamada LLM inicial
    const llmResponse = await createChatSpan(
      agentConfig,
      [{ role: "user", content: "Calculate deadline for this intimation" }],
      async (chatSpan) => {
        const response = await callGeminiAPI("Calculate deadline");

        chatSpan?.setAttribute("gen_ai.response.text", JSON.stringify([response.text]));
        chatSpan?.setAttribute("gen_ai.usage.total_tokens", response.usage.totalTokens);

        // Se LLM pedir para usar ferramenta
        if (response.toolCalls) {
          chatSpan?.setAttribute("gen_ai.response.tool_calls", JSON.stringify(response.toolCalls));
        }

        return response;
      }
    );

    // 2. Se houver tool calls, executa ferramentas
    if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
      const toolResults = [];

      for (const toolCall of llmResponse.toolCalls) {
        const toolOutput = await createExecuteToolSpan(
          agentConfig,
          {
            toolName: toolCall.name,
            toolType: "function",
            toolInput: JSON.stringify(toolCall.arguments),
          },
          async (toolSpan) => {
            // Executa ferramenta
            const output = await executeToolFunction(toolCall.name, toolCall.arguments);

            toolSpan?.setAttribute("gen_ai.tool.output", JSON.stringify(output));

            return output;
          }
        );

        toolResults.push({ toolName: toolCall.name, output: toolOutput });
      }

      // 3. Envia resultados das ferramentas de volta ao LLM
      const finalResponse = await createChatSpan(
        agentConfig,
        [{ role: "user", content: "Tool results: " + JSON.stringify(toolResults) }],
        async (span) => {
          const result = await callGeminiAPI("Synthesize response");
          span?.setAttribute("gen_ai.response.text", JSON.stringify([result.text]));
          return result;
        }
      );

      // Atributos finais do agente
      agentSpan?.setAttribute("gen_ai.response.text", finalResponse.text);
      agentSpan?.setAttribute(
        "conversation.tools_used",
        JSON.stringify(toolResults.map((t) => t.toolName))
      );
      agentSpan?.setAttribute("conversation.resolution_status", "resolved");

      return finalResponse;
    }

    // Se não houver tool calls, retorna resposta direta
    agentSpan?.setAttribute("gen_ai.response.text", llmResponse.text);
    agentSpan?.setAttribute("conversation.resolution_status", "answered");

    return llmResponse;
  });

  return result;
}

// ============================================
// EXEMPLO 4: Handoff entre agentes
// ============================================

export async function exemploHandoffEntreAgentes() {
  // 1. Primeiro agente (Harvey) detecta que precisa transferir
  const harveyConfig: AIAgentConfig = {
    agentName: "Harvey Specter",
    system: "gcp.gemini",
    model: "gemini-2.5-pro",
  };

  const harveyResult = await createInvokeAgentSpan(
    harveyConfig,
    { sessionId: "session_123", turn: 1 },
    async (span) => {
      const response = await callGeminiAPI("Should I analyze this intimation?");

      span?.setAttribute("gen_ai.response.text", JSON.stringify([response.text]));

      // Harvey detecta que deve transferir para Justin-e
      const shouldHandoff = response.text.includes("analyze intimation");

      return { ...response, shouldHandoff };
    }
  );

  // 2. Handoff de Harvey para Justin-e
  if (harveyResult.shouldHandoff) {
    await createHandoffSpan("Harvey Specter", "Mrs. Justin-e");

    // 3. Mrs. Justin-e assume
    const justinConfig: AIAgentConfig = {
      agentName: "Mrs. Justin-e",
      system: "gcp.gemini",
      model: "gemini-2.5-pro",
    };

    const justinResult = await createInvokeAgentSpan(
      justinConfig,
      { sessionId: "session_123", turn: 2 },
      async (span) => {
        const response = await callGeminiAPI("Analyze intimation details");

        span?.setAttribute("gen_ai.response.text", JSON.stringify([response.text]));

        return response;
      }
    );

    return justinResult;
  }

  return harveyResult;
}

// ============================================
// EXEMPLO 5: Hook React para componentes
// ============================================

export function ExemploComponenteReact() {
  const { invokeAgent, executeTool } = useAIInstrumentation();
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [sessionId, setSessionId] = useState("");

  // Gera sessionId no client-side para evitar hydration mismatch
  useEffect(() => {
    setSessionId(`session_${Date.now()}`);
  }, []);

  const handleSendMessage = async (userMessage: string) => {
    const agentConfig: AIAgentConfig = {
      agentName: "Customer Support Agent",
      system: "gcp.gemini",
      model: "gemini-2.5-pro",
    };

    const result = await invokeAgent(
      agentConfig,
      {
        sessionId,
        turn: conversationHistory.length + 1,
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          ...conversationHistory,
          { role: "user", content: userMessage },
        ],
      },
      async (span) => {
        // Chama API
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage, sessionId }),
        });

        if (!response.ok) {
          throw new Error(`AI request failed: ${response.status}`);
        }

        const aiResponse = await response.json();

        // Atributos de resposta
        span?.setAttribute("gen_ai.response.text", aiResponse.message);
        span?.setAttribute("gen_ai.response.id", aiResponse.responseId);
        span?.setAttribute("gen_ai.usage.total_tokens", aiResponse.totalTokens);
        span?.setAttribute("conversation.tools_used", aiResponse.toolsUsed?.length || 0);

        return aiResponse;
      }
    );

    // Atualiza histórico
    setConversationHistory((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: result.message },
    ]);
  };

  return (
    <div>
      {/* UI do chat */}
      <button onClick={() => handleSendMessage("Hello")}>Send Message</button>
    </div>
  );
}

// ============================================
// EXEMPLO 6: Span standalone sem contexto de transação
// ============================================

export async function exemploSpanStandalone() {
  // Se não houver transação ativa, Sentry.startSpan cria uma automaticamente
  const result = await Sentry.startSpan(
    {
      name: "invoke_agent Standalone Agent",
      op: "gen_ai.invoke_agent",
      attributes: {
        "gen_ai.operation.name": "invoke_agent",
        "gen_ai.agent.name": "Standalone Agent",
        "gen_ai.system": "gcp.gemini",
        "gen_ai.request.model": "gemini-2.5-pro",
      },
    },
    async (span) => {
      const response = await callGeminiAPI("Analyze document");

      span?.setAttribute("gen_ai.response.text", JSON.stringify([response.text]));
      span?.setAttribute("gen_ai.usage.total_tokens", response.usage.totalTokens);

      return response;
    }
  );

  return result;
}

// ============================================
// Funções auxiliares (mock)
// ============================================

interface GeminiResponse {
  id: string;
  text: string;
  usage: {
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
  toolCalls?: Array<{ name: string; arguments: unknown }>;
}

async function callGeminiAPI(_prompt: string): Promise<GeminiResponse> {
  // Simula chamada à API
  return {
    id: `gen_${Date.now()}`,
    text: "This is a mock response from Gemini API",
    usage: {
      promptTokens: 50,
      responseTokens: 100,
      totalTokens: 150,
    },
  };
}

async function executeToolFunction(toolName: string, _args: unknown): Promise<unknown> {
  // Simula execução de ferramenta
  if (toolName === "search_knowledge_base") {
    return {
      results: ["Result 1", "Result 2"],
    };
  }

  return { status: "ok" };
}
