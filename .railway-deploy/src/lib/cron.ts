/**
 * API consolidada para tarefas cron
 * Endpoints:
 * - POST /api/cron?action=daily-reset - Reset diário de contadores (midnight UTC)
 * - POST /api/cron?action=djen-monitor - Monitor DJEN publicações (09:00 e 17:00 BRT)
 *
 * Schedule em vercel.json:
 * - daily-reset: "0 0 * * *" (midnight UTC)
 * - djen-monitor: "0 12 * * *" (12:00 UTC = 09:00 BRT) - Manhã
 * - djen-monitor: "0 20 * * *" (20:00 UTC = 17:00 BRT) - Tarde
 *
 * API DJEN: https://comunicaapi.pje.jus.br/api/v1/comunicacao
 * Documentação: v1.0.3 (29/05/2025)
 */

import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// ================= KV UTILS (INLINE) =================

interface AgentTask {
  id: string;
  title?: string;
  agentId?: string;
  type: string;
  status: "pending" | "queued" | "in_progress" | "completed" | "failed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  completedAt?: string;
  result?: string;
  metadata?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

const KV_KEYS = {
  MONITORED_LAWYERS: "monitored-lawyers",
  PUBLICATIONS: "publications",
  AGENTS: "autonomous-agents",
  COMPLETED_TASKS: "completed-agent-tasks",
  LAST_DJEN_CHECK: "last-djen-check",
  NOTIFICATION_QUEUE: "notification-queue",
  NOTIFICATION_DEDUPE_PREFIX: "notification-dedupe",
  AGENT_QUEUE_DEPTH_HISTORY: "agent-queue-depth-history",
  WATCHDOG_LAST_RESULT: "watchdog-last-result",
  // Cache keys para otimização
  DJEN_CACHE: "djen-cache",
  DJEN_CACHE_TTL: "djen-cache-ttl",
  PUBLICATION_HASHES: "publication-hashes",
} as const;

// Cache configuration (prefixed with _ as currently unused but may be needed)
// const _CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
// const _MAX_CACHE_SIZE = 500; // Max cached publications

interface MonitoredLawyer {
  id: string;
  name: string;
  oab: string;
  email?: string;
  enabled: boolean;
  tribunals: string[];
}

// Type alias para evitar repetição de union types (SonarCloud S4323)
type DJENMatchType = "nome" | "oab" | "ambos";

interface StoredPublication {
  id: string;
  djenId?: number;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso?: string;
  orgao?: string;
  meio?: string;
  link?: string;
  hash?: string;
  matchType: DJENMatchType;
  lawyerId: string;
  lawyerName?: string;
  lawyerOAB?: string;
  advogados?: Array<{ nome: string; numero_oab: string; uf_oab: string }>;
  source?: string;
  notified: boolean;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  enabled: boolean;
  tasksCompleted: number;
  tasksToday: number;
  status: "idle" | "active" | "paused" | "processing" | "waiting_human";
  lastActivity?: string;
  continuousMode: boolean;
  currentTask?: unknown;
}

let _kvClient: Redis | null = null;

async function getKv() {
  if (_kvClient) return _kvClient;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    _kvClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL.trim(),
      token: process.env.UPSTASH_REDIS_REST_TOKEN.trim(),
    });
    return _kvClient;
  }
  throw new Error("No KV storage available (Upstash Redis required)");
}

async function getMonitoredLawyers(): Promise<MonitoredLawyer[]> {
  try {
    const kv = await getKv();
    const lawyers = await kv.get(KV_KEYS.MONITORED_LAWYERS);
    return (lawyers as MonitoredLawyer[]) || [];
  } catch (error) {
    console.error("[KV] Error getting monitored lawyers:", error);
    return [];
  }
}

async function storePublication(publication: StoredPublication): Promise<void> {
  try {
    const kv = await getKv();
    const key = `${KV_KEYS.PUBLICATIONS}:${publication.lawyerId}`;
    const existing = ((await kv.get(key)) as StoredPublication[]) || [];

    // Check duplicate using hash for better performance
    const pubHash =
      publication.hash ||
      `${publication.tribunal}-${publication.data}-${publication.numeroProcesso}`;
    const isDuplicate = existing.some((p) => {
      const existingHash = p.hash || `${p.tribunal}-${p.data}-${p.numeroProcesso}`;
      return existingHash === pubHash;
    });

    if (isDuplicate) {
      console.log(`[KV] Skipped duplicate: ${pubHash}`);
    } else {
      existing.unshift(publication);
      // Use pipeline for atomic operations
      await kv.set(key, existing.slice(0, 1000));

      // Update hash index for fast duplicate checking
      const hashKey = `${KV_KEYS.PUBLICATION_HASHES}:${publication.lawyerId}`;
      const hashes = ((await kv.get(hashKey)) as string[]) || [];
      hashes.unshift(pubHash);
      await kv.set(hashKey, hashes.slice(0, 2000));

      console.log(`[KV] Stored publication: ${pubHash}`);
    }
  } catch (error) {
    console.error("[KV] Error storing publication:", error);
    throw error;
  }
}

// Check if publication already exists (fast hash lookup)
async function publicationExists(lawyerId: string, hash: string): Promise<boolean> {
  try {
    const kv = await getKv();
    const hashKey = `${KV_KEYS.PUBLICATION_HASHES}:${lawyerId}`;
    const hashes = ((await kv.get(hashKey)) as string[]) || [];
    return hashes.includes(hash);
  } catch {
    return false;
  }
}

async function updateLastDJENCheck(): Promise<void> {
  try {
    const kv = await getKv();
    await kv.set(KV_KEYS.LAST_DJEN_CHECK, new Date().toISOString());
  } catch (error) {
    console.error("[KV] Error updating last DJEN check:", error);
  }
}

async function getAgents(): Promise<Agent[]> {
  try {
    const kv = await getKv();
    const agents = await kv.get(KV_KEYS.AGENTS);
    return (agents as Agent[]) || [];
  } catch (error) {
    console.error("[KV] Error getting agents:", error);
    return [];
  }
}

async function updateAgents(agents: Agent[]): Promise<void> {
  try {
    const kv = await getKv();
    await kv.set(KV_KEYS.AGENTS, agents);
  } catch (error) {
    console.error("[KV] Error updating agents:", error);
    throw error;
  }
}

async function getCompletedTasks(): Promise<unknown[]> {
  try {
    const kv = await getKv();
    const tasks = await kv.get(KV_KEYS.COMPLETED_TASKS);
    return (tasks as unknown[]) || [];
  } catch (error) {
    console.error("[KV] Error getting completed tasks:", error);
    return [];
  }
}

async function updateCompletedTasks(tasks: unknown[]): Promise<void> {
  try {
    const kv = await getKv();
    await kv.set(KV_KEYS.COMPLETED_TASKS, tasks);
  } catch (error) {
    console.error("[KV] Error updating completed tasks:", error);
    throw error;
  }
}

async function queueNotification(notification: {
  type: "publication" | "agent" | "system";
  title: string;
  message: string;
  data?: unknown;
  recipientEmail?: string;
}): Promise<void> {
  try {
    const kv = await getKv();
    const queue =
      ((await kv.get(KV_KEYS.NOTIFICATION_QUEUE)) as Array<{
        id: string;
        type: string;
        title: string;
        message: string;
        data?: unknown;
        recipientEmail?: string;
        createdAt: string;
        sent: boolean;
      }>) || [];
    queue.push({
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      sent: false,
    });
    await kv.set(KV_KEYS.NOTIFICATION_QUEUE, queue);
  } catch (error) {
    console.error("[KV] Error queuing notification:", error);
  }
}

