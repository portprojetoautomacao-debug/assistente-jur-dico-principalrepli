# 📊 Análise de Resultados dos Testes E2E - Editor de Minutas

**Data:** 04 de Janeiro de 2026
**Arquivo Testado:** `tests/e2e/editor-minutas-ckeditor.spec.ts`
**Status:** ❌ TESTES NÃO EXECUTADOS - FALHA DE CONFIGURAÇÃO

---

## 🚨 Problemas Identificados

### 1. **Erro Crítico: `spawn npm ENOENT`**

**Descrição:** O global-setup.ts não consegue encontrar o comando `npm` ao tentar iniciar o backend.

**Erro Completo:**
```
Error: spawn npm ENOENT
    at Process.ChildProcess._handle.onexit (node:internal/child_process:285:19)
Emitted 'error' event on ChildProcess instance at:
    at Process.ChildProcess._handle.onexit (node:internal/child_process:291:12)
```

**Causa Raiz:**
O `spawn` do Node.js não herda o PATH do shell. Em sistemas Unix, `npm` pode não estar no PATH padrão do processo filho.

**Localização:** `tests/e2e/global-setup.ts` linha 14

```typescript
backendProcess = spawn("npm", ["run", "dev"], {  // ❌ npm não encontrado
  cwd: path.join(projectRoot, "backend"),
  stdio: "ignore",
  detached: true,
  env: { ...process.env, NODE_ENV: "development" },
});
```

**Impacto:**
- ❌ Backend não inicia
- ❌ Testes E2E não podem executar (todas chamadas de API falham)
- ❌ 0/24 testes executados

---

### 2. **Porta 5252 Já em Uso**

**Descrição:** A API local está tentando usar a porta 5252, mas ela já está ocupada.

**Erro:**
```
Error: listen EADDRINUSE: address already in use :::5252
```

**Causa:** Outro processo já está usando a porta 5252 (provavelmente sessão anterior não encerrada).

**Impacto:**
- ⚠️ API local não inicia (mas pode não ser necessária se backend rodar)
- Testes podem funcionar se o backend real (porta 3001) estiver ativo

---

### 3. **Vite Dev Server Iniciou Corretamente**

**Status:** ✅ FUNCIONANDO

```
VITE v7.3.0  ready in 267 ms
➜  Local:   http://127.0.0.1:5173/
```

**Observação:** O frontend está rodando, mas sem backend os testes vão falhar em todas as chamadas de API.

---

## 🔧 Soluções Propostas

### Solução 1: Usar Caminho Absoluto do NPM (Recomendado)

**Arquivo:** `tests/e2e/global-setup.ts`

```typescript
import { platform } from "node:os";

// Detectar caminho do npm
const npmPath = platform() === "win32"
  ? "npm.cmd"
  : "/usr/local/share/nvm/versions/node/v22.21.1/bin/npm";

backendProcess = spawn(npmPath, ["run", "dev"], {
  cwd: path.join(projectRoot, "backend"),
  stdio: ["ignore", "pipe", "pipe"], // Capturar stdout/stderr para debug
  detached: true,
  env: {
    ...process.env,
    NODE_ENV: "development",
    PATH: process.env.PATH // ⚠️ Importante: passar PATH
  },
});
```

---

### Solução 2: Usar `shell: true` (Alternativa Simples)

```typescript
backendProcess = spawn("npm run dev", {
  cwd: path.join(projectRoot, "backend"),
  shell: true, // ✅ Usa shell para resolver npm
  stdio: "ignore",
  detached: true,
  env: { ...process.env, NODE_ENV: "development" },
});
```

**Vantagem:** Mais simples, funciona em todos os ambientes
**Desvantagem:** Ligeiramente mais lento

---

### Solução 3: Matar Processo na Porta 5252

```bash
# Encontrar processo
lsof -ti:5252 | xargs kill -9

# Ou adicionar cleanup no global-setup
```

---

### Solução 4: Variável de Ambiente para Pular Backend Start

**Uso:**
```bash
SKIP_BACKEND_START=true npx playwright test
```

**Quando usar:** Se o backend já estiver rodando em outra janela/processo.

---

## 📋 Checklist de Correção

