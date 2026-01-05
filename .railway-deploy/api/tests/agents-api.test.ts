/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import handler from "../agents";

function mockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.body = null;
  res.headers = {};
  res.setHeader = (key: string, value: string) => {
    res.headers[key] = value;
    return res;
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return {
      json: (data: any) => {
        res.body = data;
        return res;
      },
      end: () => res,
    };
  };
  res.end = () => res;
  return res;
}

function makeReq(action: string, method: string, authorized = true): any {
  return {
    query: { action },
    method,
    headers: authorized
      ? { host: "localhost:3000" }
      : { host: "prod.example.com", authorization: "Bearer invalid-token" },
    body: {},
  };
}

describe("agents API handler", () => {
  it("should reject unauthorized requests", async () => {
    const req = makeReq("process-queue", "POST", false);
    // Force NODE_ENV to production for this test to ensure auth check runs
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const res = mockRes();
    await handler(req, res);

    // Restore env
    process.env.NODE_ENV = originalEnv;

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("should return no pending tasks message", async () => {
    const req = makeReq("process-queue", "POST", true);
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, processed: 0 });
  });

  it("should return memory array (empty)", async () => {
    const req = makeReq("memory", "GET", true);
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("memory");
    expect(Array.isArray(res.body.memory)).toBe(true);
  });
});