// Send real-time notification via webhooks
async function sendRealTimeNotification(notification: {
  type: string;
  title: string;
  message: string;
  priority?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    await fetch(`${baseUrl}/api/notifications/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...notification,
        priority: notification.priority || "normal",
      }),
    });
  } catch (error) {
    console.error("[Notification] Failed to send real-time notification:", error);
  }
}

async function addTaskToQueue(task: AgentTask): Promise<void> {
  try {
    const kv = await getKv();
    const queue = ((await kv.get("agent-task-queue")) as AgentTask[]) || [];
    queue.push(task);
    await kv.set("agent-task-queue", queue);
  } catch (error) {
    console.error("[KV] Error adding task to queue:", error);
  }
}

// ================= DJEN CLIENT (INLINE) =================
// Conforme documentação oficial DJEN API v1.0.3 (29/05/2025)

/**
 * Interface de Comunicação retornada pela API DJEN
 * Endpoint: GET /api/v1/comunicacao
 */
interface DJENComunicacao {
  id: number;
  datadisponibilizacao: string; // Campo oficial: datadisponibilizacao
  data_disponibilizacao?: string; // Alias para compatibilidade
  siglaTribunal: string;
  tipoComunicacao: string;
  nomeOrgao: string;
  texto: string;
  numero_processo: string;
  numeroprocessocommascara?: string; // Campo oficial com máscara CNJ
  meio: string;
  meiocompleto: string;
  link: string;
  hash: string;
  // Destinatários conforme doc oficial
  destinatarios?: Array<{
    nome: string;
    polo: string;
    comunicacao_id: number;
  }>;
  destinatarioadvogados: Array<{
    id: number;
    comunicacao_id: number;
    advogado_id: number;
    created_at?: string;
    updated_at?: string;
    advogado: {
      id: number;
      nome: string;
      numero_oab: string;
      uf_oab: string;
    };
  }>;
}

/**
 * Resposta da API DJEN
 * A API pode retornar array direto ou objeto com items
 */
interface DJENResponse {
  status?: string;
  message?: string;
  count?: number;
  items?: DJENComunicacao[];
  // API pode retornar array direto em alguns casos
  [index: number]: DJENComunicacao;
  length?: number;
}

/** Tipo de match de advogado: nome, OAB ou ambos */
type AdvogadoMatchType = "nome" | "oab" | "ambos";

/** Informações de advogado extraídas de publicações */
interface AdvogadoInfo {
  nome: string;
  numero_oab: string;
  uf_oab: string;
}

// Tipo reservado para futuras implementações de filtros
type _DJENFilterCriteria = "nome" | "oab" | "processo" | "ambos";

interface DJENFilteredResult {
  id: number;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso: string;
  orgao: string;
  meio: string;
  link: string;
  hash: string;
  matchType: AdvogadoMatchType;
  advogados: AdvogadoInfo[];
}

/** Meio de publicação: E = Eletrônico, D = Digital */
type MeioPublicacao = "E" | "D";

interface DJENQueryParams {
  numeroOab?: string;
  ufOab?: string;
  nomeAdvogado?: string;
  siglaTribunal?: string;
  dataDisponibilizacaoInicio?: string;
  dataDisponibilizacaoFim?: string;
  pagina?: number;
  itensPorPagina?: number;
  meio?: MeioPublicacao;
}

const DJEN_TIMEOUT = 30000;
const DJEN_DELAY = 2000; // Delay entre tribunais para evitar rate limit
const DJEN_RATE_LIMIT_WAIT = 60000; // 1 minuto conforme documentação DJEN para erro 429

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .trim();
}

function parseOAB(numeroOAB: string): { numero?: string; uf?: string } {
  if (!numeroOAB) return {};
  const value = numeroOAB.trim();
  const matchOABPattern = /OAB\s?\/\s?([A-Z]{2})\s+(\d+)/i.exec(value);
  if (matchOABPattern) return { numero: matchOABPattern[2], uf: matchOABPattern[1].toUpperCase() };
  const matchNumericUF = /(\d+)\s?\/\s?([A-Z]{2})/i.exec(value);
  if (matchNumericUF) return { numero: matchNumericUF[1], uf: matchNumericUF[2].toUpperCase() };
  const matchNumeric = /^(\d+)$/.exec(value);
  if (matchNumeric) return { numero: matchNumeric[1] };
  // Handle MG184404 format
  const matchUFNum = /^([A-Z]{2})(\d+)$/i.exec(value);
  if (matchUFNum) return { uf: matchUFNum[1].toUpperCase(), numero: matchUFNum[2] };
  return {};
}

function buildDJENQueryString(params: DJENQueryParams): string {
  const queryParams: string[] = [];
  if (params.numeroOab) queryParams.push(`numeroOab=${encodeURIComponent(params.numeroOab)}`);
  if (params.ufOab) queryParams.push(`ufOab=${encodeURIComponent(params.ufOab)}`);
  if (params.nomeAdvogado)
    queryParams.push(`nomeAdvogado=${encodeURIComponent(params.nomeAdvogado)}`);
  if (params.dataDisponibilizacaoInicio)
    queryParams.push(`dataDisponibilizacaoInicio=${params.dataDisponibilizacaoInicio}`);
  if (params.dataDisponibilizacaoFim)
    queryParams.push(`dataDisponibilizacaoFim=${params.dataDisponibilizacaoFim}`);
  if (params.siglaTribunal)
    queryParams.push(`siglaTribunal=${encodeURIComponent(params.siglaTribunal)}`);
  if (params.pagina) queryParams.push(`pagina=${params.pagina}`);
  if (params.itensPorPagina) queryParams.push(`itensPorPagina=${params.itensPorPagina}`);
  if (params.meio) queryParams.push(`meio=${params.meio}`);
  return queryParams.join("&");
}

async function consultarComunicacoes(
  params: DJENQueryParams,
  retryOnRateLimit = true
): Promise<{
  response: DJENResponse | null;
  rateLimitInfo: { limit?: number; remaining?: number };
  rateLimitHit?: boolean;
}> {
  const queryString = buildDJENQueryString(params);
  const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryString}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DJEN_TIMEOUT);

  try {
    console.log(`[DJEN] Consultando: ${url}`);
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Captura headers de rate limit conforme documentação DJEN
    const rateLimitInfo = {
      limit: response.headers.get("x-ratelimit-limit")
        ? Number.parseInt(response.headers.get("x-ratelimit-limit")!, 10)
        : undefined,
      remaining: response.headers.get("x-ratelimit-remaining")
        ? Number.parseInt(response.headers.get("x-ratelimit-remaining")!, 10)
        : undefined,
    };

    console.log(
      `[DJEN] Rate Limit - Limit: ${rateLimitInfo.limit}, Remaining: ${rateLimitInfo.remaining}`
    );

    // Erro 429 - Conforme doc: aguardar 1 minuto para retomar
    if (response.status === 429) {
      console.warn(`[DJEN] Rate limit atingido (429). Conforme documentação, aguardar 1 minuto.`);
      if (retryOnRateLimit) {
        console.log(`[DJEN] Aguardando ${DJEN_RATE_LIMIT_WAIT / 1000}s antes de retry...`);
        await new Promise((resolve) => setTimeout(resolve, DJEN_RATE_LIMIT_WAIT));
        return consultarComunicacoes(params, false); // Tenta novamente sem retry
      }
      return { response: null, rateLimitInfo, rateLimitHit: true };
    }

    // Erro 422 - Erro negocial (parâmetros inválidos)
    if (response.status === 422) {
      const errorBody = await response.text();
      console.error(`[DJEN] Erro negocial (422): ${errorBody}`);
      throw new Error(`Erro negocial DJEN: ${errorBody}`);
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = (await response.json()) as DJENResponse;
    console.log(`[DJEN] Consulta retornou ${data.count || data.items?.length || 0} comunicações`);
    return { response: data, rateLimitInfo };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[DJEN] Error:`, error);
    return { response: null, rateLimitInfo: {}, rateLimitHit: false };
  }
}

function formatDJENDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

// ===== Helper functions for consultarDJENForLawyer (reduced CC) =====

interface OABParsed {
  numero?: string;
  uf?: string;
}

interface LawyerQueryContext {
  nomeAdvogado?: string;
  numeroOabNumerico?: string;
  ufOab?: string;
  queryDataInicio: string;
  queryDataFim: string;
  meio?: "D" | "E";
}

function parseOABInfo(numeroOAB?: string): OABParsed {
  if (!numeroOAB) return {};
  const parsed = parseOAB(numeroOAB);
  return { numero: parsed.numero, uf: parsed.uf };
}

function buildDJENQueryParams(tribunal: string, ctx: LawyerQueryContext): DJENQueryParams {
  const params: DJENQueryParams = {
    siglaTribunal: tribunal,
    dataDisponibilizacaoInicio: ctx.queryDataInicio,
    dataDisponibilizacaoFim: ctx.queryDataFim,
    itensPorPagina: 100,
    pagina: 1,
  };
  if (ctx.nomeAdvogado) params.nomeAdvogado = ctx.nomeAdvogado;
  if (ctx.numeroOabNumerico) params.numeroOab = ctx.numeroOabNumerico;
  if (ctx.ufOab) params.ufOab = ctx.ufOab;
  if (ctx.meio) params.meio = ctx.meio;
  return params;
}

