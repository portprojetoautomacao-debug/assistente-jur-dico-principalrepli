/**
 * Gerenciador de Crawler - Abre processos em background e extrai conteúdo
 *
 * Funcionalidades:
 * - Fila de processos para crawling
 * - Rate limiting para não sobrecarregar PJe
 * - Extração de texto completo de documentos
 * - Navegação automática por todas as páginas
 */

import { STORAGE_KEYS } from "../../shared/constants";
import { reportError } from "../../shared/errorHandler";
import { CrawlJob, CrawlResult, CrawlStatus, ProcessoPJe } from "../../shared/types";

// Configurações do crawler
const CRAWLER_CONFIG = {
  MAX_CONCURRENT_TABS: 2, // Máximo de abas simultâneas
  DELAY_BETWEEN_PAGES: 2000, // Delay entre páginas (ms)
  DELAY_BETWEEN_PROCESSES: 5000, // Delay entre processos (ms)
  PAGE_LOAD_TIMEOUT: 30000, // Timeout para carregar página (ms)
  MAX_RETRIES: 3, // Máximo de tentativas por processo
  BATCH_SIZE: 10, // Processos por lote
};

export class CrawlerManager {
  private queue: CrawlJob[] = [];
  private activeJobs: Map<string, CrawlJob> = new Map();
  private results: Map<string, CrawlResult> = new Map();
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  constructor() {
    this.loadState();
    this.setupMessageListeners();
  }

  /**
   * Carrega estado salvo do crawler
   */
  private async loadState(): Promise<void> {
    try {
      const data = await chrome.storage.local.get([
        STORAGE_KEYS.CRAWLER_QUEUE,
        STORAGE_KEYS.CRAWLER_RESULTS,
      ]);

      if (data[STORAGE_KEYS.CRAWLER_QUEUE]) {
        this.queue = data[STORAGE_KEYS.CRAWLER_QUEUE];
      }
      if (data[STORAGE_KEYS.CRAWLER_RESULTS]) {
        this.results = new Map(Object.entries(data[STORAGE_KEYS.CRAWLER_RESULTS]));
      }

      console.log(`[CrawlerManager] Estado carregado: ${this.queue.length} jobs na fila`);
    } catch (error) {
      console.error("[CrawlerManager] Erro ao carregar estado:", error);
    }
  }

