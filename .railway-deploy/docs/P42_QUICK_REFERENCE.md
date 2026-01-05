# 🪄 P42 JS Assistant - Quick Reference Card

**Configuração completa**: Ver [P42_GUIA_USO.md](P42_GUIA_USO.md)

---

## ⌨️ Atalhos Essenciais (Linux/Windows)

| Ação | Atalho | Use Para |
|------|--------|----------|
| **Quick Fix** | `Ctrl + .` | Abrir menu de correções |
| **Refactor** | `Ctrl + Alt + R` | Menu de refatorações |
| **Extract** | `Ctrl + Alt + X` | Extrair variável/função |
| **Inline** | `Ctrl + Alt + I` | Inline variável |
| **Move Up** | `Ctrl + Alt + U` | Mover bloco ↑ |
| **Move Down** | `Ctrl + Alt + J` | Mover bloco ↓ |
| **Toggle {}** | `Ctrl + Alt + B` | Add/remove braces |

---

## 🎯 Top 10 Refatorações

### 1️⃣ **Optional Chaining** (SonarCloud S6582)
```typescript
// Antes
const name = user && user.profile && user.profile.name;
// P42: Convert to optional chaining
const name = user?.profile?.name;
```

### 2️⃣ **Nested Ternary → If-Else** (SonarCloud S3358)
```typescript
// Antes
const color = x === 1 ? 'red' : x === 2 ? 'blue' : 'green';
// P42: Convert conditional expression to if-else
let color;
if (x === 1) color = 'red';
else if (x === 2) color = 'blue';
else color = 'green';
```

### 3️⃣ **Extract Variable**
```typescript
// Antes
if (user.permissions.includes('admin') && user.status === 'active') {
  // ...
}
// Selecionar condição → Ctrl+Alt+X
const isActiveAdmin = user.permissions.includes('admin') && user.status === 'active';
if (isActiveAdmin) {
  // ...
}
```

### 4️⃣ **Early Return**
```typescript
// Antes
function validate(data) {
  if (data) {
    if (data.length > 0) {
      return true;
    }
  }
  return false;
}
// P42: Introduce early return
function validate(data) {
  if (!data) return false;
  if (data.length === 0) return false;
  return true;
}
```

### 5️⃣ **Array.includes()**
```typescript
// Antes
if (x === 'a' || x === 'b' || x === 'c') {
// P42: Convert string comparison chain to array.includes()
if (['a', 'b', 'c'].includes(x)) {
```

### 6️⃣ **Template Literal**
```typescript
// Antes
const msg = 'Hello ' + name + '!';
// P42: Convert to template literal
const msg = `Hello ${name}!`;
```

### 7️⃣ **Arrow Function**
```typescript
// Antes
const double = function(x) { return x * 2; }
// P42: Convert function to arrow function
const double = (x) => x * 2;
```

### 8️⃣ **var → let/const**
```typescript
// Antes
var count = 0;
// P42: Convert var to let or const
const count = 0; // ou let se reatribuído
```

### 9️⃣ **Merge Nested If**
```typescript
// Antes
if (user) {
  if (user.isAdmin) {
    // ...
  }
}
// P42: Merge nested if-statements
if (user && user.isAdmin) {
  // ...
}
```

### 🔟 **Remove Unnecessary Else**
```typescript
// Antes
function getStatus(x) {
  if (x > 0) {
    return 'positive';
  } else {
    return 'negative';
  }
}
// P42: Remove unnecessary else
function getStatus(x) {
  if (x > 0) {
    return 'positive';
  }
  return 'negative';
}
```

---

## 🚀 Workflow de 3 Passos

### Passo 1: Detectar
- Observar código **sublinhado com `...`**
- Ou abrir **Suggestion Panel** (`Ctrl + Alt + P`)

### Passo 2: Aplicar
- Posicionar cursor no código
- `Ctrl + .` → escolher refatoração
- Ou `Ctrl + Alt + X/I/U/J` direto

### Passo 3: Salvar
- `Ctrl + S` → auto-format (Prettier)
- Pre-commit aplica validações

---

## 📋 Quando Usar P42

✅ **SIM - Use para:**
- Corrigir bugs (simplificar lógica complexa)
- Issues SonarCloud (S3358, S6582)
- Modernizar código que você está editando
- Extract/inline ao refatorar
- Early returns para reduzir complexidade

❌ **NÃO - Evite:**
- Refatorar código funcionando (modo MANUTENÇÃO)
- Tiptap UI ou shadcn/ui (bibliotecas de terceiros)
- "Apply all" sem revisar cada sugestão
- Arquivos que você não entende completamente

---

## 🔗 Links Rápidos

- 📖 **Guia completo**: [docs/P42_GUIA_USO.md](P42_GUIA_USO.md)
- 🌐 **Site oficial**: https://p42.ai
- 📚 **Documentação**: https://p42.ai/docs
- 🐛 **Issues**: https://github.com/p42ai/js-assistant/issues

---

**Última atualização**: 06/12/2025  
**Modo**: Moderate automation  
**Status**: ✅ Configurado e pronto para uso
