# 🧪 Ferramenta de Identificação de Testes

Ferramenta completa para identificar, listar e documentar todos os testes disponíveis no projeto **Assistente Jurídico PJe**.

---

## 🎯 Propósito

Esta ferramenta foi criada para:
- **Identificar** todos os testes existentes no projeto
- **Categorizar** testes por tipo (unitários, API, E2E, integração, Chrome)
- **Gerar documentação** automática e atualizada
- **Facilitar navegação** entre testes
- **Monitorar cobertura** de testes

---

## 📊 Estatísticas Atuais

| Categoria | Total | Porcentagem |
|-----------|-------|-------------|
| **Testes Unitários** | 56 | 57.7% |
| **Testes de API** | 14 | 14.4% |
| **Testes E2E** | 16 | 16.5% |
| **Testes de Integração** | 5 | 5.2% |
| **Testes Chrome Extension** | 6 | 6.2% |
| **TOTAL** | **97** | **100%** |

---

## 🚀 Como Usar

### Via npm (Recomendado)

```bash
# Ver resumo de todos os testes
npm run test:list

# Ver lista detalhada com caminhos
npm run test:list:detailed

# Gerar documentação completa (Markdown + JSON)
npm run test:list:generate
```

### Via Script Direto

```bash
# Resumo (padrão)
bash scripts/list-all-tests.sh --summary

# Lista detalhada
bash scripts/list-all-tests.sh --detailed

# Exportar apenas JSON
bash scripts/list-all-tests.sh --json

# Gerar documentação completa
bash scripts/list-all-tests.sh --run

# Ajuda
bash scripts/list-all-tests.sh --help
```

---

## 📁 Arquivos Gerados

### 1. `docs/TODOS_OS_TESTES.md`
Documentação Markdown completa com:
- Resumo executivo com estatísticas
- Lista completa de todos os testes por categoria
- Comandos de execução
- Arquivos de configuração
- Próximos passos para melhorar cobertura

### 2. `docs/tests-inventory.json`
Inventário JSON estruturado com:
- Metadata (data de geração, projeto)
- Sumário de quantidades
- Distribuição percentual
- Lista de arquivos por categoria
- Comandos disponíveis
- Gaps de cobertura

---

## 📋 Categorias de Testes

### 🧪 Testes Unitários (Frontend)
- **Localização**: `src/**/*.test.{ts,tsx}`
- **Framework**: Vitest
- **Executor**: `npm run test:unit`
- **Total**: 56 arquivos

**Subcategorias**:
- Components (24) - Testes de componentes React
- Hooks (3) - Testes de hooks customizados
- Libraries (11) - Testes de utilitários e serviços
- Schemas (4) - Testes de validação Zod
- Services (3) - Testes de serviços

### 🌐 Testes de API (Backend)
- **Localização**: `api/**/*.test.ts`
- **Framework**: Vitest
- **Executor**: `npm run test:api`
- **Total**: 14 arquivos

**Endpoints testados**:
- Agents API
- DJEN Integration
- PJe Sync
- Email Service
- Todoist Webhook
- Legal Memory

### 🎭 Testes E2E (Playwright)
- **Localização**: `tests/e2e/**/*.spec.ts`, `*.spec.ts`
- **Framework**: Playwright
- **Executor**: `npm run test:e2e`
- **Total**: 16 arquivos

**Fluxos cobertos**:
- Navegação básica
- Fluxos de formulários
- Integração PJe
- Geração de minutas
- Monitoramento de agentes
- Fluxo Todoist

### 🔗 Testes de Integração
- **Localização**: `tests/integration/**/*.test.ts`
- **Framework**: Vitest
- **Executor**: `npm run test:integration`
- **Total**: 5 arquivos

**Integrações testadas**:
- Agents V2 Multi-Agent
- DSPy Bridge
- Hybrid Agents
- Local Real Tests

### 🌐 Testes Chrome Extension
- **Localização**: `chrome-extension-pje/tests/**/*.test.ts`
- **Framework**: Vitest
- **Executor**: `npm run test:chrome`
- **Total**: 6 arquivos

**Módulos cobertos**:
- Content Script
- Error Handler
- Expediente Extractor
- Process Extractor
- Popup
- Utils

---

## 🎯 Comandos de Execução

### Executar Todos os Testes
```bash
npm run test              # Watch mode (desenvolvimento)
npm run test:run          # Run once (CI/CD)
npm run test:all          # Todos + API + Chrome
```

### Por Categoria
```bash
npm run test:unit         # Apenas unitários (56 testes)
npm run test:api          # Apenas API (14 testes)
npm run test:e2e          # Apenas E2E (16 testes)
npm run test:integration  # Apenas integração (5 testes)
npm run test:chrome       # Apenas Chrome Extension (6 testes)
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
```

---

## 🔍 Como Encontrar Testes

### 1. Procurar por Nome de Componente/Feature
```bash
# Buscar na documentação
grep -r "MinutasManager" docs/TODOS_OS_TESTES.md

# Buscar no JSON
jq '.categories.unit.files[] | select(contains("MinutasManager"))' docs/tests-inventory.json
```

### 2. Filtrar por Tipo
```bash
# Ver apenas testes de API
jq '.categories.api' docs/tests-inventory.json

# Ver apenas testes E2E
jq '.categories.e2e' docs/tests-inventory.json
```

