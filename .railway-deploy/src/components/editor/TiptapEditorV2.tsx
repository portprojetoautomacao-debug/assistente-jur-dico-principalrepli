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
