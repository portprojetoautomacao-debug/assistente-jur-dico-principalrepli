import { expect, test } from "@playwright/test";

test.describe("Formulários e Inputs", () => {
  test("deve preencher formulários", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Busca primeiro campo de texto usando ARIA role
    const input = page.getByRole("textbox").first();

    // Verifica se existe antes de interagir
    if ((await input.count()) > 0) {
      await input.fill("Texto de teste");
      await expect(input).toHaveValue("Texto de teste");
    }
  });

  test("deve digitar texto", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Busca primeiro campo usando ARIA role
    const input = page.getByRole("textbox").first();

    if ((await input.count()) > 0) {
      await input.type("Digitando caractere por caractere", { delay: 50 });
    }
  });

  test("deve pressionar teclas", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Busca primeiro campo usando ARIA role
    const input = page.getByRole("textbox").first();

    if ((await input.count()) > 0) {
      await input.focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Escape");
      await page.keyboard.press("Tab");
    }
  });

  test("deve selecionar opções", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Busca combobox usando ARIA role
    const select = page.getByRole("combobox").first();

    if ((await select.count()) > 0) {
      await select.selectOption({ index: 0 });
    }
  });

  test("deve fazer upload de arquivo", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Busca input de arquivo usando seletor específico
    const fileInput = page.locator('input[type="file"]').first();

    if ((await fileInput.count()) > 0) {
      await fileInput.setInputFiles({
        name: "test.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("Conteúdo de teste"),
      });
    }
  });

  test("deve arrastar elementos", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Busca elemento arrastável
    const draggable = page.locator('[draggable="true"]').first();

    if ((await draggable.count()) > 0) {
      const dropTarget = page.locator('[data-drop-target="true"]').first();

      // Verifica se há um alvo para soltar
      if ((await dropTarget.count()) > 0) {
        await draggable.dragTo(dropTarget);
      } else {
        // Fallback: arrastar 100px para direita e baixo
        const box = await draggable.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + 100, box.y + 100, { steps: 10 });
          await page.mouse.up();
        }
      }
    }
  });
});
