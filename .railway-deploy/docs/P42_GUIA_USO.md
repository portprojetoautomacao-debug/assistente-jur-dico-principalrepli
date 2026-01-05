# 🪄 P42 JS Assistant - Guia de Uso

**P42 JS Assistant** é uma extensão poderosa de refatoração para JavaScript/TypeScript com 120+ code actions que automatizam modernizações, limpezas e melhorias de código.

## 📋 Status da Instalação

- ✅ **Extensão instalada**: `p42ai.refactor`
- ✅ **Configurações aplicadas**: `.vscode/settings.json`
- ✅ **Atalhos configurados**: `.vscode/keybindings.json`
- ✅ **Modo**: `moderate` automation (balanceado)

---

## ⌨️ Atalhos de Teclado (Linux/Windows)

| Ação | Atalho | Descrição |
|------|--------|-----------|
| **Quick Fix** | `Ctrl + .` | Menu de correções rápidas |
| **Refactor** | `Ctrl + Alt + R` | Menu de refatorações |
| **Source Action** | `Ctrl + Alt + S` | Ações de código-fonte |
| **Extract** | `Ctrl + Alt + X` | Extrair variável/função |
| **Inline** | `Ctrl + Alt + I` | Inline variável/função |
| **Toggle Braces** | `Ctrl + Alt + B` | Adicionar/remover `{}` |
| **Move Up** | `Ctrl + Alt + U` | Mover bloco para cima |
| **Move Down** | `Ctrl + Alt + J` | Mover bloco para baixo |
| **Other Action** | `Ctrl + Alt + A` | Outras ações P42 |

### Atalhos Adicionais

| Ação | Atalho | Descrição |
|------|--------|-----------|
| **Suggestion Panel** | `Ctrl + Alt + P` | Abrir painel de sugestões |
| **Next Suggestion** | `Ctrl + Alt + N` | Aplicar próxima sugestão |
| **Apply All** | `Ctrl + Alt + Shift + A` | Aplicar todas as sugestões |

---

## 🎯 Principais Funcionalidades Habilitadas

### ✨ Modernizações JavaScript (sempre ativo)

- ✅ `var` → `let`/`const`
- ✅ `function` → arrow function `=>`
- ✅ Guard expressions → optional chaining `?.`
- ✅ Default values → nullish coalescing `??`
- ✅ String concatenation → template literals
- ✅ `for` loop → `for...of`
- ✅ `array.indexOf()` → `array.includes()`
- ✅ String checks → `startsWith()`/`endsWith()`

### ⚛️ React Refactorings

- ✅ Extract JSX → Function Component
- ✅ Remove unnecessary `<>...</>` fragments
- ✅ Move JSX attributes
- ✅ Surround with fragment

### 🧹 Code Cleanups (automático)

- ✅ Remove double negation `!!`
- ✅ Remove unnecessary conditional expressions
- ✅ Remove unnecessary `else`
- ✅ Remove unused variables
- ✅ Simplify binary expressions
- ⚠️ **Console.log**: MANTIDO (útil para debug)

### 🧠 Lógica Booleana

- ✅ Invert condition
- ✅ Pull up negation
- ✅ Push down negation
- ✅ Simplify expressions

### 🔀 Branching Statements

- ✅ Introduce early return
- ✅ Merge nested if
- ✅ if-else ↔ switch
- ✅ if-else ↔ ternary operator
- ✅ Move if-else branches

### 📦 Variables & Destructuring

- ✅ Extract variable
- ✅ Inline variable
- ✅ Convert to destructuring
- ✅ Merge destructuring
- ✅ Split variable declarations

### 🔧 TypeScript

- ✅ `Type[]` ↔ `Array<Type>`
- ✅ Move interface/type members
- ⚠️ **Private**: Preferir `private` TypeScript (não `#private`)

---

## 🎨 Painel de Sugestões

O **Suggestion Panel** mostra refatorações recomendadas para o arquivo inteiro:

1. **Abrir painel**: `Ctrl + Alt + P` ou Command Palette → "P42: Show Suggestion Panel"
2. **Ver sugestões**: Lista todas as melhorias detectadas
3. **Aplicar individualmente**: Clique em cada sugestão
4. **Aplicar todas**: `Ctrl + Alt + Shift + A`

### Underlining (Dicas Visuais)

Código que pode ser melhorado é **sublinhado com três pontos** (`...`). Posicione o cursor e pressione `Ctrl + .` para ver as opções.

---

## 🚀 Workflows Recomendados

### 1️⃣ Modernização de Arquivo Legado

```bash
1. Abrir arquivo antigo (ex: código com `var`, `function`, etc.)
2. Ctrl + Alt + P (abrir painel de sugestões)
3. Revisar sugestões (modernizações automáticas)
4. Ctrl + Alt + Shift + A (aplicar todas) ou aplicar uma por uma
5. Ctrl + S (salvar - auto-format via Prettier)
```

### 2️⃣ Refatoração Durante Codificação

```bash
1. Escrever código normalmente
2. Observar underlining (...) em código melhorável
3. Ctrl + . no código sublinhado
4. Escolher refatoração desejada
5. P42 aplica automaticamente
```

### 3️⃣ Extract Variable/Function

```bash
1. Selecionar expressão complexa
2. Ctrl + Alt + X (Extract)
3. P42 extrai para variável `const`
4. Renomear se necessário (F2)
```

### 4️⃣ Cleanup de Código

```bash
1. Após merge/refatoração grande
2. Ctrl + Alt + P (painel de sugestões)
3. Filtrar por "Remove" ou "Simplify"
4. Aplicar cleanups relevantes
```

---

## ⚙️ Configurações Customizadas

### Habilitadas

- **Automation level**: `moderate` (balanceado - não muito agressivo)
- **Show suggestions**: `always` (sempre mostrar underlining)
- **Suggestion panel**: `visible` (painel sempre disponível)

### Desabilitadas

- ❌ **Remove console.log**: Mantemos logs para debug
- ❌ **P42 AI Cloud**: Desabilitado (manter controle local)
- ❌ **#private conversion**: Preferimos TypeScript `private`

### Arquivos Excluídos

```json
[
  "**/node_modules/**",
  "**/dist/**",
  "**/.next/**",
  "**/build/**",
  "**/*.min.js",
  "**/coverage/**"
]
```

---

## 🎯 Casos de Uso no Projeto

### ✅ Recomendado Usar

| Cenário | Code Action | Benefício |
|---------|-------------|-----------|
| Loop antigo | Convert loop to `for...of` | Código mais legível |
| Guard complexo | Convert to optional chaining | Menos linhas, mais claro |
| String concat | Convert to template literal | Moderno e interpolável |
| `if-else` longo | Extract to function | Melhor organização |
| Variável temporária | Inline variable | Reduz complexidade |
| Nested if | Merge nested if | Menos indentação |
| No return | Introduce early return | Menos complexidade ciclomática |
| Ternário triplo | Convert to if-else | SonarCloud fica feliz 😄 |

### ⚠️ Usar com Cuidado

| Cenário | Code Action | Atenção |
|---------|-------------|---------|
| Componentes Tiptap | Qualquer refatoração | Biblioteca frágil - **não tocar** |
| Código de terceiros | Modernizações | Pode quebrar compatibilidade |
| Funções complexas | Extract function | Revisar nomes gerados |
| Logs importantes | Remove console.log | **DESABILITADO** por padrão |

### ❌ Não Usar

- **Não refatorar** `src/components/ui/*` (shadcn - biblioteca imutável)
- **Não refatorar** componentes Tiptap (40 issues SonarCloud ignorados intencionalmente)
- **Não aplicar** "Apply all" sem revisar (modo MANUTENÇÃO ativo)

---

## 📊 Integração com Outras Ferramentas

### P42 + ESLint

- P42 detecta e corrige muitos issues que ESLint reporta
- Complementar: ESLint foca em regras, P42 em refatorações
- Ordem: `P42 → ESLint → Prettier`

### P42 + SonarCloud

