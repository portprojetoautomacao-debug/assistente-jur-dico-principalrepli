import {
  createChatSpan,
  createExecuteToolSpan,
  createInvokeAgentSpan,
} from "@/lib/sentry-gemini-integration-v2";
import { logAgentExecution, logStructuredError, logValidationError } from "../base/agent_logger";
import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import { JurisprudenceRetriever, formatPrecedentes } from "./retrievers";
import {
  PESQUISA_JURIS_SYSTEM_PROMPT,
  formatErrorMessage,
  formatResultsSummary,
  generateSearchQueryPrompt,
} from "./templates";
import { ValidationError, validatePesquisaInput } from "./validators";

export class PesquisaJurisAgent extends LangGraphAgent {
  private readonly retriever: JurisprudenceRetriever;

  constructor(config?: ConstructorParameters<typeof LangGraphAgent>[0]) {
    super(config);
    this.retriever = new JurisprudenceRetriever();
  }

  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    // 🔍 Instrumentar invocação do agente Pesquisa Jurisprudencial
    return createInvokeAgentSpan(
      {
        agentName: "Pesquisa Jurisprudencial",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.4,
      },
      {
        sessionId: (state.data?.sessionId as string) || `pesquisa_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        let current = updateState(state, { currentStep: "pesquisa-juris:start" });

        // ✅ MELHORIA 1: Validação de inputs
        let validatedInput;
        try {
          validatedInput = validatePesquisaInput(state.data || {});
          logAgentExecution("Pesquisa Jurisprudencial", "input_validated", {
            tema: validatedInput.tema,
            tribunal: validatedInput.tribunal,
            limit: validatedInput.limit,
          });
        } catch (error) {
          if (error instanceof ValidationError) {
            logValidationError(
              "Pesquisa Jurisprudencial",
              error.field,
              error.message,
              error.receivedValue
            );

            const errorMsg = formatErrorMessage("ValidationError", error.message, {
              tema: state.data?.tema as string | undefined,
              tribunal: state.data?.tribunal as string | undefined,
              step: "input_validation",
            });

            return this.addAgentMessage(
              updateState(current, {
                currentStep: "pesquisa-juris:validation_error",
                completed: false,
                error: error.message,
              }),
              errorMsg
            );
          }
          throw error; // Re-throw unexpected errors
        }

        span?.setAttribute("pesquisa.tema", validatedInput.tema);
        span?.setAttribute("pesquisa.tribunal", validatedInput.tribunal);
        span?.setAttribute("pesquisa.data_inicio", validatedInput.dataInicio);

        // ✅ MELHORIA 2: Error handling estruturado com try-catch
        try {
          logAgentExecution("Pesquisa Jurisprudencial", "generating_search_query");

          // 1. Usar LLM para gerar query de busca otimizada
          const queryGerada = await createChatSpan(
            {
              agentName: "Pesquisa Jurisprudencial",
              system: "gemini",
              model: "gemini-2.5-pro",
              temperature: 0.4,
            },
            [
              {
                role: "system",
                content: PESQUISA_JURIS_SYSTEM_PROMPT,
              },
              {
                role: "user",
                content: generateSearchQueryPrompt(
                  validatedInput.tema,
                  validatedInput.tribunal || "todos"
                ),
              },
            ],
            async (chatSpan) => {
              // Simular geração de query
              await new Promise((resolve) => setTimeout(resolve, 25));

              const query = `"${validatedInput.tema}" AND tribunal:${validatedInput.tribunal} AND data:>${validatedInput.dataInicio}`;

              chatSpan?.setAttribute("gen_ai.response.text", JSON.stringify([query]));
              chatSpan?.setAttribute("gen_ai.usage.total_tokens", 150);

              return query;
            }
          );

          span?.setAttribute("pesquisa.query_gerada", queryGerada);
          logAgentExecution("Pesquisa Jurisprudencial", "query_generated", { query: queryGerada });

          // ✅ MELHORIA 3: Usar retriever separado com re-ranking
          logAgentExecution("Pesquisa Jurisprudencial", "searching_database");

          const searchResults = await createExecuteToolSpan(
            {
              agentName: "Pesquisa Jurisprudencial",
              system: "gemini",
              model: "gemini-2.5-pro",
            },
            {
              toolName: "search_jurisprudence_database",
              toolType: "datastore",
              toolInput: JSON.stringify({
                tema: validatedInput.tema,
                tribunal: validatedInput.tribunal,
                limit: validatedInput.limit,
                relevanceThreshold: validatedInput.relevanceThreshold,
              }),
            },
            async (toolSpan) => {
              const results = await this.retriever.search(validatedInput);

              toolSpan?.setAttribute("gen_ai.tool.output", JSON.stringify(results.precedentes));
              toolSpan?.setAttribute("search.results_count", results.totalFound);
              toolSpan?.setAttribute("search.avg_relevance", results.avgRelevance);
              toolSpan?.setAttribute("search.execution_time_ms", results.executionTimeMs);

              return results;
            }
          );

          const { precedentes, totalFound, avgRelevance, executionTimeMs } = searchResults;
          const tribunaisEncontrados = [...new Set(precedentes.map((p) => p.tribunal))];

          span?.setAttribute("pesquisa.resultados_encontrados", totalFound);
          span?.setAttribute("pesquisa.avg_relevance", avgRelevance);
          span?.setAttribute("pesquisa.tribunais_encontrados", tribunaisEncontrados.join(", "));
          span?.setAttribute("pesquisa.execution_time_ms", executionTimeMs);

          logAgentExecution("Pesquisa Jurisprudencial", "search_completed", {
            totalFound,
            avgRelevance,
            executionTimeMs,
          });

          // Formatar precedentes usando template
          const precedentesFormatados = formatPrecedentes(precedentes);
          const resumo = formatResultsSummary(
            totalFound,
            avgRelevance,
            tribunaisEncontrados,
            executionTimeMs
          );

          current = updateState(current, {
            currentStep: "pesquisa-juris:results",
            data: {
              ...current.data,
              query: queryGerada,
              precedentes,
              totalResultados: totalFound,
              avgRelevance,
              executionTimeMs,
            },
            completed: true,
          });

          span?.setStatus({ code: 1, message: "ok" });

          return this.addAgentMessage(current, `${resumo}\n\n---\n\n${precedentesFormatados}`);
        } catch (error) {
          // ✅ MELHORIA 2: Error handling estruturado seguindo padrão Google
          const errorType = error instanceof Error ? error.name : "UnknownError";
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;

          logStructuredError("Pesquisa Jurisprudencial", errorType, errorMessage, {
            tema: validatedInput.tema,
            tribunal: validatedInput.tribunal,
            currentStep: current.currentStep,
            errorStack,
          });

          span?.setStatus({ code: 2, message: errorMessage });

          const errorMsg = formatErrorMessage(errorType, errorMessage, {
            tema: validatedInput.tema,
            tribunal: validatedInput.tribunal,
            step: current.currentStep,
          });

          return this.addAgentMessage(
            updateState(current, {
              currentStep: "pesquisa-juris:error",
              completed: false,
              error: errorMessage,
            }),
            errorMsg
          );
        }
      }
    );
  }
}

export async function runPesquisaJuris(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new PesquisaJurisAgent();
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
