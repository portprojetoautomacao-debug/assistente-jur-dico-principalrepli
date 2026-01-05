/**
 * Background Service Worker
 */

import { BACKEND_URL, STORAGE_KEYS } from "../shared/constants";
import { ExtensionErrorEvent } from "../shared/errorHandler";
import { CrawlerManager } from "./crawler/crawler-manager";
import { SyncManager } from "./sync-manager";

console.log("[PJe Sync] Background Service Worker iniciado");

// Inicializa gerenciador de sincronização
const syncManager = new SyncManager();
console.log("[PJe Sync] Sync Manager inicializado", syncManager);

// Inicializa gerenciador de crawler
const crawlerManager = new CrawlerManager();
console.log("[PJe Sync] Crawler Manager inicializado", crawlerManager);

// Evento de instalação
chrome.runtime.onInstalled.addListener((details) => {
  console.log("[PJe Sync] onInstalled:", details.reason);

  if (details.reason === "install") {
    // Primeira instalação - mostra página de boas-vindas
    chrome.tabs.create({
      url: "https://assistente-juridico-github.vercel.app/extensao-instalada",
    });
  } else if (details.reason === "update") {
    // Atualização
    console.log("[PJe Sync] Extensão atualizada para versão", chrome.runtime.getManifest().version);
  }
});

// Mantém service worker ativo
chrome.runtime.onSuspend.addListener(() => {
  console.log("[PJe Sync] Service Worker sendo suspenso");
});

// Log de erros não tratados
self.addEventListener("error", (event) => {
  console.error("[PJe Sync] Erro global:", event.error);
  try {
    const errorEvent: ExtensionErrorEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: event.error?.message || String(event.message) || "Unknown error",
      stack: event.error?.stack,
      url: undefined,
      userAgent: navigator.userAgent,
      context: { source: "service-worker.error" },
      extensionVersion: chrome.runtime.getManifest().version,
    };
    chrome.storage.local.get([STORAGE_KEYS.ERRORS], (res) => {
      const arr = res[STORAGE_KEYS.ERRORS] || [];
      arr.push(errorEvent);
      const slice = arr.slice(-50);
      chrome.storage.local.set({ [STORAGE_KEYS.ERRORS]: slice });
    });
  } catch (e) {
    console.warn("[PJe Sync] Falha ao salvar erro do service worker", e);
  }
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("[PJe Sync] Promise rejeitada:", event.reason);
  try {
    const errorEvent: ExtensionErrorEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message:
        (event.reason && event.reason.message) || String(event.reason) || "Unhandled rejection",
      stack: event.reason?.stack,
      url: undefined,
      userAgent: navigator.userAgent,
      context: { source: "service-worker.unhandledrejection" },
      extensionVersion: chrome.runtime.getManifest().version,
    };
    chrome.storage.local.get([STORAGE_KEYS.ERRORS], (res) => {
      const arr = res[STORAGE_KEYS.ERRORS] || [];
      arr.push(errorEvent);
      const slice = arr.slice(-50);
      chrome.storage.local.set({ [STORAGE_KEYS.ERRORS]: slice });
    });
  } catch (e) {
    console.warn("[PJe Sync] Falha ao salvar rejection do service worker", e);
  }
});

// Escuta reports de erro vindos dos content scripts
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message?.type === "REPORT_ERROR" && message?.data) {
    const errorEvent = message.data as ExtensionErrorEvent;
    try {
      chrome.storage.local.get([STORAGE_KEYS.ERRORS], (res) => {
        const arr = res[STORAGE_KEYS.ERRORS] || [];
        arr.push(errorEvent);
        const slice = arr.slice(-50);
        chrome.storage.local.set({ [STORAGE_KEYS.ERRORS]: slice });
      });
    } catch (e) {
      console.warn("[PJe Sync] Falha ao salvar report de erro do content", e);
    }
    // Forward to backend when possible
    (async () => {
      try {
        const storage = await chrome.storage.sync.get(["apiKey"]);
        const apiKey = storage.apiKey;
        if (!apiKey) return;
        const baseUrl = BACKEND_URL;
        await fetch(`${baseUrl}/api/extension-errors`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
          },
          body: JSON.stringify(errorEvent),
        });
      } catch (err) {
        console.warn("[PJe Sync] Falha ao encaminhar erro para o backend", err);
      }
    })();
  }
});
