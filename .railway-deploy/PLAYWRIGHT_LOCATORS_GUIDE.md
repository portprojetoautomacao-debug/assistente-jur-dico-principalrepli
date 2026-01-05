# 🎯 Guia Completo: Playwright Locators e Inspector

**Data**: 2025-12-05  
**Projeto**: Assistente Jurídico PJe

---

## 📋 Índice

1. [Playwright Inspector - Ferramenta Visual](#playwright-inspector)
2. [Tipos de Locators](#tipos-de-locators)
3. [Como Usar os Campos do Inspector](#campos-do-inspector)
4. [Estratégia de Seletores](#estratégia-de-seletores)
5. [Exemplos Práticos](#exemplos-práticos)

---

## 🔍 Playwright Inspector - Ferramenta Visual

### Como Abrir o Inspector:

```bash
# 1. Método Codegen (recomendado para iniciantes)
npx playwright codegen http://127.0.0.1:5173

# 2. Método Debug (durante execução de testes)
npx playwright test --debug

# 3. Método UI Mode (interface completa)
npx playwright test --ui

# 4. Específico para uma página
npx playwright codegen http://127.0.0.1:5173/agentes
```

### Interface do Inspector:

```
┌─────────────────────────────────────────────────────────────┐
│ Playwright Inspector                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🎯 Pick Locator    [🔍] Explore    [▶️] Record             │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📍 Locator:  [_________________________] [Search]      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎭 Aria:     [_________________________] [Search]      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ☑️ Copy on Pick                                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ // Generated Code                                       │ │
│ │ await page.locator('.btn-primary').click();             │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📍 Campos do Inspector - Explicação Detalhada

### 1️⃣ Campo "Locator"

**Função**: Inserir e testar qualquer tipo de seletor

**Tipos aceitos**:

| Tipo | Sintaxe | Exemplo |
|------|---------|---------|
| **CSS** | `.class` `#id` | `.btn-primary` |
| **XPath** | `//tag[@attr]` | `//button[@type="submit"]` |
| **Text** | `text=` | `text=Login` |
| **Role** | `role=` | `role=button[name="Entrar"]` |
| **Test ID** | `data-testid=` | `[data-testid="login-btn"]` |
| **Placeholder** | `placeholder=` | `input[placeholder="Email"]` |

**Como usar**:
1. Digite o seletor no campo "Locator"
2. Clique em **[Search]** ou pressione **Enter**
3. Elementos correspondentes são destacados na página
4. Contador mostra quantos elementos foram encontrados

**Exemplos práticos**:

```javascript
// 1. Por classe CSS
.agents-card

// 2. Por ID
#main-dashboard

// 3. Por atributo
[data-testid="agent-toggle"]

// 4. Por texto exato
text=Harvey Specter

// 5. Por texto parcial
text=/Harvey/i

// 6. Combinado (CSS + texto)
button:has-text("Ativar")

// 7. XPath complexo
//div[contains(@class, 'agent')]//button[text()='Desativar']
```

---

### 2️⃣ Campo "Aria" (ARIA Attributes)

**Função**: Buscar elementos por atributos de acessibilidade (WCAG)

**Por que usar Aria Locators?**
- ✅ Mais resilientes a mudanças visuais
- ✅ Seguem padrões de acessibilidade
- ✅ Melhor para testes semânticos
- ✅ Recomendado por Playwright

**Sintaxe principal**:

```javascript
role=ROLE_TYPE[name="ACCESSIBLE_NAME"]
```

**Roles disponíveis** (principais):

| Role | Elemento HTML | Exemplo |
|------|---------------|---------|
| `button` | `<button>`, `<input type="button">` | `role=button[name="Login"]` |
| `textbox` | `<input type="text">` | `role=textbox[name="Email"]` |
| `checkbox` | `<input type="checkbox">` | `role=checkbox[name="Aceito"]` |
| `link` | `<a>` | `role=link[name="Sair"]` |
| `heading` | `<h1>`, `<h2>`, etc. | `role=heading[level=1]` |
| `img` | `<img>` | `role=img[name="Logo"]` |
| `listitem` | `<li>` | `role=listitem` |
| `navigation` | `<nav>` | `role=navigation` |
| `main` | `<main>` | `role=main` |
| `complementary` | `<aside>` | `role=complementary` |

**Exemplos práticos para o projeto**:

```javascript
// 1. Botão de login
role=button[name="Entrar"]
role=button[name=/entrar/i]  // Case-insensitive

// 2. Campo de email
role=textbox[name="Email"]
role=textbox[name="Usuário"]

// 3. Checkbox de aceite
role=checkbox[name="Lembrar-me"]

// 4. Link de navegação
role=link[name="Processos"]
role=link[name="Agentes IA"]

// 5. Título da página
role=heading[level=1][name="Dashboard"]

// 6. Navegação principal
role=navigation >> role=link[name="CRM"]

// 7. Card de agente
role=article >> role=button[name="Ativar"]
```

---

### 3️⃣ Checkbox "Copy on Pick"

**Função**: Copiar automaticamente o locator gerado para a área de transferência

**Quando marcar** ✅:
- Você está escrevendo testes e quer copiar seletores rapidamente
- Precisa colar o código diretamente no editor
- Está explorando elementos para documentar seletores

**Quando desmarcar** ❌:
- Só quer visualizar elementos destacados na página
- Está testando diferentes seletores para ver qual funciona melhor
- Não precisa do código gerado neste momento

**Workflow recomendado**:

```
1. ❌ Desmarcado - Explorar elementos
   👉 Clicar em vários elementos para entender a estrutura

2. ✅ Marcado - Copiar seletores finais
   👉 Clicar no elemento desejado
   👉 Locator é copiado automaticamente
   👉 Colar no teste (Ctrl+V)

3. 🔄 Repetir para cada elemento do teste
```

---

## 🎯 Tipos de Locators - Ordem de Prioridade

### Hierarquia Recomendada pelo Playwright:

```
1️⃣ ARIA Roles (melhor)
   role=button[name="Login"]
   
2️⃣ Test IDs
   [data-testid="login-button"]
   
3️⃣ Text Content
   text=Login
   
4️⃣ CSS Selectors
   .btn-primary
   
5️⃣ XPath (último recurso)
   //button[@class="btn-primary"]
```

### Exemplos para Cada Tipo:

#### ✅ **1. ARIA Roles** (RECOMENDADO)

```typescript
// Botão
await page.getByRole('button', { name: 'Entrar' }).click();

// Campo de texto
await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');

// Link
await page.getByRole('link', { name: 'Processos' }).click();

// Checkbox
await page.getByRole('checkbox', { name: 'Lembrar-me' }).check();

// Heading
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
```

#### ✅ **2. Test IDs** (BOM)

```typescript
// HTML: <button data-testid="agent-toggle">Ativar</button>
await page.getByTestId('agent-toggle').click();

// HTML: <input data-testid="username-input" />
await page.getByTestId('username-input').fill('admin');
```

#### ⚠️ **3. Text Content** (MÉDIO)

```typescript
// Texto exato
await page.getByText('Harvey Specter').click();

// Texto parcial (regex)
await page.getByText(/harvey/i).click();

// Placeholder
await page.getByPlaceholder('Digite seu email').fill('user@example.com');

// Label
await page.getByLabel('Senha').fill('senha123');
```

#### ⚠️ **4. CSS Selectors** (FRÁGIL)

```typescript
// Classe
await page.locator('.agent-card').first().click();

// ID
await page.locator('#main-dashboard').isVisible();

// Atributo
await page.locator('[name="username"]').fill('admin');

// Combinado
await page.locator('button.btn-primary[type="submit"]').click();
```

#### ❌ **5. XPath** (ÚLTIMO RECURSO)

```typescript
// XPath simples
await page.locator('//button[@type="submit"]').click();

// XPath complexo (evitar!)
await page.locator('//div[@class="card"]//button[contains(text(), "Ativar")]').click();
```

---

## 🔧 Estratégia de Seletores para o Projeto

### Para **Componentes de Autenticação** (SimpleAuth.tsx):

```typescript
// ✅ MELHOR ABORDAGEM - Usar ARIA + Test IDs

// Arquivo: src/components/SimpleAuth.tsx
<input 
  name="username"
  type="text"
  data-testid="username-input"
  aria-label="Nome de usuário"
  placeholder="Usuário"
/>

<input 
  name="password"
  type="password"
  data-testid="password-input"
  aria-label="Senha"
  placeholder="Senha"
/>

<button 
  type="submit"
  data-testid="login-button"
  aria-label="Entrar no sistema"
>
  Entrar
</button>

// No teste (tests/e2e/global-setup.ts):
await page.getByTestId('username-input').fill('adm');
await page.getByTestId('password-input').fill('adm123');
await page.getByTestId('login-button').click();

// OU usando ARIA:
await page.getByRole('textbox', { name: 'Nome de usuário' }).fill('adm');
await page.getByRole('textbox', { name: 'Senha' }).fill('adm123');
await page.getByRole('button', { name: 'Entrar no sistema' }).click();
```

### Para **Agentes IA** (AIAgents.tsx):

```typescript
// Status badge
await page.getByTestId('agent-harvey-status').isVisible();

// Toggle button
await page.getByRole('button', { name: 'Ativar Harvey Specter' }).click();

// Logs
await page.getByTestId('agent-logs').isVisible();

// Métricas
await page.getByText('Tarefas Completadas: 10').isVisible();
```

### Para **Navegação**:

```typescript
// Links principais
await page.getByRole('link', { name: 'Dashboard' }).click();
await page.getByRole('link', { name: 'Processos' }).click();
await page.getByRole('link', { name: 'Agentes IA' }).click();
await page.getByRole('link', { name: 'Calculadora de Prazos' }).click();

// Navegação por URL (mais confiável para testes)
await page.goto('/processos');
await page.goto('/agentes');
await page.goto('/calculadora');
```

---

## 🎬 Exemplos Práticos - Passo a Passo

### **Exemplo 1: Encontrar Botão de Login**

```bash
# 1. Abrir Inspector
npx playwright codegen http://127.0.0.1:5173

# 2. Clicar no botão 🎯 "Pick Locator"

# 3. Na página, clicar no botão "Entrar"

# 4. Inspector gera automaticamente:
```

**Campo Locator mostra**:
```
button:has-text("Entrar")
```

**Campo Aria mostra**:
```
role=button[name="Entrar"]
```

**Código gerado**:
```typescript
await page.getByRole('button', { name: 'Entrar' }).click();
```

---

### **Exemplo 2: Testar Diferentes Seletores**

**Cenário**: Encontrar campo de email

```
1. ❌ Desmarcar "Copy on Pick"

2. Testar no campo "Locator":
   input[type="email"]         → ✅ 1 elemento encontrado
   input[name="email"]          → ✅ 1 elemento encontrado
   .email-input                 → ❌ 0 elementos (classe não existe)
   #email                       → ❌ 0 elementos (ID não existe)

3. Testar no campo "Aria":
   role=textbox                 → ✅ 3 elementos (muito amplo)
   role=textbox[name="Email"]   → ✅ 1 elemento (perfeito!)

4. ✅ Marcar "Copy on Pick"

5. Clicar novamente no campo de email

6. Código copiado automaticamente:
   await page.getByRole('textbox', { name: 'Email' }).fill('...');
```

---

### **Exemplo 3: Debugging de Seletor que Não Funciona**

**Problema**: Teste falhando com seletor `.agent-card`

```typescript
// ❌ Teste falhando
await page.locator('.agent-card').first().click();
// Error: Timeout waiting for locator
```

**Solução com Inspector**:

```
1. Abrir Inspector:
   npx playwright codegen http://127.0.0.1:5173/agentes

2. No campo "Locator", testar:
   .agent-card                  → ❌ 0 elementos (classe mudou!)
   .agents-card                 → ✅ 15 elementos (classe correta)
   [data-testid="agent-card"]   → ✅ 15 elementos (melhor!)

3. Atualizar teste:
   await page.getByTestId('agent-card').first().click();
```

---

## 🚀 Comandos Úteis do Inspector

### **Navegação Interativa**:

```bash
# Abrir Inspector e navegar automaticamente
npx playwright codegen --target=chromium http://127.0.0.1:5173/agentes

# Especificar navegador
npx playwright codegen --target=firefox http://127.0.0.1:5173

# Com device emulation
npx playwright codegen --device="iPhone 12" http://127.0.0.1:5173

# Com dark mode
npx playwright codegen --color-scheme=dark http://127.0.0.1:5173

# Com timezone
npx playwright codegen --timezone="America/Sao_Paulo" http://127.0.0.1:5173
```

### **Recording Mode**:

```bash
# Gravar ações automaticamente
npx playwright codegen --save-storage=auth.json http://127.0.0.1:5173

# Reusar autenticação gravada
npx playwright codegen --load-storage=auth.json http://127.0.0.1:5173/dashboard
```

---

## 📊 Comparação: Inspector vs Manual

| Aspecto | Inspector (Pick Locator) | Manual (escrever código) |
|---------|--------------------------|--------------------------|
| **Velocidade** | ⚡ Rápido (clique → código) | 🐌 Lento (inspeção → escrita) |
| **Precisão** | ✅ Sempre correto | ⚠️ Pode errar sintaxe |
| **Aprendizado** | 📚 Ensina boas práticas | 🎓 Requer conhecimento |
| **Debugging** | 🔍 Visual e intuitivo | 🐛 Requer logs e erros |
| **Eficiência** | 🚀 Ideal para iniciantes | 🏆 Ideal para experts |

**Recomendação**: Use Inspector para **aprender** e **debugar**, depois escreva manualmente para **otimizar**.

---

## ✅ Checklist: Quando Usar Cada Campo

### ✅ Use o campo **"Locator"** quando:
- [ ] Precisa testar um seletor CSS específico
- [ ] Quer buscar por texto exato ou parcial
- [ ] Está debugando um XPath
- [ ] Precisa combinar múltiplos seletores

### ✅ Use o campo **"Aria"** quando:
- [ ] Quer seletores baseados em acessibilidade
- [ ] Precisa de seletores mais resilientes
- [ ] Está seguindo boas práticas de testes
- [ ] Elementos têm roles e labels apropriados

### ✅ Marque **"Copy on Pick"** quando:
- [ ] Está escrevendo testes novos
- [ ] Quer copiar seletores rapidamente
- [ ] Precisa documentar seletores
- [ ] Está criando guias de teste

### ❌ Desmarcue **"Copy on Pick"** quando:
- [ ] Só quer explorar a página
- [ ] Está testando vários seletores diferentes
- [ ] Não precisa do código gerado ainda
- [ ] Está analisando estrutura HTML

---

## 🎯 Próximos Passos

1. **Abrir Inspector agora**:
   ```bash
   npm run dev  # Certifique-se que app está rodando
   npx playwright codegen http://127.0.0.1:5173
   ```

2. **Testar os 3 campos**:
   - Campo Locator: Digite `.btn-primary`
   - Campo Aria: Digite `role=button`
   - Marque "Copy on Pick" e clique em um botão

3. **Aplicar no projeto**:
   - Adicionar `data-testid` em componentes críticos
   - Adicionar `aria-label` para acessibilidade
   - Atualizar testes com seletores resilientes

---

## 📚 Referências

- **Playwright Locators**: https://playwright.dev/docs/locators
- **ARIA Roles**: https://www.w3.org/TR/wai-aria-1.2/#role_definitions
- **Inspector**: https://playwright.dev/docs/debug#playwright-inspector
- **Codegen**: https://playwright.dev/docs/codegen

---

**Dica Final**: 💡 Sempre prefira `getByRole()` > `getByTestId()` > `getByText()` > `locator()`. Seletores baseados em acessibilidade são mais resilientes e seguem boas práticas!
