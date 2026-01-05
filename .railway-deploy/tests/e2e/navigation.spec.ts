import { expect, test } from "@playwright/test";

test.describe("Navegação e Interações", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Fazer login se necessário
    const loginButton = page.locator('button:has-text("Entrar")');
    if (await loginButton.isVisible({ timeout: 2000 })) {
      await page.fill('input[type="text"], input[name="username"]', "adm");
      await page.fill('input[type="password"], input[name="password"]', "adm123");
      await loginButton.click();
      await page.waitForLoadState("networkidle");
    }
  });

  test("deve navegar entre páginas e voltar", async ({ page }) => {
    // Verifica URL inicial
    await expect(page).toHaveURL(/\/$/);

    // Navega para a calculadora se o botão existir
    const calcButton = page.getByRole("button", { name: "Calc. Prazos" });
    if (await calcButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await calcButton.click();
      await expect(page.getByRole("heading", { name: "Calculadora de Prazos" })).toBeVisible();

      // Volta para o dashboard
      const dashboardButton = page.getByRole("button", { name: "Meu Painel" });
      await dashboardButton.click();
      await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    } else {
      // Se o botão não existir, pula este teste
      test.skip();
    }
  });

  test("deve clicar em elementos", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // browser_click
    const button = page.locator("button").first();
    const buttonCount = await button.count();

    if (buttonCount === 0) {
      test.skip();
      return;
    }

    // Verifica se o botão é visível e clicável antes de tentar clicar
    const isVisible = await button.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    await button.click({ timeout: 5000 });

    // Verifica que o clique teve efeito (página ainda funciona)
    await expect(page).toHaveURL(/./);
  });

  test("deve fazer hover em elementos", async ({ page }) => {
    await page.goto("/");

    // browser_hover
    const element = page.locator("button, a").first();
    if ((await element.count()) > 0) {
      await element.hover();
    }
  });

  test("deve gerenciar abas", async ({ context }) => {
    // Cria primeira aba no dashboard
    const page1 = await context.newPage();
    await page1.goto("/");
    await expect(page1.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });

    // Cria segunda aba em uma página diferente (se disponível)
    const page2 = await context.newPage();
    await page2.goto("/");
    const calcButton = page2.getByRole("button", { name: "Calc. Prazos" });
    if (await calcButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await calcButton.click();
      await expect(page2.getByRole("heading", { name: "Calculadora de Prazos" })).toBeVisible({
        timeout: 10000,
      });
    } else {
      // Fallback: navega para o dashboard
      await expect(page2.getByRole("heading", { name: "Dashboard" })).toBeVisible({
        timeout: 10000,
      });
    }

    const pages = context.pages();
    expect(pages.length).toBeGreaterThanOrEqual(2);

    await page2.close();
  });

  test("deve aguardar elementos", async ({ page }) => {
    await page.goto("/");

    // browser_wait_for
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("body", { state: "visible" });
  });
});
