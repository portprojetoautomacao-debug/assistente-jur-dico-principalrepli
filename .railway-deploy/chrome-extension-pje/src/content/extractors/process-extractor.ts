/**
 * Extrator de processos do painel PJe
 * Adaptado para estrutura real do PJe TJMG (RichFaces)
 */

import { CNJ_REGEX, PJE_SELECTORS } from "../../shared/constants";
import { ProcessoPJe } from "../../shared/types";
import { cleanProcessNumber, formatCNJ, isValidCNJ, parseDate } from "../../shared/utils";

export class ProcessExtractor {
  /**
   * Extrai todos os processos visíveis no painel
   * Usa múltiplas estratégias para encontrar processos
   */
  public extractProcessos(): ProcessoPJe[] {
    const processos: ProcessoPJe[] = [];

    // Estratégia 0: Verificar se é página de detalhes do processo
    if (this.isDetalhesPage()) {
      const detalhesProcesso = this.extractFromDetalhesPage();
      if (detalhesProcesso) {
        processos.push(detalhesProcesso);
        console.log(`[ProcessExtractor] Processo extraído da página de detalhes`);
        return processos;
      }
    }

    // Estratégia 1: Buscar em linhas de tabela (estrutura RichFaces)
    const rows = document.querySelectorAll(PJE_SELECTORS.PROCESSO_ROW);
    console.log(`[ProcessExtractor] Encontradas ${rows.length} linhas de processo`);

    rows.forEach((row, index) => {
      try {
        const processo = this.extractProcessoFromRow(row as HTMLElement);
        if (processo && isValidCNJ(processo.numero)) {
          processos.push(processo);
        }
      } catch (error) {
        console.error(`[ProcessExtractor] Erro na linha ${index}:`, error);
      }
    });

    // Estratégia 2: Se não encontrou via tabela, buscar links com número CNJ
    if (processos.length === 0) {
      const cnjProcessos = this.extractFromCNJLinks();
      processos.push(...cnjProcessos);
    }

    // Estratégia 3: Buscar em qualquer texto que contenha CNJ
    if (processos.length === 0) {
      const textProcessos = this.extractFromText();
      processos.push(...textProcessos);
    }

    console.log(`[ProcessExtractor] ${processos.length} processos válidos extraídos`);
    return processos;
  }

  /**
   * Verifica se é página de detalhes do processo
   */
  private isDetalhesPage(): boolean {
    const url = window.location.href;
    const isDetalhes =
      url.includes("listProcessoCompletoAdvogado") ||
      url.includes("ConsultaProcesso/Detalhe") ||
      url.includes("ConsultaProcesso/detalhe") ||
      url.includes("detalheProcesso") ||
      url.includes("Processo/Detalhe") ||
      // Verifica se tem id= na URL (típico de página de detalhes)
      (url.includes("/pje/") && url.includes("id="));

    console.log(`[ProcessExtractor] URL: ${url}`);
    console.log(`[ProcessExtractor] É página de detalhes? ${isDetalhes}`);

    return isDetalhes;
  }

  /**
   * Extrai processo da página de detalhes do PJe
   * Seletores específicos para a página listProcessoCompletoAdvogado.seam
   */
  private extractFromDetalhesPage(): ProcessoPJe | null {
    console.log("[ProcessExtractor] Extraindo da página de detalhes...");

    const selectors = this.getDetalhesPageSelectors();
    const { numero, numeroFormatado } = this.extractNumeroProcesso(selectors.numero);

    if (!numero || !isValidCNJ(numero)) {
      console.log("[ProcessExtractor] Número CNJ não encontrado na página de detalhes");
      return null;
    }

    // Extrai outros campos
    const classe = this.extractTextFromSelectors(selectors.classe);
    const assunto = this.extractTextFromSelectors(selectors.assunto);
    const orgao = this.extractTextFromSelectors(selectors.orgao);
    const { parteAutor, parteReu } = this.extractPartes();
    const movimentoText = this.extractTextFromSelectors(selectors.movimento);

    console.log(`[ProcessExtractor] Detalhes extraídos: classe=${classe}, orgao=${orgao}`);

    return {
      numero,
      numeroFormatado,
      classe,
      assunto,
      parteAutor,
      parteReu,
      vara: orgao,
      comarca: this.extractComarca(orgao),
      ultimoMovimento: {
        descricao: movimentoText || "Visualizado na página de detalhes",
        data: new Date().toLocaleDateString("pt-BR"),
        timestamp: Date.now(),
      },
      situacao: "ativo",
      valor: undefined,
      distribuicao: "",
    };
  }

