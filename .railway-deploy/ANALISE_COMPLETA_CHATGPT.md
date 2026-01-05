# 📋 Análise Completa - Assistente Jurídico PJe
## Arquivos Consolidados para Análise no ChatGPT

**Data:** 04/01/2026
**Objetivo:** Corrigir, refinar e elevar: Editor de Minutas, Modal de criação, Dashboard, Importação por imagem, Fluxo de IA (Gemini), UX + arquitetura React

---

## 📁 ÍNDICE DE ARQUIVOS

1. **MinutasManager.tsx** - Editor de Minutas principal (1376 linhas)
2. **TiptapEditorV2.tsx** - Editor rico com TipTap (750+ linhas)
3. **ProfessionalEditor.tsx** - Editor profissional CKEditor 5 (600+ linhas)
4. **Dashboard.tsx** - Dashboard principal (524 linhas)
5. **PjeImageImporter.tsx** - Importação por imagem/OCR (500+ linhas)
6. **gemini-service.ts** - Serviço Gemini AI (649 linhas)
7. **use-ai-commands.ts** - Hook comandos IA (200+ linhas)
8. **use-editor-ai.ts** - Hook editor AI (200+ linhas)

---

## 🎯 PONTOS DE ATENÇÃO PARA ANÁLISE

### ⚠️ Problemas Conhecidos

1. **Modal Nova Minuta**
   - Hierarquia visual pode estar confusa
   - Experiência inicial precisa ser otimizada
   - Campos título, tipo, status podem precisar de melhor organização

2. **Editor de Minutas**
   - Integração Gemini 2.5 Pro precisa ser refinada
   - Fluxo de IA (streaming vs. normal) pode ter inconsistências
   - Toolbar pode estar sobrecarregada

3. **Dashboard**
   - Status "PJe desconectado" precisa de melhor feedback visual
   - Cards podem precisar de refinamento
   - Métricas com dados zerados precisam de empty states melhores

4. **Importação por Imagem (OCR)**
   - Fluxo passo-a-passo pode ser confuso
   - UX do OCR precisa de refinamento
   - Feedback de progresso pode ser melhorado

5. **Serviços de IA**
   - Acoplamento precisa ser verificado
   - Possibilidade de agentes autônomos precisa ser analisada
   - Segurança e escalabilidade precisam de revisão

### ✅ O Que Está Funcionando

- Sistema de templates jurídicos (12 templates)
- Integração com Google Docs
- Comandos IA (Continuar, Expandir, Revisar, Formalizar)
- Slash commands no editor (/gerar-minuta, /djen, etc)
- Colaboração humano/IA com pausa automática
- Rate limiting de requisições

### 🔧 Tech Stack

- **Frontend:** React 19, TypeScript, Vite 7, Tailwind CSS 4
- **Editores:** TipTap (customizado) + CKEditor 5 (profissional)
- **IA:** Anthropic SDK, Google Gemini 2.5 Pro
- **Estado:** TanStack Query, Context API, useKV (local storage)
- **UI:** Radix UI, Shadcn UI, Lucide Icons

---

## 📊 INSTRUÇÕES PARA CHATGPT

**Por favor, analise os arquivos no próximo bloco e forneça:**

1. **Correções Críticas:** Bugs evidentes, problemas de lógica, falhas de segurança
2. **Refinamentos UX:** Melhorias na experiência do usuário, hierarquia visual
3. **Arquitetura React:** Sugestões de componentização, hooks, performance
4. **Integração IA:** Otimizações no fluxo Gemini, streaming, rate limiting
5. **Código Limpo:** Refatorações para legibilidade, manutenibilidade
6. **Boas Práticas:** TypeScript strict, performance, acessibilidade

**Foco prioritário:**
1. Modal Nova Minuta (experiência inicial)
2. Editor de Minutas (integração IA)
3. Dashboard (feedback visual)
4. Importação OCR (fluxo passo-a-passo)
5. Serviços Gemini (segurança e escalabilidade)

---

## 📁 1. EDITOR DE MINUTAS - MinutasManager.tsx
**Caminho:** `src/components/MinutasManager.tsx` (1376 linhas)

