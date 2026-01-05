/**
 * Templates para o agente Redação de Petições
 */

export function formatPetitionResult(
  tipo: string,
  draftLength: number,
  tokenUsage?: number
): string {
  return `
📝 **Petição Redigida com Sucesso**

**Tipo:** ${tipo}
**Tamanho:** ${draftLength.toLocaleString("pt-BR")} caracteres
**Tokens Utilizados:** ${tokenUsage ? tokenUsage.toLocaleString("pt-BR") : "N/A"}

✅ **Rascunho disponível para revisão**

**Próximos Passos:**
1. Revisar o texto gerado
2. Ajustar detalhes específicos
3. Adicionar documentos comprobatórios
4. Protocolar no sistema processual
`.trim();
}

export function formatErrorMessage(
  errorType: string,
  errorMessage: string,
  context: { tipo?: string }
): string {
  return `
⚠️ **Erro na redação da petição**

**Tipo de Petição:** ${context.tipo || "N/A"}
**Erro:** ${errorType}
**Mensagem:** ${errorMessage}

**Ações:**
1. Verifique se os detalhes foram fornecidos corretamente
2. Certifique-se que o tipo de petição é válido
3. Tente novamente em alguns instantes
`.trim();
}

export function formatFallbackMessage(tipo?: string): string {
  return `⚠️ Sistema de redação de ${tipo || "petições"} temporariamente indisponível. Por favor, tente novamente.`;
}
