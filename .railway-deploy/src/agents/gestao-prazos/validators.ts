/**
 * Validação de inputs para o agente Gestão de Prazos
 * Baseado no padrão Google Agent Starter Pack
 */

export interface GestaoPrazosInput {
  processNumber?: string;
  tipoProcesso: "cível" | "trabalhista" | "penal" | "tributário";
  dataPublicacao: string;
  prazoEmDias: number;
  considerarFeriados?: boolean;
  considerarRecessoForense?: boolean;
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

const TIPOS_PROCESSO_VALIDOS = ["cível", "trabalhista", "penal", "tributário"] as const;

/**
 * Valida os inputs para cálculo de prazos processuais
 *
 * @param data - Dados recebidos do usuário
 * @returns Inputs validados e normalizados
 * @throws {ValidationError} Se validação falhar
 *
 * @example
 * ```typescript
 * const validated = validateGestaoPrazosInput({
 *   tipoProcesso: "cível",
 *   dataPublicacao: "2024-01-15",
 *   prazoEmDias: 15
 * });
 * ```
 */
export function validateGestaoPrazosInput(data: Record<string, unknown>): GestaoPrazosInput {
  // Validar processNumber (opcional)
  const processNumber = data.processNumber as string | undefined;
  if (processNumber && typeof processNumber !== "string") {
    throw new ValidationError(
      "Campo 'processNumber' deve ser uma string",
      "processNumber",
      processNumber
    );
  }

  // Validar tipoProcesso (obrigatório)
  const tipoProcesso = data.tipoProcesso as string | undefined;
  if (!tipoProcesso) {
    throw new ValidationError("Campo 'tipoProcesso' é obrigatório", "tipoProcesso", tipoProcesso);
  }

  if (!TIPOS_PROCESSO_VALIDOS.includes(tipoProcesso as (typeof TIPOS_PROCESSO_VALIDOS)[number])) {
    throw new ValidationError(
      `Campo 'tipoProcesso' deve ser um dos seguintes: ${TIPOS_PROCESSO_VALIDOS.join(", ")}`,
      "tipoProcesso",
      tipoProcesso
    );
  }

  // Validar dataPublicacao (obrigatório)
  const dataPublicacao = data.dataPublicacao as string | undefined;
  if (!dataPublicacao) {
    throw new ValidationError(
      "Campo 'dataPublicacao' é obrigatório",
      "dataPublicacao",
      dataPublicacao
    );
  }

  if (!isValidDate(dataPublicacao)) {
    throw new ValidationError(
      `Data de publicação inválida: '${dataPublicacao}'. Use formato YYYY-MM-DD`,
      "dataPublicacao",
      dataPublicacao
    );
  }

  // Data não pode ser futura
  const pubDate = new Date(dataPublicacao);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (pubDate > today) {
    throw new ValidationError(
      `Data de publicação não pode ser futura: '${dataPublicacao}'`,
      "dataPublicacao",
      dataPublicacao
    );
  }

  // Validar prazoEmDias (obrigatório)
  const prazoEmDias = data.prazoEmDias as number | undefined;
  if (!prazoEmDias) {
    throw new ValidationError("Campo 'prazoEmDias' é obrigatório", "prazoEmDias", prazoEmDias);
  }

  if (typeof prazoEmDias !== "number" || isNaN(prazoEmDias)) {
    throw new ValidationError("Campo 'prazoEmDias' deve ser um número", "prazoEmDias", prazoEmDias);
  }

  if (prazoEmDias < 1 || prazoEmDias > 365) {
    throw new ValidationError(
      "Campo 'prazoEmDias' deve estar entre 1 e 365",
      "prazoEmDias",
      prazoEmDias
    );
  }

  // Validar considerarFeriados (opcional)
  const considerarFeriados = data.considerarFeriados;
  if (considerarFeriados !== undefined && typeof considerarFeriados !== "boolean") {
    throw new ValidationError(
      "Campo 'considerarFeriados' deve ser um boolean",
      "considerarFeriados",
      considerarFeriados
    );
  }

  // Validar considerarRecessoForense (opcional)
  const considerarRecessoForense = data.considerarRecessoForense;
  if (considerarRecessoForense !== undefined && typeof considerarRecessoForense !== "boolean") {
    throw new ValidationError(
      "Campo 'considerarRecessoForense' deve ser um boolean",
      "considerarRecessoForense",
      considerarRecessoForense
    );
  }

  return {
    processNumber,
    tipoProcesso: tipoProcesso as (typeof TIPOS_PROCESSO_VALIDOS)[number],
    dataPublicacao,
    prazoEmDias: Number(prazoEmDias),
    considerarFeriados: considerarFeriados === true,
    considerarRecessoForense: considerarRecessoForense === true,
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
