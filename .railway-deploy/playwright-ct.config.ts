import { defineConfig, devices } from "@playwright/experimental-ct-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: "tests/ct",
  snapshotDir: "tests/ct/__snapshots__",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-ct" }]],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    // Porta dedicada para CT (evita conflitar com dev server principal)
    ctPort: 61000,
    headless: true,
    trace: "on-first-retry",
    video: "off",
    screenshot: "only-on-failure",
    // Usa o Vite do projeto com alias "@" resolvido
    ctViteConfig: {
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "src"),
        },
      },
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chromium"], headless: true },
    },
  ],
});
