/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "../agents/process-task";

function mockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.body = null;
  res.setHeader = (k: string, v: string) => (
    (res.headers = res.headers || {}),
    (res.headers[k] = v)
  );
  res.end = () => (res.body = res.body || {});
  res.json = (data: any) => {
    res.body = data;
    return res;
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  return res;
}

function makeReq(task: any, agent: any, method = "POST", headers: Record<string, string> = {}) {
  const baseHeaders: Record<string, string> = {};
  if (process.env.AUTOGEN_API_KEY) {
    baseHeaders["authorization"] = `Bearer ${process.env.AUTOGEN_API_KEY}`;
  }
  return {
    method,
    headers: { ...baseHeaders, ...headers },
    body: { task, agent },
  } as any;
}

describe("process-task API", () => {
  beforeEach(() => {
    // stub fetch for Gemini
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        summary: "Resumo teste",
                        suggestedActions: ["action1"],
                        priority: "low",
                        documentType: "Intimação",
                        nextSteps: ["Revisar"],
                        deadline: {
                          days: 10,
                          type: "úteis",
                        },
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        } as any;
      })
    );
    process.env.GEMINI_API_KEY = "test";
    process.env.AUTOGEN_API_KEY = "test-autogen";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should process an analyze_intimation task and return analysis result", async () => {
    const task = {
      id: "1",
      agentId: "a1",
      type: "analyze_intimation",
      priority: "high",
      status: "queued",
      createdAt: new Date().toISOString(),
      data: {
        text: "Este é um texto de intimação de exemplo que possui mais de cinquenta caracteres para teste.",
        processNumber: "1234567-89.2023",
        tribunal: "TRF",
        type: "intimacao",
      },
    } as any;

    const agent = { id: "a1", type: "ai" } as any;

    const req = makeReq(task, agent);
    const res = mockRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("result");
    expect(res.body.result).toHaveProperty("success", true);
    expect(res.body.result.data).toHaveProperty("summary");
  });

  it("should return message for unknown task without text", async () => {
    const task = {
      id: "2",
      agentId: "a2",
      type: "some-other-task",
      priority: "low",
      status: "queued",
      createdAt: new Date().toISOString(),
      data: {},
    } as any;
    const agent = { id: "a2", type: "ai" } as any;

    const req = makeReq(task, agent);
    const res = mockRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toHaveProperty("message");
  });
});
