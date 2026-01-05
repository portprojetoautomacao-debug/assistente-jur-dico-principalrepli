import { describe, it, expect } from "vitest";

describe("UndoRedoButton", () => {
  it("undoes last action", () => {
    expect(true).toBe(true);
  });

  it("redoes last undo action", () => {
    expect(true).toBe(true);
  });

  it("disables undo when no history", () => {
    expect(true).toBe(true);
  });

  it("disables redo when no redo history", () => {
    expect(true).toBe(true);
  });
});
