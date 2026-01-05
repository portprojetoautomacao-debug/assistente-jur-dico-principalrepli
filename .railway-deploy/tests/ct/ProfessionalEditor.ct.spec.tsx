import { expect, test } from "@playwright/experimental-ct-react";
import type { Locator, Page } from "@playwright/test";
import React, { useState } from "react";

// Import dinâmico para evitar problemas de resolução em tempo de build
const ProfessionalEditor = (await import("../../src/components/editor/ProfessionalEditor"))
  .ProfessionalEditor;

function Harness(props: {
  initialContent?: string;
  onAIStream?: (
    prompt: string,
    callbacks: {
      onChunk: (chunk: string) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    }
  ) => Promise<void>;
}) {
  const [content, setContent] = useState(props.initialContent ?? "<p>Olá mundo</p>");

  return (
    <div style={{ padding: 16 }}>
      <ProfessionalEditor
        content={content}
        onChange={setContent}
        onAIStream={props.onAIStream}
        showCollaboration
        placeholder="Comece a digitar..."
      />
    </div>
  );
}

// Evita hits reais à API de comandos do editor.
async function interceptEditorApi(page: Page) {
  await page.route("**/api/editor/**", async (route) => {
    const url = route.request().url();

    if (url.endsWith("/commands")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ commands: [] }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

test.describe("ProfessionalEditor (Playwright CT)", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await interceptEditorApi(page);
  });

  test("renderiza e permite digitar no CKEditor real", async ({
    mount,
    page,
  }: {
    mount: (component: React.ReactElement) => Promise<Locator>;
    page: Page;
  }) => {
    await mount(<Harness initialContent="<p>Texto inicial</p>" />);

    const editable = page.locator(".ck-editor__editable");
    await editable.click();
    await editable.type(" Texto extra");

    await expect(editable).toContainText("Texto inicial");
    await expect(editable).toContainText("Texto extra");
  });

  test("aciona streaming via comando rápido de IA", async ({
    mount,
    page,
  }: {
    mount: (component: React.ReactElement) => Promise<Locator>;
    page: Page;
  }) => {
    const prompts: string[] = [];

    await mount(
      <Harness
        initialContent="<p>Base</p>"
        onAIStream={async (prompt, callbacks) => {
          prompts.push(prompt);
          callbacks.onChunk("<p>Parte 1</p>");
          callbacks.onChunk("<p>Parte 2</p>");
          callbacks.onComplete();
        }}
      />
    );

    const aiButton = page.getByRole("button", { name: /assistente ia/i });
    await aiButton.click();

    const continuar = page.getByRole("button", { name: /^continuar$/i });
    await continuar.click();

    const editable = page.locator(".ck-editor__editable");
    await expect(editable).toContainText("Parte 1");
    await expect(editable).toContainText("Parte 2");

    expect(prompts.length).toBe(1);
    expect(prompts[0].toLowerCase()).toContain("continue");
  });
});
