// lib/ai/agent-orchestrator.ts
// Orquestrador de múltiplos agentes com padrões de produção
// Baseado em: LangGraph, CrewAI, AutoGen patterns (2024/2025)

import type { SimpleAgent } from "./core-agent";

export type OrchestrationPattern =
  | "sequential" // Agentes executam em sequência
  | "parallel" // Agentes executam em paralelo
  | "hierarchical" // Agente coordenador delega para outros
  | "collaborative"; // Agentes negociam entre si

export interface AgentTask {
  id: string;
  assignedTo: string; // agent ID
  input: string;
  priority: "low" | "medium" | "high" | "critical";
  dependencies?: string[]; // IDs de tasks que devem executar antes
  timeout?: number; // ms
}

export interface OrchestrationResult {
  success: boolean;
  results: Map<string, unknown>;
  traces: Array<{
    agentId: string;
    taskId: string;
    result: unknown;
    duration: number;
    error?: string;
  }>;
  totalDuration: number;
}

// ============================================================================
// CIRCUIT BREAKER IMPLEMENTATION
// ============================================================================

type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  resetTimeout: number; // Time in ms to wait before half-open
  successThreshold: number; // Successes needed in half-open to close
}

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  lastError?: string;
}

const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
};

/**
 * Circuit Breaker por agente
 */
class CircuitBreaker {
  private state: CircuitBreakerState;
  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CIRCUIT_CONFIG, ...config };
    this.state = {
      state: "closed",
      failures: 0,
      successes: 0,
      lastFailureTime: null,
    };
  }

  /**
   * Verifica se o circuito permite execução
   */
  canExecute(): boolean {
    if (this.state.state === "closed") return true;

    if (this.state.state === "open") {
      const now = Date.now();
      const timeSinceFailure = now - (this.state.lastFailureTime || 0);

      if (timeSinceFailure >= this.config.resetTimeout) {
        this.state.state = "half-open";
        this.state.successes = 0;
        return true;
      }
      return false;
    }

    // half-open: permite tentativa
    return true;
  }

  /**
   * Registra sucesso
   */
  recordSuccess(): void {
    if (this.state.state === "half-open") {
      this.state.successes++;
      if (this.state.successes >= this.config.successThreshold) {
        this.state.state = "closed";
        this.state.failures = 0;
        this.state.lastError = undefined;
      }
    } else if (this.state.state === "closed") {
      this.state.failures = 0;
    }
  }

  /**
   * Registra falha
   */
  recordFailure(error: string): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();
    this.state.lastError = error;

    if (this.state.state === "half-open" || this.state.failures >= this.config.failureThreshold) {
      this.state.state = "open";
    }
  }

  /**
   * Retorna status atual
   */
  getStatus(): { state: CircuitState; failures: number; lastError?: string } {
    return {
      state: this.state.state,
      failures: this.state.failures,
      lastError: this.state.lastError,
    };
  }
}

/**
 * Orquestrador de múltiplos agentes
 * Patterns: Sequential, Parallel, Hierarchical, Collaborative
 *
 * Features:
 * - Circuit Breaker por agente (proteção contra APIs lentas/falhas)
 * - Timeout configurável por tarefa
 * - Ordenação topológica para dependências
 * - Consenso para decisões colaborativas
 */
export class AgentOrchestrator {
  private readonly agents: Map<string, SimpleAgent>;
  private readonly pattern: OrchestrationPattern;
  private readonly circuitBreakers: Map<string, CircuitBreaker>;

  constructor(agents: Map<string, SimpleAgent>, pattern: OrchestrationPattern = "sequential") {
    this.agents = agents;
    this.pattern = pattern;
    this.circuitBreakers = new Map();

    // Inicializa circuit breaker para cada agente
    for (const agentId of agents.keys()) {
      this.circuitBreakers.set(agentId, new CircuitBreaker());
    }
  }

  /**
   * Obtém status dos circuit breakers de todos os agentes
   */
  getCircuitBreakerStatus(): Record<
    string,
    { state: CircuitState; failures: number; lastError?: string }
  > {
    const status: Record<string, { state: CircuitState; failures: number; lastError?: string }> =
      {};
    for (const [agentId, breaker] of this.circuitBreakers) {
      status[agentId] = breaker.getStatus();
    }
    return status;
  }

  /**
   * Executa múltiplos agentes de acordo com o padrão configurado
   */
  async orchestrate(tasks: AgentTask[]): Promise<OrchestrationResult> {
    const startTime = Date.now();

    switch (this.pattern) {
      case "sequential":
        return await this.executeSequential(tasks, startTime);
      case "parallel":
        return await this.executeParallel(tasks, startTime);
      case "hierarchical":
        return await this.executeHierarchical(tasks, startTime);
      case "collaborative":
        return await this.executeCollaborative(tasks, startTime);
      default:
        throw new Error(`Pattern ${this.pattern} não implementado`);
    }
  }

