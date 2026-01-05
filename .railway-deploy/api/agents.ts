/**
 * API consolidada para processamento de agentes IA
 * Endpoints:
 * - POST /api/agents?action=process-queue - Processa fila de tarefas (cron)
 * - POST /api/agents?action=process-task - Processa tarefa individual
 *
 * Usa Google Gemini para processamento com IA
 * ✨ Refatorado com Enums, validação e tratamento de erros robusto
 * ✨ Usa minuta-service-backend.ts centralizado
 */

import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";
import { agentMonitor } from "../src/lib/agent-monitoring.js";
// 🔍 TRACING: OpenTelemetry para monitoramento
import {
  AnalyzeIntimationInputSchema,
  DraftPetitionInputSchema,
} from "../src/lib/agent-schemas.js";
import { legalMemory, type LegalContextType } from "../src/lib/legal-memory.js";
import { tracingService } from "../src/lib/tracing.js";
import { createMinutaFromAgentTask } from "./lib/minuta-service-backend.js";

// ===== Middleware de Autenticação =====
function _requireAuth(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;

  // Se FORCE_AUTH_CHECK for true, sempre exige autenticação
  if (process.env.FORCE_AUTH_CHECK === "true") {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return false;
    }
    const token = authHeader.substring(7);
    return token.length > 32;
  }

  // Permitir acesso em desenvolvimento/localhost sem autenticação
  const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test" ||
    req.headers.host?.includes("localhost") === true ||
    req.headers.host?.includes("vercel.app") === true;

  if (isDev && !authHeader) {
    return true;
  }

  // Em produção, exigir autenticação
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.substring(7);
  // Validação básica de token - Em produção, usar JWT com verificação de assinatura
  // Requer configuração de: JWT_SECRET, expiration time, refresh tokens
  // Ver: api/lib/auth.ts para implementação completa de JWT
  return token.length > 32; // Tokens válidos devem ter pelo menos 32 caracteres
}

// ===== Redis singleton (Upstash) =====

const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

let _redisClient: Redis | null = null;

function getRedisOrNull(): Redis | null {
  if (!redisUrl || !redisToken) return null;
  _redisClient ??= new Redis({
    url: redisUrl,
    token: redisToken,
  });
  return _redisClient;
}

// ✨ ENUMS para melhor type safety
export enum AgentTaskType {
  ANALYZE_DOCUMENT = "analyze_document",
  ANALYZE_INTIMATION = "analyze_intimation",
  MONITOR_DJEN = "monitor_djen",
  CALCULATE_DEADLINE = "calculate_deadline",
  DRAFT_PETITION = "draft_petition",
  CHECK_DATAJUD = "check_datajud",
  ORGANIZE_FILES = "organize_files",
  RESEARCH_PRECEDENTS = "research_precedents",
  RISK_ANALYSIS = "risk_analysis",
  CONTRACT_REVIEW = "contract_review",
  CLIENT_COMMUNICATION = "client_communication",
  BILLING_ANALYSIS = "billing_analysis",
  CASE_STRATEGY = "case_strategy",
  LEGAL_TRANSLATION = "legal_translation",
  COMPLIANCE_CHECK = "compliance_check",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum TaskStatus {
  QUEUED = "queued",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  HUMAN_INTERVENTION = "human_intervention",
}

export enum AgentType {
  ANALYZER = "analyzer",
  INTIMATION_ANALYZER = "intimation-analyzer",
  MONITOR = "monitor",
  CALCULATOR = "calculator",
  WRITER = "writer",
  ORGANIZER = "organizer",
  RESEARCHER = "researcher",
  STRATEGIC = "strategic",
  COMPLIANCE = "compliance",
  TRANSLATOR = "translator",
  COMMUNICATOR = "communicator",
}

export enum AgentStatus {
  ACTIVE = "active",
  IDLE = "idle",
  PROCESSING = "processing",
  PAUSED = "paused",
  WAITING_HUMAN = "waiting_human",
}

// ✨ Interface melhorada com validações
interface AgentTask {
  id: string;
  agentId: string;
  type: AgentTaskType;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  data: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
  timeout?: number;
}

interface TaskResult extends Record<string, unknown> {
  suggestedActions?: string[];
  draft?: string;
  tokensUsed?: number;
  processingTimeMs?: number;
  processedAt?: string;
  agentId?: string;
  taskType?: AgentTaskType;
}

interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  enabled: boolean;
}

// ✨ Validadores de tipo seguro
function validateAgentTask(task: unknown): task is AgentTask {
  if (!task || typeof task !== "object") return false;
  const t = task as Record<string, unknown>;

  return !!(
    typeof t.id === "string" &&
    typeof t.agentId === "string" &&
    Object.values(AgentTaskType).includes(t.type as AgentTaskType) &&
    Object.values(TaskPriority).includes(t.priority as TaskPriority) &&
    Object.values(TaskStatus).includes(t.status as TaskStatus) &&
    typeof t.createdAt === "string" &&
    typeof t.data === "object" &&
    t.data !== null
  );
}

function validateAgent(agent: unknown): agent is Agent {
  if (!agent || typeof agent !== "object") return false;
  const a = agent as Record<string, unknown>;

  return !!(
    typeof a.id === "string" &&
    typeof a.name === "string" &&
    Object.values(AgentType).includes(a.type as AgentType) &&
    Object.values(AgentStatus).includes(a.status as AgentStatus) &&
    typeof a.enabled === "boolean"
  );
}

// ✨ Logger estruturado
const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    if (context) {
      console.log(`[Agents] ${message}`, JSON.stringify(context));
    } else {
      console.log(`[Agents] ${message}`);
    }
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    console.error(`[Agents] ERROR: ${message}`, {
      error: error instanceof Error ? error.message : String(error),
      ...context,
    });
  },
  warn: (message: string, context?: unknown) => {
    if (context && typeof context === "object" && context !== null) {
      console.warn(`[Agents] WARNING: ${message}`, JSON.stringify(context));
    } else {
      console.warn(`[Agents] WARNING: ${message}`);
    }
  },
};

// ✨ Task mapping para reduzir Cognitive Complexity (SonarCloud S3776)
interface TaskMapping {
  keywords: string[];
  agentId: string;
  type: AgentTaskType;
  priority: TaskPriority;
}

