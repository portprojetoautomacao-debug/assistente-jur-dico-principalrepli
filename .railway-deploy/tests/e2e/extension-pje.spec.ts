import { expect, test } from "@playwright/test";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXTENSION_DIR = path.resolve(__dirname, "../../chrome-extension-pje/dist");

// Minimal HTML for a fake PJe painel page used by the content script selectors
const FAKE_PJE_HTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>PJe Painel - Test</title>
  </head>
  <body>
    <div id="app">
      <div class="processo-row" data-processo>
        <div class="numero-processo">1234567-89.2025.8.26.0100</div>
        <div class="classe-processo">Procedimento Comum</div>
        <div class="assunto-processo">Dano Moral</div>
        <div class="parte-autor">Autor Teste</div>
        <div class="parte-reu">Empresa X</div>
        <div class="ultimo-movimento"><span class="data-movimento">2025-12-01</span></div>
      </div>
    </div>
  </body>
</html>`;

// This test requires a headed browser so we skip it by default in CI environments without Xvfb.
if (process.env.RUN_EXTENSION_E2E !== "true") {
  test.skip(
    true,
    "Skipping extension E2E - set RUN_EXTENSION_E2E=true to run locally with X server (xvfb)"
  );
}

test.describe("Chrome Extension E2E - PJe Sync", () => {
  let server: http.Server | null = null;
  let serverPort = 0;

  test.beforeAll(async () => {
    // Ensure extension build exists
    if (!fs.existsSync(EXTENSION_DIR)) {
      // Try to build extension
      console.warn("Extension dist not found, building extension...");
      const { execSync } = await import("child_process");
      execSync("npm run build", {
        cwd: path.resolve(__dirname, "../../chrome-extension-pje"),
        stdio: "inherit",
      });
    }

    // Start a local HTTP server that serves the fake PJe HTML
    server = http.createServer((req, res) => {
      res.writeHead(200, {
        "Content-Type": "text/html",
      });
      res.end(FAKE_PJE_HTML);
    });

    await new Promise<void>((resolve) => {
      server!.listen(0, "127.0.0.1", () => {
        const addr = server!.address();
        if (addr && typeof addr === "object") {
          serverPort = addr.port;
          console.log(`Test server listening at http://127.0.0.1:${serverPort}/pje/painel`);
        }
        resolve();
      });
    });
  });

  test.afterAll(async () => {
    if (server) server.close();
  });

  test("should load extension, inject content script and call backend sync", async ({}, testInfo) => {
    // Using chromium.launchPersistentContext to load extension
    const userDataDir = path.join(os.tmpdir(), `playwright-user-data-${Date.now()}`);
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`],
    });

    try {
      // Find service worker to set chrome.storage (API key) for APIClient
      const workers = context.serviceWorkers();
      if (workers.length === 0) {
        // Wait for service worker to be registered
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const sws = context.serviceWorkers();
      if (sws.length > 0) {
        const sw = sws[0];
        await sw.evaluate(async () => {
          // @ts-expect-error - chrome.* is available inside extension service worker
          await chrome.storage.sync.set({ apiKey: "playwright-test-key" });
        });
      }

      // Intercept network requests to backend sync endpoint
      let capturedRequestBody: any = null;
      await context.route("https://assistente-juridico-github.vercel.app/api/pje-sync", async (route) => {
        const request = route.request();
        try {
          const post = request.postData();
          if (post) capturedRequestBody = JSON.parse(post);
        } catch (e) {
          // ignore invalid JSON
        }
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, synced: 1 }),
        });
      });

      // Open page with url that contains pje/painel so the content script logic runs
      const page = await context.newPage();
      const url = `http://127.0.0.1:${serverPort}/pje/painel`;
      await page.goto(url, { waitUntil: "networkidle" });

      // Inject the content script as it runs only on https domain patterns defined in manifest
      const contentPath = path.join(EXTENSION_DIR, "content.js");
      if (fs.existsSync(contentPath)) {
        const contentScriptSource = fs.readFileSync(contentPath, "utf-8");
        await page.addScriptTag({ content: contentScriptSource });
      } else {
        throw new Error(
          "content.js not found in extension dist. Build the extension before running tests."
        );
      }

      // Wait for the extension to add the badge (content script adds #pje-sync-badge)
      await page.waitForSelector("#pje-sync-badge", { timeout: 10_000 });

      // The content script should trigger syncNow on initialization; wait for request to be captured
      await page.waitForTimeout(2000);

      expect(capturedRequestBody).not.toBeNull();
      expect(capturedRequestBody.type).toBe("SYNC_PROCESSOS");
      expect(Array.isArray(capturedRequestBody.data)).toBeTruthy();
      expect(capturedRequestBody.data.length).toBeGreaterThan(0);
    } finally {
      await context.close();
    }
  });
});
