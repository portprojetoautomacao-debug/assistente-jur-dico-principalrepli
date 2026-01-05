import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKV } from "@/hooks/use-kv";
import { cn } from "@/lib/utils";
import type { Expediente, Minuta, Process } from "@/types";
import { FileText, Folder, FolderOpen, Mail, MoreVertical, Search, User } from "lucide-react";
import { useState } from "react";

const STATUS_COLORS: Record<Process["status"], string> = {
  ativo: "bg-blue-100 text-blue-800 border-blue-300",
  suspenso: "bg-yellow-100 text-yellow-800 border-yellow-300",
  concluido: "bg-green-100 text-green-800 border-green-300",
  arquivado: "bg-gray-100 text-gray-800 border-gray-300",
};

interface ProcessListItemProps {
  process: Process;
  isSelected: boolean;
  onClick: () => void;
}

function ProcessListItem({ process, isSelected, onClick }: ProcessListItemProps) {
  return (
    <div
      className={cn(
        "p-3 border-b cursor-pointer transition-colors hover:bg-muted/50",
        isSelected && "bg-primary/10 border-l-4 border-l-primary"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">{process.numeroCNJ}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{process.titulo}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[process.status])}>
              {process.status}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {process.fase}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProcessDetailPanelProps {
  process: Process | null;
  expedientes: Expediente[];
  minutas: Minuta[];
}

function ProcessDetailPanel({ process, expedientes, minutas }: ProcessDetailPanelProps) {
  if (!process) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Selecione um processo para ver os detalhes</p>
        </div>
      </div>
    );
  }

  const processExpedientes = expedientes.filter(
    (e) =>
      e.processId === process.id ||
      e.numeroProcesso === process.numeroCNJ ||
      e.numeroProcesso?.replace(/\D/g, "") === process.numeroCNJ.replace(/\D/g, "")
  );

  const processMinutas = minutas.filter((m) => m.processId === process.id);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{process.numeroCNJ}</h2>
            <p className="text-sm text-muted-foreground">{process.titulo}</p>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={STATUS_COLORS[process.status]}>
            {process.status}
          </Badge>
          <Badge variant="secondary">{process.fase}</Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="geral" className="flex-1 flex flex-col">
        <div className="px-6 pt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="partes">Partes</TabsTrigger>
            <TabsTrigger value="expedientes">
              Expedientes
              {processExpedientes.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {processExpedientes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="minutas">
              Minutas
              {processMinutas.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {processMinutas.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <TabsContent value="geral" className="mt-0">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Informações do Processo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground">Comarca</label>
                        <p className="text-sm font-medium">{process.comarca || "—"}</p>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Vara</label>
                        <p className="text-sm font-medium">{process.vara || "—"}</p>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Data Distribuição</label>
                        <p className="text-sm font-medium">
                          {process.dataDistribuicao
                            ? new Date(process.dataDistribuicao).toLocaleDateString("pt-BR")
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Última Movimentação</label>
                        <p className="text-sm font-medium">
                          {process.dataUltimaMovimentacao
                            ? new Date(process.dataUltimaMovimentacao).toLocaleDateString("pt-BR")
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {process.notas && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Notas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {process.notas}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="partes" className="mt-0">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Autor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">{process.autor || "Não identificado"}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Réu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">{process.reu || "Não identificado"}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="expedientes" className="mt-0">
              {processExpedientes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum expediente encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {processExpedientes.map((exp) => (
                    <Card key={exp.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm">{exp.tipo}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {exp.data
                                ? new Date(exp.data).toLocaleDateString("pt-BR")
                                : exp.dataRecebimento
                                  ? new Date(exp.dataRecebimento).toLocaleDateString("pt-BR")
                                  : "—"}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {exp.source || exp.tribunal || "DJEN"}
                          </Badge>
                        </div>
                      </CardHeader>
                      {exp.teor && (
                        <CardContent>
                          <p className="text-xs text-muted-foreground line-clamp-3">{exp.teor}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="minutas" className="mt-0">
              {processMinutas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma minuta encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {processMinutas.map((minuta) => (
                    <Card key={minuta.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm">{minuta.titulo}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(minuta.criadoEm).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {minuta.tipo}
                            </Badge>
                            <Badge
                              variant={minuta.status === "finalizada" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {minuta.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

export default function ProcessCRMMasterDetail() {
  const [processes] = useKV<Process[]>("processes", []);
  const [expedientes] = useKV<Expediente[]>("expedientes", []);
  const [minutas] = useKV<Minuta[]>("minutas", []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);

  const selectedProcess = processes?.find((p) => p.id === selectedProcessId) || null;

  const filteredProcesses = (processes || []).filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.numeroCNJ.toLowerCase().includes(query) ||
      p.titulo.toLowerCase().includes(query) ||
      p.autor?.toLowerCase().includes(query) ||
      p.reu?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-background">
      {/* Master Panel - Process List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold mb-3">Processos</h1>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar processos..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredProcesses.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum processo encontrado</p>
            </div>
          ) : (
            filteredProcesses.map((process) => (
              <ProcessListItem
                key={process.id}
                process={process}
                isSelected={selectedProcessId === process.id}
                onClick={() => setSelectedProcessId(process.id)}
              />
            ))
          )}
        </ScrollArea>
      </div>

      {/* Detail Panel */}
      <div className="flex-1 bg-muted/30">
        <ProcessDetailPanel
          process={selectedProcess}
          expedientes={expedientes || []}
          minutas={minutas || []}
        />
      </div>
    </div>
  );
}
