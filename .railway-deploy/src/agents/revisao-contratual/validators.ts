/**
 * Validação de inputs para o agente Revisão Contratual
 */

export interface RevisaoContratualInput {
  contratoTexto: string;
  tipoContrato:
    | "prestação de serviços"
    | "compra e venda"
    | "locação"
    | "trabalho"
    | "sociedade"
    | "outro";
  partes?: string[];
  analisarRiscos?: boolean;
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

const TIPOS_CONTRATO_VALIDOS = [
  "prestação de serviços",
  "compra e venda",
  "locação",
  "trabalho",
  "sociedade",
  "outro",
] as const;

export function validateRevisaoContratualInput(
  data: Record<string, unknown>
): RevisaoContratualInput {
  const contratoTexto = data.contratoTexto as string | undefined;
  if (!contratoTexto) {
    throw new ValidationError(
      "Campo 'contratoTexto' é obrigatório",
      "contratoTexto",
      contratoTexto
    );
  }

  if (typeof contratoTexto !== "string") {
    throw new ValidationError(
      "Campo 'contratoTexto' deve ser uma string",
      "contratoTexto",
      contratoTexto
    );
  }

  if (contratoTexto.length < 100 || contratoTexto.length > 50000) {
    throw new ValidationError(
      "Campo 'contratoTexto' deve ter entre 100 e 50.000 caracteres",
      "contratoTexto",
      contratoTexto.length
    );
  }

  const tipoContrato = (data.tipoContrato as string) || "prestação de serviços";
  if (!TIPOS_CONTRATO_VALIDOS.includes(tipoContrato as (typeof TIPOS_CONTRATO_VALIDOS)[number])) {
    throw new ValidationError(
      `Campo 'tipoContrato' deve ser: ${TIPOS_CONTRATO_VALIDOS.join(", ")}`,
      "tipoContrato",
      tipoContrato
    );
  }

  return {
    contratoTexto,
    tipoContrato: tipoContrato as (typeof TIPOS_CONTRATO_VALIDOS)[number],
    partes: data.partes as string[] | undefined,
    analisarRiscos: data.analisarRiscos === true,
  };
}
