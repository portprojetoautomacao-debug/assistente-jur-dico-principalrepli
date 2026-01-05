import { createInvokeAgentSpan } from "@/lib/sentry-gemini-integration-v2";
import { logStructuredError, logValidationError } from "../base/agent_logger";
import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import {
  formatErrorMessage,
  formatFallbackMessage,
  formatPrazoSummary,
  formatPrazoUrgenteAlert,
  formatPrazoVencidoAlert,
} from "./templates";
import { validateGestaoPrazosInput, ValidationError } from "./validators";

export class GestaoPrazosAgent extends LangGraphAgent {
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    // 🔍 Instrumentar invocação do agente Gestão de Prazos
    return createInvokeAgentSpan(
      {
        agentName: "Gestão de Prazos",
        system: "custom-llm",
        model: "prazo-calculator",
      },
      {
        sessionId: (state.data?.sessionId as string) || `gestao_prazos_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        try {
          let current = updateState(state, { currentStep: "gestao-prazos:validate" });

          // Step 0: Validate inputs
          const validatedInput = validateGestaoPrazosInput(state.data || {});

          span?.setAttribute("prazos.tipo_processo", validatedInput.tipoProcesso);
          span?.setAttribute("prazos.data_publicacao", validatedInput.dataPublicacao);
          span?.setAttribute("prazos.prazo_dias", validatedInput.prazoEmDias);
          span?.setAttribute("prazos.considera_feriados", validatedInput.considerarFeriados);
          span?.setAttribute("prazos.considera_recesso", validatedInput.considerarRecessoForense);

          // Step 1: Calculate deadline
          current = updateState(current, { currentStep: "gestao-prazos:calculate" });

          // Simular cálculo de prazo (incluindo dias úteis, feriados)
          await new Promise((resolve) => setTimeout(resolve, 30));

          const deadline = new Date(validatedInput.dataPublicacao);
          deadline.setDate(deadline.getDate() + validatedInput.prazoEmDias);

          // Step 2: Analyze urgency
          const hoje = new Date();
          const diffDias = Math.ceil((deadline.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
          const isUrgente = diffDias <= 5 && diffDias >= 0;
          const isVencido = diffDias < 0;

          span?.setAttribute("prazos.deadline", deadline.toISOString());
          span?.setAttribute("prazos.dias_restantes", diffDias);
          span?.setAttribute("prazos.urgente", isUrgente);
          span?.setAttribute("prazos.vencido", isVencido);

          current = updateState(current, {
            currentStep: "gestao-prazos:completed",
            data: {
              ...current.data,
              deadline: deadline.toISOString(),
              diasRestantes: diffDias,
              urgente: isUrgente,
              vencido: isVencido,
            },
            completed: true,
          });

          span?.setStatus({ code: 1, message: "ok" });

          // Step 3: Generate alerts if needed
          let alertMessage = "";
          if (isVencido) {
            alertMessage =
              "\n\n" +
              formatPrazoVencidoAlert(
                validatedInput.processNumber,
                validatedInput.tipoProcesso,
                deadline.toISOString(),
                diffDias
              );
          } else if (isUrgente) {
            alertMessage =
              "\n\n" +
              formatPrazoUrgenteAlert(
                validatedInput.processNumber,
                validatedInput.tipoProcesso,
                deadline.toISOString(),
                diffDias
              );
          }

          const summaryMessage =
            formatPrazoSummary(
              validatedInput.tipoProcesso,
              validatedInput.dataPublicacao,
              validatedInput.prazoEmDias,
              deadline.toISOString(),
              diffDias,
              isUrgente,
              validatedInput.considerarFeriados || false,
              validatedInput.considerarRecessoForense || false
            ) + alertMessage;

          return this.addAgentMessage(current, summaryMessage);
        } catch (error) {
          const errorType = error instanceof Error ? error.name : "UnknownError";
          const errorMessage = error instanceof Error ? error.message : String(error);

          if (error instanceof ValidationError) {
            logValidationError("Gestão de Prazos", error.field, error.message, error.receivedValue);
          } else {
            logStructuredError("Gestão de Prazos", errorType, errorMessage, {
              tipoProcesso: (state.data?.tipoProcesso as string) || undefined,
              dataPublicacao: (state.data?.dataPublicacao as string) || undefined,
              step: state.currentStep,
            });
          }

          span?.setStatus({ code: 2, message: errorMessage });
          span?.setAttribute("error.type", errorType);

          const fallbackMessage =
            error instanceof ValidationError
              ? formatErrorMessage(errorType, errorMessage, {
                  tipoProcesso: (state.data?.tipoProcesso as string) || undefined,
                  dataPublicacao: (state.data?.dataPublicacao as string) || undefined,
                  step: state.currentStep,
                })
              : formatFallbackMessage(
                  (state.data?.tipoProcesso as string) || undefined,
                  (state.data?.dataPublicacao as string) || undefined
                );

          return this.addAgentMessage(state, fallbackMessage);
        }
      }
    );
  }
}

export async function runGestaoPrazos(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new GestaoPrazosAgent();
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