function determineAdvogadoMatchType(
  dest: { advogado: { nome: string; numero_oab: string; uf_oab: string } },
  nomeAdvogado?: string,
  numeroOabNumerico?: string,
  ufOab?: string
): "nome" | "oab" | "ambos" | null {
  const matchNome = nomeAdvogado
    ? normalizeText(dest.advogado.nome).includes(normalizeText(nomeAdvogado))
    : false;
  const matchOab = numeroOabNumerico
    ? dest.advogado.numero_oab === numeroOabNumerico && dest.advogado.uf_oab === ufOab
    : false;

  if (matchNome && matchOab) return "ambos";
  if (matchOab) return "oab";
  if (matchNome) return "nome";
  return null;
}

type AdvogadoMatchResult = "nome" | "oab" | "ambos";

function findAdvogadoMatch(
  comunicacao: DJENComunicacao,
  nomeAdvogado?: string,
  numeroOabNumerico?: string,
  ufOab?: string
): { found: boolean; matchType: AdvogadoMatchResult } {
  let matchType: AdvogadoMatchResult = "nome";
  const found =
    comunicacao.destinatarioadvogados?.some((dest) => {
      const type = determineAdvogadoMatchType(dest, nomeAdvogado, numeroOabNumerico, ufOab);
      if (type) {
        matchType = type;
        return true;
      }
      return false;
    }) || false;
  return { found, matchType };
}

function mapComunicacaoToResult(
  comunicacao: DJENComunicacao,
  matchType: "nome" | "oab" | "ambos"
): DJENFilteredResult {
  const dataDisp = comunicacao.datadisponibilizacao || comunicacao.data_disponibilizacao || "";
  return {
    id: comunicacao.id,
    tribunal: comunicacao.siglaTribunal,
    data: dataDisp,
    tipo: comunicacao.tipoComunicacao,
    teor: comunicacao.texto,
    numeroProcesso: comunicacao.numeroprocessocommascara || comunicacao.numero_processo,
    orgao: comunicacao.nomeOrgao,
    meio: comunicacao.meiocompleto || comunicacao.meio,
    link: comunicacao.link,
    hash: comunicacao.hash,
    matchType,
    advogados:
      comunicacao.destinatarioadvogados?.map((dest) => ({
        nome: dest.advogado.nome,
        numero_oab: dest.advogado.numero_oab,
        uf_oab: dest.advogado.uf_oab,
      })) || [],
  };
}

async function processTribunalQuery(
  tribunal: string,
  ctx: LawyerQueryContext,
  resultados: DJENFilteredResult[],
  erros: Array<{ tribunal: string; erro: string }>
): Promise<boolean> {
  console.log(`[DJEN] Consultando ${tribunal} para ${ctx.nomeAdvogado || ctx.numeroOabNumerico}`);
  const queryParams = buildDJENQueryParams(tribunal, ctx);
  const { response, rateLimitInfo, rateLimitHit } = await consultarComunicacoes(queryParams);

  if (rateLimitInfo.remaining !== undefined && rateLimitInfo.remaining < 10) {
    console.warn(
      `[DJEN] Atenção: apenas ${rateLimitInfo.remaining} requisições restantes na janela`
    );
  }

  if (!response) {
    const errorMsg = rateLimitHit
      ? "Rate limit atingido (429) - aguarde 1 minuto"
      : "Erro na consulta";
    erros.push({ tribunal, erro: errorMsg });
    return rateLimitHit || false;
  }

  const comunicacoes: DJENComunicacao[] = Array.isArray(response) ? response : response.items || [];

  console.log(`[DJEN] Processando ${comunicacoes.length} comunicações do ${tribunal}`);

  for (const comunicacao of comunicacoes) {
    const { found, matchType } = findAdvogadoMatch(
      comunicacao,
      ctx.nomeAdvogado,
      ctx.numeroOabNumerico,
      ctx.ufOab
    );
    if (found) {
      resultados.push(mapComunicacaoToResult(comunicacao, matchType));
    }
  }

  return false;
}

// ===== Main refactored function =====

