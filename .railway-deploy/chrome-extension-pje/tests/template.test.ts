import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Chrome APIs
const mockChrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    getManifest: vi.fn(() => ({ version: "1.0.0" })),
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
  },
};

(global as unknown as { chrome: typeof mockChrome }).chrome = mockChrome;

describe("Template Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset Chrome API mocks
    mockChrome.storage.sync.get.mockResolvedValue({});
    mockChrome.storage.sync.set.mockResolvedValue(undefined);
    mockChrome.storage.local.get.mockResolvedValue({});
    mockChrome.storage.local.set.mockResolvedValue(undefined);
    mockChrome.runtime.sendMessage.mockResolvedValue(undefined);
    mockChrome.tabs.query.mockResolvedValue([]);
  });

  describe("Feature Name", () => {
    it("should do something", () => {
      expect(true).toBe(true);
    });

    it("should call Chrome API", async () => {
      await mockChrome.storage.local.get("key");

      expect(mockChrome.storage.local.get).toHaveBeenCalledWith("key");
      expect(mockChrome.storage.local.get).toHaveBeenCalledTimes(1);
    });

    it("should handle async operations", async () => {
      mockChrome.storage.local.get.mockResolvedValue({ data: "test" });

      const result = await mockChrome.storage.local.get("data");

      expect(result).toEqual({ data: "test" });
    });

    it("should handle errors", async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error("Storage error"));

      await expect(mockChrome.storage.local.get("key")).rejects.toThrow("Storage error");
    });
  });
});
