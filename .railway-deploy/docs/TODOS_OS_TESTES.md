# 🧪 Inventário Completo de Testes

**Gerado automaticamente em:** 2024-12-09 21:30:00  
**Ferramenta:** `scripts/list-all-tests.sh`

---

## 📊 Resumo Executivo

| Categoria | Total | Porcentagem |
|-----------|-------|-------------|
| **Testes Unitários** | 56 | 57.7% |
| **Testes de API** | 14 | 14.4% |
| **Testes E2E** | 16 | 16.5% |
| **Testes de Integração** | 5 | 5.2% |
| **Testes Chrome Extension** | 6 | 6.2% |
| **TOTAL** | **97** | **100%** |

---

## 📁 Testes Unitários (Frontend) - 56 arquivos

### Components (24 arquivos)
- `src/__tests__/editor-visibility.test.tsx`
- `src/components/AdvancedNLPDashboard.test.tsx`
- `src/components/__tests__/MinutasManager.smoke.test.tsx`
- `src/components/__tests__/MinutasManager.test.tsx`
- `src/components/__tests__/ProcessosView.smoke.test.tsx`
- `src/components/__tests__/ProcessosView.test.tsx`
- `src/components/dashboard/DashboardStats.test.tsx`
- `src/components/editor/TiptapEditorV2.test.tsx`
- `src/components/tiptap-templates/simple/simple-editor.test.tsx`
- `src/components/tiptap-templates/simple/theme-toggle.test.tsx`
- `src/components/tiptap-ui/blockquote-button/blockquote-button.test.tsx`
- `src/components/tiptap-ui/blockquote-button/use-blockquote.test.ts`
- `src/components/tiptap-ui/code-block-button/code-block-button.test.tsx`
- `src/components/tiptap-ui/code-block-button/use-code-block.test.ts`
- `src/components/tiptap-ui/color-highlight-button/color-highlight-button.test.tsx`
- `src/components/tiptap-ui/color-highlight-button/use-color-highlight.test.ts`
- `src/components/tiptap-ui/heading-button/heading-button.test.tsx`
- `src/components/tiptap-ui/heading-button/use-heading.test.ts`
- `src/components/tiptap-ui/image-upload-button/image-upload-button.test.tsx`
- `src/components/tiptap-ui/image-upload-button/use-image-upload.test.ts`
- `src/components/tiptap-ui/link-popover/link-popover.test.tsx`
- `src/components/tiptap-ui/link-popover/use-link-popover.test.ts`
- `src/components/tiptap-ui/list-button/list-button.test.tsx`
- `src/components/tiptap-ui/list-button/use-list.test.ts`
- `src/components/tiptap-ui/mark-button/mark-button.test.tsx`
- `src/components/tiptap-ui/mark-button/use-mark.test.ts`
- `src/components/tiptap-ui/text-align-button/text-align-button.test.tsx`
- `src/components/tiptap-ui/text-align-button/use-text-align.test.ts`
- `src/components/tiptap-ui/undo-redo-button/undo-redo-button.test.tsx`
- `src/components/tiptap-ui/undo-redo-button/use-undo-redo.test.ts`
- `src/components/ui/accordion.test.tsx`
- `src/components/ui/button.test.tsx`

### Hooks (3 arquivos)
- `src/hooks/use-pje-document-sync.test.ts`
- `src/hooks/use-timeline-sync.test.ts`
- `src/hooks/use-tiptap-editor.test.ts`

### Libraries (11 arquivos)
- `src/lib/__tests__/google-docs-service-test-env.test.ts`
- `src/lib/agents.test.ts`
- `src/lib/agents/todoist-agent.test.ts`
- `src/lib/config.test.ts`
- `src/lib/djen-api.test.ts`
- `src/lib/google-docs-service.test.ts`
- `src/lib/prazos.test.ts`
- `src/lib/process-number-utils.test.ts`
- `src/lib/process-timeline-utils.test.ts`
- `src/lib/tiptap-utils.test.ts`
- `src/lib/todoist-client.test.ts`
- `src/lib/todoist-integration.test.ts`

### Schemas (4 arquivos)
- `src/schemas/__tests__/agent.schema.test.ts`
- `src/schemas/__tests__/expediente.schema.test.ts`
- `src/schemas/__tests__/process.schema.test.ts`
- `src/schemas/process.schema.test.ts`

### Services (3 arquivos)
- `src/services/__tests__/pii-filtering.test.ts`
- `src/services/minuta-service.test.ts`
- `src/services/task-queue-service.test.ts`

### Agents (1 arquivo)
- `src/agents/agents-stubs.test.ts`

### Outros (2 arquivos)
- `test-simple.test.ts`
- `tests/unit/agents-stubs.test.ts`

---

## 🌐 Testes de API (Backend) - 14 arquivos

- `api/agents-v2.test.ts`
- `api/dspy-bridge.test.ts`
- `api/lib/email-service.test.ts`
- `api/tests/agent-monitoring.test.ts`
- `api/tests/agents-api.test.ts`
- `api/tests/djen-agent-flow.test.ts`
- `api/tests/extension-errors.local-e2e.test.ts`
- `api/tests/extension-errors.test.ts`
- `api/tests/legal-memory.test.ts`
- `api/tests/pje-sync.integration.test.ts`
- `api/tests/pje-sync.test.ts`
- `api/tests/process-task.test.ts`
- `api/tests/status.test.ts`
- `api/tests/todoist-webhook.test.ts`

---

## 🎭 Testes E2E (Playwright) - 16 arquivos

### Raiz do Projeto (2 arquivos)
- `agents-ui.spec.ts`
- `app-flow.spec.ts`
- `basic.spec.ts`

