/**
 * Navegador de Páginas - Navega automaticamente pelas seções do PJe
 *
 * Este módulo é injetado como Content Script e:
 * - Navega pelas abas do processo (dados, documentos, movimentos, etc.)
 * - Expande seções colapsadas
 * - Aguarda carregamento de conteúdo dinâmico
 * - Coordena a extração de cada seção
 */

import { CrawlResult, DocumentoPJe, Movimento, PartePJe } from "../../shared/types";
import { reportError } from "../../shared/errorHandler";

// Seletores para navegação no PJe
const NAV_SELECTORS = {
  // Abas principais
  TAB_DADOS: '[id*="tabDados"], [id*="dadosProcesso"], a[title*="Dados"]',
  TAB_PARTES: '[id*="tabPartes"], [id*="polos"], a[title*="Partes"]',
  TAB_DOCUMENTOS: '[id*="tabDocumentos"], [id*="autos"], a[title*="Documentos"]',
  TAB_MOVIMENTOS: '[id*="tabMovimentacao"], [id*="movimentos"], a[title*="Moviment"]',
  TAB_EXPEDIENTES: '[id*="tabExpedientes"], [id*="intimacoes"], a[title*="Expedientes"]',

  // Containers de conteúdo
  CONTENT_DADOS: '.dados-processo, #painelDados, [id*="formDadosProcesso"]',
  CONTENT_PARTES: '.partes-processo, #painelPartes, [id*="formPartes"]',
  CONTENT_DOCUMENTOS: '.documentos-processo, #painelDocumentos, [id*="formDocumentos"]',
  CONTENT_MOVIMENTOS: '.movimentos-processo, #painelMovimentos, [id*="formMovimentos"]',

  // Elementos expansíveis
  EXPAND_BUTTON: '.expand-btn, .toggle-btn, [class*="expand"], [class*="toggle"], .rf-trn-ico',
  COLLAPSED_SECTION: '.collapsed, .fechado, [aria-expanded="false"]',

  // Paginação
  NEXT_PAGE: '[id*="next"], [id*="proximo"], .paginacao-proximo, a[title*="Próxim"]',
  PAGE_NUMBER: '.pagina-atual, [id*="paginaAtual"], .current-page',
  TOTAL_PAGES: '.total-paginas, [id*="totalPaginas"]',

  // Loading indicators
  LOADING: '.loading, .carregando, .ajax-loading, [id*="loading"]',

  // Documentos
  DOCUMENTO_LINK: 'a[href*="documento"], a[onclick*="documento"], .link-documento',
  DOCUMENTO_VIEWER: ".visualizador-documento, iframe.documento, #documentoConteudo",
  DOCUMENTO_DOWNLOAD: 'a[href*="download"], button[onclick*="download"]',

  // Movimentos
  MOVIMENTO_ROW: 'tr.movimento, .linha-movimento, [id*="movimento"]',
  MOVIMENTO_DATA: ".data-movimento, td:first-child",
  MOVIMENTO_DESCRICAO: ".descricao-movimento, td:nth-child(2)",

  // Partes
  PARTE_ROW: '.parte-processo, tr.parte, [id*="parte"]',
  PARTE_NOME: ".nome-parte, .parte-nome",
  PARTE_TIPO: ".tipo-parte, .polo",
  PARTE_DOCUMENTO: ".documento-parte, .cpf-cnpj",
  PARTE_ADVOGADO: ".advogado-parte, .representante",
};

// Configurações
const CONFIG = {
  WAIT_FOR_LOAD: 2000, // Tempo para aguardar carregamento
  WAIT_FOR_AJAX: 1500, // Tempo para aguardar requisições AJAX
  MAX_PAGES: 50, // Máximo de páginas para navegar
  SCROLL_DELAY: 500, // Delay entre scrolls
  CLICK_DELAY: 300, // Delay após clique
};

export class PageNavigator {
  private jobId: string = "";
  private processNumber: string = "";
  private isRunning: boolean = false;

