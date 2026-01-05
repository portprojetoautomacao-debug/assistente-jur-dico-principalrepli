/**
 * Validação de inputs para o agente Monitor DJEN
 * Baseado no padrão Google Agent Starter Pack
 */

export interface MonitorDJENInput {
  lawyerOAB?: string;
  courts?: string[];
  startDate?: string;
  endDate?: string;
  autoRegister?: boolean;
}

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

const VALID_COURTS = [
  "STF",
  "STJ",
  "TST",
  "TSE",
  "STM",
  "TRF1",
  "TRF2",
  "TRF3",
  "TRF4",
  "TRF5",
] as const;

/**
 * Valida os inputs para monitoramento do DJEN
 *
 * @param data - Dados recebidos do usuário
 * @returns Inputs validados e normalizados
 * @throws {ValidationError} Se validação falhar
 *
 * @example
 * ```typescript
 * const validated = validateMonitorDJENInput({
 *   lawyerOAB: "MG 184404",
 *   courts: ["STF", "STJ"]
 * });
 * ```
 */
// Helper: Validar OAB
function validateLawyerOAB(lawyerOAB: unknown): void {
  if (!lawyerOAB) return;

  if (typeof lawyerOAB !== "string") {
    throw new ValidationError("Campo 'lawyerOAB' deve ser uma string", "lawyerOAB", lawyerOAB);
  }

  const oabPattern = /^[A-Z]{2}\s+\d{3,7}$/;
  if (!oabPattern.test(lawyerOAB)) {
    throw new ValidationError(
      "Campo 'lawyerOAB' deve estar no formato 'UF NUMERO' (ex: 'MG 184404')",
      "lawyerOAB",
      lawyerOAB
    );
  }
}

// Helper: Validar tribunais
function validateCourts(courts: unknown): void {
  if (!courts) return;

  if (!Array.isArray(courts)) {
    throw new ValidationError("Campo 'courts' deve ser um array", "courts", courts);
  }

  if (courts.length === 0) {
    throw new ValidationError("Campo 'courts' não pode ser um array vazio", "courts", courts);
  }

  const invalidCourts = courts.filter(
    (c) => !VALID_COURTS.includes(c as (typeof VALID_COURTS)[number])
  );
  if (invalidCourts.length > 0) {
    throw new ValidationError(
      `Tribunais inválidos: ${invalidCourts.join(", ")}. Valores aceitos: ${VALID_COURTS.join(", ")}`,
      "courts",
      invalidCourts
    );
  }
}

// Helper: Validar intervalo de datas
function validateDateRange(startDate: string | undefined, endDate: string | undefined): void {
  if (startDate && !isValidDate(startDate)) {
    throw new ValidationError(
      `Data inválida: '${startDate}'. Use formato YYYY-MM-DD`,
      "startDate",
      startDate
    );
  }

  if (endDate && !isValidDate(endDate)) {
    throw new ValidationError(
      `Data inválida: '${endDate}'. Use formato YYYY-MM-DD`,
      "endDate",
      endDate
    );
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    throw new ValidationError(
      `startDate (${startDate}) não pode ser posterior a endDate (${endDate})`,
      "startDate",
      { startDate, endDate }
    );
  }
}

export function validateMonitorDJENInput(data: Record<string, unknown>): MonitorDJENInput {
  // Validar campos usando helpers
  validateLawyerOAB(data.lawyerOAB);
  validateCourts(data.courts);
  validateDateRange(data.startDate as string | undefined, data.endDate as string | undefined);

  // Extrair valores validados
  const lawyerOAB = data.lawyerOAB as string | undefined;
  const courts = data.courts as string[] | undefined;
  const startDate = data.startDate as string | undefined;
  const endDate = data.endDate as string | undefined;

  // Validar autoRegister (opcional)
  const autoRegister = data.autoRegister;
  if (autoRegister !== undefined && typeof autoRegister !== "boolean") {
    throw new ValidationError(
      "Campo 'autoRegister' deve ser um boolean",
      "autoRegister",
      autoRegister
    );
  }

  return {
    lawyerOAB,
    courts,
    startDate,
    endDate,
    autoRegister: autoRegister === true,
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
