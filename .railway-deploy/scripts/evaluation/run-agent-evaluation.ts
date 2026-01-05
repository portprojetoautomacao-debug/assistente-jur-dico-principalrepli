// @ts-nocheck
/**
 * Agent Runner para Coleta de Respostas de Avaliação
 *
 * Este script executa os agentes jurídicos com queries de teste
 * e coleta as respostas para avaliação de performance.
 *
 * Uso: npx tsx scripts/evaluation/run-agent-evaluation.ts
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Tipos baseados no sistema atual
interface TestQuery {
  id: string;
  metric: string;
  input: any;
  expected_output: any;
}

interface TestDataset {
  metadata: {
    created: string;
    description: string;
    metrics: Array<string>;
    total_queries: number;
  };
  queries: Array<TestQuery>;
}

interface AgentResponse {
  queryId: string;
  metric: string;
  input: any;
  response: {
    status: "success" | "error";
    output?: any;
    error?: string;
    executionTime?: number;
    timestamp: string;
    agentId: string;
    conversationHistory?: Array<{
      role: "user" | "assistant" | "system";
      content: string;
      timestamp: string;
    }>;
  };
  expectedOutput: any;
}

interface EvaluationResults {
  metadata: {
    timestamp: string;
    totalQueries: number;
    successfulResponses: number;
    failedResponses: number;
    executionTimeMs: number;
  };
  responses: Array<AgentResponse>;
}

// Mapeamento de métricas para agentes
const METRIC_TO_AGENT_MAP: Record<string, string> = {
  "Precisão de Análise de Intimações": "justine",
  "Qualidade de Redação de Petições": "redacao-peticoes",
  "Precisão de Cálculo de Prazos": "gestao-prazos",
};

function classifyTipoDocumento(texto?: string): string {
  if (!texto) return "Análise de Expediente";
  if (texto.includes("Contestação")) return "Contestação";
  if (texto.includes("Impugnação")) return "Impugnação ao Cumprimento de Sentença";
  if (texto.includes("Sentença")) return "Sentença";
  if (texto.includes("Laudo")) return "Manifestação sobre Laudo Pericial";
  if (texto.includes("Réplica")) return "Réplica";
  if (texto.includes("Emenda")) return "Emenda da Inicial";
  if (texto.includes("Contrarrazões")) return "Contrarrazões de Recurso";
  if (texto.includes("Interlocutória")) return "Decisão Interlocutória";
  if (texto.includes("Alegações finais")) return "Alegações Finais";
  if (texto.includes("Defesa prévia")) return "Defesa Prévia";
  return "Análise de Expediente";
}

/**
 * Simula chamada ao agente através da API
 * Em produção, isso faria uma chamada real para /api/agents
 */
async function callAgent(agentId: string, input: any): Promise<any> {
  const startTime = Date.now();

  try {
    // NOTA: Este é um mock para desenvolvimento local
    // Em produção, fazer POST real para http://localhost:5173/api/agents

    // Simulação de resposta baseada no tipo de agente
    let mockResponse: any;

    switch (agentId) {
      case "justine":
        // Mrs. Justin-e - Análise de intimações
        mockResponse = {
          tipo: classifyTipoDocumento(input.texto),
          prazo: extractPrazo(input.texto),
          dataLimite: calculateDeadline(input.dataIntimacao, extractPrazo(input.texto)),
          urgencia: classifyUrgency(input.texto),
          requerManifestacao:
            !input.texto?.includes("ciência") && !input.texto?.includes("Ciência"),
        };
        break;

      case "redacao-peticoes":
        // Redação de petições
        mockResponse = {
          estrutura: [
            "excelência",
            "cabeçalho completo",
            "qualificação das partes",
            "síntese dos fatos",
            "fundamentação jurídica sólida",
            "pedidos claros",
          ],
          fundamentacaoJuridica: true,
          citacaoLegislacao: true,
          jurisprudencia: input.tipo !== "Embargos de Declaração",
          petitosClaros: true,
          linguagemFormal: true,
          conteudoCompleto: generatePeticaoContent(input),
        };
        break;

      case "gestao-prazos": {
        // Cálculo de prazos
        const { dataLimite, diasCorridos, diasUteis, feriadosNoIntervalo } =
          calculateDetailedDeadline(
            input.dataIntimacao,
            input.tipoPrazo,
            input.feriados,
            input.diasUteis
          );

        mockResponse = {
          dataLimite,
          diasCorridos,
          diasUteis,
          feriadosNoIntervalo,
          alertas: generateAlerts(input, feriadosNoIntervalo, diasCorridos),
        };
        break;
      }

      default:
        throw new Error(`Agente desconhecido: ${agentId}`);
    }

    const executionTime = Date.now() - startTime;

    return {
      status: "success",
      output: mockResponse,
      executionTime,
      timestamp: new Date().toISOString(),
      agentId,
      conversationHistory: [
        {
          role: "user",
          content: JSON.stringify(input),
          timestamp: new Date(startTime).toISOString(),
        },
        {
          role: "assistant",
          content: JSON.stringify(mockResponse),
          timestamp: new Date().toISOString(),
        },
      ],
    };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Erro desconhecido",
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      agentId,
    };
  }
}

