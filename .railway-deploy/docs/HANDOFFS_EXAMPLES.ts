/**
 * Exemplo de Handoffs entre Agentes com Sentry AI Monitoring v2
 * 
 * Este arquivo demonstra como implementar transferências (handoffs) entre agentes
 * usando createHandoffSpan() do Sentry.
 * 
 * Caso de uso: Harvey Specter detecta intimação → Transfere para Mrs. Justin-e
 */

import { createHandoffSpan, createInvokeAgentSpan } from "@/lib/sentry-gemini-integration-v2";
import type { Expediente } from "@/types";

/**
 * Exemplo 1: Harvey detecta intimação e transfere para Mrs. Justin-e
 */
export async function harveyDetectaIntimacaoETransfere(
  mensagemUsuario: string,
  expediente?: Expediente
): Promise<{ transferred: boolean; reason: string }> {
  // Verifica se mensagem menciona intimação
  const keywords = ["intimação", "intimacao", "prazo", "expediente"];
  const contemIntimacao = keywords.some((k) => mensagemUsuario.toLowerCase().includes(k));

  if (!contemIntimacao) {
    return { transferred: false, reason: "Não detectou intimação na mensagem" };
  }

  // 🔥 SENTRY: Registrar handoff Harvey → Mrs. Justin-e
  await createHandoffSpan("Harvey Specter", "Mrs. Justin-e", {
    reason: "Intimação detectada",
    context: {
      userMessage: mensagemUsuario,
      expedienteId: expediente?.id,
      numeroProcesso: expediente?.numeroProcesso,
    },
  });

  // Simular transferência real (chamar Mrs. Justin-e)
  console.log(`[Handoff] Harvey → Mrs. Justin-e: ${mensagemUsuario}`);

  return {
    transferred: true,
    reason: "Intimação detectada - transferido para análise especializada",
  };
}

/**
 * Exemplo 2: Mrs. Justin-e analisa e transfere para Redação
 */
export async function justineAnalisaETransfereParaRedacao(
  expediente: Expediente,
  analiseCompleta: boolean
): Promise<{ transferred: boolean; nextAgent: string | null }> {
  if (!analiseCompleta) {
    return { transferred: false, nextAgent: null };
  }

  // Verifica se precisa de redação de petição
  const precisaRedigir = expediente.suggestedAction?.toLowerCase().includes("petição");

  if (precisaRedigir) {
    // 🔥 SENTRY: Registrar handoff Mrs. Justin-e → Redação
    await createHandoffSpan("Mrs. Justin-e", "Redação de Petições", {
      reason: "Necessidade de redigir petição",
      context: {
        expedienteId: expediente.id,
        numeroProcesso: expediente.numeroProcesso,
        tipoDocumento: expediente.documentType,
        prazo: expediente.deadline,
      },
    });

    console.log(`[Handoff] Mrs. Justin-e → Redação: Processo ${expediente.numeroProcesso}`);

    return { transferred: true, nextAgent: "redacao-peticoes" };
  }

  return { transferred: false, nextAgent: null };
}

/**
 * Exemplo 3: Fluxo completo com múltiplos handoffs
 */
