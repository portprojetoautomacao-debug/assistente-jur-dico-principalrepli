/**
 * Observador de mudanças no DOM do PJe
 */

import { debounce } from "../../shared/utils";

export class DOMObserver {
  private observer: MutationObserver | null = null;
  private debouncedCallback: () => void;

  constructor(onChangeCallback: () => void, debounceDelay: number = 1000) {
    this.debouncedCallback = debounce(onChangeCallback, debounceDelay);
  }

  /**
   * Inicia observação de mudanças no DOM
   */
  public start(): void {
    if (this.observer) {
      this.stop();
    }

    this.observer = new MutationObserver((mutations) => {
      const hasRelevantChanges = mutations.some((mutation) => this.isRelevantMutation(mutation));

      if (hasRelevantChanges) {
        console.log("[DOMObserver] Mudanças detectadas, sincronizando...");
        this.debouncedCallback();
      }
    });

    // Observa mudanças no body
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "data-processo", "data-movimento"],
    });

    console.log("[DOMObserver] Iniciado");
  }

  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      console.log("[DOMObserver] Parado");
    }
  }

  private isRelevantMutation(mutation: MutationRecord): boolean {
    const target = mutation.target as HTMLElement;

    // Ignora mudanças em scripts/styles
    if (target.tagName === "STYLE" || target.tagName === "SCRIPT") {
      return false;
    }

    // Verifica se afeta lista de processos
    const affectsProcessList =
      target.classList?.contains("processo-row") ||
      target.classList?.contains("painel-processos") ||
      target.classList?.contains("tabela-processos") ||
      target.hasAttribute?.("data-processo") ||
      target.closest?.(".processo-row, .painel-processos");

    return !!affectsProcessList;
  }
}
