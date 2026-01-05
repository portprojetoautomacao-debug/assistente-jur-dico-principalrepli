/**
 * Validação de inputs para o agente Pesquisa Jurisprudencial
 * Baseado no padrão Google Agent Starter Pack
 */

export interface PesquisaJurisInput {
  tema: string;
  tribunal?: string;
  dataInicio?: string;
  dataFim?: string;
  limit?: number;
  relevanceThreshold?: number;
}

const TRIBUNAIS_VALIDOS = [
  "STF",
  "STJ",
  "TST",
  "TRF1",
  "TRF2",
  "TRF3",
  "TRF4",
  "TRF5",
  "todos",
] as const;
type TribunalValido = (typeof TRIBUNAIS_VALIDOS)[number];

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public receivedValue: unknown
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Valida os inputs para pesquisa jurisprudencial
 *
 * @param data - Dados recebidos do usuário
 * @returns Inputs validados e normalizados
 * @throws {ValidationError} Se validação falhar
 *
 * @example
 * ```typescript
 * const validated = validatePesquisaInput({
 *   tema: "direito à greve",
 *   tribunal: "STF"
 * });
 * // { tema: "direito à greve", tribunal: "STF", dataInicio: "2020-01-01", ... }
 * ```
 */
// Helper: Validar tema obrigatório
function validateTema(tema: unknown): asserts tema is string {
  if (!tema) {
    throw new ValidationError("Campo 'tema' é obrigatório", "tema", tema);
  }

  if (typeof tema !== "string") {
    throw new ValidationError("Campo 'tema' deve ser uma string", "tema", tema);
  }

  if (tema.length < 3) {
    throw new ValidationError("Campo 'tema' deve ter pelo menos 3 caracteres", "tema", tema);
  }

  if (tema.length > 500) {
    throw new ValidationError(
      "Campo 'tema' não pode exceder 500 caracteres (recebido: " + tema.length + ")",
      "tema",
      tema
    );
  }
}

// Helper: Validar tribunal
function validateTribunal(tribunal: unknown): void {
  if (tribunal && !TRIBUNAIS_VALIDOS.includes(tribunal as TribunalValido)) {
    throw new ValidationError(
      `Tribunal inválido: '${tribunal}'. Valores aceitos: ${TRIBUNAIS_VALIDOS.join(", ")}`,
      "tribunal",
      tribunal
    );
  }
}

// Helper: Validar range de datas
function validatePesquisaDateRange(dataInicio: unknown, dataFim: unknown): void {
  if (dataInicio && !isValidDate(dataInicio as string)) {
    throw new ValidationError(
      `Data inválida: '${dataInicio}'. Use formato YYYY-MM-DD`,
      "dataInicio",
      dataInicio
    );
  }

  if (dataFim && !isValidDate(dataFim as string)) {
    throw new ValidationError(
      `Data inválida: '${dataFim}'. Use formato YYYY-MM-DD`,
      "dataFim",
      dataFim
    );
  }

  if (dataInicio && dataFim && new Date(dataInicio as string) > new Date(dataFim as string)) {
    throw new ValidationError(
      `dataInicio (${dataInicio}) não pode ser posterior a dataFim (${dataFim})`,
      "dataInicio",
      { dataInicio, dataFim }
    );
  }
}

// Helper: Validar limit
function validateLimit(limit: unknown): void {
  if (limit === undefined) return;

  if (typeof limit !== "number" || !Number.isInteger(limit)) {
    throw new ValidationError("Campo 'limit' deve ser um número inteiro", "limit", limit);
  }

  if (limit < 1) {
    throw new ValidationError("Campo 'limit' deve ser maior que 0", "limit", limit);
  }

  if (limit > 50) {
    throw new ValidationError("Campo 'limit' não pode exceder 50 (performance)", "limit", limit);
  }
}

export function validatePesquisaInput(data: Record<string, unknown>): PesquisaJurisInput {
  // Validar usando helpers
  validateTema(data.tema);
  validateTribunal(data.tribunal);
  validatePesquisaDateRange(data.dataInicio, data.dataFim);
  validateLimit(data.limit);

  // Extrair valores validados
  const tema = data.tema as string;
  const tribunal = data.tribunal as string | undefined;
  const dataInicio = data.dataInicio as string | undefined;
  const dataFim = data.dataFim as string | undefined;
  const limit = data.limit as number | undefined;

  // Validar relevanceThreshold (opcional)
  const relevanceThreshold = data.relevanceThreshold as number | undefined;
  if (relevanceThreshold !== undefined) {
    if (typeof relevanceThreshold !== "number") {
      throw new ValidationError(
        "Campo 'relevanceThreshold' deve ser um número",
        "relevanceThreshold",
        relevanceThreshold
      );
    }

    if (relevanceThreshold < 0 || relevanceThreshold > 1) {
      throw new ValidationError(
        "Campo 'relevanceThreshold' deve estar entre 0 e 1",
        "relevanceThreshold",
        relevanceThreshold
      );
    }
  }

  // Retornar inputs validados com defaults
  return {
    tema,
    tribunal: tribunal || "todos",
    dataInicio: dataInicio || getDefaultStartDate(),
    dataFim: dataFim || getCurrentDate(),
    limit: limit ? Math.min(limit, 50) : 10,
    relevanceThreshold: relevanceThreshold ?? 0.7,
  };
}

/**
 * Valida formato de data YYYY-MM-DD
 */
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Retorna data padrão de início (5 anos atrás)
 */
function getDefaultStartDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 5);
  return date.toISOString().split("T")[0];
}

/**
 * Retorna data atual no formato YYYY-MM-DD
 */
function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0];
}
