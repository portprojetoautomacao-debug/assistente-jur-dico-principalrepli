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

async function readJsonSafely(response: Response): Promise<Record<string, unknown>> {
  try {
    const data = await response.json();
    return (data && typeof data === "object" ? (data as Record<string, unknown>) : {}) as Record<
      string,
      unknown
    >;
  } catch {
    return {};
  }
}

async function streamSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (message: string) => void
): Promise<void> {
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
        continue;
      }

      if (event.error) {
        onError(event.error);
        return;
      }

      if (event.done) {
        onDone();
      }
    }
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
          const data = await readJsonSafely(response);
          setCanRequest(false);
          const wait = typeof data.waitTime === "number" ? data.waitTime : 2000;
          const msg = typeof data.message === "string" ? data.message : "Rate limit exceeded";
          setWaitTime(wait);
          setError(msg);
          throw new Error(msg);
        }

        if (!response.ok) {
          const data = await readJsonSafely(response);
          const msgFromApi = typeof data.message === "string" ? data.message : "";
          const errorMsg = msgFromApi || `HTTP ${response.status}`;
          setError(errorMsg);
          throw new Error(errorMsg);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Streaming not supported");
        }

        await streamSSE(
          reader,
          onChunk,
          () => {
            setCanRequest(true);
            setWaitTime(0);
          },
          (message) => {
            setError(message);
            throw new Error(message);
          }
        );
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
