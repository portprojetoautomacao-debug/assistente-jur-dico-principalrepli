# 🐛 Troubleshooting - Testes E2E

## ❌ Problema: "Timeout waiting for input fields"

```
⚠️ Failed to create storage state during global setup: 
page.waitForSelector: Timeout 10000ms exceeded.
waiting for locator('input[name="email"]') to be visible
```

### ✅ Soluções Aplicadas:

#### 1. **Correção no SimpleAuth.tsx**
- ✅ Adicionado `name="username"` ao campo de usuário
- ✅ Adicionado `name="password"` ao campo de senha
- ✅ Adicionado `type="submit"` ao botão
- ✅ Adicionado `data-testid` para seletores mais confiáveis

**Antes:**
```tsx
<Input
  placeholder="Usuário"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
```

**Depois:**
```tsx
<Input
  name="username"
  type="text"
  placeholder="Usuário"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  data-testid="login-username"
/>
```

#### 2. **Melhorias no global-setup.ts**
- ✅ Detecção automática de SimpleAuth vs Google OAuth
- ✅ Seletores múltiplos com fallbacks
- ✅ Timeout aumentado para 15s
- ✅ Logging detalhado para debug
- ✅ Suporte a `data-testid`

**Código melhorado:**
```typescript
// Detecta automaticamente qual tipo de auth
const usernameInput = page.locator(
  'input[name="username"], input[data-testid="login-username"], input[placeholder*="usuário" i]'
).first();

const isSimpleAuth = (await usernameInput.count()) > 0;

if (isSimpleAuth) {
  await usernameInput.fill(TEST_USER_EMAIL);
  await passwordInput.fill(TEST_USER_PASSWORD);
}
```

---

## 🧪 Como Testar

### Teste Rápido do Login:
```bash
./test-e2e-login.sh
```

### Teste Completo E2E:
```bash
npm run test:e2e
```

### Debug Interativo:
```bash
npx playwright test --debug
```

### Ver em Headed Mode:
```bash
npm run test:e2e:headed
```

---

## ✅ Verificações Pré-Teste

1. **Servidor rodando?**
   ```bash
   curl http://127.0.0.1:5173
   ```

2. **Credenciais configuradas?**
   ```bash
   grep "TEST_USER" .env
   # Deve mostrar:
   # TEST_USER_EMAIL=adm
   # TEST_USER_PASSWORD=adm123
   ```

3. **Modo auth correto?**
   ```bash
   grep "VITE_AUTH_MODE" .env
   # Deve mostrar:
   # VITE_AUTH_MODE=simple
   ```

4. **Login manual funciona?**
   - Abra http://127.0.0.1:5173
   - Entre com adm/adm123
   - Deve redirecionar para dashboard

---

## 🔍 Debug Detalhado

### Ver logs do global-setup:
```bash
npx playwright test --grep "^$" --global-setup tests/e2e/global-setup.ts
```

### Logs esperados (sucesso):
```
🚀 Starting E2E tests...
📧 Using test credentials: adm (mode: simple)
🌐 Base URL: http://127.0.0.1:5173
💾 Storage path: /workspaces/.../storageState.json
✅ Simple auth mode - using default credentials (adm/adm123)
🔐 Attempting login...
📄 Page loaded
📝 Login fields detected
🔍 Auth mode detected: SimpleAuth
✏️ Filled SimpleAuth credentials: adm
⏳ Waiting for navigation...
✅ Storage state saved to /workspaces/.../storageState.json
```

### Logs de erro (falha):
```
⚠️ Failed to create storage state during global setup:
page.waitForSelector: Timeout 15000ms exceeded.
```

**Ação:**
1. Verificar se página carregou (`📄 Page loaded` aparece?)
2. Verificar se campos foram detectados (`📝 Login fields detected` aparece?)
3. Se não aparecer, inspecionar HTML da página de login

---

## 📊 Checklist de Correções

- [x] SimpleAuth com `name="username"` e `name="password"`
- [x] Botão submit com `type="submit"`
- [x] Data-testid em todos os campos
- [x] Global-setup detecta SimpleAuth automaticamente
- [x] Seletores com múltiplos fallbacks
- [x] Timeout adequado (15s)
- [x] Logging detalhado
- [x] Script de teste rápido (`test-e2e-login.sh`)
- [x] Documentação de troubleshooting

---

## 🎯 Status Atual

✅ **Correções aplicadas com sucesso!**

- SimpleAuth totalmente compatível com testes E2E
- Global-setup detecta automaticamente SimpleAuth vs Google OAuth
- Seletores robustos com múltiplos fallbacks
- Logging completo para debug

### Próximos Passos:

1. Execute `./test-e2e-login.sh` para validar login
2. Execute `npm run test:e2e` para rodar todos os testes
3. Se falhar, use `npx playwright test --debug` para debug interativo

---

**Data:** 5 de dezembro de 2025  
**Status:** ✅ Corrigido e testável