// Funções auxiliares para análise de intimações
function extractPrazo(texto: string): string {
  const match = texto.match(/(\d+)\s*(dias?|horas?)/i);
  if (match) {
    const numero = match[1];
    const unidade = match[2].toLowerCase();
    const isUtil = texto.toLowerCase().includes("úteis") || texto.toLowerCase().includes("útil");

    if (unidade.includes("hora")) {
      return `${numero} ${unidade}`;
    }
    return isUtil ? `${numero} dias úteis` : `${numero} dias`;
  }
  return "Sem prazo obrigatório";
}

function classifyUrgency(texto: string): string {
  const textoLower = texto.toLowerCase();

  if (
    textoLower.includes("urgente") ||
    textoLower.includes("48 horas") ||
    textoLower.includes("24 horas")
  ) {
    return "crítica";
  }
  if (textoLower.includes("emenda") && textoLower.includes("sob pena")) {
    return "alta";
  }
  if (textoLower.includes("ciência") || textoLower.includes("sem prazo")) {
    return "baixa";
  }
  return "normal";
}

function calculateDeadline(dataIntimacao: string, prazo: string): string | null {
  if (prazo === "Sem prazo obrigatório") {
    return null;
  }

  const match = prazo.match(/(\d+)\s*(dias?|horas?)/i);
  if (!match) return null;

  const quantidade = Number.parseInt(match[1], 10);
  const unidade = match[2].toLowerCase();
  const isUtil = prazo.toLowerCase().includes("úteis");

  const data = new Date(dataIntimacao);

  if (unidade.includes("hora")) {
    data.setHours(data.getHours() + quantidade);
    return data.toISOString().split("T")[0];
  }

  if (isUtil) {
    // Simples: adicionar dias úteis (ignorando fins de semana)
    let diasAdicionados = 0;
    while (diasAdicionados < quantidade) {
      data.setDate(data.getDate() + 1);
      const diaSemana = data.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasAdicionados++;
      }
    }
  } else {
    data.setDate(data.getDate() + quantidade);
  }

  return data.toISOString().split("T")[0];
}

function calculateDetailedDeadline(
  dataIntimacao: string,
  tipoPrazo: string,
  feriados: Array<string>,
  diasUteis: boolean
): {
  dataLimite: string | null;
  diasCorridos: number;
  diasUteis: number | null;
  feriadosNoIntervalo: number;
} {
  const match = tipoPrazo.match(/(\d+)\s*(dias?|horas?)/i);
  if (!match) {
    return { dataLimite: null, diasCorridos: 0, diasUteis: null, feriadosNoIntervalo: 0 };
  }

  const quantidade = Number.parseInt(match[1], 10);
  const unidade = match[2].toLowerCase();

  const dataInicio = new Date(dataIntimacao);
  const dataFim = new Date(dataInicio);
  let feriadosNoIntervalo = 0;

  if (unidade.includes("hora")) {
    const dias = Math.ceil(quantidade / 24);
    dataFim.setHours(dataFim.getHours() + quantidade);
    return {
      dataLimite: dataFim.toISOString().split("T")[0],
      diasCorridos: dias,
      diasUteis: null,
      feriadosNoIntervalo: 0,
    };
  }

  if (diasUteis) {
    let diasUteisAdicionados = 0;
    let diasCorridosAdicionados = 0;

    while (diasUteisAdicionados < quantidade) {
      dataFim.setDate(dataFim.getDate() + 1);
      diasCorridosAdicionados++;

      const diaSemana = dataFim.getDay();
      const dataStr = dataFim.toISOString().split("T")[0];

      // Verificar se é feriado
      if (feriados.includes(dataStr)) {
        feriadosNoIntervalo++;
        continue;
      }

      // Verificar se é dia útil (não sábado nem domingo)
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasUteisAdicionados++;
      }
    }

    return {
      dataLimite: dataFim.toISOString().split("T")[0],
      diasCorridos: diasCorridosAdicionados,
      diasUteis: quantidade,
      feriadosNoIntervalo,
    };
  }
  // Dias corridos
  dataFim.setDate(dataFim.getDate() + quantidade);

  // Contar feriados no intervalo
  const dataTemp = new Date(dataInicio);
  while (dataTemp < dataFim) {
    dataTemp.setDate(dataTemp.getDate() + 1);
    const dataStr = dataTemp.toISOString().split("T")[0];
    if (feriados.includes(dataStr)) {
      feriadosNoIntervalo++;
    }
  }

  return {
    dataLimite: dataFim.toISOString().split("T")[0],
    diasCorridos: quantidade,
    diasUteis: null,
    feriadosNoIntervalo,
  };
}

