/**
 * PJe OCR Extractor - Extração automática de dados de documentos do PJe
 *
 * Funcionalidades:
 * - Extração de texto via OCR (Tesseract.js)
 * - Parser de certidões e expedientes
 * - Identificação automática de processos
 * - Extração de datas, CPFs, nomes, etc.
 */

import type { Expediente, Process } from "@/types";
import Tesseract from "tesseract.js";

export interface PjeDocumentData {
  numeroProcesso?: string;
  classe?: string;
  autor?: string;
  autorCPF?: string;
  reu?: string;
  reuCPF?: string;
  comarca?: string;
  vara?: string;
  tipoDocumento?: "certidao" | "mandado" | "expedicao" | "despacho" | "sentenca";
  dataExpedicao?: string;
  conteudo: string;
}

/**
 * Extrai texto de imagem usando OCR
 */
export async function extractTextFromImage(
  imageFile: File | string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const result = await Tesseract.recognize(imageFile, "por", {
      logger: (info: Tesseract.LoggerMessage) => {
        if (info.status === "recognizing text" && onProgress) {
          onProgress(info.progress);
        }
      },
    });

    return result.data.text;
  } catch (error) {
    console.error("[PjeOCR] Erro ao extrair texto:", error);
    throw new Error("Falha ao processar imagem com OCR");
  }
}

/**
 * Parser de número de processo CNJ
 */
