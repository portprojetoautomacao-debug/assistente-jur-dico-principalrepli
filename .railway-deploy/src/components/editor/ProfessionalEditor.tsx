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
import { EDITOR_SLASH_COMMANDS, useEditorAI } from "@/hooks/use-editor-ai";
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
import { createPortal } from "react-dom";
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
  const portalTarget = typeof document !== "undefined" ? document.body : null;

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

  const calculateSlashMenuPosition = useCallback((rect: DOMRect | null) => {
    const padding = 12;
    const menuWidth = 256; // w-64
    const menuHeight = 240; // max-h-48 + paddings

    if (!rect) {
      return { top: padding, left: padding };
    }

    if (typeof window === "undefined") {
      return { top: rect.bottom + 5, left: rect.left };
    }

    const maxLeft = Math.max(window.innerWidth - menuWidth - padding, padding);
    const maxTop = Math.max(window.innerHeight - menuHeight - padding, padding);

    return {
      top: Math.min(Math.max(rect.bottom + 5, padding), maxTop),
      left: Math.min(Math.max(rect.left, padding), maxLeft),
    };
  }, []);

  // Detectar "/" no início de uma linha e posicionar menu próximo ao cursor
  const checkForSlashCommand = useCallback(
    (plainText: string, editor: ClassicEditor) => {
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
              setSlashMenuPosition(calculateSlashMenuPosition(rect));
              return;
            }
          }

          // Fallback: posição relativa ao editor
          const editorElement = editor.ui.view.element;
          if (editorElement) {
            const rect = editorElement.getBoundingClientRect();
            setSlashMenuPosition(calculateSlashMenuPosition(rect));
          }
        } catch {
          setSlashMenuPosition(calculateSlashMenuPosition(null));
        }
      } else {
        setShowSlashMenu(false);
        setSlashFilter("");
      }
    },
    [calculateSlashMenuPosition]
  );

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
      {showSlashMenu &&
        filteredSlashCommands.length > 0 &&
        portalTarget &&
        createPortal(
          <div
            className="fixed z-[99999] bg-background border rounded-lg shadow-lg p-2 w-64"
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
          </div>,
          portalTarget
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