### 3. Verificar Cobertura
```bash
# Ver gaps de cobertura
jq '.coverage_gaps' docs/tests-inventory.json
```

---

## 📈 Análise de Cobertura

### Áreas Bem Cobertas ✅
- **TiptapEditor**: 100% dos botões e hooks testados
- **Chrome Extension**: 100% dos módulos testados
- **Schemas Zod**: 100% dos schemas testados
- **API Endpoints**: Endpoints críticos cobertos

### Gaps de Cobertura ⚠️
Conforme identificado pela ferramenta:
- `src/components/GlobalSearch.tsx`
- `src/components/ProcessCRMAdvbox.tsx`
- `src/hooks/use-auto-minuta.ts`
- `src/hooks/use-autonomous-agents.ts`

---

## 🔄 Atualização Automática

### Quando Atualizar

A documentação deve ser regenerada quando:
1. Novos arquivos de teste forem criados
2. Testes forem removidos
3. Estrutura de pastas mudar
4. Antes de releases importantes

### Como Atualizar

```bash
# Regenerar toda a documentação
npm run test:list:generate

# Verificar mudanças
git diff docs/TODOS_OS_TESTES.md docs/tests-inventory.json
```

---

## 🛠️ Configuração

### Arquivos de Configuração

| Arquivo | Propósito |
|---------|-----------|
| `vitest.config.ts` | Configuração do Vitest (unit tests) |
| `playwright.config.ts` | Configuração do Playwright (E2E) |
| `src/test/setup.ts` | Setup global de testes unitários |
| `.github/workflows/tests.yml` | Pipeline CI/CD de testes |

### Scripts Relacionados

| Script | Descrição |
|--------|-----------|
| `scripts/list-all-tests.sh` | Este script de identificação |
| `scripts/setup-tests.sh` | Setup automático do ambiente |
| `scripts/run-local-real-tests.sh` | Testes locais reais |

---

## 💡 Dicas de Uso

### Para Desenvolvedores

```bash
# Antes de começar um feature
npm run test:list:detailed | grep "MyComponent"

# Verificar se precisa criar testes
npm run test:list:generate
jq '.coverage_gaps' docs/tests-inventory.json
```

### Para QA

```bash
# Ver todos os testes E2E
npm run test:list:detailed | grep "spec.ts"

# Executar suite completa
npm run test:all
```

### Para CI/CD

```bash
# No pipeline, sempre verificar inventário
npm run test:list:generate
git add docs/TODOS_OS_TESTES.md docs/tests-inventory.json

# Garantir que documentação está atualizada
if git diff --quiet; then
  echo "✅ Documentação de testes atualizada"
else
  echo "⚠️ Documentação de testes precisa ser atualizada"
fi
```

---

## 📊 Integração com CI/CD

### GitHub Actions

```yaml
- name: Gerar Inventário de Testes
  run: npm run test:list:generate

- name: Upload Test Inventory
  uses: actions/upload-artifact@v3
  with:
    name: test-inventory
    path: |
      docs/TODOS_OS_TESTES.md
      docs/tests-inventory.json
```

---

## 🎯 Roadmap

### Próximas Melhorias

- [ ] Adicionar análise de tempo de execução dos testes
- [ ] Integrar com relatório de cobertura do Vitest
- [ ] Gerar gráficos de distribuição
- [ ] Identificar testes lentos (>1s)
- [ ] Exportar para HTML interativo
- [ ] Integração com SonarQube
- [ ] Dashboard web para visualização

---

## 🤝 Contribuindo

Para adicionar novas features à ferramenta:

1. Edite `scripts/list-all-tests.sh`
2. Adicione novas funções de análise
3. Atualize a documentação gerada
4. Teste com `bash scripts/list-all-tests.sh --run`
5. Commit com mensagem descritiva

---

## 📝 Exemplos de Uso

### Exemplo 1: Verificar Testes de um Componente
```bash
# Gerar documentação
npm run test:list:generate

# Procurar testes do MinutasManager
grep -A 2 "MinutasManager" docs/TODOS_OS_TESTES.md
```

### Exemplo 2: Análise de Cobertura
```bash
# Ver inventário JSON
cat docs/tests-inventory.json | jq

# Calcular porcentagem de cobertura
jq '.distribution' docs/tests-inventory.json
```

### Exemplo 3: Integração em Script
```bash
#!/bin/bash

# Gerar inventário
npm run test:list:generate

# Extrair total de testes
TOTAL=$(jq '.summary.total' docs/tests-inventory.json)

echo "Total de testes no projeto: $TOTAL"

# Verificar se atingiu meta (100 testes)
if [ $TOTAL -ge 100 ]; then
  echo "✅ Meta de testes atingida!"
else
  echo "⚠️ Ainda faltam $((100 - TOTAL)) testes para atingir a meta"
fi
```

---

## 📚 Documentação Relacionada

- [TESTES_LOCAIS.md](./TESTES_LOCAIS.md) - Guia completo de configuração
- [TESTES_QUICKSTART.md](./TESTES_QUICKSTART.md) - Quick reference
- [TODOS_OS_TESTES.md](./TODOS_OS_TESTES.md) - Inventário completo (gerado)
- [tests-inventory.json](./tests-inventory.json) - Inventário JSON (gerado)

---

**Última atualização:** 2024-12-09  
**Versão:** 1.0.0  
**Modo:** Manutenção - apenas correções de bugs
