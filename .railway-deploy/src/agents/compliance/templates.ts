/**
 * Templates para Compliance
 */

export function formatComplianceResult(
  tipo: string,
  violacoesCount: number,
  score: number
): string {
  return `
🔒 **Verificação de Compliance Concluída**

**Tipo:** ${tipo}
**Score de Conformidade:** ${score}%
**Violações Detectadas:** ${violacoesCount}

${violacoesCount === 0 ? "✅ **Conforme**" : "⚠️ **Ação necessária**"}
`.trim();
}

export function formatErrorMessage(errorType: string, errorMessage: string): string {
  return `⚠️ Erro na verificação de compliance: ${errorMessage}`;
}

export function formatFallbackMessage(): string {
  return "⚠️ Sistema de compliance temporariamente indisponível.";
}
