import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProcesses } from "@/hooks/use-processes";
import { llm } from "@/lib/llm-client";
import { themeConfig } from "@/lib/themes";
import { exportToCSV } from "@/lib/utils";
import type { Process } from "@/types";
import {
  AlertCircle,
  Calendar,
  Clock,
  Download,
  Gavel,
  Grid3x3,
  List,
  MapPin,
  Plus,
  Scale,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import ProcessDetailsDialog from "./ProcessDetailsDialog";
import ProcessDialog from "./ProcessDialog";

type ViewMode = "grid" | "list";
type SortOption = "recent" | "alpha" | "value" | "status";

export default function ProcessosView() {
  const { processes, addProcess, updateProcess, deleteProcess } = useProcesses();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [comarcaFilter, setComarcaFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<Process | undefined>();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [analyzingProcess, setAnalyzingProcess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  // Get unique comarcas for filter
  const comarcas = useMemo(() => {
    const uniqueComarcas = Array.from(new Set((processes || []).map((p) => p.comarca)));
    return uniqueComarcas.sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [processes]);

  const filteredProcesses = useMemo(() => {
    let results = processes || [];

    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(
        (p) =>
          p.numeroCNJ.toLowerCase().includes(searchLower) ||
          p.titulo.toLowerCase().includes(searchLower) ||
          p.autor.toLowerCase().includes(searchLower) ||
          p.reu.toLowerCase().includes(searchLower) ||
          p.comarca.toLowerCase().includes(searchLower) ||
          p.vara.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== "all") {
      results = results.filter((p) => p.status === statusFilter);
    }

    if (comarcaFilter !== "all") {
      results = results.filter((p) => p.comarca === comarcaFilter);
    }

    // Sort results
    switch (sortBy) {
      case "alpha":
        results = [...results].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
        break;
      case "value":
        results = [...results].sort((a, b) => (b.valor || 0) - (a.valor || 0));
        break;
      case "status":
        results = [...results].sort((a, b) => a.status.localeCompare(b.status, "pt-BR"));
        break;
      case "recent":
      default:
        results = [...results].sort(
          (a, b) =>
            new Date(b.dataUltimaMovimentacao || b.dataDistribuicao).getTime() -
            new Date(a.dataUltimaMovimentacao || a.dataDistribuicao).getTime()
        );
        break;
    }

    return results;
  }, [processes, search, statusFilter, comarcaFilter, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = processes?.length || 0;
    const active = processes?.filter((p) => p.status === "ativo").length || 0;
    const archived = processes?.filter((p) => p.status === "arquivado").length || 0;
    const totalValue = processes?.reduce((sum, p) => sum + (p.valor || 0), 0) || 0;
    const urgentDeadlines =
      processes?.reduce(
        (count, p) => count + (p.prazos?.filter((pr) => pr.urgente && !pr.concluido).length || 0),
        0
      ) || 0;

    return { total, active, archived, totalValue, urgentDeadlines };
  }, [processes]);

  const handleEdit = (process: Process) => {
    setSelectedProcess(process);
    setDialogOpen(true);
  };

  const handleViewDetails = (process: Process) => {
    setSelectedProcess(process);
    setDetailsOpen(true);
  };

  const handleDelete = (processId: string) => {
    deleteProcess(processId);
    setDetailsOpen(false);
    toast.success("Processo excluído com sucesso");
  };

  const handleExportCSV = () => {
    const exportData = filteredProcesses.map((p) => ({
      ID: p.id,
      "Número CNJ": p.numeroCNJ,
      Título: p.titulo,
      Autor: p.autor,
      Réu: p.reu,
      Comarca: p.comarca,
      Vara: p.vara,
      Status: p.status,
      Valor: p.valor || 0,
      "Data Distribuição": p.dataDistribuicao,
      "Data Última Movimentação": p.dataUltimaMovimentacao,
      Notas: p.notas || "",
    }));
    exportToCSV(exportData, "processos");
    toast.success("Processos exportados com sucesso");
  };

  const handleAIAnalysis = async (process: Process) => {
    setAnalyzingProcess(process.id);

    try {
      const prompt = `Você é um assistente jurídico especializado. Analise o seguinte processo e forneça insights estratégicos:

Processo: ${process.numeroCNJ}
Título: ${process.titulo}
Autor: ${process.autor}
Réu: ${process.reu}
Status: ${process.status}
Valor: R$ ${process.valor || 0}
Notas: ${process.notas || "Nenhuma nota disponível"}

Por favor, forneça:
1. Resumo executivo do caso
2. Pontos de atenção principais
3. Riscos identificados
4. Recomendações estratégicas
5. Próximos passos sugeridos

Seja objetivo e prático, focando em insights acionáveis para o advogado.`;

      const analysis = await llm(prompt, "gpt-4o");

      const updatedNotes = `${process.notas || ""}\n\n--- ANÁLISE IA (${new Date().toLocaleString(
        "pt-BR"
      )}) ---\n${analysis}`;

      updateProcess(process.id, { notas: updatedNotes });

      toast.success("Análise IA concluída! Verifique as notas do processo.");
    } catch (error) {
      console.error("Erro na análise IA:", error);
      toast.error("Falha ao analisar processo com IA");
    } finally {
      setAnalyzingProcess(null);
    }
  };

  // Alinhado ao design system semântico em src/lib/themes.ts
  const getStatusStyle = (status: Process["status"]): React.CSSProperties => {
    const map: Record<Process["status"], string> = {
      ativo: themeConfig.colors.sucesso,
      suspenso: themeConfig.colors.alerta,
      arquivado: "hsl(0, 0%, 45%)",
      concluido: themeConfig.colors.info,
    } as const;

    const base = map[status] || themeConfig.colors.info;
    return {
      color: base,
      backgroundColor: `${base.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
      borderColor: `${base.replace("hsl", "hsla").replace(")", ", 0.20)")}`,
    };
  };

  const getStatusLabel = (status: Process["status"]) => {
    const labels = {
      ativo: "Ativo",
      suspenso: "Suspenso",
      arquivado: "Arquivado",
      concluido: "Concluído",
    };
    return labels[status] || status;
  };

  // Badge "Urgente" alinhado ao themeConfig.colors
  const getUrgenteStyle = (): React.CSSProperties => {
    const base = themeConfig.colors.urgente;
    return {
      color: base,
      backgroundColor: `${base.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
      borderColor: `${base.replace("hsl", "hsla").replace(")", ", 0.20)")}`,
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gavel size={32} className="text-primary" />
            Arquivo de Processos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciamento completo de processos judiciais
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleExportCSV} variant="outline">
            <Download size={20} className="mr-2" />
            Exportar CSV
          </Button>
          <Button
            onClick={() => {
              setSelectedProcess(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus size={20} className="mr-2" />
            Novo Processo
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">processos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Arquivados
              </CardTitle>
              <Gavel className="h-4 w-4 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.archived}</div>
            <p className="text-xs text-muted-foreground">finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Total
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">causa de pedir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Prazos</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: themeConfig.colors.urgente }}>
              {stats.urgentDeadlines}
            </div>
            <p className="text-xs text-muted-foreground">urgentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <Input
            placeholder="Buscar processos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="suspenso">Suspenso</SelectItem>
            <SelectItem value="arquivado">Arquivado</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>

        <Select value={comarcaFilter} onValueChange={setComarcaFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Comarca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas comarcas</SelectItem>
            {comarcas.map((comarca) => (
              <SelectItem key={comarca} value={comarca}>
                {comarca}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="alpha">Alfabética</SelectItem>
            <SelectItem value="value">Maior valor</SelectItem>
            <SelectItem value="status">Por status</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="secondary" className="shrink-0">
          {filteredProcesses.length} {filteredProcesses.length === 1 ? "processo" : "processos"}
        </Badge>

        {/* View Mode Toggle */}
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            size="sm"
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            onClick={() => setViewMode("grid")}
            className="px-3"
            aria-label="Visualização em grade"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === "list" ? "secondary" : "ghost"}
            onClick={() => setViewMode("list")}
            className="px-3"
            aria-label="Visualização em lista"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Process List/Grid */}
      {filteredProcesses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gavel size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {search ? "Nenhum processo encontrado" : "Nenhum processo cadastrado"}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {search
                ? "Tente ajustar os filtros ou termo de busca."
                : 'Adicione seu primeiro processo clicando no botão "Novo Processo" acima.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "grid gap-4"
          }
        >
          {filteredProcesses.map((process) => (
            <Card
              key={process.id}
              className="transition-all hover:shadow-md cursor-pointer"
              onClick={() => handleViewDetails(process)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-2 mb-2">{process.titulo}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono">{process.numeroCNJ}</p>
                  </div>
                  <Badge style={getStatusStyle(process.status)}>
                    {getStatusLabel(process.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Partes</p>
                      <p className="text-sm font-medium">
                        <span className="text-green-600">{process.autor}</span>
                        <span className="mx-1">×</span>
                        <span className="text-red-600">{process.reu}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Comarca</p>
                        <p className="text-sm font-medium line-clamp-1">{process.comarca}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Gavel className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Vara</p>
                        <p className="text-sm font-medium line-clamp-1">{process.vara}</p>
                      </div>
                    </div>
                  </div>

                  {process.valor && process.valor > 0 && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Valor da Causa</p>
                        <p className="text-sm font-bold text-blue-600">
                          {formatCurrency(process.valor)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Distribuído em{" "}
                      {new Date(process.dataDistribuicao).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  {process.dataUltimaMovimentacao && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Última movimentação:{" "}
                        {new Date(process.dataUltimaMovimentacao).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  )}
                </div>

                {process.prazos && process.prazos.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Prazos</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {process.prazos.filter((p) => !p.concluido).length} pendentes
                      </Badge>
                      {process.prazos.some((p) => p.urgente && !p.concluido) && (
                        <Badge style={getUrgenteStyle()} className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Urgente
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(process);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAIAnalysis(process);
                    }}
                    disabled={analyzingProcess === process.id}
                  >
                    <Sparkles
                      size={16}
                      className={`mr-2 ${analyzingProcess === process.id ? "animate-spin" : ""}`}
                    />
                    {analyzingProcess === process.id ? "Analisando..." : "Análise IA"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProcessDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        process={selectedProcess || undefined}
        onSave={(process) => {
          if (selectedProcess) {
            updateProcess(selectedProcess.id, process);
            toast.success("Processo atualizado com sucesso");
          } else {
            addProcess(process);
            toast.success("Processo criado com sucesso");
          }
          setDialogOpen(false);
          setSelectedProcess(undefined);
        }}
      />

      <ProcessDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        process={selectedProcess || null}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
