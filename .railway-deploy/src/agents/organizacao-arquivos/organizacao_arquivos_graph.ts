import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import { createInvokeAgentSpan, createChatSpan } from "@/lib/sentry-gemini-integration-v2";

export class OrganizacaoArquivosAgent extends LangGraphAgent {
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    // ?? Instrumentar invoca��o do agente Organiza��o de Arquivos
    return createInvokeAgentSpan(
      {
        agentName: "Organiza��o de Arquivos",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.3,
      },
      {
        sessionId: (state.data?.sessionId as string) || `organizacao_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        let current = updateState(state, { currentStep: "organizacao-arquivos:start" });

        // Extrair dados dos arquivos
        const arquivos = (state.data?.arquivos as Array<{ nome: string; tipo: string }>) || [];
        const processoId = (state.data?.processoId as string) || "";

        span?.setAttribute("organizacao.arquivos_count", arquivos.length);
        span?.setAttribute("organizacao.processo_id", processoId);

        // Usar LLM para categorizar arquivos
        const categorizacao = await createChatSpan(
          {
            agentName: "Organiza��o de Arquivos",
            system: "gemini",
            model: "gemini-2.5-pro",
            temperature: 0.3,
          },
          [
            {
              role: "system",
              content:
                "Voc� � um organizador de arquivos jur�dicos. Categorize documentos por tipo, prioridade e processo.",
            },
            {
              role: "user",
              content: `Organize os seguintes arquivos do processo ${processoId}:

${arquivos.map((a) => `- ${a.nome} (${a.tipo})`).join("\n")}

Crie uma estrutura de pastas l�gica:
1. Por tipo de documento (peti��es, contratos, decis�es, etc.)
2. Por ordem cronol�gica
3. Sugest�es de nomenclatura padronizada`,
            },
          ],
          async (chatSpan) => {
            // Simular categoriza��o
            await new Promise((resolve) => setTimeout(resolve, 30));

            const estrutura = {
              pastas: [
                {
                  nome: "01_Peticoes",
                  arquivos: arquivos.filter((a) => a.tipo === "peti��o").length,
                },
                {
                  nome: "02_Contratos",
                  arquivos: arquivos.filter((a) => a.tipo === "contrato").length,
                },
                {
                  nome: "03_Decisoes",
                  arquivos: arquivos.filter((a) => a.tipo === "decis�o").length,
                },
                {
                  nome: "04_Outros",
                  arquivos: arquivos.filter(
                    (a) => !["peti��o", "contrato", "decis�o"].includes(a.tipo)
                  ).length,
                },
              ],
              nomenclatura: [
                "AAAAMMDD_TipoDocumento_NomeDescritivo.pdf",
                "Exemplo: 20241208_Peticao_Inicial.pdf",
              ],
              totalOrganizado: arquivos.length,
            };

            chatSpan?.setAttribute("gen_ai.response.text", JSON.stringify([estrutura]));
            chatSpan?.setAttribute("gen_ai.usage.total_tokens", 180);

            return estrutura;
          }
        );

        span?.setAttribute("organizacao.pastas_criadas", categorizacao.pastas.length);
        span?.setAttribute("organizacao.total_organizado", categorizacao.totalOrganizado);

        current = updateState(current, {
          currentStep: "organizacao-arquivos:done",
          data: {
            ...current.data,
            ...categorizacao,
            organized: true,
          },
          completed: true,
        });

        span?.setStatus({ code: 1, message: "ok" });

        return this.addAgentMessage(
          current,
          `Organiza��o conclu�da: ${categorizacao.totalOrganizado} arquivo(s) em ${categorizacao.pastas.length} pasta(s)`
        );
      }
    );
  }
}

export async function runOrganizacaoArquivos(
  data: Record<string, unknown> = {}
): Promise<AgentState> {
  const agent = new OrganizacaoArquivosAgent();
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
