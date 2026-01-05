/**
 * Validação de inputs para o agente Mrs. Justine
 * Baseado no padrão Google Agent Starter Pack
 */

export interface JustineInput {
  task: string;
  publications?: Array<{
    id: string;
    court: string;
    date: string;
    content: string;
    processNumber?: string;
  }>;
  priority?: "low" | "medium" | "high" | "critical";
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

const VALID_PRIORITIES = ["low", "medium", "high", "critical"] as const;

/**
 * Valida os inputs para análise de intimações
 *
 * @param data - Dados recebidos do usuário
 * @returns Inputs validados e normalizados
 * @throws {ValidationError} Se validação falhar
 */
export function validateJustineInput(data: Record<string, unknown>): JustineInput {
  // Validar task (obrigatório)
  const task = data.task as string | undefined;
  if (!task) {
    throw new ValidationError("Campo 'task' é obrigatório", "task", task);
  }

  if (typeof task !== "string") {
    throw new ValidationError("Campo 'task' deve ser uma string", "task", task);
  }

  if (task.length < 10 || task.length > 5000) {
    throw new ValidationError("Campo 'task' deve ter entre 10 e 5000 caracteres", "task", task);
  }

  // Validar publications (opcional)
  const publications = data.publications;
  if (publications !== undefined && !Array.isArray(publications)) {
    throw new ValidationError(
      "Campo 'publications' deve ser um array",
      "publications",
      publications
    );
  }

  // Validar priority (opcional)
  const priority = data.priority as string | undefined;
  if (priority && !VALID_PRIORITIES.includes(priority as (typeof VALID_PRIORITIES)[number])) {
    throw new ValidationError(
      `Campo 'priority' deve ser um dos seguintes: ${VALID_PRIORITIES.join(", ")}`,
      "priority",
      priority
    );
  }

  return {
    task,
    publications: publications as JustineInput["publications"],
    priority: priority as (typeof VALID_PRIORITIES)[number] | undefined,
  };
}