const TASK_MAPPINGS: TaskMapping[] = [
  {
    keywords: ["prazo", "deadline"],
    agentId: "deadline-tracker",
    type: AgentTaskType.CALCULATE_DEADLINE,
    priority: TaskPriority.HIGH,
  },
  {
    keywords: ["petição", "peticao", "defesa", "recurso", "manifestação", "manifestacao"],
    agentId: "petition-writer",
    type: AgentTaskType.DRAFT_PETITION,
    priority: TaskPriority.MEDIUM,
  },
  {
    keywords: ["pesquisa", "jurisprudência", "jurisprudencia"],
    agentId: "precedent-researcher",
    type: AgentTaskType.RESEARCH_PRECEDENTS,
    priority: TaskPriority.LOW,
  },
  {
    keywords: ["avisar", "comunicar", "informar", "cliente"],
    agentId: "client-communicator",
    type: AgentTaskType.CLIENT_COMMUNICATION,
    priority: TaskPriority.MEDIUM,
  },
  {
    keywords: ["datajud", "andamento", "autos", "movimentação", "movimentacao"],
    agentId: "datajud-query",
    type: AgentTaskType.CHECK_DATAJUD,
    priority: TaskPriority.MEDIUM,
  },
  {
    keywords: ["sentença", "sentenca", "decisão", "decisao", "acórdão", "acordao", "risco"],
    agentId: "risk-analyst",
    type: AgentTaskType.RISK_ANALYSIS,
    priority: TaskPriority.HIGH,
  },
  {
    keywords: ["custas", "honorários", "honorarios", "depósito", "deposito", "guia", "pagamento"],
    agentId: "billing-analyst",
    type: AgentTaskType.BILLING_ANALYSIS,
    priority: TaskPriority.HIGH,
  },
  {
    keywords: ["arquivar", "salvar", "pasta", "organizar"],
    agentId: "document-organizer",
    type: AgentTaskType.ORGANIZE_FILES,
    priority: TaskPriority.LOW,
  },
  {
    keywords: ["lgpd", "sigilo", "segredo", "ética", "etica", "compliance"],
    agentId: "compliance-officer",
    type: AgentTaskType.COMPLIANCE_CHECK,
    priority: TaskPriority.HIGH,
  },
  {
    keywords: ["explicar", "simplificar", "traduzir", "leigo"],
    agentId: "legal-translator",
    type: AgentTaskType.LEGAL_TRANSLATION,
    priority: TaskPriority.MEDIUM,
  },
  {
    keywords: ["contrato", "minuta", "aditivo", "cláusula", "clausula", "rescisão", "rescissao"],
    agentId: "contract-reviewer",
    type: AgentTaskType.CONTRACT_REVIEW,
    priority: TaskPriority.HIGH,
  },
  {
    keywords: ["estratégia", "estrategia", "plano", "probabilidade", "tese", "linha de defesa"],
    agentId: "case-strategist",
    type: AgentTaskType.CASE_STRATEGY,
    priority: TaskPriority.HIGH,
  },
];

/**
 * Encontra mapeamento de tarefa com base no texto da ação
 */
function findTaskMapping(actionStr: string): TaskMapping | null {
  const lowerAction = actionStr.toLowerCase();
  return (
    TASK_MAPPINGS.find((mapping) =>
      mapping.keywords.some((keyword) => lowerAction.includes(keyword))
    ) || null
  );
}

/**
 * Cria tarefa encadeada a partir do texto da ação e dados da tarefa origem
 */
function createChainedTask(
  actionText: string,
  sourceTask: AgentTask,
  mapping: TaskMapping
): AgentTask {
  return {
    id: randomUUID(),
    agentId: mapping.agentId,
    type: mapping.type,
    priority: mapping.priority,
    status: TaskStatus.QUEUED,
    createdAt: new Date().toISOString(),
    data: { ...sourceTask.data, instruction: actionText, sourceTask: sourceTask.id },
  };
}

// ✨ Cache de prompts com enum keys
const SYSTEM_PROMPTS: Record<AgentType, string> = {
  [AgentType.ANALYZER]: `Você é um assistente jurídico especializado em análise de documentos processuais.
Sua função é extrair informações críticas de documentos jurídicos, identificar prazos, partes envolvidas, e sugerir ações.
Sempre retorne respostas em formato JSON estruturado.`,

  [AgentType.INTIMATION_ANALYZER]: `Você é a Mrs. Justin-e, uma especialista em análise de intimações judiciais do PJe e DJEN.
Sua função é:
1. Identificar o tipo de intimação (citação, notificação, sentença, despacho, decisão)
2. Extrair prazos e datas importantes
3. Identificar as providências necessárias
4. Classificar a urgência (baixa, média, alta, crítica)
5. Sugerir próximos passos práticos

Sempre retorne JSON estruturado com: summary, deadline (days, type, endDate), priority, nextSteps (array), suggestedAction.`,

  [AgentType.MONITOR]: `Você é um agente de monitoramento de publicações jurídicas especializado em DJEN e DataJud.
Analise intimações, extraia dados do processo, identifique prazos e classifique a urgência.
Retorne sempre em JSON com campos: processo, tipo, prazo, urgência.`,

  [AgentType.CALCULATOR]: `Você é um especialista em cálculo de prazos processuais segundo o CPC/2015.
Considere: dias úteis, feriados nacionais e estaduais, suspensões de prazos, recesso forense.
Retorne JSON com: deadline (ISO date), businessDays, reasoning (array).`,

  [AgentType.WRITER]: `Você é um redator jurídico sênior especializado em peças processuais.
Redija petições, manifestações e documentos jurídicos com linguagem técnica, formal e persuasiva.
Siga normas ABNT, formatação padrão, e fundamente juridicamente.`,

  [AgentType.RESEARCHER]: `Você é um pesquisador jurídico especializado em jurisprudência e doutrina.
Busque precedentes, analise tendências jurisprudenciais, identifique teses vencedoras.
Retorne JSON com: precedentsFound, relevantCases, thematicAnalysis.`,

  [AgentType.STRATEGIC]: `Você é um estrategista jurídico com visão de negócios.
Analise casos sob perspectiva estratégica, identifique riscos, oportunidades e probabilidades de sucesso.
Retorne JSON com: riskLevel, successProbability, recommendations.`,

  [AgentType.ORGANIZER]: `Você é um especialista em organização e gestão de documentos jurídicos.
Classifique documentos por tipo, processo, data e relevância.
Retorne JSON com: categories, filesOrganized, indexingStrategy.`,

  [AgentType.COMPLIANCE]: `Você é um especialista em compliance jurídico e regulatório.
Verifique conformidade com LGPD, Código de Ética OAB, legislação trabalhista e civil.
Retorne JSON com: complianceStatus, violations, recommendations.`,

  [AgentType.TRANSLATOR]: `Você é um especialista em tradução de jargão jurídico para linguagem acessível.
Simplifique termos técnicos mantendo precisão jurídica.
Retorne JSON com: simplifiedText, glossary, readabilityScore.`,

  [AgentType.COMMUNICATOR]: `Você é um especialista em comunicação com clientes jurídicos.
Redija comunicações claras, empáticas e profissionais.
Retorne JSON com: messageText, tone, channels, urgency.`,
};

