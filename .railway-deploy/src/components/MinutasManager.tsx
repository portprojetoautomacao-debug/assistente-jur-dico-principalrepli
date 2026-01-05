import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription as DialogDescriptionUI,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAICommands } from "@/hooks/use-ai-commands";
import { useAIStreaming } from "@/hooks/use-ai-streaming";
import { useGoogleDocs } from "@/hooks/use-google-docs";
import { useKV } from "@/hooks/use-kv";

import {
  documentTemplates,
  extractUnfilledVariables,
  replaceTemplateVariables,
  type DocumentTemplate,
} from "@/lib/document-templates";

import { callGemini, isGeminiConfigured } from "@/lib/gemini-service";
import { googleDocsService } from "@/lib/google-docs-service";
import { themeConfig } from "@/lib/themes";

import {
  createMinuta,
  updateMinuta,
  validateMinutaForFinalization,
  type MinutaInput,
} from "@/services/minuta-service";

import type { Minuta, Process } from "@/types";

import {
  AlertTriangle,
  Bot,
  CheckCircle,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Expand,
  Eye,
  FileText,
  FolderOpen,
  Grid3x3,
  List,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash,
  Wand2,
  Zap,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { toast } from "sonner";

import { ProfessionalEditor } from "@/components/editor/ProfessionalEditor";

type ViewMode = "grid" | "list";

/**
 * ✅ Google Docs config (corrigido):
 * - Usa VITE_GOOGLE_API_KEY se existir
 * - Fallback para VITE_GEMINI_API_KEY pra não quebrar seu env atual
 */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_API_KEY =
  import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "";
const isGoogleConfigured = !!GOOGLE_CLIENT_ID && !!GOOGLE_API_KEY;

export default function MinutasManager() {
  const [minutas, setMinutas] = useKV<Minuta[]>("minutas", []);
  const [processes] = useKV<Process[]>("processes", []);
  const { exportToGoogleDocs, importFromGoogleDocs, openDocument } = useGoogleDocs();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMinuta, setEditingMinuta] = useState<Minuta | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "templates" | "variaveis">("editor");

  // ✅ SEPARAR buscas (bug de UX importante)
  const [minutaSearch, setMinutaSearch] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");

  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Hook de streaming para IA
  const streamCallbacksRef = useRef<{
    onChunk?: (chunk: string) => void;
    onComplete?: () => void;
    onError?: (error: string) => void;
  }>({});

  const { streamChat } = useAIStreaming({
    onChunk: (chunk) => streamCallbacksRef.current.onChunk?.(chunk),
    onComplete: () => streamCallbacksRef.current.onComplete?.(),
    onError: (err) => {
      console.error("[MinutasManager] Erro no streaming:", err);
      toast.error("Erro no streaming de IA");
      streamCallbacksRef.current.onError?.(err);
    },
  });

  // ✅ processId = "" (sem lixo "_none")
  const [formData, setFormData] = useState({
    titulo: "",
    processId: "",
    tipo: "peticao" as Minuta["tipo"],
    conteudo: "",
    status: "rascunho" as Minuta["status"],
  });

  const {
    continuar,
    expandir,
    revisar,
    formalizar,
    isLoading: isAICommandLoading,
    error: aiCommandError,
    canRequest: canAIRequest,
    waitTime: aiWaitTime,
    checkStatus: checkAIStatus,
  } = useAICommands();

  const [activeAICommand, setActiveAICommand] = useState<string | null>(null);

  useEffect(() => {
    checkAIStatus();
  }, [checkAIStatus]);

  useEffect(() => {
    if (aiCommandError) toast.error(`Erro no comando IA: ${aiCommandError}`);
  }, [aiCommandError]);

  const handleAICommand = useCallback(
    async (
      command: "continuar" | "expandir" | "revisar" | "formalizar",
      mode: "append" | "replace"
    ) => {
      if (!formData.conteudo.trim()) {
        toast.error("Adicione algum conteúdo antes de usar os comandos de IA");
        return;
      }

      if (!canAIRequest) {
        const waitSeconds = Math.ceil(aiWaitTime / 1000);
        toast.warning(`Aguarde ${waitSeconds}s antes do próximo comando`, {
          description: "Limite de requisições atingido",
        });
        return;
      }

      setActiveAICommand(command);
      let streamedContent = "";

      const commandFn = { continuar, expandir, revisar, formalizar }[command];

      try {
        await commandFn(formData.conteudo, (chunk) => {
          streamedContent += chunk;

          if (mode === "append") {
            setFormData((prev) => ({ ...prev, conteudo: prev.conteudo + chunk }));
          } else {
            setFormData((prev) => ({ ...prev, conteudo: streamedContent }));
          }
        });

        toast.success(`Comando "${command}" executado com sucesso!`);
      } catch (err) {
        console.error(`[MinutasManager] Erro no comando ${command}:`, err);
      } finally {
        setActiveAICommand(null);
      }
    },
    [formData.conteudo, canAIRequest, aiWaitTime, continuar, expandir, revisar, formalizar]
  );

  useEffect(() => {
    const initGoogleDocs = async () => {
      if (!isGoogleConfigured) {
        setIsAuthenticated(false);
        return;
      }
      try {
        await googleDocsService.initialize();
        setIsAuthenticated(googleDocsService.isAuthenticated());
      } catch (err) {
        console.error("[MinutasManager] ❌ Google Docs init falhou:", err);
        setIsAuthenticated(false);
      }
    };
    initGoogleDocs();
  }, []);

  useEffect(() => {
    if (formData.processId) {
      const processo = (processes || []).find((p) => p.id === formData.processId);
      if (processo) {
        setVariableValues((prev) => ({
          ...prev,
          "processo.numero": processo.numeroCNJ || "",
          "processo.titulo": processo.titulo || "",
          "autor.nome": processo.autor || "",
          "reu.nome": processo.reu || "",
          comarca: processo.comarca || "",
          vara: processo.vara || "",
        }));
      }
    }
  }, [formData.processId, processes]);

  const resetForm = () => {
    setFormData({
      titulo: "",
      processId: "",
      tipo: "peticao",
      conteudo: "",
      status: "rascunho",
    });
    setSelectedTemplate(null);
    setVariableValues({});
    setActiveTab("editor");
    setTemplateSearch("");
  };

  const handleAuthGoogle = async () => {
    try {
      if (!isGoogleConfigured) {
        toast.error("Google não está configurado no ambiente (.env)");
        return;
      }

      const toastId = toast.loading("Inicializando Google Docs...");

      try {
        await googleDocsService.initialize();
        toast.success("Google Docs inicializado!", { id: toastId });
      } catch (initError) {
        const errorMsg =
          initError instanceof Error ? initError.message : "Erro ao inicializar Google Docs";
        let userMessage = errorMsg;

        if (errorMsg.includes("Timeout")) {
          userMessage = "Timeout ao carregar Google Docs. Verifique sua conexão e tente novamente.";
        } else if (errorMsg.includes("Failed to load")) {
          userMessage = "Não foi possível carregar scripts do Google. Verifique sua conexão.";
        } else if (errorMsg.toLowerCase().includes("api key")) {
          userMessage = "Credenciais do Google inválidas. Contate o suporte.";
        }

        toast.error(`Falha na inicialização: ${userMessage}`, { id: toastId });
        console.error("[MinutasManager] Google Docs init error:", initError);
        return;
      }

      const success = await googleDocsService.authenticate();
      if (success) {
        setIsAuthenticated(true);
        toast.success("Autenticado com Google Docs!");
      } else {
        toast.error(googleDocsService.getLastError() || "Falha na autenticação - verifique popups");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao autenticar: ${errorMsg}`);
      console.error("[MinutasManager] Auth error:", error);
    }
  };

  const handleCreateMinuta = async () => {
    if (!formData.titulo || !formData.conteudo) {
      toast.error("Preencha título e conteúdo");
      return;
    }

    try {
      const minutaInput: MinutaInput = {
        titulo: formData.titulo,
        processId: formData.processId || undefined,
        tipo: formData.tipo,
        conteudo: formData.conteudo,
        status: formData.status,
        autor: "current-user",
        criadoPorAgente: false,
      };

      const novaMinuta = createMinuta(minutaInput);
      setMinutas((current = []) => [...current, novaMinuta]);

      resetForm();
      setIsDialogOpen(false);
      toast.success("Minuta criada com sucesso!");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro ao criar minuta";
      toast.error(errorMsg);
    }
  };

  const handleUpdateMinuta = async () => {
    if (!editingMinuta || !formData.titulo || !formData.conteudo) {
      toast.error("Preencha título e conteúdo");
      return;
    }

    try {
      if (formData.status === "finalizada") {
        const validation = validateMinutaForFinalization({
          ...editingMinuta,
          titulo: formData.titulo,
          conteudo: formData.conteudo,
        });

        if (!validation.valid) {
          toast.error("Minuta não pode ser finalizada", {
            description: validation.errors.join(", "),
          });
          return;
        }
      }

      const minutaAtualizada = updateMinuta(editingMinuta, {
        titulo: formData.titulo,
        processId: formData.processId || undefined,
        tipo: formData.tipo,
        conteudo: formData.conteudo,
        status: formData.status,
      });

      setMinutas((current = []) =>
        current.map((m) => (m.id === editingMinuta.id ? minutaAtualizada : m))
      );

      if (minutaAtualizada.googleDocsId) {
        const syncSuccess = await googleDocsService.updateDocumentContent(
          minutaAtualizada.googleDocsId,
          minutaAtualizada.conteudo
        );
        toast[syncSuccess ? "success" : "warning"](
          syncSuccess
            ? "Minuta atualizada e sincronizada com Google Docs"
            : "Minuta atualizada, mas falha ao sincronizar com Google Docs"
        );
      } else {
        toast.success("Minuta atualizada com sucesso!");
      }

      resetForm();
      setIsDialogOpen(false);
      setEditingMinuta(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro ao atualizar minuta";
      toast.error(errorMsg);
    }
  };

  const handleEditMinuta = (minuta: Minuta) => {
    setEditingMinuta(minuta);
    setFormData({
      titulo: minuta.titulo,
      processId: minuta.processId || "",
      tipo: minuta.tipo,
      conteudo: minuta.conteudo,
      status: minuta.status,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteMinuta = (id: string) => {
    setMinutas((current = []) => current.filter((m) => m.id !== id));
    toast.success("Minuta excluída com sucesso!");
  };

  const handleApproveMinuta = (id: string) => {
    setMinutas((current = []) =>
      current.map((m) =>
        m.id === id
          ? {
              ...m,
              status: "finalizada" as Minuta["status"],
              atualizadoEm: new Date().toISOString(),
            }
          : m
      )
    );
    toast.success("Minuta aprovada e finalizada!");
  };

  const handleDuplicateMinuta = (minuta: Minuta) => {
    const duplicada = createMinuta({
      titulo: `${minuta.titulo} (Cópia)`,
      processId: minuta.processId,
      tipo: minuta.tipo,
      conteudo: minuta.conteudo,
      status: "rascunho",
      autor: "current-user",
      criadoPorAgente: false,
    });

    setMinutas((current = []) => [...current, duplicada]);
    toast.success("Minuta duplicada com sucesso!");
  };

  const handleExportPDF = (_minuta: Minuta) => toast.info("Exportação para PDF em desenvolvimento");
  const handleExportDOCX = (_minuta: Minuta) =>
    toast.info("Exportação para DOCX em desenvolvimento");

  const handleOpenInGoogleDocs = async (minuta: Minuta) => {
    if (!isAuthenticated) {
      toast.error("Autentique com Google Docs primeiro");
      return;
    }

    try {
      if (minuta.googleDocsUrl) {
        openDocument(minuta.googleDocsUrl);
        toast.success("Abrindo documento no Google Docs...");
      } else {
        const result = await exportToGoogleDocs(minuta);
        if (result) {
          setMinutas((current = []) =>
            current.map((m) =>
              m.id === minuta.id
                ? {
                    ...m,
                    googleDocsId: result.docId,
                    googleDocsUrl: result.url,
                    ultimaSincronizacao: new Date().toISOString(),
                  }
                : m
            )
          );
          openDocument(result.url);
          toast.success("Documento criado e aberto no Google Docs!");
        }
      }
    } catch {
      toast.error("Erro ao abrir no Google Docs");
    }
  };

  const handleSyncFromGoogleDocs = async (minuta: Minuta) => {
    if (!minuta.googleDocsId) return;

    setIsSyncing(minuta.id);
    try {
      const success = await importFromGoogleDocs(minuta.id, minutas || [], setMinutas);
      if (success) toast.success("Alterações importadas do Google Docs!");
    } catch {
      toast.error("Erro ao importar do Google Docs");
    } finally {
      setIsSyncing(null);
    }
  };

  const handleApplyTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setFormData((prev) => ({
      ...prev,
      titulo: template.nome,
      tipo: template.categoria as Minuta["tipo"],
      conteudo: template.conteudo,
    }));

    const initialValues: Record<string, string> = {};
    template.variaveis.forEach((v) => (initialValues[v] = variableValues[v] || ""));
    setVariableValues(initialValues);

    setActiveTab("editor");
    toast.success(`Template "${template.nome}" aplicado!`);
  };

  const handleFillVariables = () => {
    const filled = replaceTemplateVariables(formData.conteudo, variableValues);
    setFormData((prev) => ({ ...prev, conteudo: filled }));
    toast.success("Variáveis preenchidas no documento!");
  };

  const handleAIGenerate = async (prompt: string): Promise<string> => {
    if (!isGeminiConfigured()) throw new Error("Gemini não está configurado");

    const fullPrompt = `Você é um assistente jurídico especializado em redação de documentos legais brasileiros.
Sua função é ajudar na criação, edição e melhoria de petições, contratos, pareceres e outros documentos jurídicos.
Sempre use linguagem formal e técnica apropriada. Cite legislação e jurisprudência quando relevante.
Mantenha formatação HTML adequada para o editor (use <p>, <strong>, <em>, <ul>, <li>, <blockquote>).

${prompt}`;

    const response = await callGemini(fullPrompt);
    return response.text;
  };

  const handleAIStream = useCallback(
    async (
      prompt: string,
      callbacks: {
        onChunk: (chunk: string) => void;
        onComplete: () => void;
        onError: (error: Error) => void;
      }
    ) => {
      streamCallbacksRef.current = {
        onChunk: callbacks.onChunk,
        onComplete: callbacks.onComplete,
        onError: (err) => callbacks.onError(new Error(err)),
      };

      try {
        await streamChat([
          {
            role: "system",
            content: `Você é um assistente jurídico especializado em redação de documentos legais brasileiros.
Sua função é ajudar na criação, edição e melhoria de petições, contratos, pareceres e outros documentos jurídicos.
Sempre use linguagem formal e técnica apropriada. Cite legislação e jurisprudência quando relevante.
Mantenha formatação HTML adequada para o editor (use <p>, <strong>, <em>, <ul>, <li>, <blockquote>).`,
          },
          { role: "user", content: prompt },
        ]);
      } catch (err) {
        callbacks.onError(err instanceof Error ? err : new Error("Erro no streaming"));
      }
    },
    [streamChat]
  );

  // ✅ estilos tipados sem React namespace
  const getStatusStyle = (status: Minuta["status"]): CSSProperties => {
    const map: Record<Minuta["status"], string> = {
      rascunho: themeConfig.colors.alerta,
      "em-revisao": themeConfig.colors.info,
      "pendente-revisao": themeConfig.colors.alerta,
      finalizada: themeConfig.colors.sucesso,
      arquivada: "hsl(0, 0%, 45%)",
    };

    const base = map[status] || themeConfig.colors.info;
    return {
      color: base,
      backgroundColor: `${base.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
      borderColor: `${base.replace("hsl", "hsla").replace(")", ", 0.20)")}`,
    };
  };

  const getStatusLabel = (status: Minuta["status"]) =>
    (
      ({
        rascunho: "Rascunho",
        "em-revisao": "Em Revisão",
        "pendente-revisao": "Pendente Revisão",
        finalizada: "Finalizada",
        arquivada: "Arquivada",
      }) as const
    )[status] || status;

  const getTipoLabel = (tipo: Minuta["tipo"]) =>
    (
      ({
        peticao: "Petição",
        contrato: "Contrato",
        parecer: "Parecer",
        recurso: "Recurso",
        procuracao: "Procuração",
        outro: "Outro",
      }) as const
    )[tipo] || tipo;

  const getTintStyle = (base: string): CSSProperties => ({
    color: base,
    backgroundColor: `${base.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
    borderColor: `${base.replace("hsl", "hsla").replace(")", ", 0.20)")}`,
  });

  const filteredMinutas = useMemo(() => {
    const q = minutaSearch.trim().toLowerCase();
    return (minutas || []).filter((m) => {
      const matchesSearch = !q || m.titulo.toLowerCase().includes(q);
      const matchesStatus = filterStatus === "all" || m.status === filterStatus;
      const matchesTipo = filterTipo === "all" || m.tipo === filterTipo;
      return matchesSearch && matchesStatus && matchesTipo;
    });
  }, [minutas, minutaSearch, filterStatus, filterTipo]);

  const minutasPendentes = useMemo(
    () => (minutas || []).filter((m) => m.status === "pendente-revisao" || m.criadoPorAgente),
    [minutas]
  );

  const unfilledVariables = useMemo(
    () => extractUnfilledVariables(formData.conteudo),
    [formData.conteudo]
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileText className="text-primary" />
            Editor de Minutas
          </h1>
          <p className="text-muted-foreground mt-1">
            Editor rico com IA (Gemini 2.5 Pro) e sincronização com Google Docs
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {(() => {
            if (!isGoogleConfigured) {
              return (
                <Badge
                  variant="outline"
                  style={getTintStyle(themeConfig.colors.alerta)}
                  className="px-4 py-2"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Google não configurado
                </Badge>
              );
            }
            if (!isAuthenticated) {
              return (
                <Button onClick={handleAuthGoogle} variant="outline">
                  <FileText className="mr-2" />
                  Conectar Google Docs
                </Button>
              );
            }
            return (
              <Badge style={getTintStyle(themeConfig.colors.sucesso)} className="px-4 py-2">
                <FileText className="mr-2" />
                Google Conectado
              </Badge>
            );
          })()}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingMinuta(null);
                  resetForm();
                }}
              >
                <Plus className="mr-2" />
                Nova Minuta
              </Button>
            </DialogTrigger>

            {/* ✅ Modal sem overflow-y-auto + scroll só no corpo */}
            <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col bg-card p-0 overflow-hidden">
              <div className="p-6 pb-3">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {editingMinuta ? (
                      <>
                        <Pencil />
                        Editar Minuta
                      </>
                    ) : (
                      <>
                        <Plus />
                        Nova Minuta
                      </>
                    )}
                  </DialogTitle>
                  <DialogDescriptionUI>
                    Use o editor rico para criar sua minuta. Use a IA para gerar conteúdo com Gemini
                    2.5 Pro.
                  </DialogDescriptionUI>
                </DialogHeader>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as any)}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="px-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="variaveis">Variáveis</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="px-6 pb-6 pt-4">
                      <TabsContent value="editor" className="mt-0 space-y-4">
                        {/* Metadados */}
                        <Card className="border-muted">
                          <CardHeader className="py-4">
                            <CardTitle className="text-sm">Dados da minuta</CardTitle>
                            <CardDescription className="text-xs">
                              Defina título, tipo, status e vinculação (opcional)
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="md:col-span-2">
                                <Label htmlFor="titulo">Título</Label>
                                <Input
                                  id="titulo"
                                  value={formData.titulo}
                                  onChange={(e) =>
                                    setFormData((p) => ({ ...p, titulo: e.target.value }))
                                  }
                                  placeholder="Ex: Petição Inicial - Ação de Cobrança"
                                />
                              </div>

                              <div>
                                <Label htmlFor="tipo">Tipo</Label>
                                <Select
                                  value={formData.tipo}
                                  onValueChange={(value) =>
                                    setFormData((p) => ({ ...p, tipo: value as Minuta["tipo"] }))
                                  }
                                >
                                  <SelectTrigger id="tipo">
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="peticao">Petição</SelectItem>
                                    <SelectItem value="contrato">Contrato</SelectItem>
                                    <SelectItem value="parecer">Parecer</SelectItem>
                                    <SelectItem value="recurso">Recurso</SelectItem>
                                    <SelectItem value="procuracao">Procuração</SelectItem>
                                    <SelectItem value="outro">Outro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                  value={formData.status}
                                  onValueChange={(value) =>
                                    setFormData((p) => ({
                                      ...p,
                                      status: value as Minuta["status"],
                                    }))
                                  }
                                >
                                  <SelectTrigger id="status">
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="rascunho">Rascunho</SelectItem>
                                    <SelectItem value="em-revisao">Em Revisão</SelectItem>
                                    <SelectItem value="finalizada">Finalizada</SelectItem>
                                    <SelectItem value="arquivada">Arquivada</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="processo">Vincular a Processo (opcional)</Label>
                              <Select
                                value={formData.processId || "_none"}
                                onValueChange={(value) =>
                                  setFormData((p) => ({
                                    ...p,
                                    processId: value === "_none" ? "" : value,
                                  }))
                                }
                              >
                                <SelectTrigger id="processo">
                                  <SelectValue placeholder="Selecione um processo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="_none">Nenhum</SelectItem>
                                  {(processes || []).map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.numeroCNJ} - {p.titulo}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Editor */}
                        <Card className="border-muted">
                          <CardHeader className="py-4">
                            <CardTitle className="text-sm">Conteúdo</CardTitle>
                            <CardDescription className="text-xs">
                              Escreva ou gere com IA e depois refine com comandos
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="min-h-[420px]">
                              <ProfessionalEditor
                                key={editingMinuta?.id || "new-minuta"}
                                content={formData.conteudo}
                                onChange={(content) =>
                                  setFormData((p) => ({ ...p, conteudo: content }))
                                }
                                onAIGenerate={handleAIGenerate}
                                onAIStream={handleAIStream}
                                variables={variableValues}
                                placeholder="Digite o conteúdo da minuta ou use a IA para gerar com Gemini..."
                                className="h-full min-h-[420px]"
                                showCollaboration={false}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Comandos IA (mantidos) */}
                        <Card className="border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20">
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Bot className="h-4 w-4 text-purple-600" />
                              Comandos IA
                              {!isAICommandLoading && (
                                <Badge
                                  variant="secondary"
                                  className="ml-2 bg-purple-100 text-purple-700 dark:bg-purple-900/30"
                                >
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Gemini 2.5 Pro
                                </Badge>
                              )}
                              {isAICommandLoading && (
                                <Badge variant="secondary" className="ml-2">
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Processando...
                                </Badge>
                              )}
                              {!canAIRequest && aiWaitTime > 0 && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-orange-600 border-orange-500"
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  Aguarde {Math.ceil(aiWaitTime / 1000)}s
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Use os comandos abaixo para processar o texto com IA
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="py-2 px-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAICommand("continuar", "append")}
                                disabled={isAICommandLoading || !formData.conteudo.trim()}
                                className="flex flex-col items-center gap-1 h-auto py-3 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                              >
                                {activeAICommand === "continuar" ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                                ) : (
                                  <Zap className="h-4 w-4 text-purple-600" />
                                )}
                                <span className="font-medium">Continuar</span>
                                <span className="text-[10px] text-muted-foreground text-center">
                                  Continua a escrita
                                </span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAICommand("expandir", "replace")}
                                disabled={isAICommandLoading || !formData.conteudo.trim()}
                                className="flex flex-col items-center gap-1 h-auto py-3 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                              >
                                {activeAICommand === "expandir" ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                                ) : (
                                  <Expand className="h-4 w-4 text-purple-600" />
                                )}
                                <span className="font-medium">Expandir</span>
                                <span className="text-[10px] text-muted-foreground text-center">
                                  Desenvolve o texto
                                </span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAICommand("revisar", "replace")}
                                disabled={isAICommandLoading || !formData.conteudo.trim()}
                                className="flex flex-col items-center gap-1 h-auto py-3 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                              >
                                {activeAICommand === "revisar" ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                                ) : (
                                  <Sparkles className="h-4 w-4 text-purple-600" />
                                )}
                                <span className="font-medium">Revisar</span>
                                <span className="text-[10px] text-muted-foreground text-center">
                                  Melhora gramática
                                </span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAICommand("formalizar", "replace")}
                                disabled={isAICommandLoading || !formData.conteudo.trim()}
                                className="flex flex-col items-center gap-1 h-auto py-3 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                              >
                                {activeAICommand === "formalizar" ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                                ) : (
                                  <Wand2 className="h-4 w-4 text-purple-600" />
                                )}
                                <span className="font-medium">Formalizar</span>
                                <span className="text-[10px] text-muted-foreground text-center">
                                  Linguagem jurídica
                                </span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        {isAICommandLoading && (
                          <div className="flex items-center justify-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                            <span className="text-sm font-medium text-purple-600">
                              {activeAICommand === "continuar" && "Continuando escrita com IA..."}
                              {activeAICommand === "expandir" && "Expandindo texto com IA..."}
                              {activeAICommand === "revisar" && "Revisando gramática com IA..."}
                              {activeAICommand === "formalizar" &&
                                "Formalizando linguagem com IA..."}
                            </span>
                          </div>
                        )}

                        {unfilledVariables.length > 0 && (
                          <Alert style={getTintStyle(themeConfig.colors.alerta)}>
                            <AlertTriangle
                              className="h-4 w-4"
                              style={{ color: themeConfig.colors.alerta }}
                            />
                            <AlertDescription style={{ color: themeConfig.colors.alerta }}>
                              <strong>{unfilledVariables.length} variáveis não preenchidas:</strong>{" "}
                              {unfilledVariables.slice(0, 5).join(", ")}
                              {unfilledVariables.length > 5 &&
                                ` e mais ${unfilledVariables.length - 5}`}
                              <Button
                                variant="link"
                                size="sm"
                                className="ml-2"
                                style={{ color: themeConfig.colors.alerta }}
                                onClick={() => setActiveTab("variaveis")}
                              >
                                Preencher variáveis →
                              </Button>
                            </AlertDescription>
                          </Alert>
                        )}
                      </TabsContent>

                      <TabsContent value="templates" className="mt-0">
                        <div className="space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar templates..."
                              className="pl-9"
                              value={templateSearch}
                              onChange={(e) => setTemplateSearch(e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {documentTemplates
                              .filter((t) => {
                                const q = templateSearch.trim().toLowerCase();
                                return (
                                  !q ||
                                  t.nome.toLowerCase().includes(q) ||
                                  t.categoria.toLowerCase().includes(q)
                                );
                              })
                              .map((template) => (
                                <Card
                                  key={template.id}
                                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                                    selectedTemplate?.id === template.id
                                      ? "border-primary bg-primary/5"
                                      : ""
                                  }`}
                                  onClick={() => handleApplyTemplate(template)}
                                >
                                  <CardHeader className="p-4">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                      <FolderOpen className="h-4 w-4" />
                                      {template.nome}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                      {template.descricao}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="p-4 pt-0">
                                    <div className="flex gap-2 flex-wrap">
                                      <Badge variant="outline" className="text-xs">
                                        {template.categoria}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        {template.variaveis.length} variáveis
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="variaveis" className="mt-0">
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Preencha as variáveis para substituir automaticamente no documento. Use
                            o formato{" "}
                            <code className="bg-muted px-1 rounded">{"{{variavel}}"}</code>.
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(selectedTemplate?.variaveis || unfilledVariables).map((variable) => (
                              <div key={variable}>
                                <Label className="text-xs">{variable}</Label>
                                <Input
                                  value={variableValues[variable] || ""}
                                  onChange={(e) =>
                                    setVariableValues((prev) => ({
                                      ...prev,
                                      [variable]: e.target.value,
                                    }))
                                  }
                                  placeholder={`Valor para ${variable}`}
                                />
                              </div>
                            ))}
                          </div>

                          <Button onClick={handleFillVariables} className="w-full">
                            <Sparkles className="mr-2" />
                            Aplicar Variáveis no Documento
                          </Button>
                        </div>
                      </TabsContent>
                    </div>
                  </ScrollArea>
                </div>
              </Tabs>

              <div className="p-6 pt-3 border-t flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingMinuta(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={editingMinuta ? handleUpdateMinuta : handleCreateMinuta}>
                  {editingMinuta ? "Atualizar" : "Criar"} Minuta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alertas de minutas pendentes */}
      {minutasPendentes.length > 0 && (
        <Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <Bot className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>{minutasPendentes.length} minuta(s) pendente(s) de revisão</strong> criada(s)
            pelos agentes IA.
            <div className="flex gap-2 mt-2 flex-wrap">
              {minutasPendentes.slice(0, 3).map((m) => (
                <Button
                  key={m.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditMinuta(m)}
                  className="text-orange-600 border-orange-500/50"
                >
                  <Eye className="mr-1 h-3 w-3" />
                  {m.titulo.substring(0, 20)}...
                </Button>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros e View Toggle */}
      <div className="flex gap-4 flex-wrap items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar minutas..."
            className="pl-9"
            value={minutaSearch}
            onChange={(e) => setMinutaSearch(e.target.value)}
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="em-revisao">Em Revisão</SelectItem>
            <SelectItem value="pendente-revisao">Pendente Revisão</SelectItem>
            <SelectItem value="finalizada">Finalizada</SelectItem>
            <SelectItem value="arquivada">Arquivada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="peticao">Petição</SelectItem>
            <SelectItem value="contrato">Contrato</SelectItem>
            <SelectItem value="parecer">Parecer</SelectItem>
            <SelectItem value="recurso">Recurso</SelectItem>
            <SelectItem value="procuracao">Procuração</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="secondary">{filteredMinutas.length} minuta(s)</Badge>

        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            size="sm"
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            onClick={() => setViewMode("grid")}
            className="px-3"
            aria-label="Visualização em grade"
            title="Visualização em grade"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === "list" ? "secondary" : "ghost"}
            onClick={() => setViewMode("list")}
            className="px-3"
            aria-label="Visualização em lista"
            title="Visualização em lista"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lista de Minutas */}
      {filteredMinutas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText size={64} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {minutaSearch || filterStatus !== "all" || filterTipo !== "all"
                ? "Nenhuma minuta encontrada com os filtros aplicados."
                : "Nenhuma minuta criada ainda."}
              <br />
              Clique em &quot;Nova Minuta&quot; para começar.
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
          data-testid="minutas-container"
        >
          {filteredMinutas.map((minuta) => {
            const processo = (processes || []).find((p) => p.id === minuta.processId);

            return (
              <Card
                key={minuta.id}
                className={`transition-all hover:shadow-md ${minuta.criadoPorAgente ? "border-orange-500/30" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="text-primary h-4 w-4" />
                        {minuta.titulo}
                        {minuta.criadoPorAgente && (
                          <Badge style={getTintStyle(themeConfig.colors.info)}>
                            <Bot className="mr-1 h-3 w-3" />
                            IA
                          </Badge>
                        )}
                      </CardTitle>

                      <CardDescription className="mt-2 flex items-center gap-2 flex-wrap">
                        <Badge style={getStatusStyle(minuta.status)}>
                          {getStatusLabel(minuta.status)}
                        </Badge>
                        <Badge variant="outline">{getTipoLabel(minuta.tipo)}</Badge>
                        {processo && (
                          <Badge variant="secondary" className="text-xs">
                            {processo.numeroCNJ}
                          </Badge>
                        )}
                        {minuta.googleDocsId && (
                          <Badge style={getTintStyle(themeConfig.colors.info)}>
                            <FileText className="mr-1 h-3 w-3" />
                            Google Docs
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {viewMode === "grid" && (
                      <div
                        className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg max-h-24 overflow-hidden prose prose-sm dark:prose-invert line-clamp-3"
                        dangerouslySetInnerHTML={{
                          __html:
                            minuta.conteudo.substring(0, 200) +
                            (minuta.conteudo.length > 200 ? "..." : ""),
                        }}
                      />
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(minuta.atualizadoEm).toLocaleDateString("pt-BR")}
                      </span>
                      {minuta.ultimaSincronizacao && (
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Sync
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => handleEditMinuta(minuta)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>

                      {minuta.status !== "finalizada" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveMinuta(minuta.id)}
                          style={{
                            color: themeConfig.colors.sucesso,
                            borderColor: `${themeConfig.colors.sucesso.replace("hsl", "hsla").replace(")", ", 0.50)")}`,
                          }}
                          className="hover:opacity-80"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Aprovar
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicateMinuta(minuta)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </Button>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                            <ChevronDown className="ml-1 h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportPDF(minuta)}
                              className="justify-start"
                            >
                              <FileText className="mr-2 h-4 w-4" /> Exportar PDF
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportDOCX(minuta)}
                              className="justify-start"
                            >
                              <FileText className="mr-2 h-4 w-4" /> Exportar DOC
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenInGoogleDocs(minuta)}
                              disabled={!isAuthenticated}
                              className="justify-start"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              {minuta.googleDocsUrl ? "Abrir no" : "Criar no"} Google Docs
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>

                      {minuta.googleDocsId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncFromGoogleDocs(minuta)}
                          disabled={isSyncing === minuta.id}
                          title="Importar alterações do Google Docs"
                        >
                          <RefreshCw
                            className={`mr-2 h-4 w-4 ${isSyncing === minuta.id ? "animate-spin" : ""}`}
                          />
                          {isSyncing === minuta.id ? "Importando..." : "Importar"}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteMinuta(minuta.id)}
                        className="text-destructive hover:text-destructive ml-auto"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
