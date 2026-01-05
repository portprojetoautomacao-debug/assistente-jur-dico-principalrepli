import { createExecuteToolSpan, createInvokeAgentSpan } from "@/lib/sentry-gemini-integration-v2";
import { logStructuredError, logValidationError } from "../base/agent_logger";
import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import { formatAnalysisResult, formatErrorMessage, formatFallbackMessage } from "./templates";
import { validateAnaliseDocumentalInput, ValidationError } from "./validators";

export class AnaliseDocumentalAgent extends LangGraphAgent {
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    // 🔍 Instrumentar invocação do agente Análise Documental
    return createInvokeAgentSpan(
      {
        agentName: "Análise Documental",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.3,
      },
      {
        sessionId: (state.data?.sessionId as string) || `analise_doc_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        try {
          let current = updateState(state, { currentStep: "analise-documental:validate" });

          // Step 0: Validate inputs
          const validatedInput = validateAnaliseDocumentalInput(state.data || {});

          span?.setAttribute("analise.tipo_documento", validatedInput.tipoDocumento);
          span?.setAttribute("analise.texto_length", validatedInput.documentoTexto.length);

          current = updateState(current, { currentStep: "analise-documental:extract" });

          // Executar análise com tool (entity extraction)
          const entitiesExtracted = await createExecuteToolSpan(
            {
              agentName: "Análise Documental",
              system: "gemini",
              model: "gemini-2.5-pro",
            },
            {
              toolName: "entity_extraction",
              toolType: "function",
              toolInput: JSON.stringify({
                texto: validatedInput.documentoTexto.substring(0, 200), // Amostra
                tipo: validatedInput.tipoDocumento,
              }),
            },
            async (toolSpan) => {
              // Simular extração de entidades
              await new Promise((resolve) => setTimeout(resolve, 40));

              const entities = {
                partes: ["Autor: João Silva", "Réu: Empresa XYZ"],
                datas: ["2024-12-08", "2024-11-15"],
                valores: ["R$ 10.000,00", "R$ 5.000,00"],
                processos: ["1234567-89.2024.5.02.0999"],
              };

              toolSpan?.setAttribute("gen_ai.tool.output", JSON.stringify(entities));
              return entities;
            }
          );

          span?.setAttribute("analise.entities_found", Object.keys(entitiesExtracted).length);
          span?.setAttribute(
            "analise.entities_detail",
            JSON.stringify({
              partes: entitiesExtracted.partes.length,
              datas: entitiesExtracted.datas.length,
              valores: entitiesExtracted.valores.length,
            })
          );

          current = updateState(current, {
            currentStep: "analise-documental:extracted",
            data: {
              ...current.data,
              entities: entitiesExtracted,
              tipoDocumento: validatedInput.tipoDocumento,
            },
            completed: true,
          });

          span?.setStatus({ code: 1, message: "ok" });

          const resultMessage = formatAnalysisResult(
            validatedInput.tipoDocumento,
            entitiesExtracted,
            validatedInput.documentoTexto.length
          );

          return this.addAgentMessage(current, resultMessage);
        } catch (error) {
          const errorType = error instanceof Error ? error.name : "UnknownError";
          const errorMessage = error instanceof Error ? error.message : String(error);

          if (error instanceof ValidationError) {
            logValidationError(
              "Análise Documental",
              error.field,
              error.message,
              error.receivedValue
            );
          } else {
            logStructuredError("Análise Documental", errorType, errorMessage, {
              tipoDocumento: (state.data?.tipoDocumento as string) || undefined,
              step: state.currentStep,
            });
          }

          span?.setStatus({ code: 2, message: errorMessage });
          span?.setAttribute("error.type", errorType);

          const fallbackMessage =
            error instanceof ValidationError
              ? formatErrorMessage(errorType, errorMessage, {
                  tipoDocumento: (state.data?.tipoDocumento as string) || undefined,
                })
              : formatFallbackMessage();

          return this.addAgentMessage(state, fallbackMessage);
        }
      }
    );
  }
}

export async function runAnaliseDocumental(
  data: Record<string, unknown> = {}
): Promise<AgentState> {
  const agent = new AnaliseDocumentalAgent();
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
