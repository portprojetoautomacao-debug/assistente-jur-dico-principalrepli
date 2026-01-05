import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Process, ProcessEvent } from "@/types";
import { Clock, Download, ExternalLink, FileText, Filter, Workflow } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { getEventBadgeStyle } from "@/lib/themes";

/**
 * Props principais do componente ProcessTimelineViewer
 */
interface ProcessTimelineViewerProps {
  readonly process: Process;
  readonly events: ProcessEvent[];
  readonly initialEventId?: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function getTipoBadge(tipo?: ProcessEvent["tipo"]) {
  const labelMap: Record<string, string> = {
    certidao: "Certidão",
    mandado: "Mandado",
    despacho: "Despacho",
    sentenca: "Sentença",
    peticao: "Petição",
    intimacao: "Intimação",
    juntada: "Juntada",
    conclusos: "Conclusos",
  };

  return {
    label: tipo && tipo in labelMap ? labelMap[tipo] : "Movimentação",
    style: getEventBadgeStyle(tipo),
  };
}

/**
 * Componente principal: Timeline Processual estilo PJe
 *
 * Replica o padrão visual do PJe com:
 * - Sidebar fixa (Árvore de Movimentações)
 * - Painel de documento com rolagem independente
 * - Animações suaves com framer-motion
 * - Navegação por teclado (↑↓)
 * - Badge "NOVO" para eventos recentes (últimos 5 minutos)
 */
export default function ProcessTimelineViewer({
  process,
  events,
  initialEventId,
}: ProcessTimelineViewerProps) {
  const orderedEvents = useMemo(
    () =>
      [...events].sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()),
    [events]
  );

  const eventsByDay = useMemo(() => {
    const groups: Record<string, ProcessEvent[]> = {};
    for (const ev of orderedEvents) {
      const key = new Date(ev.dataHora).toISOString().slice(0, 10);
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    }
    return Object.entries(groups).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [orderedEvents]);

  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(
    initialEventId || orderedEvents[0]?.id
  );

  const selectedEvent = orderedEvents.find((ev) => ev.id === selectedEventId);
  const selectedEventRef = useRef<HTMLButtonElement>(null);

  // Verifica se evento é novo (últimos 5 minutos)
  const _isEventNew = (event: ProcessEvent) => {
    const eventTime = new Date(event.dataHora).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return eventTime > fiveMinutesAgo;
  };

  // Navegação por teclado (↑↓)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;

      e.preventDefault();

      const currentIndex = orderedEvents.findIndex((ev) => ev.id === selectedEventId);
      if (currentIndex === -1) return;

      let newIndex: number;
      if (e.key === "ArrowUp") {
        newIndex = currentIndex > 0 ? currentIndex - 1 : orderedEvents.length - 1;
      } else {
        newIndex = currentIndex < orderedEvents.length - 1 ? currentIndex + 1 : 0;
      }

      setSelectedEventId(orderedEvents[newIndex]?.id);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [orderedEvents, selectedEventId]);

