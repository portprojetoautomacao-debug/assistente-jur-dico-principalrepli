# 🧪 Guia de Testes Locais - Assistente Jurídico PJe

## 📋 Configuração Inicial

### Pré-requisitos

- ✅ Node.js v22.x
- ✅ npm 11.x
- ✅ Dependências instaladas (`npm install`)

### Setup Automático

```bash
# Executar script de configuração automática
./scripts/setup-tests.sh
```

Este script:
1. Verifica Node.js instalado
2. Instala dependências se necessário
3. Valida arquivos de configuração
4. Lista todos os testes disponíveis
5. Executa teste rápido de validação

---

## 🎯 Tipos de Testes

### 1. Testes Unitários (Frontend - `src/`)

**Localização**: `tests/`, `src/**/__tests__/`, `src/**/*.test.ts`
**Total**: ~40 arquivos de teste
**Configuração**: `vitest.config.ts`

```bash
# Executar todos os testes unitários
npm run test:run

# Modo watch (re-executa ao salvar)
npm run test

# Interface gráfica
npm run test:ui

# Com cobertura de código
npm run test:coverage
```

**Exemplos de testes**:
- `src/lib/config.test.ts` - Configurações do app
- `src/lib/prazos.test.ts` - Cálculo de prazos
- `src/schemas/__tests__/*.test.ts` - Validação de schemas

### 2. Testes de API (Backend - `api/`)

**Localização**: `api/tests/`, `api/**/*.test.ts`
**Total**: ~14 arquivos de teste
**Configuração**: `vitest.config.node.ts`

```bash
# Executar testes de API
npm run test:api

# Com cobertura
npm run test:coverage
```

**Exemplos de testes**:
- `api/tests/agents-api.test.ts` - Endpoints dos agentes
- `api/tests/pje-sync.test.ts` - Sincronização PJe
- `api/tests/status.test.ts` - Health check

### 3. Testes Chrome Extension

**Localização**: `chrome-extension-pje/tests/`
**Total**: ~6 arquivos de teste
**Configuração**: `chrome-extension-pje/vitest.config.ts`

```bash
# Executar testes da extensão
npm run test:chrome

# Ou executar no diretório da extensão
cd chrome-extension-pje
npm test
```

### 4. Testes E2E (Playwright)

**Localização**: `tests/e2e/`
**Configuração**: `playwright.config.ts`

```bash
# Executar testes E2E
npm run test:e2e

# Modo headed (com navegador visível)
npm run test:e2e:headed

# Interface visual
npm run test:e2e:ui

# Ver relatório
npm run test:e2e:report
```

---

## 🚀 Comandos Rápidos

### Execução de Testes

| Comando | Descrição | Uso |
|---------|-----------|-----|
| `npm run test` | Watch mode (unitários) | Desenvolvimento ativo |
| `npm run test:run` | Executar todos unitários | CI/CD, validação rápida |
| `npm run test:api` | Testes de API | Validar endpoints |
| `npm run test:chrome` | Testes extensão Chrome | Validar extensão |
| `npm run test:all` | Todos os testes | Antes de commit |
| `npm run test:coverage` | Com cobertura | Verificar qualidade |
| `npm run test:ui` | Interface gráfica | Debugging visual |
| `npm run test:e2e` | End-to-end | Fluxos completos |

### Testes Específicos

```bash
# Executar apenas um arquivo
npm run test:run src/lib/config.test.ts

# Executar testes que contêm "prazos" no nome
npm run test:run --grep prazos

# Executar com reporter verbose
npm run test:run -- --reporter=verbose

# Executar com limite de memória
NODE_OPTIONS="--max-old-space-size=512" npm run test:run
```

---

## 🔧 Configurações de Ambiente

### Variáveis de Ambiente para Testes

Crie arquivo `.env.test` (se necessário):

```env
# Google OAuth (opcional para testes)
GOOGLE_CLIENT_ID=test_client_id
GOOGLE_CLIENT_SECRET=test_secret

# Gemini API (necessário para alguns testes)
GEMINI_API_KEY=your_test_key

# DataJud (necessário para testes de integração)
DATAJUD_API_KEY=your_test_key

# Upstash Redis (usar instância de teste)
KV_REST_API_URL=https://test-redis.upstash.io
KV_REST_API_TOKEN=test_token
```

### Modo de Teste com Mocks

