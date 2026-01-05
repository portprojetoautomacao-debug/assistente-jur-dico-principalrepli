import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import { callGemini } from "@/lib/gemini-service";
import { createInvokeAgentSpan } from "@/lib/sentry-gemini-integration-v2";
import { validateHarveyInput, ValidationError } from "./validators";
import {
  HARVEY_SYSTEM_PROMPT,
  generateAnalysisPrompt,
  generateUrgencyPrompt,
  formatErrorMessage,
} from "./templates";
import {
  logger,
  logAgentExecution,
  logStructuredError,
  logValidationError,
} from "../base/agent_logger";

export class HarveyAgent extends LangGraphAgent {
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    return createInvokeAgentSpan(
      {
        agentName: "Harvey Specter",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.6,
      },
      {
        sessionId: (state.data?.sessionId as string) || `harvey_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        let current = updateState(state, { currentStep: "harvey:start" });

        // ✅ MELHORIA 1: Validação de inputs
        let validatedInput;
        try {
          validatedInput = validateHarveyInput(state.data || {});
          logAgentExecution("Harvey Specter", "input_validated", {
            task: validatedInput.task.substring(0, 100),
            urgency: validatedInput.urgency,
            hasContext: !!validatedInput.context,
          });
        } catch (error) {
          if (error instanceof ValidationError) {
            logValidationError("Harvey Specter", error.field, error.message, error.receivedValue);

            const errorMsg = formatErrorMessage("ValidationError", error.message, {
              task: state.data?.task as string | undefined,
              step: "input_validation",
            });

            return this.addAgentMessage(
              updateState(current, {
                currentStep: "harvey:validation_error",
                completed: false,
                error: error.message,
              }),
              errorMsg
            );
          }
          throw error;
        }

        const { task, processNumber, context, urgency } = validatedInput;

        span?.setAttribute("harvey.task", task.substring(0, 200));
        span?.setAttribute("harvey.urgency", urgency);
        if (processNumber) span?.setAttribute("harvey.process_number", processNumber);

        // ✅ MELHORIA 2: Usar templates separados
        const systemPrompt = HARVEY_SYSTEM_PROMPT;
        const analysisPrompt =
          generateAnalysisPrompt(task, context, processNumber) +
          generateUrgencyPrompt(urgency || "medium");

        // ✅ MELHORIA 3: Error handling estruturado
        try {
          logAgentExecution("Harvey Specter", "calling_gemini", {
            promptLength: analysisPrompt.length,
          });

          const response = await callGemini(systemPrompt + "\n\n" + analysisPrompt, {
            temperature: 0.6,
            maxOutputTokens: 4096,
          });

          if (response.error) {
            logStructuredError("Harvey Specter", "GeminiAPIError", response.error, {
              task: task.substring(0, 100),
              processNumber,
            });

            span?.setAttribute("gen_ai.error", response.error);
            span?.setStatus({ code: 2, message: response.error });

            const errorMsg = formatErrorMessage("GeminiAPIError", response.error, {
              task,
              processNumber,
              step: "gemini_call",
            });

            return this.addAgentMessage(
              updateState(current, {
                currentStep: "harvey:error",
                data: { ...current.data, error: response.error },
                completed: false,
              }),
              errorMsg
            );
          }

          const result = response.text;
          const tokensUsed = response.metadata?.totalTokens || 0;

          logAgentExecution("Harvey Specter", "analysis_completed", {
            responseLength: result.length,
            tokensUsed,
          });

          span?.setAttribute("gen_ai.response.length", result.length);
          span?.setAttribute("gen_ai.usage.total_tokens", tokensUsed);
          span?.setStatus({ code: 1, message: "ok" });

          current = updateState(current, {
            currentStep: "harvey:analysis_complete",
            data: {
              ...current.data,
              summary: result,
              usage: response.metadata,
            },
            completed: true,
          });

          return this.addAgentMessage(current, result);
        } catch (error) {
          // ✅ MELHORIA 2: Error handling estruturado seguindo padrão Google
          const errorType = error instanceof Error ? error.name : "UnknownError";
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;

          logStructuredError("Harvey Specter", errorType, errorMessage, {
            task: task.substring(0, 100),
            processNumber,
            currentStep: current.currentStep,
            errorStack,
          });

          span?.setAttribute("gen_ai.error", errorMessage);
          span?.setStatus({ code: 2, message: "error" });

          const errorMsg = formatErrorMessage(errorType, errorMessage, {
            task,
            processNumber,
            step: current.currentStep,
          });

          return this.addAgentMessage(
            updateState(current, {
              currentStep: "harvey:error",
              data: { ...current.data, error: errorMessage },
              completed: false,
            }),
            errorMsg
          );
        }
      }
    );
  }
}

export async function runHarvey(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new HarveyAgent();
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
