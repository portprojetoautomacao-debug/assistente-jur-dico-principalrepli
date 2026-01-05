// minuta-agent.ts
// Agente de IA que:
// 1) Gera minuta com Gemini
// 2) Salva no Google Docs
// 3) Cria prazo automático no Google Calendar (opcional)
// 🔥 INSTRUMENTADO COM SENTRY AI MONITORING V2

import { generatePeticao } from "@/lib/gemini-service";
import { createInvokeAgentSpan } from "@/lib/sentry-gemini-integration-v2";
import type { Minuta } from "@/types";
import { googleCalendarService, type DeadlineEvent } from "./google-calendar-service";
import { googleDocsService } from "./google-docs-service";

// Mesmo shape do módulo de integração de prazos (deadline-integration)
export interface MinutaAgentDeadline {
  endDate: string; // ISO ou YYYY-MM-DD
  days: number;
  type: "úteis" | "corridos";
  priority?: "baixa" | "média" | "alta" | "crítica";
  description?: string;
}

export interface MinutaAgentParams {
  tipoMinuta: string; // ex: "Petição Inicial", "Contestação", "Recurso de Apelação"
  detalhesCaso: string; // fatos, contexto, decisão, etc.
  titulo?: string; // se não vier, o agent monta
  numeroProcesso?: string;
  tribunal?: string;
  prazo?: MinutaAgentDeadline | null; // se vier, cria evento de prazo no Calendar
  sync?: {
    docs?: boolean; // default: true
    calendar?: boolean; // default: true (se prazo existir)
  };
}

export interface MinutaAgentResult {
  success: boolean;
  provider: "gemini-2.5-pro";
  minuta: Minuta | null;

  // Google Docs
  docsId?: string | null;
  docsUrl?: string | null;

  // Google Calendar
  calendarEventId?: string | null;

  // Informações de prazo (eco do input + normalização)
  prazo?: MinutaAgentDeadline | null;

  // Logs/erros para UI
  errors: string[];
}

// ===========================
// Helper Functions
// ===========================

/**
 * Normaliza data de prazo para ISO YYYY-MM-DD (sem horário)
 */
function normalizeDateToISO(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`Data de prazo inválida: ${dateStr}`);
  }
  return date.toISOString().split("T")[0];
}

/**
 * Converte prioridade textual para enum usado pelo GoogleCalendarService
 */
function mapPriority(
  priority?: MinutaAgentDeadline["priority"]
): "baixa" | "media" | "alta" | "critica" | undefined {
  const PRIORITY_MAP: Record<string, "baixa" | "media" | "alta" | "critica"> = {
    baixa: "baixa",
    média: "media",
    alta: "alta",
    crítica: "critica",
  };
  return priority ? PRIORITY_MAP[priority] : undefined;
}

/**
 * Retorna array de lembretes baseado na prioridade
 */
function getRemindersForPriority(priority?: MinutaAgentDeadline["priority"]): number[] {
  const REMINDER_CONFIG: Record<string, number[]> = {
    crítica: [60, 240, 1440, 2880, 4320],
    alta: [60, 1440, 2880],
    média: [60, 1440],
  };
  return priority && REMINDER_CONFIG[priority] ? REMINDER_CONFIG[priority] : [60];
}

/**
 * Log de feedback de sucesso (SonarCloud S4165 - métodos separados em vez de flag)
 */
function logSuccess(message: string): void {
  console.log(`[MinutaAgent][OK]: ${message}`);
}

/**
 * Log de feedback de erro
 */
function logError(message: string): void {
  console.error(`[MinutaAgent][Erro]: ${message}`);
}

/**
 * Cria resultado de erro padrão
 */
function createErrorResult(errors: string[], prazo: MinutaAgentDeadline | null): MinutaAgentResult {
  return {
    success: false,
    provider: "gemini-2.5-pro",
    minuta: null,
    docsId: null,
    docsUrl: null,
    calendarEventId: null,
    prazo,
    errors,
  };
}