  // Auto-scroll para evento selecionado
  useEffect(() => {
    if (selectedEventRef.current) {
      selectedEventRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedEventId]);

  return (
    <Card className="h-[calc(100vh-140px)] w-full overflow-hidden">
      <CardHeader className="border-b flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Workflow className="h-5 w-5 text-primary" />
            Linha do Tempo Processual
          </CardTitle>
          <CardDescription className="space-x-2">
            <span>{process.numeroCNJ}</span>
            <span>•</span>
            <span>{process.titulo}</span>
          </CardDescription>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {process.autor && (
              <span>
                <strong>Autor:</strong> {process.autor}
              </span>
            )}
            {process.reu && (
              <span>
                <strong>Réu:</strong> {process.reu}
              </span>
            )}
            {process.vara && (
              <span>
                <strong>Vara:</strong> {process.vara}
              </span>
            )}
            {process.comarca && (
              <span>
                <strong>Comarca:</strong> {process.comarca}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className="uppercase tracking-wide">
            {process.status === "ativo" ? "Ativo" : process.status}
          </Badge>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filtros
          </Button>
        </div>
      </CardHeader>

      <CardContent className="h-full p-0">
        <div className="grid h-full w-full lg:grid-cols-[320px_minmax(0,1fr)] grid-cols-1">
          {/* SIDEBAR – Linha do Tempo (equivalente à barra lateral do PJe) */}
          <div className="border-r bg-muted/40 h-full">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-4">
                {eventsByDay.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhuma movimentação cadastrada para este processo.
                  </p>
                )}

                {eventsByDay.map(([dayKey, dayEvents]) => (
                  <div key={dayKey} className="relative pl-4">
                    {/* linha vertical */}
                    <div className="absolute left-1 top-0 bottom-0 w-px bg-border" />

                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_0_4px_rgba(59,130,246,0.2)]" />
                      <span className="text-xs font-semibold text-foreground">
                        {formatDate(dayKey)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {dayEvents.map((ev) => {
                        const tipo = getTipoBadge(ev.tipo);
                        const isActive = ev.id === selectedEventId;
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => setSelectedEventId(ev.id)}
                            className={[
                              "w-full text-left rounded-md border px-3 py-2 text-xs transition-colors",
                              isActive
                                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                : "border-border bg-background hover:bg-muted/70",
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold uppercase tracking-tight">
                                {ev.titulo}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                <Clock className="inline-block h-3 w-3 mr-1" />
                                {formatTime(ev.dataHora)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <Badge
                                variant="outline"
                                className="border text-[10px]"
                                style={tipo.style}
                              >
                                {tipo.label}
                              </Badge>
                              {ev.documentoUrl && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-primary">
                                  <FileText className="h-3 w-3" />
                                  Ver documento
                                </span>
                              )}
                            </div>
                            {ev.descricao && (
                              <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                                {ev.descricao}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* PAINEL DE DOCUMENTO – Visualizador (equivalente ao PDF aberto no PJe) */}
          <div className="h-full flex flex-col">
            <Tabs defaultValue="document" className="flex-1 flex flex-col">
              <div className="border-b px-4 pt-3">
                <TabsList>
                  <TabsTrigger value="document">Documento</TabsTrigger>
                  <TabsTrigger value="meta">Detalhes</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="document"
                className="flex-1 flex flex-col overflow-hidden data-[state=inactive]:hidden"
              >
                <AnimatePresence mode="wait">
                  {selectedEvent?.documentoUrl ? (
                    <motion.div
                      key={selectedEvent.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col"
                    >
                      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">{selectedEvent.titulo}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDate(selectedEvent.dataHora)} •{" "}
                            {formatTime(selectedEvent.dataHora)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedEvent.documentoUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Abrir em nova aba
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedEvent.documentoUrl} download>
                              <Download className="h-4 w-4 mr-1" />
                              Baixar
                            </a>
                          </Button>
                        </div>
                      </div>

                      <div className="flex-1 bg-muted/30">
                        {/* Visualização via iframe para PDFs/Google Docs */}
                        <iframe
                          src={selectedEvent.documentoUrl}
                          className="w-full h-full border-0"
                          title={selectedEvent.titulo}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3"
                    >
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Nenhum documento selecionado</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Escolha uma movimentação na linha do tempo ao lado para visualizar o
                          documento correspondente.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent
                value="meta"
                className="flex-1 flex flex-col overflow-hidden data-[state=inactive]:hidden"
              >
                <ScrollArea className="flex-1">
                  <AnimatePresence mode="wait">
                    {selectedEvent ? (
                      <motion.div
                        key={selectedEvent.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 space-y-3"
                      >
                        <h3 className="text-sm font-semibold">
                          Detalhes da movimentação selecionada
                        </h3>
                        <div className="text-xs space-y-2">
                          <p>
                            <strong>Título:</strong> {selectedEvent.titulo}
                          </p>
                          <p>
                            <strong>Data/Hora:</strong> {formatDate(selectedEvent.dataHora)} às{" "}
                            {formatTime(selectedEvent.dataHora)}
                          </p>
                          {selectedEvent.tipo && (
                            <p>
                              <strong>Tipo:</strong> {getTipoBadge(selectedEvent.tipo).label}
                            </p>
                          )}
                          {selectedEvent.descricao && (
                            <p>
                              <strong>Descrição:</strong> {selectedEvent.descricao}
                            </p>
                          )}
                          {selectedEvent.tribunal && (
                            <p>
                              <strong>Tribunal:</strong> {selectedEvent.tribunal}
                            </p>
                          )}
                          {selectedEvent.orgao && (
                            <p>
                              <strong>Órgão:</strong> {selectedEvent.orgao}
                            </p>
                          )}
                          {selectedEvent.source && (
                            <p>
                              <strong>Fonte:</strong> {selectedEvent.source.toUpperCase()}
                            </p>
                          )}
                          {selectedEvent.documentoUrl && (
                            <p className="flex items-center gap-1">
                              <strong>Documento:</strong>
                              <a
                                href={selectedEvent.documentoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-primary hover:underline"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Abrir
                              </a>
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty-meta"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3"
                      >
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Nenhuma movimentação selecionada</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Selecione uma movimentação na linha do tempo para ver os detalhes.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
