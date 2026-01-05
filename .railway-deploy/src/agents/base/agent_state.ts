/**
 * Agent State Management
 *
 * This module defines the base state interface for LangGraph agents.
 * It provides type-safe state management for autonomous agents.
 *
 * Security Notes:
 * - No eval() or unsafe code execution
 * - Immutable state updates via spread operators
 * - Type-safe state transitions
 */

export interface AgentMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface AgentState {
  messages: AgentMessage[];
  currentStep: string;
  data: Record<string, unknown>;
  error?: string;
  completed: boolean;
  retryCount: number;
  maxRetries: number;
  startedAt: number;
  lastUpdatedAt: number;
}

export const createInitialState = (data: Record<string, unknown> = {}): AgentState => ({
  messages: [],
  currentStep: "init",
  data,
  completed: false,
  retryCount: 0,
  maxRetries: 3,
  startedAt: Date.now(),
  lastUpdatedAt: Date.now(),
});

export const updateState = (state: AgentState, updates: Partial<AgentState>): AgentState => ({
  ...state,
  ...updates,
  lastUpdatedAt: Date.now(),
});

export const addMessage = (
  state: AgentState,
  message: Omit<AgentMessage, "timestamp">
): AgentState => ({
  ...state,
  messages: [
    ...state.messages,
    {
      ...message,
      timestamp: Date.now(),
    },
  ],
  lastUpdatedAt: Date.now(),
});
