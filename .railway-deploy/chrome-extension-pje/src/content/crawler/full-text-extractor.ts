/**
 * Extrator de Texto Completo - Extrai todo o conteúdo visível e oculto
 *
 * Este módulo:
 * - Extrai texto de elementos visíveis e ocultos
 * - Processa iframes e shadow DOM
 * - Limpa e normaliza o texto
 * - Extrai estrutura semântica (títulos, parágrafos, listas)
 */

import { reportError } from "../../shared/errorHandler";

export interface ExtractedContent {
  rawText: string;
  cleanText: string;
  structuredContent: StructuredSection[];
  metadata: ContentMetadata;
}

export interface StructuredSection {
  type: "heading" | "paragraph" | "list" | "table" | "form" | "other";
  level?: number;
  content: string;
  items?: string[];
}

export interface ContentMetadata {
  title: string;
  totalCharacters: number;
  wordCount: number;
  extractedAt: string;
  url: string;
  frameCount: number;
  hasHiddenContent: boolean;
}

export class FullTextExtractor {
  /**
   * Extrai todo o texto da página atual
   */
  public extractFullText(): ExtractedContent {
    console.log("[FullTextExtractor] Iniciando extração completa...");

    const startTime = Date.now();

    try {
      // 1. Extrai texto bruto
      const rawText = this.extractRawText(document.body);

      // 2. Extrai de iframes
      const iframeText = this.extractFromIframes();

      // 3. Extrai de shadow DOM
      const shadowText = this.extractFromShadowDOM(document.body);

      // 4. Combina todo texto
      const combinedRaw = [rawText, iframeText, shadowText].filter(Boolean).join("\n\n");

      // 5. Limpa e normaliza
      const cleanText = this.cleanText(combinedRaw);

      // 6. Extrai estrutura semântica
      const structuredContent = this.extractStructuredContent(document.body);

      // 7. Extrai metadados
      const metadata = this.extractMetadata(cleanText);

      const elapsed = Date.now() - startTime;
      console.log(
        `[FullTextExtractor] Extração concluída em ${elapsed}ms: ${cleanText.length} caracteres`
      );

      return {
        rawText: combinedRaw,
        cleanText,
        structuredContent,
        metadata,
      };
    } catch (error) {
      reportError(error, { module: "full-text-extractor" });
      throw error;
    }
  }

