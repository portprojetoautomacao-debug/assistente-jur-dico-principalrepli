/**
 * AcervoPJe - Layout master-detail estilo PJe
 *
 * Features:
 * - Sidebar 320px com lista de processos
 * - Header com título e contador
 * - Barra de busca
 * - Filtros: Todos, Ativos, Urgentes
 * - Badges de status/fase nos processos
 * - Indicador de urgência (bolinha vermelha pulsante)
 * - Highlight do processo selecionado
 * - Painel principal com ProcessTimelineViewer
 * - Estado vazio quando nenhum processo selecionado
 */

import ProcessTimelineViewer from "@/components/ProcessTimelineViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useKV } from "@/hooks/use-kv";
import { cn } from "@/lib/utils";
import type { Process, ProcessEvent } from "@/types";
import { FolderOpen, MagnifyingGlass } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { getStatusBadgeStyle } from "@/lib/themes";

type FilterType = "all" | "active" | "urgent";

// Constants
const SIDEBAR_WIDTH = "w-80"; // 320px (20 * 16px = 320px in Tailwind)

export function AcervoPJe() {
  const [processes] = useKV<Process[]>("processes", []);
  const [processEvents] = useKV<ProcessEvent[]>("processEvents", []);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Filtrar processos
  const filteredProcesses = useMemo(() => {
    let filtered = processes;

    // Aplicar busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.numeroCNJ.toLowerCase().includes(query) ||
          p.titulo.toLowerCase().includes(query) ||
          p.autor.toLowerCase().includes(query) ||
          p.reu.toLowerCase().includes(query)
      );
    }

    // Aplicar filtro
    switch (activeFilter) {
      case "active":
        filtered = filtered.filter((p) => p.status === "ativo");
        break;
      case "urgent":
        filtered = filtered.filter((p) => {
          // Processo urgente se tiver prazo urgente
          return p.prazos.some((prazo) => prazo.urgente && !prazo.concluido);
        });
        break;
      default:
        // "all" - não filtra
        break;
    }

    // Ordenar por data de última movimentação (mais recente primeiro)
    return filtered.sort(
      (a, b) =>
        new Date(b.dataUltimaMovimentacao).getTime() - new Date(a.dataUltimaMovimentacao).getTime()
    );
  }, [processes, searchQuery, activeFilter]);

  // Processo selecionado
  const selectedProcess = useMemo(
    () => processes.find((p) => p.id === selectedProcessId),
    [processes, selectedProcessId]
  );

  // Eventos do processo selecionado
  const selectedProcessEvents = useMemo(
    () =>
      selectedProcessId
        ? processEvents
            .filter((e) => e.processId === selectedProcessId)
            .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
        : [],
    [processEvents, selectedProcessId]
  );

  // Verificar se processo tem prazo urgente
  const isProcessUrgent = (process: Process): boolean => {
    return process.prazos.some((prazo) => prazo.urgente && !prazo.concluido);
  };

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar - Lista de Processos */}
      <div className={cn(SIDEBAR_WIDTH, "flex flex-col border-r border-border bg-card/50")}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="h-5 w-5 text-primary" weight="duotone" />
            <h2 className="text-lg font-semibold">Acervo PJe</h2>
            <Badge variant="secondary" className="ml-auto">
              {filteredProcesses.length}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Gestão de processos em tempo real</p>
        </div>

        {/* Busca */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar processos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex gap-2">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => setActiveFilter("all")}
            >
              Todos
            </Button>
            <Button
              variant={activeFilter === "active" ? "default" : "outline"}
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => setActiveFilter("active")}
            >
              Ativos
            </Button>
            <Button
              variant={activeFilter === "urgent" ? "default" : "outline"}
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => setActiveFilter("urgent")}
            >
              Urgentes
            </Button>
          </div>
        </div>

        {/* Lista de Processos */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredProcesses.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Nenhum processo encontrado" : "Nenhum processo no acervo"}
                </p>
              </div>
            ) : (
              filteredProcesses.map((process) => {
                const isSelected = selectedProcessId === process.id;
                const isUrgent = isProcessUrgent(process);

                return (
                  <button
                    key={process.id}
                    onClick={() => setSelectedProcessId(process.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      "hover:bg-accent/50 hover:border-primary/30",
                      isSelected
                        ? "bg-primary/10 border-primary shadow-sm"
                        : "bg-card border-border"
                    )}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {/* Indicador de urgência */}
                      {isUrgent && (
                        <span
                          className="w-2 h-2 rounded-full bg-red-500 mt-1.5 animate-pulse"
                          title="Processo com prazo urgente"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge style={getStatusBadgeStyle(process.status)}>
                            {process.status}
                          </Badge>
                          {process.fase && (
                            <Badge variant="outline" className="text-xs">
                              {process.fase}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-sm truncate">{process.titulo}</h3>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mb-1">
                      {process.numeroCNJ}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{process.autor}</span>
                      {process.expedientesCount && process.expedientesCount > 0 && (
                        <Badge variant="secondary" className="text-xs h-5">
                          {process.expedientesCount} exp.
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Painel Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedProcess ? (
          <ProcessTimelineViewer process={selectedProcess} events={selectedProcessEvents} />
        ) : (
          <Card className="flex-1 flex items-center justify-center bg-muted/5 border-dashed">
            <CardContent className="text-center py-12">
              <FolderOpen
                className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4"
                weight="duotone"
              />
              <h3 className="text-lg font-semibold mb-2">Selecione um processo</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Escolha um processo na lista ao lado para visualizar sua linha do tempo, eventos e
                documentos
              </p>
              <Separator className="my-6" />
              <div className="grid grid-cols-3 gap-4 text-left max-w-md mx-auto">
                <div>
                  <div className="text-2xl font-bold text-primary">{processes.length}</div>
                  <div className="text-xs text-muted-foreground">Total de processos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {processes.filter((p) => p.status === "ativo").length}
                  </div>
                  <div className="text-xs text-muted-foreground">Ativos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {
                      processes.filter((p) =>
                        p.prazos.some((prazo) => prazo.urgente && !prazo.concluido)
                      ).length
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">Urgentes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default AcervoPJe;