- **S3358 (Nested ternary)**: P42 "Convert to if-else"
- **S6582 (Optional chain)**: P42 "Convert to optional chaining"
- **S1134/S1135 (FIXME/TODO)**: Manual (P42 não trata)
- **S7764 (window→globalThis)**: Manual (P42 não trata)

### P42 + Prettier

- P42 aplica refatoração → Prettier formata
- Auto-save aplica ambos automaticamente
- Sem conflitos (P42 muda semântica, Prettier apenas formata)

---

## 🔍 Exemplos Práticos

### Exemplo 1: Optional Chaining

**Antes:**
```typescript
const name = user && user.profile && user.profile.name;
```

**P42 Action**: `Convert to optional chaining`

**Depois:**
```typescript
const name = user?.profile?.name;
```

### Exemplo 2: Nested Ternary (SonarCloud S3358)

**Antes:**
```typescript
const color = status === 'active' ? 'green' : status === 'pending' ? 'yellow' : 'red';
```

**P42 Action**: `Convert conditional expression to if-else`

**Depois:**
```typescript
let color;
if (status === 'active') {
  color = 'green';
} else if (status === 'pending') {
  color = 'yellow';
} else {
  color = 'red';
}
```

### Exemplo 3: Array Modernization

**Antes:**
```typescript
for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}
```

**P42 Action**: `Convert loop to for...of`

**Depois:**
```typescript
for (const item of items) {
  console.log(item);
}
```

### Exemplo 4: Extract Variable

**Antes:**
```typescript
if (user.permissions.includes('admin') && user.status === 'active') {
  // ...
}
```

**P42 Action**: `Extract variable` (selecionar condição)

**Depois:**
```typescript
const isActiveAdmin = user.permissions.includes('admin') && user.status === 'active';
if (isActiveAdmin) {
  // ...
}
```

---

## 📚 Recursos e Referências

- **Documentação oficial**: [p42.ai/docs](https://p42.ai/docs)
- **Issue tracker**: [GitHub P42 Issues](https://github.com/p42ai/js-assistant/issues)
- **Changelog**: Ver no VS Code Extensions → P42 → Changelog
- **Twitter**: [@p42ai](https://twitter.com/p42ai)

---

## 🎓 Dicas Profissionais

1. **Use Quick Fix frequentemente**: `Ctrl + .` é seu melhor amigo
2. **Revise antes de aplicar**: Modo `moderate` é seguro, mas sempre revisar
3. **Combine com ESLint**: P42 + ESLint = código impecável
4. **Painel de sugestões pós-merge**: Sempre executar após merge de branches
5. **Extract quando duplicar**: Viu código duplicado? Extract function/variable
6. **Early return reduz complexidade**: Menos `else`, melhor legibilidade
7. **Template literals > concatenação**: Sempre que possível
8. **Optional chaining é vida**: Menos guards, mais clareza

---

## 🚨 Modo MANUTENÇÃO - Regras Especiais

**IMPORTANTE**: O projeto está em **modo MANUTENÇÃO**. Regras especiais:

✅ **PODE usar P42 para:**
- Corrigir bugs (refatorações que resolvem problemas)
- Simplificar código que está causando issues
- Modernizar código ao tocar em arquivo por outro motivo
- Cleanup após correções (remover variáveis não usadas, etc.)

❌ **NÃO use P42 para:**
- Modernizar código inteiro "porque sim"
- Refatorar arquivos que estão funcionando
- Aplicar "Apply all suggestions" sem revisar
- Tocar em componentes Tiptap ou shadcn/ui

**Regra de ouro**: Se não é bug ou issue SonarCloud MAJOR/CRITICAL, **não mexer**.

---

## ✅ Checklist de Uso Diário

- [ ] Código novo? `Ctrl + .` nos underlines
- [ ] Pré-commit? `Ctrl + Alt + P` → revisar sugestões
- [ ] Pós-merge? Painel de sugestões → cleanup
- [ ] Bug fix? Extract/Inline para clarificar
- [ ] Review? Sugerir P42 actions ao reviewer

---

**Configurado por**: GitHub Copilot  
**Data**: 06/12/2025  
**Versão**: P42 JS Assistant latest  
**Modo**: Moderate automation