Por padrão, os testes usam mocks para:
- ✅ Serviços externos (Google Calendar, Gemini, DataJud)
- ✅ Banco de dados (Upstash Redis)
- ✅ Autenticação OAuth

Para testar com serviços reais, configure:
```bash
VITEST_USE_REAL_SERVICES=true npm run test:run
```

---

## 📊 Cobertura de Código

### Gerar Relatório de Cobertura

```bash
# Frontend
npm run test:coverage

# API
npm run test:coverage -- --config vitest.config.node.ts

# Ver relatório HTML
open coverage/index.html
```

### Metas de Cobertura

| Tipo | Meta | Atual |
|------|------|-------|
| Statements | 80% | Verificar |
| Branches | 75% | Verificar |
| Functions | 80% | Verificar |
| Lines | 80% | Verificar |

---

## 🐛 Debugging de Testes

### VS Code

1. Abra arquivo de teste
2. Clique em "Debug" ao lado do teste
3. Ou use `F5` com breakpoint

### Chrome DevTools

```bash
# Iniciar com inspector
node --inspect-brk ./node_modules/.bin/vitest run

# Abrir chrome://inspect
```

### Logs Detalhados

```bash
# Verbose logging
npm run test:run -- --reporter=verbose

# Com stack traces completos
npm run test:run -- --reporter=verbose --bail=false
```

---

## ⚡ Performance

### Otimizações de Memória

Se testes falharem por falta de memória:

```bash
# Aumentar heap size
NODE_OPTIONS="--max-old-space-size=4096" npm run test:run

# Executar em sequência (não paralelo)
npm run test:run -- --no-threads

# Limitar workers
npm run test:run -- --pool=threads --poolOptions.threads.maxThreads=2
```

### Testes Isolados

Para evitar interferência entre testes:

```bash
# Modo isolado (mais lento, mais seguro)
npm run test:run -- --isolate

# Modo sequencial
npm run test:run -- --sequence.concurrent=false
```

---

## 🔍 Troubleshooting

### Problema: "Cannot find module"

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Problema: "Out of memory"

```bash
# Aumentar memória
NODE_OPTIONS="--max-old-space-size=8192" npm run test:run

# Executar menos testes de uma vez
npm run test:run -- --shard=1/4
```

### Problema: Testes timeout

```bash
# Aumentar timeout
npm run test:run -- --testTimeout=30000
```

### Problema: "Environment not found"

Instalar ambiente de teste:

```bash
npm install --save-dev happy-dom
```

---

## 📝 Escrevendo Novos Testes

### Template de Teste Unitário

```typescript
import { describe, it, expect, vi } from 'vitest';
import { minhaFuncao } from '@/lib/minha-funcao';

describe('minhaFuncao', () => {
  it('deve fazer algo específico', () => {
    // Arrange
    const input = 'teste';
    
    // Act
    const result = minhaFuncao(input);
    
    // Assert
    expect(result).toBe('esperado');
  });

  it('deve lidar com erro', () => {
    expect(() => minhaFuncao(null)).toThrow();
  });
});
```

### Template de Teste de API

```typescript
import { describe, it, expect } from 'vitest';
import handler from '../api/meu-endpoint';

describe('GET /api/meu-endpoint', () => {
  it('deve retornar 200 OK', async () => {
    const req = new Request('http://localhost/api/meu-endpoint');
    const res = await handler(req);
    
    expect(res.status).toBe(200);
  });
});
```

---

## ✅ Checklist de Testes (Antes de Commit)

```bash
# 1. Lint
npm run lint

# 2. Type check
npm run type-check

# 3. Testes unitários
npm run test:run

# 4. Testes de API
npm run test:api

# 5. Build
npm run build

# OU executar tudo de uma vez:
npm run type-check && npm run lint && npm run test:run && npm run build
```

---

## 📚 Recursos Adicionais

- **Vitest Docs**: https://vitest.dev/
- **Testing Library**: https://testing-library.com/
- **Playwright**: https://playwright.dev/
- **Projeto no GitHub**: https://github.com/thiagobodevanadv-alt/assistente-juridico-p

---

## 🎯 Próximos Passos

1. ✅ Executar `./scripts/setup-tests.sh`
2. ✅ Verificar que todos os testes passam
3. ✅ Adicionar testes para novas funcionalidades
4. ✅ Manter cobertura acima de 80%
5. ✅ Executar testes antes de cada commit

**Modo Manutenção**: Lembre-se de executar todos os testes antes de corrigir bugs para garantir que não introduza regressões!
