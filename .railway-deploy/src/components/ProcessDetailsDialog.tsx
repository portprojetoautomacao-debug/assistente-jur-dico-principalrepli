import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProcessSync } from "@/hooks/use-process-sync";
import { useTimelineSync } from "@/hooks/use-timeline-sync";
import { calcularDiasRestantes, formatarData, formatarMoeda, isUrgente } from "@/lib/prazos";
import { generatePremonicaoJuridica } from "@/lib/premonicao-service";
import type { PremonicaoJuridica, Process } from "@/types";
import { CalendarCheck, FileText, GitBranch, Mail, Pencil, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DocumentUploader from "./DocumentUploader";
import PremonicaoModal from "./PremonicaoModal";
import ProcessTimelineViewer from "./ProcessTimelineViewer";

// Helper: mapeia status do processo para variant do Badge (S3358)
function getProcessStatusVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "ativo") return "default";
  if (status === "concluido") return "secondary";
  if (status === "suspenso") return "outline";
  return "destructive";
}

// Helper: formata dias restantes para exibição (S3358)
function formatDiasRestantes(dias: number): string {
  if (dias < 0) return "Vencido";
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  return `${dias}d`;
}

interface ProcessDetailsDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly process: Process | null;
  readonly onEdit: (process: Process) => void;
  readonly onDelete: (id: string) => void;
}