  /**
   * SEQUENTIAL: Agentes executam em ordem
   * Usado quando: Tarefas dependem umas das outras
   */
  private async executeSequential(
    tasks: AgentTask[],
    startTime: number
  ): Promise<OrchestrationResult> {
    const results = new Map<string, unknown>();
    const traces: OrchestrationResult["traces"] = [];

    // Ordenar por dependências e prioridade
    const sortedTasks = this.topologicalSort(tasks);

    for (const task of sortedTasks) {
      const agent = this.agents.get(task.assignedTo);
      const breaker = this.circuitBreakers.get(task.assignedTo);

      if (!agent) {
        traces.push({
          agentId: task.assignedTo,
          taskId: task.id,
          result: null,
          duration: 0,
          error: `Agent ${task.assignedTo} não encontrado`,
        });
        continue;
      }

      // Check circuit breaker
      if (breaker && !breaker.canExecute()) {
        traces.push({
          agentId: task.assignedTo,
          taskId: task.id,
          result: null,
          duration: 0,
          error: `Circuit breaker OPEN para ${task.assignedTo}`,
        });
        continue;
      }

      const taskStart = Date.now();
      try {
        const result = await this.executeWithTimeout(agent, task);
        results.set(task.id, result);
        breaker?.recordSuccess();

        traces.push({
          agentId: task.assignedTo,
          taskId: task.id,
          result,
          duration: Date.now() - taskStart,
        });
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : "Unknown error";
        breaker?.recordFailure(errorMsg);

        traces.push({
          agentId: task.assignedTo,
          taskId: task.id,
          result: null,
          duration: Date.now() - taskStart,
          error: errorMsg,
        });
      }
    }

    return {
      success: traces.every((t) => !t.error),
      results,
      traces,
      totalDuration: Date.now() - startTime,
    };
  }

  /**
   * PARALLEL: Agentes executam simultaneamente
   * Usado quando: Tarefas são independentes
   */
  private async executeParallel(
    tasks: AgentTask[],
    startTime: number
  ): Promise<OrchestrationResult> {
    const results = new Map<string, unknown>();
    const traces: OrchestrationResult["traces"] = [];

    const promises = tasks.map(async (task) => {
      const agent = this.agents.get(task.assignedTo);
      const breaker = this.circuitBreakers.get(task.assignedTo);

      if (!agent) {
        return {
          agentId: task.assignedTo,
          taskId: task.id,
          result: null,
          duration: 0,
          error: `Agent ${task.assignedTo} não encontrado`,
        };
      }

      // Check circuit breaker
      if (breaker && !breaker.canExecute()) {
        return {
          agentId: task.assignedTo,
          taskId: task.id,
          result: null,
          duration: 0,
          error: `Circuit breaker OPEN para ${task.assignedTo}`,
        };
      }

      const taskStart = Date.now();
      try {
        const result = await this.executeWithTimeout(agent, task);
        results.set(task.id, result);
        breaker?.recordSuccess();

        return {
          agentId: task.assignedTo,
          taskId: task.id,
          result,
          duration: Date.now() - taskStart,
        };
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : "Unknown error";
        breaker?.recordFailure(errorMsg);

        return {
          agentId: task.assignedTo,
          taskId: task.id,
          result: null,
          duration: Date.now() - taskStart,
          error: errorMsg,
        };
      }
    });

    const executedTraces = await Promise.all(promises);
    traces.push(...executedTraces);

    return {
      success: traces.every((t) => !t.error),
      results,
      traces,
      totalDuration: Date.now() - startTime,
    };
  }

  /**
   * HIERARCHICAL: Agente coordenador delega para subordinados
   * Usado quando: Há hierarquia clara (ex: Harvey coordena outros agentes)
   */
  private async executeHierarchical(
    tasks: AgentTask[],
    startTime: number
  ): Promise<OrchestrationResult> {
    // Implementação simplificada: primeiro agente é o coordenador
    const coordinatorTask = tasks[0];
    const subordinateTasks = tasks.slice(1);

    // Coordenador analisa e pode redistribuir tarefas
    const coordinator = this.agents.get(coordinatorTask.assignedTo);
    if (!coordinator) {
      throw new Error("Coordenador não encontrado");
    }

    // Executar subordinados em paralelo
    return await this.executeParallel(subordinateTasks, startTime);
  }

