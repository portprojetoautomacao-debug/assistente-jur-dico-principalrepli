/**
 * Templates para Análise de Risco
 */

export function formatRiskResult(
  tipo: string,
  nivel: string,
  probabilidade: number,
  impacto: string
): string {
  return `
⚠️ **Análise de Risco Concluída**

**Tipo de Caso:** ${tipo}
**Nível de Risco:** ${nivel}
**Probabilidade de Êxito:** ${probabilidade}%
**Impacto Financeiro:** ${impacto}

${probabilidade >= 70 ? "✅ **Perspectiva favorável**" : "⚠️ **Avaliar estratégia**"}
`.trim();
}

export function formatErrorMessage(errorType: string, errorMessage: string): string {
  return `⚠️ Erro na análise de risco: ${errorMessage}`;
}

export function formatFallbackMessage(): string {
  return "⚠️ Sistema de análise de risco temporariamente indisponível.";
}
