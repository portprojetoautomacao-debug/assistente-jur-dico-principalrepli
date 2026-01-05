/**
 * Core types and utilities for AI Agents system
 *
 * Este arquivo define os tipos base e helpers usados em todo o sistema de agentes
 *
 * ============================================================================
 * PLANO MESTRE - FASE 1: Task Engine Hardening
 * ============================================================================
 * - TarefaSistema com retry, timeout, nextRunAt
 * - TaskCreator para rastreabilidade
 * - AgentId tipado para type safety
 */

// ============================================================================
// TYPES
// ============================================================================

export type AgentStatus =
  | "active"
  | "idle"
  | "processing"
  | "paused"
  | "waiting_human"
  | "error"
  | "degraded";

export type TaskStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "human_intervention"
  | "pending_retry";

export type TaskPriority = "low" | "medium" | "high" | "critical";

/**
 * Quem criou a tarefa - rastreabilidade total
 */
export type TaskCreator = "sistema" | "agente" | "humano" | "cron" | "webhook";

/**
 * Tipos de tarefa padronizados (TarefaSistemaTipo)
 */
export type TarefaSistemaTipo =
  | "IMPORTAR_INTIMACOES"
  | "CRIAR_MINUTA"
  | "ANALISAR_PRAZO"
  | "ATUALIZAR_STATUS_PROCESSO"
  | "ENVIAR_RESUMO_DIARIO"
  | "CALCULATE_DEADLINE"
  | "RESEARCH_PRECEDENTS"
  | "CLIENT_COMMUNICATION"
  | "CHECK_DATAJUD"
  | "RISK_ANALYSIS"
  | "BILLING_ANALYSIS"
  | "ORGANIZE_FILES"
  | "COMPLIANCE_CHECK"
  | "LEGAL_TRANSLATION"
  | "CONTRACT_REVIEW"
  | "CASE_STRATEGY"
  | "DRAFT_PETITION"
  | "ANALYZE_DOCUMENT"
  | "ANALYZE_INTIMATION"
  | "MONITOR_DJEN"
  | "SYNC_CALENDAR"
  | "SEND_NOTIFICATION";

/**
 * IDs de agentes tipados para type safety
 */
export type AgentId =
  | "harvey"
  | "justine"
  | "analise-documental"
  | "monitor-djen"
  | "gestao-prazos"
  | "redacao-peticoes"
  | "organizacao-arquivos"
  | "pesquisa-juris"
  | "analise-risco"
  | "revisao-contratual"
  | "comunicacao-clientes"
  | "financeiro"
  | "estrategia-processual"
  | "traducao-juridica"
  | "compliance";

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  status: AgentStatus;
  enabled: boolean;
  /** Status/activity para exibir no UI (não é ISO) */
  lastActivity: string;
  continuousMode: boolean;
  currentTask?: AgentTask;
  capabilities?: string[];
  config?: Record<string, unknown>;
  nextScheduledRun?: string;
  workQueue?: AgentTask[];
  humanInteractionMode?: "auto" | "strict" | "relaxed";
  /** Contador de falhas recentes para circuit breaker */
  recentFailures?: number;
  /** Timestamp da última falha (ISO) */
  lastFailureAt?: string;
}

/**
 * TarefaSistema - Tarefa do sistema com retry, timeout e rastreabilidade
 * (AgentTask melhorado conforme Plano Mestre FASE 1)
 */
export interface AgentTask {
  id: string;
  agentId: AgentId;
  type: TarefaSistemaTipo;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  data: Record<string, unknown>;
  result?: AgentTaskResult;
  error?: string;
  humanTouchedAt?: string;
  resumeAfterHuman?: boolean;

  // FASE 1: Retry com backoff exponencial
  retryCount?: number;
  maxRetries?: number;
  /** Próxima execução agendada (ISO) - para retry com backoff */
  nextRunAt?: string;

  // FASE 1: Timeout de tarefa
  /** Timeout em ms (default: 10 min via DEFAULT_TASK_TIMEOUT_MS) */
  timeout?: number;

  // FASE 1: Rastreabilidade
  /** Quem criou a tarefa */
  criadoPor?: TaskCreator;
  /** ISO timestamp da última atualização */
  atualizadoEm?: string;
  /** Número do processo relacionado */
  processoNumero?: string;
  /** ID da tarefa que originou esta (chaining) */
  sourceTaskId?: string;

