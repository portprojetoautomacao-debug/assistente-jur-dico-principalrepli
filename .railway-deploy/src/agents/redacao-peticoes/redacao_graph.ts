import { generatePeticao } from "@/lib/gemini-service";
import { createInvokeAgentSpan } from "@/lib/sentry-gemini-integration-v2";
import { logStructuredError, logValidationError } from "../base/agent_logger";
import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import { formatErrorMessage, formatFallbackMessage, formatPetitionResult } from "./templates";
import { validateRedacaoPeticoesInput, ValidationError } from "./validators";

export class RedacaoPeticoesAgent extends LangGraphAgent {
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    // 🔍 Instrumentar invocação do agente completo
    return createInvokeAgentSpan(
      {
        agentName: "Redação de Petições",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.5,
      },
      {
        sessionId: (state.data?.sessionId as string) || `redacao_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        try {
          let current = updateState(state, { currentStep: "redacao:validate" });

          // Step 0: Validate inputs
          const validatedInput = validateRedacaoPeticoesInput(state.data || {});

          span?.setAttribute("gen_ai.petition.type", validatedInput.tipo);
          span?.setAttribute("gen_ai.petition.details_length", validatedInput.detalhes.length);

          // Step 1: Generate petition
          current = updateState(current, { currentStep: "redacao:generate" });
          const geminiResponse = await generatePeticao(
            validatedInput.tipo,
            validatedInput.detalhes
          );

          if (geminiResponse.error) {
            throw new Error(geminiResponse.error);
          }

          const draft = geminiResponse.text;

          span?.setAttribute("gen_ai.response.length", draft.length);
          span?.setAttribute("gen_ai.response.model", geminiResponse.metadata?.model || "unknown");
          span?.setAttribute(
            "gen_ai.usage.total_tokens",
            geminiResponse.metadata?.totalTokens || 0
          );

          current = updateState(current, {
            currentStep: "redacao:done",
            data: {
              ...current.data,
              draft,
              metadata: geminiResponse.metadata,
            },
            completed: true,
          });

          const resultMessage = formatPetitionResult(
            validatedInput.tipo,
            draft.length,
            geminiResponse.metadata?.totalTokens
          );

          return this.addAgentMessage(current, resultMessage);
        } catch (error) {
          const errorType = error instanceof Error ? error.name : "UnknownError";
          const errorMessage = error instanceof Error ? error.message : String(error);

          if (error instanceof ValidationError) {
            logValidationError("Redação Petições", error.field, error.message, error.receivedValue);
          } else {
            logStructuredError("Redação Petições", errorType, errorMessage, {
              tipo: (state.data?.tipo as string) || undefined,
              step: state.currentStep,
            });
          }

          span?.setStatus({ code: 2, message: errorMessage });
          span?.setAttribute("error.type", errorType);

          const fallbackMessage =
            error instanceof ValidationError
              ? formatErrorMessage(errorType, errorMessage, {
                  tipo: (state.data?.tipo as string) || undefined,
                })
              : formatFallbackMessage((state.data?.tipo as string) || undefined);

          return this.addAgentMessage(state, fallbackMessage);
        }
      }
    );
  }
}

export async function runRedacaoPeticoes(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new RedacaoPeticoesAgent();
  const initialState: AgentState = {
    messages: [],
    currentStep: "init",
    data,
    completed: false,
    retryCount: 0,
    maxRetries: 3,
    startedAt: Date.now(),
    lastUpdatedAt: Date.now(),
  };

  return agent.execute(initialState);
}
