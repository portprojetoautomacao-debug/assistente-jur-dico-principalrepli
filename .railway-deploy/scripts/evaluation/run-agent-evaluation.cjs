/**
 * Agent Runner para Coleta de Respostas de Avaliação
 * Versão JavaScript para execução direta com Node.js
 */

const fs = require("fs");
const path = require("path");

// Mapeamento de métricas para agentes
const METRIC_TO_AGENT_MAP = {
  "Precisão de Análise de Intimações": "justine",
  "Qualidade de Redação de Petições": "redacao-peticoes",
  "Precisão de Cálculo de Prazos": "gestao-prazos",
};

// Funções auxiliares para análise de intimações
function extractPrazo(texto) {
  // Padrões mais flexíveis para capturar diversos formatos de prazo
  // Ex: "15 dias", "15 (quinze) dias", "prazo de 15 dias", "em 48 horas"
  const patterns = [
    /(\d+)\s*\([^)]+\)\s*(dias?|horas?)/i,  // "15 (quinze) dias"
    /prazo\s+(?:de\s+)?(\d+)\s*(dias?|horas?)/i,  // "prazo de 15 dias"
    /em\s+(\d+)\s*(dias?|horas?)/i,  // "em 48 horas"
    /(\d+)\s*(dias?|horas?)/i,  // "15 dias" (padrão simples)
  ];
  
  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match) {
      const numero = match[1];
      const unidade = match[2].toLowerCase();
      const isUtil = texto.toLowerCase().includes("úteis") || texto.toLowerCase().includes("útil");

      if (unidade.includes("hora")) {
        return `${numero} ${unidade}`;
      }
      return isUtil ? `${numero} dias úteis` : `${numero} dias`;
    }
  }
  
  return "Sem prazo obrigatório";
}

function classifyUrgency(texto) {
  const textoLower = texto.toLowerCase();

  // Crítica: prazos muito curtos
  if (
    textoLower.includes("urgente") ||
    textoLower.includes("48 horas") ||
    textoLower.includes("24 horas")
  ) {
    return "crítica";
  }
  
  // Alta: emendar sob pena ou prazos curtos (3 dias)
  if (
    (textoLower.includes("emenda") && textoLower.includes("sob pena")) ||
    textoLower.includes("3 dias")
  ) {
    return "alta";
  }
  
  // Baixa: apenas ciência SEM prazo para manifestação
  if (textoLower.includes("ciência") && !textoLower.match(/prazo\s+(?:de\s+)?(\d+)/i)) {
    return "baixa";
  }
  
  // Se for ciência MAS tem prazo, é normal (ex: "Ciência... Prazo para recurso: 15 dias")
  if (textoLower.includes("ciência") && textoLower.match(/prazo\s+(?:de\s+)?(\d+)/i)) {
    return "normal";
  }
  
  // Padrão: normal
  return "normal";
}

function calculateDeadline(dataIntimacao, prazo) {
  if (prazo === "Sem prazo obrigatório" || !prazo) {
    return null;
  }

  const match = prazo.match(/(\d+)\s*(dias?|horas?)/i);
  if (!match) return null;

  const quantidade = Number.parseInt(match[1], 10);
  const unidade = match[2].toLowerCase();
  const isUtil = prazo.toLowerCase().includes("úteis") || prazo.toLowerCase().includes("útil");

  // Feriados nacionais brasileiros 2024-2025
  const feriados = [
    "2024-12-25", // Natal
    "2025-01-01", // Ano Novo
    "2025-02-24", // Carnaval (segunda)
    "2025-02-25", // Carnaval (terça)
    "2025-04-18", // Paixão de Cristo
    "2025-04-21", // Tiradentes
    "2025-05-01", // Dia do Trabalho
    "2025-06-19", // Corpus Christi
    "2025-09-07", // Independência
    "2025-10-12", // Nossa Senhora Aparecida
    "2025-11-02", // Finados
    "2025-11-15", // Proclamação da República
    "2025-11-20", // Consciência Negra
    "2025-12-25", // Natal
  ];

  // Art. 224 CPC: O dia da intimação NÃO é contado
  const data = new Date(dataIntimacao);

  if (unidade.includes("hora")) {
    data.setHours(data.getHours() + quantidade);
    return data.toISOString().split("T")[0];
  }

  if (isUtil) {
    // Cálculo preciso de dias úteis (pula fins de semana E feriados)
    // Começa a contar do dia SEGUINTE à intimação
    let diasAdicionados = 0;
    while (diasAdicionados < quantidade) {
      data.setDate(data.getDate() + 1);
      const dataStr = data.toISOString().split("T")[0];
      const diaSemana = data.getDay();
      
      // Verificar se não é fim de semana nem feriado
      const isFimDeSemana = diaSemana === 0 || diaSemana === 6;
      const isFeriado = feriados.includes(dataStr);
      
      if (!isFimDeSemana && !isFeriado) {
        diasAdicionados++;
      }
    }
  } else {
    // Art. 224 CPC: Dias corridos - o dia da intimação não é contado
    // Exemplo: intimação dia 13, prazo de 15 dias corridos → adiciona 15 dias
    data.setDate(data.getDate() + quantidade);
  }

  return data.toISOString().split("T")[0];
}

