import PremonicaoModal from "@/components/PremonicaoModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKV } from "@/hooks/use-kv";
import { useProcessSync } from "@/hooks/use-process-sync";
import { config } from "@/lib/config";
import { extractPartiesWithFallback } from "@/lib/extract-parties-service";
import { generatePremonicaoJuridica } from "@/lib/premonicao-service";
import { createProcessTasks, initializeTodoistClient } from "@/lib/todoist-integration";
import type { Expediente, PremonicaoJuridica, Process } from "@/types";
import { Bot, FileText, Mail, Plus, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const PROCESS_STAGES = ["Inicial", "Instrução", "Sentença", "Recurso", "Execução"];
const STATUS_COLORS: Record<string, string> = {
  ativo: "bg-blue-100 text-blue-800 border-blue-300",
  suspenso: "bg-yellow-100 text-yellow-800 border-yellow-300",
  concluido: "bg-green-100 text-green-800 border-green-300",
  arquivado: "bg-gray-100 text-gray-800 border-gray-300",
};

// ===========================
// Helper Functions
// ===========================

function isProcessIncomplete(process: Process): boolean {
  const authorMissing =
    !process.autor || process.autor === "" || process.autor === "Não identificado";
  const defendantMissing = !process.reu || process.reu === "" || process.reu === "Não identificado";
  return authorMissing || defendantMissing;
}

function processMatchesFilter(process: Process, filter: string): boolean {
  if (!filter) return true;
  const lowerFilter = filter.toLowerCase();
  return (
    process.numeroCNJ.toLowerCase().includes(lowerFilter) ||
    process.titulo.toLowerCase().includes(lowerFilter) ||
    process.autor.toLowerCase().includes(lowerFilter)
  );
}

function processMatchesStage(process: Process, selectedStage: string | null): boolean {
  return !selectedStage || process.fase === selectedStage;
}

function getStatusColorClass(status: string): string {
  return STATUS_COLORS[status] || "bg-gray-100 text-gray-800 border-gray-300";
}

function findExpedienteForProcess(
  expedientes: Expediente[],
  process: Process
): Expediente | undefined {
  return expedientes.find(
    (e) =>
      e.processId === process.id ||
      e.numeroProcesso === process.numeroCNJ ||
      e.numeroProcesso?.replaceAll(/\D/g, "") === process.numeroCNJ.replaceAll(/\D/g, "")
  );
}

function getExpedienteTeor(expediente: Expediente | undefined, process: Process): string {
  if (!expediente) return process.notas || "";
  return expediente.teor || expediente.content || expediente.conteudo || process.notas || "";
}

function shouldUpdateParties(autor: string | undefined, reu: string | undefined): boolean {
  const authorValid = autor && autor !== "Não identificado";
  const defendantValid = reu && reu !== "Não identificado";
  return !!(authorValid || defendantValid);
}

export default function ProcessCRM() {
  const [processes, setProcesses] = useKV<Process[]>("processes", []);
  const [expedientes] = useKV<Expediente[]>("expedientes", []);
  const { syncProcessStats } = useProcessSync();
  const [filter, setFilter] = useState("");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [updatingParties, setUpdatingParties] = useState(false);
  const [newProcess, setNewProcess] = useState({
    numeroCNJ: "",
    titulo: "",
    autor: "",
    reu: "",
    advogado: "",
    fase: "Inicial",
  });

  // Sincronizar contadores ao montar e quando expedientes/minutas mudarem
  useEffect(() => {
    const timer = setTimeout(() => {
      syncProcessStats();
    }, 1000);
    return () => clearTimeout(timer);
  }, [syncProcessStats]);

  const [premonicaoOpen, setPremonicaoOpen] = useState(false);
  const [premonicaoLoading, setPremonicaoLoading] = useState(false);
  const [premonicaoData, setPremonicaoData] = useState<PremonicaoJuridica | null>(null);
  const [premonicaoError, setPremonicaoError] = useState<string | null>(null);

  // Conta processos sem autor/réu preenchidos
  const incompleteProcesses = (processes || []).filter(isProcessIncomplete);

  const filteredProcesses = (processes || []).filter((p) => {
    return processMatchesFilter(p, filter) && processMatchesStage(p, selectedStage);
  });

  const handleAddProcess = async () => {
    if (!newProcess.numeroCNJ || !newProcess.titulo) {
      toast.error("CNJ e título são obrigatórios");
      return;
    }

    const now = new Date().toISOString();
    const process: Process = {
      id: crypto.randomUUID(),
      numeroCNJ: newProcess.numeroCNJ,
      titulo: newProcess.titulo,
      autor: newProcess.autor,
      reu: newProcess.reu,
      comarca: "",
      vara: "",
      status: "ativo",
      fase: newProcess.fase,
      dataDistribuicao: now.split("T")[0],
      dataUltimaMovimentacao: now,
      prazos: [],
      createdAt: now,
      updatedAt: now,
    };

    setProcesses((current) => [...(current || []), process]);

    // Integração com Todoist
    if (config.todoist.apiKey) {
      try {
        initializeTodoistClient(config.todoist.apiKey);
        await createProcessTasks({
          number: process.numeroCNJ,
          type: process.titulo,
          deadlines: [
            {
              type: "Análise Inicial",
              date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // +2 dias
              description: "Analisar processo recém cadastrado",
            },
          ],
        });
        toast.success("Tarefas criadas no Todoist!");
      } catch (error) {
        console.error("Erro ao criar tarefas no Todoist:", error);
        toast.error("Erro na integração com Todoist");
      }
    }

    setShowDialog(false);
    setNewProcess({
      numeroCNJ: "",
      titulo: "",
      autor: "",
      reu: "",
      advogado: "",
      fase: "Inicial",
    });
    toast.success("Processo adicionado com sucesso");
  };

  const handleStatusChange = (processId: string, newStatus: Process["status"]) => {
    setProcesses((current) =>
      (current || []).map((p) =>
        p.id === processId ? { ...p, status: newStatus, updatedAt: new Date().toISOString() } : p
      )
    );
    toast.success("Status atualizado");
  };

  const handlePremonicao = async (process: Process) => {
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

  // Atualiza partes (autor/réu) de processos incompletos usando IA
  const handleUpdateIncompleteParties = async () => {
    if (incompleteProcesses.length === 0) {
      toast.info("Todos os processos já têm autor e réu preenchidos");
      return;
    }

    setUpdatingParties(true);
    toast.info(`Atualizando ${incompleteProcesses.length} processos...`, {
      description: "Extraindo partes dos expedientes com IA",
    });

    let updated = 0;
    const updatedProcesses = [...(processes || [])];

    for (const process of incompleteProcesses) {
      // Busca expediente vinculado ao processo para extrair o teor
      const expediente = findExpedienteForProcess(expedientes || [], process);
      const teor = getExpedienteTeor(expediente, process);

      if (!teor) {
        console.log(
          `[UpdateParties] Sem teor para extrair partes do processo ${process.numeroCNJ}`
        );
        continue;
      }

      try {
        const parties = await extractPartiesWithFallback(teor);

        // Só atualiza se encontrou algo diferente de "Não identificado"
        if (shouldUpdateParties(parties.autor, parties.reu)) {
          const idx = updatedProcesses.findIndex((p) => p.id === process.id);
          if (idx >= 0) {
            updatedProcesses[idx] = {
              ...updatedProcesses[idx],
              autor: parties.autor || updatedProcesses[idx].autor || "Não identificado",
              reu: parties.reu || updatedProcesses[idx].reu || "Não identificado",
              updatedAt: new Date().toISOString(),
            };
            updated++;
          }
        }
      } catch (error) {
        console.error(`[UpdateParties] Erro no processo ${process.numeroCNJ}:`, error);
      }
    }

    setProcesses(updatedProcesses);
    setUpdatingParties(false);

    if (updated > 0) {
      toast.success(`${updated} processo(s) atualizado(s)!`, {
        description: "As partes foram extraídas com sucesso",
      });
    } else {
      toast.warning("Nenhum processo foi atualizado", {
        description: "Não foi possível extrair partes dos expedientes",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header com título e ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Acervo de Processos</h1>
          <p className="text-muted-foreground mt-1">Gestão visual CRM do fluxo de processos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {incompleteProcesses.length > 0 && (
            <Button
              variant="outline"
              onClick={handleUpdateIncompleteParties}
              disabled={updatingParties}
            >
              <Bot className="w-4 h-4 mr-2" />
              {updatingParties
                ? "Atualizando..."
                : `Completar ${incompleteProcesses.length} processo(s)`}
            </Button>
          )}
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Processo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Processo</DialogTitle>
                <DialogDescription>
                  Preencha os dados do processo para adicionar ao acervo
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="numeroCNJ">Número CNJ *</Label>
                  <Input
                    id="numeroCNJ"
                    placeholder="0000000-00.0000.0.00.0000"
                    value={newProcess.numeroCNJ}
                    onChange={(e) =>
                      setNewProcess({
                        ...newProcess,
                        numeroCNJ: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="titulo">Título do Processo *</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Ação Trabalhista - Horas Extras"
                    value={newProcess.titulo}
                    onChange={(e) => setNewProcess({ ...newProcess, titulo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="autor">Autor</Label>
                  <Input
                    id="autor"
                    placeholder="Nome do autor"
                    value={newProcess.autor}
                    onChange={(e) => setNewProcess({ ...newProcess, autor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reu">Réu</Label>
                  <Input
                    id="reu"
                    placeholder="Nome do réu"
                    value={newProcess.reu}
                    onChange={(e) => setNewProcess({ ...newProcess, reu: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advogado">Advogado Responsável</Label>
                  <Input
                    id="advogado"
                    placeholder="Nome do advogado"
                    value={newProcess.advogado}
                    onChange={(e) => setNewProcess({ ...newProcess, advogado: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fase">Fase Processual</Label>
                  <Select
                    value={newProcess.fase}
                    onValueChange={(value) => setNewProcess({ ...newProcess, fase: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROCESS_STAGES.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddProcess}>Adicionar Processo</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por CNJ, título ou parte..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={selectedStage || "all"}
          onValueChange={(value) => setSelectedStage(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todas as fases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fases</SelectItem>
            {PROCESS_STAGES.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {stage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid de cards de processos */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        data-testid="process-grid"
      >
        {filteredProcesses.map((process) => (
          <Card
            key={process.id}
            className="hover:shadow-lg transition-shadow flex flex-col"
            data-testid="process-card"
          >
            <CardHeader className="space-y-2 pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-semibold line-clamp-2 flex-1">
                  {process.titulo}
                </CardTitle>
                <Badge className={`${getStatusColorClass(process.status)} shrink-0`}>
                  {process.status}
                </Badge>
              </div>
              <CardDescription className="text-xs font-mono">{process.numeroCNJ}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 flex flex-col">
              <div className="text-sm">
                <p className="text-muted-foreground text-xs mb-0.5">Autor:</p>
                <p className="font-medium line-clamp-1">{process.autor || "-"}</p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground text-xs mb-0.5">Réu:</p>
                <p className="font-medium line-clamp-1">{process.reu || "-"}</p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground text-xs mb-0.5">Fase:</p>
                <Badge variant="outline" className="text-xs">
                  {process.fase || "N/A"}
                </Badge>
              </div>
              {/* Contadores de documentos vinculados */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {(process.expedientesCount ?? 0) > 0 && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Mail className="w-3 h-3" />
                    {process.expedientesCount}
                  </Badge>
                )}
                {(process.intimacoesCount ?? 0) > 0 && (
                  <Badge variant="destructive" className="text-xs gap-1">
                    ⚠️ {process.intimacoesCount}
                  </Badge>
                )}
                {(process.minutasCount ?? 0) > 0 && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <FileText className="w-3 h-3" />
                    {process.minutasCount}
                  </Badge>
                )}
              </div>
              <div className="mt-auto pt-3 space-y-2">
                <Select
                  value={process.status}
                  onValueChange={(value) =>
                    handleStatusChange(process.id, value as Process["status"])
                  }
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => handlePremonicao(process)}
                >
                  <Sparkles className="w-4 h-4" />
                  Premonição Jurídica
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estado vazio */}
      {filteredProcesses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Nenhum processo encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filter || selectedStage
                ? "Tente ajustar os filtros"
                : "Adicione seu primeiro processo"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Premonição */}
      <PremonicaoModal
        isOpen={premonicaoOpen}
        onClose={() => setPremonicaoOpen(false)}
        isLoading={premonicaoLoading}
        data={premonicaoData}
        error={premonicaoError}
      />
    </div>
  );
}
