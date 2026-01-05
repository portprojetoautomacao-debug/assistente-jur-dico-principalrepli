import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import {
  createInvokeAgentSpan,
  createChatSpan,
  createExecuteToolSpan,
} from "@/lib/sentry-gemini-integration-v2";

export class ComplianceAgent extends LangGraphAgent {
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    // 🔍 Instrumentar invocação do agente Compliance
    return createInvokeAgentSpan(
      {
        agentName: "Compliance",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.1,
      },
      {
        sessionId: (state.data?.sessionId as string) || `compliance_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        let current = updateState(state, { currentStep: "compliance:start" });

        // Extrair dados para verificação
        const tipoVerificacao = (state.data?.tipoVerificacao as string) || "lgpd";
        const documentoTexto = (state.data?.documentoTexto as string) || "";
        const dadosPessoais = (state.data?.dadosPessoais as string[]) || [];

        span?.setAttribute("compliance.tipo_verificacao", tipoVerificacao);
        span?.setAttribute("compliance.documento_length", documentoTexto.length);
        span?.setAttribute("compliance.dados_pessoais_count", dadosPessoais.length);

        // 1. Usar tool para detectar dados sensíveis
        const dadosDetectados = await createExecuteToolSpan(
          {
            agentName: "Compliance",
            system: "gemini",
            model: "gemini-2.5-pro",
          },
          {
            toolName: "detect_personal_data",
            toolType: "function",
            toolInput: JSON.stringify({
              texto: documentoTexto.substring(0, 300),
            }),
          },
          async (toolSpan) => {
            // Simular detecção de dados pessoais
            await new Promise((resolve) => setTimeout(resolve, 20));

            const deteccoes = [
              { tipo: "cpf", valor: "***.***.***-**", posicao: 120, sensibilidade: "alta" },
              { tipo: "email", valor: "****@gmail.com", posicao: 250, sensibilidade: "média" },
              {
                tipo: "endereco",
                valor: "Rua ******, 123",
                posicao: 180,
                sensibilidade: "baixa",
              },
            ];

            toolSpan?.setAttribute("gen_ai.tool.output", JSON.stringify(deteccoes));
            toolSpan?.setAttribute("compliance.detections_count", deteccoes.length);
            toolSpan?.setAttribute(
              "compliance.high_sensitivity_count",
              deteccoes.filter((d) => d.sensibilidade === "alta").length
            );

            return deteccoes;
          }
        );

        span?.setAttribute("compliance.dados_detectados", dadosDetectados.length);

        // 2. Usar LLM para verificar conformidade LGPD
        const verificacao = await createChatSpan(
          {
            agentName: "Compliance",
            system: "gemini",
            model: "gemini-2.5-pro",
            temperature: 0.1,
          },
          [
            {
              role: "system",
              content:
                "Você é um auditor de compliance especializado em LGPD e proteção de dados. Seja rigoroso e cite artigos da lei.",
            },
            {
              role: "user",
              content: `Verifique conformidade com LGPD:

Tipo de verificação: ${tipoVerificacao}
Dados pessoais detectados: ${dadosDetectados.length}
Dados de alta sensibilidade: ${dadosDetectados.filter((d) => d.sensibilidade === "alta").length}

Dados fornecidos pelo sistema: ${dadosPessoais.join(", ")}

Verifique:
1. Há consentimento adequado? (Art. 7º LGPD)
2. Finalidade específica está declarada? (Art. 6º, I)
3. Dados sensíveis estão protegidos? (Art. 11)
4. Há política de retenção/exclusão? (Art. 16)
5. Riscos identificados`,
            },
          ],
          async (chatSpan) => {
            // Simular verificação LGPD
            await new Promise((resolve) => setTimeout(resolve, 40));

            const problemas = [];
            const recomendacoes = [];

            // Regras de compliance
            if (dadosDetectados.filter((d) => d.sensibilidade === "alta").length > 0) {
              problemas.push({
                artigo: "Art. 11 LGPD",
                descricao: "Dados sensíveis detectados sem proteção específica",
                severidade: "alta",
              });
              recomendacoes.push("Implementar criptografia para dados sensíveis (Art. 46, II)");
            }

            if (dadosPessoais.length === 0) {
              problemas.push({
                artigo: "Art. 6º, I LGPD",
                descricao: "Finalidade do tratamento não está clara",
                severidade: "média",
              });
              recomendacoes.push("Declarar finalidade específica do tratamento de dados");
            }

            const lgpdPassed = problemas.filter((p) => p.severidade === "alta").length === 0;

            const resultado = {
              lgpdPassed,
              problemas,
              recomendacoes,
              score: lgpdPassed ? 0.85 : 0.45,
              status: lgpdPassed ? "conforme" : "não-conforme",
            };

            chatSpan?.setAttribute("gen_ai.response.text", JSON.stringify([resultado]));
            chatSpan?.setAttribute("gen_ai.usage.total_tokens", 250);

            return resultado;
          }
        );

        span?.setAttribute("compliance.lgpd_passed", verificacao.lgpdPassed);
        span?.setAttribute("compliance.problemas_count", verificacao.problemas.length);
        span?.setAttribute("compliance.status", verificacao.status);
        span?.setAttribute("compliance.score", verificacao.score);

        current = updateState(current, {
          currentStep: "compliance:checked",
          data: {
            ...current.data,
            ...verificacao,
            dadosDetectados,
          },
          completed: true,
        });

        span?.setStatus({ code: 1, message: "ok" });

        return this.addAgentMessage(
          current,
          `Compliance ${verificacao.status.toUpperCase()}: ${verificacao.problemas.length} problema(s) (score: ${verificacao.score.toFixed(2)})`
        );
      }
    );
  }
}

export async function runCompliance(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new ComplianceAgent();
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
