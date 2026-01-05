import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env.test para testes de integração reais
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

export default defineConfig({
  test: {
    name: "integration-tests",
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/setup-integration.ts"],

    // ⚠️ TESTES REAIS - SEM MOCKS
    // Aumentar timeouts para operações reais
    testTimeout: 120000, // 2 minutos por teste
    hookTimeout: 60000, // 1 minuto para hooks

    // Executar sequencialmente para evitar race conditions no banco real
    pool: "forks",
    singleFork: true, // Um teste por vez

    // Isolamento total entre testes
    isolate: true,
    maxConcurrency: 1,

    // Incluir apenas testes de integração
    include: [
      "tests/integration/**/*.integration.test.ts",
      "tests/integration/**/*.test.ts",
      "src/**/*.integration.test.ts",
    ],

    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "tests/e2e/**",
      "src/**/*.test.ts", // Excluir testes unitários do src
      "src/**/*.test.tsx",
      "chrome-extension-pje/**",
    ],

    // Variáveis de ambiente para testes reais
    env: {
      NODE_ENV: "test",
      USE_REAL_DATABASE: "true",
      USE_REAL_APIS: "true",
      DISABLE_MOCKS: "true",
    },
  },
});
