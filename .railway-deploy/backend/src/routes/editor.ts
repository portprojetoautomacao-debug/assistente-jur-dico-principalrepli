/**
 * Editor AI Integration Routes
 * 
 * Orquestra agentes de IA para o CKEditor 5
 * - Gera minutas com dados do DJEN
 * - Integra contexto de processos
 * - Slash commands para produtividade
 */

import { Request, Response, Router } from "express";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Imports dinâmicos dos agentes
let runRedacaoPeticoes: any;
let runJustine: any;
let runHarvey: any;
let runRevisaoContratual: any;
let runPesquisaJuris: any;

async function loadEditorAgents() {
  try {
    const agentsPath = resolve(__dirname, "../../../src/agents");
    
    const [redacaoModule, justineModule, harveyModule, revisaoModule, pesquisaModule] = await Promise.all([
      import(`${agentsPath}/redacao-peticoes/redacao_graph.js`),
      import(`${agentsPath}/justine/justine_graph.js`),
      import(`${agentsPath}/harvey/harvey_graph.js`),
      import(`${agentsPath}/revisao-contratual/revisao_contratual_graph.js`),
      import(`${agentsPath}/pesquisa-juris/pesquisa_graph.js`),
    ]);
    
    runRedacaoPeticoes = redacaoModule.runRedacaoPeticoes;
    runJustine = justineModule.runJustine;
    runHarvey = harveyModule.runHarvey;
    runRevisaoContratual = revisaoModule.runRevisaoContratual;
    runPesquisaJuris = pesquisaModule.runPesquisaJuris;
    
    console.log("[Editor] ✅ Agentes de editor carregados");
  } catch (error) {
    console.error("[Editor] ❌ Erro ao carregar agentes:", error);
  }
}

loadEditorAgents();

const router = Router();

// Tipos de comandos disponíveis
const SLASH_COMMANDS = {
  "gerar-minuta": {
    description: "Gera uma minuta jurídica completa",
    agent: "redacao-peticoes",
    requiresContext: true,
  },
  "analisar-djen": {
    description: "Analisa publicações do DJEN",
    agent: "mrs-justine",
    requiresContext: true,
  },
  "estrategia": {
    description: "Sugere estratégia processual",
    agent: "harvey-specter",
    requiresContext: false,
  },
  "revisar-contrato": {
    description: "Revisa cláusulas contratuais",
    agent: "revisao-contratual",
    requiresContext: true,
  },
  "pesquisar-juris": {
    description: "Pesquisa jurisprudência relevante",
    agent: "pesquisa-juris",
    requiresContext: false,
  },
  "continuar": {
    description: "Continua escrevendo o texto",
    agent: "redacao-peticoes",
    requiresContext: true,
  },
  "expandir": {
    description: "Expande e desenvolve o texto",
    agent: "redacao-peticoes", 
    requiresContext: true,
  },
  "formalizar": {
    description: "Reescreve em linguagem jurídica formal",
    agent: "redacao-peticoes",
    requiresContext: true,
  },
};

// GET /api/editor/commands - Lista comandos disponíveis
router.get("/commands", (_req: Request, res: Response) => {
  const commands = Object.entries(SLASH_COMMANDS).map(([cmd, info]) => ({
    command: `/${cmd}`,
    ...info,
  }));
  
  res.json({
    success: true,
    commands,
    total: commands.length,
  });
});

// POST /api/editor/generate-minuta - Gera minuta com contexto
router.post("/generate-minuta", async (req: Request, res: Response) => {
  const startTime = performance.now();
  const { 
    prompt, 
    context,
    djenData,
    processData,
    documentType,
    existingContent,
  } = req.body;

  if (!prompt) {
    return res.status(400).json({
      success: false,
      error: "prompt é obrigatório",
    });
  }

  try {
    // Construir contexto enriquecido com dados do DJEN e processo
    const enrichedContext = buildEnrichedContext({
      prompt,
      context,
      djenData,
      processData,
      documentType,
      existingContent,
    });

    if (!runRedacaoPeticoes) {
      return res.status(503).json({
        success: false,
        error: "Agente de redação não disponível",
      });
    }

    // Validate minimum detalhes length
    if (enrichedContext.fullContext.length < 20) {
      return res.status(400).json({
        success: false,
        error: "O contexto deve ter pelo menos 20 caracteres",
      });
    }

    const result = await runRedacaoPeticoes({
      tipo: documentType || "petição inicial",
      detalhes: enrichedContext.fullContext.substring(0, 10000),
    });

    const executionTime = performance.now() - startTime;
    const lastMessage = result.messages[result.messages.length - 1];

    res.json({
      success: true,
      content: lastMessage?.content || "",
      metadata: {
        executionTime,
        agent: "redacao-peticoes",
        steps: result.messages.length,
        completed: result.completed,
        usedDjen: !!djenData,
        usedProcess: !!processData,
      },
    });
  } catch (error) {
    console.error("[Editor] Erro ao gerar minuta:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Erro interno",
    });
  }
});

