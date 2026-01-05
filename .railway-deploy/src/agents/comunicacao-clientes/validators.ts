/**
 * Validação de inputs para o agente Comunicação com Clientes
 */

export interface ComunicacaoClientesInput {
  tipoMensagem: "atualizacao" | "intimacao" | "resultado" | "agendamento" | "cobranca";
  nomeCliente: string;
  processoNumero?: string;
  andamento?: string;
  proximosPassos?: string[];
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

const TIPOS_MENSAGEM = [
  "atualizacao",
  "intimacao",
  "resultado",
  "agendamento",
  "cobranca",
] as const;

export function validateComunicacaoClientesInput(
  data: Record<string, unknown>
): ComunicacaoClientesInput {
  const tipoMensagem = (data.tipoMensagem as string) || "atualizacao";
  if (!TIPOS_MENSAGEM.includes(tipoMensagem as (typeof TIPOS_MENSAGEM)[number])) {
    throw new ValidationError(
      `Campo 'tipoMensagem' deve ser: ${TIPOS_MENSAGEM.join(", ")}`,
      "tipoMensagem",
      tipoMensagem
    );
  }

  const nomeCliente = data.nomeCliente as string | undefined;
  if (!nomeCliente || typeof nomeCliente !== "string" || nomeCliente.length < 2) {
    throw new ValidationError(
      "Campo 'nomeCliente' é obrigatório (mínimo 2 caracteres)",
      "nomeCliente",
      nomeCliente
    );
  }

  return {
    tipoMensagem: tipoMensagem as (typeof TIPOS_MENSAGEM)[number],
    nomeCliente,
    processoNumero: data.processoNumero as string | undefined,
    andamento: data.andamento as string | undefined,
    proximosPassos: data.proximosPassos as string[] | undefined,
  };
}
