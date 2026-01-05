/**
 * Validação de inputs para o agente Harvey Specter (Estratégia Jurídica)
 * Baseado no padrão Google Agent Starter Pack
 */

export interface HarveyInput {
  task: string;
  processNumber?: string;
  context?: string;
  urgency?: "low" | "medium" | "high";
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

/**
 * Valida os inputs para análise estratégica do Harvey
 *
 * @param data - Dados recebidos do usuário
 * @returns Inputs validados e normalizados
 * @throws {ValidationError} Se validação falhar
 *
 * @example
 * ```typescript
 * const validated = validateHarveyInput({
 *   task: "Analisar estratégia para ação trabalhista",
 *   urgency: "high"
 * });
 * ```
 */
export function validateHarveyInput(data: Record<string, unknown>): HarveyInput {
  // Validar task (obrigatório)
  const task = data.task;

  if (!task) {
    throw new ValidationError("Campo 'task' é obrigatório para análise estratégica", "task", task);
  }

  if (typeof task !== "string") {
    throw new ValidationError("Campo 'task' deve ser uma string", "task", task);
  }

  if (task.length < 10) {
    throw new ValidationError(
      "Campo 'task' deve ter pelo menos 10 caracteres para análise adequada",
      "task",
      task
    );
  }

  if (task.length > 2000) {
    throw new ValidationError(
      "Campo 'task' não pode exceder 2000 caracteres (recebido: " + task.length + ")",
      "task",
      task
    );
  }

  // Validar processNumber (opcional)
  const processNumber = data.processNumber as string | undefined;
  if (processNumber && typeof processNumber !== "string") {
    throw new ValidationError(
      "Campo 'processNumber' deve ser uma string",
      "processNumber",
      processNumber
    );
  }

  // Validar context (opcional)
  const context = data.context as string | undefined;
  if (context && typeof context !== "string") {
    throw new ValidationError("Campo 'context' deve ser uma string", "context", context);
  }

  if (context && context.length > 5000) {
    throw new ValidationError(
      "Campo 'context' não pode exceder 5000 caracteres",
      "context",
      context
    );
  }

  // Validar urgency (opcional)
  const urgency = data.urgency as string | undefined;
  const validUrgencies = ["low", "medium", "high"];

  if (urgency && !validUrgencies.includes(urgency)) {
    throw new ValidationError(
      `Campo 'urgency' inválido: '${urgency}'. Valores aceitos: ${validUrgencies.join(", ")}`,
      "urgency",
      urgency
    );
  }

  return {
    task,
    processNumber,
    context,
    urgency: (urgency as "low" | "medium" | "high") || "medium",
  };
}
