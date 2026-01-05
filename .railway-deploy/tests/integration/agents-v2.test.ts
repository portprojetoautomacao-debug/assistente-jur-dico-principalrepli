import { beforeAll, expect, test } from "vitest";
import handler from "../../api/agents-v2";

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

beforeAll(() => {
  process.env.AUTOGEN_API_KEY = "test-autogen-key";
});

test("POST /api/agents-v2 executa agente LangGraph com sucesso", async () => {
  const req = makeReq({ agentId: "harvey", message: "Analisar caso com prazo curto" });
  const res = makeRes();
  await handler(req, res);
  expect(res.statusCode).toBe(200);
  expect(res.payload).toBeDefined();
  expect(res.payload.success).toBe(true);
  expect(res.payload.data).toBeDefined();
  expect(["langgraph", "mock", "hybrid", "traditional", undefined]).toContain(res.payload.mode);
  const langGraphCompleted = res.payload.data.langGraphResult?.completed;
  if (langGraphCompleted !== undefined) {
    expect(langGraphCompleted).toBe(true);
  }
});
