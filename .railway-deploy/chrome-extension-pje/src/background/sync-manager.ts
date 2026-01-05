/**
 * Gerenciador de sincronização
 */

import { STORAGE_KEYS } from "../shared/constants";
import { reportError } from "../shared/errorHandler";
import { Expediente, ProcessoPJe, SyncMessage } from "../shared/types";
import { APIClient } from "./api-client";

export class SyncManager {
  private apiClient: APIClient;
  private alarmName = "pje-sync-health-check";

  constructor() {
    this.apiClient = new APIClient();
    this.setupAlarms();
    this.setupMessageListeners();
  }

  private setupAlarms(): void {
    // Health check a cada 1 minuto
    chrome.alarms.create(this.alarmName, {
      periodInMinutes: 1,
    });

    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === this.alarmName) {
        this.checkBackendStatus();
      }
    });
  }

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message: SyncMessage, _sender, sendResponse) => {
      const handleAsync = async () => {
        try {
          if (message.type === "SYNC_PROCESSOS") {
            await this.handleSyncProcessos(message.data as ProcessoPJe[]);
            sendResponse({ success: true });
          } else if (message.type === "SYNC_EXPEDIENTES") {
            await this.handleSyncExpedientes(message.data as Expediente[]);
            sendResponse({ success: true });
          } else if (message.type === "PING") {
            sendResponse({ success: true, alive: true });
          }
        } catch (error) {
          // report centralizado de erro
          await reportError(error, { module: "background.sync-manager" });
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      };

      handleAsync();
      return true; // Async response
    });
  }

  private async handleSyncProcessos(processos: ProcessoPJe[]): Promise<void> {
    console.log(`[SyncManager] Sincronizando ${processos.length} processos...`);

    // Salva localmente (cache)
    await chrome.storage.local.set({
      [STORAGE_KEYS.PROCESSOS]: processos,
      [STORAGE_KEYS.PROCESSOS_TIMESTAMP]: Date.now(),
    });

    // Envia para backend
    const result = await this.apiClient.syncProcessos(processos);

    if (result.success) {
      await this.updateBadge(processos.length);
      await this.showNotification(
        "Processos sincronizados",
        `${result.synced || processos.length} processos atualizados`
      );
    }
  }

  private async handleSyncExpedientes(expedientes: Expediente[]): Promise<void> {
    console.log(`[SyncManager] Sincronizando ${expedientes.length} expedientes...`);

    // Salva expedientes do dia
    const today = new Date().toDateString();
    const existing = await chrome.storage.local.get([STORAGE_KEYS.EXPEDIENTES_TODAY]);
    const todayExpedientes = (existing[STORAGE_KEYS.EXPEDIENTES_TODAY] || []).filter(
      (e: Expediente) => new Date(e.createdAt).toDateString() === today
    );

    await chrome.storage.local.set({
      [STORAGE_KEYS.EXPEDIENTES_TODAY]: [...todayExpedientes, ...expedientes],
    });

    // Envia para backend
    await this.apiClient.syncExpedientes(expedientes);

    // Notifica sobre expedientes importantes
    for (const exp of expedientes) {
      if (exp.type === "intimacao" || exp.type === "citacao") {
        await this.showNotification(
          `Novo: ${exp.type.toUpperCase()}`,
          `Processo ${exp.processNumber}\n${exp.description.substring(0, 100)}...`,
          true
        );
      }
    }
  }

  private async updateBadge(count: number): Promise<void> {
    await chrome.action.setBadgeText({
      text: count > 0 ? String(count) : "",
    });
    await chrome.action.setBadgeBackgroundColor({
      color: "#4CAF50",
    });
  }

  private async showNotification(
    title: string,
    message: string,
    requireInteraction: boolean = false
  ): Promise<void> {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: "assets/icon-128.png",
      title,
      message,
      priority: 2,
      requireInteraction,
    });
  }

  private async checkBackendStatus(): Promise<void> {
    const isOnline = await this.apiClient.ping();
    const color = isOnline ? "#4CAF50" : "#F44336";
    await chrome.action.setBadgeBackgroundColor({ color });
  }
}
