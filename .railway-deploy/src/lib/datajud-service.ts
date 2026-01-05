/**
 * DataJud API Service - Integra��o com API P�blica do CNJ
 *
 * Documenta��o: https://www.cnj.jus.br/datajud
 * API Endpoint: https://api-publica.datajud.cnj.jus.br/api_publica
 *
 * Permite buscar metadados processuais e movimenta��es de tribunais brasileiros
 * sem necessidade de download manual.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DataJudProcesso {
  id: string;
  numero: string; // CNJ
  tribunal: string; // TST, TRT3, TJMG, etc
  classe: string;
  assunto: string;
  dataAjuizamento: string;
  orgaoJulgador: string;
  movimentacoes?: Array<{
    data: string;
    tipo: string;
    descricao: string;
  }>;
  partes?: Array<{
    tipo: string; // autor, reu
    nome: string;
  }>;
}

export interface DataJudSearchOptions {
  tribunal?: string;
  classe?: string;
  assunto?: string;
  dataInicio?: string;
  dataFim?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class DataJudService {
  private readonly baseUrl = "https://api-publica.datajud.cnj.jus.br/api_publica";
  private readonly timeout = 30000;

  /**
   * Buscar processos por filtros
   */
  async searchProcessos(options: DataJudSearchOptions = {}): Promise<DataJudProcesso[]> {
    const { tribunal, classe, assunto, dataInicio, dataFim, limit = 100, offset = 0 } = options;

    const params = new URLSearchParams();
    if (tribunal) params.append("siglaTribunal", tribunal);
    if (classe) params.append("classeProcessual", classe);
    if (assunto) params.append("assunto", assunto);
    if (dataInicio) params.append("dataInicio", dataInicio);
    if (dataFim) params.append("dataFim", dataFim);
    params.append("tamanho", String(limit));
    params.append("pagina", String(Math.floor(offset / limit)));

    const url = `${this.baseUrl}/processos?${params.toString()}`;

    console.log(`[DataJud] Buscando processos: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "AssistenteJuridico/1.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DataJud API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // A API retorna em formato { hits: { hits: [...] } }
      const processos = this.parseResponse(data);

      console.log(`[DataJud] Encontrados ${processos.length} processos`);

      return processos;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`DataJud API timeout ap�s ${this.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Buscar precedentes jurisprudenciais (decis�es de 2� grau)
   */
  async searchPrecedentes(tribunal: string, tema: string, limit = 50): Promise<DataJudProcesso[]> {
    return this.searchProcessos({
      tribunal,
      assunto: tema,
      classe: "Apela��o C�vel", // Focar em decis�es de 2� grau
      limit,
    });
  }

  /**
   * Buscar por m�ltiplos tribunais
   */
  async searchMultipleTribunals(
    tribunais: string[],
    options: Omit<DataJudSearchOptions, "tribunal"> = {}
  ): Promise<Map<string, DataJudProcesso[]>> {
    const results = new Map<string, DataJudProcesso[]>();

    for (const tribunal of tribunais) {
      console.log(`[DataJud] Buscando em ${tribunal}...`);

      try {
        const processos = await this.searchProcessos({
          ...options,
          tribunal,
        });

        results.set(tribunal, processos);

        // Delay entre requests para n�o sobrecarregar API
        await this.delay(1000);
      } catch (error) {
        console.error(`[DataJud] Erro ao buscar ${tribunal}:`, error);
        results.set(tribunal, []);
      }
    }

    return results;
  }

  /**
   * Buscar temas jur�dicos relevantes (dataset curado)
   */
  async searchTemasCurados(): Promise<
    Array<{ tema: string; tribunal: string; processos: DataJudProcesso[] }>
  > {
    const temas = [
      { tema: "Direitos Trabalhistas", tribunal: "TST" },
      { tema: "Direito Previdenci�rio", tribunal: "TRF1" },
      { tema: "Direito do Consumidor", tribunal: "TJMG" },
      { tema: "Direito Civil - Contratos", tribunal: "TJSP" },
      { tema: "Direito Administrativo", tribunal: "TRF6" },
    ];

    const results: Array<{ tema: string; tribunal: string; processos: DataJudProcesso[] }> = [];

    for (const { tema, tribunal } of temas) {
      console.log(`[DataJud] Buscando tema: ${tema} (${tribunal})`);

      try {
        const processos = await this.searchPrecedentes(tribunal, tema, 20);
        results.push({ tema, tribunal, processos });

        await this.delay(1500);
      } catch (error) {
        console.error(`[DataJud] Erro no tema ${tema}:`, error);
      }
    }

    return results;
  }

  /**
   * Parsear resposta da API DataJud
   */
  private parseResponse(data: unknown): DataJudProcesso[] {
    // A API do CNJ retorna em formato Elasticsearch
    // { hits: { total: X, hits: [ { _source: {...} } ] } }

    if (!data || typeof data !== "object") {
      return [];
    }

    const response = data as Record<string, unknown>;
    const hits = response.hits as Record<string, unknown> | undefined;

    if (!hits || !Array.isArray(hits.hits)) {
      return [];
    }

    return hits.hits.map((hit: Record<string, unknown>) => {
      const source = (hit._source || {}) as Record<string, unknown>;

      return {
        id: String(hit._id || crypto.randomUUID()),
        numero: String(source.numeroProcesso || "N�o informado"),
        tribunal: String(source.siglaTribunal || "N/A"),
        classe: String(source.classe || "N/A"),
        assunto: String(source.assunto || "N/A"),
        dataAjuizamento: String(source.dataAjuizamento || ""),
        orgaoJulgador: String(source.orgaoJulgador || ""),
        movimentacoes: this.parseMovimentacoes(source.movimentacoes),
        partes: this.parsePartes(source.partes),
      };
    });
  }

  private parseMovimentacoes(
    mov: unknown
  ): Array<{ data: string; tipo: string; descricao: string }> {
    if (!Array.isArray(mov)) return [];

    return mov.map((m: Record<string, unknown>) => ({
      data: String(m.dataHora || ""),
      tipo: String(m.codigoNacional || ""),
      descricao: String(m.complemento || ""),
    }));
  }

  private parsePartes(partes: unknown): Array<{ tipo: string; nome: string }> {
    if (!Array.isArray(partes)) return [];

    return partes.map((p: Record<string, unknown>) => ({
      tipo: String(p.polo || ""),
      nome: String(p.nome || ""),
    }));
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

export const dataJudService = new DataJudService();
