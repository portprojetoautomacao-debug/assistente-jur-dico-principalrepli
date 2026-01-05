import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import { callGemini } from "@/lib/gemini-service";
import { createInvokeAgentSpan } from "@/lib/sentry-gemini-integration-v2";
import { validateJustineInput, ValidationError } from "./validators";
import {
  JUSTINE_SYSTEM_PROMPT,
  generateIntimationAnalysisPrompt,
  formatErrorMessage,
  formatFallbackMessage,
} from "./templates";
import { logStructuredError, logValidationError } from "../base/agent_logger";

export class JustineAgent extends LangGraphAgent {
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    return createInvokeAgentSpan(
      {
        agentName: "Mrs. Justine",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.3,
      },
      {
        sessionId: (state.data?.sessionId as string) || `justine_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        try {
          let current = updateState(state, { currentStep: "justine:validate" });

          // Step 0: Validate inputs
          const validatedInput = validateJustineInput(state.data || {});

          span?.setAttribute("justine.task", validatedInput.task.substring(0, 100));
          span?.setAttribute("justine.priority", validatedInput.priority || "medium");
          span?.setAttribute(
            "justine.publications_count",
            validatedInput.publications?.length || 0
          );

          // Step 1: Generate analysis prompt
          current = updateState(current, { currentStep: "justine:analyze" });

          const fullPrompt = `${JUSTINE_SYSTEM_PROMPT}\n\n${generateIntimationAnalysisPrompt(validatedInput.task)}`;

          const response = await callGemini(fullPrompt, {
            temperature: 0.3,
            maxOutputTokens: 4096,
          });

          if (response.error) {
            span?.setAttribute("gen_ai.error", response.error);
            span?.setStatus({ code: 2, message: response.error });

            current = updateState(current, {
              currentStep: "justine:error",
              data: {
                ...current.data,
                error: response.error,
              },
              completed: false,
            });

            return this.addAgentMessage(
              current,
              `Erro ao processar análise de intimações: ${response.error}`
            );
          }

          const result = response.text;

          span?.setAttribute("gen_ai.response.length", result.length);
          span?.setAttribute("gen_ai.usage.total_tokens", response.metadata?.totalTokens || 0);
          span?.setStatus({ code: 1, message: "ok" });

          current = updateState(current, {
            currentStep: "justine:intimations_extracted",
            data: {
              ...current.data,
              analysis: result,
              found: 1,
              usage: response.metadata,
            },
            completed: true,
          });

          return this.addAgentMessage(current, result);
        } catch (error) {
          const errorType = error instanceof Error ? error.name : "UnknownError";
          const errorMessage = error instanceof Error ? error.message : String(error);

          if (error instanceof ValidationError) {
            logValidationError("Mrs. Justine", error.field, error.message, error.receivedValue);
          } else {
            logStructuredError("Mrs. Justine", errorType, errorMessage, {
              task: (state.data?.task as string)?.substring(0, 100) || undefined,
              step: state.currentStep,
            });
          }

          span?.setStatus({ code: 2, message: errorMessage });
          span?.setAttribute("error.type", errorType);

          const fallbackMessage =
            error instanceof ValidationError
              ? formatErrorMessage(errorType, errorMessage, {
                  task: (state.data?.task as string) || undefined,
                  step: state.currentStep,
                })
              : formatFallbackMessage((state.data?.task as string) || undefined);

          return this.addAgentMessage(state, fallbackMessage);
        }
      }
    );
  }
}

export async function runJustine(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new JustineAgent();
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