  /**
   * Retorna seletores para página de detalhes
   */
  private getDetalhesPageSelectors() {
    return {
      numero: [
        "#processoTrfViewView\\:processoTrfViewForm\\:processoTrfViewPainelArvore_body .cabecalhoProcesso",
        ".cabecalho-processo .numero",
        "[id*='numero'][id*='processo']",
        ".numero-processo",
        "#numeroProcesso",
        "span[id*='numeroProcesso']",
        ".processo-numero",
      ],
      classe: [
        "[id*='classeJudicial']",
        "[id*='classe']",
        ".classe-judicial",
        "#classeProcesso",
        "span:contains('Classe:')",
      ],
      assunto: ["[id*='assuntos']", "[id*='assunto']", ".assunto-processo", "#assuntoProcesso"],
      partes: [
        "[id*='poloAtivo']",
        "[id*='poloPassivo']",
        "[id*='partes']",
        ".polo-ativo",
        ".polo-passivo",
        "#partesProcesso",
      ],
      orgao: ["[id*='orgaoJulgador']", "[id*='vara']", ".orgao-julgador", "#orgaoJulgador"],
      movimento: [
        "[id*='ultimoMovimento']",
        "[id*='movimento']",
        ".ultimo-movimento",
        ".movimentos-list tr:first-child",
      ],
    };
  }

  /**
   * Extrai número do processo usando múltiplas estratégias
   */
  private extractNumeroProcesso(selectors: string[]): { numero: string; numeroFormatado: string } {
    // Estratégia 1: Seletores específicos
    let result = this.tryExtractFromSelectors(selectors);
    if (result.numero) return result;

    // Estratégia 2: Título da página ou cabeçalho
    result = this.tryExtractFromHeader();
    if (result.numero) return result;

    // Estratégia 3: URL + body text
    return this.tryExtractFromBodyText();
  }