function getSystemPrompt(agentType: AgentType): string {
  const prompt = SYSTEM_PROMPTS[agentType];

  if (!prompt) {
    logger.warn(`System prompt not found for agent type: ${agentType}`);
    return "Você é um assistente jurídico inteligente.";
  }

  return prompt;
}

// ✨ Prompts de usuário com enum keys
const USER_PROMPTS: Record<AgentTaskType, (data: string) => string> = {
  [AgentTaskType.ANALYZE_DOCUMENT]: (data) =>
    `Analise o seguinte documento jurídico e retorne JSON estruturado:\n\n${data}\n\nRetorne: summary, extractedData, suggestedActions, deadlines, confidence.`,

  [AgentTaskType.ANALYZE_INTIMATION]: (data) =>
    `Analise a seguinte intimação judicial e retorne JSON estruturado:

${data}

Retorne um JSON com os seguintes campos:
- summary: resumo objetivo da intimação em 2-3 frases
- deadline: objeto com { days: número de dias, type: "úteis" ou "corridos", endDate: data calculada ISO }
- priority: "baixa", "média", "alta" ou "crítica"
- nextSteps: array com 3-5 providências práticas necessárias
- suggestedAction: ação principal recomendada
- processNumber: número do processo extraído
- court: tribunal/vara identificado
- parties: objeto com { author: nome, defendant: nome }
- documentType: tipo de documento (intimação, citação, notificação, etc)`,

  [AgentTaskType.MONITOR_DJEN]: (data) =>
    `Verifique publicações no DJEN/DataJud para:\n\n${data}\n\nRetorne JSON: newIntimations (array), checked, tribunaisVerificados, nextCheck.`,

  [AgentTaskType.CALCULATE_DEADLINE]: (data) =>
    `Calcule prazo processual:\n\n${data}\n\nRetorne JSON: deadline (ISO), businessDays, reasoning (array), holidays, alerts.`,

  [AgentTaskType.DRAFT_PETITION]: (data) =>
    `Redija peça processual:\n\n${data}\n\nRetorne JSON: draft (texto completo), confidence, needsReview, suggestions, metadata.`,

  [AgentTaskType.CHECK_DATAJUD]: (data) =>
    `Consulte DataJud:\n\n${data}\n\nRetorne JSON: processosEncontrados, ultimaAtualizacao, movimentacoes, status, partes.`,

  [AgentTaskType.ORGANIZE_FILES]: (data) =>
    `Organize arquivos:\n\n${data}\n\nRetorne JSON: filesOrganized, categoriesCreated, duplicatesFound, spaceSaved.`,

  [AgentTaskType.RESEARCH_PRECEDENTS]: (data) =>
    `Pesquise precedentes:\n\n${data}\n\nRetorne JSON: precedentsFound, relevantCases, thematicAnalysis, recommendation.`,

  [AgentTaskType.RISK_ANALYSIS]: (data) =>
    `Análise de risco:\n\n${data}\n\nRetorne JSON: riskLevel, riskScore, factors, recommendations, probabilitySuccess.`,

  [AgentTaskType.CONTRACT_REVIEW]: (data) =>
    `Revise contrato:\n\n${data}\n\nRetorne JSON: contractAnalysis, findings, compliance, riskAssessment.`,

  [AgentTaskType.CLIENT_COMMUNICATION]: (data) =>
    `Comunique ao cliente:\n\n${data}\n\nRetorne JSON: messageGenerated, template, tone, urgency, channels.`,

  [AgentTaskType.BILLING_ANALYSIS]: (data) =>
    `Analise faturamento:\n\n${data}\n\nRetorne JSON: periodAnalyzed, totalBilled, pendingInvoices, insights.`,

  [AgentTaskType.CASE_STRATEGY]: (data) =>
    `Estratégia para caso:\n\n${data}\n\nRetorne JSON: strategyAnalysis, recommendedActions, successProbability.`,

  [AgentTaskType.LEGAL_TRANSLATION]: (data) =>
    `Simplifique texto jurídico:\n\n${data}\n\nRetorne JSON: translationCompleted, simplifiedText, keyTermsGlossary.`,

  [AgentTaskType.COMPLIANCE_CHECK]: (data) =>
    `Verifique compliance:\n\n${data}\n\nRetorne JSON: complianceStatus, checksPerformed, violations, recommendations.`,
};

function getUserPrompt(task: AgentTask): string {
  const data = task.data;
  const taskData = JSON.stringify(data, null, 2);
  const promptGenerator = USER_PROMPTS[task.type];

  if (!promptGenerator) {
    logger.warn(`User prompt generator not found for task type: ${task.type}`);
    return `Processe:\n\n${taskData}`;
  }

  return promptGenerator(taskData);
}

// ===========================
// Helper functions for processTaskWithAI - Extracted per SonarCloud S3776
// ===========================

/**
 * Valida inputs da tarefa usando Zod schemas quando aplicável
 * @throws Error se validação falhar
 */
