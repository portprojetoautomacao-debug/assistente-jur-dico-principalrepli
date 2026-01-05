/**
 * Validação de inputs para o agente Análise de Risco
 */

export interface AnaliseRiscoInput {
  tipoCaso: "trabalhista" | "cível" | "tributário" | "penal" | "consumidor";
  valorCausa: number;
  complexidade: "baixa" | "média" | "alta";
  precedentes?: string[];
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
const COMPLEXIDADES = ["baixa", "média", "alta"] as const;

export function validateAnaliseRiscoInput(data: Record<string, unknown>): AnaliseRiscoInput {
  const tipoCaso = (data.tipoCaso as string) || "trabalhista";
  if (!TIPOS_CASO.includes(tipoCaso as (typeof TIPOS_CASO)[number])) {
    throw new ValidationError(
      `Campo 'tipoCaso' deve ser: ${TIPOS_CASO.join(", ")}`,
      "tipoCaso",
      tipoCaso
    );
  }

  const valorCausa = data.valorCausa as number | undefined;
  if (valorCausa === undefined || typeof valorCausa !== "number" || valorCausa < 0) {
    throw new ValidationError(
      "Campo 'valorCausa' deve ser um número >= 0",
      "valorCausa",
      valorCausa
    );
  }

  const complexidade = (data.complexidade as string) || "média";
  if (!COMPLEXIDADES.includes(complexidade as (typeof COMPLEXIDADES)[number])) {
    throw new ValidationError(
      `Campo 'complexidade' deve ser: ${COMPLEXIDADES.join(", ")}`,
      "complexidade",
      complexidade
    );
  }

  return {
    tipoCaso: tipoCaso as (typeof TIPOS_CASO)[number],
    valorCausa,
    complexidade: complexidade as (typeof COMPLEXIDADES)[number],
    precedentes: data.precedentes as string[] | undefined,
  };
}
