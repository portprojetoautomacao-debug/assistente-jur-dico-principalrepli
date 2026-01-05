/**
 * Integração entre Agente de Gestão de Prazos e Calendário
 *
 * Este módulo conecta os resultados da análise de intimações
 * ao calendário local e Google Calendar.
 */

import type { Appointment } from "@/types";
import {
  googleCalendarService,
  type DeadlineEvent,
} from "./google-calendar-service";

// Tipos para integração
export type AnalysisDeadlineType = "úteis" | "corridos";
export type AnalysisPriority = "baixa" | "média" | "alta" | "crítica";

export interface AnalysisDeadline {
  days: number;
  type: AnalysisDeadlineType;
  endDate: string;
  description?: string;
}

export interface IntimationAnalysisResult {
  summary: string;
  deadline?: AnalysisDeadline;
  priority: AnalysisPriority;
  type?: "intimacao_judicial" | "notificacao" | "outro";
  nextSteps?: string[];
  suggestedAction?: string;
  processNumber?: string;
  court?: string;
  documentType?: string;
}

export interface DeadlineCreationResult {
  success: boolean;
  localAppointmentId?: string;
  googleEventId?: string;
  error?: string;
}

/**
 * Mapeia prioridade do formato análise para o formato Google Calendar
 * (Usa identidade: já está em português com acento)
 */
function mapPriorityToCalendarFormat(
  priority: "baixa" | "média" | "alta" | "crítica"
): "baixa" | "média" | "alta" | "crítica" {
  return priority;
}

/**
 * Constrói descrição rica para compromisso de prazo
 */
function buildAppointmentDescription(
  analysis: IntimationAnalysisResult
): string {
  const descriptionParts = [
    analysis.summary,
    "",
    `📅 Prazo: ${analysis.deadline?.days} dias ${analysis.deadline?.type}`,
    analysis.processNumber ? `📋 Processo: ${analysis.processNumber}` : "",
    analysis.court ? `🏛️ Tribunal: ${analysis.court}` : "",
    analysis.documentType ? `📄 Tipo: ${analysis.documentType}` : "",
    "",
    "📌 Próximos Passos:",
    ...(analysis.nextSteps || []).map((step, i) => `${i + 1}. ${step}`),
    "",
    analysis.suggestedAction
      ? `⚡ Ação Recomendada: ${analysis.suggestedAction}`
      : "",
  ].filter(Boolean);

  return descriptionParts.join("\n");
}

/**
 * Constrói o título do compromisso
 */
function buildAppointmentTitle(intimationTitle: string): string {
  const truncatedTitle =
    intimationTitle.length > 50
      ? `${intimationTitle.substring(0, 50)}...`
      : intimationTitle;
  return `⚠️ PRAZO: ${truncatedTitle}`;
}

/**
 * Obter lembretes baseados na prioridade
 * (valores em minutos antes do evento)
 */
function getPriorityReminders(
  priority: IntimationAnalysisResult["priority"]
): number[] {
  switch (priority) {
    case "crítica":
      // 1 hora, 4 horas, 1 dia, 2 dias, 3 dias antes
      return [60, 240, 1440, 2880, 4320];
    case "alta":
      // 1 hora, 1 dia, 2 dias antes
      return [60, 1440, 2880];
    case "média":
      // 1 hora, 1 dia antes
      return [60, 1440];
    case "baixa":
    default:
      // 1 hora antes
      return [60];
  }
}

function buildAppointment(
  analysis: IntimationAnalysisResult,
  intimationTitle: string,
  deadlineDate: Date
): Appointment {
  const dateStr = deadlineDate.toISOString().split("T")[0];
  const type: Appointment["type"] =
    analysis.priority === "crítica" || analysis.priority === "alta"
      ? "prazo"
      : "outro";

  return {
    id: crypto.randomUUID(),
    title: buildAppointmentTitle(intimationTitle),
    description: buildAppointmentDescription(analysis),
    type,
    date: dateStr,
    time: "09:00", // Padrão: manhã
    duration: 60,
    location: analysis.court || "",
    reminders: getPriorityReminders(analysis.priority),
  };
}

/**
 * Valida se a análise contém uma data de prazo válida.
 */
function validateAnalysisDeadline(
  analysis: IntimationAnalysisResult
): analysis is IntimationAnalysisResult & { deadline: AnalysisDeadline } {
  return !!analysis.deadline?.endDate;
}

/**
 * Criar compromisso local a partir de análise de intimação
 */
