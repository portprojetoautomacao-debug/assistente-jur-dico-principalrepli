/**
 * Templates para o agente Revisão Contratual
 */

export function formatReviewResult(
  tipoContrato: string,
  clausulasCount: number,
  riscosCount: number,
  textLength: number
): string {
  return `
📋 **Revisão Contratual Completa**

**Tipo:** ${tipoContrato}
**Tamanho:** ${textLength.toLocaleString("pt-BR")} caracteres
**Cláusulas Analisadas:** ${clausulasCount}
**Riscos Identificados:** ${riscosCount}

${riscosCount > 0 ? "⚠️ **Atenção:** Foram identificados riscos que exigem análise detalhada" : "✅ **Sem riscos críticos identificados**"}

**Recomendação:**
${riscosCount > 3 ? "Sugerimos revisão completa antes da assinatura" : "Revisar cláusulas marcadas e prosseguir"}
`.trim();
}

export function formatErrorMessage(
  errorType: string,
  errorMessage: string,
  context: { tipoContrato?: string }
): string {
  return `
⚠️ **Erro na revisão contratual**

**Tipo de Contrato:** ${context.tipoContrato || "N/A"}
**Erro:** ${errorType}
**Mensagem:** ${errorMessage}

**Ações:**
1. Verifique o formato do contrato
2. Certifique-se que o texto tem entre 100 e 50.000 caracteres
3. Tente novamente em alguns instantes
`.trim();
}

export function formatFallbackMessage(tipoContrato?: string): string {
  return `⚠️ Sistema de revisão contratual (${tipoContrato || "geral"}) temporariamente indisponível. Por favor, tente novamente.`;
}