async function consultarDJENForLawyer(
  tribunais: string[],
  nomeAdvogado?: string,
  numeroOAB?: string,
  dataInicio?: string,
  dataFim?: string,
  meio?: "D" | "E"
): Promise<{
  resultados: DJENFilteredResult[];
  erros: Array<{ tribunal: string; erro: string }>;
  rateLimitWarning?: boolean;
}> {
  if (!nomeAdvogado && !numeroOAB) {
    throw new Error("É necessário fornecer pelo menos nomeAdvogado ou numeroOAB");
  }

  const defaultDate = formatDJENDate(new Date());
  const oabInfo = parseOABInfo(numeroOAB);

  const ctx: LawyerQueryContext = {
    nomeAdvogado,
    numeroOabNumerico: oabInfo.numero,
    ufOab: oabInfo.uf,
    queryDataInicio: dataInicio || defaultDate,
    queryDataFim: dataFim || dataInicio || defaultDate,
    meio,
  };

  const resultados: DJENFilteredResult[] = [];
  const erros: Array<{ tribunal: string; erro: string }> = [];
  let rateLimitWarning = false;

  for (let i = 0; i < tribunais.length; i++) {
    const tribunal = tribunais[i];
    try {
      const hitRateLimit = await processTribunalQuery(tribunal, ctx, resultados, erros);
      rateLimitWarning = rateLimitWarning || hitRateLimit;

      if (i < tribunais.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, DJEN_DELAY));
      }
    } catch (error) {
      erros.push({
        tribunal,
        erro: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  console.log(`[DJEN] Consulta finalizada: ${resultados.length} comunicações encontradas`);
  return { resultados, erros, rateLimitWarning: rateLimitWarning || undefined };
}

// ================= CRON HANDLERS =================

/**
 * Interface base para todos os resultados de ações cron
 * Inclui index signature para compatibilidade com ActionResult
 */
interface BaseCronResult {
  success: boolean;
  timestamp: string;
  errors: string[];
  [key: string]: unknown;
}

interface DailyResetResult extends BaseCronResult {
  agentsReset: number;
  tasksArchived: number;
}

interface DJENMonitorResult extends BaseCronResult {
  publicationsFound: number;
  lawyersChecked: number;
  tribunaisChecked: string[];
  rateLimitWarning: boolean;
}

interface AgentQueueResult extends BaseCronResult {
  tasksProcessed: number;
  tasksFailed: number;
}

interface NotificationResult extends BaseCronResult {
  emailsSent: number;
  webhooksSent: number;
}

interface CalendarSyncResult extends BaseCronResult {
  eventsCreated: number;
  eventsUpdated: number;
  deadlinesSynced: number;
}

interface BackupResult extends BaseCronResult {
  keysBackedUp: number;
  totalSize: string;
}

interface DataJudResult extends BaseCronResult {
  processesChecked: number;
  updatesFound: number;
}

interface DeadlineAlertResult extends BaseCronResult {
  alertsSent: number;
  urgentDeadlines: number;
  upcomingDeadlines: number;
}

interface WatchdogResult extends BaseCronResult {
  agentsReset: number;
  tasksTimedOut: number;
}

interface CompletedTask {
  completedAt?: string | null;
  [key: string]: unknown;
}

// Process types for various handlers
interface ProcessDeadline {
  id: string;
  descricao: string;
  dataFinal: string;
  urgente?: boolean;
  syncedToCalendar?: boolean;
  calendarEventId?: string;
  alertSent?: boolean;
}

interface ProcessWithDeadlines {
  id: string;
  numeroCNJ: string;
  titulo: string;
  prazos?: ProcessDeadline[];
}

interface ProcessWithAlertDeadlines {
  id: string;
  numeroCNJ: string;
  titulo: string;
  prazos?: ProcessDeadline[];
}

interface CalendarSettings {
  enabled?: boolean;
  accessToken?: string;
  refreshToken?: string;
  calendarId?: string;
}

interface ProcessMovement {
  data: string;
  descricao: string;
}

interface ProcessWithMovements {
  id: string;
  numeroCNJ: string;
  titulo: string;
  status: string;
  ultimaAtualizacao?: string;
  movimentos?: ProcessMovement[];
}

interface DataJudMovimento {
  dataHora: string;
  nome: string;
  complemento?: string;
}

interface DataJudHit {
  _source?: {
    movimentos?: DataJudMovimento[];
  };
}

interface DataJudResponse {
  hits?: {
    hits?: DataJudHit[];
  };
}

interface DeadlineInfo {
  processo: string;
  prazo: string;
  dataFinal: string;
  diasRestantes: number;
}

// ================= ACTION HANDLERS =================

/**
 * Handle daily-reset action
 * Resets agent counters and archives old tasks
 */
async function handleDailyReset(timestamp: string): Promise<DailyResetResult> {
  console.log(`[Cron Daily Reset] Starting execution at ${timestamp}`);

  const result: DailyResetResult = {
    success: true,
    timestamp,
    agentsReset: 0,
    tasksArchived: 0,
    errors: [],
  };

  // Reset agent counters
  const agents = await getAgents();
  console.log(`[Cron Daily Reset] Found ${agents.length} agents`);

  if (agents.length > 0) {
    const updatedAgents = agents.map((agent) => ({
      ...agent,
      tasksToday: 0,
    }));

    await updateAgents(updatedAgents);
    result.agentsReset = agents.length;
    console.log(`[Cron Daily Reset] Reset counters for ${agents.length} agents`);
  }

  // Archive old completed tasks (>30 days)
  const completedTasks = (await getCompletedTasks()) as CompletedTask[];
  console.log(`[Cron Daily Reset] Found ${completedTasks.length} completed tasks`);

  if (completedTasks.length > 0) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const tasksToKeep = completedTasks.filter((task) => {
      if (!task.completedAt) return true;
      return new Date(task.completedAt) >= cutoffDate;
    });

    result.tasksArchived = completedTasks.length - tasksToKeep.length;

    if (result.tasksArchived > 0) {
      await updateCompletedTasks(tasksToKeep);
      console.log(`[Cron Daily Reset] Archived ${result.tasksArchived} old tasks`);
    }
  }

  console.log(`[Cron Daily Reset] Completed successfully`);
  return result;
}

/**
 * Handle process-agent-queue action
 * Processes pending tasks from the agent queue
 */
async function handleProcessAgentQueue(timestamp: string): Promise<AgentQueueResult> {
  console.log(`[Cron Agent Queue] Starting execution at ${timestamp}`);

  const result: AgentQueueResult = {
    success: true,
    timestamp,
    tasksProcessed: 0,
    tasksFailed: 0,
    errors: [],
  };

  try {
    const kv = await getKv();
    const taskQueue = ((await kv.get("agent-task-queue")) as AgentTask[]) || [];
    const pendingTasks = taskQueue.filter((t) => t.status === "pending" || t.status === "queued");

    console.log(`[Cron Agent Queue] Found ${pendingTasks.length} pending tasks`);

    if (pendingTasks.length === 0) {
      return result;
    }

    // Process up to 10 tasks per execution
    const tasksToProcess = pendingTasks.slice(0, 10);
    const agents = await getAgents();

    for (const task of tasksToProcess) {
      await processAgentTask(task, taskQueue, agents, result);
    }

    // Save updated queue
    await kv.set("agent-task-queue", taskQueue);

    // Move completed tasks to completed list
    await moveCompletedTasks(kv, taskQueue);

    console.log(
      `[Cron Agent Queue] Completed: ${result.tasksProcessed} processed, ${result.tasksFailed} failed`
    );
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}

/**
 * Process a single agent task
 */
async function processAgentTask(
  task: AgentTask,
  taskQueue: AgentTask[],
  agents: Agent[],
  result: AgentQueueResult
): Promise<void> {
  try {
    const agent = agents.find((a) => a.id === task.agentId);

    if (!agent?.enabled) {
      console.log(`[Cron Agent Queue] Skipping task ${task.id} - agent not found or disabled`);
      return;
    }

    // Update task status
    task.status = "in_progress";
    const taskIndex = taskQueue.findIndex((t) => t.id === task.id);
    if (taskIndex >= 0) {
      taskQueue[taskIndex] = task;
    }

    // Call agent processing endpoint
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const agentResponse = await fetch(`${baseUrl}/api/agents?action=process-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, agent }),
    });

    if (agentResponse.ok) {
      task.status = "completed";
      task.completedAt = new Date().toISOString();
      result.tasksProcessed++;
      console.log(`[Cron Agent Queue] Task ${task.id} completed`);
    } else {
      task.status = "failed";
      result.tasksFailed++;
      result.errors.push(`Task ${task.id} failed`);
    }

    // Update task in queue
    if (taskIndex >= 0) {
      taskQueue[taskIndex] = task;
    }
  } catch (taskError) {
    task.status = "failed";
    result.tasksFailed++;
    result.errors.push(
      `Task ${task.id}: ${taskError instanceof Error ? taskError.message : "Unknown error"}`
    );
  }
}

/**
 * Move completed tasks to history
 */
async function moveCompletedTasks(kv: Redis, taskQueue: AgentTask[]): Promise<void> {
  const completedTasksInQueue = taskQueue.filter((t) => t.status === "completed");
  if (completedTasksInQueue.length > 0) {
    const existingCompleted = ((await kv.get(KV_KEYS.COMPLETED_TASKS)) as AgentTask[]) || [];
    existingCompleted.unshift(...completedTasksInQueue);
    await kv.set(KV_KEYS.COMPLETED_TASKS, existingCompleted.slice(0, 1000));

    // Remove completed from queue
    const remainingQueue = taskQueue.filter((t) => t.status !== "completed");
    await kv.set("agent-task-queue", remainingQueue);
  }
}

/**
 * Handle process-notifications action
 * Sends pending notifications via webhooks and email
 */
async function handleProcessNotifications(timestamp: string): Promise<NotificationResult> {
  console.log(`[Cron Notifications] Starting execution at ${timestamp}`);

  const result: NotificationResult = {
    success: true,
    timestamp,
    emailsSent: 0,
    webhooksSent: 0,
    errors: [],
  };

  try {
    const kv = await getKv();
    const notificationQueue =
      ((await kv.get(KV_KEYS.NOTIFICATION_QUEUE)) as Array<{
        id: string;
        type: string;
        title: string;
        message: string;
        data?: unknown;
        recipientEmail?: string;
        createdAt: string;
        sent: boolean;
      }>) || [];

    const pendingNotifications = notificationQueue.filter((n) => !n.sent);
    console.log(`[Cron Notifications] Found ${pendingNotifications.length} pending notifications`);

    if (pendingNotifications.length === 0) {
      return result;
    }

    // Process up to 20 notifications per execution
    const toProcess = pendingNotifications.slice(0, 20);

    for (const notification of toProcess) {
      await processNotification(notification, notificationQueue, result);
    }

    // Save updated queue (keep last 500)
    await kv.set(KV_KEYS.NOTIFICATION_QUEUE, notificationQueue.slice(0, 500));

    console.log(
      `[Cron Notifications] Completed: ${result.emailsSent} emails, ${result.webhooksSent} webhooks`
    );
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}

/**
 * Process a single notification
 */
async function processNotification(
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: unknown;
    recipientEmail?: string;
    createdAt: string;
    sent: boolean;
  },
  notificationQueue: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    data?: unknown;
    recipientEmail?: string;
    createdAt: string;
    sent: boolean;
  }>,
  result: NotificationResult
): Promise<void> {
  try {
    // Send via webhook if configured
    const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      await sendRealTimeNotification({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: "normal",
      });
      result.webhooksSent++;
    }

    // Send email if Resend is configured
    await sendEmailNotification(notification, result);

    // Mark as sent
    notification.sent = true;
    const idx = notificationQueue.findIndex((n) => n.id === notification.id);
    if (idx >= 0) {
      notificationQueue[idx] = notification;
    }
  } catch (notifError) {
    result.errors.push(
      `Notification ${notification.id}: ${
        notifError instanceof Error ? notifError.message : "Unknown error"
      }`
    );
  }
}

/**
 * Send email notification via Resend
 */
async function sendEmailNotification(
  notification: { title: string; message: string; recipientEmail?: string },
  result: NotificationResult
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const recipientEmail = notification.recipientEmail || process.env.NOTIFICATION_EMAIL;

  if (!resendApiKey || !recipientEmail) {
    return;
  }

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Assistente Jurídico <noreply@resend.dev>",
      to: recipientEmail,
      subject: notification.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${notification.title}</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">${notification.message.replaceAll(
            "\n",
            "<br>"
          )}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">
            Enviado automaticamente pelo Assistente Jurídico PJe<br>
            ${new Date().toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })}
          </p>
        </div>
      `,
    }),
  });

  if (emailResponse.ok) {
    result.emailsSent++;
  }
}

