import { expect, test } from "@playwright/test";

test.describe("Captura e Monitoramento", () => {
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

  test("deve capturar screenshots", async ({ page }) => {
    // browser_take_screenshot
    await page.screenshot({ path: "tests/screenshots/homepage.png", fullPage: true });

    const element = page.locator("body");
    await element.screenshot({ path: "tests/screenshots/element.png" });
  });

  test("deve capturar snapshots de acessibilidade", async ({ page }) => {
    // Verificar acessibilidade usando getByRole (melhor prática no Playwright 1.57+)
    // page.accessibility.snapshot() foi removido - usar roles e ARIA
    const mainContent = page.getByRole("main").or(page.locator("main, #root"));
    await expect(mainContent.first()).toBeVisible();

    // Verificar que elementos interativos têm roles acessíveis
    const headings = await page.getByRole("heading").count();
    expect(headings).toBeGreaterThan(0);
  });

  test("deve monitorar mensagens do console", async ({ page }) => {
    const messages: string[] = [];

    // browser_console_messages
    page.on("console", (msg) => {
      messages.push(`${msg.type()}: ${msg.text()}`);
    });

    await page.goto("/");
    await page.waitForTimeout(1000);

    // Verifica se capturou alguma mensagem
    console.log(`Capturadas ${messages.length} mensagens do console`);
  });

  test("deve monitorar requisições de rede", async ({ page }) => {
    const requests: string[] = [];

    // browser_network_requests
    page.on("request", (request) => {
      requests.push(request.url());
    });

    page.on("response", (response) => {
      console.log(`${response.status()} ${response.url()}`);
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(requests.length).toBeGreaterThan(0);
  });

  test("deve lidar com diálogos", async ({ page }) => {
    // browser_handle_dialog
    page.on("dialog", async (dialog) => {
      expect(dialog.type()).toBeTruthy();
      await dialog.accept();
    });

    await page.goto("/");

    // Se houver algum alert/confirm/prompt, será tratado
    await page.evaluate(() => {
      // Exemplo: window.alert('teste');
    });
  });

  test("deve executar JavaScript", async ({ page }) => {
    await page.goto("/");

    // browser_evaluate
    const title = await page.evaluate(() => document.title);
    expect(title).toBeTruthy();

    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toBeTruthy();

    // Pode executar código mais complexo
    const appVersion = await page.evaluate(() => {
      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        online: navigator.onLine,
      };
    });

    expect(appVersion.online).toBe(true);
  });

  test("deve redimensionar navegador", async ({ page }) => {
    await page.goto("/");

    // browser_resize
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.waitForTimeout(500);

    await page.setViewportSize({ width: 1280, height: 720 }); // Desktop padrão
  });
});

test.afterAll(async () => {
  // browser_close - fecha automaticamente após os testes
  console.log("Testes concluídos");
});
