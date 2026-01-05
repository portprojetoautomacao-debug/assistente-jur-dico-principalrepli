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