```tsx
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ProfessionalEditor } from "@/components/editor/ProfessionalEditor";

// Verificar se as credenciais do Google estão configuradas
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const isGoogleConfigured = !!GOOGLE_CLIENT_ID && !!GOOGLE_API_KEY;

type ViewMode = "grid" | "list";

export default function MinutasManager() {
  const [minutas, setMinutas] = useKV<Minuta[]>("minutas", []);
  const [processes] = useKV<Process[]>("processes", []);
  const { exportToGoogleDocs, importFromGoogleDocs, openDocument } = useGoogleDocs();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMinuta, setEditingMinuta] = useState<Minuta | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const [searchQuery, setSearchQuery] = useState("");
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
    onChunk: (chunk) => {
      streamCallbacksRef.current.onChunk?.(chunk);
    },
    onComplete: () => {
      streamCallbacksRef.current.onComplete?.();
    },
    onError: (err) => {
      console.error("[MinutasManager] Erro no streaming:", err);
      toast.error("Erro no streaming de IA");
      streamCallbacksRef.current.onError?.(err);
    },
  });

  const [formData, setFormData] = useState({
    titulo: "",
    processId: "_none",
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
    if (aiCommandError) {
      toast.error(`Erro no comando IA: ${aiCommandError}`);
    }
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
            setFormData((prev) => ({
              ...prev,
              conteudo: prev.conteudo + chunk,
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              conteudo: streamedContent,
            }));
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
        const authenticated = googleDocsService.isAuthenticated();
        setIsAuthenticated(authenticated);
      } catch (err) {
        console.error("[MinutasManager] ❌ Google Docs init falhou:", err);
        setIsAuthenticated(false);
      }
    };
    initGoogleDocs();
  }, []);

  useEffect(() => {
    if (formData.processId && formData.processId !== "_none") {
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
      processId: "_none",
      tipo: "peticao",
      conteudo: "",
      status: "rascunho",
    });
    setSelectedTemplate(null);
    setVariableValues({});
    setActiveTab("editor");
  };

  const handleAuthGoogle = async () => {
    try {
      if (!isGoogleConfigured) {
        toast.error("Google não está configurado no ambiente (.env)");
        return;
      }

      // Mostrar loading toast
      const toastId = toast.loading("Inicializando Google Docs...");

      try {
        await googleDocsService.initialize();
        toast.success("Google Docs inicializado!", { id: toastId });
      } catch (initError) {
        const errorMsg =
          initError instanceof Error ? initError.message : "Erro ao inicializar Google Docs";

        // Mensagens mais específicas baseadas no erro
        let userMessage = errorMsg;
        if (errorMsg.includes("Timeout")) {
          userMessage = "Timeout ao carregar Google Docs. Verifique sua conexão e tente novamente.";
        } else if (errorMsg.includes("Failed to load")) {
          userMessage =
            "Não foi possível carregar scripts do Google. Verifique se você está conectado à internet.";
        } else if (errorMsg.includes("API key")) {
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
        const lastError = googleDocsService.getLastError();
        toast.error(lastError || "Falha na autenticação - verifique se popups estão permitidos");
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
        processId: formData.processId === "_none" ? undefined : formData.processId,
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
        processId: formData.processId === "_none" ? undefined : formData.processId,
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
        if (syncSuccess) {
          toast.success("Minuta atualizada e sincronizada com Google Docs");
        } else {
          toast.warning("Minuta atualizada, mas falha ao sincronizar com Google Docs");
        }
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
      processId: minuta.processId || "_none",
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

  const handleExportPDF = (_minuta: Minuta) => {
    toast.info("Exportação para PDF em desenvolvimento");
  };

  const handleExportDOCX = (_minuta: Minuta) => {
    toast.info("Exportação para DOCX em desenvolvimento");
  };

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
    } catch (_error) {
      toast.error("Erro ao abrir no Google Docs");
    }
  };

  const handleSyncFromGoogleDocs = async (minuta: Minuta) => {
    if (!minuta.googleDocsId) return;

    setIsSyncing(minuta.id);
    try {
      const success = await importFromGoogleDocs(minuta.id, minutas || [], setMinutas);
      if (success) {
        toast.success("Alterações importadas do Google Docs!");
      }
    } catch (_error) {
      toast.error("Erro ao importar do Google Docs");
    } finally {
      setIsSyncing(null);
    }
  };

  const handleApplyTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      ...formData,
      titulo: template.nome,
      tipo: template.categoria as Minuta["tipo"],
      conteudo: template.conteudo,
    });

    const initialValues: Record<string, string> = {};
    template.variaveis.forEach((v) => {
      initialValues[v] = variableValues[v] || "";
    });
    setVariableValues(initialValues);

    setActiveTab("editor");
    toast.success(`Template "${template.nome}" aplicado!`);
  };

  const handleFillVariables = () => {
    const filled = replaceTemplateVariables(formData.conteudo, variableValues);
    setFormData({ ...formData, conteudo: filled });
    toast.success("Variáveis preenchidas no documento!");
  };

  const handleAIGenerate = async (prompt: string): Promise<string> => {
    if (!isGeminiConfigured()) {
      throw new Error("Gemini não está configurado");
    }

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

  // Alinhado ao design system semântico em src/lib/themes.ts
  const getStatusStyle = (status: Minuta["status"]): React.CSSProperties => {
    const map: Record<Minuta["status"], string> = {
      rascunho: themeConfig.colors.alerta, // amarelo
      "em-revisao": themeConfig.colors.info, // azul
      "pendente-revisao": themeConfig.colors.alerta, // laranja
      finalizada: themeConfig.colors.sucesso, // verde
      arquivada: "hsl(0, 0%, 45%)", // cinza neutro
    } as const;

    const base = map[status] || themeConfig.colors.info;
    return {
      color: base,
      backgroundColor: `${base.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
      borderColor: `${base.replace("hsl", "hsla").replace(")", ", 0.20)")}`,
    };
  };

  const getStatusLabel = (status: Minuta["status"]) => {
    const labels = {
      rascunho: "Rascunho",
      "em-revisao": "Em Revisão",
      "pendente-revisao": "Pendente Revisão",
      finalizada: "Finalizada",
      arquivada: "Arquivada",
    };
    return labels[status] || status;
  };

  const getTipoLabel = (tipo: Minuta["tipo"]) => {
    const labels = {
      peticao: "Petição",
      contrato: "Contrato",
      parecer: "Parecer",
      recurso: "Recurso",
      procuracao: "Procuração",
      outro: "Outro",
    };
    return labels[tipo] || tipo;
  };

  const getAlertStyle = (): React.CSSProperties => {
    const base = themeConfig.colors.alerta;
    return {
      color: base,
      backgroundColor: `${base.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
      borderColor: `${base.replace("hsl", "hsla").replace(")", ", 0.20)")}`,
    };
  };

  const getSuccessStyle = (): React.CSSProperties => {
    const base = themeConfig.colors.sucesso;
    return {
      color: base,
      backgroundColor: `${base.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
      borderColor: `${base.replace("hsl", "hsla").replace(")", ", 0.20)")}`,
    };
  };

  const getInfoStyle = (): React.CSSProperties => {
    const base = themeConfig.colors.info;
    return {
      color: base,
      backgroundColor: `${base.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
      borderColor: `${base.replace("hsl", "hsla").replace(")", ", 0.20)")}`,
    };
  };

  // Filtrar minutas
  const filteredMinutas = (minutas || []).filter((m) => {
    const matchesSearch =
      searchQuery === "" || m.titulo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || m.status === filterStatus;
    const matchesTipo = filterTipo === "all" || m.tipo === filterTipo;
    return matchesSearch && matchesStatus && matchesTipo;
  });

  // Minutas pendentes de revisão
  const minutasPendentes = (minutas || []).filter(
    (m) => m.status === "pendente-revisao" || m.criadoPorAgente
  );

  // Variáveis não preenchidas
  const unfilledVariables = extractUnfilledVariables(formData.conteudo);

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
                <Badge variant="outline" style={getAlertStyle()} className="px-4 py-2">
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
              <Badge style={getSuccessStyle()} className="px-4 py-2">
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

            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto flex flex-col bg-card">
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
                <DialogDescription>
                  Use o editor rico para criar sua minuta. Use o botão de IA para gerar conteúdo
                  automaticamente com Gemini 2.5 Pro.
                </DialogDescription>
              </DialogHeader>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                  <TabsTrigger value="variaveis">Variáveis</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="editor"
                  className="flex-1 flex flex-col overflow-hidden mt-4 space-y-4"
                >
                  {/* Metadados */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="titulo">Título</Label>
                      <Input
                        id="titulo"
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        placeholder="Ex: Petição Inicial - Ação de Cobrança"
                      />
                    </div>

                    <div>
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            tipo: value as Minuta["tipo"],
                          })
                        }
                      >
                        <SelectTrigger id="tipo">
                          <SelectValue />
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
                          setFormData({
                            ...formData,
                            status: value as Minuta["status"],
                          })
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
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
                      value={formData.processId}
                      onValueChange={(value) => setFormData({ ...formData, processId: value })}
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

                  {/* Editor - CKEditor 5 */}
                  <div className="flex-1 overflow-hidden flex flex-col min-h-[400px]">
                    <ProfessionalEditor
                      key={editingMinuta?.id || "new-minuta"}
                      content={formData.conteudo}
                      onChange={(content) => setFormData({ ...formData, conteudo: content })}
                      onAIGenerate={handleAIGenerate}
                      onAIStream={handleAIStream}
                      variables={variableValues}
                      placeholder="Digite o conteúdo da minuta ou use o botão de IA para gerar com Gemini..."
                      className="h-full min-h-[400px]"
                      showCollaboration={false}
                    />
                  </div>

                  {/* Comandos IA */}
                  <Card className="border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Bot className="h-4 w-4 text-purple-600" />
                        Comandos IA
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
                      <div className="grid grid-cols-4 gap-2">
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

                  {/* Variáveis não preenchidas */}
                  {unfilledVariables.length > 0 && (
                    <Alert
                      style={{
                        borderColor: `${themeConfig.colors.alerta.replace("hsl", "hsla").replace(")", ", 0.50)")}`,
                        backgroundColor: `${themeConfig.colors.alerta.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
                      }}
                    >
                      <AlertTriangle
                        className="h-4 w-4"
                        style={{ color: themeConfig.colors.alerta }}
                      />
                      <AlertDescription style={{ color: themeConfig.colors.alerta }}>
                        <strong>{unfilledVariables.length} variáveis não preenchidas:</strong>{" "}
                        {unfilledVariables.slice(0, 5).join(", ")}
                        {unfilledVariables.length > 5 && ` e mais ${unfilledVariables.length - 5}`}
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

                <TabsContent value="templates" className="flex-1 overflow-hidden mt-4">
                  <div className="space-y-4 h-full flex flex-col">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar templates..."
                          className="pl-9"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    <ScrollArea className="flex-1">
                      <div className="grid grid-cols-2 gap-3">
                        {documentTemplates
                          .filter(
                            (t) =>
                              searchQuery === "" ||
                              t.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              t.categoria.toLowerCase().includes(searchQuery.toLowerCase())
                          )
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
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="variaveis" className="flex-1 overflow-hidden mt-4">
                  <div className="space-y-4 h-full flex flex-col">
                    <p className="text-sm text-muted-foreground">
                      Preencha as variáveis para substituir automaticamente no documento. Use o
                      formato <code className="bg-muted px-1 rounded">{"{{variavel}}"}</code>.
                    </p>

                    <ScrollArea className="flex-1">
                      <div className="grid grid-cols-2 gap-4">
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
                    </ScrollArea>

                    <Button onClick={handleFillVariables} className="w-full">
                      <Sparkles className="mr-2" />
                      Aplicar Variáveis no Documento
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Footer */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
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
            <div className="flex gap-2 mt-2">
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* View Mode Toggle */}
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
              {searchQuery || filterStatus !== "all" || filterTipo !== "all"
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
                          <Badge style={getInfoStyle()}>
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
                          <Badge style={getInfoStyle()}>
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
                    {/* Preview do conteúdo */}
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

                    {/* Timestamps */}
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

                    {/* Ações */}
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
                            className={`mr-2 h-4 w-4 ${
                              isSyncing === minuta.id ? "animate-spin" : ""
                            }`}
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
```

## 📁 2. EDITOR RICO V2 - TiptapEditorV2.tsx
**Caminho:** `src/components/editor/TiptapEditorV2.tsx`

```tsx
"use client";

import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";

// --- Tiptap Core Extensions ---
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Placeholder from "@tiptap/extension-placeholder";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Selection } from "@tiptap/extensions";
import { StarterKit } from "@tiptap/starter-kit";

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import { Toolbar, ToolbarGroup, ToolbarSeparator } from "@/components/tiptap-ui-primitive/toolbar";

// --- Tiptap Node ---
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

// --- Tiptap UI ---
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
  ColorHighlightPopoverContent,
} from "@/components/tiptap-ui/color-highlight-popover";
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { LinkButton, LinkContent, LinkPopover } from "@/components/tiptap-ui/link-popover";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";

// --- Lucide Icons para IA ---
import { Bot, Expand, Loader2, Pilcrow, Sparkles, Wand2, Zap } from "lucide-react";

// --- shadcn/ui Components ---
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

// --- Hooks ---
import { useCursorVisibility } from "@/hooks/use-cursor-visibility";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { useWindowSize } from "@/hooks/use-window-size";

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle";

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils";
import { cn } from "@/lib/utils";

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss";

// ===========================
// Props Interface
// ===========================

interface TiptapEditorV2Props {
  readonly content: string;
  readonly onChange: (content: string) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly readOnly?: boolean;
  readonly onAIGenerate?: (prompt: string) => Promise<string>;
  readonly onAIStream?: (
    prompt: string,
    callbacks: {
      onChunk: (chunk: string) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    }
  ) => Promise<void>;
  readonly variables?: Record<string, string>;
}

// ===========================
// AI Constants
// ===========================

const AI_QUICK_COMMANDS = [
  {
    label: "Expandir",
    icon: Expand,
    prompt: "Expanda e desenvolva o seguinte texto de forma mais detalhada e formal:",
  },
  {
    label: "Resumir",
    icon: Pilcrow,
    prompt: "Resuma o seguinte texto de forma concisa:",
  },
  {
    label: "Formalizar",
    icon: Wand2,
    prompt: "Reescreva o seguinte texto em linguagem jurídica formal:",
  },
  {
    label: "Corrigir",
    icon: Sparkles,
    prompt: "Corrija erros de gramática e ortografia no seguinte texto:",
  },
] as const;

// ===========================
// Helper Functions
// ===========================

function insertContentAtPosition(
  editor: ReturnType<typeof useEditor>,
  contentToInsert: string,
  from: number,
  to: number
): void {
  if (!editor) return;
  editor
    .chain()
    .focus()
    .setTextSelection({ from, to })
    .deleteSelection()
    .insertContent(contentToInsert)
    .run();
}

function getSelectedOrAllText(
  editor: ReturnType<typeof useEditor>,
  from: number,
  to: number
): string {
  if (!editor) return "";
  const hasSelection = from !== to;
  return hasSelection ? editor.state.doc.textBetween(from, to, " ") : editor.getText();
}

function getAISuccessMessage(commandLabel: string): string {
  return `Texto processado com IA: ${commandLabel}`;
}

function getGenerateButtonText(isStreaming: boolean, hasStreamSupport: boolean): string {
  if (isStreaming) return "Gerando...";
  return hasStreamSupport ? "Gerar com Streaming" : "Gerar Texto";
}

function countWords(text: string): number {
  return text.trim().length === 0
    ? 0
    : text
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
}

// ===========================
// AI Toolbar Component
// ===========================

interface AIToolbarProps {
  readonly isStreaming: boolean;
  readonly isAILoading: boolean;
  readonly aiPrompt: string;
  readonly setAiPrompt: (value: string) => void;
  readonly streamingText: string;
  readonly onAIGenerate: () => void;
  readonly onQuickAI: (command: (typeof AI_QUICK_COMMANDS)[number]) => void;
  readonly hasStreamSupport: boolean;
}

function AIToolbar({
  isStreaming,
  isAILoading,
  aiPrompt,
  setAiPrompt,
  streamingText,
  onAIGenerate,
  onQuickAI,
  hasStreamSupport,
}: AIToolbarProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          data-style={isStreaming || isAILoading ? "default" : "ghost"}
          data-variant="secondary"
          title="Comandos de IA"
        >
          {isStreaming || isAILoading ? (
            <Loader2 className="tiptap-button-icon animate-spin" />
          ) : (
            <Bot className="tiptap-button-icon" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-4" align="end">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Comandos Rápidos</h4>
          <div className="grid grid-cols-2 gap-2">
            {AI_QUICK_COMMANDS.map((cmd) => (
              <Button
                key={cmd.label}
                data-variant="outline"
                data-size="sm"
                onClick={() => onQuickAI(cmd)}
                disabled={isStreaming || isAILoading}
                className="justify-start text-xs"
              >
                <cmd.icon className="h-3 w-3 mr-1" />
                {cmd.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-2">
          <label htmlFor="ai-prompt-v2" className="text-sm font-medium">
            Gerar com IA
          </label>
          <Input
            id="ai-prompt-v2"
            placeholder="Ex: Escreva uma petição inicial sobre..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAIGenerate()}
            disabled={isStreaming}
          />
          <Button
            className="w-full gap-2"
            onClick={onAIGenerate}
            disabled={!aiPrompt.trim() || isAILoading || isStreaming}
          >
            {isAILoading || isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {getGenerateButtonText(isStreaming, hasStreamSupport)}
          </Button>
        </div>

        {isStreaming && streamingText && (
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 max-h-40 overflow-y-auto">
            <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
              {streamingText.slice(-600)}
              <span className="animate-pulse text-purple-400">▊</span>
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ===========================
// Main Toolbar Component
// ===========================

interface MainToolbarContentProps {
  readonly onHighlighterClick: () => void;
  readonly onLinkClick: () => void;
  readonly isMobile: boolean;
  readonly hasAI: boolean;
  readonly aiToolbarProps?: AIToolbarProps;
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  hasAI,
  aiToolbarProps,
}: MainToolbarContentProps) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu types={["bulletList", "orderedList", "taskList"]} portal={isMobile} />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {hasAI && aiToolbarProps && (
        <>
          <ToolbarSeparator />
          <ToolbarGroup>
            <AIToolbar {...aiToolbarProps} />
          </ToolbarGroup>
        </>
      )}

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  );
};

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link";
  onBack: () => void;
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? <ColorHighlightPopoverContent /> : <LinkContent />}
  </>
);

// ===========================
// Main Editor Component
// ===========================

export function TiptapEditorV2({
  content,
  onChange,
  placeholder = "Digite ou use /ai para comandos de IA...",
  className,
  readOnly = false,
  onAIGenerate,
  onAIStream,
  variables = {},
}: TiptapEditorV2Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsBreakpoint();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">("main");
  const toolbarRef = useRef<HTMLDivElement>(null);

  // AI State
  const [isAILoading, setIsAILoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      // Ensure editor DOM has no blur/opacity by default.
      try {
        const dom = editor.view.dom as HTMLElement;
        if (dom) {
          dom.style.opacity = "1";
          dom.style.filter = "none";
          dom.style.backdropFilter = "none";
          dom.style.transform = "none";
          dom.style.willChange = "auto";
        }
      } catch (e) {
        // Swallow, not critical; keep console for debugging
        console.warn("Failed to set editor initial styles", e);
      }
    },
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      Placeholder.configure({
        placeholder,
      }),
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onChange(html);

      const text = ed.getText();
      setCharCount(text.length);
      setWordCount(countWords(text));
    },
  });

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  // Sincronizar conteúdo externo
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content !== current) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  // Ensure wrapper and content elements are forcefully visible without filters
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.style.opacity = "1";
    el.style.filter = "none";
    el.style.backdropFilter = "none";
    el.style.transform = "none";
    el.style.willChange = "auto";
  }, []);

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  // Substituir variáveis
  const replaceVariables = useCallback(
    (text: string) => {
      let result = text;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(String.raw`\{\{\s*${key}\s*\}\}`, "g");
        result = result.replaceAll(regex, value);
      });
      return result;
    },
    [variables]
  );

  // AI Streaming
  const runAIStreaming = useCallback(
    async (prompt: string) => {
      if (!editor || !onAIStream) return;

      const { from, to } = editor.state.selection;

      setIsStreaming(true);
      setStreamingText("");

      let accumulated = "";

      try {
        await onAIStream(prompt, {
          onChunk: (chunk: string) => {
            accumulated += chunk;
            setStreamingText(accumulated);
          },
          onComplete: () => {
            const finalText = replaceVariables(accumulated);
            insertContentAtPosition(editor, finalText, from, to);

            setIsStreaming(false);
            setStreamingText("");
            setAiPrompt("");
            toast.success("Texto inserido com IA (streaming)!");
          },
          onError: (error: Error) => {
            console.error("Erro no streaming:", error);
            toast.error("Erro no streaming de IA");
            setIsStreaming(false);
            setStreamingText("");
          },
        });
      } catch (error) {
        console.error("Erro ao iniciar streaming:", error);
        setIsStreaming(false);
        setStreamingText("");
      }
    },
    [editor, onAIStream, replaceVariables]
  );

  const handleAIGenerate = useCallback(async () => {
    if (!aiPrompt.trim() || !editor) return;
    const prompt = aiPrompt.trim();

    // Streaming
    if (onAIStream) {
      await runAIStreaming(prompt);
      return;
    }

    if (!onAIGenerate) return;

    setIsAILoading(true);
    try {
      const generatedText = await onAIGenerate(prompt);
      const processedText = replaceVariables(generatedText);
      const { from, to } = editor.state.selection;

      insertContentAtPosition(editor, processedText, from, to);

      setAiPrompt("");
      toast.success("Texto gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar texto com IA:", error);
      toast.error("Erro ao gerar texto com IA");
    } finally {
      setIsAILoading(false);
    }
  }, [aiPrompt, editor, onAIGenerate, onAIStream, runAIStreaming, replaceVariables]);

  const handleQuickAI = useCallback(
    async (command: (typeof AI_QUICK_COMMANDS)[number]) => {
      if (!editor || (!onAIGenerate && !onAIStream)) return;

      const { from, to } = editor.state.selection;
      const selectedText = getSelectedOrAllText(editor, from, to);

      if (!selectedText.trim()) {
        toast.error("Selecione um texto ou escreva algo primeiro");
        return;
      }

      const fullPrompt = `${command.prompt}\n\n"${selectedText}"`;

      if (onAIStream) {
        await runAIStreaming(fullPrompt);
        return;
      }

      setIsAILoading(true);
      try {
        const generatedText = await onAIGenerate!(fullPrompt);
        const processedText = replaceVariables(generatedText);
        const hasSelection = from !== to;

        if (hasSelection) {
          insertContentAtPosition(editor, processedText, from, to);
        } else {
          editor.chain().focus().insertContent(processedText).run();
        }

        toast.success(getAISuccessMessage(command.label));
      } catch (error) {
        console.error("Erro ao processar com IA:", error);
        toast.error("Erro ao processar com IA");
      } finally {
        setIsAILoading(false);
      }
    },
    [editor, onAIGenerate, onAIStream, runAIStreaming, replaceVariables]
  );

  const hasAI = !!(onAIGenerate || onAIStream);

  const aiToolbarProps: AIToolbarProps | undefined = hasAI
    ? {
        isStreaming,
        isAILoading,
        aiPrompt,
        setAiPrompt,
        streamingText,
        onAIGenerate: handleAIGenerate,
        onQuickAI: handleQuickAI,
        hasStreamSupport: !!onAIStream,
      }
    : undefined;

  if (!editor) return null;

  return (
    <div ref={wrapperRef} className={cn("simple-editor-wrapper", className)}>
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
              hasAI={hasAI}
              aiToolbarProps={aiToolbarProps}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <EditorContent editor={editor} role="presentation" className="simple-editor-content" />

        {/* Footer */}
        <div className="border-t bg-muted/50 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{wordCount} palavras</span>
            <span>{charCount} caracteres</span>
          </div>
          {Object.keys(variables).length > 0 && (
            <Badge variant="outline" className="text-xs">
              {Object.keys(variables).length} variável(is) disponível(is)
            </Badge>
          )}
        </div>
      </EditorContext.Provider>
    </div>
  );
}

