/**
 * Agent Communication System
 *
 * Permite que agentes:
 * - troquem mensagens (request/response/notification/alert)
 * - peçam ajuda uns aos outros
 * - compartilhem contexto estruturado
 */

import type { Agent, AgentTask } from "./agents";

export type AgentMessageType = "request" | "response" | "notification" | "alert";
export type AgentMessagePriority = "low" | "medium" | "high" | "critical";

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId?: string; // undefined = broadcast
  type: AgentMessageType;
  priority: AgentMessagePriority;
  content: string;
  data?: Record<string, unknown>;
  timestamp: string;
  relatedTaskId?: string;
}

export interface SharedContext {
  id: string;
  type: string;
  data: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  accessibleBy: string[]; // IDs de agentes que podem acessar este contexto (ou '*')
}

class AgentCommunicationHub {
  private messages: AgentMessage[] = [];
  private readonly contexts: Map<string, SharedContext> = new Map();
  private readonly subscribers: Map<string, Set<(message: AgentMessage) => void>> = new Map();

  /**
   * Envia uma mensagem de um agente para outro (ou broadcast)
   */
  sendMessage(message: Omit<AgentMessage, "id" | "timestamp">): AgentMessage {
    const fullMessage: AgentMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    this.messages.push(fullMessage);

    // Mantém apenas as últimas 1000 mensagens
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-1000);
    }

    // Notifica inscritos
    if (message.toAgentId) {
      const subscribers = this.subscribers.get(message.toAgentId);
      subscribers?.forEach((callback) => callback(fullMessage));
    } else {
      // Broadcast para todos
      this.subscribers.forEach((subscribers) => {
        subscribers.forEach((callback) => callback(fullMessage));
      });
    }

    return fullMessage;
  }

  /**
   * Inscreve um agente para receber mensagens destinadas a ele
   * Retorna função de unsubscribe
   */
  subscribe(agentId: string, callback: (message: AgentMessage) => void): () => void {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, new Set());
    }

    this.subscribers.get(agentId)!.add(callback);

    // Função de cleanup
    return () => {
      const subscribers = this.subscribers.get(agentId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(agentId);
        }
      }
    };
  }

  /**
   * Retorna mensagens recentes relevantes para um agente:
   * - mensagens diretamente endereçadas a ele
   * - mensagens de broadcast
   */
  getMessages(agentId: string, limit: number = 50): AgentMessage[] {
    return this.messages.filter((m) => m.toAgentId === agentId || !m.toAgentId).slice(-limit);
  }

  /**
   * Cria ou atualiza um contexto compartilhado
   * - mesma combinação (type + createdBy) é considerada "o mesmo contexto"
   */
  setContext(context: Omit<SharedContext, "id" | "createdAt" | "updatedAt">): SharedContext {
    const existingContext = Array.from(this.contexts.values()).find(
      (c) => c.type === context.type && c.createdBy === context.createdBy
    );

    if (existingContext) {
      const updated: SharedContext = {
        ...existingContext,
        data: { ...existingContext.data, ...context.data },
        accessibleBy: context.accessibleBy ?? existingContext.accessibleBy,
        updatedAt: new Date().toISOString(),
      };
      this.contexts.set(updated.id, updated);
      return updated;
    }

    const now = new Date().toISOString();
    const newContext: SharedContext = {
      ...context,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    this.contexts.set(newContext.id, newContext);
    return newContext;
  }

  /**
   * Retorna contextos compartilhados acessíveis por um agente
   * - acessível se `accessibleBy` contém o agentId ou '*'
   * - opcionalmente filtra por tipo
   */
  getContext(agentId: string, type?: string): SharedContext[] {
    return Array.from(this.contexts.values())
      .filter((c) => c.accessibleBy.includes(agentId) || c.accessibleBy.includes("*"))
      .filter((c) => !type || c.type === type);
  }

  /**
   * Cria uma mensagem de "pedido de ajuda" entre agentes
   */
  requestHelp(fromAgent: Agent, toAgentId: string, task: AgentTask, reason: string): AgentMessage {
    return this.sendMessage({
      fromAgentId: fromAgent.id,
      toAgentId,
      type: "request",
      priority: task.priority as AgentMessagePriority,
      content: `Help requested: ${reason}`,
      data: {
        task,
        reason,
        requestType: "help",
      },
      relatedTaskId: task.id,
    });
  }

  /**
   * Broadcast de alerta para todos os agentes
   */
  broadcastAlert(
    fromAgentId: string,
    message: string,
    data?: Record<string, unknown>
  ): AgentMessage {
    return this.sendMessage({
      fromAgentId,
      type: "alert",
      priority: "high",
      content: message,
      data,
    });
  }

  /**
   * Limpa mensagens e contextos antigos
   */
  cleanup(olderThanHours: number = 24): void {
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;

    // Mensagens
    this.messages = this.messages.filter((m) => new Date(m.timestamp).getTime() > cutoffTime);

    // Contextos
    Array.from(this.contexts.entries()).forEach(([id, context]) => {
      if (new Date(context.updatedAt).getTime() < cutoffTime) {
        this.contexts.delete(id);
      }
    });
  }

  /**
   * Estatísticas simples de comunicação
   */
  getStats(): {
    totalMessages: number;
    messagesByType: Record<AgentMessageType, number>;
    activeContexts: number;
    subscribedAgents: number;
  } {
    const messagesByType = {
      request: 0,
      response: 0,
      notification: 0,
      alert: 0,
    } satisfies Record<AgentMessageType, number>;

    this.messages.forEach((m) => {
      messagesByType[m.type] = (messagesByType[m.type] || 0) + 1;
    });

    return {
      totalMessages: this.messages.length,
      messagesByType,
      activeContexts: this.contexts.size,
      subscribedAgents: this.subscribers.size,
    };
  }
}

/**
 * Instância global do hub de comunicação entre agentes
 */
export const communicationHub = new AgentCommunicationHub();

/**
 * Helper: notificar agentes (broadcast) com uma mensagem simples
 */
export function notifyAgents(
  fromAgentId: string,
  message: string,
  data?: Record<string, unknown>
): void {
  communicationHub.sendMessage({
    fromAgentId,
    type: "notification",
    priority: "medium",
    content: message,
    data,
  });
}

/**
 * Helper: compartilhar contexto entre agentes
 */
export function shareContext(
  agentId: string,
  type: string,
  data: Record<string, unknown>,
  accessibleBy: string[] = ["*"]
): SharedContext {
  return communicationHub.setContext({
    type,
    data,
    createdBy: agentId,
    accessibleBy,
  });
}