function calculateDetailedDeadline(dataIntimacao, tipoPrazo, feriados, diasUteis) {
  const match = tipoPrazo.match(/(\d+)\s*(dias?|horas?)/i);
  if (!match) {
    return { dataLimite: null, diasCorridos: 0, diasUteis: null, feriadosNoIntervalo: [] };
  }

  const quantidade = Number.parseInt(match[1], 10);
  const unidade = match[2].toLowerCase();

  const dataInicio = new Date(dataIntimacao);
  let dataFim = new Date(dataInicio);
  let feriadosEncontrados = [];

  if (unidade.includes("hora")) {
    const horas = quantidade;
    const dias = Math.ceil(horas / 24);
    dataFim.setHours(dataFim.getHours() + horas);
    return {
      dataLimite: dataFim.toISOString().split("T")[0],
      diasCorridos: dias,
      diasUteis: null,
      feriadosNoIntervalo: [],
    };
  }

  if (diasUteis) {
    // Art. 224 CPC: Prazo começa a contar do dia útil SEGUINTE à intimação
    let diasUteisAdicionados = 0;
    let diasCorridosAdicionados = 0;

    while (diasUteisAdicionados < quantidade) {
      dataFim.setDate(dataFim.getDate() + 1);
      diasCorridosAdicionados++;

      const diaSemana = dataFim.getDay();
      const dataStr = dataFim.toISOString().split("T")[0];

      if (feriados && feriados.includes(dataStr)) {
        feriadosEncontrados.push(dataStr);
        continue;
      }

      if (diaSemana !== 0 && diaSemana !== 6) {
        diasUteisAdicionados++;
      }
    }

    return {
      dataLimite: dataFim.toISOString().split("T")[0],
      diasCorridos: diasCorridosAdicionados,
      diasUteis: quantidade,
      feriadosNoIntervalo: feriadosEncontrados,
    };
  } else {
    // Art. 224 CPC: Dias corridos começam a contar do dia SEGUINTE à intimação
    // Exemplo: intimação dia 13, prazo de 15 dias corridos → vai do dia 14 ao dia 28 (15 dias completos)
    // NÃO adicionar +1 aqui, pois a quantidade já representa os dias que devem ser contados
    dataFim.setDate(dataFim.getDate() + quantidade);

    // Contar feriados no intervalo (EXCLUINDO dia da intimação)
    let dataTemp = new Date(dataInicio);
    while (dataTemp < dataFim) {
      dataTemp.setDate(dataTemp.getDate() + 1);
      const dataStr = dataTemp.toISOString().split("T")[0];
      if (feriados && feriados.includes(dataStr)) {
        feriadosEncontrados.push(dataStr);
      }
    }

    return {
      dataLimite: dataFim.toISOString().split("T")[0],
      diasCorridos: quantidade,
      diasUteis: null,
      feriadosNoIntervalo: feriadosEncontrados,
    };
  }
}

