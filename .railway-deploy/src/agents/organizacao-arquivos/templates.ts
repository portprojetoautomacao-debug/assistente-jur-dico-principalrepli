/**
 * Templates para Organização de Arquivos
 */

export function formatOrganizationResult(arquivosCount: number, categorias: number): string {
  return `
📁 **Organização Concluída**

**Arquivos Processados:** ${arquivosCount}
**Categorias Criadas:** ${categorias}

✅ **Arquivos organizados com sucesso**
`.trim();
}

export function formatErrorMessage(errorType: string, errorMessage: string): string {
  return `⚠️ Erro na organização: ${errorMessage}`;
}

export function formatFallbackMessage(): string {
  return "⚠️ Sistema de organização temporariamente indisponível.";
}
