/**
 * PJe Direct API Integration
 *
 * Official CNJ PJe (Processo Judicial Eletrônico) API for direct access to court data
 * Documentation: https://docs.pje.jus.br/manuais-basicos/padroes-de-api-do-pje/
 *
 * This provides direct access to court systems using PJe, which includes:
 * - Process information
 * - Movements and updates
 * - Documents
 * - Publications and notifications
 */

import type {
  UnifiedPublication,
  PublicationSearchParams,
  PublicationSourceConfig,
} from "./publication-sources-types";

export interface PJeConfig extends PublicationSourceConfig {
  source: "pje_direct";
  tribunalUrl?: string;
  username?: string;
  password?: string;
}

export interface PJeProcesso {
  numeroProcesso: string;
  classe?: string;
  assunto?: string;
  orgaoJulgador?: string;
  dataAjuizamento?: string;
  valor?: number;
  partes?: Array<{
    tipo: string;
    nome: string;
    cpfCnpj?: string;
  }>;
  advogados?: Array<{
    nome: string;
    oab: string;
  }>;
  movimentos?: Array<{
    data: string;
    codigo: string;
    descricao: string;
    observacao?: string;
  }>;
}

export interface PJePublicacao {
  id: string;
  numeroProcesso: string;
  tipo: string;
  data: string;
  conteudo: string;
  destinatarios?: string[];
  advogados?: string[];
}

// Map of tribunals and their URLs
const PJE_TRIBUNAL_URLS: Record<string, string> = {
  trf1: "https://pje1g.trf1.jus.br/pje",
  trf2: "https://pje2.trf2.jus.br/pje",
  trf3: "https://pje1g.trf3.jus.br/pje",
  trf4: "https://pje2g.trf4.jus.br/pje",
  trf5: "https://pje.trf5.jus.br/pje",
  tst: "https://pje.tst.jus.br/pje",
  tjac: "https://pje.tjac.jus.br/pje",
  tjal: "https://pje.tjal.jus.br/pje",
  tjam: "https://pje.tjam.jus.br/pje",
  tjap: "https://pje.tjap.jus.br/pje",
  tjba: "https://pje.tjba.jus.br/pje",
  tjce: "https://pje.tjce.jus.br/pje",
  tjdft: "https://pje.tjdft.jus.br/pje",
  tjes: "https://pje.tjes.jus.br/pje",
  tjgo: "https://pje.tjgo.jus.br/pje",
  tjma: "https://pje.tjma.jus.br/pje",
  tjmg: "https://pje.tjmg.jus.br/pje",
  tjms: "https://pje.tjms.jus.br/pje",
  tjmt: "https://pje.tjmt.jus.br/pje",
  tjpa: "https://pje.tjpa.jus.br/pje",
  tjpb: "https://pje.tjpb.jus.br/pje",
  tjpe: "https://pje.tjpe.jus.br/pje",
  tjpi: "https://pje.tjpi.jus.br/pje",
  tjpr: "https://pje.tjpr.jus.br/pje",
  tjrj: "https://pje.tjrj.jus.br/pje",
  tjrn: "https://pje.tjrn.jus.br/pje",
  tjro: "https://pje.tjro.jus.br/pje",
  tjrr: "https://pje.tjrr.jus.br/pje",
  tjrs: "https://pje.tjrs.jus.br/pje",
  tjsc: "https://pje.tjsc.jus.br/pje",
  tjse: "https://pje.tjse.jus.br/pje",
  tjsp: "https://pje.tjsp.jus.br/pje",
  tjto: "https://pje.tjto.jus.br/pje",
};

// Custom error for PJe API issues
export class PJeAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly tribunal?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "PJeAPIError";
  }
}

/**
 * Check if PJe integration is enabled
 */
export function isPJeEnabled(config?: PJeConfig): boolean {
  return config?.enabled ?? false;
}

/**
 * Consult publications in PJe system
 */
export async function consultarPublicacoesPJe(
  params: PublicationSearchParams,
  config?: PJeConfig
): Promise<UnifiedPublication[]> {
  const publications: UnifiedPublication[] = [];

  // Check if PJe is enabled
  if (!isPJeEnabled(config)) {
    throw new PJeAPIError("PJe integration not enabled");
  }

  const tribunals = params.tribunals || ["trf1"];

  for (const tribunal of tribunals) {
    const baseUrl = PJE_TRIBUNAL_URLS[tribunal.toLowerCase()];

    if (!baseUrl) {
      console.warn(`PJe URL not configured for tribunal: ${tribunal}`);
      continue;
    }

    try {
      // Montar credenciais separadamente (SonarCloud S5765)
      const username = config?.username || "";
      const password = config?.password || "";
      const credentials = btoa(`${username}:${password}`);

      const response = await fetch(`${baseUrl}/api/v1/publicacoes`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch PJe publications: ${response.statusText}`);
      }

      const data = await response.json();
      publications.push(...data.publications);
    } catch (error) {
      console.error(`Error consulting PJe for ${tribunal}:`, error);
    }
  }

  return publications;
}

/**
 * Get tribunal URL for PJe access
 */
export function getPJeTribunalUrl(tribunal: string): string | null {
  return PJE_TRIBUNAL_URLS[tribunal.toLowerCase()] || null;
}

/**
 * Check if tribunal has PJe available
 */
export function isTribunalPJeAvailable(tribunal: string): boolean {
  return tribunal.toLowerCase() in PJE_TRIBUNAL_URLS;
}

/**
 * Get list of all tribunals with PJe
 */
export function getTribunaisComPJe(): string[] {
  return Object.keys(PJE_TRIBUNAL_URLS);
}