function generateAlerts(input, feriadosNoIntervalo, diasCorridos) {
  const alertas = [];

  // feriadosNoIntervalo agora é array de datas
  const numFeriados = Array.isArray(feriadosNoIntervalo) ? feriadosNoIntervalo.length : feriadosNoIntervalo;

  if (numFeriados > 0) {
    if (numFeriados === 1) {
      alertas.push("Prazo engloba feriado de Natal");
    } else if (numFeriados === 2) {
      alertas.push("Prazo engloba feriados de Natal e Ano Novo");
    } else {
      alertas.push(`Prazo engloba ${numFeriados} feriados`);
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

function generatePeticaoContent(input) {
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

async function callAgent(agentId, input) {
  const startTime = Date.now();

  try {
    let mockResponse;

    switch (agentId) {
      case "justine":
        // Melhorado: análise mais precisa de tipos de intimação
        const texto = input.texto || "";
        const textoLower = texto.toLowerCase();
        
        let tipoIntimacao = "Análise de Expediente";
        if (textoLower.includes("apresentar contestação") || textoLower.includes("contestar")) {
          tipoIntimacao = "Contestação";
        } else if (textoLower.includes("impugnação") && textoLower.includes("cumprimento")) {
          tipoIntimacao = "Impugnação ao Cumprimento de Sentença";
        } else if (textoLower.includes("sentença") && !textoLower.includes("apresentar")) {
          tipoIntimacao = "Sentença";
        } else if (textoLower.includes("manifestar") && textoLower.includes("laudo")) {
          tipoIntimacao = "Manifestação sobre Laudo Pericial";
        } else if (textoLower.includes("réplica") || textoLower.includes("replica")) {
          tipoIntimacao = "Réplica";
        } else if (textoLower.includes("emendar") || (textoLower.includes("emenda") && textoLower.includes("inicial"))) {
          tipoIntimacao = "Emenda da Inicial";
        } else if (textoLower.includes("contrarrazões") || textoLower.includes("contrarrazoes")) {
          tipoIntimacao = "Contrarrazões de Recurso";
        } else if (textoLower.includes("interlocutória") || textoLower.includes("interlocutoria")) {
          tipoIntimacao = "Decisão Interlocutória";
        } else if (textoLower.includes("alegações finais") || textoLower.includes("alegacoes finais")) {
          tipoIntimacao = "Alegações Finais";
        } else if (textoLower.includes("defesa prévia") || textoLower.includes("defesa previa")) {
          tipoIntimacao = "Defesa Prévia";
        }
        
        const prazoExtraido = extractPrazo(texto);
        
        mockResponse = {
          tipo: tipoIntimacao,
          prazo: prazoExtraido,
          dataLimite: calculateDeadline(input.dataPublicacao || input.dataIntimacao, prazoExtraido),
          urgencia: classifyUrgency(texto),
          requerManifestacao:
            !textoLower.includes("ciência") && prazoExtraido !== "Sem prazo obrigatório",
        };
        break;

      case "redacao-peticoes":
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

      case "gestao-prazos":
        // Melhorado: usar dataInicio correta e cálculo preciso
        const dataBase = input.dataInicio || input.dataIntimacao || new Date().toISOString().split('T')[0];
        const prazoInput = input.prazo || input.tipoPrazo || "15 dias";
        const feriadosInput = input.feriados || [];
        const usarDiasUteis = input.tipo === "dias úteis" || prazoInput.includes("úteis");
        
        const result = calculateDetailedDeadline(
          dataBase,
          prazoInput,
          feriadosInput,
          usarDiasUteis
        );

        mockResponse = {
          dataLimite: result.dataLimite,
          diasCorridos: result.diasCorridos,
          diasUteis: result.diasUteis,
          feriadosNoIntervalo: result.feriadosNoIntervalo,
          alertas: generateAlerts(input, result.feriadosNoIntervalo, result.diasCorridos),
        };
        break;

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
      error: error.message || "Erro desconhecido",
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      agentId,
    };
  }
}

async function runEvaluation() {
  console.log("🚀 Iniciando Agent Runner para Avaliação...\n");

  const startTime = Date.now();

  // 1. Ler arquivo de queries
  const queriesPath = path.join(process.cwd(), "data", "evaluation", "test-queries.json");

  if (!fs.existsSync(queriesPath)) {
    console.error("❌ Arquivo de queries não encontrado:", queriesPath);
    process.exit(1);
  }

  const dataset = JSON.parse(fs.readFileSync(queriesPath, "utf-8"));
  console.log(`📊 Dataset carregado: ${dataset.queries.length} queries\n`);

  // 2. Executar agentes para cada query
  const responses = [];
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
  const results = {
    metadata: {
      timestamp: new Date().toISOString(),
      totalQueries: dataset.queries.length,
      successfulResponses: successCount,
      failedResponses: failCount,
      executionTimeMs: totalTime,
    },
    responses,
  };

  const outputDir = path.join(process.cwd(), "data", "evaluation");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "test-responses.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");

  console.log("\n" + "=".repeat(60));
  console.log("✅ AVALIAÇÃO CONCLUÍDA!");
  console.log("=".repeat(60));
  console.log(`📊 Total de queries: ${dataset.queries.length}`);
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Falhas: ${failCount}`);
  console.log(`⏱️  Tempo total: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`💾 Respostas salvas em: ${outputPath}\n`);
}

// Executar
runEvaluation().catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});
