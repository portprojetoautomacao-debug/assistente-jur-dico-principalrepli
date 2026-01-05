import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SimpleEditor } from "./simple-editor";

describe("SimpleEditor", () => {
  it("renders toolbar and editor content", () => {
    render(<SimpleEditor />);

    // Toolbar should exist and be accessible
    const toolbar = screen.getByRole("toolbar");
    expect(toolbar).toBeDefined();

    // Editor content is rendered
    const content = screen.getByRole("presentation");
    expect(content).toBeDefined();
  });
});