  /**
   * Salva estado do crawler
   */
  private async saveState(): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.CRAWLER_QUEUE]: this.queue,
        [STORAGE_KEYS.CRAWLER_RESULTS]: Object.fromEntries(this.results),
      });
    } catch (error) {
      console.error("[CrawlerManager] Erro ao salvar estado:", error);
    }
  }

  /**
   * Configura listeners de mensagens
   */
  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      const handleAsync = async () => {
        try {
          switch (message.type) {
            case "CRAWLER_ADD_JOBS":
              await this.addJobs(message.data.processos);
              sendResponse({ success: true, queueSize: this.queue.length });
              break;

            case "CRAWLER_START":
              this.start();
              sendResponse({ success: true });
              break;

            case "CRAWLER_PAUSE":
              this.pause();
              sendResponse({ success: true });
              break;

            case "CRAWLER_RESUME":
              this.resume();
              sendResponse({ success: true });
              break;

            case "CRAWLER_STOP":
              await this.stop();
              sendResponse({ success: true });
              break;

            case "CRAWLER_STATUS":
              sendResponse({
                success: true,
                status: this.getStatus(),
              });
              break;

            case "CRAWLER_GET_RESULTS":
              sendResponse({
                success: true,
                results: Array.from(this.results.values()),
              });
              break;

            case "CRAWLER_CLEAR":
              await this.clear();
              sendResponse({ success: true });
              break;

            case "CRAWL_PAGE_COMPLETE":
              // Recebe resultado de uma página crawleada
              this.handlePageCrawlComplete(message.data);
              sendResponse({ success: true });
              break;
          }
        } catch (error) {
          await reportError(error, { module: "crawler-manager" });
          sendResponse({ success: false, error: String(error) });
        }
      };

      handleAsync();
      return true;
    });
  }

  /**
   * Adiciona processos à fila de crawling
   */
  public async addJobs(processos: ProcessoPJe[]): Promise<void> {
    for (const processo of processos) {
      // Verifica se já está na fila ou foi processado
      const existsInQueue = this.queue.some((j) => j.processNumber === processo.numero);
      const existsInResults = this.results.has(processo.numero);

      if (!existsInQueue && !existsInResults) {
        const job: CrawlJob = {
          id: crypto.randomUUID(),
          processNumber: processo.numero,
          processNumberFormatted: processo.numeroFormatado,
          status: "pending",
          retries: 0,
          createdAt: new Date().toISOString(),
          pages: [],
          metadata: {
            classe: processo.classe,
            vara: processo.vara,
            comarca: processo.comarca,
            parteAutor: processo.parteAutor,
            parteReu: processo.parteReu,
          },
        };

        this.queue.push(job);
      }
    }

    await this.saveState();
    console.log(
      `[CrawlerManager] ${processos.length} processos adicionados. Fila: ${this.queue.length}`
    );

    // Auto-start se não estiver rodando
    if (!this.isRunning && this.queue.length > 0) {
      this.start();
    }
  }

  /**
   * Inicia o crawler
   */
  public start(): void {
    if (this.isRunning) {
      console.log("[CrawlerManager] Já está rodando");
      return;
    }

    this.isRunning = true;
    this.isPaused = false;
    console.log("[CrawlerManager] Iniciando crawler...");

    this.processQueue();
  }

  /**
   * Pausa o crawler
   */
  public pause(): void {
    this.isPaused = true;
    console.log("[CrawlerManager] Crawler pausado");
  }

  /**
   * Resume o crawler
   */
  public resume(): void {
    if (!this.isRunning) {
      this.start();
      return;
    }

    this.isPaused = false;
    console.log("[CrawlerManager] Crawler resumido");
    this.processQueue();
  }

  /**
   * Para o crawler completamente
   */
  public async stop(): Promise<void> {
    this.isRunning = false;
    this.isPaused = false;

    // Fecha todas as abas abertas pelo crawler
    for (const [, job] of this.activeJobs) {
      if (job.tabId) {
        try {
          await chrome.tabs.remove(job.tabId);
        } catch {
          // Tab pode já ter sido fechada
        }
      }
    }

    this.activeJobs.clear();
    await this.saveState();
    console.log("[CrawlerManager] Crawler parado");
  }

  /**
   * Limpa fila e resultados
   */
  public async clear(): Promise<void> {
    await this.stop();
    this.queue = [];
    this.results.clear();
    await this.saveState();
    console.log("[CrawlerManager] Fila e resultados limpos");
  }

  /**
   * Retorna status atual do crawler
   */
  public getStatus(): CrawlStatus {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      queueSize: this.queue.length,
      activeJobs: this.activeJobs.size,
      completedJobs: this.results.size,
      pendingJobs: this.queue.filter((j) => j.status === "pending").length,
      failedJobs: this.queue.filter((j) => j.status === "failed").length,
    };
  }

  /**
   * Processa fila de jobs
   */
  private async processQueue(): Promise<void> {
    while (this.isRunning && !this.isPaused) {
      // Verifica se pode processar mais
      if (this.activeJobs.size >= CRAWLER_CONFIG.MAX_CONCURRENT_TABS) {
        await this.sleep(1000);
        continue;
      }

      // Pega próximo job pendente
      const nextJob = this.queue.find((j) => j.status === "pending");
      if (!nextJob) {
        // Verifica se ainda há jobs ativos
        if (this.activeJobs.size === 0) {
          console.log("[CrawlerManager] Fila vazia, parando");
          this.isRunning = false;
          break;
        }
        await this.sleep(1000);
        continue;
      }

      // Processa o job
      await this.processJob(nextJob);

      // Delay entre processos
      await this.sleep(CRAWLER_CONFIG.DELAY_BETWEEN_PROCESSES);
    }
  }

  /**
   * Processa um job individual
   */
  private async processJob(job: CrawlJob): Promise<void> {
    job.status = "processing";
    job.startedAt = new Date().toISOString();
    this.activeJobs.set(job.id, job);
    await this.saveState();

    console.log(`[CrawlerManager] Processando: ${job.processNumberFormatted}`);

    try {
      // Abre nova aba em background
      const tab = await chrome.tabs.create({
        url: this.buildPJeUrl(job.processNumber),
        active: false, // Background
      });

      job.tabId = tab.id;

      // Aguarda página carregar
      await this.waitForPageLoad(tab.id!, CRAWLER_CONFIG.PAGE_LOAD_TIMEOUT);

      // Envia comando para content script iniciar extração
      await this.sendCrawlCommand(tab.id!, job);
    } catch (error) {
      console.error(`[CrawlerManager] Erro no job ${job.processNumberFormatted}:`, error);
      await this.handleJobError(job, error);
    }
  }

  /**
   * Constrói URL do processo no PJe
   */
  private buildPJeUrl(processNumber: string): string {
    // URL padrão para consulta de processo no PJe
    // Ajuste conforme o tribunal específico
    const formatted = this.formatProcessNumber(processNumber);
    return `https://pje.tjmg.jus.br/pje/ConsultaPublica/listView.seam?numeroProcesso=${formatted}`;
  }

  /**
   * Formata número do processo para URL
   */
  private formatProcessNumber(numero: string): string {
    const clean = numero.replace(/\D/g, "");
    if (clean.length !== 20) return numero;

    const match = clean.match(/^(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})$/);
    if (!match) return numero;

    const [, nnnnnnn, dd, aaaa, j, tr, oooo] = match;
    return `${nnnnnnn}-${dd}.${aaaa}.${j}.${tr}.${oooo}`;
  }

  /**
   * Aguarda página carregar
   */
  private waitForPageLoad(tabId: number, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        reject(new Error("Timeout ao carregar página"));
      }, timeout);

      const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
        if (updatedTabId === tabId && changeInfo.status === "complete") {
          clearTimeout(timeoutId);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };

      chrome.tabs.onUpdated.addListener(listener);
    });
  }

  /**
   * Envia comando de crawl para content script
   */
  private async sendCrawlCommand(tabId: number, job: CrawlJob): Promise<void> {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: "START_FULL_CRAWL",
        data: {
          jobId: job.id,
          processNumber: job.processNumber,
          processNumberFormatted: job.processNumberFormatted,
          extractDocuments: true,
          extractMovimentos: true,
          extractPartes: true,
        },
      });
    } catch (error) {
      // Content script pode não estar pronto ainda
      console.warn("[CrawlerManager] Content script não pronto, tentando novamente...");
      await this.sleep(2000);
      await chrome.tabs.sendMessage(tabId, {
        type: "START_FULL_CRAWL",
        data: {
          jobId: job.id,
          processNumber: job.processNumber,
        },
      });
    }
  }

  /**
   * Recebe resultado de página crawleada
   */
  private async handlePageCrawlComplete(data: {
    jobId: string;
    success: boolean;
    result?: CrawlResult;
    error?: string;
  }): Promise<void> {
    const job = this.activeJobs.get(data.jobId);
    if (!job) {
      console.warn(`[CrawlerManager] Job não encontrado: ${data.jobId}`);
      return;
    }

    if (data.success && data.result) {
      // Sucesso - salva resultado
      job.status = "completed";
      job.completedAt = new Date().toISOString();

      this.results.set(job.processNumber, data.result);

      // Remove da fila
      const index = this.queue.findIndex((j) => j.id === job.id);
      if (index >= 0) {
        this.queue.splice(index, 1);
      }

      console.log(`[CrawlerManager] Completo: ${job.processNumberFormatted}`);

      // Notifica sobre conclusão
      await this.notifyCompletion(job, data.result);
    } else {
      // Erro
      await this.handleJobError(job, new Error(data.error || "Unknown error"));
    }

    // Fecha a aba
    if (job.tabId) {
      try {
        await chrome.tabs.remove(job.tabId);
      } catch (e) {
        // Tab pode já ter sido fechada
      }
    }

    this.activeJobs.delete(data.jobId);
    await this.saveState();
  }

  /**
   * Trata erro em um job
   */
  private async handleJobError(job: CrawlJob, error: unknown): Promise<void> {
    job.retries++;
    job.error = String(error);

    if (job.retries < CRAWLER_CONFIG.MAX_RETRIES) {
      job.status = "pending"; // Recoloca na fila
      console.log(
        `[CrawlerManager] Tentativa ${job.retries}/${CRAWLER_CONFIG.MAX_RETRIES} para ${job.processNumberFormatted}`
      );
    } else {
      job.status = "failed";
      job.completedAt = new Date().toISOString();
      console.error(
        `[CrawlerManager] Falhou após ${CRAWLER_CONFIG.MAX_RETRIES} tentativas: ${job.processNumberFormatted}`
      );
    }

    // Fecha a aba se existir
    if (job.tabId) {
      try {
        await chrome.tabs.remove(job.tabId);
      } catch (e) {
        // Ignora
      }
    }

    this.activeJobs.delete(job.id);
    await this.saveState();
    await reportError(error, { module: "crawler-manager", job: job.processNumber });
  }

  /**
   * Notifica sobre conclusão de crawl
   */
  private async notifyCompletion(job: CrawlJob, result: CrawlResult): Promise<void> {
    // Envia para background salvar no backend
    chrome.runtime.sendMessage({
      type: "SYNC_CRAWL_RESULT",
      data: {
        processNumber: job.processNumber,
        result,
      },
    });

    // Mostra notificação se houver documentos importantes
    if (result.documentos && result.documentos.length > 0) {
      await chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Documentos Extraídos",
        message: `${result.documentos.length} documentos extraídos do processo ${job.processNumberFormatted}`,
      });
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