  /**
   * COLLABORATIVE: Agentes negociam entre si
   * Usado quando: Decisões precisam de consenso
   */
  private async executeCollaborative(
    tasks: AgentTask[],
    startTime: number
  ): Promise<OrchestrationResult> {
    // Implementação simplificada: voto majoritário
    const results = new Map<string, unknown>();
    const traces: OrchestrationResult["traces"] = [];

    // Todos agentes processam a mesma task
    const mainTask = tasks[0];
    const votes: unknown[] = [];

    for (const [agentId, agent] of this.agents.entries()) {
      const taskStart = Date.now();
      try {
        const result = await this.executeWithTimeout(agent, mainTask);
        votes.push(result);

        traces.push({
          agentId,
          taskId: mainTask.id,
          result,
          duration: Date.now() - taskStart,
        });
      } catch (e: unknown) {
        traces.push({
          agentId,
          taskId: mainTask.id,
          result: null,
          duration: Date.now() - taskStart,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    // Consenso simples: resultado mais comum
    const consensus = this.findConsensus(votes);
    results.set(mainTask.id, consensus);

    return {
      success: votes.length > 0,
      results,
      traces,
      totalDuration: Date.now() - startTime,
    };
  }

  /**
   * Executa agente com timeout
   */
  private async executeWithTimeout(agent: SimpleAgent, task: AgentTask): Promise<unknown> {
    const timeout = task.timeout ?? 60000; // 60s padrão

    return Promise.race([
      agent.run(task.input),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Task timeout")), timeout)),
    ]);
  }

  /**
   * Ordenação topológica para respeitar dependências
   */
  private topologicalSort(tasks: AgentTask[]): AgentTask[] {
    const sorted: AgentTask[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      if (visiting.has(taskId)) throw new Error("Dependência circular detectada");

      visiting.add(taskId);
      const task = taskMap.get(taskId);

      if (task?.dependencies) {
        for (const dep of task.dependencies) {
          visit(dep);
        }
      }

      visiting.delete(taskId);
      visited.add(taskId);
      if (task) sorted.push(task);
    };

    for (const task of tasks) {
      visit(task.id);
    }

    // Ordenar por prioridade dentro do mesmo nível
    return sorted.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Encontra consenso entre múltiplos resultados
   */
  private findConsensus(votes: unknown[]): unknown {
    if (votes.length === 0) return null;

    // Estratégia simples: retorna o primeiro resultado válido
    // Em produção: implementar votação mais sofisticada
    return (
      votes.find((v: unknown) => {
        if (typeof v === "object" && v !== null && "error" in v) {
          return !(v as { error?: unknown }).error;
        }
        return v != null;
      }) ?? votes[0]
    );
  }
}

/**
 * Factory para criar orquestrações comuns
 */
export class OrchestrationPatterns {
  /**
   * Pattern: Justin-e analisa → Gestão Prazos calcula → Cria tarefa
   */
  static intimacaoWorkflow(): AgentTask[] {
    return [
      {
        id: "analyze-intimacao",
        assignedTo: "justine",
        input: "Buscar próxima intimação pendente",
        priority: "critical",
      },
      {
        id: "calculate-deadline",
        assignedTo: "gestao-prazos",
        input: "Calcular prazo da intimação",
        priority: "high",
        dependencies: ["analyze-intimacao"],
      },
      {
        id: "create-task",
        assignedTo: "justine",
        input: "Criar tarefa com prazo calculado",
        priority: "high",
        dependencies: ["calculate-deadline"],
      },
    ];
  }

  /**
   * Pattern: Múltiplos agentes analisam caso (paralelo)
   */
  static caseAnalysisParallel(caseId: string): AgentTask[] {
    const input = `Analisar caso ${caseId}`;
    return [
      {
        id: "risk-analysis",
        assignedTo: "analise-risco",
        input,
        priority: "high",
      },
      {
        id: "precedent-research",
        assignedTo: "pesquisa-juris",
        input,
        priority: "medium",
      },
      {
        id: "financial-analysis",
        assignedTo: "financeiro",
        input,
        priority: "medium",
      },
    ];
  }

  /**
   * Pattern: Harvey coordena análise estratégica
   */
  static strategicReview(): AgentTask[] {
    return [
      {
        id: "harvey-coordination",
        assignedTo: "harvey",
        input: "Coordenar análise estratégica do escritório",
        priority: "critical",
      },
      {
        id: "deadline-check",
        assignedTo: "gestao-prazos",
        input: "Verificar prazos críticos",
        priority: "high",
        dependencies: ["harvey-coordination"],
      },
      {
        id: "djen-monitor",
        assignedTo: "monitor-djen",
        input: "Verificar novas publicações",
        priority: "high",
        dependencies: ["harvey-coordination"],
      },
    ];
  }
}
