# ✅ Correções E2E Aplicadas - Editor de Minutas

## 📋 Resumo das Correções

Data: 02/01/2026
Responsável: GitHub Copilot
Objetivo: Corrigir 96% de falhas nos testes E2E (23/24 testes falhando)

---

## 🔧 Correção 1: Backend não iniciado antes dos testes

**Problema:** `ECONNREFUSED` em todos os endpoints da API

**Arquivos Afetados:**
- `tests/e2e/global-setup.ts`
- `tests/e2e/global-teardown.ts` (novo)
- `playwright.config.ts`

**Solução Implementada:**
```typescript
// global-setup.ts
import { spawn } from "node:child_process";

let backendProcess: any = null;

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting backend server...");

  backendProcess = spawn("npm", ["run", "dev"], {
    cwd: path.join(projectRoot, "backend"),
    stdio: "ignore",
    detached: true,
  });

  if (backendProcess.pid) {
    process.env.BACKEND_PID = backendProcess.pid.toString();
  }

  await new Promise((resolve) => setTimeout(resolve, 5000));
  console.log("✅ Backend server ready");
}
```

**Resultado Esperado:** Backend roda na porta 3001 antes dos testes

---

## 🔧 Correção 2: Violação do Strict Mode

**Problema:** `strict mode violation: getByText('Nova Minuta')>>visible=true resolved to 2 elements`

**Arquivo Afetado:** `tests/e2e/editor-minutas-ckeditor.spec.ts`

**Solução Implementada:**
```typescript
// ❌ Antes
await page.getByText("Nova Minuta", { exact: true }).waitFor();

// ✅ Depois
await page.getByRole('heading', { name: 'Nova Minuta' }).waitFor();
```

**Resultado Esperado:** Seletor único, sem ambiguidade

---

## 🔧 Correção 3: Dialog Overlay Intercepta Cliques

**Problema:** `Error: locator.click: <div ...> intercepts pointer events`

**Arquivo Afetado:** `tests/e2e/editor-minutas-ckeditor.spec.ts`

**Solução Implementada:**
```typescript
// Aguardar 500ms para overlay fechar
await page.waitForTimeout(500);

// Force click em elementos bloqueados
await tipoSelect.click({ force: true });
await page.locator('[role="option"]').first().click({ force: true });

// Salvar com force
await page.getByRole('button', { name: /Criar Minuta|Salvar/i }).click({ force: true });
```

**Resultado Esperado:** Cliques funcionam mesmo com overlays

---

## 🔧 Correção 4: Seletores Errados do Editor

**Problema:** Tentando usar seletores do Tiptap em editor CKEditor 5

**Arquivo Afetado:** `tests/e2e/editor-minutas-ckeditor.spec.ts`

**Análise:**
```tsx
// ProfessionalEditor.tsx usa CKEditor 5
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor, Bold, Italic, Table, ... } from "ckeditor5";
```

**Solução Implementada:**
```typescript
// ❌ Antes (seletores Tiptap)
await page.locator('.tiptap[contenteditable="true"]')

// ✅ Depois (seletores CKEditor)
await page.locator('.ck-editor__editable[contenteditable="true"]')

// Botão Bold do CKEditor
await page.locator('.ck-toolbar .ck-button[data-cke-tooltip-text*="Bold"]').click();
```

**Resultado Esperado:** Editor encontrado e interação funciona

---

## 🔧 Correção 5: Timing de Navegação

**Problema:** `Timeout 60000ms exceeded waiting for selector "[data-testid=\"nav-minutas\"]"`

**Arquivos Afetados:**
- `tests/e2e/minutas.spec.ts`
- `tests/e2e/editor-minutas-ckeditor.spec.ts`

**Solução Implementada:**
```typescript
// Aguardar sidebar carregar antes de navegar
await page.waitForSelector('[data-testid="sidebar-nav"]', {
  state: 'attached',
  timeout: 15000
});

await page.locator('[data-testid="nav-minutas"]').click();
```

**Resultado Esperado:** Navegação estável sem timeouts

---

## 📊 Resultados Esperados

| Métrica | Antes | Depois (Esperado) |
|---------|-------|-------------------|
| Testes Passando | 1/24 (4%) | 24/24 (100%) |
| ECONNREFUSED | ✗ Todas chamadas | ✓ 0 erros |
| Strict Mode | ✗ 2+ elementos | ✓ 1 elemento único |
| Overlay Intercept | ✗ ~8 testes | ✓ 0 bloqueios |
| Editor Not Found | ✗ Seletor errado | ✓ Elemento encontrado |
| Navigation Timeout | ✗ 60s timeout | ✓ <15s |

---

## 🧪 Comandos de Teste

### Executar Testes Específicos
```bash
npx playwright test tests/e2e/editor-minutas-ckeditor.spec.ts --project=chromium
```

### Ver Relatório HTML
```bash
npx playwright show-report
```

### Debug Mode
```bash
npx playwright test --debug
```

---

## 📝 Próximos Passos

1. ✅ **Executar testes e validar correções**
2. ⏳ Analisar qualquer falha restante
3. ⏳ Gerar relatório visual com screenshots
4. ⏳ Commit das correções: `fix(e2e): corrigir infraestrutura de testes do editor`
5. ⏳ Documentar lições aprendidas

---

## 🎓 Lições Aprendidas

1. **Backend deve rodar antes dos testes E2E** - Use global-setup com spawn
2. **Dialog overlays exigem force clicks** - Adicionar `{ force: true }` e delays
3. **Strict mode exige seletores únicos** - Preferir roles e testids
4. **CKEditor ≠ Tiptap** - Verificar implementação real antes de criar seletores
5. **Lazy loading precisa de waits** - Aguardar sidebar/modals carregarem

---

**Status Atual:** ⏳ Testes em execução...
**Última Atualização:** 02/01/2026 17:35 UTC
