/**
 * Validação de inputs para o agente Redação de Petições
 */

export interface RedacaoPeticoesInput {
  tipo: "petição inicial" | "contestação" | "réplica" | "apelação" | "agravo" | "embargos";
  detalhes: string;
  partes?: {
    autor?: string;
    reu?: string;
  };
  pedidos?: string[];
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

const TIPOS_PETICAO_VALIDOS = [
  "petição inicial",
  "contestação",
  "réplica",
  "apelação",
  "agravo",
  "embargos",
] as const;

export function validateRedacaoPeticoesInput(data: Record<string, unknown>): RedacaoPeticoesInput {
  const tipo = (data.tipo as string) || "petição inicial";
  if (!TIPOS_PETICAO_VALIDOS.includes(tipo as (typeof TIPOS_PETICAO_VALIDOS)[number])) {
    throw new ValidationError(
      `Campo 'tipo' deve ser: ${TIPOS_PETICAO_VALIDOS.join(", ")}`,
      "tipo",
      tipo
    );
  }

  const detalhes = data.detalhes as string | undefined;
  if (!detalhes) {
    throw new ValidationError("Campo 'detalhes' é obrigatório", "detalhes", detalhes);
  }

  if (typeof detalhes !== "string") {
    throw new ValidationError("Campo 'detalhes' deve ser uma string", "detalhes", detalhes);
  }

  if (detalhes.length < 20 || detalhes.length > 10000) {
    throw new ValidationError(
      "Campo 'detalhes' deve ter entre 20 e 10.000 caracteres",
      "detalhes",
      detalhes.length
    );
  }

  return {
    tipo: tipo as (typeof TIPOS_PETICAO_VALIDOS)[number],
    detalhes,
    partes: data.partes as RedacaoPeticoesInput["partes"],
    pedidos: data.pedidos as string[] | undefined,
  };
}