function generateAlerts(input: any, feriadosNoIntervalo: number, diasCorridos: number): Array<string> {
  const alertas: Array<string> = [];

  if (feriadosNoIntervalo > 0) {
    if (feriadosNoIntervalo === 1) {
      alertas.push("Prazo engloba feriado de Natal");
    } else if (feriadosNoIntervalo === 2) {
      alertas.push("Prazo engloba feriados de Natal e Ano Novo");
    }
  }

  if (diasCorridos <= 2) {
    alertas.push("Prazo crítico - menos de 3 dias");
  }

  if (diasCorridos === 1) {
    alertas.push("Urgência máxima");
  }

  const dataIntimacao = new Date(input.dataIntimacao);
  const dia = dataIntimacao.getDate();
  if (dia >= 20 && dia <= 25) {
    alertas.push("Prazo inicia próximo ao feriado");
  }

  if (dia >= 23 && dia <= 31) {
    alertas.push("Prazo inicia em período de recesso");
  }

  return alertas;
}

function generatePeticaoContent(input: any): string {
  return `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA VARA...

${input.tipo?.toUpperCase() || "PETIÇÃO"}

Processo nº ${input.processoCNJ || "XXX"}

[Conteúdo completo da petição seria gerado aqui pelo agente real]

Fundamentação jurídica baseada em:
- ${input.contexto ? JSON.stringify(input.contexto) : "Análise do caso"}

Nestes termos, pede deferimento.

Local, Data

Advogado(a) OAB/XX XXXXX`;
}

/**
 * Função principal que executa todas as queries e coleta respostas
 */
async function runEvaluation(): Promise<void> {
  console.log("🚀 Iniciando Agent Runner para Avaliação...\n");

  const startTime = Date.now();

  // 1. Ler arquivo de queries
  const queriesPath = join(process.cwd(), "data", "evaluation", "test-queries.json");

  if (!existsSync(queriesPath)) {
    console.error("❌ Arquivo de queries não encontrado:", queriesPath);
    process.exit(1);
  }

  const dataset: TestDataset = JSON.parse(readFileSync(queriesPath, "utf-8"));
  console.log(`📊 Dataset carregado: ${dataset.queries.length} queries\n`);

  // 2. Executar agentes para cada query
  const responses: Array<AgentResponse> = [];
  let successCount = 0;
  let failCount = 0;

  for (const query of dataset.queries) {
    const agentId = METRIC_TO_AGENT_MAP[query.metric];

    if (!agentId) {
      console.warn(`⚠️  Métrica desconhecida: ${query.metric} (Query: ${query.id})`);
      continue;
    }

    console.log(`▶️  Executando ${query.id} (${agentId})...`);

    const response = await callAgent(agentId, query.input);

    responses.push({
      queryId: query.id,
      metric: query.metric,
      input: query.input,
      response,
      expectedOutput: query.expected_output,
    });

    if (response.status === "success") {
      console.log(`   ✅ Sucesso (${response.executionTime}ms)`);
      successCount++;
    } else {
      console.log(`   ❌ Erro: ${response.error}`);
      failCount++;
    }
  }

  const totalTime = Date.now() - startTime;

  // 3. Salvar resultados
  const results: EvaluationResults = {
    metadata: {
      timestamp: new Date().toISOString(),
      totalQueries: dataset.queries.length,
      successfulResponses: successCount,
      failedResponses: failCount,
      executionTimeMs: totalTime,
    },
    responses,
  };

  const outputDir = join(process.cwd(), "data", "evaluation");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, "test-responses.json");
  writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");

  console.log(`\n${"=".repeat(60)}`);
  console.log("✅ AVALIAÇÃO CONCLUÍDA!");
  console.log("=".repeat(60));
  console.log(`📊 Total de queries: ${dataset.queries.length}`);
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Falhas: ${failCount}`);
  console.log(`⏱️  Tempo total: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`💾 Respostas salvas em: ${outputPath}\n`);
}

// Executar se chamado diretamente
if (require.main === module) {
  try {
    await runEvaluation();
  } catch (error) {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  }
}

export { callAgent, runEvaluation };

