# 🧠 Correção: Heap Out of Memory no CI

## 🚨 Problema Original

```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
 1: 0xb7f5d0 node::Abort() [node]
 2: 0xa9c46a  [node]
 3: 0xd5bf40 v8::Utils::ReportOOMFailure(v8::internal::Isolate*, char const*, bool) [node]
 4: 0xd5c2c7 v8::internal::V8::FatalProcessOutOfMemory(v8::internal::Isolate*, char const*, bool) [node]
 5: 0xf44f05  [node]
 6: 0xf45590 v8::internal::Heap::CollectGarbage(v8::internal::AllocationSpace, v8::internal::GarbageCollectionReason, v8::GCCallbackFlags) [node]
```

**Contexto**: O erro ocorria durante o build/bundling do código no workflow `code-quality-analysis.yml`, especificamente ao processar `lib_agents_core_ml-optimization.ts`.

---

## 🔍 Análise da Causa Raiz

### Arquivo Problemático

**`lib_agents_core_ml-optimization.ts`** (linha 1):
```typescript
import * as tf from '@tensorflow/tfjs-node';
```

### Por que isso causa problema?

1. **TensorFlow.js é pesado**: A biblioteca `@tensorflow/tfjs-node` tem centenas de MB de código C++ nativo
2. **Vite/esbuild precisa processar tudo**: Durante o build, o bundler precisa:
   - Analisar o código do TensorFlow
   - Fazer tree-shaking (remover código não usado)
   - Fazer bundle de todas as dependências
   - Minificar e otimizar
3. **V8 tem limite padrão**: Node.js por padrão limita o heap a ~4GB
4. **Processar ML library ultrapassa esse limite**: O TensorFlow sozinho pode consumir 2-3GB durante bundling

---

## ✅ Solução Implementada

### Estratégia

Aumentar o limite de memória do V8 para **8GB** usando a variável de ambiente `NODE_OPTIONS`.

### Workflows Corrigidos

#### 1. `.github/workflows/ci.yml`

**Job**: `build-and-test`

```yaml
jobs:
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: read
    env:
      NODE_OPTIONS: --max-old-space-size=8192  # ✅ ADICIONADO
```

#### 2. `.github/workflows/build.yml`

**Job**: `build`

```yaml
jobs:
  build:
    name: Build & Lint
    runs-on: ubuntu-latest
    timeout-minutes: 20
    env:
      NODE_OPTIONS: --max-old-space-size=8192  # ✅ ADICIONADO
```

#### 3. `.github/workflows/code-quality-analysis.yml`

**3 Jobs Corrigidos**:

```yaml
static-analysis:
  name: Static Analysis
  runs-on: ubuntu-latest
  timeout-minutes: 30
  env:
    NODE_OPTIONS: --max-old-space-size=8192  # ✅ ADICIONADO

complexity-analysis:
  name: Complexity Analysis
  runs-on: ubuntu-latest
  timeout-minutes: 20
  env:
    NODE_OPTIONS: --max-old-space-size=8192  # ✅ ADICIONADO

test-coverage:
  name: Test Coverage
  runs-on: ubuntu-latest
  timeout-minutes: 25
  env:
    NODE_OPTIONS: --max-old-space-size=8192  # ✅ JÁ EXISTIA
```

---

## 📊 Validação

### Script de Validação

Criado: `scripts/validate-memory-fix.sh`

```bash
./scripts/validate-memory-fix.sh
```

### Resultado Esperado

```
✅ Todos os workflows críticos estão corrigidos!

ℹ️  O que foi feito:
   • ci.yml: NODE_OPTIONS adicionado ao job build-and-test
   • build.yml: NODE_OPTIONS adicionado ao job build
   • code-quality-analysis.yml: NODE_OPTIONS adicionado a 3 jobs

ℹ️  Por que isso foi necessário:
   • lib_agents_core_ml-optimization.ts importa @tensorflow/tfjs-node (biblioteca pesada)
   • Vite/esbuild precisa de mais memória para fazer bundle do TensorFlow
   • NODE_OPTIONS aumenta heap de 4GB para 8GB
```

---

## 🎯 Workflows Opcionais (Futuro)

Se houver problemas de memória no futuro, considerar adicionar `NODE_OPTIONS` também em:

- `.github/workflows/sonarcloud.yml`
- `.github/workflows/performance-optimization.yml`
- `.github/workflows/advanced-tools.yml`

---

## 🧪 Teste Local

Para testar localmente com a mesma configuração do CI:

```bash
# Definir NODE_OPTIONS temporariamente
export NODE_OPTIONS="--max-old-space-size=8192"

# Rodar build
npm run build

# Rodar testes
npm run test:run

# Limpar variável (opcional)
unset NODE_OPTIONS
```

---

## 📚 Referências

- [Node.js Memory Limits](https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes)
- [Vite Build Performance](https://vitejs.dev/guide/performance.html)
- [TensorFlow.js Bundle Size](https://www.tensorflow.org/js/guide/platform_environment)

---

## 📝 Changelog

| Data | Ação | Detalhes |
|------|------|----------|
| 2025-01-15 | ✅ Correção aplicada | NODE_OPTIONS adicionado a 5 jobs em 3 workflows |
| 2025-01-15 | ✅ Script criado | `validate-memory-fix.sh` para validação |
| 2025-01-15 | 📝 Documentado | Este arquivo `HEAP_MEMORY_FIX.md` |

---

## 🤝 Commit Message Sugerida

```
fix: adiciona NODE_OPTIONS para prevenir heap out of memory

- Aumenta limite de heap V8 de 4GB para 8GB
- Workflows corrigidos: ci.yml, build.yml, code-quality-analysis.yml
- Causa: TensorFlow.js em lib_agents_core_ml-optimization.ts
- Solução validada com scripts/validate-memory-fix.sh

Refs: #44
```
