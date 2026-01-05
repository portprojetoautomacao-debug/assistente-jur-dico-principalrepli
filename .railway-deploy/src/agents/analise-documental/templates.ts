/**
 * Templates para o agente Análise Documental
 */

export function formatAnalysisResult(
  tipoDocumento: string,
  entities: {
    partes: string[];
    datas: string[];
    valores: string[];
    processos: string[];
  },
  textLength: number
): string {
  return `
📄 **Análise Documental Completa**

**Tipo de Documento:** ${tipoDocumento}
**Tamanho:** ${textLength.toLocaleString("pt-BR")} caracteres

**Entidades Extraídas:**
- 👥 **Partes:** ${entities.partes.length} identificadas
${entities.partes.map((p) => `  - ${p}`).join("\n")}

- 📅 **Datas:** ${entities.datas.length} encontradas
${entities.datas.map((d) => `  - ${d}`).join("\n")}

- 💰 **Valores:** ${entities.valores.length} identificados
${entities.valores.map((v) => `  - ${v}`).join("\n")}

- 📋 **Processos:** ${entities.processos.length} referenciados
${entities.processos.map((p) => `  - ${p}`).join("\n")}
`.trim();
}

export function formatErrorMessage(
  errorType: string,
  errorMessage: string,
  context: { tipoDocumento?: string }
): string {
  return `
⚠️ **Erro na análise documental**

**Tipo:** ${errorType}
**Mensagem:** ${errorMessage}
**Documento:** ${context.tipoDocumento || "N/A"}

**Ações:**
1. Verifique o formato do documento
2. Certifique-se que o texto tem entre 50 e 100.000 caracteres
3. Tente novamente em alguns instantes
`.trim();
}

export function formatFallbackMessage(): string {
  return "⚠️ Sistema de análise documental temporariamente indisponível. Por favor, tente novamente.";
}