function validateTaskInputWithSchema(task: AgentTask): void {
  if (task.type === AgentTaskType.ANALYZE_INTIMATION) {
    const validation = AnalyzeIntimationInputSchema.safeParse(task.data);
    if (!validation.success) {
      const error = new Error(`Invalid input for ANALYZE_INTIMATION: ${validation.error.message}`);
      logger.error("Schema validation failed", error, { data: task.data });
      throw error;
    }
    return;
  }

  if (task.type === AgentTaskType.DRAFT_PETITION) {
    const validation = DraftPetitionInputSchema.safeParse(task.data);
    if (!validation.success) {
      const error = new Error(`Invalid input for DRAFT_PETITION: ${validation.error.message}`);
      logger.error("Schema validation failed", error, { data: task.data });
      throw error;
    }
  }
}

/**
 * Recupera contexto relevante da memória jurídica
 */
async function retrieveMemoryContext(task: AgentTask): Promise<string> {
  const query = (task.data?.description || task.data?.query) as string | undefined;
  if (!query) return "";

  try {
    const relevantItems = await legalMemory.search({ query, limit: 3 });
    if (relevantItems.length === 0) return "";

    logger.info(`Found ${relevantItems.length} relevant memory items for task ${task.id}`);
    return `\n\n# Contexto Jurídico Relevante (Memória):\n${relevantItems
      .map((item) => `- ${item.content} (Score: ${item.relevanceScore})`)
      .join("\n")}`;
  } catch (memError) {
    logger.warn("Failed to retrieve legal memory", { error: memError });
    return "";
  }
}

/**
 * Mapeamento de tipos de tarefa para configuração de salvamento na memória
 */
const MEMORY_SAVE_CONFIG: Record<
  AgentTaskType,
  {
    getContent: (result: TaskResult) => string | null;
    category: LegalContextType;
  } | null
> = {
  [AgentTaskType.DRAFT_PETITION]: {
    getContent: (result) =>
      result.draft ? `Minuta de petição: ${String(result.draft).substring(0, 200)}...` : null,
    category: "peca_processual",
  },
  [AgentTaskType.RESEARCH_PRECEDENTS]: {
    getContent: (result) =>
      result.precedentsFound
        ? `Pesquisa de precedentes: ${JSON.stringify(result.precedentsFound)}`
        : null,
    category: "precedente",
  },
  [AgentTaskType.CASE_STRATEGY]: {
    getContent: (result) =>
      result.strategyAnalysis
        ? `Estratégia processual: ${JSON.stringify(result.strategyAnalysis)}`
        : null,
    category: "estrategia",
  },
  // Tipos que não salvam na memória
  [AgentTaskType.ANALYZE_DOCUMENT]: null,
  [AgentTaskType.ANALYZE_INTIMATION]: null,
  [AgentTaskType.MONITOR_DJEN]: null,
  [AgentTaskType.CALCULATE_DEADLINE]: null,
  [AgentTaskType.CHECK_DATAJUD]: null,
  [AgentTaskType.ORGANIZE_FILES]: null,
  [AgentTaskType.RISK_ANALYSIS]: null,
  [AgentTaskType.CONTRACT_REVIEW]: null,
  [AgentTaskType.CLIENT_COMMUNICATION]: null,
  [AgentTaskType.BILLING_ANALYSIS]: null,
  [AgentTaskType.LEGAL_TRANSLATION]: null,
  [AgentTaskType.COMPLIANCE_CHECK]: null,
};

/**
 * Salva resultado na memória jurídica quando aplicável
 */
async function saveResultToMemory(task: AgentTask, result: TaskResult): Promise<void> {
  const config = MEMORY_SAVE_CONFIG[task.type];
  if (!config) return;

  const content = config.getContent(result);
  if (!content) return;

  try {
    await legalMemory.addContext(content, config.category, {
      taskId: task.id,
      agentId: result.agentId,
      fullDraft: result.draft,
    });
  } catch (memSaveError) {
    logger.warn("Failed to save to legal memory", { error: memSaveError });
  }
}

/**
 * Valida estruturas de entrada (task e agent)
 * @throws Error se validação falhar
 */
function validateInputStructures(task: AgentTask, agent: Agent): void {
  if (!validateAgentTask(task)) {
    const error = new Error("Invalid agent task structure");
    logger.error("Task validation failed", error, { task });
    throw error;
  }

  if (!validateAgent(agent)) {
    const error = new Error("Invalid agent structure");
    logger.error("Agent validation failed", error, { agent });
    throw error;
  }
}

/**
 * Obtém API key do Gemini
 * @throws Error se não configurada
 */
function getGeminiApiKey(): string {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error("Missing GOOGLE_API_KEY / GEMINI_API_KEY env var");
    logger.error("Gemini API key not configured", error);
    throw error;
  }
  return apiKey;
}

/**
 * Parseia resposta JSON do Gemini
 */
function parseGeminiResponse(aiContent: string): TaskResult {
  try {
    const start = aiContent.indexOf("{");
    const end = aiContent.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(aiContent.substring(start, end + 1));
    }
    return { rawResponse: aiContent };
  } catch (parseError) {
    logger.warn("Failed to parse Gemini JSON response", {
      error: parseError instanceof Error ? parseError.message : String(parseError),
      contentPreview: aiContent.slice(0, 500),
    });
    return { rawResponse: aiContent };
  }
}

// 🔁 Agora usando Google Gemini no lugar do Spark
/**
 * Prepara a requisição para o Gemini
 */
function prepareGeminiRequest(
  fullPrompt: string,
  timeoutMs: number
): { requestBody: unknown; controller: AbortController; timeoutId: NodeJS.Timeout } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: fullPrompt }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 2000,
      temperature: 0.7,
    },
  };

  return { requestBody, controller, timeoutId };
}

/**
 * Executa a chamada para o Gemini
 */
async function callGeminiAPI(
  apiKey: string,
  requestBody: unknown,
  controller: AbortController
): Promise<{ aiContent: string; tokensUsed?: number }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Gemini error: ${response.status} ${response.statusText} ${text}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    usageMetadata?: { totalTokenCount?: number };
  };

  const parts = data.candidates?.[0]?.content?.parts || [];
  const aiContent = parts
    .map((p) => p.text || "")
    .join("\n")
    .trim();

  if (!aiContent) {
    throw new Error("Empty response from Gemini");
  }

  return {
    aiContent,
    tokensUsed: data.usageMetadata?.totalTokenCount,
  };
}

