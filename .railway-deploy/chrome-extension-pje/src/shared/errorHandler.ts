/**
 * ErrorHandler compartilhado para a extensão PJe
 * - Registra eventos de erro no chrome.storage.local
 * - Encaminha erros para o background (opcional) para envio ao backend
 */

// Use crypto.randomUUID() to generate unique ids when available
import { STORAGE_KEYS } from "./constants";

export interface ExtensionErrorEvent {
  id: string;
  timestamp: string; // ISO
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  context?: Record<string, any>;
  extensionVersion?: string;
}

const MAX_STORED_ERRORS = 50;

function createErrorEvent(err: any, context?: Record<string, any>): ExtensionErrorEvent {
  const message = err?.message || String(err) || "Unknown error";
  const stack = err?.stack || undefined;
  const url = typeof window !== "undefined" ? window.location.href : undefined;
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
  let extensionVersion: string | undefined;
  try {
    extensionVersion =
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      typeof (chrome.runtime as any).getManifest === "function"
        ? (chrome.runtime as any).getManifest().version
        : undefined;
  } catch (e) {
    extensionVersion = undefined;
  }

  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    message,
    stack,
    url,
    userAgent,
    context: context || {},
    extensionVersion,
  };
}

export async function saveErrorLocal(errorEvent: ExtensionErrorEvent): Promise<void> {
  try {
    const current =
      (await chrome.storage.local.get([STORAGE_KEYS.ERRORS]))[STORAGE_KEYS.ERRORS] || [];
    const arr = Array.isArray(current) ? current : [];
    arr.push(errorEvent);
    // mantem limite
    const slice = arr.slice(-MAX_STORED_ERRORS);
    await chrome.storage.local.set({ [STORAGE_KEYS.ERRORS]: slice });
  } catch (e) {
    // Não quebrar a aplicação se storage falhar
    console.warn("[PJe Sync] Falha ao salvar erro localmente", e);
  }
}

export async function sendErrorToBackground(errorEvent: ExtensionErrorEvent): Promise<void> {
  try {
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: "REPORT_ERROR", data: errorEvent });
    }
  } catch (e) {
    // Não quebre
    console.warn("[PJe Sync] Falha ao enviar erro para background", e);
  }
}

export async function reportError(err: any, context?: Record<string, any>): Promise<void> {
  try {
    const event = createErrorEvent(err, context);
    // Log local e console
    console.error("[PJe Sync] Capturado Error:", event);
    // store locally
    await saveErrorLocal(event);
    // send to background for potential forwarding
    await sendErrorToBackground(event);
  } catch (e) {
    console.error("[PJe Sync] Falha interna ao reportar erro", e);
  }
}

export function initGlobalHandlers(): void {
  if (typeof window !== "undefined") {
    window.addEventListener("error", (ev) => {
      try {
        reportError(ev.error || ev.message || "Unknown window error", { source: "window.onerror" });
      } catch (e) {
        // ignore
      }
    });

    window.addEventListener("unhandledrejection", (ev) => {
      try {
        reportError(ev.reason || "Unhandled rejection", { source: "window.unhandledrejection" });
      } catch (e) {
        // ignore
      }
    });
  }
}

export default { reportError, saveErrorLocal, sendErrorToBackground, initGlobalHandlers };
