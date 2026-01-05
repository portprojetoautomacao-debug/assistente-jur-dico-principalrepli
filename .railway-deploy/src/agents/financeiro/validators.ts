/**
 * Validação de inputs para o agente Financeiro
 */

export interface FinanceiroInput {
  periodo: "mes-atual" | "trimestre" | "semestre" | "ano";
  honorariosRecebidos?: number[];
  despesas?: number[];
  inadimplentes?: number;
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

const PERIODOS = ["mes-atual", "trimestre", "semestre", "ano"] as const;

export function validateFinanceiroInput(data: Record<string, unknown>): FinanceiroInput {
  const periodo = (data.periodo as string) || "mes-atual";
  if (!PERIODOS.includes(periodo as (typeof PERIODOS)[number])) {
    throw new ValidationError(
      `Campo 'periodo' deve ser: ${PERIODOS.join(", ")}`,
      "periodo",
      periodo
    );
  }

  return {
    periodo: periodo as (typeof PERIODOS)[number],
    honorariosRecebidos: data.honorariosRecebidos as number[] | undefined,
    despesas: data.despesas as number[] | undefined,
    inadimplentes: data.inadimplentes as number | undefined,
  };
}