export default function ProcessDetailsDialog({
  open,
  onOpenChange,
  process,
  onEdit,
  onDelete,
}: Readonly<ProcessDetailsDialogProps>) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [premonicaoOpen, setPremonicaoOpen] = useState(false);
  const [premonicaoLoading, setPremonicaoLoading] = useState(false);
  const [premonicaoData, setPremonicaoData] = useState<PremonicaoJuridica | null>(null);
  const [premonicaoError, setPremonicaoError] = useState<string | null>(null);
  const { getExpedientesForProcess, getMinutasForProcess } = useProcessSync();

  // Hook de sincronização automática da timeline (atualiza a cada 30s)
  const {
    events: timelineEvents,
    newEventsCount,
    markAsRead,
    lastUpdate,
    refresh,
  } = useTimelineSync({
    processId: process?.id,
    autoRefresh: open, // Só atualiza quando dialog está aberto
    refreshInterval: 30000, // 30 segundos
  });

  if (!process) return null;

  // Obter expedientes e minutas vinculados ao processo
  const expedientesVinculados = getExpedientesForProcess(process.id);
  const minutasVinculadas = getMinutasForProcess(process.id);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    onDelete(process.id);
    setDeleteDialogOpen(false);
    toast.success("Processo excluído");
  };

  const handlePremonicao = async () => {
    setPremonicaoOpen(true);
    setPremonicaoLoading(true);
    setPremonicaoError(null);
    setPremonicaoData(null);

    try {
      const data = await generatePremonicaoJuridica(process.numeroCNJ, process);
      setPremonicaoData(data);
    } catch (error) {
      setPremonicaoError(error instanceof Error ? error.message : "Erro desconhecido");
      toast.error("Erro ao gerar premonição jurídica");
    } finally {
      setPremonicaoLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="flex-1">{process.titulo}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handlePremonicao}>
                <Sparkles size={16} />
                Premonição
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onEdit(process);
                  onOpenChange(false);
                }}
              >
                <Pencil size={16} />
                Editar
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDeleteClick}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          defaultValue="detalhes"
          className="w-full"
          onValueChange={(value) => {
            // Marca como lido quando usuário abre a tab Timeline
            if (value === "timeline" && newEventsCount > 0) {
              markAsRead();
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="timeline" className="relative">
              <GitBranch size={16} className="mr-1" />
              Timeline
              {newEventsCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] animate-pulse"
                >
                  {newEventsCount}
                </Badge>
              )}
              {lastUpdate && <span className="ml-1 text-[10px] text-muted-foreground">•</span>}
            </TabsTrigger>
            <TabsTrigger value="prazos">
              <CalendarCheck size={16} className="mr-1" />
              {process.prazos?.length > 0 ? `(${process.prazos.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="expedientes">
              <Mail size={16} className="mr-1" />
              {expedientesVinculados.length > 0 ? `(${expedientesVinculados.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="minutas">
              <FileText size={16} className="mr-1" />
              {minutasVinculadas.length > 0 ? `(${minutasVinculadas.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="documentos">Anexos</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Linha do Tempo do Processo</h3>
                {lastUpdate && (
                  <span className="text-xs text-muted-foreground">
                    Atualizado: {new Date(lastUpdate).toLocaleTimeString("pt-BR")}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refresh();
                  toast.success("Timeline atualizada!");
                }}
                title="Atualizar timeline manualmente"
              >
                <GitBranch size={14} className="mr-1" />
                Atualizar
              </Button>
            </div>
            <ProcessTimelineViewer process={process} events={timelineEvents} />
          </TabsContent>

          <TabsContent value="detalhes" className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant={getProcessStatusVariant(process.status)}>{process.status}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Número CNJ</p>
                <p className="font-mono text-sm">{process.numeroCNJ}</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Data de Distribuição</p>
                <p className="text-sm">{formatarData(process.dataDistribuicao)}</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Autor</p>
                <p className="text-sm">{process.autor}</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Réu</p>
                <p className="text-sm">{process.reu}</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Comarca</p>
                <p className="text-sm">{process.comarca}</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Vara</p>
                <p className="text-sm">{process.vara}</p>
              </div>

              {process.valor && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">Valor da Causa</p>
                  <p className="text-sm font-semibold">{formatarMoeda(process.valor)}</p>
                </div>
              )}
            </div>

            {process.notas && (
              <>
                <Separator />
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold">Observações</p>
                  <p className="text-sm whitespace-pre-wrap">{process.notas}</p>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="prazos" className="space-y-4">
            {process.prazos && process.prazos.length > 0 ? (
              <div className="flex flex-col gap-2">
                {process.prazos.map((prazo) => {
                  const diasRestantes = calcularDiasRestantes(prazo.dataFinal);
                  const urgente = isUrgente(diasRestantes) && !prazo.concluido;

                  return (
                    <div
                      key={prazo.id}
                      className="flex items-start justify-between gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex flex-col gap-1 flex-1">
                        <p className="font-medium text-sm">{prazo.descricao}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>Início: {formatarData(prazo.dataInicio)}</span>
                          <span>•</span>
                          <span>Final: {formatarData(prazo.dataFinal)}</span>
                          <span>•</span>
                          <span>
                            {prazo.diasCorridos} dias ({prazo.tipoPrazo.toUpperCase()})
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <PrazoStatusBadge
                          concluido={prazo.concluido}
                          urgente={urgente}
                          diasRestantes={diasRestantes}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum prazo cadastrado para este processo.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="expedientes" className="space-y-4">
            {expedientesVinculados.length > 0 ? (
              <div className="space-y-3">
                {expedientesVinculados.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={exp.tipo === "intimacao" ? "destructive" : "secondary"}>
                            {exp.tipo || "expediente"}
                          </Badge>
                          {exp.priority === "high" && (
                            <Badge variant="destructive" className="text-xs">
                              Urgente
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium line-clamp-2">
                          {exp.titulo || exp.summary || "Sem título"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatarData(
                            exp.dataRecebimento || exp.receivedAt || exp.createdAt || ""
                          )}
                        </p>
                      </div>
                      {exp.analyzed && (
                        <Badge variant="outline" className="text-xs">
                          ✓ Analisado
                        </Badge>
                      )}
                    </div>
                    {exp.suggestedAction && (
                      <p className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 rounded">
                        💡 {exp.suggestedAction}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum expediente vinculado</p>
                <p className="text-xs mt-1">
                  Expedientes serão vinculados automaticamente pelo número CNJ
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="minutas" className="space-y-4">
            {minutasVinculadas.length > 0 ? (
              <div className="space-y-3">
                {minutasVinculadas.map((min) => (
                  <div
                    key={min.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{min.tipo}</Badge>
                          <Badge
                            variant={(() => {
                              if (min.status === "finalizada") return "default";
                              if (min.status === "pendente-revisao") return "destructive";
                              return "secondary";
                            })()}
                          >
                            {min.status}
                          </Badge>
                          {min.criadoPorAgente && (
                            <Badge variant="outline" className="text-xs">
                              🤖 IA
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium line-clamp-2">{min.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Criada em {formatarData(min.criadoEm)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma minuta vinculada</p>
                <p className="text-xs mt-1">
                  Minutas podem ser criadas manualmente ou pelos agentes de IA
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documentos" className="space-y-4">
            <DocumentUploader processoId={process.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir processo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este processo? Esta ação não pode ser desfeita e todos
              os prazos associados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PremonicaoModal
        isOpen={premonicaoOpen}
        onClose={() => setPremonicaoOpen(false)}
        isLoading={premonicaoLoading}
        data={premonicaoData}
        error={premonicaoError}
      />
    </Dialog>
  );
}

function PrazoStatusBadge({
  concluido,
  urgente,
  diasRestantes,
}: Readonly<{
  concluido: boolean;
  urgente: boolean;
  diasRestantes: number;
}>) {
  if (concluido) {
    return <Badge variant="secondary">Concluído</Badge>;
  }

  return (
    <>
      <Badge variant={urgente ? "destructive" : "default"}>
        {formatDiasRestantes(diasRestantes)}
      </Badge>
      {urgente && (
        <Badge variant="outline" className="text-xs">
          Urgente
        </Badge>
      )}
    </>
  );
}
