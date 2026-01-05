/**
 * MinutasManagerV2 - Nova versão do gerenciador de minutas
 *
 * Features:
 * - Layout master-detail (lista de minutas + editor)
 * - ProfessionalEditor (não TiptapEditorV2)
 * - Integração com Google Docs embed
 * - Colaboração humano/IA melhorada
 * - Sync automático com extensão Chrome
 */

import { ProfessionalEditor } from "@/components/editor/ProfessionalEditor";
import { GoogleDocsEmbed } from "@/components/GoogleDocsEmbed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAIStreaming } from "@/hooks/use-ai-streaming";
import { useKV } from "@/hooks/use-kv";
import { usePJERealTimeSync } from "@/hooks/use-pje-realtime-sync";
import { getStatusBadgeStyle } from "@/lib/themes";
import { cn } from "@/lib/utils";
import type { Minuta, Process } from "@/types";
import {
  AlertTriangle,
  Bot,
  Eye,
  FileText,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  Trash,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

type FilterStatus =
  | "all"
  | "rascunho"
  | "em-revisao"
  | "pendente-revisao"
  | "finalizada"
  | "arquivada";
type FilterTipo = "all" | "peticao" | "contrato" | "parecer" | "recurso" | "procuracao" | "outro";

export default function MinutasManagerV2() {
  const [minutas, setMinutas] = useKV<Minuta[]>("minutas", []);
  const [_processes] = useKV<Process[]>("processes", []);
  const pjeSync = usePJERealTimeSync();

  const [selectedMinutaId, setSelectedMinutaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterTipo, setFilterTipo] = useState<FilterTipo>("all");
  const [isCreating, setIsCreating] = useState(false);
  const [editMode, setEditMode] = useState<"editor" | "google-docs">("editor");

  // Hook de IA streaming
  const { streamChat, isStreaming: _isStreaming } = useAIStreaming();

  // Minuta selecionada
  const selectedMinuta = minutas?.find((m) => m.id === selectedMinutaId);

  // Filtrar minutas
  const filteredMinutas = useMemo(() => {
    let filtered = minutas || [];

    // Busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.titulo.toLowerCase().includes(query) ||
          m.conteudo.toLowerCase().includes(query) ||
          m.autor.toLowerCase().includes(query)
      );
    }

    // Filtro por status
    if (filterStatus !== "all") {
      filtered = filtered.filter((m) => m.status === filterStatus);
    }

    // Filtro por tipo
    if (filterTipo !== "all") {
      filtered = filtered.filter((m) => m.tipo === filterTipo);
    }

    // Ordenar por data de atualização (mais recente primeiro)
    return filtered.sort(
      (a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime()
    );
  }, [minutas, searchQuery, filterStatus, filterTipo]);

  // Criar nova minuta
  const handleCreateMinuta = useCallback(() => {
    const now = new Date().toISOString();
    const newMinuta: Minuta = {
      id: crypto.randomUUID(),
      titulo: "Nova minuta",
      tipo: "peticao",
      conteudo: "<p>Digite o conteúdo da minuta...</p>",
      status: "rascunho",
      criadoEm: now,
      atualizadoEm: now,
      autor: "Usuário",
    };

    setMinutas([...(minutas || []), newMinuta]);
    setSelectedMinutaId(newMinuta.id);
    setIsCreating(false);
    toast.success("Nova minuta criada!");
  }, [minutas, setMinutas]);

  // Atualizar conteúdo da minuta
  const handleContentChange = useCallback(
    (content: string) => {
      if (!selectedMinuta) return;

      const updated: Minuta = {
        ...selectedMinuta,
        conteudo: content,
        atualizadoEm: new Date().toISOString(),
      };

      setMinutas(minutas?.map((m) => (m.id === selectedMinuta.id ? updated : m)) || []);
    },
    [selectedMinuta, minutas, setMinutas]
  );

  // Atualizar título da minuta
  const handleTitleChange = useCallback(
    (titulo: string) => {
      if (!selectedMinuta) return;

      const updated: Minuta = {
        ...selectedMinuta,
        titulo,
        atualizadoEm: new Date().toISOString(),
      };

      setMinutas(minutas?.map((m) => (m.id === selectedMinuta.id ? updated : m)) || []);
    },
    [selectedMinuta, minutas, setMinutas]
  );

  // Atualizar status da minuta
  const handleStatusChange = useCallback(
    (status: Minuta["status"]) => {
      if (!selectedMinuta) return;

      const updated: Minuta = {
        ...selectedMinuta,
        status,
        atualizadoEm: new Date().toISOString(),
      };

      setMinutas(minutas?.map((m) => (m.id === selectedMinuta.id ? updated : m)) || []);
      toast.success(`Status alterado para: ${status}`);
    },
    [selectedMinuta, minutas, setMinutas]
  );

  // Deletar minuta
  const handleDeleteMinuta = useCallback(
    (id: string) => {
      setMinutas(minutas?.filter((m) => m.id !== id) || []);
      if (selectedMinutaId === id) {
        setSelectedMinutaId(null);
      }
      toast.success("Minuta excluída!");
    },
    [minutas, setMinutas, selectedMinutaId]
  );

  // Geração com IA (streaming)
  const handleAIStream = useCallback(
    async (
      prompt: string,
      callbacks: {
        onChunk: (chunk: string) => void;
        onComplete: () => void;
        onError: (error: Error) => void;
      }
    ) => {
      try {
        await streamChat([
          {
            role: "system",
            content:
              "Você é um advogado brasileiro experiente. Escreva em português formal e técnico.",
          },
          { role: "user", content: prompt },
        ]);
        callbacks.onComplete();
      } catch (error) {
        callbacks.onError(error instanceof Error ? error : new Error("Erro desconhecido"));
      }
    },
    [streamChat]
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-background">
      {/* PAINEL ESQUERDO - MASTER (Lista de Minutas) */}
      <div className="w-96 border-r flex flex-col">
        {/* Header com busca */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Minutas
            </h1>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Minuta</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Button onClick={handleCreateMinuta} className="w-full">
                    Criar Minuta em Branco
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar minutas..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-2 gap-2">
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="em-revisao">Em Revisão</SelectItem>
                <SelectItem value="pendente-revisao">Pendente</SelectItem>
                <SelectItem value="finalizada">Finalizada</SelectItem>
                <SelectItem value="arquivada">Arquivada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as FilterTipo)}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="peticao">Petição</SelectItem>
                <SelectItem value="contrato">Contrato</SelectItem>
                <SelectItem value="parecer">Parecer</SelectItem>
                <SelectItem value="recurso">Recurso</SelectItem>
                <SelectItem value="procuracao">Procuração</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Indicador de sync PJe */}
          {pjeSync.isConnected && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Extensão PJe conectada
            </div>
          )}
        </div>

        {/* Lista de minutas */}
        <ScrollArea className="flex-1">
          {filteredMinutas.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma minuta encontrada</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {filteredMinutas.map((minuta) => (
                <button
                  key={minuta.id}
                  onClick={() => setSelectedMinutaId(minuta.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    selectedMinutaId === minuta.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border bg-background hover:bg-muted/70"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm line-clamp-2">{minuta.titulo}</h3>
                      {minuta.criadoPorAgente && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          <Bot className="h-3 w-3 mr-1" />
                          IA
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" style={getStatusBadgeStyle(minuta.status)}>
                        {minuta.status}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {minuta.tipo}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Atualizada: {new Date(minuta.atualizadoEm).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* PAINEL DIREITO - DETAIL (Editor) */}
      <div className="flex-1 flex flex-col">
        {!selectedMinuta ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Selecione uma minuta para editar</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header da minuta */}
            <div className="p-6 border-b space-y-4">
              <div className="flex items-start justify-between gap-4">
                <Input
                  value={selectedMinuta.titulo}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-xl font-bold border-0 p-0 focus-visible:ring-0"
                  placeholder="Título da minuta"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={selectedMinuta.status}
                    onValueChange={(v) => handleStatusChange(v as Minuta["status"])}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="em-revisao">Em Revisão</SelectItem>
                      <SelectItem value="pendente-revisao">Pendente</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                      <SelectItem value="arquivada">Arquivada</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMinuta(selectedMinuta.id)}
                    title="Excluir minuta"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Criada por: {selectedMinuta.autor}</span>
                <span>•</span>
                <span>{new Date(selectedMinuta.criadoEm).toLocaleDateString("pt-BR")}</span>
                {selectedMinuta.processId && (
                  <>
                    <span>•</span>
                    <span>Processo: {selectedMinuta.processId}</span>
                  </>
                )}
              </div>
            </div>

            {/* Tabs: Editor | Google Docs */}
            <Tabs
              value={editMode}
              onValueChange={(v) => setEditMode(v as typeof editMode)}
              className="flex-1 flex flex-col"
            >
              <div className="border-b px-6 pt-4">
                <TabsList>
                  <TabsTrigger value="editor" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="google-docs" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Google Docs
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="editor" className="flex-1 m-0 data-[state=inactive]:hidden">
                <ProfessionalEditor
                  content={selectedMinuta.conteudo}
                  onChange={handleContentChange}
                  placeholder="Digite o conteúdo da minuta..."
                  onAIStream={handleAIStream}
                  className="h-full"
                />
              </TabsContent>

              <TabsContent value="google-docs" className="flex-1 m-0 data-[state=inactive]:hidden">
                {selectedMinuta.googleDocsId && selectedMinuta.googleDocsUrl ? (
                  <GoogleDocsEmbed
                    docId={selectedMinuta.googleDocsId}
                    docUrl={selectedMinuta.googleDocsUrl}
                    title={selectedMinuta.titulo}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Esta minuta ainda não está sincronizada com o Google Docs</p>
                      <Button className="mt-4">Criar documento no Google Docs</Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
