import { beforeAll, expect, test, vi } from "vitest";
import handler from "./agents-v2";

function makeReq(body: any, apiKey = "test-autogen-key") {
  return {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body,
  } as any;
}

function makeRes() {
  const result: any = {};
  result.headers = {};
  result.setHeader = (k: string, v: string) => {
    result.headers[k] = v;
  };
  result.status = (code: number) => {
    result.statusCode = code;
    return result;
  };
  result.json = (payload: any) => {
    result.payload = payload;
    return result;
  };
  result.end = () => result;
  return result;
}

// Mock hybrid-agents-integration para evitar erro "LangGraph agents em construção"
vi.mock("../src/lib/hybrid-agents-integration.js", () => ({
  hasHybridVersion: () => true,
  executeHybridTask: vi.fn().mockResolvedValue({
    success: true,
    mode: "mock",
    langGraphResult: { messages: [] },
  }),
}));

beforeAll(() => {
  process.env.AUTOGEN_API_KEY = "test-autogen-key";
});

test("POST /api/agents-v2 returns success for a valid agent", async () => {
  const req = makeReq({ agentId: "harvey", message: "Analisar caso com prazo curto" });
  const res = makeRes();
  await handler(req as any, res as any);
  expect(res.statusCode).toBe(200);
  expect(res.payload).toBeDefined();
  expect(res.payload.success).toBe(true);
  expect(res.payload.agentId).toBe("harvey");
});
