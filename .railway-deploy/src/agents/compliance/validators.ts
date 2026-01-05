/**
 * Validação de inputs para o agente Compliance
 */

export interface ComplianceInput {
  tipoVerificacao: "lgpd" | "lavagem" | "etica" | "tributario" | "trabalhista";
  documentoTexto: string;
  dadosPessoais?: string[];
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

const TIPOS_VERIFICACAO = ["lgpd", "lavagem", "etica", "tributario", "trabalhista"] as const;

export function validateComplianceInput(data: Record<string, unknown>): ComplianceInput {
  const tipoVerificacao = (data.tipoVerificacao as string) || "lgpd";
  if (!TIPOS_VERIFICACAO.includes(tipoVerificacao as (typeof TIPOS_VERIFICACAO)[number])) {
    throw new ValidationError(
      `Campo 'tipoVerificacao' deve ser: ${TIPOS_VERIFICACAO.join(", ")}`,
      "tipoVerificacao",
      tipoVerificacao
    );
  }

  const documentoTexto = data.documentoTexto as string | undefined;
  if (!documentoTexto || typeof documentoTexto !== "string" || documentoTexto.length < 20) {
    throw new ValidationError(
      "Campo 'documentoTexto' é obrigatório (mínimo 20 caracteres)",
      "documentoTexto",
      documentoTexto
    );
  }

  return {
    tipoVerificacao: tipoVerificacao as (typeof TIPOS_VERIFICACAO)[number],
    documentoTexto,
    dadosPessoais: data.dadosPessoais as string[] | undefined,
  };
}
