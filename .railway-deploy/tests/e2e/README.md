# 🧪 Testes E2E - Playwright

## 📋 Visão Geral

Testes end-to-end automatizados usando Playwright para validar funcionalidades críticas do Assistente Jurídico PJe.

## 🚀 Configuração Rápida

### 1. Instalar Dependências

```bash
npm install
npx playwright install chromium firefox
```

## 🧩 Teste da Extensão Chrome (PJe Sync)

Este repositório inclui um teste E2E que valida a integração completa da extensão Chrome (background + content script + backend). Esse teste é sensível ao ambiente, pois precisa carregar uma extensão no Chrome (somente em modo headed) e interceptar chamadas ao backend.

### Como executar localmente

1. Construa a extensão:

```bash
cd chrome-extension-pje && npm install && npm run build
```

2. Execute os testes com suporte a interface (headed). Requer Xvfb no CI ou uma sessão gráfica local:

```bash
# Local (com interface)
RUN_EXTENSION_E2E=true npm run test:e2e -- --project=chromium --headed

# Em CI com Xvfb
xvfb-run -a sh -c "RUN_EXTENSION_E2E=true npm run test:e2e -- --project=chromium --headed"
```

### Executando com API local (desenvolvimento com proxy local)

Se quiser usar a API local (em vez do proxy para a produção), execute o servidor de frontend e API local:

```bash
# Inicia Vite + API dev local (porta 5252)
npm run dev:with-api
```

Em seguida, em outro terminal, execute os testes E2E:

```bash
npm run test:e2e

Você também pode apontar o proxy `/api` do Vite para um destino personalizado definindo a env var `VITE_API_TARGET` ou desabilitar o proxy com `DISABLE_API_PROXY=true`.
```

### Observações

- O teste é **pulável por padrão** (usa `test.skip`) porque exige um navegador headed com suporte a extensões. Use `RUN_EXTENSION_E2E=true` para habilitá-lo.
- Ao executar em CI, certifique-se de instalar dependências do Playwright e de um servidor X virtual (xvfb).
- O teste injeta um conteúdo de exemplo para simular o painel PJe e intercepta a requisição ao endpoint `/api/pje-sync` para validar o payload.

### 2. Configurar Credenciais de Teste

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

**Arquivo `.env` mínimo para testes:**

```env
# Modo de autenticação
VITE_AUTH_MODE=simple

# Credenciais de teste (padrão para modo simple)
TEST_USER_EMAIL=adm
TEST_USER_PASSWORD=adm123

# URL base para testes
BASE_URL=http://127.0.0.1:5173
USE_PROD_BASE_URL=false
```

### 3. Executar Testes

```bash
# Todos os testes (headless)
npm run test:e2e

# Modo interativo (headed)
npm run test:e2e:headed

# Modo debug
npm run test:e2e:debug

# Ver relatório HTML
npx playwright show-report
```

## 🧩 Estrutura de Testes

```
tests/e2e/
├── global-setup.ts       # Setup global: login e storageState
├── basic.spec.ts         # Testes básicos de navegação
├── agents-ui.spec.ts     # Testes da interface de agentes
├── app-flow.spec.ts      # Fluxos completos da aplicação
├── navigation.spec.ts    # Navegação entre páginas
├── forms.spec.ts         # Formulários e inputs
├── advanced-flows.spec.ts # Fluxos avançados
├── monitoring.spec.ts    # Monitoramento e métricas
└── storageState.json     # Estado de autenticação (gerado)
```

## 🔐 Autenticação nos Testes

### Modo Simple (Padrão)

- **Usuário:** `adm`
- **Senha:** `adm123`
- **Configuração:** `VITE_AUTH_MODE=simple`

### Modo Google OAuth

- **Requer:** Credenciais reais do Google
- **Configuração:**
  - `VITE_AUTH_MODE=google`
  - `TEST_USER_EMAIL=seu-email@gmail.com`
  - `TEST_USER_PASSWORD=sua-senha`

## 📊 Global Setup

O arquivo `global-setup.ts` executa automaticamente antes de todos os testes:

1. **Detecta modo de autenticação** (`VITE_AUTH_MODE`)
2. **Usa credenciais padrão** se não configuradas (modo simple)
3. **Realiza login programático**
4. **Salva storageState** para reusar em todos os testes
5. **Logs detalhados** para debug

### Comportamento

- ✅ **Modo simple SEM credenciais:** Usa `adm/adm123` automaticamente
- ✅ **Modo simple COM credenciais:** Usa as credenciais configuradas
- ⚠️ **Modo google SEM credenciais:** Pula autenticação (testes podem falhar)
- ✅ **Modo google COM credenciais:** Tenta autenticar via Google

