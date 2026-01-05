/**
 * Handler de Crawler para Content Script
 * Recebe comandos do background e executa extração
 */

import { reportError } from "../../shared/errorHandler";
import { CrawlResult } from "../../shared/types";
import { FullTextExtractor } from "./full-text-extractor";
import { PageNavigator } from "./page-navigator";

export class CrawlerHandler {
  private pageNavigator: PageNavigator;
  private fullTextExtractor: FullTextExtractor;
  private isProcessing: boolean = false;

  constructor() {
    this.pageNavigator = new PageNavigator();
    this.fullTextExtractor = new FullTextExtractor();
    this.setupListeners();
  }

  /**
   * Configura listeners para comandos do background
   */
  private setupListeners(): void {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      const handleAsync = async () => {
        try {
          switch (message.type) {
            case "START_FULL_CRAWL":
              await this.handleFullCrawl(message.data, sendResponse);
              break;

            case "EXTRACT_PAGE_TEXT": {
              const text = await this.handleExtractText();
              sendResponse({ success: true, text });
              break;
            }

            case "EXTRACT_VISIBLE_TEXT": {
              const visibleText = this.fullTextExtractor.extractVisibleText();
              sendResponse({ success: true, text: visibleText });
              break;
            }

            case "SCROLL_AND_EXTRACT": {
              const scrollText = await this.fullTextExtractor.scrollAndExtract();
              sendResponse({ success: true, text: scrollText });
              break;
            }

            case "CRAWLER_PING":
              sendResponse({ success: true, ready: true, processing: this.isProcessing });
              break;
          }
        } catch (error) {
          await reportError(error, { module: "crawler-handler" });
          sendResponse({ success: false, error: String(error) });
        }
      };

      handleAsync();
      return true; // Async response
    });
  }

  /**
   * Executa crawl completo do processo
   */
  private async handleFullCrawl(
    data: {
      jobId: string;
      processNumber: string;
      processNumberFormatted: string;
      extractDocuments?: boolean;
      extractMovimentos?: boolean;
      extractPartes?: boolean;
    },
    sendResponse: (response: any) => void
  ): Promise<void> {
    if (this.isProcessing) {
      sendResponse({ success: false, error: "Já processando outro crawl" });
      return;
    }

    this.isProcessing = true;
    console.log(`[CrawlerHandler] Iniciando crawl: ${data.processNumberFormatted}`);

    try {
      // Executa navegação e extração completa
      const result = await this.pageNavigator.startFullCrawl(data);

      // Enriquece com texto completo extraído
      const fullContent = this.fullTextExtractor.extractFullText();
      result.textoCompleto = fullContent.cleanText;

      // Envia resultado de volta para o background
      await this.sendCrawlComplete(data.jobId, true, result);

      sendResponse({ success: true });
    } catch (error) {
      console.error("[CrawlerHandler] Erro no crawl:", error);
      await this.sendCrawlComplete(data.jobId, false, undefined, String(error));
      sendResponse({ success: false, error: String(error) });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Extrai texto da página atual
   */
  private async handleExtractText(): Promise<string> {
    const content = this.fullTextExtractor.extractFullText();
    return content.cleanText;
  }

  /**
   * Envia resultado do crawl para o background
   */
  private async sendCrawlComplete(
    jobId: string,
    success: boolean,
    result?: CrawlResult,
    error?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: "CRAWL_PAGE_COMPLETE",
          data: {
            jobId,
            success,
            result,
            error,
          },
        },
        (_response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        }
      );
    });
  }
}

// Instancia automaticamente quando o content script carrega
let crawlerHandler: CrawlerHandler | null = null;

export function initCrawlerHandler(): CrawlerHandler {
  if (!crawlerHandler) {
    crawlerHandler = new CrawlerHandler();
    console.log("[CrawlerHandler] Inicializado");
  }
  return crawlerHandler;
}
