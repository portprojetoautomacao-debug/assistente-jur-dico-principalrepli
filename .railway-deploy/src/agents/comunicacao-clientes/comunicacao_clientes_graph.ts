import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import { createInvokeAgentSpan, createChatSpan } from "@/lib/sentry-gemini-integration-v2";

export class ComunicacaoClientesAgent extends LangGraphAgent {
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    // 🔍 Instrumentar invocação do agente Comunicação com Clientes
    return createInvokeAgentSpan(
      {
        agentName: "Comunicação com Clientes",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.7,
      },
      {
        sessionId: (state.data?.sessionId as string) || `comunicacao_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        let current = updateState(state, { currentStep: "comunicacao-clientes:start" });

        // Extrair dados da comunicação
        const tipoMensagem = (state.data?.tipoMensagem as string) || "atualizacao";
        const nomeCliente = (state.data?.nomeCliente as string) || "Cliente";
        const processoNumero = (state.data?.processoNumero as string) || "";
        const andamento = (state.data?.andamento as string) || "";
        const proximosPassos = (state.data?.proximosPassos as string[]) || [];

        span?.setAttribute("comunicacao.tipo_mensagem", tipoMensagem);
        span?.setAttribute("comunicacao.cliente", nomeCliente);
        span?.setAttribute("comunicacao.processo", processoNumero);
        span?.setAttribute("comunicacao.proximos_passos_count", proximosPassos.length);

        // Usar LLM para gerar comunicação personalizada
        const mensagem = await createChatSpan(
          {
            agentName: "Comunicação com Clientes",
            system: "gemini",
            model: "gemini-2.5-pro",
            temperature: 0.7,
          },
          [
            {
              role: "system",
              content:
                "Você é um assistente de comunicação jurídica. Gere mensagens profissionais, claras e empáticas para clientes.",
            },
            {
              role: "user",
              content: `Gere mensagem de ${tipoMensagem} para:

Cliente: ${nomeCliente}
Processo: ${processoNumero}
Andamento: ${andamento}
Próximos passos: ${proximosPassos.join(", ")}

A mensagem deve:
1. Ser cordial e profissional
2. Explicar o andamento em linguagem acessível
3. Informar próximos passos claramente
4. Tranquilizar o cliente sobre o acompanhamento`,
            },
          ],
          async (chatSpan) => {
            // Simular geração de mensagem
            await new Promise((resolve) => setTimeout(resolve, 30));

            const textoGerado = `Prezado(a) ${nomeCliente},

Venho por meio desta mantê-lo(a) informado(a) sobre o andamento do processo ${processoNumero}.

${andamento}

${
  proximosPassos.length > 0
    ? `Próximos passos:
${proximosPassos.map((p, i) => `${i + 1}. ${p}`).join("\n")}`
    : ""
}

Estamos acompanhando de perto todos os desdobramentos do caso e manteremos você informado(a) sobre qualquer novidade.

Atenciosamente,
Equipe Jurídica`;

            chatSpan?.setAttribute("gen_ai.response.text", JSON.stringify([textoGerado]));
            chatSpan?.setAttribute("gen_ai.usage.total_tokens", 200);
            chatSpan?.setAttribute("comunicacao.message_length", textoGerado.length);

            return textoGerado;
          }
        );

        span?.setAttribute("comunicacao.message_length", mensagem.length);
        span?.setAttribute("comunicacao.message_sent", true);

        current = updateState(current, {
          currentStep: "comunicacao-clientes:generated",
          data: {
            ...current.data,
            message: mensagem,
            tipo: tipoMensagem,
            enviado: false, // Aguardando aprovação do operador
          },
          completed: true,
        });

        span?.setStatus({ code: 1, message: "ok" });

        return this.addAgentMessage(
          current,
          `Comunicação gerada para ${nomeCliente} (${mensagem.length} caracteres) - Aguardando aprovação`
        );
      }
    );
  }
}

export async function runComunicacaoClientes(
  data: Record<string, unknown> = {}
): Promise<AgentState> {
  const agent = new ComunicacaoClientesAgent();
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
