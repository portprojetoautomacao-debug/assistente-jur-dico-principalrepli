import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export class HarveyAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    let current = updateState(state, { currentStep: "harvey:start" });

    // Simple stable stub - in real impl, call Gemini and analyze
    await new Promise((resolve) => setTimeout(resolve, 50));

    current = updateState(current, {
      currentStep: "harvey:analysis_complete",
      data: { ...current.data, summary: "Harvey provides strategy overview." },
      completed: true,
    });

    return this.addAgentMessage(current, "Harvey: estratégia inicial aplicada");
  }
}

export async function runHarvey(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new HarveyAgent();
  const initialState: AgentState = {
    messages: [],
    currentStep: "init",
    data,
    completed: false,
    retryCount: 0,
    maxRetries: 3,
    startedAt: Date.now(),
    lastUpdatedAt: Date.now(),
  };

  return agent.execute(initialState);
}
