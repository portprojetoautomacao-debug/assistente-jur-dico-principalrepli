/**
 * Extrator de documentos e certidões do PJe
 * Captura conteúdo de documentos abertos na tela
 */

import { DocumentoPJe } from "../../shared/types";

// Seletores para documentos no PJe
const DOCUMENT_SELECTORS = {
  // Container principal do documento
  DOCUMENTO_CONTAINER:
    ".documento-conteudo, #documento, .conteudo-documento, .visualizador-documento",
  DOCUMENTO_IFRAME: 'iframe.documento, iframe#documento, iframe[src*="documento"]',

  // Cabeçalho do documento
  CABECALHO: ".cabecalho-documento, .header-documento",
  TIPO_DOCUMENTO: ".tipo-documento, .classe-documento, h1, h2",
  NUMERO_ID: ".id-documento, [data-id]",

  // Corpo do documento
  CORPO_DOCUMENTO: ".corpo-documento, .texto-documento, .conteudo",

  // Metadados
  DATA_JUNTADA: ".data-juntada, .data-inclusao",
  ASSINANTE: ".assinante, .assinatura, .servidor",

  // Modal de visualização
  MODAL_DOCUMENTO: '.modal-documento, .dialog-documento, [role="dialog"]',

  // PDF Viewer integrado
  PDF_VIEWER: '.pdf-viewer, canvas.pdf-page, embed[type="application/pdf"]',
};

// Padrões regex para extração
const PATTERNS = {
  NUMERO_CNJ: /(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/,
  CPF: /(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/g,
  DATA_BR: /(\d{1,2})\s*(?:de\s+)?(\w+)\s*(?:de\s+)?(\d{4})/gi,
  DATA_CURTA: /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
  PROCESSO_NO: /[Pp]rocesso\s*[Nn][ºo°]?\s*:?\s*(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/,
  CLASSE_PROCESSUAL: /[Cc]lasse:\s*\[?([^\]\n]+)\]?/,
  AUTOR: /[Aa]utor[a]?:?\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-záéíóúâêôãõçÀ-ÿ\s]+)/,
  REU: /[Rr][ée]u[s]?:?\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-záéíóúâêôãõçÀ-ÿ\s]+)/,
  COMARCA: new RegExp("[Cc]omarca\\s*(?:de\\s+)?([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-záéíóúâêôãõçÀ-ÿ\\s/]+)"),
  VARA: /(\d+[ªº]?\s*[Vv]ara[^\n,]*)/,
  CERTIDAO: /[Cc]ertid[ãa]o|[Cc]ertifico/i,
  MANDADO: /[Mm]andado/i,
  DESPACHO: /[Dd]espacho/i,
  SENTENCA: /[Ss]enten[çc]a/i,
};

export class DocumentExtractor {
  /**
   * Verifica se há um documento aberto na tela
   */
  public isDocumentoAberto(): boolean {
    // Verifica se há container de documento
    const container = document.querySelector(DOCUMENT_SELECTORS.DOCUMENTO_CONTAINER);
    if (container) return true;

    // Verifica se há modal de documento
    const modal = document.querySelector(DOCUMENT_SELECTORS.MODAL_DOCUMENTO);
    if (modal && getComputedStyle(modal).display !== "none") return true;

    // Verifica se há iframe de documento
    const iframe = document.querySelector(DOCUMENT_SELECTORS.DOCUMENTO_IFRAME);
    if (iframe) return true;

    return false;
  }

  /**
   * Extrai documento visível na tela
   */
  public extractDocumento(): DocumentoPJe | null {
    const texto = this.getDocumentoTexto();

    if (!texto || texto.length < 50) {
      console.log("[DocumentExtractor] Texto muito curto ou vazio");
      return null;
    }

    console.log(`[DocumentExtractor] Extraindo documento com ${texto.length} caracteres`);

    const documento: DocumentoPJe = {
      id: this.generateId(),
      tipo: this.detectarTipoDocumento(texto),
      conteudo: texto,
      dataExtracao: new Date().toISOString(),
      metadados: {},
    };

    // Extrai metadados
    documento.metadados.numeroProcesso = this.extractNumeroProcesso(texto);
    documento.metadados.classe = this.extractClasse(texto);
    documento.metadados.autor = this.extractAutor(texto);
    documento.metadados.reu = this.extractReu(texto);
    documento.metadados.comarca = this.extractComarca(texto);
    documento.metadados.vara = this.extractVara(texto);
    documento.metadados.cpfs = this.extractCPFs(texto);
    documento.metadados.datas = this.extractDatas(texto);

    console.log("[DocumentExtractor] Documento extraído:", documento.metadados);

    return documento;
  }

