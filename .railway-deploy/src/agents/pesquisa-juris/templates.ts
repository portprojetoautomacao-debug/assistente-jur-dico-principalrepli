/**
 * Templates e prompts para o agente Pesquisa Jurisprudencial
 * Separados do graph principal seguindo padrão Google Agent Starter Pack
 */

/**
 * System prompt principal para o agente de pesquisa
 */
export const PESQUISA_JURIS_SYSTEM_PROMPT = `
Você é um especialista em pesquisa jurisprudencial brasileira com profundo conhecimento em:

**Tribunais Superiores:**
- STF (Supremo Tribunal Federal) - Questões constitucionais
- STJ (Superior Tribunal de Justiça) - Questões de lei federal
- TST (Tribunal Superior do Trabalho) - Questões trabalhistas
- TSE (Tribunal Superior Eleitoral) - Questões eleitorais
- STM (Superior Tribunal Militar) - Questões militares

**Metodologia de Pesquisa:**
1. Analise cuidadosamente o tema solicitado
2. Identifique palavras-chave e conceitos jurídicos relevantes
3. Busque precedentes vinculantes (súmulas, temas de repercussão geral)
4. Priorize jurisprudência recente (últimos 5 anos)
5. Cite artigos de lei aplicáveis (CF/88, CPC/15, CC/02, CLT)

**Formato de Resposta:**
- Apresente os precedentes mais relevantes primeiro
- Inclua número do processo, tribunal, data e relator
- Resuma a ementa de forma clara e objetiva
- Destaque a tese jurídica fixada
- Mencione artigos de lei citados no acórdão

**Observações Importantes:**
- Sempre verifique a data do precedente (preferir decisões recentes)
- Identifique se há recursos pendentes ou decisões superadas
- Mencione se há súmulas vinculantes sobre o tema
- Indique se há repercussão geral reconhecida (STF)
`.trim();

/**
 * Prompt para geração de query de busca otimizada
 */
export function generateSearchQueryPrompt(tema: string, tribunal: string): string {
  return `
Gere uma query de busca otimizada para encontrar jurisprudências sobre o seguinte tema:

**Tema:** ${tema}
**Tribunal:** ${tribunal}

**Instruções:**
1. Extraia os conceitos jurídicos principais do tema
2. Identifique sinônimos e termos relacionados
3. Use operadores booleanos (AND, OR, NOT) quando apropriado
4. Inclua filtros de tribunal se especificado
5. Retorne apenas a query, sem explicações

**Formato da query:**
"conceito principal" AND (sinônimo1 OR sinônimo2) AND tribunal:${tribunal}

**Exemplo:**
Tema: "responsabilidade civil por dano moral em relação de trabalho"
Query: "responsabilidade civil" AND ("dano moral" OR "danos morais") AND ("relação de trabalho" OR "relação de emprego") AND tribunal:TST
`.trim();
}

/**
 * Prompt para análise e síntese de precedentes
 */
export function generateAnalysisPrompt(tema: string, precedentes: string): string {
  return `
Analise os precedentes encontrados sobre o tema: **${tema}**

**Precedentes:**
${precedentes}

**Sua tarefa:**
1. Identifique a tese jurídica predominante
2. Destaque divergências entre tribunais (se houver)
3. Mencione súmulas ou temas de repercussão geral
4. Resuma os principais fundamentos legais citados
5. Indique a tendência jurisprudencial atual

**Formato da resposta:**
## Tese Predominante
[resumo da tese]

## Fundamentos Legais
- CF/88, art. X
- Lei Y, art. Z

## Precedentes Relevantes
- STF: [resumo]
- STJ: [resumo]

## Tendência Atual
[análise da evolução jurisprudencial]
`.trim();
}

/**
 * Template para mensagem de erro estruturado
 */
export function formatErrorMessage(
  errorType: string,
  errorMessage: string,
  context: {
    tema?: string;
    tribunal?: string;
    step?: string;
  }
): string {
  return `
⚠️ **Erro ao executar pesquisa jurisprudencial**

**Tipo:** ${errorType}
**Mensagem:** ${errorMessage}

**Contexto:**
- Tema pesquisado: ${context.tema || "não especificado"}
- Tribunal: ${context.tribunal || "todos"}
- Etapa: ${context.step || "desconhecida"}

**Sugestões:**
1. Verifique se o tema está bem formulado
2. Tente simplificar a consulta
3. Se o erro persistir, consulte manualmente:
   - STF: https://portal.stf.jus.br/jurisprudencia/
   - STJ: https://scon.stj.jus.br/SCON/
   - TST: https://jurisprudencia.tst.jus.br/

**Suporte:** Se precisar de ajuda, entre em contato com a equipe técnica.
`.trim();
}

/**
 * Template para mensagem de fallback (quando serviço está indisponível)
 */
export function formatFallbackMessage(tema: string): string {
  return `
⚠️ **Sistema de busca jurisprudencial temporariamente indisponível**

**Tema pesquisado:** ${tema}

**Alternativas:**
1. **Consulta Manual:**
   - STF: https://portal.stf.jus.br/jurisprudencia/
   - STJ: https://scon.stj.jus.br/SCON/
   - TST: https://jurisprudencia.tst.jus.br/

2. **Aguardar Alguns Minutos:**
   O sistema estará disponível em breve. Tente novamente após alguns minutos.

3. **Suporte Especializado:**
   Entre em contato com a equipe jurídica para pesquisa assistida.

**Observação:** Esta é uma resposta automática devido a falha temporária no sistema de busca.
`.trim();
}

/**
 * Template para resumo de resultados
 */
export function formatResultsSummary(
  totalFound: number,
  avgRelevance: number,
  tribunaisEncontrados: string[],
  executionTimeMs: number
): string {
  return `
📊 **Resumo da Pesquisa**

- **Precedentes encontrados:** ${totalFound}
- **Relevância média:** ${(avgRelevance * 100).toFixed(0)}%
- **Tribunais:** ${tribunaisEncontrados.join(", ")}
- **Tempo de execução:** ${executionTimeMs}ms

${totalFound === 0 ? "⚠️ Nenhum precedente encontrado com os critérios especificados. Tente ampliar a pesquisa." : ""}
${avgRelevance < 0.6 ? "⚠️ Relevância média baixa. Considere refinar a consulta." : ""}
`.trim();
}