  // FASE 3: Feedback e auditoria
  /** Confiança do resultado (0-1) */
  confidence?: number;
  /** Tokens usados na chamada LLM */
  tokensUsed?: number;
  /** Tempo de processamento em ms */
  processingTimeMs?: number;
}

/**
 * Alias para compatibilidade - TarefaSistema = AgentTask
 */
export type TarefaSistema = AgentTask;

export interface AgentTaskResult {
  success: boolean;
  data?: Record<string, unknown>;
  message?: string;
  error?: string;
  suggestions?: string[];
  nextSteps?: string[];
  /** Confiança do resultado (0-1) */
  confidence?: number;
  /** Tokens usados */
  tokensUsed?: number;
  /** Tempo de processamento */
  processingTimeMs?: number;
}

export interface AgentTaskGeneratorConfig {
  enabled: boolean;
  intervalMinutes: number;
  maxTasksPerInterval: number;
  agentIds: AgentId[];
}

export interface AgentTaskGenerator {
  start(): void;
  stop(): void;
  updateConfig(config: Partial<AgentTaskGeneratorConfig>): void;
  setOnTaskGenerated(callback: (task: AgentTask) => void): void;
}

// ============================================================================
// FASE 1: RETRY COM BACKOFF EXPONENCIAL
// ============================================================================

/**
 * Calcula o atraso para retry com backoff exponencial
 * @param retryCount Número de tentativas já realizadas
 * @param baseMs Atraso base em ms (default: 10s)
 * @param maxMs Atraso máximo em ms (default: 10min)
 * @returns Atraso em ms com jitter
 */
export function calcularAtrasoRetry(
  retryCount: number,
  baseMs: number = 10_000,
  maxMs: number = 10 * 60 * 1_000
): number {
  const safeRetry = Math.max(0, retryCount);
  const expo = Math.pow(2, safeRetry);
  // Use crypto for secure random jitter
  const jitter = (crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff) * 0.3 + 0.85; // 0.85–1.15
  return Math.min(baseMs * expo * jitter, maxMs);
}

/**
 * Agenda retry de uma tarefa com backoff exponencial
 */
export function agendarRetryTarefa(task: AgentTask): AgentTask {
  const retryCount = (task.retryCount ?? 0) + 1;
  const maxRetries = task.maxRetries ?? 3;
  const nowIso = new Date().toISOString();

  if (retryCount > maxRetries) {
    return {
      ...task,
      status: "failed",
      retryCount,
      atualizadoEm: nowIso,
      error: `Máximo de ${maxRetries} tentativas excedido`,
    };
  }

  const atrasoMs = calcularAtrasoRetry(retryCount);
  const nextRunAt = new Date(Date.now() + atrasoMs).toISOString();

  return {
    ...task,
    status: "pending_retry",
    retryCount,
    nextRunAt,
    atualizadoEm: nowIso,
  };
}

// ============================================================================
// FASE 1: DETECÇÃO DE TAREFAS TRAVADAS (ZUMBI)
// ============================================================================

/**
 * Timeout padrão para tarefas (10 minutos)
 */
export const DEFAULT_TASK_TIMEOUT_MS = 10 * 60 * 1_000;

/**
 * Verifica se uma tarefa estourou o timeout (baseado em startedAt + timeout/default)
 */
export function isTaskTimedOut(
  task: AgentTask,
  nowMs: number = Date.now(),
  defaultTimeoutMs: number = DEFAULT_TASK_TIMEOUT_MS
): boolean {
  if (!task.startedAt) return false;
  if (task.status !== "processing") return false;

  const timeoutMs = task.timeout ?? defaultTimeoutMs;
  const startedMs = new Date(task.startedAt).getTime();
  if (Number.isNaN(startedMs)) return false;

  return nowMs - startedMs > timeoutMs;
}

/**
 * Detecta tarefas que estão travadas (status = processing por muito tempo)
 */
export function detectarTarefasTravadas(
  tarefas: AgentTask[],
  limiteMs: number = DEFAULT_TASK_TIMEOUT_MS
): AgentTask[] {
  const agora = Date.now();

  return tarefas.filter((t) => isTaskTimedOut(t, agora, limiteMs));
}

/**
 * Recupera tarefa travada (reenfileira ou marca como falha)
 */
