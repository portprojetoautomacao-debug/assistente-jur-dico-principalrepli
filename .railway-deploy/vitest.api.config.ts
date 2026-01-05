import dotenv from "dotenv";
import fs from "node:fs";
import path, { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prefer .env.test; fallback to .env.local then .env (sem placeholders)
for (const envFile of [".env.test", ".env.local", ".env"]) {
  const envPath = path.resolve(__dirname, envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["api/**/*.test.ts", "backend/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
