import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKV } from "@/hooks/use-kv";
import type { Process } from "@/types";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, X } from "@phosphor-icons/react";
import { DollarSign, FileText, Filter, MoreVertical, Search, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PROCESS_PHASES = [
  "Marketing",
  "Negociação",
  "Consultoria",
  "Administrativo",
  "Judicial",
  "Recursal",
  "Execução",
  "Financeiro",
  "Arquivamento",
];

const KANBAN_COLUMNS = [
  "Aguardando Decisão do Órgão",
  "Aguardando Decisão do INSS",
  "Cobrança",
  "Aguardando Documentação",
];

interface ProcessCardData {
  id: string;
  autor: string;
  reu: string;
  tipo: string;
  numero: string;
  valor: string;
  resultado: string;
  status: "green" | "yellow" | "red";
  column: string;
  processo?: Process;
}

interface SortableCardProps {
  card: ProcessCardData;
  onOpenDetails: (card: ProcessCardData) => void;
}

function SortableCard({ card, onOpenDetails }: Readonly<SortableCardProps>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "green":
        return "bg-green-500";
      case "yellow":
        return "bg-yellow-500";
      case "red":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative overflow-hidden bg-linear-to-br from-card via-card to-card/90 border-border/50 hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing group shadow-lg hover:shadow-2xl hover:shadow-primary/10 rounded-xl"
      onClick={() => onOpenDetails(card)}
    >
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="p-4 pb-2 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(card.status)} shadow-lg`} />
              <span className="text-xs text-muted-foreground font-mono">
                {card.numero.substring(0, 20)}...
              </span>
            </div>
            <h4 className="font-bold text-sm mb-1 text-foreground">{card.autor}</h4>
            <p className="text-xs text-muted-foreground font-medium">vs. {card.reu}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 rounded-lg"
            aria-label="Opções do processo"
          >
            <MoreVertical size={18} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 relative z-10">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-primary/10 rounded-lg">
              <span className="text-xs font-semibold text-primary">{card.tipo}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500/10 rounded-lg">
                <DollarSign size={16} className="text-green-500" />
              </div>
              <span className="font-bold text-sm text-foreground">{card.valor}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-lg">
              <TrendingUp size={14} className="text-green-500" />
              <span className="text-xs font-bold text-green-500">{card.resultado}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProcessCRMAdvbox() {
  const [processes] = useKV<Process[]>("processes", []);
  const [filter, setFilter] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<string>("Administrativo");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
  const [selectedCard, setSelectedCard] = useState<ProcessCardData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cardColumnOverrides, setCardColumnOverrides] = useState<Record<string, string>>({});
  const [processCards, setProcessCards] = useState<ProcessCardData[]>([]);

  // Helper function for status color
  const getStatusColor = useCallback((status: string): "green" | "yellow" | "red" => {
    switch (status) {
      case "concluido":
        return "green";
      case "ativo":
        return "yellow";
      case "suspenso":
      case "arquivado":
        return "red";
      default:
        return "yellow";
    }
  }, []);

  // Compute process cards using useMemo instead of useEffect + setState
  const computedProcessCards = useMemo(() => {
    return (processes || []).slice(0, 8).map((p, idx) => ({
      id: p.id,
      autor: p.autor || "Não informado",
      reu: p.reu || "INSS",
      tipo: p.titulo || "Auxílio doença Previdenciário",
      numero: p.numeroCNJ,
      valor: p.valor ? p.valor.toString() : "A definir",
      resultado: p.fase || "Em análise",
      status: getStatusColor(p.status || "ativo"),
      column: cardColumnOverrides[p.id] || KANBAN_COLUMNS[idx % KANBAN_COLUMNS.length],
      processo: p,
    }));
  }, [processes, getStatusColor, cardColumnOverrides]);

  // Initialize process cards from computed values
  useEffect(() => {
    setProcessCards(computedProcessCards);
  }, [computedProcessCards]);

  const getCardsByColumn = (column: string) => {
    return processCards.filter((card) => card.column === column);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeCard = processCards.find((c) => c.id === active.id);
    const overColumn = over.id as string;

    if (activeCard && KANBAN_COLUMNS.includes(overColumn)) {
      setCardColumnOverrides((prev) => ({
        ...prev,
        [active.id as string]: overColumn,
      }));
      toast.success(`Processo movido para ${overColumn}`);
    }

    setActiveId(null);
  };

  const handleOpenDetails = (card: ProcessCardData) => {
    setSelectedCard(card);
    setDetailsOpen(true);
  };

  const activeCard = processCards.find((c) => c.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full bg-linear-to-br from-background via-background to-[#1a1d29]">
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-linear-to-r from-card/50 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar por nome, cpf, cnj, e-mail, tag ou pasta"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-[400px] pl-10 bg-background/80 backdrop-blur-sm border-border/50 rounded-xl shadow-lg"
                />
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border/50 hover:bg-primary/10 rounded-xl"
              >
                <Filter size={16} className="mr-1" />
                Filtros
              </Button>
              <Button className="bg-linear-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg shadow-primary/25 rounded-xl px-6 font-semibold hover:scale-105 transition-all">
                + NOVO PROCESSO
              </Button>
            </div>
          </div>

          {/* Phase Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {PROCESS_PHASES.map((phase) => (
              <Button
                key={phase}
                variant={selectedPhase === phase ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedPhase(phase)}
                className={
                  selectedPhase === phase
                    ? "bg-linear-to-r from-primary to-accent text-white shadow-lg shadow-primary/20 rounded-lg font-semibold"
                    : "hover:bg-primary/10 rounded-lg"
                }
              >
                {phase}
              </Button>
            ))}
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 p-6 overflow-x-auto">
          <div className="flex items-start gap-6 min-w-max mb-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-2xl font-bold text-foreground">{processCards.length}</span>
                  <span className="text-sm text-muted-foreground ml-2">Processos</span>
                </div>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign size={20} className="text-green-500" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-foreground">
                    R$ {(processCards.length * 5000).toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-red-500/10 text-red-500 border-red-500/20 font-semibold"
                >
                  0 Estagnados
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto border-border/50 hover:bg-primary/10 rounded-xl font-semibold"
            >
              Mover etapas em massa
            </Button>
          </div>

          <div className="flex items-start gap-6 min-w-max">
            {KANBAN_COLUMNS.map((column) => {
              const cards = getCardsByColumn(column);
              return (
                <div key={column} className="w-[320px] shrink-0">
                  {/* Column Header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between p-4 bg-linear-to-r from-card/80 to-card rounded-t-2xl border border-border/50 shadow-lg backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-linear-to-br from-primary to-accent rounded-full shadow-lg shadow-primary/30 animate-pulse"></div>
                        <span className="font-bold text-sm text-foreground">{column}</span>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">
                        {cards.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Droppable Area */}
                  <SortableContext
                    items={cards.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                    id={column}
                  >
                    <div className="space-y-4 min-h-[300px] p-4 rounded-2xl bg-linear-to-br from-muted/10 via-muted/5 to-transparent border-2 border-dashed border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all">
                      {cards.map((card) => (
                        <SortableCard key={card.id} card={card} onOpenDetails={handleOpenDetails} />
                      ))}
                      {cards.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                          Arraste os cards aqui
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>
        </div>

        {/* Process Details Modal */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="bg-card border-border max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-xl">Detalhes do Processo</DialogTitle>
                  <DialogDescription>{selectedCard?.numero}</DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDetailsOpen(false)}
                  aria-label="Fechar detalhes"
                >
                  <X size={20} />
                </Button>
              </div>
            </DialogHeader>

            {selectedCard && (
              <Tabs defaultValue="info" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
                  <TabsTrigger value="docs">Documentos</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Autor</p>
                      <p className="text-base">{selectedCard.autor}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Réu</p>
                      <p className="text-base">{selectedCard.reu}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tipo de Ação</p>
                      <p className="text-base">{selectedCard.tipo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Valor da Causa</p>
                      <p className="text-base">{selectedCard.valor}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Resultado Provável
                      </p>
                      <Badge variant="secondary">{selectedCard.resultado}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(selectedCard.status)}`}
                        ></div>
                        <span className="capitalize">{selectedCard.status}</span>
                      </div>
                    </div>
                  </div>

                  {selectedCard.processo && (
                    <div className="space-y-2 border-t border-border pt-4">
                      <p className="text-sm font-medium text-muted-foreground">Comarca</p>
                      <p className="text-base">
                        {selectedCard.processo.comarca || "Não informado"}
                      </p>

                      <p className="text-sm font-medium text-muted-foreground mt-3">Vara</p>
                      <p className="text-base">{selectedCard.processo.vara || "Não informado"}</p>

                      <p className="text-sm font-medium text-muted-foreground mt-3">
                        Data de Distribuição
                      </p>
                      <p className="text-base">
                        {new Date(selectedCard.processo.dataDistribuicao).toLocaleDateString(
                          "pt-BR"
                        )}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="timeline" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar size={20} className="text-primary mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Processo distribuído</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedCard.processo &&
                            new Date(selectedCard.processo.dataDistribuicao).toLocaleDateString(
                              "pt-BR"
                            )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileText size={20} className="text-primary mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Última movimentação</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedCard.processo &&
                            new Date(
                              selectedCard.processo.dataUltimaMovimentacao
                            ).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="docs" className="mt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhum documento anexado</p>
                    <Button className="mt-4" variant="outline">
                      Adicionar Documento
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeCard && (
            <Card className="bg-card border-primary opacity-80 w-[300px]">
              <CardHeader className="p-4 pb-2">
                <h4 className="font-medium text-sm">{activeCard.autor}</h4>
              </CardHeader>
            </Card>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
