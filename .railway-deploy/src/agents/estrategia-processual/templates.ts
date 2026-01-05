/**
 * Templates para Estratégia Processual
 */

export function formatStrategyResult(tipo: string, fase: string, acoes: number): string {
  return `
⚖️ **Estratégia Processual Definida**

**Tipo de Caso:** ${tipo}
**Fase:** ${fase}
**Ações Planejadas:** ${acoes}

✅ **Estratégia pronta para execução**
`.trim();
}

export function formatErrorMessage(errorType: string, errorMessage: string): string {
  return `⚠️ Erro na definição de estratégia: ${errorMessage}`;
}

export function formatFallbackMessage(): string {
  return "⚠️ Sistema de estratégia processual temporariamente indisponível.";
}
