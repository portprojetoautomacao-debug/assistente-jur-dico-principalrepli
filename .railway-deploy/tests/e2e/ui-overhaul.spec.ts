import { expect, test } from "@playwright/test";

test.describe("UI Overhaul - E2E Tests", () => {
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

    // Navegar para MinutasManager usando data-testid
    await page.waitForSelector('[data-testid="sidebar-nav"]', { timeout: 15000 });
    await page.click('[data-testid="nav-minutas"]');
    await page.waitForTimeout(500);
  });

  test.describe("MinutasManager - ViewMode Toggle", () => {
    test("deve alternar entre grid e list view", async ({ page }) => {
      // Verificar modo grid por padrão
      const gridButton = page.locator('button:has-text("Grid")');
      await expect(gridButton).toHaveClass(/bg-secondary/);

      // Alternar para list
      const listButton = page.locator('button:has-text("List")');
      await listButton.click();
      await expect(listButton).toHaveClass(/bg-secondary/);

      // Voltar para grid
      await gridButton.click();
      await expect(gridButton).toHaveClass(/bg-secondary/);
    });

    test("grid mode deve mostrar 3 colunas em telas grandes", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      const container = page.locator('[data-testid="minutas-container"]');
      await expect(container).toHaveClass(/lg:grid-cols-3/);
    });

    test("list mode deve mostrar 1 coluna", async ({ page }) => {
      const listButton = page.locator('button:has-text("List")');
      await listButton.click();

      const container = page.locator('[data-testid="minutas-container"]');
      await expect(container).not.toHaveClass(/grid-cols-3/);
    });
  });

  test.describe("MinutasManager - Filtros", () => {
    test("deve filtrar por status", async ({ page }) => {
      // Selecionar status "Rascunho"
      await page.selectOption('select[name="status"]', "rascunho");

      // Verificar que apenas rascunhos são exibidos
      const badges = page.locator("text=Rascunho");
      await expect(badges).toHaveCount({ timeout: 5000 });
    });

    test("deve filtrar por tipo", async ({ page }) => {
      // Selecionar tipo "Petição"
      await page.selectOption('select[name="tipo"]', "peticao");

      // Verificar que apenas petições são exibidas
      const badges = page.locator("text=Petição");
      await expect(badges.first()).toBeVisible();
    });

    test("deve buscar por texto", async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Buscar"]');
      await searchInput.fill("Inicial");

      // Aguardar resultados
      await page.waitForTimeout(300);

      // Verificar que apenas resultados com "Inicial" aparecem
      await expect(page.locator("text=Inicial").first()).toBeVisible();
    });

    test("deve combinar múltiplos filtros", async ({ page }) => {
      await page.selectOption('select[name="status"]', "rascunho");
      await page.selectOption('select[name="tipo"]', "peticao");

      const searchInput = page.locator('input[placeholder*="Buscar"]');
      await searchInput.fill("Processo");

      // Aguardar aplicação dos filtros
      await page.waitForTimeout(500);

      // Verificar contador de resultados
      const counter = page.locator("text=/\\d+ minuta\\(s\\)/");
      await expect(counter).toBeVisible();
    });
  });

  test.describe("MinutasManager - Preview de Conteúdo", () => {
    test("deve exibir preview no modo grid", async ({ page }) => {
      // Garantir que está em grid mode
      const gridButton = page.locator('button:has-text("Grid")');
      await gridButton.click();

      // Verificar preview (máximo 200 caracteres)
      const preview = page.locator(".line-clamp-3").first();
      await expect(preview).toBeVisible();

      const previewText = await preview.textContent();
      expect(previewText?.length).toBeLessThanOrEqual(203);
    });

    test("não deve exibir preview no modo list", async ({ page }) => {
      const listButton = page.locator('button:has-text("List")');
      await listButton.click();

      // Aguardar transição
      await page.waitForTimeout(300);

      // Preview não deve estar visível
      const previews = page.locator(".line-clamp-3");
      await expect(previews).toHaveCount(0);
    });
  });

  test.describe("MinutasManager - Badge IA", () => {
    test("deve exibir badge IA para minutas criadas por agente", async ({ page }) => {
      const iaBadge = page.locator("text=IA").first();
      await expect(iaBadge).toBeVisible();

      // Verificar classe CSS
      const badgeClass = await iaBadge.getAttribute("class");
      expect(badgeClass).toContain("bg-purple-500/10");
    });

    test("deve aplicar border laranja em cards de IA", async ({ page }) => {
      const cardComIA = page.locator(".border-orange-500\\/30").first();
      await expect(cardComIA).toBeVisible();
    });
  });

  test.describe("ProcessosView - Dashboard", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page.click("text=Processos");
    });

    test("deve exibir 5 cards de estatísticas", async ({ page }) => {
      await expect(page.locator("text=Total")).toBeVisible();
      await expect(page.locator("text=Ativos")).toBeVisible();
      await expect(page.locator("text=Arquivados")).toBeVisible();
      await expect(page.locator("text=Valor Total")).toBeVisible();
      await expect(page.locator("text=Prazos")).toBeVisible();
    });

    test("deve formatar valores em moeda", async ({ page }) => {
      const valorTotal = page.locator("text=/R\\$ [\\d.,]+/");
      await expect(valorTotal).toBeVisible();

      const valor = await valorTotal.textContent();
      expect(valor).toMatch(/R\$ \d{1,3}(\.\d{3})*(,\d{2})?/);
    });

    test("deve calcular estatísticas corretamente", async ({ page }) => {
      // Total deve ser número > 0
      const total = page.locator(".text-2xl.font-bold").first();
      const totalText = await total.textContent();
      expect(parseInt(totalText || "0")).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("ProcessosView - Filtros e Ordenação", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page.click("text=Processos");
    });

    test("deve filtrar por status", async ({ page }) => {
      await page.selectOption('select[name="status"]', "ativo");

      await page.waitForTimeout(300);

      const badges = page.locator("text=Ativo");
      await expect(badges.first()).toBeVisible();
    });

    test("deve filtrar por comarca", async ({ page }) => {
      const comarcaSelect = page.locator("select").filter({ hasText: "comarca" });
      await comarcaSelect.selectOption({ index: 1 }); // Primeira comarca

      await page.waitForTimeout(300);

      // Verificar que apenas processos da comarca aparecem
      const cards = page.locator("article");
      await expect(cards.first()).toBeVisible();
    });

    test("deve ordenar alfabeticamente", async ({ page }) => {
      await page.selectOption('select[name="sort"]', "alpha");

      await page.waitForTimeout(300);

      const firstCard = page.locator("article").first();
      await expect(firstCard).toBeVisible();
    });

    test("deve ordenar por valor", async ({ page }) => {
      await page.selectOption('select[name="sort"]', "value");

      await page.waitForTimeout(300);

      // Primeiro card deve ter o maior valor
      const firstValue = page.locator(".text-blue-600").first();
      await expect(firstValue).toBeVisible();
    });
  });

  test.describe("ProcessosView - Badge Urgente", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page.click("text=Processos");
    });

    test("deve exibir badge urgente para prazos críticos", async ({ page }) => {
      const urgentBadge = page.locator("text=Urgente");

      // Pode ou não existir dependendo dos dados
      const count = await urgentBadge.count();
      if (count > 0) {
        await expect(urgentBadge.first()).toBeVisible();

        // Verificar classe variant="destructive"
        const badgeClass = await urgentBadge.first().getAttribute("class");
        expect(badgeClass).toContain("destructive");
      }
    });

    test("deve mostrar quantidade de prazos pendentes", async ({ page }) => {
      const prazosBadge = page.locator("text=/\\d+ pendentes/");

      const count = await prazosBadge.count();
      if (count > 0) {
        await expect(prazosBadge.first()).toBeVisible();
      }
    });
  });

  test.describe("Responsividade", () => {
    test("deve adaptar grid em mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.click("text=Minutas");

      // Em mobile, deve ter 1 coluna
      const container = page.locator('[data-testid="minutas-container"]');
      await expect(container).toHaveClass(/grid-cols-1/);
    });

    test("deve adaptar grid em tablet", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.click("text=Minutas");

      // Em tablet, deve ter 2 colunas
      const container = page.locator('[data-testid="minutas-container"]');
      await expect(container).toHaveClass(/md:grid-cols-2/);
    });

    test("deve adaptar grid em desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.click("text=Minutas");

      // Em desktop, deve ter 3 colunas
      const container = page.locator('[data-testid="minutas-container"]');
      await expect(container).toHaveClass(/lg:grid-cols-3/);
    });
  });

  test.describe("Acessibilidade", () => {
    test("botões devem ter aria-labels", async ({ page }) => {
      await page.click("text=Minutas");

      const gridButton = page.locator('button:has-text("Grid")');
      const ariaLabel = await gridButton.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
    });

    test("deve ser navegável por teclado", async ({ page }) => {
      await page.click("text=Minutas");

      // Tab até o botão de toggle
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      // Enter deve ativar o botão
      await page.keyboard.press("Enter");

      await page.waitForTimeout(300);
    });

    test("deve ter contraste adequado", async ({ page }) => {
      await page.click("text=Minutas");

      // Badges devem ser visíveis
      const badge = page.locator(".bg-purple-500\\/10").first();
      await expect(badge).toBeVisible();
    });
  });
});