export function createLocalAppointmentFromAnalysis(
  analysis: IntimationAnalysisResult,
  intimationTitle: string
): Appointment | null {
  if (!validateAnalysisDeadline(analysis)) {
    console.log("[DeadlineIntegration] No deadline found in analysis");
    return null;
  }

  // Type guard above ensures analysis.deadline is defined
  // Use non-null assertion after guard check for TypeScript strict mode
  const deadlineDate = new Date(analysis.deadline!.endDate);
  if (!deadlineDate) {
    console.warn(
      "[DeadlineIntegration] Invalid deadline date:",
      analysis.deadline.endDate
    );
    return null;
  }

  const appointment = buildAppointment(analysis, intimationTitle, deadlineDate);

  console.log("[DeadlineIntegration] Created local appointment:", {
    id: appointment.id,
    title: appointment.title,
    date: appointment.date,
    priority: analysis.priority,
  });

  return appointment;
}

/**
 * Verifica se o Google Calendar está configurado e autenticado.
 */
function isGoogleCalendarReady(): boolean {
  const status = googleCalendarService.getStatus();

  if (!status.configured) {
    console.log("[DeadlineIntegration] Google Calendar not configured");
    return false;
  }

  if (!status.authenticated) {
    console.log("[DeadlineIntegration] Google Calendar not authenticated");
    return false;
  }

  return true;
}

/**
 * Sincronizar prazo com Google Calendar (se conectado)
 */
export async function syncDeadlineToGoogleCalendar(
  analysis: IntimationAnalysisResult,
  intimationTitle: string
): Promise<string | null> {
  if (!analysis.deadline?.endDate) {
    return null;
  }

  if (!isGoogleCalendarReady()) {
    return null;
  }

  try {
    const deadlineEvent: DeadlineEvent = {
      title: intimationTitle.substring(0, 100),
      description: buildAppointmentDescription(analysis),
      deadline: new Date(analysis.deadline!.endDate).toISOString(),
      type: analysis.type === "intimacao_judicial" ? "prazo" : "reuniao",
      priority: mapPriorityToCalendarFormat(analysis.priority),
      reminders: getPriorityReminders(analysis.priority),
    };

    const eventId = await googleCalendarService.createDeadlineEvent(
      deadlineEvent
    );

    if (eventId) {
      console.log(
        "[DeadlineIntegration] Created Google Calendar event:",
        eventId
      );
    }

    return eventId;
  } catch (error) {
    console.error(
      "[DeadlineIntegration] Failed to sync to Google Calendar:",
      error
    );
    return null;
  }
}

/**
 * Verifica se existe appointment duplicado
 */
function isDuplicateAppointment(
  newAppointment: Appointment,
  existingAppointments: Appointment[],
  intimationTitle: string
): boolean {
  return existingAppointments.some(
    (apt) =>
      apt.date === newAppointment.date &&
      apt.title.includes(intimationTitle.substring(0, 30))
  );
}

/**
 * Adiciona novo appointment ao estado
 */
function addAppointmentToState(
  appointment: Appointment,
  currentAppointments: Appointment[],
  setAppointments: (updater: (current: Appointment[]) => Appointment[]) => void
): void {
  setAppointments((current) => [...(current || []), appointment]);
}

/**
 * Sincroniza com Google se necessário
 */
async function syncToGoogleIfEnabled(
  shouldSync: boolean,
  analysis: IntimationAnalysisResult,
  intimationTitle: string
): Promise<string | null> {
  if (!shouldSync) return null;
  return await syncDeadlineToGoogleCalendar(analysis, intimationTitle);
}

/**
 * Criar prazo completo (local + Google Calendar)
 */
export async function createDeadlineFromAnalysis(
  analysis: IntimationAnalysisResult,
  intimationTitle: string,
  currentAppointments: Appointment[],
  setAppointments: (updater: (current: Appointment[]) => Appointment[]) => void,
  syncToGoogle: boolean = true
): Promise<DeadlineCreationResult> {
  // 1. Criar compromisso local
  const localAppointment = createLocalAppointmentFromAnalysis(
    analysis,
    intimationTitle
  );
  if (!localAppointment) {
    return { success: false, error: "Nenhum prazo encontrado na análise" };
  }

  // 2. Verificar se já existe
  if (
    isDuplicateAppointment(
      localAppointment,
      currentAppointments,
      intimationTitle
    )
  ) {
    console.log("[DeadlineIntegration] Appointment already exists");
    return { success: true, localAppointmentId: localAppointment.id };
  }

  // 3. Adicionar ao calendário local
  addAppointmentToState(localAppointment, currentAppointments, setAppointments);
  console.log(
    "[DeadlineIntegration] Added local appointment:",
    localAppointment.id
  );

  // 4. Sincronizar com Google Calendar se habilitado
  const googleEventId = await syncToGoogleIfEnabled(
    syncToGoogle,
    analysis,
    intimationTitle
  );

  return {
    success: true,
    localAppointmentId: localAppointment.id,
    googleEventId: googleEventId || undefined,
  };
}

