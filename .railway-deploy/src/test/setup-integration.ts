/**
 * Setup para testes de integração REAIS
 * ⚠️ SEM MOCKS - Usa banco de dados e APIs reais
 */

import dotenv from "dotenv";
import path from "path";

// Carregar variáveis de ambiente de teste
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

// Validar que estamos em modo de teste
if (process.env.NODE_ENV !== "test") {
  throw new Error("Testes de integração devem rodar com NODE_ENV=test");
}

// Validar que DATABASE_URL está configurado
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurado para testes de integração");
}

// Logging para debug
console.log("🧪 Setup de Testes de Integração REAIS");
console.log("📊 Banco de dados:", process.env.DATABASE_URL?.split("@")[1] || "configurado");
console.log("⚠️  ATENÇÃO: Usando dados REAIS (sem mocks)");

// Configuração global para testes
globalThis.testConfig = {
  useRealDatabase: true,
  useRealAPIs: true,
  disableMocks: true,
  databaseUrl: process.env.DATABASE_URL,
};

// Limpar dados de teste após cada suite (opcional)
export async function clearTestData() {
  // Implementar limpeza segura de dados de teste
  console.log("🧹 Limpando dados de teste...");
}

// Hook global após todos os testes
if (typeof afterAll !== "undefined") {
  afterAll(async () => {
    await clearTestData();
    console.log("✅ Testes de integração concluídos");
  });
}
