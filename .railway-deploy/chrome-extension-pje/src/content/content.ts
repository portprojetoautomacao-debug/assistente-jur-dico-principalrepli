/**
 * Content Script - Injetado no painel PJe
 */

import { initGlobalHandlers, reportError } from "../shared/errorHandler";
import { SyncMessage } from "../shared/types";
import { initCrawlerHandler } from "./crawler/crawler-handler";
import { DocumentExtractor } from "./extractors/document-extractor";
import { ExpedienteExtractor } from "./extractors/expediente-extractor";
import { ProcessExtractor } from "./extractors/process-extractor";
import { DOMObserver } from "./observers/dom-observer";

// Inicializa handler do crawler para receber comandos do background
initCrawlerHandler();

class PJeContentScript {
  private processExtractor: ProcessExtractor;
  private expedienteExtractor: ExpedienteExtractor;
  private documentExtractor: DocumentExtractor;
  private domObserver: DOMObserver;
  private lastSync: number = 0;
  private syncInProgress: boolean = false;

  constructor() {
    this.processExtractor = new ProcessExtractor();
    this.expedienteExtractor = new ExpedienteExtractor();
    this.documentExtractor = new DocumentExtractor();
    this.domObserver = new DOMObserver(() => this.handleDOMChange());

    this.init();
    // Inicializa global handlers para capturar erros inesperados
    try {
      initGlobalHandlers();
    } catch (e) {
      // Ignore failures initializing global handlers
      console.warn("[PJe Sync] Falha ao inicializar global handlers", e);
    }
  }

  private async init(): Promise<void> {
    console.log("[PJe Sync] Content script iniciado");

    // Verifica se está na página correta
    if (!this.isPJePainelPage()) {
      console.log("[PJe Sync] Não é página do painel do advogado");
      return;
    }

    // Aguarda DOM carregar
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.start());
    } else {
      this.start();
    }

    // Escuta mensagens do background
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true; // Async response
    });
  }

  private isPJePainelPage(): boolean {
    const url = window.location.href;
    // Páginas válidas do PJe:
    // - Painel do advogado
    // - Consulta processual
    // - Detalhes do processo (listProcessoCompletoAdvogado)
    // - Lista de processos
    return (
      url.includes("pje") &&
      (url.includes("painel") ||
        url.includes("consulta") ||
        url.includes("Consulta") ||
        url.includes("Processo") ||
        url.includes("listProcesso"))
    );
  }

  private start(): void {
    console.log("[PJe Sync] Iniciando monitoramento...");

    // Sincronização inicial
    this.syncNow();

    // Inicia observador DOM
    this.domObserver.start();

    // Adiciona badge visual
    this.addSyncBadge();
  }

  private async handleDOMChange(): Promise<void> {
    // Evita sync muito frequente
    const now = Date.now();
    if (now - this.lastSync < 5000) {
      // Min 5s entre syncs
      console.log("[PJe Sync] Sync muito recente, aguardando...");
      return;
    }

    await this.syncNow();
  }

  private async handleMessage(
    message: SyncMessage,
    sendResponse: (response: any) => void
  ): Promise<void> {
    if (message.type === "FORCE_SYNC") {
      console.log("[PJe Sync] Sync forçado via popup");
      await this.syncNow();
      sendResponse({ success: true });
    } else if (message.type === "PING") {
      sendResponse({ success: true, active: true });
    } else if (message.type === "EXTRACT_DOCUMENT") {
      // Novo: extrai documento visível na tela
      console.log("[PJe Sync] Extraindo documento da tela...");
      const documento = this.documentExtractor.extractDocumento();
      sendResponse({ success: !!documento, documento });
    }
  }

  private async syncNow(): Promise<void> {
    if (this.syncInProgress) {
      console.log("[PJe Sync] Sync já em andamento");
      return;
    }

    this.syncInProgress = true;
    this.updateBadge("⟳", "#FFC107"); // Amarelo = sincronizando

    try {
      // Verifica se há documento aberto para extrair
      if (this.documentExtractor.isDocumentoAberto()) {
        const documento = this.documentExtractor.extractDocumento();
        if (documento) {
          console.log("[PJe Sync] Documento detectado:", documento.tipo);
          await this.sendToBackground("SYNC_DOCUMENTO", documento);
        }
      }

      // Extrai processos
      const processos = this.processExtractor.extractProcessos();

      if (processos.length === 0) {
        console.warn("[PJe Sync] Nenhum processo encontrado");
        this.updateBadge("!", "#FF9800");
        return;
      }

      // Extrai expedientes
      const expedientes = this.expedienteExtractor.extractExpedientes(processos);

      // Envia para background
      await this.sendToBackground("SYNC_PROCESSOS", processos);

      if (expedientes.length > 0) {
        await this.sendToBackground("SYNC_EXPEDIENTES", expedientes);
      }

      this.lastSync = Date.now();
      this.updateBadge("✓", "#4CAF50"); // Verde = sucesso

      console.log(
        `[PJe Sync] Sincronizado: ${processos.length} processos, ${expedientes.length} expedientes`
      );
    } catch (error) {
      // Report centralizado
      await reportError(error, { module: "content.syncNow" });
      this.updateBadge("✗", "#F44336"); // Vermelho = erro
    } finally {
      this.syncInProgress = false;
    }
  }

  private async sendToBackground(type: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, data, timestamp: Date.now() }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (response?.success) {
          resolve();
        } else {
          reject(new Error(response?.error || "Unknown error"));
        }
      });
    });
  }

  private addSyncBadge(): void {
    // Adiciona badge visual no canto superior direito
    const badge = document.createElement("div");
    badge.id = "pje-sync-badge";
    badge.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 40px;
      height: 40px;
      background: #4CAF50;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: bold;
      z-index: 999999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: all 0.3s;
    `;
    badge.textContent = "✓";
    badge.title = "PJe Sync - Conectado";

    badge.addEventListener("click", () => this.syncNow());
    document.body.appendChild(badge);
  }

  private updateBadge(text: string, color: string): void {
    const badge = document.getElementById("pje-sync-badge");
    if (badge) {
      badge.textContent = text;
      badge.style.background = color;
    }
  }
}

// Inicializa
const contentScript = new PJeContentScript();
console.log("[PJe Content] Initialized", contentScript);
