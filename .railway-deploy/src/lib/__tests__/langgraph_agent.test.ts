import { describe, it, expect, vi as _vi } from "vitest";
import { LangGraphAgent, DEFAULT_CONFIG } from "@/agents/base/langgraph_agent";
import type { AgentState } from "@/agents/base/agent_state";

class SucceedAfterAttemptsAgent extends LangGraphAgent {
  private failsBeforeSuccess: number;
  private attempts = 0;
  constructor(failsBeforeSuccess: number, config?: Partial<typeof DEFAULT_CONFIG>) {
    super({ timeoutMs: 200, maxRetries: 3, retryDelayMs: 10, ...config });
    this.failsBeforeSuccess = failsBeforeSuccess;
  }
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    this.attempts++;
    if (this.attempts <= this.failsBeforeSuccess) {
      throw new Error("transient error");
    }
    return this.addAgentMessage(state, `ok-${this.attempts}`);
  }
}

class HangingAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    await new Promise((_, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted"))); // will reject on abort
    });
    return state;
  }
}

describe("LangGraphAgent base class", () => {
  it("retries and succeeds after configured attempts", async () => {
    const agent = new SucceedAfterAttemptsAgent(2, {
      timeoutMs: 500,
      maxRetries: 3,
      retryDelayMs: 10,
    });
    const state: AgentState = {
      messages: [],
      currentStep: "init",
      data: {},
      completed: false,
      retryCount: 0,
      maxRetries: 3,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };

    const result = await agent.execute(state);
    expect(result.completed).toBe(false);
    expect(result.messages.length).toBeGreaterThan(0);
    const last = result.messages[result.messages.length - 1];
    expect(last.content).toMatch(/ok-/);
  });

  it("times out and marks state as completed with error", async () => {
    const agent = new HangingAgent({ timeoutMs: 50, maxRetries: 1, retryDelayMs: 10 });
    const state: AgentState = {
      messages: [],
      currentStep: "init",
      data: {},
      completed: false,
      retryCount: 0,
      maxRetries: 1,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };

    const result = await agent.execute(state);
    expect(result.completed).toBe(true);
    expect(result.error).toBeDefined();
  });

  it("aborts explicitly and returns an error state", async () => {
    const agent = new HangingAgent({ timeoutMs: 5000, maxRetries: 1, retryDelayMs: 10 });
    const state: AgentState = {
      messages: [],
      currentStep: "init",
      data: {},
      completed: false,
      retryCount: 0,
      maxRetries: 1,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };

    // Start execute() but do not await immediately
    const execPromise = agent.execute(state);

    // Give it a moment to start and then abort
    await new Promise((r) => setTimeout(r, 10));
    agent.abort();

    const result = await execPromise;
    expect(result.completed).toBe(true);
    expect(result.error).toBeDefined();
    expect(String(result.error).toLowerCase()).toMatch(/abort/);
  });

  it("aborts during backoff delay and returns an error state", async () => {
    class FailingAgent extends LangGraphAgent {
      protected async run(_state: AgentState, _signal: AbortSignal): Promise<AgentState> {
        throw new Error("transient error");
      }
    }
    const agent = new FailingAgent({ timeoutMs: 5000, maxRetries: 3, retryDelayMs: 1000 });
    const state: AgentState = {
      messages: [],
      currentStep: "init",
      data: {},
      completed: false,
      retryCount: 0,
      maxRetries: 3,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };

    // Start execution and wait until first attempt fails and backoff begins
    const execPromise = agent.execute(state);

    // Wait a bit to allow the first attempt and backoff to start
    await new Promise((r) => setTimeout(r, 200));
    // Abort while backoff is happening
    agent.abort();

    const result = await execPromise;
    expect(result.completed).toBe(true);
    expect(result.error).toBeDefined();
  });

  it("marks state as completed and sets error when max retries exceeded", async () => {
    // failsBeforeSuccess is larger than maxRetries so it will always fail
    const agent = new SucceedAfterAttemptsAgent(5, {
      timeoutMs: 200,
      maxRetries: 2,
      retryDelayMs: 10,
    });
    const state: AgentState = {
      messages: [],
      currentStep: "init",
      data: {},
      completed: false,
      retryCount: 0,
      maxRetries: 2,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };

    const result = await agent.execute(state);
    expect(result.completed).toBe(true);
    expect(result.error).toBeDefined();
    expect(result.retryCount).toBeGreaterThanOrEqual(2);
  });
});