export function recuperarTarefaTravada(task: AgentTask): AgentTask {
  const retryCount = (task.retryCount ?? 0) + 1;
  const maxRetries = task.maxRetries ?? 3;
  const nowIso = new Date().toISOString();

  console.warn(`[TaskEngine] Tarefa travada detectada: ${task.id} (${task.type})`);

  if (retryCount <= maxRetries) {
    return agendarRetryTarefa({
      ...task,
      retryCount,
      error: `Tarefa travada - tentativa ${retryCount} de ${maxRetries}`,
    });
  }

  return {
    ...task,
    status: "failed",
    retryCount,
    completedAt: nowIso,
    atualizadoEm: nowIso,
    error: "Tarefa travada após múltiplas tentativas",
  };
}

/**
 * Verifica se uma tarefa está pronta para execução
 */
export function tarefaProntaParaExecucao(task: AgentTask): boolean {
  // Tarefas em pending_retry só rodam após nextRunAt
  if (task.status === "pending_retry") {
    if (!task.nextRunAt) return false;
    return new Date(task.nextRunAt).getTime() <= Date.now();
  }

  // Fila normal
  return task.status === "queued";
}

// ============================================================================
// HUMAN-IN-THE-LOOP
// ============================================================================

/**
 * Determina se a tarefa deve pausar para revisão humana
 * (filtro de segurança, não trava autonomia geral)
 */
export function shouldPauseForHuman(agent: Agent, task: AgentTask): boolean {
  // Tarefas de prioridade crítica sempre passam por humano
  if (task.priority === "critical") {
    return true;
  }

  // Confiança baixa (se fornecida) força humano
  if (typeof task.confidence === "number" && task.confidence < 0.6) {
    return true;
  }

  // Tarefas que já bateram o limite de tentativas
  if ((task.retryCount ?? 0) >= (task.maxRetries ?? 3)) {
    return true;
  }

  const typeLc = String(task.type).toLowerCase();

  // Coisas que mexem com protocolo, dinheiro, contrato ou cliente
  const highRiskKeywords = [
    "petition",
    "peticao",
    "petição",
    "protocolo",
    "contract",
    "contrato",
    "billing",
    "faturamento",
    "pagamento",
    "client_communication",
    "client-communication",
    "comunicacao",
    "comunicação",
    "legal_advice",
    "parecer",
  ];

  if (highRiskKeywords.some((keyword) => typeLc.includes(keyword))) {
    return true;
  }

  // Modo estrito de interação humana
  if (agent.humanInteractionMode === "strict") {
    return true;
  }

  return false;
}

/**
 * Verifica se a tarefa pode ser retomada após intervenção humana
 */
export function canResumeAfterHuman(task: AgentTask): boolean {
  // Tarefa explicitamente marcada para retomar
  if (task.resumeAfterHuman) {
    return true;
  }

  // Tarefa em modo humana mas tocada há mais de 24h → auto-resume
  if (task.status === "human_intervention" && task.humanTouchedAt) {
    const touchedTime = new Date(task.humanTouchedAt).getTime();
    if (Number.isNaN(touchedTime)) {
      return false;
    }

    const now = Date.now();
    const hoursSinceTouched = (now - touchedTime) / (1000 * 60 * 60);

    return hoursSinceTouched > 24;
  }

  // Fila normal
  return task.status === "queued";
}

// ============================================================================
// AGENT REGISTRY
// ============================================================================

/**
 * Configuração padrão dos 15 agentes
 */