  /**
   * Inicia navegação completa pelo processo
   */
  public async startFullCrawl(options: {
    jobId: string;
    processNumber: string;
    processNumberFormatted: string;
    extractDocuments?: boolean;
    extractMovimentos?: boolean;
    extractPartes?: boolean;
  }): Promise<CrawlResult> {
    this.jobId = options.jobId;
    this.processNumber = options.processNumber;
    this.isRunning = true;

    console.log(`[PageNavigator] Iniciando crawl completo: ${options.processNumberFormatted}`);

    const result: CrawlResult = {
      processNumber: options.processNumber,
      processNumberFormatted: options.processNumberFormatted,
      crawledAt: new Date().toISOString(),
      dados: {},
      partes: [],
      movimentos: [],
      documentos: [],
      expedientes: [],
      textoCompleto: "",
    };

    try {
      // Aguarda página inicial carregar
      await this.waitForLoad();

      // 1. Extrai dados básicos do processo
      result.dados = await this.extractDadosBasicos();
      console.log("[PageNavigator] Dados básicos extraídos");

      // 2. Extrai partes
      if (options.extractPartes !== false) {
        result.partes = await this.extractPartes();
        console.log(`[PageNavigator] ${result.partes.length} partes extraídas`);
      }

      // 3. Extrai movimentos
      if (options.extractMovimentos !== false) {
        result.movimentos = await this.extractMovimentos();
        console.log(`[PageNavigator] ${result.movimentos.length} movimentos extraídos`);
      }

      // 4. Extrai documentos
      if (options.extractDocuments !== false) {
        result.documentos = await this.extractDocumentos();
        console.log(`[PageNavigator] ${result.documentos.length} documentos extraídos`);
      }

      // 5. Consolida texto completo
      result.textoCompleto = this.consolidateText(result);

      console.log(
        `[PageNavigator] Crawl completo! Texto total: ${result.textoCompleto.length} caracteres`
      );
    } catch (error) {
      await reportError(error, { module: "page-navigator", job: this.jobId });
      throw error;
    } finally {
      this.isRunning = false;
    }

    return result;
  }

  /**
   * Extrai dados básicos do processo
   */
  private async extractDadosBasicos(): Promise<Record<string, string>> {
    await this.navigateToTab(NAV_SELECTORS.TAB_DADOS);
    await this.waitForLoad();

    const dados: Record<string, string> = {};

    // Busca campos de dados
    const selectors = {
      numero: '[id*="numero"], .numero-processo',
      classe: '[id*="classe"], .classe-processo',
      assunto: '[id*="assunto"], .assunto-processo',
      orgaoJulgador: '[id*="orgaoJulgador"], .vara-processo',
      dataDistribuicao: '[id*="distribuicao"], .data-distribuicao',
      valorCausa: '[id*="valor"], .valor-causa',
      prioridade: '[id*="prioridade"], .prioridade',
      situacao: '[id*="situacao"], .situacao-processo',
      competencia: '[id*="competencia"], .competencia',
      segredoJustica: '[id*="segredo"], .segredo-justica',
    };

    for (const [key, selector] of Object.entries(selectors)) {
      const el = document.querySelector(selector);
      if (el) {
        dados[key] = el.textContent?.trim() || "";
      }
    }

    // Também extrai da página completa com regex
    const pageText = document.body.innerText;

    // Regex patterns para extração
    const patterns: Record<string, RegExp> = {
      numero: /Processo(?:\s*n[ºo°]?)?\s*:?\s*(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/i,
      classe: /Classe(?:\s*Judicial)?\s*:?\s*([^\n]+)/i,
      assunto: /Assunto(?:s)?\s*:?\s*([^\n]+)/i,
      orgaoJulgador: /[ÓO]rg[ãa]o\s*Julgador\s*:?\s*([^\n]+)/i,
      dataDistribuicao: /Data\s*(?:de\s*)?Distribui[çc][ãa]o\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i,
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      if (!dados[key]) {
        const match = pageText.match(pattern);
        if (match) {
          dados[key] = match[1].trim();
        }
      }
    }

    return dados;
  }

  /**
   * Extrai partes do processo
   */
  private async extractPartes(): Promise<PartePJe[]> {
    await this.navigateToTab(NAV_SELECTORS.TAB_PARTES);
    await this.waitForLoad();

    // Expande seções colapsadas
    await this.expandAllSections();

    const partes: PartePJe[] = [];
    const parteRows = document.querySelectorAll(NAV_SELECTORS.PARTE_ROW);

    parteRows.forEach((row) => {
      const parte = this.extractParteFromRow(row as HTMLElement);
      if (parte) {
        partes.push(parte);
      }
    });

    // Fallback: extrai do texto se não encontrou elementos
    if (partes.length === 0) {
      const textPartes = this.extractPartesFromText();
      partes.push(...textPartes);
    }

    return partes;
  }

  /**
   * Extrai uma parte de uma linha
   */
  private extractParteFromRow(row: HTMLElement): PartePJe | null {
    const nomeEl = row.querySelector(NAV_SELECTORS.PARTE_NOME);
    const tipoEl = row.querySelector(NAV_SELECTORS.PARTE_TIPO);
    const docEl = row.querySelector(NAV_SELECTORS.PARTE_DOCUMENTO);
    const advEl = row.querySelector(NAV_SELECTORS.PARTE_ADVOGADO);

    const nome = nomeEl?.textContent?.trim() || row.textContent?.trim().split("\n")[0] || "";

    if (!nome || nome.length < 3) return null;

    const tipoTexto = tipoEl?.textContent?.toLowerCase() || row.textContent?.toLowerCase() || "";
    let tipo: PartePJe["tipo"] = "outro";

    if (
      tipoTexto.includes("autor") ||
      tipoTexto.includes("requerente") ||
      tipoTexto.includes("ativo")
    ) {
      tipo = "autor";
    } else if (
      tipoTexto.includes("réu") ||
      tipoTexto.includes("requerido") ||
      tipoTexto.includes("passivo")
    ) {
      tipo = "reu";
    } else if (tipoTexto.includes("terceiro")) {
      tipo = "terceiro";
    }

    return {
      nome,
      tipo,
      documento: docEl?.textContent?.trim(),
      advogados: advEl ? [advEl.textContent?.trim() || ""] : [],
    };
  }

  /**
   * Extrai partes do texto da página
   */
  private extractPartesFromText(): PartePJe[] {
    const partes: PartePJe[] = [];
    const texto = document.body.innerText;

    // Padrões para extrair autor/réu
    const autorMatch = texto.match(
      /Autor[ae]?s?\s*:?\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-záéíóúâêôãõçÀ-ÿ\s,]+?)(?=\n|Réu|Requerido)/i
    );
    if (autorMatch) {
      partes.push({
        nome: autorMatch[1].trim(),
        tipo: "autor",
        advogados: [],
      });
    }