/**
 * Gera minuta usando Gemini
 */
async function generateMinutaContent(
  tipoMinuta: string,
  detalhesCaso: string
): Promise<{ content: string | null; error: string | null }> {
  const response = await generatePeticao(tipoMinuta, detalhesCaso);

  if (response.error || !response.text) {
    const errorMsg = response.error || "Gemini retornou texto vazio na geração da minuta";
    return { content: null, error: errorMsg };
  }

  return { content: response.text, error: null };
}

/**
 * Monta objeto Minuta
 */
function buildMinutaObject(
  titulo: string | undefined,
  tipoMinuta: string,
  numeroProcesso: string | undefined,
  conteudo: string
): Minuta {
  const sufixoProcesso = numeroProcesso ? ` - Proc. ${numeroProcesso}` : "";
  const tituloMinuta = titulo || `Minuta - ${tipoMinuta}${sufixoProcesso}`;

  return {
    id: crypto.randomUUID(),
    titulo: tituloMinuta,
    conteudo,
  } as Minuta;
}

/**
 * Salva minuta no Google Docs
 */
async function saveToGoogleDocs(
  minuta: Minuta,
  errors: string[]
): Promise<{ docsId: string | null; docsUrl: string | null }> {
  try {
    const docsResult = await googleDocsService.createDocument(minuta);
    if (docsResult?.docId) {
      return { docsId: docsResult.docId, docsUrl: docsResult.url };
    }
    errors.push("Não foi possível criar o documento no Google Docs");
    logError("Erro ao salvar no Google Docs");
  } catch (err) {
    const errorMsg =
      err instanceof Error
        ? `Erro ao criar documento no Google Docs: ${err.message}`
        : "Erro desconhecido ao criar documento no Google Docs";
    errors.push(errorMsg);
    logError("Erro ao salvar no Google Docs");
  }
  return { docsId: null, docsUrl: null };
}

/**
 * Cria DeadlineEvent para o Google Calendar
 */
function buildDeadlineEvent(
  tituloMinuta: string,
  tipoMinuta: string,
  numeroProcesso: string | undefined,
  tribunal: string | undefined,
  prazo: MinutaAgentDeadline,
  isoDate: string
): DeadlineEvent {
  const descriptionParts = [
    `Minuta: ${tipoMinuta}`,
    numeroProcesso ? `Processo: ${numeroProcesso}` : "",
    tribunal ? `Tribunal: ${tribunal}` : "",
    prazo.description ? `Detalhes do prazo: ${prazo.description}` : "",
  ];

  return {
    title: tituloMinuta,
    description: descriptionParts.filter(Boolean).join("\n"),
    deadline: isoDate,
    processNumber: numeroProcesso,
    type: "prazo",
    priority: mapPriority(prazo.priority),
    reminders: getRemindersForPriority(prazo.priority),
  };
}

/**
 * Cria evento de prazo no Google Calendar
 */
async function createCalendarEvent(
  prazo: MinutaAgentDeadline,
  tituloMinuta: string,
  tipoMinuta: string,
  numeroProcesso: string | undefined,
  tribunal: string | undefined,
  errors: string[]
): Promise<{ eventId: string | null; prazoNormalizado: MinutaAgentDeadline }> {
  try {
    const isoDate = normalizeDateToISO(prazo.endDate);
    const prazoNormalizado = { ...prazo, endDate: isoDate };
    const deadlineEvent = buildDeadlineEvent(
      tituloMinuta,
      tipoMinuta,
      numeroProcesso,
      tribunal,
      prazo,
      isoDate
    );

    const eventId = await googleCalendarService.createDeadlineEvent(deadlineEvent);

    if (!eventId) {
      errors.push("Não foi possível criar o evento de prazo no Google Calendar");
      logError("Erro ao criar evento no Google Calendar");
    }

    return { eventId: eventId || null, prazoNormalizado };
  } catch (err) {
    const errorMsg =
      err instanceof Error
        ? `Erro ao criar evento no Google Calendar: ${err.message}`
        : "Erro desconhecido ao criar evento no Google Calendar";
    errors.push(errorMsg);
    logError("Erro ao criar evento no Google Calendar");
    return { eventId: null, prazoNormalizado: prazo };
  }
}

