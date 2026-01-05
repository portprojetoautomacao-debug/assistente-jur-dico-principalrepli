/**
 * Validação de inputs para o agente Análise Documental
 */

export interface AnaliseDocumentalInput {
  documentoTexto: string;
  tipoDocumento: "contrato" | "petição" | "sentença" | "decisão" | "procuração" | "genérico";
  extrairEntidades?: boolean;
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

const TIPOS_DOCUMENTO_VALIDOS = [
  "contrato",
  "petição",
  "sentença",
  "decisão",
  "procuração",
  "genérico",
] as const;

export function validateAnaliseDocumentalInput(
  data: Record<string, unknown>
): AnaliseDocumentalInput {
  const documentoTexto = data.documentoTexto as string | undefined;
  if (!documentoTexto) {
    throw new ValidationError(
      "Campo 'documentoTexto' é obrigatório",
      "documentoTexto",
      documentoTexto
    );
  }

  if (typeof documentoTexto !== "string") {
    throw new ValidationError(
      "Campo 'documentoTexto' deve ser uma string",
      "documentoTexto",
      documentoTexto
    );
  }

  if (documentoTexto.length < 50 || documentoTexto.length > 100000) {
    throw new ValidationError(
      "Campo 'documentoTexto' deve ter entre 50 e 100.000 caracteres",
      "documentoTexto",
      documentoTexto.length
    );
  }

  const tipoDocumento = (data.tipoDocumento as string) || "genérico";
  if (
    !TIPOS_DOCUMENTO_VALIDOS.includes(tipoDocumento as (typeof TIPOS_DOCUMENTO_VALIDOS)[number])
  ) {
    throw new ValidationError(
      `Campo 'tipoDocumento' deve ser: ${TIPOS_DOCUMENTO_VALIDOS.join(", ")}`,
      "tipoDocumento",
      tipoDocumento
    );
  }

  return {
    documentoTexto,
    tipoDocumento: tipoDocumento as (typeof TIPOS_DOCUMENTO_VALIDOS)[number],
    extrairEntidades: data.extrairEntidades === true,
    analisarRiscos: data.analisarRiscos === true,
  };
}
