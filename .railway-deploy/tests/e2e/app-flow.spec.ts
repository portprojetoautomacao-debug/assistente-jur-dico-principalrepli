import { expect, test } from "@playwright/test";

test.describe("Fluxo Principal da Aplicação", () => {
  test.beforeEach(async ({ page }) => {
    // Simula um usuário autenticado injetando no localStorage ANTES do carregamento
    await page.addInitScript(() => {
      const user = {
        name: "Test User",
        email: "test@example.com",
        picture: "https://example.com/avatar.jpg",
        role: "advogado",
      };
      window.localStorage.setItem("user", JSON.stringify(user));
    });

    // Navega para a raiz e aguarda o shell autenticado aparecer
    await page.goto("/");
    const sidebar = page.getByTestId("sidebar-nav");
    try {
      await expect(sidebar).toBeVisible({ timeout: 10000 });
    } catch {
      // Fallback: aguarda qualquer <nav> aparecer para versões sem test id
      await expect(page.locator("nav")).toBeVisible({ timeout: 10000 });
    }
  });

  test("deve carregar o Dashboard quando autenticado", async ({ page }) => {
    // Verifica se o dashboard carregou - aceita tanto "Dashboard" quanto "PJe Assistente"
    // Usa .first() para evitar strict mode violation quando ambos estão presentes
    const heading = page.getByRole("heading", { name: /Dashboard|PJe Assistente/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Verifica se navegação está presente
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("deve navegar para o CRM de Processos", async ({ page }) => {
    // Clica no botão de navegação para CRM
    const crmButton = page.getByRole("button", { name: "Acervo (CRM)" });
    await crmButton.click();

    // Verifica se navegou para a página de processos
    await expect(page.getByRole("heading", { name: "Acervo de Processos" })).toBeVisible();
  });

  test("deve navegar para a Calculadora de Prazos", async ({ page }) => {
    // Clica no botão de navegação para calculadora
    const calcButton = page.getByRole("button", { name: "Calc. Prazos" });
    await calcButton.click();

    // Verifica se navegou para a página da calculadora
    await expect(page.getByRole("heading", { name: "Calculadora de Prazos" })).toBeVisible();
  });
});
