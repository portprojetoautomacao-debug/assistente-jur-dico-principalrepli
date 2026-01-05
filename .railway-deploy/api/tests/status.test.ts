/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it } from "vitest";
import handler from "../status";

function mockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.body = null;
  res.headers = {};
  res.setHeader = (k: string, v: string) => (res.headers[k] = v);
  res.status = (code: number) => {
    res.statusCode = code;
    return {
      json: (data: any) => {
        res.body = data;
        return res;
      },
      end: () => res.end(),
    };
  };
  res.end = () => (res.body = res.body || {});
  return res;
}

function makeReq(type?: string, method = "GET") {
  const q: any = {};
  if (type) q.type = type;
  return {
    query: q,
    method,
    url: `/api/status${type ? `?type=${type}` : ""}`,
  } as any;
}

describe("status API", () => {
  beforeEach(() => {
    // Ensure no Upstash env by default
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.GEMINI_API_KEY;
    delete process.env.VITE_GEMINI_API_KEY;
  });

  it("should respond to OPTIONS with 200 and set headers", async () => {
    const req = makeReq(undefined, "OPTIONS");
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.headers).toHaveProperty("Access-Control-Allow-Origin");
  });

  it("should respond 'loaded' for /loaded routes (POST)", async () => {
    const req = makeReq("loaded", "POST");
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status");
    expect(res.body.status).toBe("loaded");
  });

  it("should respond 'ok' for loaded (GET)", async () => {
    const req = makeReq("loaded", "GET");
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("service", "spark-loaded");
  });

  it("should respond watchdog with null data when no KV configured", async () => {
    const req = makeReq("watchdog", "GET");
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("watchdog");
    expect(res.body.watchdog).toBeNull();
  });

  it("should respond cron-health with defaults when no KV configured", async () => {
    const req = makeReq("cron-health", "GET");
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("queue_history");
    expect(Array.isArray(res.body.queue_history)).toBe(true);
  });

  it("should return 'unhealthy' when AI is not configured", async () => {
    const req = makeReq(undefined, "GET");
    const res = mockRes();
    await handler(req, res);
    expect(res.body).toHaveProperty("status");
    expect(res.body.status).toBe("unhealthy");
    expect(res.statusCode).toBe(500);
  });

  it("should return 'healthy' when Gemini key is configured", async () => {
    process.env.GEMINI_API_KEY = "testkey";
    const req = makeReq(undefined, "GET");
    const res = mockRes();
    await handler(req, res);
    expect(res.body).toHaveProperty("status");
    expect(res.body.status).toBe("healthy");
    expect(res.statusCode).toBe(200);
  });

  it("should return 'healthy' when VITE_GEMINI_API_KEY is configured", async () => {
    process.env.VITE_GEMINI_API_KEY = "testkey_vite";
    const req = makeReq(undefined, "GET");
    const res = mockRes();
    await handler(req, res);
    expect(res.body).toHaveProperty("status");
    expect(res.body.status).toBe("healthy");
    expect(res.statusCode).toBe(200);
  });
});
