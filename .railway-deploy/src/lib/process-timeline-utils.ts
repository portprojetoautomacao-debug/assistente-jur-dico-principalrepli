import type { Expediente, Minuta, ProcessEvent } from "@/types";

/**
 * Utilitários para Timeline Processual (Painel de Movimentações estilo PJe)
 */

/**
 * Converte expedientes em eventos de timeline processual
 * Compatível com dados DJEN/DataJud existentes
 */
export function expedientesToProcessEvents(expedientes: Expediente[]): ProcessEvent[] {
  return expedientes.map((exp) => ({
    id: exp.id,
    processId: exp.processId || "",
    dataHora: exp.dataRecebimento || exp.createdAt || new Date().toISOString(),
    titulo: exp.titulo || mapTipoToTitulo(exp.tipo),
    descricao: exp.conteudo || exp.teor || exp.descricao,
    tipo: mapExpedienteToEventType(exp.tipo),
    tribunal: exp.tribunal,
    orgao: exp.orgao,
    source: exp.source as ProcessEvent["source"],
    expedienteId: exp.id,
  }));
}

/**
 * Converte minutas em eventos de timeline processual
 */
export function minutasToProcessEvents(minutas: Minuta[]): ProcessEvent[] {
  return minutas.map((minuta) => ({
    id: minuta.id,
    processId: minuta.processId || "",
    dataHora: minuta.criadoEm,
    titulo: minuta.titulo,
    descricao: minuta.conteudo?.substring(0, 200), // Primeiros 200 chars
    tipo: mapMinutaTipoToEventType(minuta.tipo),
    documentoUrl: minuta.googleDocsUrl,
    documentoTipo: "html",
    source: minuta.criadoPorAgente ? "ia" : "manual",
    minutaId: minuta.id,
  }));
}

/**
 * Combina expedientes e minutas em timeline unificada
 */
export function createProcessTimeline(
  expedientes: Expediente[],
  minutas: Minuta[]
): ProcessEvent[] {
  const events = [...expedientesToProcessEvents(expedientes), ...minutasToProcessEvents(minutas)];

  // Ordenar por data/hora (mais recente primeiro)
  return events.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
}

/**
 * Mapeia tipo de expediente para tipo de evento
 */
function mapExpedienteToEventType(tipo?: string): ProcessEvent["tipo"] {
  const map: Record<string, ProcessEvent["tipo"]> = {
    intimacao: "intimacao",
    citacao: "mandado",
    documento: "juntada",
  };
  return map[tipo || ""] || "outro";
}

/**
 * Mapeia tipo de minuta para tipo de evento
 */
function mapMinutaTipoToEventType(tipo: Minuta["tipo"]): ProcessEvent["tipo"] {
  const map: Record<Minuta["tipo"], ProcessEvent["tipo"]> = {
    peticao: "peticao",
    contrato: "juntada",
    parecer: "juntada",
    recurso: "peticao",
    procuracao: "juntada",
    outro: "outro",
  };
  return map[tipo] || "outro";
}

/**
 * Mapeia tipo de expediente para título legível
 */
function mapTipoToTitulo(tipo?: string): string {
  const map: Record<string, string> = {
    intimacao: "INTIMAÇÃO",
    citacao: "CITAÇÃO",
    documento: "JUNTADA DE DOCUMENTO",
  };
  return map[tipo || ""] || "MOVIMENTAÇÃO PROCESSUAL";
}

/**
 * Agrupa eventos por dia
 */
export function groupEventsByDay(events: ProcessEvent[]): Record<string, ProcessEvent[]> {
  const groups: Record<string, ProcessEvent[]> = {};

  for (const event of events) {
    const dayKey = new Date(event.dataHora).toISOString().slice(0, 10);
    if (!groups[dayKey]) {
      groups[dayKey] = [];
    }
    groups[dayKey].push(event);
  }

  return groups;
}

/**
 * Filtra eventos por tipo
 */
export function filterEventsByType(
  events: ProcessEvent[],
  tipos: ProcessEvent["tipo"][]
): ProcessEvent[] {
  return events.filter((ev) => ev.tipo && tipos.includes(ev.tipo));
}

/**
 * Filtra eventos por período
 */
export function filterEventsByDateRange(
  events: ProcessEvent[],
  startDate: string,
  endDate: string
): ProcessEvent[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return events.filter((ev) => {
    const eventTime = new Date(ev.dataHora).getTime();
    return eventTime >= start && eventTime <= end;
  });
}
