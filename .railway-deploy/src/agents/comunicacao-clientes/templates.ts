/**
 * Templates para Comunicação com Clientes
 */

export function formatMessageResult(tipo: string, cliente: string, length: number): string {
  return `
✉️ **Mensagem Gerada com Sucesso**

**Tipo:** ${tipo}
**Cliente:** ${cliente}
**Tamanho:** ${length} caracteres

✅ **Mensagem pronta para envio**
`.trim();
}

export function formatErrorMessage(errorType: string, errorMessage: string): string {
  return `⚠️ Erro ao gerar mensagem: ${errorMessage}`;
}

export function formatFallbackMessage(): string {
  return "⚠️ Sistema de comunicação temporariamente indisponível.";
}