/**
 * Enriquecer resultado com metadados
 */
function enrichResultWithMetadata(
  result: TaskResult,
  agentId: string,
  taskType: AgentTaskType,
  tokensUsed: number | undefined,
  startTime: number
): TaskResult {
  return {
    ...result,
    processedAt: new Date().toISOString(),
    agentId,
    taskType,
    tokensUsed,
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Extrai detalhes específicos por tipo de tarefa (reduz cognitive complexity)
 */
function getTaskTypeSpecificDetails(task: AgentTask): Record<string, unknown> {
  const detailsMap: Partial<Record<AgentTaskType, Record<string, unknown>>> = {
    [AgentTaskType.DRAFT_PETITION]: {
      tipoPeticao: task.data?.petitionType || "Não especificado",
      partes: task.data?.parts || "Não especificado",
    },
    [AgentTaskType.CALCULATE_DEADLINE]: {
      dataPublicacao: task.data?.publicationDate || "N/A",
      diasPrazo: task.data?.daysCount || "N/A",
    },
    [AgentTaskType.ANALYZE_INTIMATION]: {
      tribunal: task.data?.tribunal || "N/A",
      instancia: task.data?.instancia || "N/A",
    },
  };

  return detailsMap[task.type] || {};
}

/**
 * Extrai número do processo de várias fontes possíveis
 */
function extractProcessNumber(taskData: Record<string, unknown>): string {
  return (taskData?.processNumber ||
    (taskData?.processo as { numero?: string })?.numero ||
    taskData?.numeroProcesso ||
    "N/A") as string;
}

/**
 * Prepara contexto inicial para log de pensamento do agente
 */
function prepareInitialThinkingContext(task: AgentTask): Record<string, unknown> {
  return {
    descricao: task.data?.description || "Sem descrição",
    processo: extractProcessNumber(task.data),
    prioridade: task.priority || "normal",
    ...getTaskTypeSpecificDetails(task),
  };
}

/**
 * Executa logging e validações iniciais (Refatorado - SonarCloud S3776)
 */
async function initializeTaskProcessing(
  task: AgentTask,
  agent: Agent
): Promise<{ apiKey: string; memoryContext: string }> {
  // Log inicial
  await logAgentThinking(task, agent, "INICIANDO", prepareInitialThinkingContext(task));

  // Validações
  validateInputStructures(task, agent);
  validateTaskInputWithSchema(task);

  // Obter recursos necessários
  const apiKey = getGeminiApiKey();
  const memoryContext = await retrieveMemoryContext(task);

  // Log de contexto recuperado
  await logAgentThinking(task, agent, "CONTEXTO_RECUPERADO", {
    memoriaItens: memoryContext
      ? `Contexto jurídico carregado (${memoryContext.split("\n").filter((l) => l.trim()).length} itens)`
      : "Sem contexto prévio",
  });

  return { apiKey, memoryContext };
}

/**
 * Prepara prompts para o agente (Refatorado - SonarCloud S3776)
 */
async function preparePromptsForAgent(
  task: AgentTask,
  agent: Agent,
  memoryContext: string
): Promise<string> {
  const systemPrompt = getSystemPrompt(agent.type);
  const userPrompt = getUserPrompt(task);

  await logAgentThinking(task, agent, "ANALISANDO", {
    promptSize: `${userPrompt.length} caracteres`,
    taskType: task.type,
    agentRole: agent.name,
    estimativaTokens: Math.ceil(userPrompt.length / 4),
  });

  logger.info("Processing task with Gemini", {
    taskId: task.id,
    agentId: agent.id,
    taskType: task.type,
    timeout: task.timeout || 30000,
  });

  return [
    "# Instruções do agente (system):",
    systemPrompt,
    memoryContext,
    "",
    "# Tarefa específica (user):",
    userPrompt,
  ].join("\n");
}

/**
 * Finaliza processamento com logs e salvamento de memória
 */
async function finalizeTaskProcessing(
  task: AgentTask,
  agent: Agent,
  aiContent: string,
  tokensUsed: number | undefined,
  startTime: number
): Promise<TaskResult> {
  const result = parseGeminiResponse(aiContent);

  await logAgentThinking(task, agent, "RESPOSTA_GERADA", {
    preview: aiContent.substring(0, 200) + "...",
    tokensUsados: tokensUsed,
  });

  const enrichedResult = enrichResultWithMetadata(
    result,
    agent.id,
    task.type,
    tokensUsed,
    startTime
  );

  await saveResultToMemory(task, enrichedResult);

  await logAgentThinking(task, agent, "CONCLUÍDO", {
    resultado: result.summary || "Tarefa concluída com sucesso",
    tempoProcessamento: `${enrichedResult.processingTimeMs}ms`,
    proximasAcoes: Array.isArray(result.nextActions) ? result.nextActions.join(", ") : "Nenhuma",
  });

  logger.info("Task processed successfully (Gemini)", {
    taskId: task.id,
    agentId: agent.id,
    tokensUsed: enrichedResult.tokensUsed,
    processingTimeMs: enrichedResult.processingTimeMs,
  });

  return enrichedResult;
}

async function processTaskWithAI(task: AgentTask, agent: Agent): Promise<TaskResult> {
  return await agentMonitor.trackTaskExecution(task.id, agent.id, task.type, async () => {
    const startTime = Date.now();

    // Fase 1: Inicialização e validações
    const { apiKey, memoryContext } = await initializeTaskProcessing(task, agent);

    // Fase 2: Preparação de prompts
    const fullPrompt = await preparePromptsForAgent(task, agent, memoryContext);

    // Fase 3: Execução da chamada Gemini
    const timeoutMs = task.timeout || 30000;
    const { requestBody, controller, timeoutId } = prepareGeminiRequest(fullPrompt, timeoutMs);

    try {
      const { aiContent, tokensUsed } = await callGeminiAPI(apiKey, requestBody, controller);

      // Fase 4: Finalização e persistência
      return await finalizeTaskProcessing(task, agent, aiContent, tokensUsed, startTime);
    } finally {
      clearTimeout(timeoutId);
    }
  });
}

// ===========================
// Action Handlers - Extracted to reduce CC (S3776)
// ===========================

interface ProcessQueueTaskResult {
  taskId: string;
  status: "completed" | "failed";
  error?: string;
  metadata?: {
    minutaSaved?: boolean;
    chainedActionsProcessed?: boolean;
  };
}

/**
 * Registra o "pensamento" do agente em tempo real
 */
async function logAgentThinking(
  task: AgentTask,
  agent: Agent,
  stage: string,
  details: Record<string, unknown>
): Promise<void> {
  try {
    const redis = getRedisOrNull();
    if (!redis) return;

    const thinkingLog = {
      id: `${task.id}-${Date.now()}`,
      taskId: task.id,
      agentId: agent.id,
      agentName: agent.name,
      taskType: task.type,
      stage,
      details,
      timestamp: new Date().toISOString(),
    };

    // Salvar no histórico de pensamentos (últimos 500)
    const thinkingHistory =
      ((await redis.get("agent-thinking-logs")) as (typeof thinkingLog)[]) || [];
    thinkingHistory.unshift(thinkingLog);
    await redis.set("agent-thinking-logs", thinkingHistory.slice(0, 500));

    // Salvar também no log específico da tarefa para streaming
    const taskThinking =
      ((await redis.get(`task-thinking:${task.id}`)) as (typeof thinkingLog)[]) || [];
    taskThinking.push(thinkingLog);
    await redis.set(`task-thinking:${task.id}`, taskThinking, { ex: 3600 }); // expira em 1h

    logger.info(`[Agent Thinking] ${agent.name} - ${stage}`, details);
  } catch (error) {
    logger.error("Failed to log agent thinking", error);
  }
}

/**
 * Busca tarefas do KV
 */
async function fetchTaskQueue(): Promise<AgentTask[]> {
  try {
    const redis = getRedisOrNull();
    if (!redis) {
      logger.warn("No Redis available for task queue");
      return [];
    }

    const tasks = (await redis.get("agent-task-queue")) as AgentTask[] | null;
    return (tasks ?? []).filter((t) => validateAgentTask(t));
  } catch (error) {
    logger.error("Failed to fetch task queue from Redis", error);
    return [];
  }
}

/**
 * Busca agentes do KV
 */
async function fetchAgents(): Promise<Agent[]> {
  try {
    const redis = getRedisOrNull();
    if (!redis) {
      logger.warn("No Redis available for agents");
      return [];
    }

    const agents = await redis.get<Agent[] | null>("autonomous-agents");
    return (agents ?? []).filter((a) => validateAgent(a));
  } catch (error) {
    logger.error("Failed to fetch agents from Redis", error);
    return [];
  }
}

/**
 * Salva fila de tarefas no KV
 */
async function saveTaskQueue(taskQueue: AgentTask[]): Promise<void> {
  try {
    const redis = getRedisOrNull();
    if (!redis) {
      logger.warn("No Redis available to save task queue");
      return;
    }

    await redis.set("agent-task-queue", taskQueue);
  } catch (error) {
    logger.error("Failed to save task queue to Redis", error);
  }
}

/**
 * Busca todas as minutas do Redis (compatível com nova estrutura atômica)
 * Prefixado com _ pois é usado apenas em contextos específicos
 * @returns Array de minutas
 */
async function _fetchAllMinutas(): Promise<unknown[]> {
  try {
    const redis = getRedisOrNull();
    if (!redis) return [];

    // Buscar IDs da lista
    const minutaIds = (await redis.lrange("minutas:ids", 0, -1)) as string[];

    if (minutaIds.length === 0) {
      // Fallback: tentar buscar do formato antigo
      const oldMinutas = await redis.get("minutas");
      return (oldMinutas as unknown[] | null) ?? [];
    }

    // Buscar cada minuta individual
    const minutas = await Promise.all(
      minutaIds.map(async (id) => {
        const minuta = await redis.get(`minuta:${id}`);
        return minuta;
      })
    );

    return minutas.filter((m) => m !== null);
  } catch (error) {
    logger.error("Failed to fetch minutas from Redis", error);
    return [];
  }
}

/**
 * Valida se uma tarefa pode ser processada
 */
function canProcessTask(task: AgentTask, agent: Agent): boolean {
  return agent.enabled && task.status === TaskStatus.QUEUED;
}

/**
 * Processa ações encadeadas de uma tarefa
 */
function processChainedActions(task: AgentTask, result: TaskResult, taskQueue: AgentTask[]): void {
  if (
    task.type !== AgentTaskType.ANALYZE_DOCUMENT ||
    !result.suggestedActions ||
    !Array.isArray(result.suggestedActions)
  ) {
    return;
  }

  for (const actionText of result.suggestedActions) {
    const mapping = findTaskMapping(String(actionText));
    if (mapping) {
      const nextTask = createChainedTask(String(actionText), task, mapping);
      logger.info(`Chaining task: ${nextTask.type} for ${nextTask.agentId}`);
      taskQueue.push(nextTask);
    }
  }
}

/**
 * Salva minuta auto-gerada no KV usando serviço centralizado
 * ✨ REFATORADO: Usa createMinutaFromAgentTask do minuta-service-backend
 */
async function saveAutoGeneratedMinuta(task: AgentTask, result: TaskResult): Promise<void> {
  if (task.type !== AgentTaskType.DRAFT_PETITION || !result.draft) return;

  try {
    // ✅ Usar serviço centralizado
    const minuta = createMinutaFromAgentTask(task);

    if (!minuta) {
      logger.warn("createMinutaFromAgentTask returned null", { taskId: task.id });
      return;
    }

    const redis = getRedisOrNull();
    if (!redis) {
      logger.warn("No Redis available to save auto-generated minuta");
      return;
    }

    // ✅ CORREÇÃO: Usar operações atômicas para evitar race condition
    // Salvar minuta individual com chave única
    await redis.set(`minuta:${minuta.id}`, minuta);

    // Adicionar ID à lista de minutas (Atomic Operation)
    await redis.rpush("minutas:ids", minuta.id);

    // Tentar extrair processId de várias fontes possíveis
    const processId = (task.data?.processId ||
      (task.data?.processo as Record<string, unknown>)?.id ||
      task.data?.processNumber) as string | undefined;

    if (processId) {
      await redis.rpush(`minutas:process:${processId}`, minuta.id);
    }

    logger.info("Auto-created minuta using centralized service", {
      id: minuta.id,
      titulo: minuta.titulo,
      agentId: task.agentId,
      processId: processId || "none",
    });
  } catch (error) {
    logger.error("Failed to save auto-generated minuta", error);
    // Não propagar erro - minuta pode ser recriada no frontend
  }
}

/**
 * Executa processamento de IA para a tarefa
 */
async function executeAIProcessing(task: AgentTask, agent: Agent): Promise<TaskResult> {
  const aiResult = await processTaskWithAI(task, agent);

  // Salvar minuta ANTES de marcar como completed (atomicidade)
  try {
    await saveAutoGeneratedMinuta(task, aiResult);
  } catch (minutaError) {
    logger.error(`Critical: Failed to save minuta for task ${task.id}`, minutaError);
    throw new Error(
      `Failed to save minuta: ${minutaError instanceof Error ? minutaError.message : "Unknown error"}`
    );
  }

  return aiResult;
}

/**
 * Tenta processar ações encadeadas (não-crítico)
 */
function tryProcessChainedActions(
  task: AgentTask,
  result: TaskResult,
  taskQueue: AgentTask[]
): boolean {
  try {
    processChainedActions(task, result, taskQueue);
    return true;
  } catch (chainError) {
    logger.warn(`Non-critical: Failed chained actions for task ${task.id}`, chainError);
    return false;
  }
}

/**
 * Marca tarefa como completa com metadata
 */
function markTaskCompleted(
  task: AgentTask,
  result: TaskResult,
  chainedActionsProcessed: boolean
): ProcessQueueTaskResult {
  task.status = TaskStatus.COMPLETED;
  task.completedAt = new Date().toISOString();
  task.result = result;

  return {
    taskId: task.id,
    status: "completed",
    metadata: {
      minutaSaved: true,
      chainedActionsProcessed,
    },
  };
}

/**
 * Marca tarefa como falha
 */
function markTaskFailed(task: AgentTask, error: unknown): ProcessQueueTaskResult {
  task.status = TaskStatus.FAILED;
  task.error = error instanceof Error ? error.message : "Unknown error";

  return {
    taskId: task.id,
    status: "failed",
    error: task.error,
  };
}

/**
 * Processa uma tarefa individual da fila (Refatorado - SonarCloud S3776)
 */
async function processQueueTask(
  task: AgentTask,
  agents: Agent[],
  taskQueue: AgentTask[]
): Promise<ProcessQueueTaskResult> {
  const agent = agents.find((a) => a.id === task.agentId);

  if (!agent) {
    logger.info(`Skipping task ${task.id} - agent not found`);
    return { taskId: task.id, status: "failed", error: "Agent not found" };
  }

  if (!canProcessTask(task, agent)) {
    logger.info(`Skipping task ${task.id} - agent disabled`);
    return { taskId: task.id, status: "failed", error: "Agent disabled" };
  }

  try {
    logger.info(`Processing task ${task.id} for ${agent.name}`);

    // Passo 1: Processar com IA e salvar minuta (crítico)
    const aiResult = await executeAIProcessing(task, agent);

    // Passo 2: Processar ações encadeadas (não-crítico)
    const chainedActionsProcessed = tryProcessChainedActions(task, aiResult, taskQueue);

    // Passo 3: Marcar como completed
    return markTaskCompleted(task, aiResult, chainedActionsProcessed);
  } catch (error) {
    logger.error(`Error processing task ${task.id}`, error);
    return markTaskFailed(task, error);
  }
}

/**
 * Handler: POST ?action=process-queue
 */
async function handleProcessQueue(res: VercelResponse): Promise<VercelResponse> {
  const taskQueue = await fetchTaskQueue();
  const validTasks = taskQueue.filter((t) => validateAgentTask(t));
  const pendingTasks = validTasks.filter((t) => t.status === TaskStatus.QUEUED);

  logger.info(`Found ${pendingTasks.length} pending tasks`);

  if (pendingTasks.length === 0) {
    return res.status(200).json({
      ok: true,
      message: "No pending tasks",
      processed: 0,
      timestamp: new Date().toISOString(),
    });
  }

  const agents = await fetchAgents();
  const tasksToProcess = pendingTasks.slice(0, 5);
  const results: ProcessQueueTaskResult[] = [];

  for (const task of tasksToProcess) {
    const result = await processQueueTask(task, agents, taskQueue);
    results.push(result);
  }

  await saveTaskQueue(taskQueue);

  const processedCount = results.filter((r) => r.status === "completed").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  logger.info(
    `Processed ${results.length} tasks: ${processedCount} completed, ${failedCount} failed`
  );

  return res.status(200).json({
    ok: true,
    message: `Processed ${processedCount} tasks successfully`,
    processed: processedCount,
    failed: failedCount,
    results,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handler: POST ?action=process-task
 */
async function handleProcessTask(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
  const { task, agent } = req.body as { task: unknown; agent: unknown };

  if (!validateAgentTask(task)) {
    return res.status(400).json({
      error: "Invalid task structure",
      timestamp: new Date().toISOString(),
    });
  }

  if (!validateAgent(agent)) {
    return res.status(400).json({
      error: "Invalid agent structure",
      timestamp: new Date().toISOString(),
    });
  }

  // Type guards refinam os tipos automaticamente
  const result = await processTaskWithAI(task, agent);

  return res.status(200).json({
    ok: true,
    result,
    metadata: {
      tokensUsed: result.tokensUsed,
      processingTimeMs: result.processingTimeMs,
      processedAt: result.processedAt,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handler: GET ?action=logs
 */
async function handleGetLogs(res: VercelResponse): Promise<VercelResponse> {
  try {
    const redis = getRedisOrNull();
    if (!redis) {
      logger.warn("No Redis available for logs");
      return res.status(200).json({ logs: [] });
    }

    const logsData = await redis.get("agent-logs");
    const logs = Array.isArray(logsData) ? logsData : [];
    return res.status(200).json({ logs });
  } catch (error) {
    logger.error("Failed to fetch agent logs", error);
    return res.status(200).json({ logs: [] });
  }
}

/**
 * Handler: GET ?action=memory
 */
async function handleGetMemory(res: VercelResponse): Promise<VercelResponse> {
  try {
    const redis = getRedisOrNull();
    if (!redis) {
      logger.warn("No Redis available for memory");
      return res.status(200).json({ memory: [] });
    }

    const memoryData = await redis.get("legal-memory");
    const memory = Array.isArray(memoryData) ? memoryData : [];
    return res.status(200).json({ memory });
  } catch (error) {
    logger.error("Failed to fetch legal memory", error);
    return res.status(200).json({ memory: [] });
  }
}

/**
 * Verifica se a requisição é de ambiente local/dev
 */
function isLocalOrDevEnvironment(req: VercelRequest): boolean {
  const host = req.headers.host || "";
  return (
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    process.env.NODE_ENV === "development"
  );
}

/**
 * Verifica se a requisição é de ambiente Vercel
 */
function isVercelEnvironment(req: VercelRequest): boolean {
  const host = req.headers.host || "";
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  return (
    host.includes("vercel.app") || origin.includes("vercel.app") || referer.includes("vercel.app")
  );
}

/**
 * Verifica se tem autenticação válida (Bearer token ou API key)
 */
function hasValidAuthentication(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;
  
  // Check Bearer token
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    // Validate token - must be non-empty and at least 32 characters for a valid token
    const validBearerToken = token.length >= 32;
    
    // Check against configured API keys
    const validApiKeys = [
      process.env.AGENTS_API_KEY,
      process.env.API_KEY,
      process.env.CRON_SECRET,
    ].filter(Boolean);
    
    // Token must either be long enough (secure) or match a configured key
    if (validBearerToken || validApiKeys.includes(token)) {
      return true;
    }
  }
  
  // Check x-api-key header
  const apiKey = req.headers["x-api-key"];
  if (apiKey && typeof apiKey === "string") {
    const validApiKeys = [
      process.env.AGENTS_API_KEY,
      process.env.API_KEY,
      process.env.CRON_SECRET,
    ].filter(Boolean);
    
    if (validApiKeys.includes(apiKey)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Verifica autorização da requisição (Refatorado - SonarCloud S3776)
 */
function isAuthorized(req: VercelRequest): boolean {
  // Em produção, sempre exigir autenticação
  if (process.env.NODE_ENV === "production") {
    return hasValidAuthentication(req);
  }

  // Aceitar se tem autenticação válida
  if (hasValidAuthentication(req)) {
    return true;
  }

  // Em dev/test, aceitar se é ambiente confiável (dev ou Vercel)
  return isLocalOrDevEnvironment(req) || isVercelEnvironment(req);
}

// ===========================
// CORS Helper
// ===========================

function setupCORS(req: VercelRequest, res: VercelResponse): void {
  const allowedOrigins = [
    "https://assistente-juridico-github.vercel.app",
    "https://assistente-juridico-github.vercel.app",
  ];
  const origin = req.headers.origin || "";
  const isDev =
    process.env.NODE_ENV === "development" ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1");

  if (allowedOrigins.includes(origin) || isDev) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
}

// ===========================
// Route Handler - Refatorado com Route Map (SonarCloud S3776)
// ===========================

type RouteHandler = (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse>;

interface RouteConfig {
  handler: RouteHandler;
  eventName: string;
}

/**
 * Mapeamento de rotas para eliminar sequência de ifs (reduce cognitive complexity)
 */
const ROUTE_MAP: Record<string, RouteConfig> = {
  "process-queue:POST": {
    handler: async (_req, res) => handleProcessQueue(res),
    eventName: "queue.processed",
  },
  "process-task:POST": {
    handler: async (req, res) => handleProcessTask(req, res),
    eventName: "task.processed",
  },
  "logs:GET": {
    handler: async (_req, res) => handleGetLogs(res),
    eventName: "logs.retrieved",
  },
  "memory:GET": {
    handler: async (_req, res) => handleGetMemory(res),
    eventName: "memory.retrieved",
  },
};

async function handleRoute(
  action: string | undefined,
  method: string,
  req: VercelRequest,
  res: VercelResponse,
  span: ReturnType<typeof tracingService.startSpan>
): Promise<VercelResponse> {
  const routeKey = `${action}:${method}`;
  const route = ROUTE_MAP[routeKey];

  if (!route) {
    tracingService.setAttribute(span, "error", "true");
    tracingService.setAttribute(span, "error.message", "Invalid action");
    return res.status(400).json({
      error: "Invalid action. Use: process-queue, process-task, logs, or memory",
      timestamp: new Date().toISOString(),
    });
  }

  tracingService.setAttribute(span, "handler", action || "unknown");
  const result = await route.handler(req, res);
  tracingService.addEvent(span, route.eventName);
  return result;
}

// ===========================
// Main Handler - Simplified
// ===========================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setupCORS(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const actionParam = req.query.action;
  const action = Array.isArray(actionParam) ? actionParam[0] : actionParam;

  if (!isAuthorized(req)) {
    return res.status(401).json({
      error: "Unauthorized",
      message:
        "Authentication required. Provide Bearer token, x-api-key header, or access from localhost.",
    });
  }

  const span = tracingService.startSpan("api.agents.handler", {
    kind: "server",
    attributes: {
      "http.route": "/api/agents",
    },
  });

  tracingService.setAttribute(span, "http.method", req.method || "unknown");
  tracingService.setAttribute(span, "http.action", action || "unknown");

  try {
    tracingService.addEvent(span, "request.received", {
      timestamp: Date.now(),
      action: action || "unknown",
    });

    const result = await handleRoute(action, req.method || "GET", req, res, span);
    await tracingService.endSpan(span);
    return result;
  } catch (error) {
    logger.error("Handler error", error);
    tracingService.recordException(span, error as Error);
    await tracingService.endSpan(
      span,
      "error",
      error instanceof Error ? error.message : "Unknown error"
    );

    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}