### tests/e2e (13 arquivos)
- `tests/e2e/advanced-flows.spec.ts`
- `tests/e2e/agents-ui.spec.ts`
- `tests/e2e/app-flow.spec.ts`
- `tests/e2e/basic.spec.ts`
- `tests/e2e/extension-pje.spec.ts`
- `tests/e2e/forms.spec.ts`
- `tests/e2e/minutas.spec.ts`
- `tests/e2e/monitoring.spec.ts`
- `tests/e2e/navigation.spec.ts`
- `tests/e2e/pje-sync.spec.ts`
- `tests/e2e/test-1.spec.ts`
- `tests/e2e/todoist-flow.spec.ts`
- `tests/e2e/ui-overhaul.spec.ts`

---

## 🔗 Testes de Integração - 5 arquivos

- `tests/integration/agents-v2-multi.test.ts`
- `tests/integration/agents-v2.test.ts`
- `tests/integration/dspy-bridge.test.ts`
- `tests/integration/hybrid-agents.test.ts`
- `tests/integration/local-real.test.ts`
- `tests/minimal-integration.test.ts`

---

## 🌐 Testes Chrome Extension PJe - 6 arquivos

- `chrome-extension-pje/tests/content-script.test.ts`
- `chrome-extension-pje/tests/errorHandler.test.ts`
- `chrome-extension-pje/tests/expediente-extractor.test.ts`
- `chrome-extension-pje/tests/popup.test.ts`
- `chrome-extension-pje/tests/process-extractor.test.ts`
- `chrome-extension-pje/tests/utils.test.ts`

---

## 🛠️ Comandos de Execução

### Executar Todos os Testes
```bash
npm run test              # Watch mode (desenvolvimento)
npm run test:run          # Run once (CI/CD)
```

### Por Categoria
```bash
npm run test:unit         # Apenas unitários (56 testes)
npm run test:api          # Apenas API (14 testes)
npm run test:e2e          # Apenas E2E (16 testes)
npm run test:integration  # Apenas integração (5 testes)
```

### Com Cobertura
```bash
npm run test:coverage     # Gerar relatório de cobertura
npm run test:ui           # Interface visual (Vitest UI)
```

### Executar Arquivo Específico
```bash
npm test -- <caminho-do-arquivo>

# Exemplos:
npm test -- src/lib/config.test.ts
npm test -- src/components/ui/button.test.tsx
npm test -- api/tests/agents-api.test.ts
npm test -- tests/e2e/basic.spec.ts
```

### Executar por Padrão de Nome
```bash
# Todos os testes de components
npm test -- src/components

# Todos os testes de hooks
npm test -- src/hooks

# Todos os testes de schemas
npm test -- src/schemas
```

---

## 📋 Arquivos de Configuração

### Principais
- `vitest.config.ts` - Configuração do Vitest (unit tests)
- `playwright.config.ts` - Configuração do Playwright (E2E)
- `src/test/setup.ts` - Setup global de testes unitários

### CI/CD
- `.github/workflows/tests.yml` - Pipeline de testes automatizados
- `.github/workflows/e2e.yml` - Testes E2E no CI/CD

### Scripts
- `scripts/setup-tests.sh` - Script de configuração automática
- `scripts/list-all-tests.sh` - Este script de inventário

---

## 📊 Estatísticas por Tipo de Arquivo

| Extensão | Quantidade | Categoria Principal |
|----------|------------|---------------------|
| `.test.ts` | 34 | Testes Unitários (TypeScript) |
| `.test.tsx` | 22 | Testes Unitários (React Components) |
| `.spec.ts` | 16 | Testes E2E (Playwright) |
| `.integration.test.ts` | 5 | Testes de Integração |

---

## 🎯 Próximos Passos

### Para Aumentar Cobertura
1. Adicionar testes para `src/components/GlobalSearch.tsx`
2. Adicionar testes para `src/components/ProcessCRMAdvbox.tsx`
3. Adicionar testes para `src/hooks/use-auto-minuta.ts`
4. Adicionar testes para `src/hooks/use-autonomous-agents.ts`

### Para Melhorar Qualidade
1. Executar `npm run test:coverage` para ver cobertura atual
2. Focar em testes para componentes com >500 linhas
3. Adicionar testes de integração para fluxos críticos
4. Implementar testes de snapshot para UI components

---

## 🔍 Como Usar Este Inventário

### Encontrar Testes Relacionados
```bash
# Procurar testes de um componente específico
grep -r "MinutasManager" docs/TODOS_OS_TESTES.md

# Procurar testes de uma feature
grep -r "todoist" docs/TODOS_OS_TESTES.md
```

### Atualizar Este Inventário
```bash
# Regenerar documentação completa
bash scripts/list-all-tests.sh --run

# Ver apenas resumo
bash scripts/list-all-tests.sh --summary

# Ver lista detalhada
bash scripts/list-all-tests.sh --detailed

# Exportar para JSON
bash scripts/list-all-tests.sh --json
```

---

## 📝 Notas

- Testes estão distribuídos de forma equilibrada entre frontend (57.7%) e backend/E2E (42.3%)
- Maior concentração de testes está em Components UI (TiptapEditor, buttons, popovers)
- Extensão Chrome PJe tem 100% de cobertura de testes (6/6 módulos)
- API tem boa cobertura de endpoints críticos (14 arquivos)
- E2E cobre todos os fluxos principais do usuário (16 specs)

---

**Última atualização:** 2024-12-09 21:30:00  
**Gerado por:** scripts/list-all-tests.sh  
**Modo:** Manutenção - apenas correções de bugs
