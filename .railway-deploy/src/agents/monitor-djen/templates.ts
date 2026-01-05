/**
 * Templates e prompts para o agente Monitor DJEN
 * Separados do graph principal seguindo padrão Google Agent Starter Pack
 */

/**
 * System prompt para análise de publicações do DJEN
 */
export const DJEN_SYSTEM_PROMPT =
  `Você é um especialista em monitoramento do Diário de Justiça Eletrônico Nacional (DJEN).

**RESPONSABILIDADES:**
- Analisar publicações do DJEN em tempo real
- Identificar intimações críticas que exigem ação imediata
- Extrair números de processos e prazos processuais
- Classificar publicações por urgência e tipo
- Alertar sobre prazos iminentes (< 5 dias úteis)

**TIPOS DE PUBLICAÇÃO:**
- Intimações (prazos processuais)
- Citações (início de prazo para defesa)
- Decisões judiciais
- Despachos
- Sentenças
- Acórdãos

**ANÁLISE DE URGÊNCIA:**
- 🔴 CRÍTICA: Prazo < 48h úteis
- 🟡 ALTA: Prazo < 5 dias úteis
- 🟢 NORMAL: Prazo > 5 dias úteis
- ⚪ INFORMATIVA: Sem prazo processual

**DIRETRIZES:**
- Sempre extraia número do processo se disponível
- Calcule prazo em dias úteis (excluir finais de semana e feriados)
- Identifique o tipo de intimação (contestação, recurso, manifestação)
- Mencione artigos do CPC/15 relacionados aos prazos
- Responda SEMPRE em português brasileiro
`.trim();

/**
 * Prompt para análise de publicação específica
 */
export function generatePublicationAnalysisPrompt(publication: {
  court: string;
  date: string;
  content: string;
  processNumber?: string;
}): string {
  return `
**PUBLICAÇÃO DO DJEN:**

**Tribunal:** ${publication.court}
**Data:** ${publication.date}
**Processo:** ${publication.processNumber || "Não identificado"}

**Conteúdo:**
${publication.content}

---

**ANÁLISE SOLICITADA:**

1. **Tipo de Publicação**: Classifique (intimação, citação, decisão, despacho, sentença, acórdão)
2. **Urgência**: Classifique (🔴 CRÍTICA, 🟡 ALTA, 🟢 NORMAL, ⚪ INFORMATIVA)
3. **Prazo Processual**: Extraia o prazo em dias úteis (se aplicável)
4. **Ação Necessária**: Descreva a ação que deve ser tomada
5. **Artigos CPC/15**: Cite artigos relevantes sobre prazos
6. **Observações**: Informações adicionais importantes
`.trim();
}

/**
 * Mensagem de resumo de monitoramento
 */
export function formatMonitoringSummary(
  totalPublications: number,
  criticalCount: number,
  courtDistribution: Record<string, number>,
  executionTimeMs: number
): string {
  const courtsList = Object.entries(courtDistribution)
    .map(([court, count]) => `${court}: ${count}`)
    .join(", ");

  return `
📊 **Resumo do Monitoramento DJEN**

- **Total de publicações:** ${totalPublications}
- **Publicações críticas:** ${criticalCount} ${criticalCount > 0 ? "⚠️" : "✅"}
- **Tribunais monitorados:** ${courtsList || "Nenhum"}
- **Tempo de execução:** ${executionTimeMs}ms
- **Timestamp:** ${new Date().toISOString()}

${criticalCount > 0 ? "⚠️ **ATENÇÃO:** Existem publicações críticas que exigem análise imediata!" : ""}
`.trim();
}

/**
 * Template para mensagem de erro estruturado
 */
export function formatErrorMessage(
  errorType: string,
  errorMessage: string,
  context: {
    lawyerOAB?: string;
    courts?: string[];
    step?: string;
  }
): string {
  return `
⚠️ **Erro ao monitorar DJEN**

**Tipo:** ${errorType}
**Mensagem:** ${errorMessage}

**Contexto:**
- Advogado OAB: ${context.lawyerOAB || "N/A"}
- Tribunais: ${context.courts?.join(", ") || "Todos"}
- Etapa: ${context.step || "desconhecida"}

**Possíveis Causas:**
1. API do CNJ temporariamente indisponível
2. Credenciais de acesso inválidas
3. Limitação de taxa (rate limit) atingida
4. Conexão de rede instável

**Ações Recomendadas:**
1. Aguarde alguns minutos e tente novamente
2. Verifique se as credenciais estão corretas
3. Consulte manualmente: https://www.cnj.jus.br/dje/
4. Se persistir, entre em contato com suporte técnico
`.trim();
}

/**
 * Template para mensagem de fallback
 */
export function formatFallbackMessage(lawyerOAB?: string): string {
  return `
⚠️ **Sistema de monitoramento DJEN temporariamente indisponível**

**Advogado:** ${lawyerOAB || "Não especificado"}

**Alternativas:**
1. **Consulta Manual:** https://www.cnj.jus.br/dje/
2. **Portal do Advogado:** Acesse o portal de cada tribunal
3. **Aguardar:** Sistema estará disponível em breve

**Tribunais para Consulta Manual:**
- STF: https://portal.stf.jus.br/dje/
- STJ: https://www.stj.jus.br/publicacaoinstitucional/
- TST: https://www.tst.jus.br/dje

**Observação:** Esta é uma resposta automática devido a falha temporária no sistema.
`.trim();
}

/**
 * Formata detalhes de uma publicação crítica
 */
export function formatCriticalPublication(publication: {
  id: string;
  court: string;
  date: string;
  content: string;
  processNumber?: string;
}): string {
  return `
🚨 **PUBLICAÇÃO CRÍTICA DETECTADA**

**ID:** ${publication.id}
**Tribunal:** ${publication.court}
**Data:** ${publication.date}
**Processo:** ${publication.processNumber || "Não identificado"}

**Conteúdo:**
${publication.content.substring(0, 500)}${publication.content.length > 500 ? "..." : ""}

**AÇÃO NECESSÁRIA:** Análise imediata por advogado responsável
`.trim();
}
