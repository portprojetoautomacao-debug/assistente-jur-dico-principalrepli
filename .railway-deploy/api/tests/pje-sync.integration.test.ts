/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

function makeReq(body: any, headers: any = {}) {
  const headerObj = { get: (k: string) => headers[k] || null };
  return { method: "POST", headers: headerObj, json: async () => body } as any;
}

const mockRedis: any = {
  set: vi.fn(async () => null),
  get: vi.fn(async () => null),
  sismember: vi.fn(async () => 1),
  lpush: vi.fn(async () => null),
};

vi.mock("@upstash/redis", () => ({
  Redis: function RedisMock() {
    return mockRedis;
  },
}));

describe("pje-sync integration tests", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockRedis.set = vi.fn(async () => null);
    mockRedis.get = vi.fn(async () => null);
    mockRedis.sismember = vi.fn(async () => 1);
    mockRedis.lpush = vi.fn(async () => null);

    // stub fetch to simulate calling /api/agents
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true })) as any);
    // set Upstash env so module imports
    process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
  });

  it("should create expediente when existing process is updated (createExpedienteFromChange)", async () => {
    // existing process in Redis with older movement timestamp
    const existingProcess = {
      numero: "50005764620218130223",
      numeroFormatado: "5000576-46.2021.8.13.0223",
      ultimoMovimento: { descricao: "Despacho antigo", timestamp: 1690000000000 },
    };

    mockRedis.get.mockImplementation(async (key: string) => {
      if (key === `processo:${existingProcess.numero}`) return existingProcess;
      return null;
    });

    const updatedProcess = {
      numero: existingProcess.numero,
      numeroFormatado: existingProcess.numeroFormatado,
      ultimoMovimento: { descricao: "Intimação nova", timestamp: 1700000000000 },
    };

    const req = makeReq(
      { type: "SYNC_PROCESSOS", data: [updatedProcess] },
      { "X-API-Key": "valid-api-key" }
    );

    const handler = (await import("../pje-sync")).default;
    const resp = await handler(req as any);
    const body = await resp.json();

    expect(resp.status).toBe(200);
    expect(body).toHaveProperty("success", true);
    expect(body.synced).toBeGreaterThanOrEqual(1);

    // Because existing process changed, createExpedienteFromChange should call lpush
    expect(mockRedis.lpush).toHaveBeenCalled();
    // check that lpush called with key 'expedientes' and the content includes processNumber
    const [[key, payload]] = mockRedis.lpush.mock.calls;
    expect(key).toBe("expedientes");
    const parsed = JSON.parse(payload as string);
    expect(parsed.processNumber).toBe(updatedProcess.numeroFormatado || updatedProcess.numero);
    // verify that processos:pje-extension was updated
    expect(mockRedis.set).toHaveBeenCalledWith("processos:pje-extension", expect.any(Array));
  });

  it("should return 401 for invalid API key", async () => {
    mockRedis.sismember.mockResolvedValue(0); // invalid key
    const updatedProcess = {
      numero: "500000000000000000",
      numeroFormatado: "5000000-00.0000.0.00.0000",
      ultimoMovimento: { descricao: "Novo movimento", timestamp: 1700000000000 },
    };

    const req = makeReq(
      { type: "SYNC_PROCESSOS", data: [updatedProcess] },
      { "X-API-Key": "invalid-key" }
    );
    const handler = (await import("../pje-sync")).default;
    const resp = await handler(req as any);
    const body = await resp.json();

    expect(resp.status).toBe(401);
    expect(body).toHaveProperty("error");
  });

  it("should return 400 for invalid process data", async () => {
    const invalidProcess = {
      numero: "123",
      numeroFormatado: "123",
      ultimoMovimento: { descricao: "mov" /* missing timestamp */ },
    };
    const req = makeReq(
      { type: "SYNC_PROCESSOS", data: [invalidProcess] },
      { "X-API-Key": "valid-api-key" }
    );
    const handler = (await import("../pje-sync")).default;
    const resp = await handler(req as any);
    const body = await resp.json();
    expect(resp.status).toBe(400);
    expect(body).toHaveProperty("success", false);
  });

  it("should return 400 for invalid expediente data", async () => {
    const invalidExp = { id: "1", processNumber: "", description: "", type: "nonexistent" };
    const req = makeReq(
      { type: "SYNC_EXPEDIENTES", data: [invalidExp] },
      { "X-API-Key": "valid-api-key" }
    );
    const handler = (await import("../pje-sync")).default;
    const resp = await handler(req as any);
    expect(resp.status).toBe(400);
    const body = await resp.json();
    expect(body).toHaveProperty("success", false);
  });

  it("should import successfully and use fallback in-memory redis when UPSTASH env is missing", async () => {
    // Ensure the fallback initializes with the TEST_PJE_API_KEY
    process.env.TEST_PJE_API_KEY = "valid-api-key";
    // Remove Upstash env
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    await vi.resetModules();

    // The module should IMPORT successfully and fallback to InMemoryRedis
    const handler = (await import("../pje-sync")).default;
    expect(typeof handler).toBe("function");

    // Now call the handler with a valid key seeded in fallback
    const req = makeReq({ type: "SYNC_EXPEDIENTES", data: [] }, { "X-API-Key": "valid-api-key" });
    const resp = await handler(req as any);
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body).toHaveProperty("success", true);
  });
});