// POST /api/editor/execute-command - Executa slash command
router.post("/execute-command", async (req: Request, res: Response) => {
  const startTime = performance.now();
  const { command, prompt, context, djenData, processData, documentType } = req.body;

  const cmdKey = command?.replace("/", "") as keyof typeof SLASH_COMMANDS;
  const cmdInfo = SLASH_COMMANDS[cmdKey];

  if (!cmdInfo) {
    return res.status(400).json({
      success: false,
      error: `Comando /${cmdKey} não reconhecido`,
      availableCommands: Object.keys(SLASH_COMMANDS).map(c => `/${c}`),
    });
  }

  // Validate minimum input length
  const sanitizedPrompt = (prompt || "").trim();
  if (sanitizedPrompt.length < 10) {
    return res.status(400).json({
      success: false,
      error: "O prompt deve ter pelo menos 10 caracteres",
    });
  }

  try {
    let runner: any;
    let agentInput: Record<string, unknown>;

    switch (cmdInfo.agent) {
      case "redacao-peticoes":
        runner = runRedacaoPeticoes;
        agentInput = {
          tipo: documentType || "petição inicial",
          detalhes: buildRedacaoTask(cmdKey, sanitizedPrompt, context),
        };
        break;
      case "mrs-justine":
        runner = runJustine;
        agentInput = {
          task: `Analise as seguintes publicações do DJEN e extraia informações relevantes: ${JSON.stringify(djenData || []).substring(0, 4000)}. Solicitação: ${sanitizedPrompt}`,
        };
        break;
      case "harvey-specter":
        runner = runHarvey;
        const processContext = processData ? ` Contexto: Processo ${processData.numero || "N/A"}, ${processData.classe || ""}.` : "";
        agentInput = {
          task: `${sanitizedPrompt}${processContext}`.substring(0, 2000),
        };
        break;
      case "revisao-contratual":
        runner = runRevisaoContratual;
        agentInput = {
          task: `Revise o seguinte contrato: ${(context || sanitizedPrompt).substring(0, 5000)}`,
        };
        break;
      case "pesquisa-juris":
        runner = runPesquisaJuris;
        agentInput = {
          task: sanitizedPrompt.substring(0, 2000),
        };
        break;
      default:
        runner = runRedacaoPeticoes;
        agentInput = {
          tipo: "petição inicial",
          detalhes: sanitizedPrompt,
        };
    }

    if (!runner) {
      return res.status(503).json({
        success: false,
        error: `Agente ${cmdInfo.agent} não disponível`,
      });
    }

    const result = await runner(agentInput);

    const executionTime = performance.now() - startTime;
    const lastMessage = result.messages[result.messages.length - 1];

    res.json({
      success: true,
      command: `/${cmdKey}`,
      content: lastMessage?.content || "",
      metadata: {
        executionTime,
        agent: cmdInfo.agent,
        steps: result.messages.length,
        completed: result.completed,
      },
    });
  } catch (error) {
    console.error(`[Editor] Erro ao executar /${cmdKey}:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Erro interno",
    });
  }
});

// POST /api/editor/analyze-djen - Analisa publicações DJEN para contexto
router.post("/analyze-djen", async (req: Request, res: Response) => {
  const { publications, processNumber } = req.body;

  if (!publications || !Array.isArray(publications)) {
    return res.status(400).json({
      success: false,
      error: "publications array é obrigatório",
    });
  }

  try {
    if (!runJustine) {
      return res.status(503).json({
        success: false,
        error: "Agente Justine não disponível",
      });
    }

    const result = await runJustine({
      task: `Analise as seguintes publicações do DJEN para o processo ${processNumber || "não especificado"} e extraia informações relevantes para redação de minutas jurídicas:`,
      publications,
      processNumber,
    });

    const lastMessage = result.messages[result.messages.length - 1];

    res.json({
      success: true,
      analysis: lastMessage?.content || "",
      extractedData: result.data?.analysis || {},
    });
  } catch (error) {
    console.error("[Editor] Erro ao analisar DJEN:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Erro interno",
    });
  }
});

// Helper functions

function buildEnrichedContext(params: {
  prompt: string;
  context?: string;
  djenData?: any;
  processData?: any;
  documentType?: string;
  existingContent?: string;
}) {
  const parts: string[] = [];
  
  parts.push(`**Solicitação**: ${params.prompt}`);
  
  if (params.documentType) {
    parts.push(`**Tipo de Documento**: ${params.documentType}`);
  }
  
  if (params.processData) {
    parts.push(`**Dados do Processo**:
- Número: ${params.processData.numero || "N/A"}
- Partes: ${params.processData.partes || "N/A"}
- Vara: ${params.processData.vara || "N/A"}
- Classe: ${params.processData.classe || "N/A"}`);
  }
  
  if (params.djenData && Array.isArray(params.djenData) && params.djenData.length > 0) {
    const djenSummary = params.djenData.map((p: any, i: number) => 
      `${i + 1}. ${p.conteudo?.substring(0, 200) || "Publicação sem conteúdo"}...`
    ).join("\n");
    parts.push(`**Publicações DJEN Relevantes**:\n${djenSummary}`);
  }
  
  if (params.existingContent) {
    parts.push(`**Conteúdo Existente no Editor**:\n${params.existingContent.substring(0, 1000)}...`);
  }
  
  if (params.context) {
    parts.push(`**Contexto Adicional**: ${params.context}`);
  }
  
  return {
    task: `Redija uma minuta jurídica profissional. ${params.prompt}`,
    fullContext: parts.join("\n\n"),
  };
}

function buildRedacaoTask(command: string, prompt: string, context?: string): string {
  const contextText = context ? `\n\nTexto atual:\n${context}` : "";
  
  switch (command) {
    case "continuar":
      return `Continue escrevendo o seguinte texto jurídico de forma natural e profissional:${contextText}\n\n${prompt}`;
    case "expandir":
      return `Expanda e desenvolva o seguinte texto jurídico de forma mais detalhada:${contextText}\n\n${prompt}`;
    case "formalizar":
      return `Reescreva o seguinte texto em linguagem jurídica formal brasileira:${contextText}\n\n${prompt}`;
    case "gerar-minuta":
      return `Redija uma minuta jurídica completa para: ${prompt}${contextText}`;
    default:
      return `${prompt}${contextText}`;
  }
}

export default router;