// ===========================
// Main Agent Function
// ===========================

/**
 * Agente principal:
 * - Gera minuta com Gemini
 * - Opcionalmente salva no Google Docs
 * - Opcionalmente cria prazo no Google Calendar
 * 🔥 INSTRUMENTADO COM SENTRY AI MONITORING V2
 */
export async function criarMinutaComAgenteIA(
  params: MinutaAgentParams
): Promise<MinutaAgentResult> {
  const sessionId = `minuta-${Date.now()}`;

  return createInvokeAgentSpan(
    {
      agentName: "Redação de Petições",
      system: "gcp.gemini",
      model: "gemini-2.5-pro",
      temperature: 0.7,
      maxTokens: 4000,
    },
    {
      sessionId,
      turn: 1,
      messages: [
        {
          role: "user",
          content: `Gerar ${params.tipoMinuta} para ${params.numeroProcesso || "processo"}`,
        },
      ],
    },
    async (span) => {
      const errors: string[] = [];
      const { tipoMinuta, detalhesCaso, titulo, numeroProcesso, tribunal, prazo, sync } = params;

      const syncDocs = sync?.docs ?? true;
      const syncCalendar = sync?.calendar ?? true;

      // Atributos específicos
      span?.setAttribute("minuta.tipo", tipoMinuta);
      span?.setAttribute("minuta.processo", numeroProcesso || "unknown");
      span?.setAttribute("minuta.tribunal", tribunal || "unknown");
      span?.setAttribute("sync.docs", syncDocs);
      span?.setAttribute("sync.calendar", syncCalendar);

      // 1) Gera a minuta usando Gemini
      const { content, error: geminiError } = await generateMinutaContent(tipoMinuta, detalhesCaso);

      if (geminiError || !content) {
        errors.push(geminiError || "Erro ao gerar minuta");
        logError(geminiError || "Erro ao gerar minuta");
        return createErrorResult(errors, prazo ?? null);
      }

      // 2) Monta objeto Minuta
      const minuta = buildMinutaObject(titulo, tipoMinuta, numeroProcesso, content);

      // 3) Salvar no Google Docs (se habilitado)
      let docsId: string | null = null;
      let docsUrl: string | null = null;

      if (syncDocs) {
        const docsResult = await saveToGoogleDocs(minuta, errors);
        docsId = docsResult.docsId;
        docsUrl = docsResult.docsUrl;
      }

      // 4) Criar prazo no Google Calendar (se houver prazo + sync ativo)
      let calendarEventId: string | null = null;
      let prazoNormalizado: MinutaAgentDeadline | null = prazo ?? null;

      if (prazo && syncCalendar) {
        const calendarResult = await createCalendarEvent(
          prazo,
          minuta.titulo,
          tipoMinuta,
          numeroProcesso,
          tribunal,
          errors
        );
        calendarEventId = calendarResult.eventId;
        prazoNormalizado = calendarResult.prazoNormalizado;
      }

      logSuccess("Minuta gerada com sucesso");

      // Atributos de conclusão para Sentry
      span?.setAttribute("minuta.generated", true);
      span?.setAttribute("minuta.id", minuta.id);
      span?.setAttribute("docs.saved", docsId !== null);
      span?.setAttribute("calendar.created", calendarEventId !== null);
      span?.setAttribute("errors.count", errors.length);

      return {
        success: errors.length === 0,
        provider: "gemini-2.5-pro",
        minuta,
        docsId,
        docsUrl,
        calendarEventId,
        prazo: prazoNormalizado,
        errors,
      };
    }
  );
}
