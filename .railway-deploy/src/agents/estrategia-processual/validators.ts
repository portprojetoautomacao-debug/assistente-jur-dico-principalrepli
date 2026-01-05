/**
 * Validação de inputs para o agente Estratégia Processual
 */

export interface EstrategiaProcessualInput {
  tipoCaso: "trabalhista" | "cível" | "tributário" | "penal" | "consumidor";
  faseProcessual: "inicial" | "instrução" | "recursal" | "execução";
  objetivoCliente: string;
  riskScore?: number;
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

const TIPOS_CASO = ["trabalhista", "cível", "tributário", "penal", "consumidor"] as const;
const FASES = ["inicial", "instrução", "recursal", "execução"] as const;

export function validateEstrategiaProcessualInput(
  data: Record<string, unknown>
): EstrategiaProcessualInput {
  const tipoCaso = (data.tipoCaso as string) || "trabalhista";
  if (!TIPOS_CASO.includes(tipoCaso as (typeof TIPOS_CASO)[number])) {
    throw new ValidationError(
      `Campo 'tipoCaso' deve ser: ${TIPOS_CASO.join(", ")}`,
      "tipoCaso",
      tipoCaso
    );
  }

  const faseProcessual = (data.faseProcessual as string) || "inicial";
  if (!FASES.includes(faseProcessual as (typeof FASES)[number])) {
    throw new ValidationError(
      `Campo 'faseProcessual' deve ser: ${FASES.join(", ")}`,
      "faseProcessual",
      faseProcessual
    );
  }

  const objetivoCliente = data.objetivoCliente as string | undefined;
  if (!objetivoCliente || typeof objetivoCliente !== "string" || objetivoCliente.length < 5) {
    throw new ValidationError(
      "Campo 'objetivoCliente' é obrigatório (mínimo 5 caracteres)",
      "objetivoCliente",
      objetivoCliente
    );
  }

  return {
    tipoCaso: tipoCaso as (typeof TIPOS_CASO)[number],
    faseProcessual: faseProcessual as (typeof FASES)[number],
    objetivoCliente,
    riskScore: data.riskScore as number | undefined,
  };
}