export default TiptapEditorV2;
```

---

## 📁 3. EDITOR PROFISSIONAL - ProfessionalEditor.tsx
**Caminho:** `src/components/editor/ProfessionalEditor.tsx`

```tsx
/**
 * ProfessionalEditor - Editor de documentos com CKEditor 5
 *
 * Features:
 * - UI profissional igual Word/Google Docs
 * - Colaboração humano/IA com pausa automática
 * - Track Changes nativo do CKEditor
 * - Comentários e revisões
 * - Export para Word/PDF
 * - Aparência de página A4
 * - Slash commands para IA (/gerar-minuta, /djen, etc)
 * - Integração com DJEN e dados de processos
 */

import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  AccessibilityHelp,
  Autoformat,
  AutoLink,
  Autosave,
  BalloonToolbar,
  BlockQuote,
  Bold,
  ClassicEditor,
  Code,
  Essentials,
  FindAndReplace,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  Heading,
  Highlight,
  HorizontalLine,
  Indent,
  IndentBlock,
  Italic,
  Link,
  List,
  ListProperties,
  Paragraph,
  SelectAll,
  SpecialCharacters,
  SpecialCharactersEssentials,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TextTransformation,
  TodoList,
  Underline,
  Undo,
  WordCount,
  type EditorConfig,
} from "ckeditor5";

