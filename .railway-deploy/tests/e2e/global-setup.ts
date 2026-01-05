import { chromium, FullConfig } from "@playwright/test";
import { ChildProcess, exec } from "node:child_process";
import path from "node:path";

let backendProcess: ChildProcess | null = null;

async function globalSetup(config: FullConfig) {
  // Any global setup can go here (programmatic login + storageState)
  console.log("🚀 Starting E2E tests...");

  // Iniciar backend se não estiver rodando
  if (!process.env.SKIP_BACKEND_START) {
    console.log("🔧 Starting backend server...");
    const projectRoot = config.rootDir || process.cwd();

    try {
      // ✅ Usar exec ao invés de spawn
      const backendDir = path.join(projectRoot, "backend");
      const command = `cd "${backendDir}" && npm run dev`;

      backendProcess = exec(command, {
        env: {
          ...process.env,
          NODE_ENV: "development",
        },
      });

      if (backendProcess.pid) {
        process.env.BACKEND_PID = backendProcess.pid.toString();
        console.log(`📝 Backend PID: ${backendProcess.pid}`);
      }

      // Capturar erros do processo
      backendProcess.on("error", (error) => {
        console.error("❌ Backend exec error:", error);
      });

      // ✅ Health check ao invés de timeout fixo
      console.log("⏳ Waiting for backend to be healthy...");
      let healthy = false;
      for (let attempt = 1; attempt <= 30; attempt++) {
        try {
          const response = await fetch("http://localhost:3001/health");
          if (response.ok) {
            healthy = true;
            console.log(`✅ Backend is healthy (attempt ${attempt}/30)`);
            break;
          }
        } catch (error) {
          // Backend ainda não respondeu
          if (attempt % 5 === 0) {
            console.log(`⏳ Still waiting... (attempt ${attempt}/30)`);
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!healthy) {
        console.warn("⚠️ Backend health check failed after 30s, tests may fail");
      }
    } catch (error) {
      console.error("❌ Failed to start backend:", error);
      console.warn("⚠️ Continuing without backend, tests will likely fail");
    }
  }

  const projectRoot = config.rootDir || process.cwd();
  const storagePath = path.join(projectRoot, "tests/e2e/storageState.json");

  // Usar credenciais padrão se não configuradas (para modo simple auth)
  const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "adm";
  const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "adm123";
  const baseURL = process.env.BASE_URL || "http://127.0.0.1:5173";
  const authMode = process.env.VITE_AUTH_MODE || "simple";

  // Pular criação de storage state se:
  // 1. App não tem login (modo demo)
  // 2. Credenciais não fornecidas
  // 3. Modo Google sem credenciais
  if (authMode === "google" && (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD)) {
    console.warn(
      "⚠️ Google auth mode requires TEST_USER_EMAIL and TEST_USER_PASSWORD. Skipping login storageState creation."
    );
    return;
  }

  // Se variável SKIP_AUTH_SETUP=true, pular setup de auth
  if (process.env.SKIP_AUTH_SETUP === "true") {
    console.log("⏭️ SKIP_AUTH_SETUP=true, skipping authentication setup.");
    return;
  }

  console.log(`📧 Using test credentials: ${TEST_USER_EMAIL} (mode: ${authMode})`);
  console.log(`🌐 Base URL: ${baseURL}`);
  console.log(`💾 Storage path: ${storagePath}`);

  // Em modo simple, usar credenciais padrão
  if (authMode === "simple") {
    console.log("✅ Simple auth mode - using default credentials (adm/adm123)");
  }

  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("🔐 Attempting login...");
    await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });

    // Aguardar página carregar completamente
    await page.waitForLoadState("domcontentloaded");
    console.log("📄 Page loaded");

    // Aguardar campos de login aparecerem (suporta SimpleAuth e Google OAuth)
    // Se não encontrar, continua sem falhar (app pode não ter login)
    try {
      await page.waitForSelector(
        'input[name="username"], input[name="email"], input[type="email"], input[type="text"], input[placeholder*="usuário" i], input[placeholder*="email" i]',
        { timeout: 10_000 }
      );
      console.log("📝 Login fields detected");
    } catch {
      console.warn(
        "⚠️ Login fields not found - app may not have login page. Continuing without auth setup."
      );
      await browser.close();
      return;
    }

    // Preencher formulário de login usando Test IDs com fallbacks robustos
    const usernameInput = page
      .getByTestId("login-username")
      .or(page.locator('input[name="username"], input[placeholder*="usuário" i]'));
    const emailInput = page
      .getByRole("textbox", { name: "Email" })
      .or(page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]'));
    const passwordInput = page
      .getByTestId("login-password")
      .or(
        page.locator(
          'input[name="password"], input[type="password"], input[placeholder*="senha" i], input[placeholder*="password" i]'
        )
      );

    // Detectar qual tipo de formulário (SimpleAuth ou Google OAuth)
    const isSimpleAuth = (await usernameInput.count()) > 0;
    console.log(`🔍 Auth mode detected: ${isSimpleAuth ? "SimpleAuth" : "Google OAuth"}`);

    if (isSimpleAuth) {
      await usernameInput.fill(TEST_USER_EMAIL);
      await passwordInput.fill(TEST_USER_PASSWORD);
      console.log(`✏️ Filled SimpleAuth credentials: ${TEST_USER_EMAIL}`);
    } else {
      await emailInput.fill(TEST_USER_EMAIL);
      await passwordInput.fill(TEST_USER_PASSWORD);
      console.log(`✏️ Filled Google OAuth credentials: ${TEST_USER_EMAIL}`);
    }

    // Clicar em submit usando Test ID (prioridade) ou ARIA role (fallback)
    const submitButton = page
      .getByTestId("login-submit")
      .or(page.getByRole("button", { name: "Entrar" }));
    await submitButton.click({ timeout: 10_000 });

    console.log("⏳ Waiting for navigation...");

    // Wait for navigation to dashboard or authenticated route
    await page.waitForURL("**/dashboard", { timeout: 15_000 }).catch(async () => {
      console.log("Dashboard URL not detected, checking for auth indicators...");
      // fallback wait for any auth badge / avatar or main content
      await page
        .getByRole("navigation")
        .or(page.getByTestId("sidebar-nav"))
        .waitFor({ timeout: 10_000 })
        .catch(() => {
          console.warn("Auth indicators not found, continuing anyway...");
          return null;
        });
    });

    await context.storageState({ path: storagePath });
    await browser.close();
    console.log(`✅ Storage state saved to ${storagePath}`);
  } catch (error) {
    console.warn("⚠️ Failed to create storage state during global setup:", error);
    console.log("ℹ️ Tests will run without pre-authenticated state.");
  }
}

export default globalSetup;
