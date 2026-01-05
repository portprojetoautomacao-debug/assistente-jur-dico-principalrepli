/**
 * Popup Controller
 */

import { CrawlStatus } from "../shared/types";

class PopupController {
  private apiKey: string | null = null;
  private crawlerStatus: CrawlStatus | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadSettings();
    this.setupEventListeners();
    await this.updateStatus();
    await this.updateStats();
    await this.updateCrawlerStatus();
    this.startAutoRefresh();
  }

  private async loadSettings(): Promise<void> {
    const result = await chrome.storage.sync.get(["apiKey"]);
    this.apiKey = result.apiKey || null;

    const input = document.getElementById("apiKey") as HTMLInputElement;
    if (this.apiKey) {
      input.value = "••••••••••••••••";
      input.dataset.hasKey = "true";
    }
  }

  private setupEventListeners(): void {
    // Toggle API Key visibility
    const toggleBtn = document.getElementById("toggleApiKey");
    toggleBtn?.addEventListener("click", () => {
      const input = document.getElementById("apiKey") as HTMLInputElement;
      if (input.type === "password") {
        input.type = "text";
        toggleBtn.textContent = "🙈";
      } else {
        input.type = "password";
        toggleBtn.textContent = "👁️";
      }
    });

    // Save API Key
    const saveBtn = document.getElementById("saveApiKey");
    saveBtn?.addEventListener("click", async () => {
      const input = document.getElementById("apiKey") as HTMLInputElement;
      const key = input.value.trim();

      if (!key || key === "••••••••••••••••") {
        this.showToast("Digite uma API Key válida", "error");
        return;
      }

      saveBtn.textContent = "Salvando...";
      (saveBtn as HTMLButtonElement).disabled = true;

      try {
        await chrome.storage.sync.set({ apiKey: key });
        this.apiKey = key;
        input.value = "••••••••••••••••";
        input.dataset.hasKey = "true";
        this.showToast("API Key salva com sucesso!", "success");
        await this.updateStatus();
      } catch (error) {
        this.showToast("Erro ao salvar API Key", "error");
      } finally {
        saveBtn.textContent = "Salvar";
        (saveBtn as HTMLButtonElement).disabled = false;
      }
    });

    // Sync Now
    const syncBtn = document.getElementById("syncNow");
    syncBtn?.addEventListener("click", () => this.syncNow());

    // Open Dashboard
    const dashboardBtn = document.getElementById("openDashboard");
    dashboardBtn?.addEventListener("click", () => {
      chrome.tabs.create({
        url: "https://assistente-juridico-github.vercel.app",
      });
    });

    // Open Settings
    const settingsBtn = document.getElementById("openSettings");
    settingsBtn?.addEventListener("click", () => {
      chrome.tabs.create({
        url: "https://assistente-juridico-github.vercel.app/settings/api-keys",
      });
    });

    // Crawler controls
    this.setupCrawlerListeners();
  }

  private setupCrawlerListeners(): void {
    // Start crawler
    const startBtn = document.getElementById("crawlerStart");
    startBtn?.addEventListener("click", async () => {
      await this.crawlerAction("CRAWLER_START");
      this.showToast("Crawler iniciado!", "success");
    });

    // Pause crawler
    const pauseBtn = document.getElementById("crawlerPause");
    pauseBtn?.addEventListener("click", async () => {
      if (this.crawlerStatus?.isPaused) {
        await this.crawlerAction("CRAWLER_RESUME");
        this.showToast("Crawler resumido!", "success");
      } else {
        await this.crawlerAction("CRAWLER_PAUSE");
        this.showToast("Crawler pausado!", "success");
      }
    });

    // Stop crawler
    const stopBtn = document.getElementById("crawlerStop");
    stopBtn?.addEventListener("click", async () => {
      await this.crawlerAction("CRAWLER_STOP");
      this.showToast("Crawler parado!", "success");
    });
  }

  private async crawlerAction(type: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (response?.success) {
          this.updateCrawlerStatus();
          resolve();
        } else {
          reject(new Error(response?.error || "Erro desconhecido"));
        }
      });
    });
  }

  private async updateCrawlerStatus(): Promise<void> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "CRAWLER_STATUS" }, (response) => {
        if (response?.success && response.status) {
          this.crawlerStatus = response.status;
          this.renderCrawlerStatus(response.status);
        }
        resolve();
      });
    });
  }

  private renderCrawlerStatus(status: CrawlStatus): void {
    const dot = document.getElementById("crawlerDot");
    const statusText = document.getElementById("crawlerStatusText");
    const queueText = document.getElementById("crawlerQueue");
    const completedText = document.getElementById("crawlerCompleted");
    const progressContainer = document.getElementById("crawlerProgress");
    const progressFill = document.getElementById("crawlerProgressFill");
    const progressText = document.getElementById("crawlerProgressText");

    const startBtn = document.getElementById("crawlerStart") as HTMLButtonElement;
    const pauseBtn = document.getElementById("crawlerPause") as HTMLButtonElement;
    const stopBtn = document.getElementById("crawlerStop") as HTMLButtonElement;

    // Update status indicator
    dot?.classList.remove("running", "paused");
    if (status.isRunning) {
      if (status.isPaused) {
        dot?.classList.add("paused");
        statusText!.textContent = "Pausado";
        pauseBtn.textContent = "▶️ Resumir";
      } else {
        dot?.classList.add("running");
        statusText!.textContent = "Em execução";
        pauseBtn.textContent = "⏸️ Pausar";
      }
    } else {
      statusText!.textContent = "Parado";
    }

    // Update stats
    queueText!.textContent = `Fila: ${status.queueSize}`;
    completedText!.textContent = `Completos: ${status.completedJobs}`;

    // Update progress
    const total = status.queueSize + status.completedJobs;
    if (total > 0 && status.isRunning) {
      progressContainer!.style.display = "block";
      const percent = Math.round((status.completedJobs / total) * 100);
      progressFill!.style.width = `${percent}%`;
      progressText!.textContent = `${percent}% (${status.completedJobs}/${total})`;
    } else {
      progressContainer!.style.display = "none";
    }

    // Update button states
    startBtn.disabled = status.isRunning && !status.isPaused;
    pauseBtn.disabled = !status.isRunning;
    stopBtn.disabled = !status.isRunning;
  }

  private async updateStatus(): Promise<void> {
    const statusDot = document.getElementById("statusDot");
    const statusText = document.getElementById("statusText");

    if (!this.apiKey) {
      statusDot?.classList.remove("online", "syncing");
      statusDot?.classList.add("offline");
      statusText!.textContent = "Configure sua API Key";
      return;
    }

    statusDot?.classList.add("syncing");
    statusDot?.classList.remove("online", "offline");
    statusText!.textContent = "Verificando...";

    try {
      const response = await fetch("https://assistente-juridico-github.vercel.app/api/status", {
        headers: { "X-API-Key": this.apiKey },
      });

      if (response.ok) {
        statusDot?.classList.add("online");
        statusDot?.classList.remove("offline", "syncing");
        statusText!.textContent = "Conectado";
      } else {
        throw new Error("Backend offline");
      }
    } catch {
      statusDot?.classList.remove("online", "syncing");
      statusDot?.classList.add("offline");
      statusText!.textContent = "Desconectado";
    }
  }

  private async updateStats(): Promise<void> {
    const storage = await chrome.storage.local.get([
      "processos",
      "processos_timestamp",
      "expedientes_today",
    ]);

    // Processos
    const processosCount = storage.processos?.length || 0;
    document.getElementById("processosCount")!.textContent = String(processosCount);

    // Expedientes hoje
    const today = new Date().toDateString();
    const expedientesCount = (storage.expedientes_today || []).filter(
      (e: any) => new Date(e.createdAt).toDateString() === today
    ).length;
    document.getElementById("expedientesCount")!.textContent = String(expedientesCount);

    // Última sincronização
    if (storage.processos_timestamp) {
      const date = new Date(storage.processos_timestamp);
      const formatted = this.formatRelativeTime(date);
      document.getElementById("lastSync")!.textContent = `Última sincronização: ${formatted}`;
    } else {
      document.getElementById("lastSync")!.textContent = "Última sincronização: Nunca";
    }
  }

  private async syncNow(): Promise<void> {
    const btn = document.getElementById("syncNow") as HTMLButtonElement;
    const originalText = btn.textContent;

    btn.disabled = true;
    btn.textContent = "🔄 Sincronizando...";

    try {
      // Busca abas do PJe
      const tabs = await chrome.tabs.query({
        url: "https://pje*.tjmg.jus.br/*",
      });

      if (tabs.length === 0) {
        this.showToast("Abra o painel do PJe primeiro", "error");
        return;
      }

      // Envia mensagem para content script
      for (const tab of tabs) {
        if (tab.id) {
          await chrome.tabs.sendMessage(tab.id, {
            type: "FORCE_SYNC",
            timestamp: Date.now(),
          });
        }
      }

      // Atualiza o timestamp da última sincronização
      await chrome.storage.local.set({
        processos_timestamp: Date.now(),
      });

      this.showToast("Sincronização iniciada!", "success");
      await this.updateStats();
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      this.showToast("Erro na sincronização", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  private startAutoRefresh(): void {
    setInterval(() => {
      this.updateStatus();
      this.updateStats();
      this.updateCrawlerStatus();
    }, 30000); // 30 segundos

    // Refresh mais frequente para crawler quando ativo
    setInterval(() => {
      if (this.crawlerStatus?.isRunning) {
        this.updateCrawlerStatus();
      }
    }, 5000); // 5 segundos quando crawler ativo
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Agora mesmo";
    if (minutes === 1) return "Há 1 minuto";
    if (minutes < 60) return `Há ${minutes} minutos`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "Há 1 hora";
    if (hours < 24) return `Há ${hours} horas`;

    return date.toLocaleString("pt-BR");
  }

  private showToast(message: string, type: "success" | "error" = "success"): void {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Inicializar quando DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  const controller = new PopupController();
  console.log("[PJe Popup] Controller initialized", controller);
});