function processSingleAnalysis(
  item: { analysis: IntimationAnalysisResult; title: string },
  currentAppointments: Appointment[],
  newAppointments: Appointment[]
): { result: DeadlineCreationResult; appointment?: Appointment } {
  const { analysis, title } = item;
  const localAppointment = createLocalAppointmentFromAnalysis(analysis, title);

  if (!localAppointment) {
    return { result: { success: false, error: "Sem prazo" } };
  }

  const isDuplicate = [...currentAppointments, ...newAppointments].some(
    (apt) =>
      apt.date === localAppointment.date &&
      apt.title.includes(title.substring(0, 30))
  );

  if (isDuplicate) {
    return { result: { success: true, localAppointmentId: "existing" } };
  }

  return {
    result: { success: true, localAppointmentId: localAppointment.id },
    appointment: localAppointment,
  };
}

async function syncBatchToGoogle(
  analysesWithDeadlines: Array<{
    analysis: IntimationAnalysisResult;
    title: string;
  }>,
  results: DeadlineCreationResult[]
): Promise<void> {
  if (!googleCalendarService.getStatus().authenticated) return;

  const googlePromises = analysesWithDeadlines.map(({ analysis, title }) =>
    syncDeadlineToGoogleCalendar(analysis, title)
  );

  try {
    const googleResults = await Promise.allSettled(googlePromises);
    googleResults.forEach((res, index) => {
      if (res.status === "fulfilled" && res.value) {
        if (results[index]) {
          results[index].googleEventId = res.value;
        }
      }
    });
  } catch (error) {
    console.error("[DeadlineIntegration] Error syncing to Google:", error);
  }
}

/**
 * Coletar appointments novos de análises
 */
function collectNewAppointments(
  analysesWithDeadlines: Array<{
    analysis: IntimationAnalysisResult;
    title: string;
  }>,
  currentAppointments: Appointment[],
  results: DeadlineCreationResult[]
): Appointment[] {
  const newAppointments: Appointment[] = [];

  for (const item of analysesWithDeadlines) {
    const { result, appointment } = processSingleAnalysis(
      item,
      currentAppointments,
      newAppointments
    );
    results.push(result);

    if (appointment) {
      newAppointments.push(appointment);
    }
  }

  return newAppointments;
}

/**
 * Adicionar novos appointments ao calendário
 */
function applyNewAppointments(
  newAppointments: Appointment[],
  setAppointments: (updater: (current: Appointment[]) => Appointment[]) => void
): void {
  if (newAppointments.length > 0) {
    setAppointments((current) => [...(current || []), ...newAppointments]);
    console.log(
      `[DeadlineIntegration] Added ${newAppointments.length} appointments to calendar`
    );
  }
}

/**
 * Processar múltiplas análises e criar prazos em lote
 */
export async function batchCreateDeadlines(
  analyses: Array<{ analysis: IntimationAnalysisResult; title: string }>,
  currentAppointments: Appointment[],
  setAppointments: (updater: (current: Appointment[]) => Appointment[]) => void,
  syncToGoogle: boolean = true
): Promise<{
  total: number;
  created: number;
  skipped: number;
  errors: number;
  details: DeadlineCreationResult[];
}> {
  const results: DeadlineCreationResult[] = [];

  // Filtrar apenas análises com prazos
  const analysesWithDeadlines = analyses.filter(
    (a) => a.analysis.deadline?.endDate
  );

  console.log(
    `[DeadlineIntegration] Processing ${analysesWithDeadlines.length} deadlines from ${analyses.length} analyses`
  );

  // Coletar todos os novos appointments
  const newAppointments = collectNewAppointments(
    analysesWithDeadlines,
    currentAppointments,
    results
  );

  // Adicionar todos de uma vez ao estado
  applyNewAppointments(newAppointments, setAppointments);

  // Sincronizar com Google Calendar em paralelo (se habilitado)
  if (syncToGoogle) {
    await syncBatchToGoogle(analysesWithDeadlines, results);
  }

  return {
    total: analyses.length,
    created: results.filter(
      (r) => r.success && r.localAppointmentId !== "existing"
    ).length,
    skipped: results.filter(
      (r) => r.success && r.localAppointmentId === "existing"
    ).length,
    errors: results.filter((r) => !r.success).length,
    details: results,
  };
}