export const DEFAULT_AGENTS: Agent[] = [
  {
    id: "harvey",
    name: "Harvey Specter",
    description:
      "Assistente jurídico estratégico que analisa performance, processos, prazos e finanças do escritório em tempo real",
    type: "strategic",
    status: "idle",
    enabled: true,
    lastActivity: "Aguardando tarefas",
    continuousMode: true,
    capabilities: [
      "strategic-analysis",
      "performance-monitoring",
      "risk-identification",
      "data-analysis",
    ],
  },
  {
    id: "justine",
    name: "Mrs. Justin-e",
    description:
      "Especialista em análise automática de intimações com foco em identificação de prazos, providências e geração de tarefas",
    type: "intimation-analyzer",
    status: "idle",
    enabled: true,
    lastActivity: "Aguardando tarefas",
    continuousMode: true,
    capabilities: [
      "intimation-analysis",
      "deadline-identification",
      "task-generation",
      "priority-assessment",
    ],
  },
  {
    id: "analise-documental",
    name: "Analisador de Documentos",
    description:
      "Analisa automaticamente expedientes, intimações e documentos do PJe 24/7, extraindo informações estruturadas",
    type: "analyzer",
    status: "idle",
    enabled: true,
    lastActivity: "Aguardando tarefas",
    continuousMode: true,
    capabilities: ["document-analysis", "text-extraction", "entity-recognition", "classification"],
  },
  {
    id: "monitor-djen",
    name: "Monitor DJEN",
    description:
      "Monitora automaticamente o Diário de Justiça Eletrônico Nacional (DJEN) e DataJud para novas publicações relevantes",
    type: "monitor",
    status: "idle",
    enabled: true,
    lastActivity: "Aguardando tarefas",
    continuousMode: true,
    capabilities: [
      "djen-monitoring",
      "publication-detection",
      "notification",
      "datajud-integration",
    ],
  },
  {
    id: "gestao-prazos",
    name: "Gestão de Prazos",
    description:
      "Calcula e acompanha prazos processuais automaticamente, gerando alertas e priorizando ações",
    type: "calculator",
    status: "idle",
    enabled: true,
    lastActivity: "Aguardando tarefas",
    continuousMode: true,
    capabilities: [
      "deadline-calculation",
      "business-days",
      "holiday-detection",
      "alert-generation",
    ],
  },
  {
    id: "redacao-peticoes",
    name: "Redator de Petições",
    description:
      "Auxilia na criação de petições e documentos jurídicos profissionais com base nos autos e precedentes",
    type: "writer",
    status: "idle",
    enabled: true,
    lastActivity: "Aguardando tarefas",
    continuousMode: true,
    capabilities: [
      "document-drafting",
      "legal-writing",
      "template-generation",
      "precedent-integration",
    ],
  },
  {
    id: "organizacao-arquivos",
    name: "Organizador de Arquivos",
    description:
      "Organiza e categoriza automaticamente documentos do escritório por processo, tipo e relevância",
    type: "organizer",
    status: "idle",
    enabled: false,
    lastActivity: "Aguardando tarefas",
    continuousMode: false,
    capabilities: ["file-organization", "categorization", "indexing", "duplicate-detection"],
  },
  {
    id: "pesquisa-juris",
    name: "Pesquisador de Jurisprudência",
    description:
      "Busca e analisa precedentes e jurisprudências relevantes automaticamente em tribunais superiores",
    type: "researcher",
    status: "idle",
    enabled: true,
    lastActivity: "Aguardando tarefas",
    continuousMode: true,
    capabilities: [
      "jurisprudence-search",
      "precedent-analysis",
      "case-law-research",
      "trend-analysis",
    ],
  },
  {
    id: "pesquisa-juris-qdrant",
    name: "Pesquisador de Jurisprudência (Qdrant)",
    description:
      "Versão especializada com busca vetorial integrada ao Qdrant para pesquisa de precedentes e jurisprudência",
    type: "researcher",
    status: "idle",
    enabled: false,
    lastActivity: "Aguardando ativação",
    continuousMode: false,
    capabilities: [
      "jurisprudence-search",
      "precedent-analysis",
      "vector-search",
      "case-law-research",
    ],
  },
  {
    id: "analise-risco",
    name: "Análise de Risco",
    description:
      "Avalia riscos processuais, financeiros e estratégicos de cada caso com base em dados e precedentes",
    type: "risk-analyzer",
    status: "idle",
    enabled: true,
    lastActivity: "Aguardando tarefas",
    continuousMode: true,
    capabilities: [
      "risk-assessment",
      "probability-analysis",
      "financial-impact",
      "mitigation-strategies",
    ],
  },
  {
    id: "revisao-contratual",
    name: "Revisor Contratual",
    description:
      "Analisa contratos identificando cláusulas problemáticas, riscos e pontos de não conformidade",
    type: "contract-reviewer",
    status: "idle",
    enabled: false,
    lastActivity: "Aguardando tarefas",
    continuousMode: false,
    capabilities: ["contract-analysis", "clause-review", "compliance-check", "risk-identification"],
  },
  {
    id: "comunicacao-clientes",
    name: "Comunicação com Clientes",
    description:
      "Gera comunicações personalizadas e relatórios para clientes em linguagem acessível e respeitosa",
    type: "communicator",
    status: "idle",
    enabled: false,
    lastActivity: "Aguardando tarefas",
    continuousMode: false,
    capabilities: [
      "client-communication",
      "report-generation",
      "language-simplification",
      "personalization",
    ],
  },
  {
    id: "financeiro",
    name: "Análise Financeira",
    description:
      "Monitora faturamento, recebimentos e análises de rentabilidade do escritório com base em dados reais",
    type: "financial-analyzer",
    status: "idle",
    enabled: false,
    lastActivity: "Aguardando tarefas",
    continuousMode: false,
    capabilities: [
      "financial-monitoring",
      "profitability-analysis",
      "receivables-tracking",
      "metrics-calculation",
    ],
  },
  {
    id: "estrategia-processual",
    name: "Estratégia Processual",
    description:
      "Sugere estratégias processuais baseadas em análise de dados, precedentes e probabilidade de sucesso",
    type: "strategy-advisor",
    status: "idle",
    enabled: true,
    lastActivity: "Aguardando tarefas",
    continuousMode: true,
    capabilities: ["strategic-planning", "option-analysis", "cost-benefit", "success-probability"],
  },
  {
    id: "traducao-juridica",
    name: "Tradutor Jurídico",
    description:
      "Traduz termos técnicos jurídicos para linguagem simples e vice-versa, mantendo precisão",
    type: "translator",
    status: "idle",
    enabled: false,
    lastActivity: "Aguardando tarefas",
    continuousMode: false,
    capabilities: [
      "legal-translation",
      "term-explanation",
      "glossary-creation",
      "language-adaptation",
    ],
  },
  {
    id: "compliance",
    name: "Compliance",
    description:
      "Verifica conformidade com LGPD, Código de Ética da OAB, normas trabalhistas e regulatórias",
    type: "compliance-checker",
    status: "idle",
    enabled: false,
    lastActivity: "Aguardando tarefas",
    continuousMode: false,
    capabilities: ["compliance-check", "lgpd-verification", "ethics-review", "regulatory-audit"],
  },
];

