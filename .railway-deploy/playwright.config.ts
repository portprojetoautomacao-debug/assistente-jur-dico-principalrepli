import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

const PORT = process.env.PORT || "5173";
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;
const USE_PROD = process.env.USE_PROD_BASE_URL === "true";
const IS_CI = process.env.CI === "true" || !!process.env.GITHUB_ACTIONS;

export default defineConfig({
  testDir: "tests/e2e",

  // Use path (string) for ESM compatibility
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",

  // Timeout configuration
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },

  // Paralelização
  // Mantém paralelização em CI para melhor performance, conforme recomendação CodeQL.
  fullyParallel: true,
  workers: IS_CI ? 2 : 4,

  // Retry configuration
  retries: IS_CI ? 2 : 0,

  // Reporters
  reporter: [
    ["html", { open: "never" }],
    ["list"],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  // Inicia servidor de desenvolvimento automaticamente
  webServer: USE_PROD
    ? undefined
    : {
        command:
          process.platform === "win32"
            ? `node scripts/start-dev-with-api.cjs --port ${PORT} --host 127.0.0.1`
            : `node scripts/start-dev-with-api.cjs --port ${PORT} --host 127.0.0.1`,
        url: `http://127.0.0.1:${PORT}`,
        // SEMPRE reutilizar servidor existente para evitar conflitos de porta
        reuseExistingServer: true,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
        // Configurar proxy do Vite para apontar as /api para a API local de testes
        env: {
          ...(process.env || {}),
          DISABLE_API_PROXY: "false",
          VITE_API_TARGET: `http://127.0.0.1:${process.env.DEV_API_PORT || 5252}`,
        },
      },
  use: {
    // Preferir ambiente local por padrão para maior estabilidade dos seletores.
    // Permite sobrescrever via BASE_URL ou setando USE_PROD_BASE_URL=true
    baseURL: USE_PROD ? "https://assistente-juridico-github.vercel.app" : BASE_URL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    // Sempre usar headless: true em dev containers sem servidor X11 (Linux, CI, Codespaces, etc).
    // Para debug local com interface gráfica, execute: npx playwright test --headed
    headless: true,
    storageState: fs.existsSync("tests/e2e/storageState.json")
      ? "tests/e2e/storageState.json"
      : undefined,
  },
  projects: [
    {
      name: "chromium",
      // Use Chromium bundled by Playwright to avoid relying on system Google Chrome
      // Força headless explicitamente para evitar erro de XServer em containers
      use: { ...devices["Desktop Chromium"], channel: "chromium", headless: true },
    },
    { name: "firefox", use: { ...devices["Desktop Firefox"], headless: true } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