## 🎯 Modos de Execução

### Headless (Padrão CI/CD)

```bash
npm run test:e2e
# ou
npx playwright test
```

### Headed (Ver browser)

```bash
npm run test:e2e:headed
# ou
npx playwright test --headed
```

### Debug (Inspector)

```bash
npm run test:e2e:debug
# ou
npx playwright test --debug
```

### Modo UI Interativo

```bash
npx playwright test --ui
```

## 🔧 Configuração Avançada

### Testar Contra Produção

```env
USE_PROD_BASE_URL=true
```

Ou via CLI:

```bash
USE_PROD_BASE_URL=true npm run test:e2e
```

### Testar URL Customizada

```bash
BASE_URL=https://staging.example.com npm run test:e2e
```

### Teste Rápido de Login

```bash
# Script automatizado que testa apenas o login
./test-e2e-login.sh
```

### Browsers Específicos

```bash
# Apenas Chrome
npx playwright test --project=chromium

# Apenas Firefox
npx playwright test --project=firefox

# Apenas Safari (requer instalação)
npx playwright test --project=webkit
```

## 📝 Escrevendo Novos Testes

### Exemplo Básico

```typescript
import { test, expect } from "@playwright/test";

test("deve fazer X", async ({ page }) => {
  await page.goto("/");

  // Usar seletores robustos
  const heading = page.getByRole("heading", { name: /Dashboard/i });
  await expect(heading).toBeVisible();

  // Interagir com elementos
  await page.getByRole("button", { name: /Novo Processo/i }).click();

  // Aguardar navegação
  await page.waitForURL("**/processos/novo");
});
```

### Boas Práticas

1. **Use seletores semânticos:**
   - ✅ `page.getByRole('button', { name: /Salvar/i })`
   - ❌ `page.locator('button.btn-primary')`

2. **Aguarde estados de rede:**
   - `await page.waitForLoadState('networkidle')`

3. **Trate elementos dinâmicos:**
   - Use `.first()` ou `.nth(0)` para múltiplos matches

4. **Adicione timeouts adequados:**
   - `{ timeout: 10_000 }` para operações lentas

## 🐛 Troubleshooting

### ❌ "Storage state not found"

**Solução:** Configure credenciais no `.env`:

```env
TEST_USER_EMAIL=adm
TEST_USER_PASSWORD=adm123
VITE_AUTH_MODE=simple
```

### ❌ "Timeout waiting for input fields"

**Problema:** Global-setup não encontra campos de login.

**Solução:**

1. ✅ **JÁ CORRIGIDO**: SimpleAuth agora tem atributos testáveis
2. Execute teste rápido: `./test-e2e-login.sh`
3. Verifique se VITE_AUTH_MODE=simple no .env
4. Teste login manual em http://127.0.0.1:5173 (adm/adm123)
5. Use debug mode: `npx playwright test --debug`
6. Ver guia completo: `E2E_LOGIN_TROUBLESHOOTING.md`

### ❌ "Element not found"

**Solução:**

1. Aumente timeout: `{ timeout: 15_000 }`
2. Aguarde networkidle: `await page.waitForLoadState('networkidle')`
3. Use seletores mais genéricos

### ❌ "Navigation timeout"

**Solução:**

1. Verifique se o servidor dev está rodando (`npm run dev`)
2. Aumente timeout no `playwright.config.ts`
3. Use `waitUntil: 'domcontentloaded'` se aceitável

### ❌ "Tests skipped due to auth"

**Solução:**

- Modo simple: Credenciais são automáticas, verifique se `VITE_AUTH_MODE=simple`
- Modo google: Configure `TEST_USER_EMAIL` e `TEST_USER_PASSWORD`

## 📊 Relatórios

### HTML Report

```bash
# Gerar e abrir relatório
npx playwright show-report
```

### CI/CD Reports

- Artefatos salvos em `playwright-report/`
- Screenshots de falhas em `test-results/`
- Videos de testes falhados (se habilitado)

## 🔄 Integração CI/CD

### GitHub Actions

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium firefox

- name: Run E2E Tests
  run: npm run test:e2e
  env:
    TEST_USER_EMAIL: adm
    TEST_USER_PASSWORD: adm123
    VITE_AUTH_MODE: simple

- name: Upload Report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 📚 Documentação Oficial

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)

## ✅ Checklist Antes de Commitar

- [ ] Todos os testes passam localmente
- [ ] `.env` não foi commitado
- [ ] Novos testes têm descriptions claras
- [ ] Seletores são robustos (semantic/role-based)
- [ ] Timeouts adequados configurados
- [ ] README atualizado se necessário