/**
 * Handle calendar-sync action
 * Synchronizes deadlines with Google Calendar
 */
async function handleCalendarSync(timestamp: string): Promise<CalendarSyncResult> {
  console.log(`[Cron Calendar Sync] Starting execution at ${timestamp}`);

  const result: CalendarSyncResult = {
    success: true,
    timestamp,
    eventsCreated: 0,
    eventsUpdated: 0,
    deadlinesSynced: 0,
    errors: [],
  };

  try {
    const kv = await getKv();

    // Get all processes with deadlines
    const processes = (await kv.get<ProcessWithDeadlines[]>("processes")) || [];

    console.log(`[Cron Calendar Sync] Found ${processes.length} processes`);

    // Get calendar sync settings
    const calendarSettings = await kv.get<CalendarSettings>("calendar-settings");

    if (!calendarSettings?.enabled || !calendarSettings?.accessToken) {
      console.log(`[Cron Calendar Sync] Calendar sync not configured or disabled`);
      return result;
    }

    // Process deadlines not yet synced
    for (const processo of processes) {
      if (!processo.prazos) continue;

      for (const prazo of processo.prazos) {
        if (prazo.syncedToCalendar) continue;
        await syncDeadlineToCalendar(prazo, processo, calendarSettings, result);
      }
    }

    // Save updated processes
    if (result.eventsCreated > 0) {
      await kv.set("processes", processes);
    }

    // Update last sync time
    await kv.set("calendar-last-sync", timestamp);

    console.log(`[Cron Calendar Sync] Completed: ${result.eventsCreated} events created`);
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}

/**
 * Sync a single deadline to Google Calendar
 */
async function syncDeadlineToCalendar(
  prazo: ProcessDeadline,
  processo: ProcessWithDeadlines,
  calendarSettings: CalendarSettings,
  result: CalendarSyncResult
): Promise<void> {
  try {
    // Create calendar event via Google Calendar API
    const eventResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${
        calendarSettings.calendarId || "primary"
      }/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${calendarSettings.accessToken}`,
        },
        body: JSON.stringify({
          summary: `⚖️ PRAZO: ${prazo.descricao}`,
          description: `Processo: ${processo.numeroCNJ}\n${processo.titulo}\n\nPrazo cadastrado automaticamente pelo Assistente Jurídico.`,
          start: {
            date: prazo.dataFinal.split("T")[0],
            timeZone: "America/Sao_Paulo",
          },
          end: {
            date: prazo.dataFinal.split("T")[0],
            timeZone: "America/Sao_Paulo",
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 1440 }, // 1 day before
              { method: "popup", minutes: 60 }, // 1 hour before
              { method: "popup", minutes: 2880 }, // 2 days before
            ],
          },
          colorId: prazo.urgente ? "11" : "9", // Red for urgent, Blue for normal
        }),
      }
    );

    if (eventResponse.ok) {
      const eventData = (await eventResponse.json()) as { id: string };
      prazo.syncedToCalendar = true;
      prazo.calendarEventId = eventData.id;
      result.eventsCreated++;
      result.deadlinesSynced++;
    } else {
      const errorText = await eventResponse.text();
      result.errors.push(`Failed to create event for prazo ${prazo.id}: ${errorText}`);
    }
  } catch (calError) {
    result.errors.push(
      `Calendar error for prazo ${prazo.id}: ${
        calError instanceof Error ? calError.message : "Unknown"
      }`
    );
  }
}

/**
 * Backup a single KV key
 */
async function backupSingleKey(
  kv: Redis,
  key: string,
  backupData: Record<string, unknown>,
  result: BackupResult
): Promise<number> {
  try {
    const data = await kv.get(key);
    if (data) {
      backupData[key] = data;
      result.keysBackedUp++;
      return JSON.stringify(data).length;
    }
  } catch (keyError) {
    result.errors.push(
      `Failed to backup ${key}: ${keyError instanceof Error ? keyError.message : "Unknown"}`
    );
  }
  return 0;
}

/**
 * Backup lawyer-specific publications
 */
async function backupLawyerPublications(
  kv: Redis,
  backupData: Record<string, unknown>,
  result: BackupResult
): Promise<number> {
  let totalBytes = 0;
  const lawyers = ((await kv.get(KV_KEYS.MONITORED_LAWYERS)) as MonitoredLawyer[]) || [];

  for (const lawyer of lawyers) {
    const pubKey = `${KV_KEYS.PUBLICATIONS}:${lawyer.id}`;
    try {
      const pubs = await kv.get(pubKey);
      if (pubs) {
        backupData[pubKey] = pubs;
        result.keysBackedUp++;
        totalBytes += JSON.stringify(pubs).length;
      }
    } catch {
      // Ignore errors for individual lawyer publications
    }
  }

  return totalBytes;
}

/**
 * Format bytes to human readable size
 */
function formatBytes(bytes: number): string {
  if (bytes > 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(2)} KB`;
}

/**
 * Handle backup action
 * Creates daily backup of KV data
 */
async function handleBackup(timestamp: string): Promise<BackupResult> {
  console.log(`[Cron Backup] Starting execution at ${timestamp}`);

  const result: BackupResult = {
    success: true,
    timestamp,
    keysBackedUp: 0,
    totalSize: "0 KB",
    errors: [],
  };

  try {
    const kv = await getKv();
    const backupData: Record<string, unknown> = {};
    let totalBytes = 0;

    // Keys to backup
    const keysToBackup = [
      "processes",
      "publications",
      "autonomous-agents",
      "agent-task-queue",
      "completed-agent-tasks",
      "monitored-lawyers",
      "notification-queue",
      "calendar-settings",
      "user-settings",
    ];

    // Backup main keys
    for (const key of keysToBackup) {
      totalBytes += await backupSingleKey(kv, key, backupData, result);
    }

    // Backup lawyer publications
    totalBytes += await backupLawyerPublications(kv, backupData, result);

    // Calculate and store
    result.totalSize = formatBytes(totalBytes);
    const backupKey = `backup:${new Date().toISOString().split("T")[0]}`;

    await kv.set(backupKey, {
      timestamp,
      data: backupData,
      keysCount: result.keysBackedUp,
      sizeBytes: totalBytes,
    });

    await cleanOldBackups(kv, backupKey);
    console.log(`[Cron Backup] Completed: ${result.keysBackedUp} keys, ${result.totalSize}`);
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}

/**
 * Clean old backups, keeping only last 7
 */
async function cleanOldBackups(kv: Redis, currentBackupKey: string): Promise<void> {
  const backupList = ((await kv.get("backup-list")) as string[]) || [];
  backupList.unshift(currentBackupKey);
  const keysToKeep = backupList.slice(0, 7);
  const keysToDelete = backupList.slice(7);

  for (const oldKey of keysToDelete) {
    try {
      await kv.del(oldKey);
    } catch {
      // Ignore delete errors
    }
  }

  await kv.set("backup-list", keysToKeep);
}

/**
 * Handle datajud-monitor action
 * Monitors processes for new movements in DataJud
 */
async function handleDataJudMonitor(timestamp: string): Promise<DataJudResult> {
  console.log(`[Cron DataJud Monitor] Starting execution at ${timestamp}`);

  const result: DataJudResult = {
    success: true,
    timestamp,
    processesChecked: 0,
    updatesFound: 0,
    errors: [],
  };

  try {
    const kv = await getKv();

    // Get all active processes
    const processes = ((await kv.get("processes")) as ProcessWithMovements[]) || [];

    const activeProcesses = processes.filter(
      (p) => p.status === "ativo" || p.status === "em_andamento"
    );
    console.log(`[Cron DataJud Monitor] Found ${activeProcesses.length} active processes`);

    // DataJud API key (optional - public API has rate limits)
    const datajudApiKey = process.env.DATAJUD_API_KEY;

    for (const processo of activeProcesses.slice(0, 20)) {
      // Limit to 20 per execution
      await checkProcessInDataJud(processo, datajudApiKey, result);
      // Rate limit - wait 500ms between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Save updated processes
    if (result.updatesFound > 0) {
      await kv.set("processes", processes);
    }

    // Update last check
    await kv.set("datajud-last-check", timestamp);

    console.log(
      `[Cron DataJud Monitor] Completed: ${result.processesChecked} checked, ${result.updatesFound} updates`
    );
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}

/**
 * Check a single process in DataJud for updates
 */
async function checkProcessInDataJud(
  processo: ProcessWithMovements,
  datajudApiKey: string | undefined,
  result: DataJudResult
): Promise<void> {
  try {
    result.processesChecked++;

    // Query DataJud API
    const datajudUrl = `https://api-publica.datajud.cnj.jus.br/api_publica_tjmg/_search`;
    const query = {
      query: {
        match: {
          numeroProcesso: processo.numeroCNJ.replaceAll(/\D/g, ""),
        },
      },
      size: 1,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (datajudApiKey) {
      headers["Authorization"] = `ApiKey ${datajudApiKey}`;
    }

    const response = await fetch(datajudUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      console.warn(
        `[Cron DataJud Monitor] API returned ${response.status} for ${processo.numeroCNJ}`
      );
      return;
    }

    const data = (await response.json()) as DataJudResponse;

    const hits = data.hits?.hits || [];
    if (hits.length > 0) {
      await processDataJudHits(processo, hits, result);
    }
  } catch (processError) {
    result.errors.push(
      `Process ${processo.numeroCNJ}: ${
        processError instanceof Error ? processError.message : "Unknown"
      }`
    );
  }
}

/**
 * Process DataJud search hits for a process
 */
async function processDataJudHits(
  processo: ProcessWithMovements,
  hits: DataJudHit[],
  result: DataJudResult
): Promise<void> {
  const source = hits[0]._source;
  const movimentos = source?.movimentos || [];

  // Check for new movements
  const lastCheck = processo.ultimaAtualizacao ? new Date(processo.ultimaAtualizacao) : new Date(0);
  const newMovimentos = movimentos.filter((m) => new Date(m.dataHora) > lastCheck);

  if (newMovimentos.length === 0) {
    return;
  }

  result.updatesFound++;

  // Update process
  processo.ultimaAtualizacao = new Date().toISOString();
  processo.movimentos = [
    ...newMovimentos.map((m) => ({
      data: m.dataHora,
      descricao: `${m.nome}${m.complemento ? ": " + m.complemento : ""}`,
    })),
    ...(processo.movimentos || []),
  ].slice(0, 100);

  // Create task for analysis
  await addTaskToQueue({
    id: crypto.randomUUID(),
    agentId: "analise-documental",
    type: "analyze_movement",
    priority: "medium",
    status: "pending",
    createdAt: new Date().toISOString(),
    data: {
      processId: processo.id,
      processCNJ: processo.numeroCNJ,
      newMovements: newMovimentos,
      source: "DataJud Monitor",
    },
  });

  // Send notification
  await sendRealTimeNotification({
    type: "new_movement",
    title: `📋 Nova Movimentação - ${processo.numeroCNJ}`,
    message: `${newMovimentos.length} nova(s) movimentação(ões) detectada(s)\n${
      newMovimentos[0]?.nome || ""
    }`,
    priority: "normal",
    metadata: {
      processCNJ: processo.numeroCNJ,
      movementsCount: newMovimentos.length,
    },
  });
}

/**
 * Handle deadline-alerts action
 * Sends alerts for upcoming and urgent deadlines
 */
async function handleDeadlineAlerts(timestamp: string): Promise<DeadlineAlertResult> {
  console.log(`[Cron Deadline Alerts] Starting execution at ${timestamp}`);

  const result: DeadlineAlertResult = {
    success: true,
    timestamp,
    alertsSent: 0,
    urgentDeadlines: 0,
    upcomingDeadlines: 0,
    errors: [],
  };

  try {
    const kv = await getKv();

    // Get all processes
    const processes = ((await kv.get("processes")) as ProcessWithAlertDeadlines[]) || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const urgentDeadlines: DeadlineInfo[] = [];
    const upcomingDeadlines: DeadlineInfo[] = [];

    // Collect deadlines
    for (const processo of processes) {
      if (!processo.prazos) continue;
      collectProcessDeadlines(processo, today, urgentDeadlines, upcomingDeadlines, result);
    }

    // Send urgent alerts
    if (urgentDeadlines.length > 0) {
      await sendUrgentDeadlineAlert(urgentDeadlines, result);
    }

    // Send daily summary if there are upcoming deadlines
    if (upcomingDeadlines.length > 0) {
      await sendUpcomingDeadlineSummary(upcomingDeadlines, result);
    }

    console.log(
      `[Cron Deadline Alerts] Completed: ${result.urgentDeadlines} urgent, ${result.upcomingDeadlines} upcoming`
    );
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}

/**
 * Collect deadlines from a process
 */
function collectProcessDeadlines(
  processo: ProcessWithAlertDeadlines,
  today: Date,
  urgentDeadlines: DeadlineInfo[],
  upcomingDeadlines: DeadlineInfo[],
  result: DeadlineAlertResult
): void {
  for (const prazo of processo.prazos!) {
    const deadline = new Date(prazo.dataFinal);
    deadline.setHours(0, 0, 0, 0);

    const diasRestantes = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) continue; // Skip past deadlines

    const deadlineInfo: DeadlineInfo = {
      processo: processo.numeroCNJ,
      prazo: prazo.descricao,
      dataFinal: prazo.dataFinal,
      diasRestantes,
    };

    if (diasRestantes <= 1) {
      // URGENT: Today or tomorrow
      result.urgentDeadlines++;
      urgentDeadlines.push(deadlineInfo);
    } else if (diasRestantes <= 7) {
      // Upcoming: within 7 days
      result.upcomingDeadlines++;
      upcomingDeadlines.push(deadlineInfo);
    }
  }
}

/**
 * Send urgent deadline alert
 */
async function sendUrgentDeadlineAlert(
  urgentDeadlines: DeadlineInfo[],
  result: DeadlineAlertResult
): Promise<void> {
  const urgentMessage = urgentDeadlines
    .map(
      (d) => `🚨 ${d.processo}\n   ${d.prazo}\n   ${d.diasRestantes === 0 ? "HOJE!" : "AMANHÃ!"}`
    )
    .join("\n\n");

  await sendRealTimeNotification({
    type: "deadline_alert",
    title: `🚨 URGENTE: ${urgentDeadlines.length} prazo(s) vencendo!`,
    message: urgentMessage,
    priority: "urgent",
    metadata: {
      count: urgentDeadlines.length,
      deadlines: urgentDeadlines,
    },
  });

  // Queue email
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  if (notificationEmail) {
    await queueNotification({
      type: "system",
      title: `🚨 URGENTE: ${urgentDeadlines.length} prazo(s) vencendo hoje/amanhã!`,
      message: urgentMessage,
      recipientEmail: notificationEmail,
    });
  }

  result.alertsSent++;
}

/**
 * Send upcoming deadline summary
 */
async function sendUpcomingDeadlineSummary(
  upcomingDeadlines: DeadlineInfo[],
  result: DeadlineAlertResult
): Promise<void> {
  const summaryMessage = upcomingDeadlines
    .slice(0, 10)
    .map((d) => `📅 ${d.processo}\n   ${d.prazo}\n   Em ${d.diasRestantes} dia(s)`)
    .join("\n\n");

  await sendRealTimeNotification({
    type: "deadline_summary",
    title: `📅 Resumo: ${upcomingDeadlines.length} prazo(s) nos próximos 7 dias`,
    message: summaryMessage,
    priority: "normal",
    metadata: {
      count: upcomingDeadlines.length,
    },
  });

  result.alertsSent++;
}

/**
 * Handle watchdog action
 * Monitors and resets stuck agents and tasks
 */
async function handleWatchdog(timestamp: string): Promise<WatchdogResult> {
  console.log(`[Cron Watchdog] Starting execution at ${timestamp}`);

  const result: WatchdogResult = {
    success: true,
    timestamp,
    agentsReset: 0,
    tasksTimedOut: 0,
    errors: [],
  };

  try {
    const kv = await getKv();
    const agents = await getAgents();
    const taskQueue = ((await kv.get("agent-task-queue")) as AgentTask[]) || [];

    // 1. Check stuck agents
    await checkAndResetStuckAgents(agents, result);

    // 2. Check stuck tasks
    await checkAndTimeoutStuckTasks(kv, taskQueue, result);

    console.log(
      `[Cron Watchdog] Completed: ${result.agentsReset} agents reset, ${result.tasksTimedOut} tasks timed out`
    );
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}

/**
 * Check and reset stuck agents
 */
async function checkAndResetStuckAgents(agents: Agent[], result: WatchdogResult): Promise<void> {
  const STUCK_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
  const now = Date.now();

  const updatedAgents = agents.map((agent) => {
    if (agent.status === "processing" && agent.lastActivity) {
      const lastActivityTime = new Date(agent.lastActivity).getTime();
      if (now - lastActivityTime > STUCK_THRESHOLD_MS) {
        console.warn(`[Watchdog] Resetting stuck agent: ${agent.name} (${agent.id})`);
        result.agentsReset++;
        return {
          ...agent,
          status: "idle" as const,
          lastActivity: new Date().toISOString(),
        };
      }
    }
    return agent;
  });

  if (result.agentsReset > 0) {
    await updateAgents(updatedAgents);
  }
}

/**
 * Check and timeout stuck tasks
 */
async function checkAndTimeoutStuckTasks(
  kv: Redis,
  taskQueue: AgentTask[],
  result: WatchdogResult
): Promise<void> {
  const now = Date.now();
  let tasksUpdated = false;

  const updatedQueue = taskQueue.map((task) => {
    if (task.status === "in_progress" && task.createdAt) {
      const startTime = new Date(task.createdAt).getTime();
      // Timeout de 1 hora para tarefas travadas
      if (now - startTime > 60 * 60 * 1000) {
        console.warn(`[Watchdog] Timing out stuck task: ${task.id}`);
        result.tasksTimedOut++;
        tasksUpdated = true;
        return {
          ...task,
          status: "failed" as const,
          result: "Watchdog: Task timed out (stuck in progress)",
          completedAt: new Date().toISOString(),
        };
      }
    }
    return task;
  });

  if (tasksUpdated) {
    await moveTimedOutTasksToHistory(kv, updatedQueue);
  }
}

/**
 * Move timed out tasks to history
 */
async function moveTimedOutTasksToHistory(kv: Redis, updatedQueue: AgentTask[]): Promise<void> {
  const failedTasks = updatedQueue.filter(
    (t) => t.status === "failed" && t.result === "Watchdog: Task timed out (stuck in progress)"
  );

  if (failedTasks.length > 0) {
    const existingCompleted = ((await kv.get(KV_KEYS.COMPLETED_TASKS)) as AgentTask[]) || [];
    existingCompleted.unshift(...failedTasks);
    await kv.set(KV_KEYS.COMPLETED_TASKS, existingCompleted.slice(0, 1000));

    // Remove from queue
    const remainingQueue = updatedQueue.filter(
      (t) => !(t.status === "failed" && t.result === "Watchdog: Task timed out (stuck in progress)")
    );
    await kv.set("agent-task-queue", remainingQueue);
  } else {
    await kv.set("agent-task-queue", updatedQueue);
  }
}

/**
 * Handle DJEN monitor action
 * Monitors DJEN for new legal publications
 */
async function handleDJENMonitor(timestamp: string): Promise<DJENMonitorResult> {
  console.log(`[Cron DJEN Monitor] Starting execution at ${timestamp}`);

  const defaultTribunais = process.env.DJEN_TRIBUNAIS?.split(",") || [
    "TJMG",
    "TRT3",
    "TST",
    "STJ",
    "TRF1",
  ];

  const defaultLawyer: MonitoredLawyer = {
    id: "lawyer-thiago-bodevan",
    name: "Thiago Bodevan Veiga",
    oab: "MG184404",
    email: "thiagobodevanadvocacia@gmail.com",
    enabled: true,
    tribunals: ["TJMG", "TRT3", "TST", "STJ", "TRF1"],
  };

  const result: DJENMonitorResult = {
    success: true,
    timestamp,
    publicationsFound: 0,
    lawyersChecked: 0,
    tribunaisChecked: defaultTribunais,
    errors: [],
    rateLimitWarning: false,
  };

  let lawyers = await getMonitoredLawyers();
  console.log(`[Cron DJEN Monitor] Found ${lawyers.length} monitored lawyers`);

  if (lawyers.length === 0) {
    console.log(`[Cron DJEN Monitor] Using default lawyer: ${defaultLawyer.name}`);
    lawyers = [defaultLawyer];
  }

  for (const lawyer of lawyers) {
    if (!lawyer.enabled) {
      console.log(`[Cron DJEN Monitor] Skipping disabled lawyer: ${lawyer.name}`);
      continue;
    }

    result.lawyersChecked++;
    const tribunais = lawyer.tribunals?.length > 0 ? lawyer.tribunals : defaultTribunais;

    await checkDJENForLawyer(lawyer, tribunais, timestamp, result);
  }

  await updateLastDJENCheck();
  console.log(`[Cron DJEN Monitor] Completed: ${result.publicationsFound} communications found`);

  if (result.rateLimitWarning) {
    result.errors.push(
      "ATENÇÃO: Rate limit da API DJEN atingido. Algumas consultas foram adiadas."
    );
  }

  // Send daily report
  await sendDJENDailyReport(result);

  return result;
}

/**
 * Check DJEN for a specific lawyer
 */
async function checkDJENForLawyer(
  lawyer: MonitoredLawyer,
  tribunais: string[],
  timestamp: string,
  result: DJENMonitorResult
): Promise<void> {
  try {
    console.log(
      `[Cron DJEN Monitor] Checking ${lawyer.name} (${lawyer.oab}) in ${tribunais.length} tribunais`
    );

    const { resultados, erros, rateLimitWarning } = await consultarDJENForLawyer(
      tribunais,
      lawyer.name,
      lawyer.oab,
      undefined,
      undefined,
      "D"
    );

    if (rateLimitWarning) {
      result.rateLimitWarning = true;
      console.warn(`[Cron DJEN Monitor] Rate limit warning for ${lawyer.name}`);
    }

    console.log(`[Cron DJEN Monitor] Found ${resultados.length} communications for ${lawyer.name}`);

    for (const comunicacao of resultados) {
      await processDJENPublication(comunicacao, lawyer, timestamp, result);
    }

    for (const erro of erros) {
      const errorMsg = `DJEN ${erro.tribunal}: ${erro.erro}`;
      result.errors.push(errorMsg);
      console.warn(`[Cron DJEN Monitor] ${errorMsg}`);
    }
  } catch (error) {
    const errorMsg = `Error checking ${lawyer.name}: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    result.errors.push(errorMsg);
    console.error(`[Cron DJEN Monitor] ${errorMsg}`);
  }
}

/**
 * Process a single DJEN publication
 */
async function processDJENPublication(
  comunicacao: DJENFilteredResult,
  lawyer: MonitoredLawyer,
  timestamp: string,
  result: DJENMonitorResult
): Promise<void> {
  const pubHash =
    comunicacao.hash ||
    `${comunicacao.tribunal}-${comunicacao.data}-${comunicacao.numeroProcesso}-${comunicacao.id}`;

  const exists = await publicationExists(lawyer.id, pubHash);
  if (exists) {
    console.log(`[Cron DJEN Monitor] Skipping duplicate: ${pubHash}`);
    return;
  }

  const storedPub = {
    id: crypto.randomUUID(),
    djenId: comunicacao.id,
    tribunal: comunicacao.tribunal,
    data: comunicacao.data,
    tipo: comunicacao.tipo,
    teor: comunicacao.teor,
    numeroProcesso: comunicacao.numeroProcesso,
    orgao: comunicacao.orgao,
    meio: comunicacao.meio,
    link: comunicacao.link,
    hash: pubHash,
    lawyerId: lawyer.id,
    lawyerName: lawyer.name,
    lawyerOAB: lawyer.oab,
    matchType: comunicacao.matchType,
    advogados: comunicacao.advogados,
    source: "DJEN",
    notified: false,
    createdAt: timestamp,
  };

  await storePublication(storedPub);
  result.publicationsFound++;

  await addTaskToQueue({
    id: crypto.randomUUID(),
    agentId: "justine",
    type: "analyze_intimation",
    priority: "high",
    status: "pending",
    createdAt: new Date().toISOString(),
    data: {
      publicationId: storedPub.id,
      text: storedPub.teor,
      processNumber: storedPub.numeroProcesso,
      tribunal: storedPub.tribunal,
      type: storedPub.tipo,
      source: "DJEN Monitor",
    },
  });

  await sendRealTimeNotification({
    type: "new_publication",
    title: `📋 Nova Publicação DJEN - ${comunicacao.tribunal}`,
    message: `${comunicacao.tipo} encontrada para ${lawyer.name}\nProcesso: ${
      comunicacao.numeroProcesso || "N/A"
    }\nÓrgão: ${comunicacao.orgao || "N/A"}`,
    priority: "high",
    metadata: {
      tribunal: comunicacao.tribunal,
      tipo: comunicacao.tipo,
      processNumber: comunicacao.numeroProcesso,
      orgao: comunicacao.orgao,
      advogado: lawyer.name,
      oab: lawyer.oab,
      link: comunicacao.link,
    },
  });

  const emailToNotify = lawyer.email || process.env.NOTIFICATION_EMAIL;
  if (emailToNotify) {
    await queueNotification({
      type: "publication",
      title: `Nova Comunicação DJEN - ${comunicacao.tribunal}`,
      message: `${comunicacao.tipo} encontrada no processo ${comunicacao.numeroProcesso || "N/A"}`,
      data: {
        tribunal: comunicacao.tribunal,
        tipo: comunicacao.tipo,
        processo: comunicacao.numeroProcesso,
        orgao: comunicacao.orgao,
        link: comunicacao.link,
        advogado: lawyer.name,
        oab: lawyer.oab,
      },
      recipientEmail: emailToNotify,
    });
  }
}

/**
 * Send DJEN daily report email
 */
async function sendDJENDailyReport(result: DJENMonitorResult): Promise<void> {
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  if (!notificationEmail) return;

  const dataHoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Sao_Paulo",
  });

  if (result.publicationsFound === 0) {
    await queueNotification({
      type: "system",
      title: `📭 DJEN - Nenhuma publicação encontrada`,
      message:
        `Relatório diário de ${dataHoje}:\n\n` +
        `✅ Monitoramento executado com sucesso\n` +
        `👤 Advogados verificados: ${result.lawyersChecked}\n` +
        `📋 Publicações encontradas: 0\n` +
        `🏛️ Tribunais consultados: ${result.tribunaisChecked.join(", ")}\n\n` +
        (result.errors.length > 0 ? `⚠️ Erros: ${result.errors.join(", ")}\n\n` : "") +
        `Próxima verificação: amanhã às 11:00 BRT`,
      recipientEmail: notificationEmail,
    });
  } else {
    await queueNotification({
      type: "system",
      title: `📬 DJEN - ${result.publicationsFound} publicação(ões) encontrada(s)`,
      message:
        `Relatório diário de ${dataHoje}:\n\n` +
        `✅ Monitoramento executado com sucesso\n` +
        `👤 Advogados verificados: ${result.lawyersChecked}\n` +
        `📋 Publicações encontradas: ${result.publicationsFound}\n\n` +
        `Acesse o sistema para ver os detalhes.`,
      recipientEmail: notificationEmail,
    });
  }

  console.log(`[Cron DJEN Monitor] Email de relatório enviado para ${notificationEmail}`);
}

// ===== Action Handlers Registry (reduces cognitive complexity S3776) =====

// Base type for all result types
type CronActionResult =
  | DailyResetResult
  | DJENMonitorResult
  | AgentQueueResult
  | NotificationResult
  | CalendarSyncResult
  | BackupResult
  | DataJudResult
  | DeadlineAlertResult
  | WatchdogResult;

interface ActionConfig {
  handler: (timestamp: string) => Promise<CronActionResult>;
  getMessage: (result: CronActionResult) => string;
  successMessage: string;
}

const ACTION_HANDLERS: Record<string, ActionConfig> = {
  "daily-reset": {
    handler: handleDailyReset,
    getMessage: () => "Daily reset cron executed successfully",
    successMessage: "Daily reset cron executed successfully",
  },
  "djen-monitor": {
    handler: handleDJENMonitor,
    getMessage: () => "DJEN monitor cron executed successfully",
    successMessage: "DJEN monitor cron executed successfully",
  },
  "process-agent-queue": {
    handler: handleProcessAgentQueue,
    getMessage: (result) => {
      const r = result as AgentQueueResult;
      return r.tasksProcessed === 0 && r.tasksFailed === 0
        ? "No pending tasks in queue"
        : "Agent queue processing completed";
    },
    successMessage: "Agent queue processing completed",
  },
  "process-notifications": {
    handler: handleProcessNotifications,
    getMessage: (result) => {
      const r = result as NotificationResult;
      return r.emailsSent === 0 && r.webhooksSent === 0
        ? "No pending notifications"
        : "Notification processing completed";
    },
    successMessage: "Notification processing completed",
  },
  "calendar-sync": {
    handler: handleCalendarSync,
    getMessage: (result) => {
      const r = result as CalendarSyncResult;
      return r.eventsCreated === 0
        ? "Calendar sync skipped - no deadlines to sync or not configured"
        : "Calendar sync completed";
    },
    successMessage: "Calendar sync completed",
  },
  backup: {
    handler: handleBackup,
    getMessage: () => "Backup completed",
    successMessage: "Backup completed",
  },
  "datajud-monitor": {
    handler: handleDataJudMonitor,
    getMessage: () => "DataJud monitoring completed",
    successMessage: "DataJud monitoring completed",
  },
  "deadline-alerts": {
    handler: handleDeadlineAlerts,
    getMessage: () => "Deadline alerts completed",
    successMessage: "Deadline alerts completed",
  },
  watchdog: {
    handler: handleWatchdog,
    getMessage: () => "Watchdog execution completed",
    successMessage: "Watchdog execution completed",
  },
};

const VALID_ACTIONS = Object.keys(ACTION_HANDLERS).join(", ");

/**
 * Valida se a requisição está autorizada
 */
// Autorização simplificada: removido uso de CRON_SECRET conforme solicitação.
// Mantemos apenas execução via Vercel Cron (header Bearer gerado) ou ambiente local.
function isAuthorized(req: VercelRequest): boolean {
  // Vercel Cron adiciona o header "x-vercel-cron" automaticamente nas execuções agendadas.
  // Mantemos também suporte ao antigo padrão Bearer (se alguma automação externa ainda enviar) e ambiente local.
  const authHeader = req.headers.authorization;
  const hasVercelCronHeader = !!req.headers["x-vercel-cron"]; // verdadeiro quando disparado por agendamento Vercel
  const isBearerAuth = authHeader?.startsWith("Bearer ");
  const isLocalTest = process.env.NODE_ENV === "development";
  return hasVercelCronHeader || isBearerAuth || isLocalTest;
}

/**
 * Valida e obtém a configuração da ação
 */
function getActionConfig(action: string | string[] | undefined): ActionConfig | null {
  const actionStr = typeof action === "string" ? action : "";
  return ACTION_HANDLERS[actionStr] || null;
}

/**
 * Processa a resposta de sucesso
 */
function handleSuccessResponse(
  res: VercelResponse,
  result: CronActionResult,
  actionConfig: ActionConfig
): VercelResponse {
  const message = actionConfig.getMessage(result);
  const ok = result.success !== false;

  return res.status(200).json({ ok, message, result });
}

/**
 * Processa resposta de erro
 */
function handleErrorResponse(
  res: VercelResponse,
  error: unknown,
  timestamp: string
): VercelResponse {
  console.error("[Cron API] Fatal error:", error);

  return res.status(500).json({
    ok: false,
    error: "Internal server error",
    message: error instanceof Error ? error.message : "Unknown error",
    timestamp,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  if (!isAuthorized(req)) {
    return res.status(401).json({
      error: "Unauthorized - This endpoint is restricted to Vercel Cron or local development",
    });
  }

  const timestamp = new Date().toISOString();
  const actionConfig = getActionConfig(action);

  if (!actionConfig) {
    return res.status(400).json({
      error: `Invalid action. Use: ${VALID_ACTIONS}`,
    });
  }

  try {
    const result = await actionConfig.handler(timestamp);
    return handleSuccessResponse(res, result, actionConfig);
  } catch (error) {
    return handleErrorResponse(res, error, timestamp);
  }
}
