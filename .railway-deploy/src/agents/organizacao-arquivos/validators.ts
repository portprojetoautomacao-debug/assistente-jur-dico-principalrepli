/**
 * Validação de inputs para o agente Organização de Arquivos
 */

export interface OrganizacaoArquivosInput {
  arquivos: Array<{ nome: string; tipo: string }>;
  processoId?: string;
  acao?: "categorizar" | "renomear" | "mover";
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

export function validateOrganizacaoArquivosInput(
  data: Record<string, unknown>
): OrganizacaoArquivosInput {
  const arquivos = data.arquivos;
  if (!Array.isArray(arquivos) || arquivos.length === 0) {
    throw new ValidationError("Campo 'arquivos' deve ser um array não-vazio", "arquivos", arquivos);
  }

  return {
    arquivos: arquivos as Array<{ nome: string; tipo: string }>,
    processoId: data.processoId as string | undefined,
    acao: (data.acao as "categorizar" | "renomear" | "mover") || "categorizar",
  };
}