  /**
   * Tenta extrair número via seletores
   */
  private tryExtractFromSelectors(selectors: string[]): {
    numero: string;
    numeroFormatado: string;
  } {
    for (const selector of selectors) {
      try {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.textContent?.trim() || "";
          const match = text.match(CNJ_REGEX);
          if (match) {
            console.log(`[ProcessExtractor] Número encontrado via selector: ${match[0]}`);
            return {
              numero: cleanProcessNumber(match[0]),
              numeroFormatado: formatCNJ(match[0]),
            };
          }
        }
      } catch {
        // Selector inválido
      }
    }
    return { numero: "", numeroFormatado: "" };
  }

  /**
   * Tenta extrair número do título/header
   */
  private tryExtractFromHeader(): { numero: string; numeroFormatado: string } {
    const pageText =
      document.title +
      " " +
      (document.querySelector("h1, h2, .header, .cabecalho")?.textContent || "");
    const match = pageText.match(CNJ_REGEX);
    if (match) {
      console.log(`[ProcessExtractor] Número encontrado via título/header: ${match[0]}`);
      return {
        numero: cleanProcessNumber(match[0]),
        numeroFormatado: formatCNJ(match[0]),
      };
    }
    return { numero: "", numeroFormatado: "" };
  }

  /**
   * Tenta extrair número do body text
   */
  private tryExtractFromBodyText(): { numero: string; numeroFormatado: string } {
    const urlMatch = globalThis.location.href.match(/id=(\d+)/);
    if (urlMatch) {
      const bodyText = document.body.innerText;
      const match = bodyText.match(CNJ_REGEX);
      if (match) {
        console.log(`[ProcessExtractor] Número encontrado via body text: ${match[0]}`);
        return {
          numero: cleanProcessNumber(match[0]),
          numeroFormatado: formatCNJ(match[0]),
        };
      }
    }
    return { numero: "", numeroFormatado: "" };
  }

  /**
   * Extrai partes do processo (autor e réu)
   */
  private extractPartes(): { parteAutor: string; parteReu: string } {
    const poloAtivoEl = document.querySelector("[id*='poloAtivo'], .polo-ativo");
    const poloPassivoEl = document.querySelector("[id*='poloPassivo'], .polo-passivo");

    return {
      parteAutor: poloAtivoEl?.textContent?.trim() || "",
      parteReu: poloPassivoEl?.textContent?.trim() || "",
    };
  }

  /**
   * Extrai texto do primeiro seletor válido
   */
  private extractTextFromSelectors(selectors: string[]): string {
    for (const selector of selectors) {
      try {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.textContent?.trim();
          if (text) return text;
        }
      } catch {
        // Selector inválido
      }
    }
    return "";
  }

  /**
   * Extrai processos de links que contêm números CNJ
   */
  private extractFromCNJLinks(): ProcessoPJe[] {
    const processos: ProcessoPJe[] = [];
    const links = document.querySelectorAll("a");

    links.forEach((link) => {
      const text = link.textContent?.trim() || "";
      const match = text.match(CNJ_REGEX);

      if (match) {
        const numero = cleanProcessNumber(text);
        if (isValidCNJ(numero) && !processos.some((p) => p.numero === numero)) {
          const processo = this.createProcessoFromLink(link, numero, text);
          processos.push(processo);
        }
      }
    });

    console.log(`[ProcessExtractor] ${processos.length} processos encontrados via links CNJ`);
    return processos;
  }

  /**
   * Extrai processos de texto puro na página
   */
  private extractFromText(): ProcessoPJe[] {
    const processos: ProcessoPJe[] = [];
    const bodyText = document.body.innerText || "";
    const matches = bodyText.matchAll(new RegExp(CNJ_REGEX, "g"));

    for (const match of matches) {
      const numeroTexto = match[0];
      const numero = cleanProcessNumber(numeroTexto);

      if (isValidCNJ(numero) && !processos.some((p) => p.numero === numero)) {
        processos.push({
          numero,
          numeroFormatado: formatCNJ(numeroTexto),
          classe: "",
          assunto: "",
          parteAutor: "",
          parteReu: "",
          vara: "",
          comarca: "",
          ultimoMovimento: {
            descricao: "Extraído automaticamente",
            data: new Date().toLocaleDateString("pt-BR"),
            timestamp: Date.now(),
          },
          situacao: "ativo",
          valor: undefined,
          distribuicao: "",
        });
      }
    }

    console.log(`[ProcessExtractor] ${processos.length} processos encontrados via texto`);
    return processos;
  }

  /**
   * Cria um processo a partir de um link
   */
  private createProcessoFromLink(
    link: HTMLAnchorElement,
    numero: string,
    numeroTexto: string
  ): ProcessoPJe {
    // Tenta extrair informações do contexto (linha da tabela, elemento pai, etc.)
    const row = link.closest("tr");
    let classe = "";
    const assunto = "";
    const parteAutor = "";
    const parteReu = "";
    let vara = "";

    if (row) {
      // Busca em células da mesma linha
      const cells = row.querySelectorAll("td");
      cells.forEach((cell) => {
        const cellText = cell.textContent?.trim() || "";
        // Heurística: classes judiciais geralmente têm palavras-chave
        if (cellText.match(/ação|procedimento|recurso|execução/i) && !classe) {
          classe = cellText;
        }
      });

      // Busca por seletores específicos
      const classeEl = row.querySelector(PJE_SELECTORS.CLASSE);
      if (classeEl) classe = classeEl.textContent?.trim() || classe;

      const varaEl = row.querySelector(PJE_SELECTORS.VARA);
      if (varaEl) vara = varaEl.textContent?.trim() || "";
    }

    return {
      numero,
      numeroFormatado: formatCNJ(numeroTexto),
      classe,
      assunto,
      parteAutor,
      parteReu,
      vara,
      comarca: this.extractComarca(vara),
      ultimoMovimento: {
        descricao: "Sincronizado via extensão",
        data: new Date().toLocaleDateString("pt-BR"),
        timestamp: Date.now(),
      },
      situacao: "ativo",
      valor: undefined,
      distribuicao: "",
    };
  }

  private extractComarca(vara: string): string {
    const match = vara.match(/Comarca de (.+?)(?:\s|$)/i);
    return match ? match[1].trim() : "";
  }

  private extractProcessoFromRow(row: HTMLElement): ProcessoPJe | null {
    // Helper para tentar múltiplos seletores
    const getText = (primarySelector: string, fallbackSelectors: string[] = []): string => {
      const selectors = [primarySelector, ...fallbackSelectors];
      for (const sel of selectors) {
        try {
          const el = row.querySelector(sel);
          if (el?.textContent?.trim()) {
            return el.textContent.trim();
          }
        } catch {
          // Selector inválido, continua
        }
      }
      return "";
    };

    // Número do processo - aceita múltiplos formatos
    const numeroTexto = getText(PJE_SELECTORS.NUMERO_PROCESSO, [
      ".numero-processo",
      "span.numero-processo",
    ]);

    if (!numeroTexto) {
      return null;
    }

    const numero = cleanProcessNumber(numeroTexto);
    const numeroFormatado = formatCNJ(numeroTexto);

    // Validar formato CNJ (20 dígitos)
    if (!/^\d{20}$/.test(numero)) {
      return null;
    }

    // Classe e assunto
    const classe = getText(PJE_SELECTORS.CLASSE, [".classe-processo", "span.classe-processo"]);

    const assunto = getText(PJE_SELECTORS.ASSUNTO, [".assunto", "span.assunto"]);

    // Partes - tentar múltiplas estratégias
    let parteAutor = getText(PJE_SELECTORS.PARTE_AUTOR, [".parte-autor", "span.parte-autor"]);
    let parteReu = getText(PJE_SELECTORS.PARTE_REU, [".parte-reu", "span.parte-reu"]);

    // Se não encontrou partes separadas, tenta formato "AUTOR X RÉU"
    if (!parteAutor && !parteReu) {
      const partesText = getText("", [".partes", "div.partes"]);
      if (partesText) {
        const parts = partesText.split(/\s+[Xx]\s+/);
        parteAutor = parts[0]?.trim() ?? "";
        parteReu = parts.slice(1).join(" X ").trim() || "";
      } else {
        // Fallback: tentar extrair do texto da linha
        const rowText = row.textContent || "";
        const match = rowText.match(/([A-Z\s]+)\s+X\s+([A-Z\s]+)/);
        if (match) {
          parteAutor = match[1].trim();
          parteReu = match[2].trim();
        }
      }
    }

    // Vara e comarca
    const vara = getText(PJE_SELECTORS.VARA, [".vara", "span.vara"]);

    // Extrair comarca - aceita "Comarca de X" ou "de X" no final
    let comarca = "";
    const comarcaMatch = vara.match(/Comarca de\s*([\wÀ-ÿ\s-]+)/i);
    if (comarcaMatch) {
      comarca = comarcaMatch[1].trim();
    } else {
      const comarcaMatchSimple = vara.match(/de\s*([\wÀ-ÿ\s-]+)$/i);
      if (comarcaMatchSimple) {
        comarca = comarcaMatchSimple[1].trim();
      }
    }

    // Último movimento
    const movimentoDescricao = getText(PJE_SELECTORS.MOVIMENTO, [
      ".ultimo-movimento",
      "span.ultimo-movimento",
    ]);

    const dataTexto = getText(PJE_SELECTORS.DATA, [".data-movimento", "span.data-movimento"]);
    const dataMovimento = parseDate(dataTexto);

    // Situação - normalizar para lowercase
    const situacaoTexto = getText(PJE_SELECTORS.SITUACAO, [
      ".situacao",
      "span.situacao",
    ]).toLowerCase();

    const situacao = situacaoTexto.includes("baixado")
      ? ("baixado" as const)
      : situacaoTexto.includes("arquivado")
        ? ("arquivado" as const)
        : ("ativo" as const);

    // Valor da causa (se disponível)
    const valorEl = row.querySelector(".valor-causa, [data-valor]");
    const valor = valorEl?.textContent?.trim();

    return {
      numero,
      numeroFormatado,
      classe,
      assunto,
      parteAutor,
      parteReu,
      vara,
      comarca,
      ultimoMovimento: {
        descricao: movimentoDescricao,
        data: dataTexto,
        timestamp: dataMovimento.getTime(),
      },
      situacao,
      valor,
      distribuicao: dataTexto,
    };
  }
}
