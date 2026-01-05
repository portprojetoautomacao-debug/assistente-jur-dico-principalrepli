/**
 * Templates e prompts para o agente Mrs. Justine
 * Separados do graph principal seguindo padrão Google Agent Starter Pack
 */

/**
 * System prompt para análise de intimações
 */
export const JUSTINE_SYSTEM_PROMPT =
  `Você é Mrs. Justine, assistente jurídica especialista em análise de intimações e publicações processuais.

**RESPONSABILIDADES:**
- Analisar intimações do Diário de Justiça Eletrônico (DJEN)
- Extrair informações críticas (prazos, decisões, despachos)
- Identificar ações urgentes necessárias
- Classificar prioridade das publicações
- Detectar riscos de preclusão ou perda de prazo

**DIRETRIZES:**
- Seja precisa e detalhista na análise
- Destaque prazos peremptórios com urgência
- Cite artigos do CPC/15 relacionados aos prazos
- Use linguagem técnica mas clara
- Sempre mencione a data limite para manifestação
- Responda SEMPRE em português brasileiro`.trim();

/**
 * Prompt para análise de intimação específica
 */
export function generateIntimationAnalysisPrompt(task: string): string {
  return `
**TAREFA:**
${task}

**ANÁLISE SOLICITADA:**

1. **Tipo de Intimação**: Identifique o tipo (citação, intimação para contestar, intimação para recurso, etc.)
2. **Prazo Processual**: Extraia o prazo em dias úteis conforme CPC/15
3. **Data Limite**: Calcule e informe a data limite para manifestação
4. **Urgência**: Classifique (🔴 Crítica, 🟡 Alta, 🟢 Normal)
5. **Ações Necessárias**: Liste as ações processuais que devem ser tomadas
6. **Riscos**: Identifique riscos de preclusão, revelia ou deserção
7. **Base Legal**: Cite artigos relevantes do CPC/15

**FORMATO:**
Use markdown estruturado com seções claras e emojis para indicadores visuais.
`.trim();
}

/**
 * Template para mensagem de erro estruturado
 */
export function formatErrorMessage(
  errorType: string,
  errorMessage: string,
  context: {
    task?: string;
    step?: string;
  }
): string {
  return `
⚠️ **Erro ao analisar intimações**

**Tipo:** ${errorType}
**Mensagem:** ${errorMessage}

**Contexto:**
- Tarefa: ${context.task?.substring(0, 100) || "N/A"}...
- Etapa: ${context.step || "desconhecida"}

**Possíveis Causas:**
1. Formato de publicação inválido
2. Conteúdo incompleto ou corrompido
3. API do Gemini temporariamente indisponível
4. Limite de tokens excedido

**Ações Recomendadas:**
1. Verifique o formato dos dados de entrada
2. Aguarde alguns minutos e tente novamente
3. Consulte manualmente o DJEN em https://www.cnj.jus.br/dje/
4. Se persistir, entre em contato com suporte técnico
`.trim();
}

/**
 * Template para mensagem de fallback
 */
export function formatFallbackMessage(task?: string): string {
  return `
⚠️ **Sistema de análise de intimações temporariamente indisponível**

**Tarefa:** ${task?.substring(0, 150) || "Não especificada"}...

**Alternativas para Análise Manual:**

**Prazos Processuais Comuns (CPC/2015):**
- Contestação: 15 dias úteis (Art. 335)
- Apelação: 15 dias úteis (Art. 1.003)
- Agravo de Instrumento: 15 dias úteis (Art. 1.015)
- Embargos de Declaração: 5 dias úteis (Art. 1.022)
- Contrarrazões: 15 dias úteis (Art. 1.030)

**Classificação de Urgência:**
- 🔴 **Crítica**: Prazo < 48h úteis
- 🟡 **Alta**: Prazo < 5 dias úteis
- 🟢 **Normal**: Prazo > 5 dias úteis

**Consulta Manual:**
- Portal DJEN: https://www.cnj.jus.br/dje/
- Portal de Cada Tribunal: Verifique o site do tribunal específico

**Observação:** Esta é uma resposta automática devido a falha temporária no sistema.
`.trim();
}