    const reuMatch = texto.match(
      /R[ée]us?\s*:?\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-záéíóúâêôãõçÀ-ÿ\s,]+?)(?=\n|Terceiro|Advogado)/i
    );
    if (reuMatch) {
      partes.push({
        nome: reuMatch[1].trim(),
        tipo: "reu",
        advogados: [],
      });
    }

    return partes;
  }

  /**
   * Extrai movimentos/andamentos
   */
  private async extractMovimentos(): Promise<Movimento[]> {
    await this.navigateToTab(NAV_SELECTORS.TAB_MOVIMENTOS);
    await this.waitForLoad();

    const movimentos: Movimento[] = [];
    let pageNum = 1;

    // Navega por todas as páginas de movimentos
    while (pageNum <= CONFIG.MAX_PAGES && this.isRunning) {
      // Extrai movimentos da página atual
      const pageMovimentos = this.extractMovimentosFromPage();
      movimentos.push(...pageMovimentos);

      // Verifica se há próxima página
      const nextButton = document.querySelector(NAV_SELECTORS.NEXT_PAGE) as HTMLElement;
      if (
        !nextButton ||
        nextButton.classList.contains("disabled") ||
        nextButton.hasAttribute("disabled")
      ) {
        break;
      }

      // Vai para próxima página
      nextButton.click();
      await this.waitForLoad();
      pageNum++;
    }

    console.log(`[PageNavigator] Extraídos ${movimentos.length} movimentos de ${pageNum} páginas`);
    return movimentos;
  }

  /**
   * Extrai movimentos da página atual
   */
  private extractMovimentosFromPage(): Movimento[] {
    const movimentos: Movimento[] = [];
    const rows = document.querySelectorAll(NAV_SELECTORS.MOVIMENTO_ROW);

    rows.forEach((row) => {
      const dataEl = row.querySelector(NAV_SELECTORS.MOVIMENTO_DATA);
      const descEl = row.querySelector(NAV_SELECTORS.MOVIMENTO_DESCRICAO);

      const dataTexto = dataEl?.textContent?.trim() || "";
      const descricao = descEl?.textContent?.trim() || row.textContent?.trim() || "";

      if (descricao.length > 5) {
        movimentos.push({
          data: dataTexto,
          descricao,
          tipo: this.detectTipoMovimento(descricao),
          timestamp: this.parseDataMovimento(dataTexto),
        });
      }
    });

    // Fallback: extrai do texto
    if (movimentos.length === 0) {
      const textoMovimentos = this.extractMovimentosFromText();
      movimentos.push(...textoMovimentos);
    }

    return movimentos;
  }

  /**
   * Extrai movimentos do texto
   */
  private extractMovimentosFromText(): Movimento[] {
    const movimentos: Movimento[] = [];
    const texto = document.body.innerText;

    // Padrão: "DD/MM/YYYY HH:MM - Descrição"
    const regex =
      /(\d{2}\/\d{2}\/\d{4})\s*(?:\d{2}:\d{2})?\s*[-–]\s*(.+?)(?=\n\d{2}\/\d{2}\/\d{4}|\n$)/gi;
    let match;

    while ((match = regex.exec(texto)) !== null) {
      movimentos.push({
        data: match[1],
        descricao: match[2].trim(),
        tipo: this.detectTipoMovimento(match[2]),
        timestamp: this.parseDataMovimento(match[1]),
      });
    }

    return movimentos;
  }

  /**
   * Detecta tipo de movimento
   */
  private detectTipoMovimento(descricao: string): Movimento["tipo"] {
    const lower = descricao.toLowerCase();

    if (lower.includes("sentença")) return "sentenca";
    if (lower.includes("decisão")) return "decisao";
    if (lower.includes("despacho")) return "despacho";
    if (lower.includes("intimação") || lower.includes("intimacao")) return "intimacao";
    if (lower.includes("citação") || lower.includes("citacao")) return "citacao";
    if (lower.includes("juntada")) return "juntada";
    if (lower.includes("publicação") || lower.includes("publicado")) return "publicacao";

    return "outros";
  }

  /**
   * Parse data do movimento
   */
  private parseDataMovimento(dataStr: string): number {
    const match = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1])).getTime();
    }
    return Date.now();
  }

  /**
   * Extrai documentos/peças processuais
   */
  private async extractDocumentos(): Promise<DocumentoPJe[]> {
    await this.navigateToTab(NAV_SELECTORS.TAB_DOCUMENTOS);
    await this.waitForLoad();

    // Expande árvore de documentos
    await this.expandAllSections();

    const documentos: DocumentoPJe[] = [];
    const docLinks = document.querySelectorAll(NAV_SELECTORS.DOCUMENTO_LINK);

    console.log(`[PageNavigator] Encontrados ${docLinks.length} links de documentos`);

    // Extrai metadados de cada documento
    for (let i = 0; i < docLinks.length && this.isRunning; i++) {
      const link = docLinks[i] as HTMLAnchorElement;

      try {
        const doc = await this.extractDocumentoInfo(link, i);
        if (doc) {
          documentos.push(doc);
        }

        // Delay entre documentos
        await this.sleep(CONFIG.CLICK_DELAY);
      } catch (error) {
        console.warn(`[PageNavigator] Erro ao extrair documento ${i}:`, error);
      }
    }

    return documentos;
  }

  /**
   * Extrai informações de um documento
   */
  private async extractDocumentoInfo(
    link: HTMLAnchorElement,
    index: number
  ): Promise<DocumentoPJe | null> {
    const row = link.closest("tr, .documento-item, .linha-documento");
    const texto = row?.textContent || link.textContent || "";

    // Extrai tipo do documento
    const tipo = this.detectTipoDocumento(texto);

    // Extrai data
    const dataMatch = texto.match(/(\d{2}\/\d{2}\/\d{4})/);
    const data = dataMatch ? dataMatch[1] : new Date().toLocaleDateString("pt-BR");

    // Extrai ID do documento
    const href = link.href || link.getAttribute("onclick") || "";
    const idMatch = href.match(/id=(\d+)/) || href.match(/documento\((\d+)\)/);
    const id = idMatch ? idMatch[1] : `doc-${index}`;

    // Tenta extrair conteúdo se for texto
    let conteudo = "";

    // Verifica se é possível abrir o documento inline
    if (link.getAttribute("onclick")?.includes("visualizar")) {
      // Abre documento
      link.click();
      await this.sleep(CONFIG.WAIT_FOR_LOAD);

      // Extrai conteúdo do viewer
      const viewer = document.querySelector(NAV_SELECTORS.DOCUMENTO_VIEWER);
      if (viewer) {
        conteudo = viewer.textContent?.trim() || "";

        // Fecha viewer se houver botão de fechar
        const closeBtn = document.querySelector(
          '[class*="close"], [onclick*="fechar"], .btn-fechar'
        );
        if (closeBtn) {
          (closeBtn as HTMLElement).click();
          await this.sleep(CONFIG.CLICK_DELAY);
        }
      }
    }

    return {
      id,
      tipo,
      conteudo,
      dataExtracao: new Date().toISOString(),
      metadados: {
        numeroProcesso: this.processNumber,
        dataJuntada: data,
        descricao: texto.substring(0, 200),
      },
    };
  }

  /**
   * Detecta tipo de documento
   */
  private detectTipoDocumento(texto: string): DocumentoPJe["tipo"] {
    const lower = texto.toLowerCase();

    if (lower.includes("certidão") || lower.includes("certidao")) return "certidao";
    if (lower.includes("mandado")) return "mandado";
    if (lower.includes("despacho")) return "despacho";
    if (lower.includes("sentença") || lower.includes("sentenca")) return "sentenca";
    if (lower.includes("decisão") || lower.includes("decisao")) return "decisao";
    if (lower.includes("petição") || lower.includes("peticao")) return "peticao";
    if (lower.includes("contestação") || lower.includes("contestacao")) return "contestacao";

    return "outro";
  }

  /**
   * Navega para uma aba específica
   */
  private async navigateToTab(selector: string): Promise<void> {
    const tab = document.querySelector(selector) as HTMLElement;
    if (tab) {
      tab.click();
      await this.waitForLoad();
    }
  }

  /**
   * Expande todas as seções colapsadas
   */
  private async expandAllSections(): Promise<void> {
    const expandButtons = Array.from(document.querySelectorAll(NAV_SELECTORS.EXPAND_BUTTON));

    for (const button of expandButtons) {
      const parent = button.closest(NAV_SELECTORS.COLLAPSED_SECTION);
      if (parent) {
        (button as HTMLElement).click();
        await this.sleep(CONFIG.CLICK_DELAY);
      }
    }

    // Também expande por aria-expanded
    const collapsedElements = Array.from(document.querySelectorAll('[aria-expanded="false"]'));
    for (const el of collapsedElements) {
      (el as HTMLElement).click();
      await this.sleep(CONFIG.CLICK_DELAY);
    }
  }

  /**
   * Aguarda carregamento da página
   */
  private async waitForLoad(): Promise<void> {
    // Aguarda tempo mínimo
    await this.sleep(CONFIG.WAIT_FOR_AJAX);

    // Aguarda indicadores de loading sumirem
    let attempts = 0;
    while (attempts < 10) {
      const loading = document.querySelector(NAV_SELECTORS.LOADING);
      if (!loading || getComputedStyle(loading).display === "none") {
        break;
      }
      await this.sleep(500);
      attempts++;
    }

    // Aguarda adicional para conteúdo dinâmico
    await this.sleep(CONFIG.WAIT_FOR_LOAD);
  }

  /**
   * Consolida todo o texto extraído
   */
  private consolidateText(result: CrawlResult): string {
    const parts: string[] = [];

    // Dados básicos
    if (result.dados) {
      parts.push("=== DADOS DO PROCESSO ===");
      for (const [key, value] of Object.entries(result.dados)) {
        parts.push(`${key}: ${value}`);
      }
    }

    // Partes
    if (result.partes.length > 0) {
      parts.push("\n=== PARTES ===");
      for (const parte of result.partes) {
        parts.push(
          `${parte.tipo.toUpperCase()}: ${parte.nome}${parte.documento ? ` (${parte.documento})` : ""}`
        );
        if (parte.advogados?.length) {
          parts.push(`  Advogado(s): ${parte.advogados.join(", ")}`);
        }
      }
    }

    // Movimentos
    if (result.movimentos.length > 0) {
      parts.push("\n=== MOVIMENTAÇÃO ===");
      for (const mov of result.movimentos) {
        parts.push(`${mov.data} - ${mov.descricao}`);
      }
    }

    // Documentos
    if (result.documentos.length > 0) {
      parts.push("\n=== DOCUMENTOS ===");
      for (const doc of result.documentos) {
        parts.push(`[${doc.tipo.toUpperCase()}] ${doc.metadados?.descricao || "Documento"}`);
        if (doc.conteudo) {
          parts.push(doc.conteudo.substring(0, 5000)); // Limita tamanho
        }
      }
    }

    return parts.join("\n");
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