/**
 * Inicializa agents com a configuração padrão
 * - agentes essenciais vêm habilitados
 * - se existir estado anterior, faz merge preservando preferências do usuário
 */
export function initializeAgents(existingAgents?: Agent[]): Agent[] {
  const essentialAgents = new Set<AgentId>([
    "harvey",
    "justine",
    "analise-documental",
    "monitor-djen",
    "gestao-prazos",
    "redacao-peticoes",
    "pesquisa-juris",
    "analise-risco",
    "estrategia-processual",
  ]);

  // Sem agentes existentes → usa defaults
  if (!existingAgents || existingAgents.length === 0) {
    return DEFAULT_AGENTS.map((agent) => ({
      ...agent,
      status: "idle" as const,
      enabled: essentialAgents.has(agent.id as AgentId),
      lastActivity: essentialAgents.has(agent.id as AgentId)
        ? "Pronto para análise"
        : "Aguardando ativação",
    }));
  }

  // Merge: preserva settings do usuário, atualiza descrição / capabilities
  return DEFAULT_AGENTS.map((defaultAgent) => {
    const existing = existingAgents.find((a) => a.id === defaultAgent.id);

    if (existing) {
      return {
        ...defaultAgent,
        ...existing,
        // Sempre atualiza descrição/capabilities do "catálogo"
        capabilities: defaultAgent.capabilities,
        description: defaultAgent.description,
      };
    }

    return {
      ...defaultAgent,
      status: "idle" as const,
      enabled: essentialAgents.has(defaultAgent.id as AgentId),
      lastActivity: essentialAgents.has(defaultAgent.id as AgentId)
        ? "Pronto para análise"
        : "Aguardando ativação",
    };
  });
}

// ============================================================================
// TASK PROCESSING (SIMULAÇÃO / LEGADO)
// ============================================================================

/**
 * Processa tarefa usando uma simulação de IA
 * Hoje o fluxo real usa a IA via outro cliente; isto aqui é fallback/ambiente de teste.
 */
