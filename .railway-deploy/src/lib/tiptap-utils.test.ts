import { describe, expect, it, vi } from "vitest";
import { cn, handleImageUpload, isMac, MAC_SYMBOLS, MAX_FILE_SIZE, SR_ONLY } from "./tiptap-utils";

describe("tiptap-utils", () => {
  describe("cn (className utility)", () => {
    it("combines multiple class names", () => {
      const result = cn("class1", "class2", "class3");
      expect(result).toBe("class1 class2 class3");
    });

    it("filters out falsy values", () => {
      const result = cn("class1", false, null, undefined, "class2");
      expect(result).toBe("class1 class2");
    });

    it("handles empty input", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("handles conditional classes", () => {
      const isActive = true;
      const result = cn("base", isActive && "active");
      expect(result).toBe("base active");
    });
  });

  describe("isMac", () => {
    it("detects macOS platform", () => {
      const originalNavigator = global.navigator;
      // @ts-expect-error - Testing navigator override
      global.navigator = { platform: "MacIntel" };

      expect(isMac()).toBe(true);

      global.navigator = originalNavigator;
    });

    it("detects non-macOS platform", () => {
      const originalNavigator = global.navigator;
      // @ts-expect-error - Testing navigator override
      global.navigator = { platform: "Win32" };

      expect(isMac()).toBe(false);

      global.navigator = originalNavigator;
    });

    it("handles undefined navigator", () => {
      const originalNavigator = global.navigator;
      // @ts-expect-error - Testing navigator override
      global.navigator = undefined;

      const result = isMac();
      expect(typeof result).toBe("boolean");

      global.navigator = originalNavigator;
    });
  });

  describe("MAC_SYMBOLS", () => {
    it("contains expected symbols", () => {
      expect(MAC_SYMBOLS.mod).toBe("⌘");
      expect(MAC_SYMBOLS.command).toBe("⌘");
      expect(MAC_SYMBOLS.ctrl).toBe("⌃");
      expect(MAC_SYMBOLS.alt).toBe("⌥");
      expect(MAC_SYMBOLS.shift).toBe("⇧");
    });
  });

  describe("SR_ONLY", () => {
    it("has screen reader only styles", () => {
      expect(SR_ONLY.position).toBe("absolute");
      expect(SR_ONLY.width).toBe("1px");
      expect(SR_ONLY.height).toBe("1px");
      expect(SR_ONLY.overflow).toBe("hidden");
    });
  });

  describe("MAX_FILE_SIZE", () => {
    it("is 5MB", () => {
      expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    });
  });

  describe("handleImageUpload", () => {
    it("validates file size", async () => {
      const largeFile = new File(["x".repeat(6 * 1024 * 1024)], "large.jpg", {
        type: "image/jpeg",
      });

      const onProgress = vi.fn();

      try {
        await handleImageUpload(largeFile, onProgress);
        expect.fail("Should have thrown error for large file");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("5MB");
      }
    });

    it("validates file type", async () => {
      const textFile = new File(["text"], "file.txt", { type: "text/plain" });

      const onProgress = vi.fn();

      try {
        await handleImageUpload(textFile, onProgress);
        expect.fail("Should have thrown error for invalid file type");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("image");
      }
    });

    it("handles valid image file", async () => {
      const validFile = new File(["image data"], "image.jpg", {
        type: "image/jpeg",
      });

      const onProgress = vi.fn();
      const result = await handleImageUpload(validFile, onProgress);

      // Should return data URL or upload result
      expect(result).toBeTruthy();
      expect(onProgress).toHaveBeenCalled();
    });

    // Upload errors are handled internally by throwing Error
  });

  // Note: formatShortcut function is not exported from tiptap-utils
  // Skipping these tests as the function is internal

  describe("Edge cases", () => {
    it("handles empty strings in cn", () => {
      expect(cn("", "class")).toBe("class");
    });

    it("handles whitespace in cn", () => {
      expect(cn("  class1  ", "class2")).toBe("  class1   class2");
    });

    it("handles very large file gracefully", async () => {
      // Avoid allocating a huge string in the test runner to prevent OOM.
      // Create a lightweight fake File-like object with a size > MAX_FILE_SIZE.
      const hugeFile = {
        name: "huge.jpg",
        size: 100 * 1024 * 1024,
        type: "image/jpeg",
      } as unknown as File;

      const onProgress = vi.fn();

      try {
        await handleImageUpload(hugeFile, onProgress);
        expect.fail("Should have thrown error for huge file");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("5MB");
      }
    });
  });
});
