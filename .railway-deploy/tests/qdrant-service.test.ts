import { beforeEach, describe, expect, it, vi } from "vitest";
import { QdrantService, type QdrantConfig, type SearchResult } from "../src/lib/qdrant-service";

const BASE_URL = "https://qdrant.example.com:6333";

function makeService(overrides: Partial<QdrantConfig> = {}) {
  return new QdrantService({
    url: BASE_URL,
    apiKey: "test-key",
    collectionName: "legal_docs",
    timeout: 5000,
    ...overrides,
  });
}

describe("QdrantService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("validateVector: rejects non-array or empty", async () => {
    const svc = makeService();
    // @ts-expect-error testing runtime validation
    await expect(svc.search(undefined)).rejects.toThrow(/non-empty array/);
    await expect(svc.search([])).rejects.toThrow(/non-empty array/);
  });

  it("validateVector: rejects non-finite values", async () => {
    const svc = makeService();
    await expect(svc.search([1, 2, Number.POSITIVE_INFINITY])).rejects.toThrow(/finite numbers/);
    await expect(svc.search([NaN, 0.2])).rejects.toThrow(/finite numbers/);
  });

  it("validateVector: rejects extreme dimensions (>10000)", async () => {
    const svc = makeService();
    const huge = new Array(10001).fill(0.1);
    await expect(svc.search(huge)).rejects.toThrow(/between 1 and 10000/);
  });

  it("search: rejects invalid limit bounds", async () => {
    const svc = makeService();
    const vec = [0.1, 0.2, 0.3];
    await expect(svc.search(vec, 0)).rejects.toThrow(/between 1 and 100/);
    await expect(svc.search(vec, 101)).rejects.toThrow(/between 1 and 100/);
  });

  it("search: sanitizes results and handles OK responses", async () => {
    const svc = makeService();
    const vec = [0.1, 0.2, 0.3];

    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        result: [
          { id: "a", score: 0.95, payload: { title: "Doc A" } },
          { id: 2, score: 0.8, payload: null },
          { id: "bad", score: "x" },
          "invalid",
        ],
      }),
    } as unknown as Response;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const results = await svc.search(vec, 10);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(Array.isArray(results)).toBe(true);
    // Only objects become results; payload defaults to {}
    expect(results).toEqual<SearchResult[]>([
      { id: "a", score: 0.95, payload: { title: "Doc A" } },
      { id: 2, score: 0.8, payload: {} },
      { id: "bad", score: 0, payload: {} },
    ]);
  });

  it("search: throws on non-OK response", async () => {
    const svc = makeService();
    const vec = [0.1, 0.2, 0.3];

    const mockResponse = {
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({}),
    } as unknown as Response;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);
    await expect(svc.search(vec, 10)).rejects.toThrow(/Qdrant API error: 500/);
  });

  it("createCollection: handles already exists (409) gracefully", async () => {
    const svc = makeService();
    const mockResponse = {
      ok: false,
      status: 409,
      statusText: "Conflict",
      json: async () => ({}),
    } as unknown as Response;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);
    await expect(svc.createCollection(3, "Cosine")).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
