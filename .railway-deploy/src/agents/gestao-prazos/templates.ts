/**
 * Templates e prompts para o agente Gestão de Prazos
 * Separados do graph principal seguindo padrão Google Agent Starter Pack
 */

/**
 * Formata resumo de cálculo de prazo
 */
export function formatPrazoSummary(
  tipoProcesso: string,
  dataPublicacao: string,
  prazoEmDias: number,
  deadline: string,
  diasRestantes: number,
  isUrgente: boolean,
  considerouFeriados: boolean,
  considerouRecesso: boolean
): string {
  const urgencyIcon = isUrgente ? "⚠️" : diasRestantes < 0 ? "🔴" : "✅";
  const urgencyText = isUrgente
    ? "URGENTE - Prazo próximo ao vencimento"
    : diasRestantes < 0
      ? "PRAZO VENCIDO"
      : "Prazo dentro do esperado";

  return `
📅 **Cálculo de Prazo Processual**

**Tipo de Processo:** ${tipoProcesso}
**Data de Publicação:** ${new Date(dataPublicacao).toLocaleDateString("pt-BR")}
**Prazo:** ${prazoEmDias} dias ${considerouFeriados ? "(úteis, excluindo feriados)" : "(corridos)"}
${considerouRecesso ? "⚖️ **Considerado Recesso Forense de Dezembro/Janeiro**" : ""}

---

**📍 Data Limite:** ${new Date(deadline).toLocaleDateString("pt-BR")}
**⏰ Dias Restantes:** ${diasRestantes} dias
**Status:** ${urgencyIcon} ${urgencyText}

${
  isUrgente
    ? "⚠️ **AÇÃO NECESSÁRIA:** Este prazo está próximo ao vencimento. Priorize as ações processuais."
    : ""
}
${
  diasRestantes < 0
    ? "🔴 **ATENÇÃO:** Este prazo já venceu! Verifique possibilidade de petição de justificativa ou reconsideração."
    : ""
}

**Base Legal (CPC/2015):**
- Art. 219: Contagem em dias úteis (exceto prazos determinados em meses/anos)
- Art. 220: Início da contagem no primeiro dia útil após intimação
- Art. 224: Suspensão durante feriados e recesso forense
`.trim();
}

/**
 * Template para mensagem de erro estruturado
 */
export function formatErrorMessage(
  errorType: string,
  errorMessage: string,
  context: {
    tipoProcesso?: string;
    dataPublicacao?: string;
    step?: string;
  }
): string {
  return `
⚠️ **Erro ao calcular prazo processual**

**Tipo:** ${errorType}
**Mensagem:** ${errorMessage}

**Contexto:**
- Tipo de Processo: ${context.tipoProcesso || "N/A"}
- Data de Publicação: ${context.dataPublicacao || "N/A"}
- Etapa: ${context.step || "desconhecida"}

**Possíveis Causas:**
1. Data de publicação inválida (use formato YYYY-MM-DD)
2. Prazo em dias fora do intervalo permitido (1-365 dias)
3. Tipo de processo não reconhecido
4. Calendário de feriados indisponível

**Ações Recomendadas:**
1. Verifique o formato da data de publicação
2. Confirme que o prazo está entre 1 e 365 dias
3. Use tipos de processo válidos: cível, trabalhista, penal, tributário
4. Consulte manualmente tabelas de prazos do CPC/CLT
`.trim();
}

/**
 * Template para mensagem de fallback
 */
export function formatFallbackMessage(tipoProcesso?: string, dataPublicacao?: string): string {
  return `
⚠️ **Sistema de cálculo de prazos temporariamente indisponível**

**Tipo de Processo:** ${tipoProcesso || "Não especificado"}
**Data de Publicação:** ${dataPublicacao ? new Date(dataPublicacao).toLocaleDateString("pt-BR") : "Não especificada"}

**Alternativas para Cálculo Manual:**

**Prazos Processuais Comuns (CPC/2015):**
- Contestação: 15 dias úteis (Art. 335)
- Apelação: 15 dias úteis (Art. 1.003)
- Agravo de Instrumento: 15 dias úteis (Art. 1.015)
- Embargos de Declaração: 5 dias úteis (Art. 1.022)
- Resposta a Recurso: 15 dias úteis (Art. 1.030)

**Regras de Contagem (CPC/2015):**
1. Dias úteis (excluir sábados, domingos e feriados) - Art. 219
2. Início: primeiro dia útil após intimação - Art. 220
3. Suspensão: durante recesso forense (20/dez a 20/jan) - Art. 220, §1º

**Ferramentas Alternativas:**
- Calculadora OAB: https://www.oab.org.br/
- CNJ Dias Úteis: https://www.cnj.jus.br/
- Tabelas processuais dos tribunais

**Observação:** Esta é uma resposta automática devido a falha temporária no sistema.
`.trim();
}

/**
 * Formata alerta de prazo vencido
 */
export function formatPrazoVencidoAlert(
  processNumber: string | undefined,
  tipoProcesso: string,
  deadline: string,
  diasAtrasados: number
): string {
  return `
🔴 **ALERTA: PRAZO PROCESSUAL VENCIDO**

**Processo:** ${processNumber || "Não especificado"}
**Tipo:** ${tipoProcesso}
**Data Limite:** ${new Date(deadline).toLocaleDateString("pt-BR")}
**Dias em Atraso:** ${Math.abs(diasAtrasados)} dias

**AÇÃO IMEDIATA NECESSÁRIA:**
1. Verificar se há possibilidade de justificativa de atraso
2. Analisar cabimento de petição de reconsideração
3. Avaliar impacto processual da perda do prazo
4. Consultar advogado responsável imediatamente

**Base Legal:**
- Art. 223 CPC/2015: Possibilidade de justificativa em caso fortuito/força maior
- Art. 1.007 CPC/2015: Deserção de recurso por intempestividade

⚠️ **ATENÇÃO:** A perda de prazo pode resultar em preclusão ou deserção de recurso.
`.trim();
}

/**
 * Formata alerta de prazo urgente
 */
export function formatPrazoUrgenteAlert(
  processNumber: string | undefined,
  tipoProcesso: string,
  deadline: string,
  diasRestantes: number
): string {
  return `
⚠️ **ALERTA: PRAZO PROCESSUAL URGENTE**

**Processo:** ${processNumber || "Não especificado"}
**Tipo:** ${tipoProcesso}
**Data Limite:** ${new Date(deadline).toLocaleDateString("pt-BR")}
**Dias Restantes:** ${diasRestantes} dias

**AÇÃO PRIORITÁRIA:**
- Priorize a elaboração e protocolo da petição/manifestação
- Confirme documentos necessários
- Verifique assinatura digital e certificado A1/A3
- Agende revisão final antes do protocolo

${
  diasRestantes <= 2
    ? "🚨 **CRÍTICO:** Menos de 3 dias para o vencimento. Protocole HOJE se possível."
    : ""
}
`.trim();
}
