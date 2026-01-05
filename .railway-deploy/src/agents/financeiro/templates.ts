/**
 * Templates para Financeiro
 */

export function formatFinancialResult(
  receitas: number,
  despesas: number,
  lucro: number,
  margem: number
): string {
  return `
💰 **Análise Financeira Completa**

**Receitas:** R$ ${receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
**Despesas:** R$ ${despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
**Lucro Líquido:** R$ ${lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
**Margem:** ${margem.toFixed(1)}%

${lucro >= 0 ? "✅ **Resultado positivo**" : "⚠️ **Atenção ao fluxo de caixa**"}
`.trim();
}

export function formatErrorMessage(errorType: string, errorMessage: string): string {
  return `⚠️ Erro na análise financeira: ${errorMessage}`;
}

export function formatFallbackMessage(): string {
  return "⚠️ Sistema financeiro temporariamente indisponível.";
}
