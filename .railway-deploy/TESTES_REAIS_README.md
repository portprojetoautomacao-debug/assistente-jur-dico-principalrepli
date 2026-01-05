# Guia de Testes Reais - Sem Mocks

## ⚠️ Regra de Ética do Projeto

**É PROIBIDO usar qualquer tipo de simulação:**
- ❌ Stubs
- ❌ Mocks (vi.mock, vi.fn)
- ❌ Synthetic Data
- ❌ Fake Data
- ❌ Dummy Data
- ❌ Test Doubles

**✅ PERMITIDO:**
- Testes com banco de dados real
- Testes com APIs reais
- Testes E2E com aplicação real
- Dados reais de teste (que são limpos após)

## 📋 Tipos de Testes

### 1. Testes de Integração (Novos)
**Arquivo:** `tests/integration/*.integration.test.ts`
**Config:** `vitest.integration.config.ts`

```bash
# Executar testes de integração
npm run test:integration

# Watch mode
npm run test:integration:watch
```

**Características:**
- Usa PostgreSQL real (DATABASE_URL do .env.test)
- Usa APIs reais (Anthropic, etc)
- Timeout maior (2min por teste)
- Execução sequencial (1 teste por vez)
- Cleanup automático após testes

### 2. Testes E2E (Playwright)
**Arquivo:** `tests/e2e/*.spec.ts`

```bash
npm run test:e2e
npm run test:e2e:ui
```

**Características:**
- Navegador real (Chromium/Firefox)
- Interface real do app
- Backend real rodando
- Dados reais

### 3. Testes Unitários (Refatorar)
**Status:** ⚠️ PRECISAM SER REFATORADOS
**Problema:** Usam mocks (vi.mock, vi.fn)

## 🛠️ Como Criar Testes Reais

### Exemplo: Teste de Service

```typescript
// ❌ ERRADO - Usando mocks
import { vi } from "vitest";
const mockDb = vi.fn();

// ✅ CORRETO - Usando banco real
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMinuta, deleteMinuta } from "@/services/minuta-service";

describe("Minuta Service - Real", () => {
  let testId: string;

  afterAll(async () => {
    // Limpar dados de teste
    if (testId) await deleteMinuta(testId);
  });

  it("deve criar minuta no banco real", async () => {
    const minuta = await createMinuta({
      titulo: `Test-${Date.now()}`,
      conteudo: "Teste real",
    });

    expect(minuta.id).toBeDefined();
    testId = minuta.id;
  });
});
```

### Exemplo: Teste de API

```typescript
// ✅ CORRETO - Chamada HTTP real
describe("API Agents - Real", () => {
  it("deve executar agente real", async () => {
    const response = await fetch("http://localhost:3001/api/agents/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: "harvey-specter",
        task: "Análise de caso X",
      }),
    });

    const result = await response.json();
    expect(result.result).toBeDefined();
  }, 60000); // Timeout para API real
});
```

## 🔧 Configuração

### .env.test (Obrigatório)

```bash
# Banco de Dados de Teste (PostgreSQL real)
DATABASE_URL=postgresql://user:pass@host:5432/test_db

# APIs Reais (usar chaves de teste quando disponível)
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...

# Configurações de Teste
NODE_ENV=test
USE_REAL_DATABASE=true
USE_REAL_APIS=true
DISABLE_MOCKS=true
```

### vitest.integration.config.ts

```typescript
export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 120000, // 2 minutos
    maxConcurrency: 1,   // 1 teste por vez
    isolate: true,       // Isolamento total
    env: {
      USE_REAL_DATABASE: "true",
      DISABLE_MOCKS: "true",
    },
  },
});
```

## 📊 Execução dos Testes

### Testes de Integração (Recomendado)

```bash
# Executar todos os testes de integração
npm run test:integration

# Watch mode para desenvolvimento
npm run test:integration:watch

# Com cobertura
npm run test:integration -- --coverage
```

### Todos os Testes

```bash
# Unitários + API + Integração
npm run test:all

# E2E completo
npm run test:e2e
```

## ⚠️ Importante

### Antes de Rodar Testes de Integração:

1. **Backend rodando:**
   ```bash
   cd backend && npm run dev
   ```

2. **Banco de dados acessível:**
   - PostgreSQL deve estar rodando
   - DATABASE_URL válido em .env.test

3. **APIs configuradas:**
   - ANTHROPIC_API_KEY válido
   - Outras chaves necessárias

### Cleanup Automático

Os testes de integração limpam dados automaticamente após execução:

```typescript
afterAll(async () => {
  // Deletar dados de teste
  if (testId) await deleteTestData(testId);
});
```

## 🚀 Roadmap de Refatoração

### ✅ Completo
- [x] Configuração de testes de integração
- [x] Testes de integração para Minutas Service
- [x] Testes de integração para Agentes

### 🔄 Em Progresso
- [ ] Refatorar testes com mocks do Chrome Extension
- [ ] Refatorar testes com mocks de Services
- [ ] Refatorar testes com mocks de Hooks

### 📋 Pendente
- [ ] Documentar padrões de cleanup
- [ ] CI/CD para testes de integração
- [ ] Ambiente de testes isolado

## 🎯 Objetivo Final

**100% dos testes usando dados e sistemas reais, ZERO mocks!**
