/**
 * Templates e prompts para o agente Harvey Specter
 * Separados do graph principal seguindo padrão Google Agent Starter Pack
 */

/**
 * System prompt principal para Harvey Specter
 */
export const HARVEY_SYSTEM_PROMPT =
  `Você é Harvey Specter, estrategista jurídico sênior com vasta experiência em litígios complexos e negociações de alto risco.

**RESPONSABILIDADES:**
- Analisar estratégias jurídicas complexas com visão 360°
- Identificar riscos e oportunidades em processos judiciais
- Fornecer insights estratégicos sobre casos jurídicos
- Sugerir táticas processuais eficazes e inovadoras
- Antecipar movimentos da parte contrária

**ESTILO DE COMUNICAÇÃO:**
- Direto, confiante e objetivo
- Linguagem jurídica precisa mas acessível
- Foco em soluções práticas e executáveis
- Análise de custo-benefício de cada estratégia

**REFERÊNCIAS LEGAIS:**
- Cite artigos relevantes (CF/88, CPC/15, CC/02, CLT)
- Mencione jurisprudência dos tribunais superiores quando aplicável
- Indique prazos processuais críticos
- Aponte riscos de sucumbência e honorários

**DIRETRIZES:**
- Responda SEMPRE em português brasileiro
- Priorize estratégias com maior probabilidade de sucesso
- Considere custos processuais e tempo estimado
- Sugira alternativas (acordo, mediação, arbitragem) quando viável
`.trim();

/**
 * Prompt para análise estratégica detalhada
 */
export function generateAnalysisPrompt(
  task: string,
  context?: string,
  processNumber?: string
): string {
  let prompt = `**ANÁLISE ESTRATÉGICA SOLICITADA:**\n${task}\n\n`;

  if (processNumber) {
    prompt += `**PROCESSO:** ${processNumber}\n\n`;
  }

  if (context) {
    prompt += `**CONTEXTO ADICIONAL:**\n${context}\n\n`;
  }

  prompt += `**FORNEÇA:**
1. **Resumo Executivo**: Visão geral da situação (3-5 linhas)
2. **Análise de Riscos**: Pontos críticos que podem comprometer o caso
3. **Oportunidades**: Aspectos favoráveis a explorar
4. **Estratégia Recomendada**: Abordagem tática detalhada
5. **Próximos Passos**: Ações imediatas prioritárias (lista numerada)
6. **Alternativas**: Outras opções estratégicas (se aplicável)
7. **Estimativa de Tempo**: Prazo estimado para conclusão
8. **Avaliação de Sucesso**: Probabilidade percentual estimada`;

  return prompt;
}

/**
 * Prompt para análise de urgência
 */
export function generateUrgencyPrompt(urgency: "low" | "medium" | "high"): string {
  const urgencyLabels = {
    low: "⚪ URGÊNCIA BAIXA - Análise detalhada permitida",
    medium: "🟡 URGÊNCIA MÉDIA - Priorize pontos críticos",
    high: "🔴 URGÊNCIA ALTA - Foco em ações imediatas",
  };

  return `\n**${urgencyLabels[urgency]}**\n`;
}

/**
 * Template para mensagem de erro estruturado
 */
export function formatErrorMessage(
  errorType: string,
  errorMessage: string,
  context: {
    task?: string;
    processNumber?: string;
    step?: string;
  }
): string {
  return `
⚠️ **Erro ao executar análise estratégica (Harvey Specter)**

**Tipo:** ${errorType}
**Mensagem:** ${errorMessage}

**Contexto:**
- Tarefa solicitada: ${context.task || "não especificada"}
- Processo: ${context.processNumber || "N/A"}
- Etapa: ${context.step || "desconhecida"}

**Ações Recomendadas:**
1. Verifique se a descrição da tarefa está clara e completa
2. Tente reformular a solicitação de forma mais específica
3. Se o erro persistir, entre em contato com o suporte técnico

**Alternativa:** Consulte diretamente um advogado sênior para análise manual.
`.trim();
}

/**
 * Template para mensagem de fallback
 */
export function formatFallbackMessage(task: string): string {
  return `
⚠️ **Sistema de análise estratégica temporariamente indisponível**

**Tarefa solicitada:** ${task}

**Alternativas Imediatas:**
1. **Análise Manual**: Consulte advogado sênior para revisão estratégica
2. **Pesquisa Jurisprudencial**: Use o agente de Pesquisa Juris para precedentes
3. **Aguardar Breve Período**: Sistema estará disponível em alguns minutos

**Pontos para Considerar Manualmente:**
- Prazos processuais urgentes (verificar CPC/15)
- Provas e documentos pendentes
- Possibilidade de acordo pré-processual
- Análise de custos vs. benefícios

**Observação:** Esta é uma resposta automática devido a falha temporária no sistema de IA.
`.trim();
}

/**
 * Formatação de resumo de análise
 */
export function formatAnalysisSummary(
  task: string,
  tokensUsed: number,
  executionTimeMs: number
): string {
  return `
📊 **Resumo da Análise Estratégica**

- **Solicitação:** ${task.substring(0, 100)}${task.length > 100 ? "..." : ""}
- **Tokens utilizados:** ${tokensUsed}
- **Tempo de execução:** ${executionTimeMs}ms
- **Agente:** Harvey Specter (Estratégia Jurídica)
`.trim();
}
