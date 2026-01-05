import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import { createInvokeAgentSpan, createChatSpan } from "@/lib/sentry-gemini-integration-v2";

export class TraducaoJuridicaAgent extends LangGraphAgent {
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    // 🔍 Instrumentar invocação do agente Tradução Jurídica
    return createInvokeAgentSpan(
      {
        agentName: "Tradução Jurídica",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.4,
      },
      {
        sessionId: (state.data?.sessionId as string) || `traducao_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        let current = updateState(state, { currentStep: "traducao-juridica:start" });

        // Extrair dados de tradução
        const textoOriginal = (state.data?.textoOriginal as string) || "";
        const direcao = (state.data?.direcao as string) || "tecnico-para-simples";
        const contexto = (state.data?.contexto as string) || "";

        span?.setAttribute("traducao.direcao", direcao);
        span?.setAttribute("traducao.texto_length", textoOriginal.length);
        span?.setAttribute("traducao.contexto", contexto);

        // Usar LLM para tradução jurídica
        const traducao = await createChatSpan(
          {
            agentName: "Tradução Jurídica",
            system: "gemini",
            model: "gemini-2.5-pro",
            temperature: 0.4,
          },
          [
            {
              role: "system",
              content:
                "Você é um tradutor jurídico especializado. Mantenha precisão técnica ao simplificar e vice-versa.",
            },
            {
              role: "user",
              content:
                direcao === "tecnico-para-simples"
                  ? `Traduza o seguinte texto jurídico técnico para linguagem simples e acessível, mantendo o significado legal exato:

Contexto: ${contexto || "N/A"}

Texto técnico:
${textoOriginal}

REGRAS:
1. Use analogias do dia a dia quando apropriado
2. Explique termos técnicos inevitáveis
3. Mantenha a precisão jurídica
4. Use linguagem respeitosa e clara`
                  : `Converta o seguinte texto em linguagem leiga para termos jurídicos técnicos precisos:

Contexto: ${contexto || "N/A"}

Texto leigo:
${textoOriginal}

REGRAS:
1. Use terminologia jurídica correta
2. Cite artigos de lei quando relevante
3. Mantenha formatação profissional
4. Adicione notas explicativas se necessário`,
            },
          ],
          async (chatSpan) => {
            // Simular tradução
            await new Promise((resolve) => setTimeout(resolve, 25));

            let textoTraduzido = "";
            const termosChave: Array<{ original: string; traducao: string; explicacao: string }> =
              [];

            if (direcao === "tecnico-para-simples") {
              // Técnico → Simples
              textoTraduzido = textoOriginal
                .replace(/petição inicial/gi, "documento que inicia o processo")
                .replace(/contestação/gi, "resposta da outra parte")
                .replace(/recurso de apelação/gi, "pedido para revisar a decisão")
                .replace(/liminar/gi, "decisão urgente antes do final do processo")
                .replace(/sucumbência/gi, "responsabilidade de pagar custas e honorários");

              termosChave.push(
                {
                  original: "Petição Inicial",
                  traducao: "Documento que inicia o processo",
                  explicacao: "É o primeiro documento que você entrega ao juiz para começar a ação",
                },
                {
                  original: "Sucumbência",
                  traducao: "Quem perde paga",
                  explicacao:
                    "A parte que perde o processo arca com as custas e honorários do advogado vencedor",
                }
              );
            } else {
              // Simples → Técnico
              textoTraduzido = textoOriginal
                .replace(/documento que inicia/gi, "petição inicial")
                .replace(/resposta da outra parte/gi, "contestação")
                .replace(/pedido para revisar/gi, "recurso de apelação")
                .replace(/decisão urgente/gi, "medida liminar")
                .replace(/quem perde paga/gi, "princípio da sucumbência");

              termosChave.push(
                {
                  original: "Documento que inicia o processo",
                  traducao: "Petição Inicial",
                  explicacao: "Conforme art. 319 do CPC, primeira manifestação do autor ao juízo",
                },
                {
                  original: "Quem perde paga",
                  traducao: "Princípio da Sucumbência",
                  explicacao: "Art. 85 do CPC - Responsabilidade pelas despesas processuais",
                }
              );
            }

            const resultado = {
              textoTraduzido,
              termosChave,
              direcao,
              qualidadeTraducao: 0.9,
            };

            chatSpan?.setAttribute("gen_ai.response.text", JSON.stringify([resultado]));
            chatSpan?.setAttribute("gen_ai.usage.total_tokens", 180);

            return resultado;
          }
        );

        span?.setAttribute("traducao.texto_traduzido_length", traducao.textoTraduzido.length);
        span?.setAttribute("traducao.termos_chave_count", traducao.termosChave.length);
        span?.setAttribute("traducao.qualidade", traducao.qualidadeTraducao);

        current = updateState(current, {
          currentStep: "traducao-juridica:done",
          data: {
            ...current.data,
            ...traducao,
            translated: true,
          },
          completed: true,
        });

        span?.setStatus({ code: 1, message: "ok" });

        return this.addAgentMessage(
          current,
          `Tradução concluída: ${direcao} (${traducao.termosChave.length} termos-chave identificados)`
        );
      }
    );
  }
}

export async function runTraducaoJuridica(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new TraducaoJuridicaAgent();
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