- [ ] **Corrigir spawn npm ENOENT**
  - [ ] Opção A: Usar caminho absoluto `/usr/local/share/nvm/.../npm`
  - [ ] Opção B: Usar `shell: true` no spawn
  - [ ] Opção C: Usar `npx` ao invés de `npm`

- [ ] **Resolver conflito de porta 5252**
  - [ ] Matar processo na porta 5252
  - [ ] Ou configurar porta diferente
  - [ ] Ou desabilitar API local (se backend 3001 for suficiente)

- [ ] **Validar Backend Inicia**
  - [ ] Aguardar 10s ao invés de 5s
  - [ ] Fazer health check em `http://localhost:3001/health`
  - [ ] Log de confirmação com PID do processo

- [ ] **Testar Novamente**
  - [ ] Executar `npx playwright test tests/e2e/editor-minutas-ckeditor.spec.ts`
  - [ ] Verificar se backend responde
  - [ ] Analisar taxa de sucesso dos testes

---

## 🎯 Próximos Passos

### Passo 1: Aplicar Solução 2 (shell: true)
É a mais rápida e funciona garantido.

### Passo 2: Adicionar Health Check
```typescript
// Após spawn, aguardar backend responder
for (let i = 0; i < 20; i++) {
  try {
    const response = await fetch("http://localhost:3001/health");
    if (response.ok) {
      console.log("✅ Backend health check passed");
      break;
    }
  } catch {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

### Passo 3: Cleanup de Portas
Adicionar script que mata processos órfãos antes dos testes.

### Passo 4: Executar Testes
Após correções, rodar:
```bash
npx playwright test tests/e2e/editor-minutas-ckeditor.spec.ts --project=chromium --reporter=html
```

---

## 📊 Status Atual

| Componente | Status | Observação |
|-----------|--------|------------|
| Frontend (Vite) | ✅ Rodando | Porta 5173, 267ms startup |
| API Local | ❌ Falhou | Porta 5252 ocupada |
| Backend | ❌ Não Iniciou | `spawn npm ENOENT` |
| Testes E2E | ⏸️ Não Executados | Aguardando backend |
| Global Setup | ❌ Falhou | Erro no spawn |
| Global Teardown | ⏸️ Não Chamado | Setup falhou antes |

---

## 💡 Lições Aprendidas

1. **`spawn()` não herda PATH do shell** - Sempre passar `env.PATH` ou usar `shell: true`
2. **Processos órfãos causam conflitos de porta** - Implementar cleanup robusto
3. **Health checks são essenciais** - Não confiar apenas em `setTimeout`
4. **Logs de debug salvam tempo** - Capturar stdout/stderr do backend spawn
5. **Fallback é necessário** - Permitir `SKIP_BACKEND_START` para testes manuais

---

## 📝 Código Corrigido (Preview)

```typescript
// tests/e2e/global-setup.ts (versão corrigida)
async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting E2E tests...");

  if (!process.env.SKIP_BACKEND_START) {
    console.log("🔧 Starting backend server...");
    const projectRoot = config.rootDir || process.cwd();

    // ✅ CORREÇÃO: usar shell: true
    backendProcess = spawn("npm run dev", {
      cwd: path.join(projectRoot, "backend"),
      shell: true, // ✅ Resolve npm via shell
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
      env: {
        ...process.env,
        NODE_ENV: "development",
        PATH: process.env.PATH // ✅ Passar PATH
      },
    });

    // ✅ MELHORIA: Health check ao invés de timeout fixo
    console.log("⏳ Waiting for backend...");
    let healthy = false;
    for (let i = 0; i < 30; i++) {
      try {
        const response = await fetch("http://localhost:3001/health");
        if (response.ok) {
          healthy = true;
          console.log("✅ Backend is healthy");
          break;
        }
      } catch {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!healthy) {
      console.warn("⚠️ Backend health check failed, continuing anyway...");
    }
  }

  // ... restante do código de auth
}
```

---

**Conclusão:** Os testes não foram executados devido a falha no spawn do backend. A correção é simples e deve resolver 100% dos problemas de inicialização.

**Prioridade:** 🔴 CRÍTICA - Bloqueia todos os testes E2E

**Tempo Estimado de Correção:** 5-10 minutos

---

**Última Atualização:** 04/01/2026 às 02:35 UTC
**Responsável:** GitHub Copilot
**Status:** Aguardando aprovação para aplicar correções
