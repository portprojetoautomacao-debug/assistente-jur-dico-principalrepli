import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKV } from "@/hooks/use-kv";
import { calcularDiasRestantes, formatarData, isUrgente } from "@/lib/prazos";
import { exportToCSV } from "@/lib/utils";
import type { Prazo, Process } from "@/types";
import { CalendarCheck, CheckCircle, Clock, Download as DownloadSimple } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ===== Helpers for PrazosView (reduces S3776 Cognitive Complexity) =====

type FilterType = "todos" | "pendentes" | "urgentes" | "concluidos";

function getEmptyStateMessage(filter: FilterType): string {
  const messages: Record<FilterType, string> = {
    pendentes: "Todos os prazos estão concluídos!",
    urgentes: "Nenhum prazo urgente no momento",
    concluidos: "Nenhum prazo concluído ainda",
    todos: "Adicione prazos aos seus processos",
  };
  return messages[filter];
}

function formatDiasRestantesBadge(diasRestantes: number): string {
  if (diasRestantes < 0) return "Vencido";
  if (diasRestantes === 0) return "Hoje";
  if (diasRestantes === 1) return "Amanhã";
  return `${diasRestantes} dias`;
}

// ===== Process Update Helpers (reduces S2004 nesting) =====

/**
 * Toggles the concluido status of a prazo within a process
 */
function togglePrazoConcluido(prazo: Prazo): Prazo {
  return { ...prazo, concluido: !prazo.concluido };
}

/**
 * Updates prazos array with toggled prazo
 */
function updatePrazosWithToggle(prazos: Prazo[], prazoId: string): Prazo[] {
  return prazos.map((p) => (p.id === prazoId ? togglePrazoConcluido(p) : p));
}

/**
 * Updates a single process with toggled prazo - extracted to reduce nesting (S2004)
 */
function updateProcessWithToggledPrazo(
  process: Process,
  prazoId: string,
  prazoProcessId: string
): Process {
  if (process.id !== prazoProcessId) return process;

  return {
    ...process,
    prazos: updatePrazosWithToggle(process.prazos, prazoId),
    updatedAt: new Date().toISOString(),
  };
}

export default function PrazosView() {
  const [processes, setProcesses] = useKV<Process[]>("processes", []);
  const [filter, setFilter] = useState<"todos" | "pendentes" | "urgentes" | "concluidos">(
    "pendentes"
  );

  const prazosComProcesso = useMemo(() => {
    const lista: (Prazo & { processo: Process })[] = [];
    const processesList = processes || [];

    processesList.forEach((process) => {
      if (process.prazos && Array.isArray(process.prazos)) {
        process.prazos.forEach((prazo) => {
          lista.push({ ...prazo, processo: process });
        });
      }
    });

    return lista.sort((a, b) => a.dataFinal.localeCompare(b.dataFinal, "pt-BR"));
  }, [processes]);

  const filteredPrazos = useMemo(() => {
    return prazosComProcesso.filter((prazo) => {
      const diasRestantes = calcularDiasRestantes(prazo.dataFinal);

      if (filter === "pendentes") return !prazo.concluido;
      if (filter === "concluidos") return prazo.concluido;
      if (filter === "urgentes") return !prazo.concluido && isUrgente(diasRestantes);
      return true;
    });
  }, [prazosComProcesso, filter]);

  const stats = useMemo(() => {
    const pendentes = prazosComProcesso.filter((p) => !p.concluido).length;
    const concluidos = prazosComProcesso.filter((p) => p.concluido).length;
    const urgentes = prazosComProcesso.filter(
      (p) => !p.concluido && isUrgente(calcularDiasRestantes(p.dataFinal))
    ).length;

    return { pendentes, concluidos, urgentes };
  }, [prazosComProcesso]);

  const handleToggleConcluido = (prazo: Prazo & { processo: Process }) => {
    // Use extracted helper to reduce nesting (S2004 compliance)
    setProcesses((current) =>
      (current || []).map((process) =>
        updateProcessWithToggledPrazo(process, prazo.id, prazo.processId)
      )
    );

    toast.success(prazo.concluido ? "Prazo marcado como pendente" : "Prazo concluído");
  };

  const handleExportCSV = () => {
    const exportData = prazosComProcesso.map((p) => ({
      Processo: p.processo.titulo,
      CNJ: p.processo.numeroCNJ,
      Descrição: p.descricao,
      "Data Início": p.dataInicio,
      "Dias Corridos": p.diasCorridos,
      Tipo: p.tipoPrazo === "cpc" ? "CPC" : "CLT",
      Vencimento: p.dataFinal,
      "Dias Restantes": calcularDiasRestantes(p.dataFinal),
      Status: p.concluido ? "Concluído" : "Pendente",
      Urgente: !p.concluido && isUrgente(calcularDiasRestantes(p.dataFinal)) ? "Sim" : "Não",
    }));
    exportToCSV(exportData, "prazos");
    toast.success("Prazos exportados com sucesso!");
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Prazos</h1>
          <p className="text-muted-foreground">Gerencie todos os seus prazos processuais</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <DownloadSimple size={20} />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilter("pendentes")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="text-primary" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendentes}</div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilter("urgentes")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <CalendarCheck className="text-accent" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{stats.urgentes}</div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilter("concluidos")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle className="text-primary" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.concluidos}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
          <TabsTrigger value="urgentes">Urgentes</TabsTrigger>
          <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {filteredPrazos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CalendarCheck size={64} className="text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum prazo encontrado</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {getEmptyStateMessage(filter)}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredPrazos.map((prazo) => {
                const diasRestantes = calcularDiasRestantes(prazo.dataFinal);
                const urgente = isUrgente(diasRestantes) && !prazo.concluido;

                return (
                  <Card key={prazo.id} className={urgente ? "border-accent" : ""}>
                    <CardContent className="flex items-start gap-4 p-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{prazo.descricao}</h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {prazo.processo.titulo} - {prazo.processo.numeroCNJ}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {prazo.concluido ? (
                              <Badge variant="secondary">Concluído</Badge>
                            ) : (
                              <>
                                <Badge variant={urgente ? "destructive" : "default"}>
                                  {formatDiasRestantesBadge(diasRestantes)}
                                </Badge>
                                {urgente && (
                                  <Badge variant="outline" className="text-xs">
                                    Urgente
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-muted-foreground">Data Início</span>
                            <span>{formatarData(prazo.dataInicio)}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-muted-foreground">Data Final</span>
                            <span
                              className={
                                urgente && !prazo.concluido ? "text-accent font-semibold" : ""
                              }
                            >
                              {formatarData(prazo.dataFinal)}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-muted-foreground">Prazo</span>
                            <span>
                              {prazo.diasCorridos} dias ({prazo.tipoPrazo.toUpperCase()})
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            variant={prazo.concluido ? "outline" : "default"}
                            onClick={() => handleToggleConcluido(prazo)}
                          >
                            <CheckCircle size={16} />
                            {prazo.concluido ? "Reabrir" : "Marcar como Concluído"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
