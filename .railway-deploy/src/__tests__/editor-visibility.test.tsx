import TiptapEditorV2 from "@/components/editor/TiptapEditorV2";
import { render, waitFor } from "@testing-library/react";

describe("Editor visibility and style sanity", () => {
  it("should render editor without blur or transparency", async () => {
    const handleChange = vi.fn();

    const { container } = render(<TiptapEditorV2 content="<p>Hello</p>" onChange={handleChange} />);

    await waitFor(() => {
      const wrapper = container.querySelector(".simple-editor-wrapper") as HTMLElement;
      const editorEl = container.querySelector(".tiptap.ProseMirror") as HTMLElement;
      expect(wrapper).toBeTruthy();
      expect(editorEl).toBeTruthy();

      // Inline style assertions
      expect(wrapper?.style.opacity || "1").toBe("1");
      expect(wrapper?.style.filter || "none").toBe("none");
      // Editor element should also have filter removed
      expect(editorEl?.style.filter || "none").toBe("none");
      expect(editorEl?.style.opacity || "1").toBe("1");
    });
  });
});
