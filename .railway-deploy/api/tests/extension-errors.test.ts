import { beforeEach, describe, expect, it, vi } from "vitest";

function makeReq(body: any, headers: any = {}) {
  const headerObj = { get: (k: string) => headers[k] || null };
  return { method: "POST", headers: headerObj, body } as any;
}

const mockRedis: any = {
  lpush: vi.fn(async () => null),
};

describe("extension errors API", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mock("@upstash/redis", () => ({
      Redis: function () {
        return mockRedis;
      },
    }));
    process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
    delete process.env.EXTENSION_ERRORS_API_KEY;
  });

  it("should accept error events and store in redis", async () => {
    const handler = (await import("../extension-errors")).default;
    const errorEvent = { id: "1", message: "test error", timestamp: new Date().toISOString() };
    const req = makeReq(errorEvent, { "X-API-Key": "valid" });

    let responseStatus: number | undefined = undefined;
    let responseBody: any = undefined;

    const resStub = {
      status: (s: number) => {
        responseStatus = s;
        return {
          json: (body: any) => {
            responseBody = body;
            return { status: s, body };
          },
        };
      },
    } as any;

    await handler(req as any, resStub);

    expect(responseStatus).toBe(200);
    expect(responseBody).toBeDefined();
    expect(responseBody).toHaveProperty("ok", true);
  });

  it("should reject when API key is configured and not provided or invalid", async () => {
    process.env.EXTENSION_ERRORS_API_KEY = "valid";
    const handler = (await import("../extension-errors")).default;
    const errorEvent = { id: "2", message: "test error 2", timestamp: new Date().toISOString() };

    const req = makeReq(errorEvent, { "X-API-Key": "invalid" });
    let responseStatus: number | undefined = undefined;
    let responseBody: any = undefined;
    const resStub = {
      status: (s: number) => {
        responseStatus = s;
        return {
          json: (body: any) => {
            responseBody = body;
            return { status: s, body };
          },
        };
      },
    } as any;

    await handler(req as any, resStub);

    expect(responseStatus).toBe(401);
    expect(responseBody).toHaveProperty("ok", false);
  });

  it("should accept when API key is configured and valid", async () => {
    process.env.EXTENSION_ERRORS_API_KEY = "valid";
    const handler = (await import("../extension-errors")).default;
    const errorEvent = { id: "3", message: "test error 3", timestamp: new Date().toISOString() };

    const req = makeReq(errorEvent, { "X-API-Key": "valid" });
    let responseStatus: number | undefined = undefined;
    let responseBody: any = undefined;
    const resStub = {
      status: (s: number) => {
        responseStatus = s;
        return {
          json: (body: any) => {
            responseBody = body;
            return { status: s, body };
          },
        };
      },
    } as any;

    await handler(req as any, resStub);

    expect(responseStatus).toBe(200);
    expect(responseBody).toHaveProperty("ok", true);
  });

});