  /**
   * Extrai texto bruto de um elemento
   */
  private extractRawText(element: Element): string {
    const parts: string[] = [];

    // Percorre todos os nós de texto
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          // Ignora scripts, styles e elementos ocultos
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            const tagName = el.tagName.toLowerCase();

            if (["script", "style", "noscript", "template"].includes(tagName)) {
              return NodeFilter.FILTER_REJECT;
            }

            // Verifica se está oculto
            const style = getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden") {
              // Ainda extrai para elementos ocultos que podem conter dados
              // return NodeFilter.FILTER_REJECT;
            }
          }

          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text && text.length > 0) {
          parts.push(text);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;

        // Extrai atributos importantes
        const alt = el.getAttribute("alt");
        const title = el.getAttribute("title");
        const placeholder = el.getAttribute("placeholder");
        const value = (el as HTMLInputElement).value;

        if (alt) parts.push(`[Imagem: ${alt}]`);
        if (title && !el.textContent?.includes(title)) parts.push(`[${title}]`);
        if (placeholder && !value) parts.push(`[Campo: ${placeholder}]`);
        if (value && el.tagName === "INPUT") parts.push(value);
      }
    }

    return parts.join(" ");
  }

  /**
   * Extrai texto de iframes
   */
  private extractFromIframes(): string {
    const parts: string[] = [];
    const iframes = document.querySelectorAll("iframe");

    iframes.forEach((iframe, index) => {
      try {
        // Tenta acessar documento do iframe (same-origin)
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

        if (iframeDoc && iframeDoc.body) {
          const text = this.extractRawText(iframeDoc.body);
          if (text.length > 50) {
            parts.push(`\n--- Conteúdo do Frame ${index + 1} ---\n${text}`);
          }
        }
      } catch {
        // Cross-origin iframe - não podemos acessar
        console.warn(`[FullTextExtractor] Não foi possível acessar iframe ${index}: cross-origin`);
      }
    });

    return parts.join("\n");
  }

  /**
   * Extrai texto de Shadow DOM
   */
  private extractFromShadowDOM(root: Element): string {
    const parts: string[] = [];

    // Função recursiva para percorrer shadow roots
    const processShadow = (element: Element) => {
      // Verifica se tem shadow root
      const shadowRoot = element.shadowRoot;
      if (shadowRoot) {
        const text = this.extractRawText(shadowRoot as unknown as Element);
        if (text) parts.push(text);

        // Processa elementos dentro do shadow root
        shadowRoot.querySelectorAll("*").forEach((child) => {
          processShadow(child);
        });
      }

      // Processa filhos
      element.querySelectorAll("*").forEach((child) => {
        processShadow(child);
      });
    };

    processShadow(root);
    return parts.join(" ");
  }

  /**
   * Limpa e normaliza o texto
   */
  private cleanText(text: string): string {
    // Regex para caracteres de controle (construído para evitar warning do linter)
    // eslint-disable-next-line no-control-regex
    const controlCharsRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

    return (
      text
        // Remove múltiplos espaços
        .replaceAll(/\s+/g, " ")
        // Remove múltiplas quebras de linha
        .replaceAll(/\n{3,}/g, "\n\n")
        // Remove caracteres de controle
        .replaceAll(controlCharsRegex, "")
        // Remove espaços em branco no início/fim de linhas
        .replaceAll(/^[ \t]+|[ \t]+$/gm, "")
        // Remove linhas vazias duplicadas
        .replaceAll(/(\n\s*){3,}/g, "\n\n")
        // Normaliza aspas
        .replaceAll(/[“”]/g, '"')
        .replaceAll(/[‘’]/g, "'")
        // Remove Zero Width characters
        .replaceAll(/[\u200B-\u200D\uFEFF]/g, "")
        .trim()
    );
  }

  /**
   * Extrai conteúdo estruturado
   */
  private extractStructuredContent(element: Element): StructuredSection[] {
    const sections: StructuredSection[] = [];

    // Extrai headings
    const headings = element.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headings.forEach((h) => {
      const level = Number.parseInt(h.tagName[1], 10);
      const content = h.textContent?.trim();
      if (content) {
        sections.push({
          type: "heading",
          level,
          content,
        });
      }
    });

    // Extrai parágrafos significativos
    const paragraphs = element.querySelectorAll("p, div.text, .conteudo, .corpo, article");
    paragraphs.forEach((p) => {
      const content = p.textContent?.trim();
      if (content && content.length > 50) {
        // Ignora parágrafos muito curtos
        sections.push({
          type: "paragraph",
          content: content.substring(0, 2000), // Limita tamanho
        });
      }
    });

    // Extrai listas
    const lists = element.querySelectorAll("ul, ol");
    lists.forEach((list) => {
      const items = Array.from(list.querySelectorAll("li"))
        .map((li) => li.textContent?.trim())
        .filter((text): text is string => !!text && text.length > 0);

      if (items.length > 0) {
        sections.push({
          type: "list",
          content: items.join("; "),
          items,
        });
      }
    });

    // Extrai tabelas
    const tables = element.querySelectorAll("table");
    tables.forEach((table) => {
      const rows = Array.from(table.querySelectorAll("tr"))
        .map((row) => {
          return Array.from(row.querySelectorAll("td, th"))
            .map((cell) => cell.textContent?.trim())
            .filter(Boolean)
            .join(" | ");
        })
        .filter((row) => row.length > 0);

      if (rows.length > 0) {
        sections.push({
          type: "table",
          content: rows.join("\n"),
        });
      }
    });

    // Extrai formulários
    const forms = element.querySelectorAll("form");
    forms.forEach((form) => {
      const fields = Array.from(form.querySelectorAll("input, textarea, select"))
        .map((field) => {
          const label = form.querySelector(`label[for="${field.id}"]`)?.textContent?.trim();
          const name = field.getAttribute("name") || field.getAttribute("placeholder");
          const value = (field as HTMLInputElement).value;
          return `${label || name}: ${value}`;
        })
        .filter((f) => !f.includes(": "));

      if (fields.length > 0) {
        sections.push({
          type: "form",
          content: fields.join("\n"),
        });
      }
    });

    return sections;
  }

  /**
   * Extrai metadados da página
   */
  private extractMetadata(cleanText: string): ContentMetadata {
    return {
      title: document.title || "",
      totalCharacters: cleanText.length,
      wordCount: cleanText.split(/\s+/).filter((w) => w.length > 0).length,
      extractedAt: new Date().toISOString(),
      url: window.location.href,
      frameCount: document.querySelectorAll("iframe").length,
      hasHiddenContent: this.hasHiddenContent(),
    };
  }

  /**
   * Verifica se há conteúdo oculto na página
   */
  private hasHiddenContent(): boolean {
    const hiddenElements = Array.from(
      document.querySelectorAll(
        '[style*="display: none"], [style*="visibility: hidden"], .hidden, .collapsed, [aria-hidden="true"]'
      )
    );

    for (const el of hiddenElements) {
      const text = el.textContent?.trim();
      if (text && text.length > 50) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extrai texto específico de um seletor
   */
  public extractFromSelector(selector: string): string {
    const elements = document.querySelectorAll(selector);
    const parts: string[] = [];

    elements.forEach((el) => {
      const text = this.extractRawText(el);
      if (text) parts.push(text);
    });

    return this.cleanText(parts.join("\n"));
  }

  /**
   * Extrai texto visível na viewport atual
   */
  public extractVisibleText(): string {
    const parts: string[] = [];

    const isInViewport = (el: Element): boolean => {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      );
    };

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);

    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (parent && isInViewport(parent)) {
        const text = node.textContent?.trim();
        if (text) parts.push(text);
      }
    }

    return this.cleanText(parts.join(" "));
  }

  /**
   * Scroll e extrai - para páginas com lazy loading
   */
  public async scrollAndExtract(): Promise<string> {
    const parts: string[] = [];
    const scrollStep = window.innerHeight * 0.8;
    let currentPosition = 0;
    const maxScrolls = 50;
    let scrollCount = 0;

    while (scrollCount < maxScrolls) {
      // Extrai texto visível
      parts.push(this.extractVisibleText());

      // Scroll
      window.scrollBy(0, scrollStep);
      await this.sleep(500);

      // Verifica se chegou ao fim
      const newPosition = window.scrollY;
      if (newPosition === currentPosition) {
        break; // Chegou ao fim da página
      }
      currentPosition = newPosition;
      scrollCount++;
    }

    // Volta ao topo
    window.scrollTo(0, 0);

    // Remove duplicatas e limpa
    const uniqueText = [...new Set(parts)].join("\n");
    return this.cleanText(uniqueText);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton para uso global
export const fullTextExtractor = new FullTextExtractor();