function parseNumeroProcesso(text: string): string | null {
  // Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
  const cnj = text.match(/(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/);
  if (cnj) return cnj[1];

  // Formato alternativo sem hífens
  const cnjAlt = text.match(/(\d{20})/);
  if (cnjAlt) {
    const num = cnjAlt[1];
    return `${num.slice(0, 7)}-${num.slice(7, 9)}.${num.slice(9, 13)}.${num.slice(13, 14)}.${num.slice(14, 16)}.${num.slice(16)}`;
  }

  return null;
}

/**
 * Parser de CPF
 */
function parseCPF(text: string): string[] {
  const cpfs = text.match(/(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/g) || [];
  return cpfs.map((cpf) => cpf.replace(/[^\d]/g, ""));
}

/**
 * Parser de datas
 */
function parseDatas(text: string): string[] {
  const datas: string[] = [];

  // Formato: DD/MM/YYYY ou DD de MMMM de YYYY
  const regex1 = /(\d{1,2})\s{0,3}(?:de\s{1,2})?(\w{3,12})\s{1,3}(?:de\s{1,2})?(\d{4})/gi;
  const matches1 = text.matchAll(regex1);

  for (const match of matches1) {
    const dia = match[1].padStart(2, "0");
    const mes = match[2];
    const ano = match[3];

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

    const mesNum = meses[mes.toLowerCase()] || mes.padStart(2, "0");
    datas.push(`${dia}/${mesNum}/${ano}`);
  }

  // Formato DD/MM/YYYY direto
  const regex2 = /(\d{1,2})\/(\d{1,2})\/(\d{4})/g;
  const matches2 = text.matchAll(regex2);

  for (const match of matches2) {
    datas.push(`${match[1].padStart(2, "0")}/${match[2].padStart(2, "0")}/${match[3]}`);
  }

  return [...new Set(datas)]; // Remove duplicatas
}

/**
 * Identifica tipo de documento
 */
function identificarTipoDocumento(text: string): PjeDocumentData["tipoDocumento"] {
  const textLower = text.toLowerCase();

  if (textLower.includes("certidão") || textLower.includes("certifico")) {
    return "certidao";
  }
  if (textLower.includes("mandado")) {
    return "mandado";
  }
  if (textLower.includes("expedição") || textLower.includes("expedição de certidão")) {
    return "expedicao";
  }
  if (textLower.includes("despacho")) {
    return "despacho";
  }
  if (textLower.includes("sentença")) {
    return "sentenca";
  }

  return "certidao"; // Default
}

/**
 * Extrai comarca/vara
 */
function parseComarcaVara(text: string): { comarca?: string; vara?: string } {
  const result: { comarca?: string; vara?: string } = {};

  // Comarca
  const comarcaMatch = text.match(/Comarca\s+(?:de\s+)?([A-Z][^\n]+)/i);
  if (comarcaMatch) {
    result.comarca = comarcaMatch[1].trim();
  }

  // Vara
  const varaMatch = text.match(/(\d+[ªº\s]{0,3}Vara[^\n]{0,100})/i);
  if (varaMatch) {
    result.vara = varaMatch[1].trim();
  }

  return result;
}

/**
 * Parser principal - extrai dados estruturados de texto OCR
 */
export function parsePjeDocument(ocrText: string): PjeDocumentData {
  const data: PjeDocumentData = {
    conteudo: ocrText,
  };

  // Número do processo
  data.numeroProcesso = parseNumeroProcesso(ocrText) || undefined;

  // Tipo de documento
  data.tipoDocumento = identificarTipoDocumento(ocrText);

  // Comarca e Vara
  const { comarca, vara } = parseComarcaVara(ocrText);
  data.comarca = comarca;
  data.vara = vara;

  // Classe processual
  const classeMatch = ocrText.match(/CLASSE:\s*\[([^\]]+)\]/i);
  if (classeMatch) {
    data.classe = classeMatch[1].trim();
  }

  // Autor
  const autorMatch = ocrText.match(/AUTOR[:.]\s{0,3}([A-Z\s]{3,100})(?:\s+CPF|$)/i);
  if (autorMatch) {
    data.autor = autorMatch[1].trim();
  }

  // Réu
  const reuMatch = ocrText.match(/R[ÉE]U[:]\s{0,3}([A-Z\s]{3,100})(?:\s+CPF|$)/i);
  if (reuMatch) {
    data.reu = reuMatch[1].trim();
  }

  // CPFs
  const cpfs = parseCPF(ocrText);
  if (cpfs.length > 0) {
    data.autorCPF = cpfs[0];
  }
  if (cpfs.length > 1) {
    data.reuCPF = cpfs[1];
  }

  // Datas
  const datas = parseDatas(ocrText);
  if (datas.length > 0) {
    data.dataExpedicao = datas[0];
  }

  return data;
}

/**
 * Converte documento PJe extraído para objeto Process
 */
export function pjeDocumentToProcess(doc: PjeDocumentData): Partial<Process> {
  return {
    numeroCNJ: doc.numeroProcesso || "",
    titulo: `${doc.classe || "Processo"} - ${doc.autor || "Autor não identificado"}`,
    autor: doc.autor,
    reu: doc.reu,
    comarca: doc.comarca,
    vara: doc.vara,
    fase: "inicial",
    status: "ativo",
  };
}

/**
 * Converte documento PJe extraído para objeto Expediente
 */
export function pjeDocumentToExpediente(
  doc: PjeDocumentData,
  processId: string
): Partial<Expediente> {
  return {
    processId,
    tipo: "intimacao" as const,
    dataRecebimento: doc.dataExpedicao || new Date().toISOString(),
    conteudo: doc.conteudo,
    lido: false,
  };
}

/**
 * Pipeline completo: imagem → dados estruturados
 */
export async function processarImagemPJe(
  imageFile: File,
  onProgress?: (stage: string, progress: number) => void
): Promise<{
  processo: Partial<Process>;
  expediente: Partial<Expediente>;
  dadosOriginais: PjeDocumentData;
}> {
  try {
    // Etapa 1: OCR
    onProgress?.("Extraindo texto da imagem...", 0);
    const ocrText = await extractTextFromImage(imageFile, (progress) => {
      onProgress?.("Extraindo texto da imagem...", progress * 100);
    });

    // Etapa 2: Parser
    onProgress?.("Analisando documento...", 100);
    const dadosOriginais = parsePjeDocument(ocrText);

    // Etapa 3: Conversão
    const processo = pjeDocumentToProcess(dadosOriginais);
    const expediente = pjeDocumentToExpediente(dadosOriginais, "temp-id");

    onProgress?.("Concluído!", 100);

    return { processo, expediente, dadosOriginais };
  } catch (error) {
    console.error("[processarImagemPJe] Erro:", error);
    throw error;
  }
}