  /**
   * Obtém texto do documento
   */
  private getDocumentoTexto(): string {
    // Tenta container direto
    const container = document.querySelector(DOCUMENT_SELECTORS.DOCUMENTO_CONTAINER);
    if (container) {
      return container.textContent?.trim() || "";
    }

    // Tenta iframe
    const iframe = document.querySelector(DOCUMENT_SELECTORS.DOCUMENTO_IFRAME) as HTMLIFrameElement;
    if (iframe) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          return iframeDoc.body.textContent?.trim() || "";
        }
      } catch (e) {
        console.warn("[DocumentExtractor] Não foi possível acessar iframe:", e);
      }
    }

    // Tenta modal
    const modal = document.querySelector(DOCUMENT_SELECTORS.MODAL_DOCUMENTO);
    if (modal) {
      return modal.textContent?.trim() || "";
    }

    // Fallback: área de conteúdo principal
    const mainContent = document.querySelector('#conteudo, .conteudo, main, [role="main"]');
    if (mainContent) {
      return mainContent.textContent?.trim() || "";
    }

    return "";
  }

  /**
   * Detecta tipo de documento
   */
  private detectarTipoDocumento(texto: string): DocumentoPJe["tipo"] {
    if (PATTERNS.CERTIDAO.test(texto)) return "certidao";
    if (PATTERNS.MANDADO.test(texto)) return "mandado";
    if (PATTERNS.DESPACHO.test(texto)) return "despacho";
    if (PATTERNS.SENTENCA.test(texto)) return "sentenca";
    return "outro";
  }

  /**
   * Extrai número do processo
   */
  private extractNumeroProcesso(texto: string): string | undefined {
    // Tenta padrão completo primeiro
    const matchProcesso = texto.match(PATTERNS.PROCESSO_NO);
    if (matchProcesso) return matchProcesso[1];

    // Tenta CNJ direto
    const matchCNJ = texto.match(PATTERNS.NUMERO_CNJ);
    if (matchCNJ) return matchCNJ[1];

    return undefined;
  }

  /**
   * Extrai classe processual
   */
  private extractClasse(texto: string): string | undefined {
    const match = texto.match(PATTERNS.CLASSE_PROCESSUAL);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Extrai autor
   */
  private extractAutor(texto: string): string | undefined {
    const match = texto.match(PATTERNS.AUTOR);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Extrai réu
   */
  private extractReu(texto: string): string | undefined {
    const match = texto.match(PATTERNS.REU);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Extrai comarca
   */
  private extractComarca(texto: string): string | undefined {
    const match = texto.match(PATTERNS.COMARCA);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Extrai vara
   */
  private extractVara(texto: string): string | undefined {
    const match = texto.match(PATTERNS.VARA);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Extrai todos os CPFs
   */
  private extractCPFs(texto: string): string[] {
    const matches = texto.match(PATTERNS.CPF);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Extrai todas as datas
   */
  private extractDatas(texto: string): string[] {
    const datas: string[] = [];

    // Datas no formato "5 de dezembro de 2025"
    let match;
    const regexLonga = new RegExp(PATTERNS.DATA_BR);
    while ((match = regexLonga.exec(texto)) !== null) {
      datas.push(`${match[1]}/${this.mesParaNumero(match[2])}/${match[3]}`);
    }

    // Datas no formato "05/12/2025"
    const regexCurta = new RegExp(PATTERNS.DATA_CURTA);
    while ((match = regexCurta.exec(texto)) !== null) {
      datas.push(`${match[1].padStart(2, "0")}/${match[2].padStart(2, "0")}/${match[3]}`);
    }

    return [...new Set(datas)];
  }

  /**
   * Converte nome do mês para número
   */
  private mesParaNumero(mes: string): string {
    const meses: Record<string, string> = {
      janeiro: "01",
      fevereiro: "02",
      março: "03",
      abril: "04",
      maio: "05",
      junho: "06",
      julho: "07",
      agosto: "08",
      setembro: "09",
      outubro: "10",
      novembro: "11",
      dezembro: "12",
      jan: "01",
      fev: "02",
      mar: "03",
      abr: "04",
      mai: "05",
      jun: "06",
      jul: "07",
      ago: "08",
      set: "09",
      out: "10",
      nov: "11",
      dez: "12",
    };
    return meses[mes.toLowerCase()] || "01";
  }

  /**
   * Gera ID único
   */
  private generateId(): string {
    return crypto.randomUUID();
  }
}
