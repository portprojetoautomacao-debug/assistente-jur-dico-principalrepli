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
    // Após beforeEach, já estamos autenticados e com shell pronto
    await expect(page.getByText(/Meu Painel|PJe Assistente/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("deve navegar para o CRM de Processos", async ({ page }) => {
    // Clica via test id ou fallback por texto
    const navProcesses = page.getByTestId("nav-processes");
    if (await navProcesses.count()) {
      await navProcesses.click();
    } else {
      await page.click("text=Acervo (CRM)");
    }

    // Verifica se mudou para a view de processos
    // O componente ProcessCRM deve ter um título ou elementos específicos
    await expect(page.getByText("Kanban de Processos")).toBeVisible();
    // Verifica se as colunas do Kanban estão presentes
    await expect(page.getByText("Triagem Inicial")).toBeVisible();
  });

  test("deve navegar para a Calculadora de Prazos", async ({ page }) => {
    // Clica via test id ou fallback por texto
    const navCalc = page.getByTestId("nav-calculator");
    if (await navCalc.count()) {
      await navCalc.click();
    } else {
      await page.click("text=Calc. Prazos");
    }

    // Verifica se a calculadora carregou
    await expect(
      page.getByText(/Calculadora de Prazos Processuais|Calculadora de Prazos/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