export async function fluxoCompletoComHandoffs(userMessage: string): Promise<string> {
  const sessionId = `handoff-demo-${Date.now()}`;
  
  // 1. Harvey processa mensagem inicial
  const harveyResult = await createInvokeAgentSpan(
    {
      agentName: "Harvey Specter",
      system: "gcp.gemini",
      model: "gemini-2.5-pro",
      temperature: 0.8,
    },
    {
      sessionId,
      turn: 1,
      messages: [{ role: "user", content: userMessage }],
    },
    async (span) => {
      span?.setAttribute("stage", "initial-analysis");
      
      // Simular análise
      const contemIntimacao = userMessage.toLowerCase().includes("intimação");
      
      return {
        needsTransfer: contemIntimacao,
        targetAgent: contemIntimacao ? "Mrs. Justin-e" : null,
        response: contemIntimacao
          ? "Detectei uma intimação. Vou transferir para Mrs. Justin-e fazer análise detalhada."
          : "Como posso ajudá-lo?",
      };
    }
  );

  if (!harveyResult.needsTransfer) {
    return harveyResult.response;
  }

  // 2. Handoff para Mrs. Justin-e
  await createHandoffSpan("Harvey Specter", "Mrs. Justin-e", {
    reason: "Intimação detectada por Harvey",
    context: { userMessage, sessionId },
  });

  // 3. Mrs. Justin-e assume
  const justineResult = await createInvokeAgentSpan(
    {
      agentName: "Mrs. Justin-e",
      system: "gcp.gemini",
      model: "gemini-2.5-pro",
      temperature: 0.3,
    },
    {
      sessionId,
      turn: 2, // Segundo turno da conversa
      messages: [
        { role: "assistant", content: harveyResult.response },
        { role: "user", content: userMessage },
      ],
    },
    async (span) => {
      span?.setAttribute("stage", "intimation-analysis");
      
      // Simular análise de intimação
      const needsPetition = Math.random() > 0.5;
      
      return {
        analyzed: true,
        needsPetition,
        deadline: "15 dias úteis",
        response: needsPetition
          ? "Análise concluída. Prazo: 15 dias. Vou transferir para Redação preparar a contestação."
          : "Análise concluída. Prazo: 15 dias. Nenhuma petição necessária.",
      };
    }
  );

  if (!justineResult.needsPetition) {
    return justineResult.response;
  }

  // 4. Handoff para Redação
  await createHandoffSpan("Mrs. Justin-e", "Redação de Petições", {
    reason: "Necessidade de redigir contestação",
    context: {
      deadline: justineResult.deadline,
      sessionId,
    },
  });

  // 5. Redação assume
  const redacaoResult = await createInvokeAgentSpan(
    {
      agentName: "Redação de Petições",
      system: "gcp.gemini",
      model: "gemini-2.5-pro",
      temperature: 0.7,
    },
    {
      sessionId,
      turn: 3, // Terceiro turno
      messages: [
        { role: "assistant", content: justineResult.response },
      ],
    },
    async (span) => {
      span?.setAttribute("stage", "petition-drafting");
      span?.setAttribute("document.type", "Contestação");
      
      // Simular redação
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      return {
        drafted: true,
        response: "Contestação redigida com sucesso e salva no Google Docs.",
      };
    }
  );

  return `${harveyResult.response}\n\n${justineResult.response}\n\n${redacaoResult.response}`;
}

/**
 * Exemplo 4: Uso em componentes React
 */
export function useAgentHandoffs() {
  const handleHarveyToJustine = async (message: string) => {
    const result = await harveyDetectaIntimacaoETransfere(message);
    
    if (result.transferred) {
      // Atualizar UI mostrando transferência
      console.log(`✅ Transferido: ${result.reason}`);
    }
    
    return result;
  };

  return {
    handleHarveyToJustine,
    handleJustineToRedacao: justineAnalisaETransfereParaRedacao,
  };
}

/**
 * Exemplo 5: Monitoramento no Sentry Dashboard
 * 
 * Para verificar handoffs no Sentry:
 * 1. Acessar: https://sentry.io
 * 2. Insights → AI → AI Agents
 * 3. Filtrar por: operation = "gen_ai.handoff"
 * 
 * Atributos disponíveis:
 * - gen_ai.agent.from: "Harvey Specter"
 * - gen_ai.agent.to: "Mrs. Justin-e"
 * - handoff.reason: "Intimação detectada"
 * - handoff.context: { userMessage, expedienteId, ... }
 * 
 * Timeline esperada:
 * [Harvey] gen_ai.invoke_agent
 *    ↓
 * [Handoff] gen_ai.handoff (Harvey → Justin-e)
 *    ↓
 * [Mrs. Justin-e] gen_ai.invoke_agent
 *    ↓
 * [Handoff] gen_ai.handoff (Justin-e → Redação)
 *    ↓
 * [Redação] gen_ai.invoke_agent
 */

export const HANDOFF_EXAMPLES = {
  harveyDetectaIntimacaoETransfere,
  justineAnalisaETransfereParaRedacao,
  fluxoCompletoComHandoffs,
  useAgentHandoffs,
};
