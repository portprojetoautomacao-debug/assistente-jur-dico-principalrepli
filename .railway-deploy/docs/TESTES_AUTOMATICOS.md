# Configuração de Testes Automáticos
# Assistente Jurídico PJe - v1.4.0
# Data: 09/12/2024

## ?? Visão Geral

Este documento descreve o sistema de testes automáticos com auto-correção implementado no projeto.

## ?? Estrutura de Testes

```
testes/
??? src/**/*.test.ts(x)         # Testes unitários frontend (Vitest + React Testing Library)
??? api/**/*.test.ts            # Testes de API backend (Vitest + Node)
??? chrome-extension-pje/tests/ # Testes da extensão Chrome (Vitest + jsdom)
??? tests/e2e/                  # Testes E2E (Playwright)
```

## ?? Scripts de Auto-Fix

### 1. Auto-Fix Completo

```bash
# Bash (Linux/macOS/Git Bash)
./scripts/auto-fix-tests.sh

# PowerShell (Windows)
.\scripts\auto-fix-tests.ps1
```

**O que faz:**
1. ? ESLint com auto-fix
2. ? Prettier format
3. ? Remove imports não utilizados
4. ? Executa testes com auto-fix de problemas comuns
5. ? Atualiza snapshots quando necessário
6. ? Limpa cache de testes
7. ? Verifica TypeScript
8. ? Gera relatório de cobertura

### 2. Tasks do VS Code

**Executar via Command Palette (`Ctrl+Shift+P`):**

| Task | Descrição |
|------|-----------|
| `test:auto-fix` | Executa auto-fix completo dos testes |
| `test:auto-fix:watch` | Auto-fix contínuo (re-executa a cada 60s) |
| `test:update-snapshots` | Atualiza snapshots de componentes |
| `test:clear-cache` | Limpa cache de testes |
| `test:full-pipeline` | Pipeline completo (cache ? snapshots ? testes ? coverage) |

## ?? Comandos de Teste

### Testes Unitários (Frontend)

```bash
# Watch mode (desenvolvimento)
npm run test

# Executar uma vez
npm run test:run

# Interface visual
npm run test:ui

# Coverage
npm run test:coverage
```

### Testes de API (Backend)

```bash
# Executar testes de API
npm run test:api

# Watch mode
npm run test:api -- --watch
```

### Testes da Extensão Chrome

```bash
# Entrar na pasta da extensão
cd chrome-extension-pje

# Executar testes
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Testes E2E

```bash
# Headless (sem interface)
npm run test:e2e

# Com interface
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

### Todos os Testes

```bash
# Executar todos os testes (unit + API + Chrome)
npm run test:all
```

## ?? Auto-Correções Implementadas

### 1. ESLint Auto-Fix

Corrige automaticamente:
- Indentação
- Ponto-e-vírgula
- Aspas simples/duplas
- Espaçamento
- Imports não utilizados

### 2. Prettier Format

Formata automaticamente:
- Alinhamento de código
- Quebras de linha
- Organização de imports

### 3. Snapshots

Atualiza automaticamente:
- Snapshots de componentes React
- Snapshots de saídas JSON
- Snapshots de markup HTML

### 4. TypeScript

Corrige automaticamente quando possível:
- Gera declarações de tipos
- Atualiza interfaces
- Resolve problemas de tipagem simples

### 5. Cache de Testes

Limpa automaticamente:
- Cache do Vitest
- Cache do Playwright
- Artefatos de testes antigos

## ?? Relatórios de Testes

### Coverage Report

Após executar `npm run test:coverage`, o relatório estará disponível em:

```
coverage/
??? index.html          # Relatório visual interativo
??? lcov.info          # Dados para ferramentas CI/CD
??? coverage-final.json # Dados JSON
```

**Abrir no navegador:**
```bash
# Linux/macOS
open coverage/index.html

# Windows
start coverage/index.html
```

### Playwright Report

Após executar `npm run test:e2e`, o relatório estará em:

```
playwright-report/
??? index.html
```

**Visualizar:**
```bash
npm run test:e2e:report
```

## ?? Padrões de Teste

### 1. Testes Unitários de Componentes

```typescript
// MinutasManager.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MinutasManager from '../MinutasManager'

describe('MinutasManager', () => {
  it('deve renderizar lista de minutas', () => {
    render(<MinutasManager />)
    expect(screen.getByText(/minutas/i)).toBeInTheDocument()
  })
  
  it('deve filtrar minutas por status', async () => {
    render(<MinutasManager />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'rascunho' } })
    
    await waitFor(() => {
      expect(screen.queryByText('Finalizada')).not.toBeInTheDocument()
    })
  })
})
```

### 2. Testes de API

```typescript
// kv.test.ts
import { describe, it, expect } from 'vitest'

describe('KV Storage API', () => {
  it('deve salvar e recuperar dados', async () => {
    const response = await fetch('/api/kv', {
      method: 'POST',
      body: JSON.stringify({ key: 'test', value: { data: 'test' } })
    })
    
    expect(response.ok).toBe(true)
    
    const get = await fetch('/api/kv?key=test')
    const data = await get.json()
    
    expect(data.value.data).toBe('test')
  })
})
```

### 3. Testes E2E

```typescript
// app-flow.spec.ts
import { test, expect } from '@playwright/test'

test('fluxo completo de criação de minuta', async ({ page }) => {
  await page.goto('/')
  
  // Login
  await page.click('text=Entrar')
  await page.fill('[name=email]', 'test@example.com')
  await page.fill('[name=password]', 'password')
  await page.click('button[type=submit]')
  
  // Acessar minutas
  await page.click('text=Minutas')
  await expect(page).toHaveURL(/\/minutas/)
  
  // Criar nova minuta
  await page.click('text=Nova Minuta')
  await page.fill('[name=titulo]', 'Teste E2E')
  await page.selectOption('[name=tipo]', 'peticao')
  await page.click('button:has-text("Salvar")')
  
  // Verificar criação
  await expect(page.locator('text=Teste E2E')).toBeVisible()
})
```

## ?? Troubleshooting

### Testes Falhando Constantemente

**Solução:**
```bash
# 1. Limpar cache
npm run test:clear-cache

# 2. Atualizar snapshots
npm run test:update-snapshots

# 3. Re-executar
npm run test:run
```

### Erros de Imports

**Solução:**
```bash
# Auto-fix com ESLint
npm run lint -- --fix

# Verificar tipo
npm run type-check
```

### Coverage Baixo

**Solução:**
1. Executar coverage: `npm run test:coverage`
2. Abrir relatório HTML: `coverage/index.html`
3. Identificar arquivos sem cobertura
4. Adicionar testes para esses arquivos

### E2E Timeout

**Solução:**
```typescript
// Aumentar timeout em playwright.config.ts
export default defineConfig({
  timeout: 120_000, // 2 minutos
})
```

## ?? Recursos Adicionais

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## ?? Checklist de Testes

Antes de fazer commit:

- [ ] Todos os testes unitários passando
- [ ] Testes de API passando
- [ ] Coverage > 70%
- [ ] Sem erros TypeScript
- [ ] ESLint sem avisos críticos
- [ ] Snapshots atualizados
- [ ] E2E críticos passando (se aplicável)

## ?? CI/CD

Os testes são executados automaticamente em:

1. **Pull Requests**: Todos os testes devem passar
2. **Push para main**: Pipeline completo
3. **Deploy**: Validação E2E em produção

**Workflow GitHub Actions:**
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm install
      - run: npm run test:all
      - run: npm run test:e2e
```

---

**Versão:** 1.4.0  
**Última atualização:** 09/12/2024  
**Status:** ? Operacional
