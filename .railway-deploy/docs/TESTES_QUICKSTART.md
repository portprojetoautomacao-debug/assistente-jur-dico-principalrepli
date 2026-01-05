# ⚡ Quick Start - Testes Locais

## 🚀 Configuração Rápida (2 minutos)

```bash
# 1. Executar script de setup
./scripts/setup-tests.sh

# 2. Executar testes
npm run test:run
```

## 📋 Comandos Essenciais

```bash
# Testes unitários (watch mode)
npm run test

# Testes unitários (1x) ✅ RECOMENDADO
npm run test:run

# Testes de API
npm run test:api

# Testes Chrome Extension
npm run test:chrome

# TODOS os testes
npm run test:all

# Testes com cobertura
npm run test:coverage

# Interface visual
npm run test:ui
```

## 🎯 Via VS Code Tasks

1. Pressione `Ctrl+Shift+P` (ou `Cmd+Shift+P` no Mac)
2. Digite "Run Task"
3. Escolha uma das tasks:
   - `test` - Watch mode
   - `test:run` - Executar todos (recomendado)
   - `test:ui` - Interface gráfica
   - `test:coverage` - Com cobertura
   - `test:api` - Apenas API
   - `test:all` - Todos os testes

## ✅ Checklist Diário (5 minutos)

```bash
# Executar todas as verificações de uma vez
npm run type-check && npm run lint && npm run test:run && npm run build
```

**Status esperado:**
- ✅ Type check: 0 errors
- ✅ Lint: ≤150 warnings
- ✅ Tests: All passed
- ✅ Build: Success

## 🐛 Problemas Comuns

### Erro: Out of Memory

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run test:run
```

### Erro: Cannot find module

```bash
rm -rf node_modules
npm install --legacy-peer-deps
```

### Testes timeout

```bash
npm run test:run -- --testTimeout=30000
```

## 📚 Documentação Completa

Ver [TESTES_LOCAIS.md](./TESTES_LOCAIS.md) para guia detalhado.

## 🎓 Estrutura de Testes

```
assistente-juridico-p/
├── tests/              # Testes unitários (7 arquivos)
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── src/                # Código fonte com testes (40 arquivos)
│   ├── **/__tests__/
│   └── **/*.test.ts
├── api/                # Testes de API (14 arquivos)
│   └── tests/
└── chrome-extension-pje/  # Testes extensão (6 arquivos)
    └── tests/
```

**Total**: ~67 arquivos de teste

## 🔥 Modo Manutenção

**LEMBRE-SE**: Antes de corrigir qualquer bug:

1. ✅ Execute os testes atuais
2. ✅ Verifique que todos passam
3. ✅ Faça a correção
4. ✅ Execute os testes novamente
5. ✅ Confirme que não há regressões

**Nunca** faça commit sem executar:
```bash
npm run test:run && npm run build
```
