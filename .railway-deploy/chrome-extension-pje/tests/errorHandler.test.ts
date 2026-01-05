import { beforeEach, describe, expect, it, vi } from "vitest";
import * as ErrorHandler from "../src/shared/errorHandler";

describe("errorHandler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Provide defaults for storage to avoid TypeErrors in tests
    (chrome.storage.local.get as any).mockResolvedValue({ errors: [] });
    (chrome.storage.local.set as any).mockResolvedValue(undefined);
    (chrome.runtime.sendMessage as any).mockImplementation(() => {});
  });

  it("should store error in storage and send message to background", async () => {
    const testError = new Error("Test error");
    // Mock storage get and set
    (chrome.storage.local.get as any).mockResolvedValue({ errors: [] });
    (chrome.storage.local.set as any).mockResolvedValue(undefined);
    (chrome.runtime.sendMessage as any).mockImplementation(() => {});

    await ErrorHandler.reportError(testError, { test: true });

    // should call get and set
    expect((chrome.storage.local.get as any).mock.calls.length).toBeGreaterThanOrEqual(1);
    expect((chrome.storage.local.set as any).mock.calls.length).toBeGreaterThanOrEqual(1);
    expect((chrome.runtime.sendMessage as any).mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("initGlobalHandlers should install event listeners and handle events", async () => {
    const err = new Error("Global test");
    // spies
    const reportSpy = vi.spyOn(ErrorHandler, "reportError");
    ErrorHandler.initGlobalHandlers();

    // Trigger a real ErrorEvent (JSDOM supports ErrorEvent)
    const event = new ErrorEvent("error", { error: err, message: "Global test" });
    window.dispatchEvent(event);

    // Dispatch unhandledrejection event manually
    const rejEvent = new Event("unhandledrejection");
    (rejEvent as any).reason = err;
    window.dispatchEvent(rejEvent);

    // Give time for handler and check that at least storage.set or runtime.sendMessage was called
    await new Promise((r) => setTimeout(r, 50));
    expect((chrome.storage.local.set as any).mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
