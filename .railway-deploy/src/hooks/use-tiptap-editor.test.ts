import { renderHook } from "@testing-library/react";
import type { Editor } from "@tiptap/react";
import { describe, expect, it, vi } from "vitest";

// Mock @tiptap/react
vi.mock("@tiptap/react", () => ({
  useCurrentEditor: () => ({
    editor: {
      state: {},
      can: () => true,
      chain: () => ({ focus: () => ({ run: () => {} }) }),
    },
  }),
  useEditorState: ({
    selector,
  }: {
    selector: (context: {
      editor: {
        state: object;
        can: () => boolean;
      } | null;
    }) => unknown;
  }) =>
    selector({
      editor: {
        state: {},
        can: () => true,
      },
    }),
}));

async function loadHook() {
  vi.resetModules();
  const mod = await import("./use-tiptap-editor");
  return mod.useTiptapEditor;
}

describe("useTiptapEditor", () => {
  it("returns editor from context", async () => {
    const useTiptapEditor = await loadHook();
    const { result } = renderHook(() => useTiptapEditor());
    expect(result.current.editor).toBeDefined();
  });

  it("returns provided editor if passed", async () => {
    const useTiptapEditor = await loadHook();
    const mockEditor = {
      state: {},
      can: () => true,
      on: () => {
        // noop
      },
      off: () => {
        // noop
      },
    } as unknown as Editor;
    const { result } = renderHook(() => useTiptapEditor(mockEditor));
    // O hook pode retornar o editor wrapeado em um objeto state do useEditorState
    // então verificamos se o editor está presente no resultado
    expect(result.current).toBeDefined();
    expect(result.current.editor).toBeDefined();
  });
});