export async function processTaskWithAI(task: AgentTask, agent: Agent): Promise<AgentTaskResult> {
  // Simula latência mínima
  await new Promise((resolve) => setTimeout(resolve, 10));

  const taskType = String(task.type).toLowerCase();

  // Monitor (DJEN, DataJud, etc)
  if (taskType.includes("monitor") || agent.type === "monitor") {
    return {
      success: true,
      message: "Monitoramento concluído com sucesso",
      data: {
        publicationsFound: crypto.getRandomValues(new Uint8Array(1))[0] % 10,
        lastChecked: new Date().toISOString(),
        source: "DJEN/DataJud",
      },
      suggestions: ["Verificar publicações encontradas", "Atualizar filtros de busca"],
    };
  }

  // Análise (documentos, contratos, etc)
  if (
    taskType.includes("analy") ||
    taskType.includes("analise") ||
    taskType.includes("análise") ||
    agent.type === "analyzer"
  ) {
    return {
      success: true,
      message: "Análise concluída com sucesso",
      data: {
        confidence: 0.85 + (crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff) * 0.1,
        entities: ["partes", "valores", "datas"],
        summary: "Documento analisado com alta confiança",
      },
      suggestions: ["Revisar entidades extraídas", "Validar classificação"],
    };
  }

  // Prazos
  if (taskType.includes("deadline") || taskType.includes("prazo") || agent.type === "calculator") {
    const businessDays = (task.data.businessDays as number) || 15;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + Math.ceil(businessDays * 1.4));

    return {
      success: true,
      message: "Cálculo de prazo concluído",
      data: {
        deadline: deadline.toISOString(),
        businessDays,
        holidays: [],
        urgency: businessDays <= 5 ? "high" : "normal",
      },
      nextSteps: ["Adicionar ao calendário", "Configurar alertas"],
    };
  }

  // Default genérico
  return {
    success: true,
    message: `Tarefa ${task.type} processada com sucesso`,
    data: {
      processedAt: new Date().toISOString(),
      agentId: agent.id,
    },
  };
}

// ============================================================================
// TASK GENERATOR
// ============================================================================

/**
 * Cria um gerador de tarefas automáticas em intervalo fixo
 * (para modo demo / teste de orquestrador)
 */
export function createTaskGenerator(
  config: AgentTaskGeneratorConfig,
  onTaskGenerated: (task: AgentTask) => void
): AgentTaskGenerator {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let currentConfig: AgentTaskGeneratorConfig = { ...config };
  let taskCallback = onTaskGenerated;
  let tasksGeneratedInInterval = 0;

  const generateTask = (): AgentTask => {
    const agentsPool = currentConfig.agentIds;
    const randomIndex =
      crypto.getRandomValues(new Uint32Array(1))[0] % Math.max(agentsPool.length, 1);
    const agentId = agentsPool[randomIndex] ?? "harvey";

    const taskTypes: TarefaSistemaTipo[] = [
      "MONITOR_DJEN",
      "ANALYZE_DOCUMENT",
      "CALCULATE_DEADLINE",
      "ANALYZE_INTIMATION",
    ];
    const priorities: TaskPriority[] = ["low", "medium", "high"];

    return {
      id: `task-${Date.now()}-${crypto.randomUUID().split("-")[0]}`,
      agentId,
      type: taskTypes[crypto.getRandomValues(new Uint32Array(1))[0] % taskTypes.length],
      priority: priorities[crypto.getRandomValues(new Uint32Array(1))[0] % priorities.length],
      status: "queued",
      createdAt: new Date().toISOString(),
      data: {
        autoGenerated: true,
        generatorConfig: currentConfig,
      },
    };
  };

  const tick = () => {
    if (!currentConfig.enabled) return;

    if (tasksGeneratedInInterval < currentConfig.maxTasksPerInterval) {
      const task = generateTask();
      taskCallback(task);
      tasksGeneratedInInterval++;
    }
  };

  return {
    start() {
      if (intervalId) return;
      tasksGeneratedInInterval = 0;

      // Primeira tarefa entra na hora
      tick();

      const intervalMs = currentConfig.intervalMinutes * 60 * 1000;
      intervalId = setInterval(() => {
        tasksGeneratedInInterval = 0;
        tick();
      }, intervalMs);
    },

    stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },

    updateConfig(newConfig: Partial<AgentTaskGeneratorConfig>) {
      currentConfig = { ...currentConfig, ...newConfig };
    },

    setOnTaskGenerated(callback: (task: AgentTask) => void) {
      taskCallback = callback;
    },
  };
}

// ============================================================================
// HYBRID AGENTS INTEGRATION
// ============================================================================

/**
 * Re-export hybrid agents integration for unified access
 * Allows seamless coordination between traditional and LangGraph agents
 */
export {
  executeHybridTask,
  getHybridStats,
  hasHybridVersion,
  listHybridAgents,
  recordExecution,
  resetHybridStats,
  type HybridExecutionConfig,
  type HybridExecutionResult,
  type HybridStats,
} from "./hybrid-agents-integration";