import "ckeditor5/ckeditor5.css";
import "./professional-editor.scss";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEditorAI, EDITOR_SLASH_COMMANDS } from "@/hooks/use-editor-ai";
import { cn } from "@/lib/utils";
import {
  Bot,
  ChevronDown,
  Expand,
  FileText,
  Loader2,
  Sparkles,
  User,
  Wand2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ===========================
// Types
// ===========================

interface DJENPublication {
  id?: string;
  conteudo?: string;
  dataDisponibilizacao?: string;
  orgaoJulgador?: string;
  numeroProcesso?: string;
}

interface ProcessData {
  numero?: string;
  partes?: string;
  vara?: string;
  classe?: string;
  [key: string]: unknown;
}

// ===========================
// Props Interface
// ===========================

interface ProfessionalEditorProps {
  readonly content: string;
  readonly onChange: (content: string) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly readOnly?: boolean;
  readonly onAIGenerate?: (prompt: string) => Promise<string>;
  readonly onAIStream?: (
    prompt: string,
    callbacks: {
      onChunk: (chunk: string) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    }
  ) => Promise<void>;
  readonly variables?: Record<string, string>;
  readonly showCollaboration?: boolean;
  readonly djenData?: DJENPublication[];
  readonly processData?: ProcessData;
  readonly documentType?: string;
}

// ===========================
// AI Constants
// ===========================

const AI_QUICK_COMMANDS = [
  {
    label: "Continuar",
    icon: Zap,
    prompt: "Continue escrevendo o texto de forma natural e profissional:",
  },
  {
    label: "Expandir",
    icon: Expand,
    prompt: "Expanda e desenvolva o seguinte texto de forma mais detalhada:",
  },
  {
    label: "Revisar",
    icon: Sparkles,
    prompt: "Revise e melhore a redação do seguinte texto mantendo o significado:",
  },
  {
    label: "Formalizar",
    icon: Wand2,
    prompt: "Reescreva o seguinte texto em linguagem jurídica formal:",
  },
] as const;

// ===========================
// Helper Functions
// ===========================

function countWords(text: string): number {
  return text.trim().length === 0
    ? 0
    : text
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
}

// ===========================
// Main Component
// ===========================

export function ProfessionalEditor({
  content,
  onChange,
  placeholder = "Digite seu texto aqui...",
  className,
  readOnly = false,
  onAIGenerate,
  onAIStream,
  variables = {},
  showCollaboration = true,
  djenData = [],
  processData,
  documentType,
}: ProfessionalEditorProps) {
  const editorRef = useRef<ClassicEditor | null>(null);
  const lastUserInputRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [isAIActive, setIsAIActive] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });

  // Hook de IA para editor
  const {
    isLoading: isEditorAILoading,
    executeCommand,
    generateMinuta,
    loadCommands,
  } = useEditorAI();

  // Carregar comandos ao montar
  useEffect(() => {
    loadCommands();
  }, [loadCommands]);

  // ===========================
  // CKEditor Configuration
  // ===========================

  const editorConfig: EditorConfig = {
    licenseKey: "GPL",
    toolbar: {
      items: [
        "undo",
        "redo",
        "|",
        "heading",
        "|",
        "fontSize",
        "fontFamily",
        "fontColor",
        "fontBackgroundColor",
        "|",
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "subscript",
        "superscript",
        "code",
        "|",
        "link",
        "insertTable",
        "blockQuote",
        "horizontalLine",
        "specialCharacters",
        "|",
        "bulletedList",
        "numberedList",
        "todoList",
        "outdent",
        "indent",
      ],
      shouldNotGroupWhenFull: false,
    },
    plugins: [
      AccessibilityHelp,
      Autoformat,
      AutoLink,
      Autosave,
      BalloonToolbar,
      BlockQuote,
      Bold,
      Code,
      Essentials,
      FindAndReplace,
      FontBackgroundColor,
      FontColor,
      FontFamily,
      FontSize,
      Heading,
      Highlight,
      HorizontalLine,
      Indent,
      IndentBlock,
      Italic,
      Link,
      List,
      ListProperties,
      Paragraph,
      SelectAll,
      SpecialCharacters,
      SpecialCharactersEssentials,
      Strikethrough,
      Subscript,
      Superscript,
      Table,
      TableCaption,
      TableCellProperties,
      TableColumnResize,
      TableProperties,
      TableToolbar,
      TextTransformation,
      TodoList,
      Underline,
      Undo,
      WordCount,
    ],
    balloonToolbar: ["bold", "italic", "|", "link"],
    fontFamily: {
      supportAllValues: true,
      options: [
        "default",
        "Arial, Helvetica, sans-serif",
        "Courier New, Courier, monospace",
        "Georgia, serif",
        "Lucida Sans Unicode, Lucida Grande, sans-serif",
        "Tahoma, Geneva, sans-serif",
        "Times New Roman, Times, serif",
        "Trebuchet MS, Helvetica, sans-serif",
        "Verdana, Geneva, sans-serif",
      ],
    },
    fontSize: {
      options: [10, 12, "default", 16, 18, 20, 24, 28, 32],
      supportAllValues: true,
    },
    heading: {
      options: [
        { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
        { model: "heading1", view: "h1", title: "Heading 1", class: "ck-heading_heading1" },
        { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
        { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
        { model: "heading4", view: "h4", title: "Heading 4", class: "ck-heading_heading4" },
      ],
    },
    link: {
      addTargetToExternalLinks: true,
      defaultProtocol: "https://",
      decorators: {
        toggleDownloadable: {
          mode: "manual",
          label: "Downloadable",
          attributes: {
            download: "file",
          },
        },
      },
    },
    list: {
      properties: {
        styles: true,
        startIndex: true,
        reversed: true,
      },
    },
    placeholder,
    table: {
      contentToolbar: [
        "tableColumn",
        "tableRow",
        "mergeTableCells",
        "tableProperties",
        "tableCellProperties",
      ],
    },
  };

  // ===========================
  // Human + AI Collaboration Logic
  // ===========================

  const handleUserInput = useCallback(() => {
    lastUserInputRef.current = Date.now();
    setIsUserTyping(true);

    if (isAIActive) {
      setIsAIActive(false);
    }

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      setIsUserTyping(false);
    }, 3000);
  }, [isAIActive]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  // ===========================
  // AI Functions
  // ===========================

  const replaceVariables = useCallback(
    (text: string) => {
      let result = text;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(String.raw`\{\{\s*${key}\s*\}\}`, "g");
        result = result.replaceAll(regex, value);
      });
      return result;
    },
    [variables]
  );

  const runAIStreaming = useCallback(
    async (prompt: string) => {
      const editor = editorRef.current;
      if (!editor || !onAIStream) return;

      setIsAIActive(true);
      setIsStreaming(true);

      try {
        await onAIStream(prompt, {
          onChunk: (chunk: string) => {
            if (isUserTyping) return;

            const viewFragment = editor.data.processor.toView(chunk);
            const modelFragment = editor.data.toModel(viewFragment);
            editor.model.insertContent(modelFragment);
          },
          onComplete: () => {
            setIsStreaming(false);
            setIsAIActive(false);
            setAiPrompt("");
            toast.success("IA finalizou a redação");
          },
          onError: (error: Error) => {
            console.error("Erro no streaming:", error);
            toast.error("Erro no streaming de IA");
            setIsStreaming(false);
            setIsAIActive(false);
          },
        });
      } catch (error) {
        console.error("Erro ao iniciar streaming:", error);
        setIsStreaming(false);
        setIsAIActive(false);
      }
    },
    [onAIStream, isUserTyping]
  );

  const handleQuickAI = useCallback(
    async (command: (typeof AI_QUICK_COMMANDS)[number]) => {
      const editor = editorRef.current;
      if (!editor) return;

      const selectedText = editor.getData();
      const fullPrompt = `${command.prompt}\n\n${selectedText}`;

      if (onAIStream) {
        await runAIStreaming(fullPrompt);
      } else if (onAIGenerate) {
        setIsAILoading(true);
        try {
          const result = await onAIGenerate(fullPrompt);
          const processed = replaceVariables(result);
          editor.setData(processed);
          toast.success(`IA aplicou: ${command.label}`);
        } catch {
          toast.error("Erro ao processar comando de IA");
        } finally {
          setIsAILoading(false);
        }
      }
    },
    [onAIGenerate, onAIStream, replaceVariables, runAIStreaming]
  );

  // ===========================
  // Slash Command Handler
  // ===========================

  const handleSlashCommand = useCallback(
    async (command: string, customPrompt: string = "") => {
      const editor = editorRef.current;
      if (!editor) return;

      setIsAIActive(true);
      setShowSlashMenu(false);

      try {
        // Obter conteúdo atual para contexto
        const currentHtml = editor.getData();
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = currentHtml;
        const plainText = tempDiv.textContent || tempDiv.innerText || "";

        // Remover o texto do comando slash usando a API do modelo (preserva formatação)
        editor.model.change((writer) => {
          const selection = editor.model.document.selection;
          const position = selection.getLastPosition();

          if (position) {
            // Encontrar o slash command no final do texto
            const slashMatch = plainText.match(/\/([a-z-]*)$/i);
            if (slashMatch) {
              const charsToDelete = slashMatch[0].length;
              // Mover para trás e deletar os caracteres do comando
              const range = writer.createRange(position.getShiftedBy(-charsToDelete), position);
              writer.remove(range);
            }
          }
        });

        const prompt =
          customPrompt || `Gere conteúdo jurídico profissional para ${command.replace("/", "")}`;
        const contextWithoutSlash = plainText.replace(/\/[a-z-]*$/i, "").trim();

        const result = await executeCommand({
          command,
          prompt,
          context: contextWithoutSlash,
          djenData,
          processData,
        });

        if (result.success && result.content) {
          const viewFragment = editor.data.processor.toView(result.content);
          const modelFragment = editor.data.toModel(viewFragment);
          editor.model.insertContent(modelFragment);
          toast.success(`Comando ${command} executado`);
        } else {
          toast.error(result.error || "Erro ao executar comando");
        }
      } catch (error) {
        console.error("Erro no slash command:", error);
        toast.error("Erro ao executar comando de IA");
      } finally {
        setIsAIActive(false);
      }
    },
    [executeCommand, djenData, processData]
  );

  const handleGenerateMinutaWithContext = useCallback(
    async (prompt: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      setIsAIActive(true);

      try {
        const currentContent = editor.getData();
        const result = await generateMinuta({
          prompt,
          context: currentContent,
          djenData,
          processData,
          documentType,
          existingContent: currentContent,
        });

        if (result.success && result.content) {
          editor.setData(result.content);
          toast.success("Minuta gerada com sucesso");
        } else {
          toast.error(result.error || "Erro ao gerar minuta");
        }
      } catch (error) {
        console.error("Erro ao gerar minuta:", error);
        toast.error("Erro ao gerar minuta");
      } finally {
        setIsAIActive(false);
      }
    },
    [generateMinuta, djenData, processData, documentType]
  );

  // Detectar "/" no início de uma linha e posicionar menu próximo ao cursor
  const checkForSlashCommand = useCallback((plainText: string, editor: ClassicEditor) => {
    const lines = plainText.split("\n");
    const lastLine = lines[lines.length - 1] || "";

    // Procurar por comando slash no final do texto
    const slashMatch = lastLine.match(/\/([a-z-]*)$/i);

    if (slashMatch) {
      const filter = slashMatch[1].toLowerCase();
      setSlashFilter(filter);
      setShowSlashMenu(true);

      // Posicionar o menu próximo à seleção atual
      try {
        const selection = editor.editing.view.document.selection;
        const viewRange = selection.getFirstRange();

        if (viewRange) {
          const domRange = editor.editing.view.domConverter.viewRangeToDom(viewRange);
          if (domRange) {
            const rect = domRange.getBoundingClientRect();
            setSlashMenuPosition({
              top: rect.bottom + window.scrollY + 5,
              left: rect.left + window.scrollX,
            });
            return;
          }
        }

        // Fallback: posição relativa ao editor
        const editorElement = editor.ui.view.element;
        if (editorElement) {
          const rect = editorElement.getBoundingClientRect();
          setSlashMenuPosition({
            top: rect.top + window.scrollY + 100,
            left: rect.left + window.scrollX + 50,
          });
        }
      } catch {
        setSlashMenuPosition({ top: 200, left: 100 });
      }
    } else {
      setShowSlashMenu(false);
      setSlashFilter("");
    }
  }, []);

  // Filtrar comandos slash
  const filteredSlashCommands = EDITOR_SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.command.toLowerCase().includes(slashFilter) ||
      cmd.label.toLowerCase().includes(slashFilter)
  );

  const handleAIGenerate = useCallback(async () => {
    const editor = editorRef.current;
    if (!aiPrompt.trim() || !editor) return;

    if (onAIStream) {
      await runAIStreaming(aiPrompt);
    } else if (onAIGenerate) {
      setIsAILoading(true);
      try {
        const result = await onAIGenerate(aiPrompt);
        const processed = replaceVariables(result);

        const viewFragment = editor.data.processor.toView(processed);
        const modelFragment = editor.data.toModel(viewFragment);
        editor.model.insertContent(modelFragment);

        setAiPrompt("");
        toast.success("Texto gerado com IA");
      } catch {
        toast.error("Erro ao gerar texto");
      } finally {
        setIsAILoading(false);
      }
    }
  }, [aiPrompt, onAIGenerate, onAIStream, replaceVariables, runAIStreaming]);

  // ===========================
  // Render
  // ===========================

  return (
    <div className={cn("professional-editor-wrapper", className)}>
      {/* AI Toolbar */}
      <div className="ai-toolbar">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={isAIActive || isStreaming ? "default" : "outline"}
              size="sm"
              title="Comandos de IA"
            >
              {isAIActive || isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
              <span className="ml-2">Assistente IA</span>
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Comandos Rápidos</h4>
                <div className="grid grid-cols-2 gap-2">
                  {AI_QUICK_COMMANDS.map((cmd) => (
                    <Button
                      key={cmd.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAI(cmd)}
                      disabled={isStreaming || isAILoading || !isEditorReady}
                      className="justify-start"
                    >
                      <cmd.icon className="h-3 w-3 mr-2" />
                      {cmd.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium">Gerar com IA</label>
                <Input
                  placeholder="Digite o que deseja..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAIGenerate()}
                />
                <Button
                  className="w-full"
                  onClick={handleAIGenerate}
                  disabled={!aiPrompt.trim() || isAILoading || isStreaming || !isEditorReady}
                >
                  {isAILoading || isStreaming ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Gerar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Slash Commands Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" title="Comandos Slash">
              <FileText className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Comandos /</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Comandos Slash</h4>
              <p className="text-xs text-muted-foreground">
                Digite "/" no editor para acessar rapidamente
              </p>
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {EDITOR_SLASH_COMMANDS.map((cmd) => (
                    <Button
                      key={cmd.command}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => handleSlashCommand(cmd.command)}
                      disabled={isAIActive || isEditorAILoading}
                    >
                      <span className="mr-2">{cmd.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{cmd.label}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {cmd.description}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>

        {/* DJEN Context Indicator */}
        {djenData && djenData.length > 0 && (
          <Badge variant="secondary" className="ml-2">
            {djenData.length} pub. DJEN
          </Badge>
        )}

        {/* Collaboration Indicator */}
        {showCollaboration && (
          <div className="ml-auto flex items-center gap-2">
            {isUserTyping && (
              <Badge variant="default" className="bg-blue-500">
                <User className="h-3 w-3 mr-1" />
                Você está editando
              </Badge>
            )}
            {(isAIActive || isEditorAILoading) && !isUserTyping && (
              <Badge variant="default" className="bg-purple-500">
                <Bot className="h-3 w-3 mr-1" />
                IA escrevendo...
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Floating Slash Command Menu */}
      {showSlashMenu && filteredSlashCommands.length > 0 && (
        <div
          className="absolute z-50 bg-background border rounded-lg shadow-lg p-2 w-64"
          style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
        >
          <ScrollArea className="max-h-48">
            {filteredSlashCommands.map((cmd) => (
              <Button
                key={cmd.command}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left"
                onClick={() => handleSlashCommand(cmd.command)}
              >
                <span className="mr-2">{cmd.icon}</span>
                <span className="font-medium">{cmd.label}</span>
              </Button>
            ))}
          </ScrollArea>
        </div>
      )}

      {/* CKEditor */}
      <div className="professional-editor-page">
        <CKEditor
          editor={ClassicEditor}
          config={editorConfig}
          data={content}
          disabled={readOnly}
          onReady={(editor) => {
            editorRef.current = editor;
            setIsEditorReady(true);

            const htmlData = editor.getData();
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = htmlData;
            const plainText = tempDiv.textContent || tempDiv.innerText || "";
            setWordCount(countWords(plainText));
            setCharCount(plainText.length);
          }}
          onChange={(_event, editor) => {
            const htmlData = editor.getData();
            onChange(htmlData);

            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = htmlData;
            const plainText = tempDiv.textContent || tempDiv.innerText || "";
            setWordCount(countWords(plainText));
            setCharCount(plainText.length);

            // Detectar slash commands enquanto digita
            checkForSlashCommand(plainText, editor);

            if (!readOnly) {
              handleUserInput();
            }
          }}
          onError={(error, { willEditorRestart }) => {
            console.error("CKEditor error:", error);
            if (willEditorRestart) {
              editorRef.current = null;
            }
          }}
        />
      </div>

      {/* Footer */}
      <div className="professional-editor-footer">
        <div className="text-xs text-muted-foreground">
          {wordCount} {wordCount === 1 ? "palavra" : "palavras"} • {charCount}{" "}
          {charCount === 1 ? "caractere" : "caracteres"}
        </div>
      </div>
    </div>
  );
}
```

---

## 📁 4. DASHBOARD PRINCIPAL - Dashboard.tsx
**Caminho:** `src/components/Dashboard.tsx`

```tsx
import DJENPublicationsWidget from "@/components/DJENPublicationsWidget";
import { HybridAgentsStatsPanel } from "@/components/HybridAgentsStatsPanel";
import { PJeDocumentWidget, PJeStatusBadge } from "@/components/PJeDocumentWidget";
import { PjeImageImporter } from "@/components/PjeImageImporter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKV } from "@/hooks/use-kv";
import { calcularDiasRestantes, formatarData, isUrgente } from "@/lib/prazos";
import type { Prazo, Process, ViewType } from "@/types";
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  ChartPie,
  CheckCircle,
  Clock,
  Gavel,
  TrendingUp,
  Upload,
} from "lucide-react";
import { lazy, Suspense, useMemo } from "react";

// Lazy load dashboard sections for better code splitting
const StatusChart = lazy(() =>
  import("@/components/DashboardCharts").then((m) => ({
    default: m.StatusChart,
  }))
);
const VaraChart = lazy(() =>
  import("@/components/DashboardCharts").then((m) => ({ default: m.VaraChart }))
);
const TrendChart = lazy(() =>
  import("@/components/DashboardCharts").then((m) => ({
    default: m.TrendChart,
  }))
);

// Funções auxiliares para evitar ternários aninhados
function formatDiasRestantes(diasRestantes: number): string {
  if (diasRestantes < 0) return "Vencido";
  if (diasRestantes === 0) return "Hoje";
  if (diasRestantes === 1) return "Amanhã";
  return `${diasRestantes} dias`;
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "ativo") return "default";
  if (status === "concluido") return "secondary";
  if (status === "suspenso") return "outline";
  return "destructive";
}

interface DashboardProps {
  readonly onNavigate: (view: ViewType) => void;
}

function getSafeDate(value?: string) {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

export default function Dashboard({ onNavigate }: Readonly<DashboardProps>) {
  const [processes] = useKV<Process[]>("processes", []);

  const stats = useMemo(() => {
    const processesList = processes || [];
    const ativos = processesList.filter((p) => p.status === "ativo").length;
    const concluidos = processesList.filter((p) => p.status === "concluido").length;

    const todosPrazos: (Prazo & { processoTitulo: string })[] = [];
    processesList.forEach((process) => {
      if (process.prazos && Array.isArray(process.prazos)) {
        process.prazos.forEach((prazo) => {
          todosPrazos.push({
            ...prazo,
            processoTitulo: process.titulo,
          });
        });
      }
    });

    const prazosPendentes = todosPrazos.filter((p) => !p.concluido).length;
    const prazosUrgentes = todosPrazos.filter((p) => {
      if (p.concluido) return false;
      const dias = calcularDiasRestantes(p.dataFinal);
      return isUrgente(dias);
    }).length;

    return {
      ativos,
      concluidos,
      prazosPendentes,
      prazosUrgentes,
      todosPrazos: todosPrazos.filter((p) => !p.concluido).slice(0, 5),
    };
  }, [processes]);

  const prazosProximos = useMemo(() => {
    const todosPrazos: (Prazo & { processoTitulo: string })[] = [];
    const processesList = processes || [];

    processesList.forEach((process) => {
      if (process.prazos && Array.isArray(process.prazos)) {
        process.prazos.forEach((prazo) => {
          todosPrazos.push({
            ...prazo,
            processoTitulo: process.titulo,
          });
        });
      }
    });

    return todosPrazos
      .filter((p) => !p.concluido)
      .sort((a, b) => {
        const diasA = calcularDiasRestantes(a.dataFinal);
        const diasB = calcularDiasRestantes(b.dataFinal);
        return diasA - diasB;
      })
      .slice(0, 5);
  }, [processes]);

  const processosRecentes = useMemo(() => {
    return [...(processes || [])]
      .sort(
        (a, b) => getSafeDate(b.updatedAt || b.createdAt) - getSafeDate(a.updatedAt || a.createdAt)
      )
      .slice(0, 5);
  }, [processes]);

  const chartData = useMemo(() => {
    const processesList = processes || [];

    const statusData = [
      {
        name: "Ativo",
        value: processesList.filter((p) => p.status === "ativo").length,
        color: "#3b82f6", // blue-500
      },
      {
        name: "Concluído",
        value: processesList.filter((p) => p.status === "concluido").length,
        color: "#22c55e", // green-500
      },
      {
        name: "Suspenso",
        value: processesList.filter((p) => p.status === "suspenso").length,
        color: "#f59e0b", // amber-500
      },
      {
        name: "Arquivado",
        value: processesList.filter((p) => p.status === "arquivado").length,
        color: "#6b7280", // gray-500
      },
    ].filter((item) => item.value > 0);

    const varaData: { [key: string]: number } = {};
    processesList.forEach((p) => {
      const vara = p.vara || "Não especificada";
      varaData[vara] = (varaData[vara] || 0) + 1;
    });
    const varaChartData = Object.entries(varaData)
      .map(([name, value]) => ({
        name: name.length > 25 ? name.substring(0, 25) + "..." : name,
        value,
      }))
      .slice(0, 5);

    const monthlyData: {
      [key: string]: { ativos: number; concluidos: number };
    } = {};

    processesList.forEach((p) => {
      if (!p.createdAt) return;
      const created = new Date(p.createdAt);
      if (Number.isNaN(created.getTime())) return;

      const month = created.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });

      if (!monthlyData[month]) {
        monthlyData[month] = { ativos: 0, concluidos: 0 };
      }
      if (p.status === "concluido") {
        monthlyData[month].concluidos++;
      } else {
        monthlyData[month].ativos++;
      }
    });

    const trendData = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .slice(-6);

    return { statusData, varaChartData, trendData };
  }, [processes]);

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral da sua gestão processual</p>
          </div>

          <div className="flex items-center gap-2">
            <PJeStatusBadge />
            <PJeDocumentWidget />
            <PjeImageImporter />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-glow-hover status-gradient-active">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
            <Gavel className="text-secondary neon-glow" size={24} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text">{stats.ativos}</div>
            <p className="text-xs text-muted-foreground mt-1">Em andamento</p>
          </CardContent>
        </Card>

        <Card className="card-glow-hover status-gradient-completed">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processos Concluídos</CardTitle>
            <CheckCircle className="text-accent neon-glow" size={24} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text">{stats.concluidos}</div>
            <p className="text-xs text-muted-foreground mt-1">Finalizados</p>
          </CardContent>
        </Card>

        <Card className="card-glow-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prazos Pendentes</CardTitle>
            <Clock className="text-primary neon-glow" size={24} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text">{stats.prazosPendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">Não concluídos</p>
          </CardContent>
        </Card>

        <Card
          className={`card-glow-hover ${
            stats.prazosUrgentes > 0 ? "status-gradient-urgent border-destructive/50" : ""
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prazos Urgentes</CardTitle>
            <AlertCircle
              className={stats.prazosUrgentes > 0 ? "text-destructive neon-glow" : "text-primary"}
              size={24}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                stats.prazosUrgentes > 0 ? "text-destructive" : "gradient-text"
              }`}
            >
              {stats.prazosUrgentes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Próximos 5 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Painel de Estatísticas de Agentes Híbridos */}
      <HybridAgentsStatsPanel />

      {/* DJEN Publications Widget + Upload PDF */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="card-glow border-primary/30 bg-linear-to-br from-primary/10 via-secondary/10 to-accent/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 gradient-text">
                <Upload size={24} />
                Nova Funcionalidade: Upload de PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Agora você pode fazer upload de procurações e contratos em PDF para extrair
                automaticamente os dados do cliente usando IA!
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle size={14} />
                  Extração automática
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle size={14} />
                  Powered by Gemini 2.5 Pro
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle size={14} />
                  Salva automaticamente
                </Badge>
              </div>
              <Button
                onClick={() => onNavigate("upload-pdf")}
                className="button-gradient w-full sm:w-auto"
                size="lg"
              >
                <Upload size={20} />
                Testar Upload de PDF
              </Button>
            </CardContent>
          </Card>
        </div>

        <DJENPublicationsWidget
          onViewAll={() => onNavigate("expedientes")}
          compact={true}
          maxItems={4}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="card-glow-hover glassmorphic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 gradient-text">
              <ChartPie size={24} />
              Processos por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                  Carregando gráfico...
                </div>
              }
            >
              <StatusChart chartData={chartData} />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="card-glow-hover glassmorphic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 gradient-text">
              <Gavel size={24} />
              Top 5 Varas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                  Carregando gráfico...
                </div>
              }
            >
              <VaraChart chartData={chartData} />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="card-glow-hover glassmorphic lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 gradient-text">
              <TrendingUp size={24} />
              Evolução (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                  Carregando gráfico...
                </div>
              }
            >
              <TrendChart chartData={chartData} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Prazos e Processos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-glow-hover glassmorphic">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="gradient-text">Próximos Prazos</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("prazos")}
              className="hover:button-gradient hover:text-primary-foreground"
            >
              Ver todos
              <ArrowRight size={16} />
            </Button>
          </CardHeader>
          <CardContent>
            {prazosProximos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarCheck size={48} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum prazo pendente</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {prazosProximos.map((prazo) => {
                  const diasRestantes = calcularDiasRestantes(prazo.dataFinal);
                  const urgente = isUrgente(diasRestantes);

                  return (
                    <div
                      key={prazo.id}
                      className={`flex items-start justify-between gap-3 pb-3 border-b last:border-0 p-3 rounded-lg transition-all ${
                        urgente ? "status-gradient-urgent" : "hover:bg-card/50"
                      }`}
                    >
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{prazo.descricao}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {prazo.processoTitulo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatarData(prazo.dataFinal)}
                        </p>
                      </div>
                      <Badge
                        variant={urgente ? "destructive" : "default"}
                        className={`shrink-0 ${urgente ? "neon-glow" : ""}`}
                      >
                        {formatDiasRestantes(diasRestantes)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-glow-hover glassmorphic">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="gradient-text">Processos Recentes</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("processos")}
              className="hover:button-gradient hover:text-primary-foreground"
            >
              Ver todos
              <ArrowRight size={16} />
            </Button>
          </CardHeader>
          <CardContent>
            {processosRecentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Gavel size={48} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum processo cadastrado</p>
                <Button
                  size="sm"
                  className="mt-3 button-gradient"
                  onClick={() => onNavigate("processos")}
                >
                  Adicionar Processo
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {processosRecentes.map((process) => (
                  <div
                    key={process.id}
                    className={`flex items-start justify-between gap-3 pb-3 border-b last:border-0 p-3 rounded-lg transition-all hover:bg-card/50 ${
                      process.status === "ativo" ? "status-gradient-active" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{process.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">{process.numeroCNJ}</p>
                    </div>
                    <Badge variant={getStatusVariant(process.status)} className="shrink-0">
                      {process.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Prazos Urgentes */}
      {stats.prazosUrgentes > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle size={24} />
              Atenção: Prazos Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Você tem {stats.prazosUrgentes} prazo
              {stats.prazosUrgentes > 1 ? "s" : ""} vencendo nos próximos 5 dias. Certifique-se de
              tomar as providências necessárias.
            </p>
            <Button variant="destructive" size="sm" onClick={() => onNavigate("prazos")}>
              Ver Prazos Urgentes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## 📁 5. IMPORTAÇÃO POR IMAGEM (OCR) - PjeImageImporter.tsx
**Caminho:** `src/components/PjeImageImporter.tsx`

```tsx
/**
 * PjeImageImporter - Componente para importar processos via imagem/screenshot
 * Upload de imagens do PJe e extração automática de dados via OCR
 */

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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useKV } from "@/hooks/use-kv";
import { processarImagemPJe, type PjeDocumentData } from "@/lib/pje-ocr-extractor";
import type { Expediente, Process } from "@/types";
import { AlertCircle, Camera, CheckCircle, FileImage, Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

export function PjeImageImporter() {
  const [_processes, setProcesses] = useKV<Process[]>("processes", []);
  const [_expedientes, setExpedientes] = useKV<Expediente[]>("expedientes", []);

  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<PjeDocumentData | null>(null);
  const [processoGerado, setProcessoGerado] = useState<Partial<Process> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo: 10MB");
      return;
    }

    setSelectedImage(file);

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    toast.success(`Imagem "${file.name}" selecionada`);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, solte uma imagem válida");
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    toast.success(`Imagem "${file.name}" carregada`);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const processImage = useCallback(async () => {
    if (!selectedImage) {
      toast.error("Selecione uma imagem primeiro");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProgressStage("Iniciando...");

    const toastId = toast.loading("Processando imagem...");

    try {
      const result = await processarImagemPJe(selectedImage, (stage, prog) => {
        setProgressStage(stage);
        setProgress(prog);
      });

      setExtractedData(result.dadosOriginais);
      setProcessoGerado(result.processo);

      toast.success("✅ Imagem processada com sucesso!", { id: toastId });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro ao processar imagem";
      toast.error(errorMsg, { id: toastId });
      console.error("[PjeImageImporter] Erro:", error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressStage("");
    }
  }, [selectedImage]);

  const salvarProcesso = useCallback(() => {
    if (!processoGerado || !extractedData) {
      toast.error("Nenhum dado para salvar");
      return;
    }

    // Criar processo
    const novoProcesso: Process = {
      id: `process-${Date.now()}`,
      numeroCNJ: processoGerado.numeroCNJ || "",
      titulo: processoGerado.titulo || "Processo Importado",
      autor: processoGerado.autor || "",
      reu: processoGerado.reu || "",
      comarca: processoGerado.comarca || "Não identificado",
      vara: processoGerado.vara || "Não identificado",
      fase: "inicial",
      status: "ativo",
      dataDistribuicao: new Date().toISOString(),
      dataUltimaMovimentacao: new Date().toISOString(),
      prazos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Criar expediente
    const novoExpediente: Expediente = {
      id: `exp-${Date.now()}`,
      processId: novoProcesso.id,
      tipo: "intimacao" as const,
      dataRecebimento: extractedData.dataExpedicao || new Date().toISOString(),
      conteudo: extractedData.conteudo,
      lido: true,
      titulo: `${extractedData.tipoDocumento?.toUpperCase() || "DOCUMENTO"} - Importado via OCR`,
    };

    // Salvar
    setProcesses((current) => [...(current || []), novoProcesso]);
    setExpedientes((current) => [...(current || []), novoExpediente]);

    toast.success("✅ Processo e expediente salvos com sucesso!");

    // Reset
    setSelectedImage(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setProcessoGerado(null);
    setProgress(0);
    setProgressStage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsOpen(false);
  }, [processoGerado, extractedData, setProcesses, setExpedientes]);

  const resetForm = useCallback(() => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setProcessoGerado(null);
    setProgress(0);
    setProgressStage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Camera className="h-4 w-4" />
          Importar do PJe (Imagem)
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5 text-primary" />
            Importar Processo via Screenshot/Imagem
          </DialogTitle>
          <DialogDescription>
            Tire um print do PJe ou faça upload de uma certidão/expediente. O sistema extrairá
            automaticamente os dados usando OCR (Reconhecimento Óptico de Caracteres).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 gap-6">
            {/* Coluna Esquerda: Upload e Preview */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">1. Upload da Imagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    {previewUrl ? (
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded border"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            resetForm();
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Clique ou arraste uma imagem aqui
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, JPEG (máx. 10MB)</p>
                      </>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {selectedImage && (
                    <div className="mt-4 text-xs text-muted-foreground">
                      📄 {selectedImage.name} ({(selectedImage.size / 1024).toFixed(0)} KB)
                    </div>
                  )}
                </CardContent>
              </Card>

              {isProcessing && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{progressStage}</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Coluna Direita: Dados Extraídos */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">2. Dados Extraídos</CardTitle>
                  <CardDescription>Revise e edite os dados antes de salvar</CardDescription>
                </CardHeader>
                <CardContent>
                  {extractedData ? (
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Número do Processo
                          </Label>
                          <Input
                            value={processoGerado?.numeroCNJ || "Não identificado"}
                            onChange={(e) =>
                              setProcessoGerado((prev) =>
                                prev ? { ...prev, numeroCNJ: e.target.value } : null
                              )
                            }
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Tipo de Documento</Label>
                          <Input
                            value={extractedData.tipoDocumento || "Não identificado"}
                            readOnly
                            className="mt-1 bg-muted"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Autor</Label>
                          <Input
                            value={processoGerado?.autor || ""}
                            onChange={(e) =>
                              setProcessoGerado((prev) =>
                                prev ? { ...prev, autor: e.target.value } : null
                              )
                            }
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Réu</Label>
                          <Input
                            value={processoGerado?.reu || ""}
                            onChange={(e) =>
                              setProcessoGerado((prev) =>
                                prev ? { ...prev, reu: e.target.value } : null
                              )
                            }
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Comarca</Label>
                          <Input
                            value={processoGerado?.comarca || ""}
                            onChange={(e) =>
                              setProcessoGerado((prev) =>
                                prev ? { ...prev, comarca: e.target.value } : null
                              )
                            }
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Vara</Label>
                          <Input
                            value={processoGerado?.vara || ""}
                            onChange={(e) =>
                              setProcessoGerado((prev) =>
                                prev ? { ...prev, vara: e.target.value } : null
                              )
                            }
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Data de Expedição</Label>
                          <Input
                            value={extractedData.dataExpedicao || ""}
                            readOnly
                            className="mt-1 bg-muted"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Texto Completo (OCR)
                          </Label>
                          <textarea
                            value={extractedData.conteudo}
                            readOnly
                            className="mt-1 w-full h-32 p-2 text-xs border rounded bg-muted font-mono"
                          />
                        </div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="h-96 flex items-center justify-center text-center text-muted-foreground">
                      <div>
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">
                          Faça upload de uma imagem e clique em "Processar" para extrair os dados
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            {extractedData && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Dados extraídos com sucesso
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>

            {!extractedData ? (
              <Button onClick={processImage} disabled={!selectedImage || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Processar Imagem
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={salvarProcesso}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Salvar Processo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📁 6. SERVIÇO GEMINI AI - gemini-service.ts
**Caminho:** `src/lib/gemini-service.ts`

```typescript
/**
 * Gemini Service - Serviço de IA Jurídica
 *
 * Módulo de funções especializadas para tarefas jurídicas usando o Gemini 2.5 Pro.
 * Implementa análise de documentos, geração de petições, cálculo de prazos e mais.
 *
 * IMPORTANTE:
 * - Este módulo deve ser utilizado apenas em ambiente server-side (API routes / server actions),
 *   nunca diretamente no browser, para não expor a API key.
 *
 * @module gemini-service
 * @version 2.1.0
 * @since 2025-11-28
 */

import { withRetry, type RetryConfig } from "@/lib/ai-providers";
import { getGeminiApiKey, isGeminiConfigured, validateGeminiApiKey } from "@/lib/gemini-config";
import { instrumentGeminiCall } from "@/lib/sentry-gemini-integration";
import { createChatSpan } from "@/lib/sentry-gemini-integration-v2";
// 🔍 TRACING: OpenTelemetry
import { endLLMSpan, startLLMSpan } from "@/lib/tracing";

/**
 * Extract error message from unknown error type
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Erro desconhecido ao chamar Gemini";
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/** Configuração do modelo Gemini */
export interface GeminiConfig {
  /** ID do modelo (default: gemini-2.5-pro) */
  model: string;
  /** Temperatura para geração (0.0 - 1.0, default: 0.7) */
  temperature?: number;
  /** Número máximo de tokens na resposta (default: 4096) */
  maxOutputTokens?: number;
  /** Configuração de retry (opcional) */
  retryConfig?: Partial<RetryConfig>;
}

/** Parte de uma mensagem (texto simples) */
export interface GeminiPart {
  text: string;
}

/** Mensagem no formato Gemini (multi-turn) */
export interface GeminiMessage {
  role: "user" | "model";
  parts: Array<GeminiPart>;
}

/** Resposta padronizada do Gemini */
export interface GeminiResponse {
  /** Texto da resposta (vazio se erro) */
  text: string;
  /** Mensagem de erro (undefined se sucesso) */
  error?: string;
  /** Metadados da resposta */
  metadata?: {
    model: string;
    promptTokens?: number;
    responseTokens?: number;
    totalTokens?: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Configuração padrão do Gemini */
const DEFAULT_CONFIG: GeminiConfig = {
  model: "gemini-2.5-pro",
  temperature: 0.7,
  maxOutputTokens: 4096,
};

/** URL base da API Gemini */
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1/models";

/** Timeout padrão de requisição (em ms) para evitar funções travadas */
const DEFAULT_TIMEOUT_MS = 25_000;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Valida formato da API key do Gemini
 * API keys do Gemini começam com "AIza" e têm ~39 caracteres
 */
function validateGeminiApiKeyFormat(apiKey: string | undefined): boolean {
  if (!apiKey) {
    if (import.meta.env.DEV) {
      console.warn("[GeminiService] ⚠️ API key não fornecida");
      console.warn("[GeminiService] Configure VITE_GEMINI_API_KEY no .env.local");
      console.warn("[GeminiService] Obtenha em: https://aistudio.google.com/app/apikey");
    }
    return false;
  }

  if (!apiKey.startsWith("AIza")) {
    console.warn('[GeminiService] ⚠️ Formato de API key inválido - deve começar com "AIza"');
    console.warn("[GeminiService] Verifique VITE_GEMINI_API_KEY no .env.local");
    return false;
  }

  if (apiKey.length < 30) {
    console.warn("[GeminiService] ⚠️ API key muito curta - verifique a configuração");
    return false;
  }

  return true;
}

/**
 * Normaliza a resposta do Gemini numa estrutura GeminiResponse.
 */
function normalizeGeminiResponse(
  data: {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  },
  model: string
): GeminiResponse {
  const rawText =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || "")
      .join("\n")
      .trim() || "";

  const metadata = {
    model,
    promptTokens: data?.usageMetadata?.promptTokenCount,
    responseTokens: data?.usageMetadata?.candidatesTokenCount,
    totalTokens: data?.usageMetadata?.totalTokenCount,
  };

  if (!rawText) {
    return {
      text: "",
      error: "Resposta vazia do modelo Gemini",
      metadata,
    };
  }

  return { text: rawText, metadata };
}

/**
 * Gera mensagem de erro mais amigável e loga detalhes no servidor.
 */
function buildGeminiError(
  error: unknown,
  context?: { endpoint?: string; model?: string }
): GeminiResponse {
  // Log completo no servidor (sem dados sensíveis do usuário)
  console.error("[GeminiService] Erro na chamada", {
    error,
    endpoint: context?.endpoint,
    model: context?.model,
  });

  const message = getErrorMessage(error);

  return {
    text: "",
    error: message,
  };
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Função principal para chamar a API do Gemini com um único prompt de texto.
 * Implementa:
 * - validação de configuração
 * - timeout de requisição
 * - retry automático (via withRetry)
 *
 * @param prompt - Texto do prompt a ser enviado
 * @param config - Configurações opcionais (model, temperature, maxOutputTokens, retryConfig)
 */
export async function callGemini(
  prompt: string,
  config: Partial<GeminiConfig> = {}
): Promise<GeminiResponse> {
  // 🧪 MOCK para testes (retorna resposta simulada instantaneamente)
  const useMock = process.env.USE_MOCK_GEMINI === "true" || process.env.NODE_ENV === "test";
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simular latência mínima
    return {
      text: "Resposta mockada do Gemini para testes",
      metadata: {
        model: config.model || "gemini-2.5-pro",
        promptTokens: 50,
        responseTokens: 20,
        totalTokens: 70,
      },
    };
  }

  // Criar span de tracing para chamada LLM
  const llmSpan = startLLMSpan("gemini-2.5-pro", {
    temperature: config.temperature,
    maxTokens: config.maxOutputTokens,
    attributes: {
      "llm.operation": "generateContent",
      "llm.prompt_length": prompt.length,
    },
  });
  // Variáveis no escopo externo para uso no catch
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let endpoint = "";

  try {
    // Validação de configuração básica
    if (!isGeminiConfigured()) {
      const errorResponse = {
        text: "",
        error:
          "API do Gemini não configurada. Configure VITE_GEMINI_API_KEY (ou equivalente) no ambiente do servidor.",
      };

      await endLLMSpan(llmSpan, {
        promptTokens: 0,
        completionTokens: 0,
        success: false,
        error: new Error(errorResponse.error),
      });

      return errorResponse;
    }

    // Obtém e valida API key
    let apiKey: string;
    try {
      apiKey = getGeminiApiKey();

      // ✅ Validar formato da API key
      if (!validateGeminiApiKeyFormat(apiKey)) {
        const errorResponse = {
          text: "",
          error: "API key do Gemini em formato inválido. Deve começar com 'AIza'",
        };

        await endLLMSpan(llmSpan, {
          promptTokens: 0,
          completionTokens: 0,
          success: false,
          error: new Error(errorResponse.error),
        });

        return errorResponse;
      }
    } catch (error) {
      const errorResponse = {
        text: "",
        error: error instanceof Error ? error.message : "Erro ao obter API key do Gemini",
      };

      await endLLMSpan(llmSpan, {
        promptTokens: 0,
        completionTokens: 0,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });

      return errorResponse;
    }

    endpoint = `${GEMINI_API_BASE}/${finalConfig.model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const makeRequest = async (): Promise<GeminiResponse> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

      try {
        // 🔍 Instrumentar chamada Gemini com Sentry
        const geminiWrapper = instrumentGeminiCall<Response>(
          {
            model: finalConfig.model,
            operation: "generate_content",
            prompt,
            temperature: finalConfig.temperature,
            maxTokens: finalConfig.maxOutputTokens,
            startTime: Date.now(),
          },
          {
            includePrompts: true,
            captureErrors: true,
          }
        );

        const response = await geminiWrapper(async () =>
          fetch(endpoint, {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: finalConfig.temperature,
                maxOutputTokens: finalConfig.maxOutputTokens,
              },
            }),
          })
        );

        if (!response.ok) {
          let errorMessage = "Erro ao chamar API do Gemini";

          try {
            const errorBody = await response.json();
            errorMessage =
              errorBody.error?.message ||
              `${errorMessage} (HTTP ${response.status}: ${response.statusText})`;
          } catch {
            const text = await response.text();
            errorMessage = text
              ? `${errorMessage} (HTTP ${response.status}): ${text}`
              : `${errorMessage} (HTTP ${response.status}: ${response.statusText})`;
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        return normalizeGeminiResponse(data, finalConfig.model);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const result = await withRetry(makeRequest, finalConfig.retryConfig);

    // Finalizar span com sucesso
    await endLLMSpan(llmSpan, {
      promptTokens: result.metadata?.promptTokens || 0,
      completionTokens: result.metadata?.responseTokens || 0,
      success: !result.error,
      error: result.error ? new Error(result.error) : undefined,
    });

    return result;
  } catch (error) {
    // Finalizar span com erro
    await endLLMSpan(llmSpan, {
      promptTokens: 0,
      completionTokens: 0,
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    });

    return buildGeminiError(error, { endpoint, model: finalConfig.model });
  }
}

/**
 * Versão avançada: aceita um array de mensagens GeminiMessage (multi-turn).
 * Útil para chat jurídico com histórico.
 *
 * @param messages - Mensagens no formato Gemini (role + parts.text)
 * @param config - Configurações opcionais
 */
export async function callGeminiWithMessages(
  messages: Array<GeminiMessage>,
  config: Partial<GeminiConfig> = {}
): Promise<GeminiResponse> {
  if (!isGeminiConfigured()) {
    return {
      text: "",
      error:
        "API do Gemini não configurada. Configure VITE_GEMINI_API_KEY (ou equivalente) no ambiente do servidor.",
    };
  }

  let apiKey: string;
  try {
    apiKey = getGeminiApiKey();
    if (!validateGeminiApiKey(apiKey)) {
      return {
        text: "",
        error: "API key do Gemini parece estar em formato inválido",
      };
    }
  } catch (error) {
    return {
      text: "",
      error: error instanceof Error ? error.message : "Erro ao obter API key do Gemini",
    };
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const endpoint = `${GEMINI_API_BASE}/${finalConfig.model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const makeRequest = async (): Promise<GeminiResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: messages.map((m) => ({
            role: m.role,
            parts: m.parts.map((p) => ({ text: p.text })),
          })),
          generationConfig: {
            temperature: finalConfig.temperature,
            maxOutputTokens: finalConfig.maxOutputTokens,
          },
        }),
      });

      if (!response.ok) {
        let errorMessage = "Erro ao chamar API do Gemini";

        try {
          const errorBody = await response.json();
          errorMessage =
            errorBody.error?.message ||
            `${errorMessage} (HTTP ${response.status}: ${response.statusText})`;
        } catch {
          const text = await response.text();
          errorMessage = text
            ? `${errorMessage} (HTTP ${response.status}): ${text}`
            : `${errorMessage} (HTTP ${response.status}: ${response.statusText})`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      return normalizeGeminiResponse(data, finalConfig.model);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    return await withRetry(makeRequest, finalConfig.retryConfig);
  } catch (error) {
    return buildGeminiError(error, { endpoint, model: finalConfig.model });
  }
}

// ============================================================================
// SPECIALIZED LEGAL FUNCTIONS
// ============================================================================

/**
 * Analisa um documento jurídico e retorna um resumo estruturado.
 * Ideal para análise de contratos, petições, decisões, etc.
 */
export async function analyzeDocument(documentText: string): Promise<GeminiResponse> {
  const prompt = `Você é um assistente jurídico especializado. Analise o seguinte documento e forneça um resumo estruturado:

Documento:
${documentText}

Por favor, forneça:
1. Tipo de documento
2. Partes envolvidas (se identificáveis)
3. Assunto principal
4. Prazos mencionados (se houver)
5. Principais pontos de atenção (riscos, cláusulas sensíveis, etc.)
6. Sugestões de ação prática para o advogado

Responda de forma clara, objetiva e em português jurídico, mas acessível.`;

  return callGemini(prompt, { temperature: 0.3 });
}

/**
 * Gera uma minuta de petição com base no tipo e detalhes fornecidos.
 * Segue as melhores práticas jurídicas brasileiras e o CPC.
 */
export async function generatePeticao(tipo: string, detalhes: string): Promise<GeminiResponse> {
  const prompt = `Você é um assistente jurídico especializado em redação de peças processuais brasileiras.

Tipo de petição: ${tipo}
Detalhes do caso:
${detalhes}

Elabore uma minuta de ${tipo} seguindo as melhores práticas, incluindo:
- Endereçamento adequado ao juízo
- Qualificação das partes (de forma genérica se não houver dados)
- Exposição dos fatos
- Fundamentação jurídica (leis, princípios e, se possível, referências jurisprudenciais sem inventar números de processo)
- Pedidos claros e objetivos
- Fecho com local, data e assinatura do advogado (placeholder)

A peça deve estar em conformidade com o CPC/2015 e a legislação vigente.`;

  // 🔍 Instrumentar com Sentry AI (v2.0.0 - OpenTelemetry)
  return createChatSpan(
    {
      agentName: "Redação de Petições",
      system: "gemini",
      model: "gemini-2.5-pro",
      temperature: 0.5,
      maxTokens: 4096,
    },
    [{ role: "user", content: prompt }],
    async (span) => {
      const response = await callGemini(prompt, { temperature: 0.5, maxOutputTokens: 4096 });

      // Adicionar metadata ao span
      if (span && response.metadata) {
        span.setAttribute("gen_ai.response.text", JSON.stringify([response.text]));
        span.setAttribute("gen_ai.usage.input_tokens", response.metadata.promptTokens || 0);
        span.setAttribute("gen_ai.usage.output_tokens", response.metadata.responseTokens || 0);
        span.setAttribute("gen_ai.usage.total_tokens", response.metadata.totalTokens || 0);
        span.setAttribute("gen_ai.petition.type", tipo);
      }

      return response;
    }
  );
}

/**
 * Analisa e calcula prazos processuais com base na legislação brasileira.
 * Considera dias úteis vs corridos e peculiaridades do tipo de processo.
 */
export async function calculateDeadline(
  publicationDate: string,
  deadlineDays: number,
  context: string
): Promise<GeminiResponse> {
  const prompt = `Você é um assistente jurídico especializado em prazos processuais no Brasil.

Data de publicação da intimação: ${publicationDate}
Prazo em dias indicado: ${deadlineDays}
Contexto do caso: ${context}

Analise e responda:
1. Se o prazo informado está correto para esse tipo de situação.
2. Se a contagem é em dias corridos ou úteis, indicando o fundamento (ex.: CPC, CLT etc.).
3. Se há regras especiais aplicáveis (ex.: Justiça do Trabalho, Juizados Especiais, Fazenda Pública).
4. Qual seria a data final estimada, explicando a lógica da contagem.
5. Algum alerta prático (ex.: feriados locais, necessidade de conferir calendário do tribunal).

Não invente feriados específicos; apenas alerte que eles podem impactar a contagem.`;

  return callGemini(prompt, { temperature: 0.2 });
}

/**
 * Sugere estratégias processuais para um caso jurídico.
 * Analisa pontos fortes/fracos, riscos e recomendações.
 */
export async function suggestStrategy(caseDescription: string): Promise<GeminiResponse> {
  const prompt = `Você é um estrategista jurídico. Analise o seguinte caso e sugira estratégias:

Descrição do caso:
${caseDescription}

Por favor, forneça:
1. Análise objetiva da situação (cenário jurídico).
2. Pontos fortes e fracos da posição do cliente.
3. Possíveis estratégias processuais e extrajudiciais.
4. Riscos relevantes e como mitigá-los.
5. Recomendações de próximos passos práticos.
6. Linhas de jurisprudência ou temas que vale a pena pesquisar (sem inventar números de processo).

Responda como se estivesse orientando um advogado que atua no dia a dia do foro.`;

  return callGemini(prompt, { temperature: 0.6 });
}

/**
 * Resume e analisa jurisprudência (acórdãos e decisões).
 * Extrai tese jurídica, fundamentos e aplicabilidade.
 */
export async function summarizeJurisprudence(jurisprudenceText: string): Promise<GeminiResponse> {
  const prompt = `Você é um assistente jurídico especializado em análise de jurisprudência. Analise o seguinte acórdão/decisão:

${jurisprudenceText}

Forneça:
1. Resumo do caso concreto.
2. Tese jurídica principal firmada.
3. Fundamentos legais (artigos de lei, princípios) utilizados.
4. Resultado do julgamento (procedente, improcedente, parcial, etc.).
5. Em quais tipos de casos essa decisão é particularmente útil.
6. Palavras-chave para indexação (em formato de lista).`;

  return callGemini(prompt, { temperature: 0.3 });
}

/**
 * Responde perguntas jurídicas com fundamentação legal.
 * Baseado no ordenamento jurídico brasileiro.
 */
export async function answerLegalQuestion(question: string): Promise<GeminiResponse> {
  const prompt = `Você é um assistente jurídico especializado no ordenamento brasileiro. Responda à pergunta a seguir:

Pergunta:
${question}

Responda em 5 blocos:
1. Resposta direta e objetiva (sim/não/depende + explicação curta).
2. Fundamentação legal (leis, artigos, dispositivos relevantes).
3. Entendimento predominante na jurisprudência (sem inventar números de processos).
4. Observações práticas para atuação do advogado.
5. Riscos, exceções ou controvérsias relevantes.`;

  return callGemini(prompt, { temperature: 0.4 });
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Re-exporta funções de configuração para conveniência
 */
export { isGeminiConfigured, validateGeminiApiKey } from "@/lib/gemini-config";
```

---

## 📁 7. HOOK COMANDOS IA - use-ai-commands.ts
**Caminho:** `src/hooks/use-ai-commands.ts`

```typescript
import { useCallback, useEffect, useRef, useState } from "react";

type AICommand = "continuar" | "expandir" | "revisar" | "formalizar";

interface RateLimitInfo {
  limitMs: number;
  canRequest: boolean;
  waitTime: number;
}

interface StatusResponse {
  status: string;
  commands: string[];
  rateLimit: RateLimitInfo;
  timestamp: string;
}

interface SSEEvent {
  text?: string;
  done?: boolean;
  error?: string;
}

interface UseAICommandsReturn {
  continuar: (texto: string, onChunk: (chunk: string) => void) => Promise<void>;
  expandir: (texto: string, onChunk: (chunk: string) => void) => Promise<void>;
  revisar: (texto: string, onChunk: (chunk: string) => void) => Promise<void>;
  formalizar: (texto: string, onChunk: (chunk: string) => void) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  canRequest: boolean;
  waitTime: number;
  checkStatus: () => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function parseSSELine(line: string): SSEEvent | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data: ")) return null;

  try {
    return JSON.parse(trimmed.slice(6)) as SSEEvent;
  } catch {
    return null;
  }
}

export function useAICommands(): UseAICommandsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canRequest, setCanRequest] = useState(true);
  const [waitTime, setWaitTime] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const rateLimitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Automatically reset canRequest after waitTime expires
  useEffect(() => {
    if (!canRequest && waitTime > 0) {
      // Clear any existing timer
      if (rateLimitTimerRef.current) {
        clearTimeout(rateLimitTimerRef.current);
      }

      // Set timer to re-enable requests after waitTime
      rateLimitTimerRef.current = setTimeout(() => {
        setCanRequest(true);
        setWaitTime(0);
        rateLimitTimerRef.current = null;
      }, waitTime);
    }

    return () => {
      if (rateLimitTimerRef.current) {
        clearTimeout(rateLimitTimerRef.current);
      }
    };
  }, [canRequest, waitTime]);

  const checkStatus = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: StatusResponse = await response.json();
      setCanRequest(data.rateLimit.canRequest);
      setWaitTime(data.rateLimit.waitTime);
    } catch (err) {
      console.error("[useAICommands] Failed to check status:", err);
    }
  }, []);

  const executeCommand = useCallback(
    async (command: AICommand, texto: string, onChunk: (chunk: string) => void): Promise<void> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/ai/${command}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ texto }),
          signal: abortControllerRef.current.signal,
        });

        if (response.status === 429) {
          const data = await response.json();
          setCanRequest(false);
          setWaitTime(data.waitTime || 2000);
          setError(data.message || "Rate limit exceeded");
          throw new Error(data.message || "Rate limit exceeded");
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const errorMsg = data.message || `HTTP ${response.status}`;
          setError(errorMsg);
          throw new Error(errorMsg);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Streaming not supported");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const event = parseSSELine(line);
            if (!event) continue;

            if (event.text) {
              onChunk(event.text);
            } else if (event.error) {
              setError(event.error);
              throw new Error(event.error);
            } else if (event.done) {
              setCanRequest(true);
              setWaitTime(0);
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    []
  );

  const continuar = useCallback(
    (texto: string, onChunk: (chunk: string) => void): Promise<void> =>
      executeCommand("continuar", texto, onChunk),
    [executeCommand]
  );

  const expandir = useCallback(
    (texto: string, onChunk: (chunk: string) => void): Promise<void> =>
      executeCommand("expandir", texto, onChunk),
    [executeCommand]
  );

  const revisar = useCallback(
    (texto: string, onChunk: (chunk: string) => void): Promise<void> =>
      executeCommand("revisar", texto, onChunk),
    [executeCommand]
  );

  const formalizar = useCallback(
    (texto: string, onChunk: (chunk: string) => void): Promise<void> =>
      executeCommand("formalizar", texto, onChunk),
    [executeCommand]
  );

  return {
    continuar,
    expandir,
    revisar,
    formalizar,
    isLoading,
    error,
    canRequest,
    waitTime,
    checkStatus,
  };
}

export default useAICommands;
```

---

## 📁 8. HOOK EDITOR AI - use-editor-ai.ts
**Caminho:** `src/hooks/use-editor-ai.ts`

```typescript
/**
 * useEditorAI - Hook para integração de IA com CKEditor 5
 *
 * Fornece:
 * - Slash commands para geração de minutas
 * - Integração com dados DJEN
 * - Contexto de processos
 * - Comandos rápidos de IA
 */

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

interface SlashCommand {
  command: string;
  description: string;
  agent: string;
  requiresContext: boolean;
}

interface DJENPublication {
  id?: string;
  conteudo?: string;
  dataDisponibilizacao?: string;
  orgaoJulgador?: string;
  numeroProcesso?: string;
}

interface ProcessData {
  numero?: string;
  partes?: string;
  vara?: string;
  classe?: string;
  [key: string]: unknown;
}

interface GenerateMinutaParams {
  prompt: string;
  context?: string;
  djenData?: DJENPublication[];
  processData?: ProcessData;
  documentType?: string;
  existingContent?: string;
}

interface ExecuteCommandParams {
  command: string;
  prompt: string;
  context?: string;
  djenData?: DJENPublication[];
  processData?: ProcessData;
}

interface EditorAIResult {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    executionTime: number;
    agent: string;
    steps: number;
    completed: boolean;
  };
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export function useEditorAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [commands, setCommands] = useState<SlashCommand[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Carregar comandos disponíveis
  const loadCommands = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/editor/commands`);
      if (response.ok) {
        const data = await response.json();
        setCommands(data.commands || []);
      }
    } catch (error) {
      console.error("[useEditorAI] Erro ao carregar comandos:", error);
    }
  }, []);

  // Gerar minuta com contexto DJEN e processo
  const generateMinuta = useCallback(
    async (params: GenerateMinutaParams): Promise<EditorAIResult> => {
      setIsLoading(true);
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(`${API_BASE}/api/editor/generate-minuta`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
          signal: abortControllerRef.current.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao gerar minuta");
        }

        return {
          success: true,
          content: data.content,
          metadata: data.metadata,
        };
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return { success: false, error: "Operação cancelada" };
        }
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        toast.error(`Erro ao gerar minuta: ${message}`);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Executar slash command
  const executeCommand = useCallback(
    async (params: ExecuteCommandParams): Promise<EditorAIResult> => {
      setIsLoading(true);
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(`${API_BASE}/api/editor/execute-command`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
          signal: abortControllerRef.current.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Erro ao executar ${params.command}`);
        }

        return {
          success: true,
          content: data.content,
          metadata: data.metadata,
        };
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return { success: false, error: "Operação cancelada" };
        }
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        toast.error(`Erro: ${message}`);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Analisar publicações DJEN
  const analyzeDJEN = useCallback(
    async (publications: DJENPublication[], processNumber?: string): Promise<EditorAIResult> => {
      setIsLoading(true);

      try {
        const response = await fetch(`${API_BASE}/api/editor/analyze-djen`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publications, processNumber }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao analisar DJEN");
        }

        return {
          success: true,
          content: data.analysis,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        toast.error(`Erro ao analisar DJEN: ${message}`);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Cancelar operação em andamento
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  // Helper para detectar slash commands no texto
  const detectSlashCommand = useCallback(
    (text: string): { command: string; rest: string } | null => {
      const match = text.match(/^\/([a-z-]+)\s*(.*)/i);
      if (match) {
        return { command: `/${match[1].toLowerCase()}`, rest: match[2] || "" };
      }
      return null;
    },
    []
  );

  // Lista de comandos para autocomplete
  const getCommandSuggestions = useCallback(
    (prefix: string): SlashCommand[] => {
      const normalizedPrefix = prefix.toLowerCase().replace("/", "");
      return commands.filter((cmd) => cmd.command.toLowerCase().includes(normalizedPrefix));
    },
    [commands]
  );

  return {
    isLoading,
    commands,
    loadCommands,
    generateMinuta,
    executeCommand,
    analyzeDJEN,
    cancel,
    detectSlashCommand,
    getCommandSuggestions,
  };
}

// Constantes exportadas para uso no editor
export const EDITOR_SLASH_COMMANDS = [
  {
    command: "/gerar-minuta",
    label: "Gerar Minuta",
    description: "Gera uma minuta jurídica completa",
    icon: "📝",
  },
  {
    command: "/analisar-djen",
    label: "Analisar DJEN",
    description: "Analisa publicações do DJEN",
    icon: "📰",
  },
  {
    command: "/estrategia",
    label: "Estratégia",
    description: "Sugere estratégia processual",
    icon: "♟️",
  },
  {
    command: "/revisar-contrato",
    label: "Revisar Contrato",
    description: "Revisa cláusulas contratuais",
    icon: "📋",
  },
  {
    command: "/pesquisar-juris",
    label: "Pesquisar Juris",
    description: "Pesquisa jurisprudência",
    icon: "🔍",
  },
  {
    command: "/continuar",
    label: "Continuar",
    description: "Continua escrevendo o texto",
    icon: "➡️",
  },
  {
    command: "/expandir",
    label: "Expandir",
    description: "Expande e desenvolve o texto",
    icon: "📐",
  },
  {
    command: "/formalizar",
    label: "Formalizar",
    description: "Reescreve em linguagem jurídica",
    icon: "⚖️",
  },
];
```

---

## ✅ ARQUIVO CONSOLIDADO PRONTO

**Total de linhas:** ~5000+ linhas de código
**Arquivos incluídos:** 8 arquivos principais
**Status:** Pronto para análise no ChatGPT

**Última atualização:** 04/01/2026 17:50 UTC

---

**📌 PRÓXIMOS PASSOS:**
1. Copie este arquivo completo
2. Cole no ChatGPT 4 ou ChatGPT o1
3. Solicite análise focada nos pontos mencionados
4. Aguarde recomendações detalhadas

