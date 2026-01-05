# 🎯 Seletores Playwright - Prontos para Colar

**Data**: 2025-12-05  
**Projeto**: Assistente Jurídico PJe

---

## 📋 Como Usar Este Documento

1. **Abra o Playwright Inspector**: `npx playwright codegen http://127.0.0.1:5173`
2. **Copie o seletor** da seção desejada abaixo
3. **Cole no campo apropriado** do Inspector (Locator, Aria ou Test ID)
4. **Pressione Enter** para testar
5. **Marque "Copy on Pick"** se quiser copiar o código gerado

---

## 🔐 AUTENTICAÇÃO (SimpleAuth)

### Campo de Usuário

**Campo Locator:**
```
input[name="username"]
```

**Campo Aria:**
```
role=textbox[name="Usuário"]
```

**Test ID:**
```
[data-testid="login-username"]
```

**Código TypeScript gerado:**
```typescript
// Opção 1 - ARIA (recomendado)
await page.getByRole('textbox', { name: 'Usuário' }).fill('adm');

// Opção 2 - Test ID
await page.getByTestId('login-username').fill('adm');

// Opção 3 - Name attribute
await page.locator('input[name="username"]').fill('adm');
```

---

### Campo de Senha

**Campo Locator:**
```
input[name="password"]
```

**Campo Aria:**
```
role=textbox[name="Senha"]
```

**Test ID:**
```
[data-testid="login-password"]
```

**Código TypeScript gerado:**
```typescript
// Opção 1 - ARIA (recomendado)
await page.getByRole('textbox', { name: 'Senha' }).fill('adm123');

// Opção 2 - Test ID
await page.getByTestId('login-password').fill('adm123');

// Opção 3 - Name attribute
await page.locator('input[name="password"]').fill('adm123');
```

---

### Botão Entrar

**Campo Locator:**
```
button[type="submit"]
```

**Campo Aria:**
```
role=button[name="Entrar"]
```

**Test ID:**
```
[data-testid="login-submit"]
```

**Código TypeScript gerado:**
```typescript
// Opção 1 - ARIA (recomendado)
await page.getByRole('button', { name: 'Entrar' }).click();

// Opção 2 - Test ID
await page.getByTestId('login-submit').click();

// Opção 3 - Type attribute
await page.locator('button[type="submit"]').click();
```

---

### Mensagem de Erro

**Campo Locator:**
```
.text-destructive
```

**Campo Aria:**
```
text=Credenciais inválidas
```

**Código TypeScript gerado:**
```typescript
// Verificar se erro aparece
await expect(page.getByText('Credenciais inválidas')).toBeVisible();

// OU por classe CSS
await expect(page.locator('.text-destructive')).toBeVisible();
```

---

## 🧭 NAVEGAÇÃO (Sidebar)

### Menu de Navegação Principal

**Campo Locator:**
```
nav[data-testid="sidebar-nav"]
```

**Campo Aria:**
```
role=navigation
```

**Test ID:**
```
[data-testid="sidebar-nav"]
```

**Código TypeScript gerado:**
```typescript
// Verificar se navegação está visível
await expect(page.getByRole('navigation')).toBeVisible();

// OU por test ID
await expect(page.getByTestId('sidebar-nav')).toBeVisible();
```

---

### Links de Navegação (por ID)

**Dashboard:**
```
[data-testid="nav-dashboard"]
```

**Processos:**
```
[data-testid="nav-processes"]
```

**Agentes IA:**
```
[data-testid="nav-agents"]
```

**Calculadora:**
```
[data-testid="nav-calculator"]
```

**Calendário:**
```
[data-testid="nav-calendar"]
```

**Financeiro:**
```
[data-testid="nav-financial"]
```

**DJEN:**
```
[data-testid="nav-djen"]
```

**Código TypeScript gerado:**
```typescript
// Navegar para Dashboard
await page.getByTestId('nav-dashboard').click();

// Navegar para Processos
await page.getByTestId('nav-processes').click();

// Navegar para Agentes IA
await page.getByTestId('nav-agents').click();

// Navegar para Calculadora
await page.getByTestId('nav-calculator').click();

// OU usar ARIA (mais semântico)
await page.getByRole('link', { name: 'Dashboard' }).click();
await page.getByRole('link', { name: 'Processos' }).click();
await page.getByRole('link', { name: 'Agentes IA' }).click();
await page.getByRole('link', { name: 'Calculadora de Prazos' }).click();
```

---

## 🤖 AGENTES IA (AIAgents)

### Cards de Agentes

**Campo Locator (todos os agentes):**
```
.agent-card
```

**Campo Locator (agente específico - Harvey):**
```
[data-agent-id="harvey"]
```

**Código TypeScript gerado:**
```typescript
// Listar todos os cards de agentes
const agentCards = page.locator('.agent-card');
await expect(agentCards).toHaveCount(15);

// Interagir com Harvey Specter
const harveyCard = page.locator('[data-agent-id="harvey"]');
await expect(harveyCard).toBeVisible();
```

---

### Toggle de Agentes (Ativar/Desativar)

**Campo Locator:**
```
button.agent-toggle
```

**Campo Aria:**
```
role=switch
```

**Código TypeScript gerado:**
```typescript
// Encontrar todos os switches de agentes
const toggles = page.getByRole('switch');

// Toggle específico (por nome)
await page.getByRole('switch', { name: /Harvey Specter/i }).click();
```

---

### Status Badge

**Campo Locator:**
```
.agent-status-badge
```

**Código TypeScript gerado:**
```typescript
// Verificar status "Ativo"
await expect(page.getByText('Ativo')).toBeVisible();

// Verificar status "Pausado"
await expect(page.getByText('Pausado')).toBeVisible();

// Verificar status "Streaming"
await expect(page.getByText('Streaming')).toBeVisible();
```

---

### Logs de Atividade

**Campo Locator:**
```
.agent-logs
```

**Código TypeScript gerado:**
```typescript
// Acessar painel de logs
const logsPanel = page.locator('.agent-logs');
await expect(logsPanel).toBeVisible();
```

---

### Métricas dos Agentes

**Campo Locator:**
```
.agent-metrics
```

**Código TypeScript gerado:**
```typescript
// Verificar métricas
const metrics = page.locator('.agent-metrics');
await expect(metrics).toBeVisible();

// Verificar texto de métrica específica
await expect(page.getByText(/Tarefas Completadas:/i)).toBeVisible();
await expect(page.getByText(/Taxa de Sucesso:/i)).toBeVisible();
```

---

## 📄 DJEN PUBLICAÇÕES (DJENPublicationsWidget)

### Botão Sincronizar

**Campo Aria:**
```
role=button[name="Sincronizar publicações agora"]
```

**Código TypeScript gerado:**
```typescript
// Clicar em sincronizar
await page.getByRole('button', { name: 'Sincronizar publicações agora' }).click();
```

---

## 📁 DOCUMENTOS (DocumentUploader)

### Botão Enviar Arquivos

**Campo Aria:**
```
role=button[name="Enviar arquivos"]
```

**Código TypeScript gerado:**
```typescript
await page.getByRole('button', { name: 'Enviar arquivos' }).click();
```

---

### Ações em Documentos

**Visualizar:**
```
role=button[name="Visualizar documento"]
```

**Baixar:**
```
role=button[name="Baixar documento"]
```

**Excluir:**
```
role=button[name="Excluir documento"]
```

**Código TypeScript gerado:**
```typescript
// Visualizar documento
await page.getByRole('button', { name: 'Visualizar documento' }).click();

// Baixar documento
await page.getByRole('button', { name: 'Baixar documento' }).click();

// Excluir documento
await page.getByRole('button', { name: 'Excluir documento' }).click();
```

---

## 🔔 NOTIFICAÇÕES (NotificationSettings)

### Switches de Notificação

**Prazos:**
```
role=switch[name="Ativar alertas de prazos próximos do vencimento (D-7, D-2, D-1)"]
```

**Agentes:**
```
role=switch[name="Ativar alertas quando agentes autônomos completarem tarefas"]
```

**Financeiro:**
```
role=switch[name="Ativar alertas sobre honorários vencidos e pagamentos pendentes"]
```

**Código TypeScript gerado:**
```typescript
// Toggle alertas de prazos
await page.getByRole('switch', { 
  name: 'Ativar alertas de prazos próximos do vencimento (D-7, D-2, D-1)' 
}).click();

// Toggle alertas de agentes
await page.getByRole('switch', { 
  name: 'Ativar alertas quando agentes autônomos completarem tarefas' 
}).click();

// Toggle alertas financeiros
await page.getByRole('switch', { 
  name: 'Ativar alertas sobre honorários vencidos e pagamentos pendentes' 
}).click();
```

---

## 📋 PROCESSOS (ProcessCRM)

### Opções do Processo

**Campo Aria:**
```
role=button[name="Opções do processo"]
```

**Código TypeScript gerado:**
```typescript
await page.getByRole('button', { name: 'Opções do processo' }).click();
```

---

### Fechar Detalhes

**Campo Aria:**
```
role=button[name="Fechar detalhes"]
```

**Código TypeScript gerado:**
```typescript
await page.getByRole('button', { name: 'Fechar detalhes' }).click();
```

---

## 📝 TEMPLATES (DocumentTemplates)

### Upload de Template

**Campo Aria:**
```
role=button[name="Upload de Template"]
```

**Código TypeScript gerado:**
```typescript
await page.getByRole('button', { name: 'Upload de Template' }).click();
```

---

### Ações em Templates

**Baixar:**
```
role=button[name=/Baixar template/i]
```

**Excluir:**
```
role=button[name=/Excluir template/i]
```

**Código TypeScript gerado:**
```typescript
// Baixar template específico
await page.getByRole('button', { name: 'Baixar template Petição Inicial' }).click();

// Excluir template específico
await page.getByRole('button', { name: 'Excluir template Petição Inicial' }).click();
```

---

## 🎯 SELETORES GENÉRICOS ÚTEIS

### Botões Comuns

**Salvar:**
```
role=button[name="Salvar"]
```

**Cancelar:**
```
role=button[name="Cancelar"]
```

**Fechar:**
```
role=button[name="Fechar"]
```

**Confirmar:**
```
role=button[name="Confirmar"]
```

**Código TypeScript gerado:**
```typescript
await page.getByRole('button', { name: 'Salvar' }).click();
await page.getByRole('button', { name: 'Cancelar' }).click();
await page.getByRole('button', { name: 'Fechar' }).click();
await page.getByRole('button', { name: 'Confirmar' }).click();
```

---

### Títulos e Headings

**Título Principal (H1):**
```
role=heading[level=1]
```

**Subtítulo (H2):**
```
role=heading[level=2]
```

**Código TypeScript gerado:**
```typescript
// Verificar título da página
await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();

// Verificar subtítulo
await expect(page.getByRole('heading', { level: 2, name: 'Agentes IA' })).toBeVisible();
```

---

### Inputs Genéricos

**Qualquer campo de texto:**
```
role=textbox
```

**Campo com label específico:**
```
role=textbox[name="Email"]
```

**Código TypeScript gerado:**
```typescript
// Preencher campo de email
await page.getByRole('textbox', { name: 'Email' }).fill('teste@example.com');

// Preencher campo de nome
await page.getByRole('textbox', { name: 'Nome' }).fill('João Silva');
```

---

## 🚀 FLUXO COMPLETO DE LOGIN (Exemplo Prático)

### Passo a Passo com Seletores

```typescript
import { test, expect } from '@playwright/test';

test('Login completo no sistema', async ({ page }) => {
  // 1. Navegar para a página
  await page.goto('http://127.0.0.1:5173');

  // 2. Preencher usuário (ARIA - recomendado)
  await page.getByRole('textbox', { name: 'Usuário' }).fill('adm');

  // 3. Preencher senha
  await page.getByRole('textbox', { name: 'Senha' }).fill('adm123');

  // 4. Clicar em Entrar
  await page.getByRole('button', { name: 'Entrar' }).click();

  // 5. Verificar se navegou para Dashboard
  await expect(page).toHaveURL(/.*dashboard/);

  // 6. Verificar se navegação está visível
  await expect(page.getByRole('navigation')).toBeVisible();

  // 7. Navegar para Agentes IA
  await page.getByRole('link', { name: 'Agentes IA' }).click();

  // 8. Verificar se página de agentes carregou
  await expect(page.getByRole('heading', { name: 'Agentes IA' })).toBeVisible();

  // 9. Ativar Harvey Specter (exemplo)
  await page.getByRole('switch', { name: /Harvey Specter/i }).click();

  // 10. Verificar status "Ativo"
  await expect(page.getByText('Ativo')).toBeVisible();
});
```

---

## 📊 TABELA DE REFERÊNCIA RÁPIDA

| Elemento | Campo Locator | Campo Aria | Test ID |
|----------|---------------|------------|---------|
| **Login - Usuário** | `input[name="username"]` | `role=textbox[name="Usuário"]` | `[data-testid="login-username"]` |
| **Login - Senha** | `input[name="password"]` | `role=textbox[name="Senha"]` | `[data-testid="login-password"]` |
| **Login - Botão** | `button[type="submit"]` | `role=button[name="Entrar"]` | `[data-testid="login-submit"]` |
| **Nav - Sidebar** | `nav` | `role=navigation` | `[data-testid="sidebar-nav"]` |
| **Nav - Dashboard** | `a[href="/dashboard"]` | `role=link[name="Dashboard"]` | `[data-testid="nav-dashboard"]` |
| **Nav - Processos** | `a[href="/processos"]` | `role=link[name="Processos"]` | `[data-testid="nav-processes"]` |
| **Nav - Agentes** | `a[href="/agentes"]` | `role=link[name="Agentes IA"]` | `[data-testid="nav-agents"]` |
| **Agent - Toggle** | `button.agent-toggle` | `role=switch` | N/A |
| **DJEN - Sync** | `button` | `role=button[name="Sincronizar publicações agora"]` | N/A |

---

## 💡 DICAS DE USO NO INSPECTOR

### 1. Testar Múltiplos Seletores

```
1. Cole no campo "Locator": input[name="username"]
   → Pressione Enter → Elemento destacado?
   
2. Cole no campo "Aria": role=textbox[name="Usuário"]
   → Pressione Enter → Funciona melhor?
   
3. Cole no campo "Locator": [data-testid="login-username"]
   → Pressione Enter → Mais específico?
```

### 2. Verificar Quantos Elementos Correspondem

O Inspector mostra: **"1 element"** ou **"5 elements"**

- ✅ **1 element** = Seletor perfeito!
- ⚠️ **5 elements** = Precisa ser mais específico

### 3. Usar "Copy on Pick"

1. ✅ **Marque** "Copy on Pick"
2. 🖱️ **Clique** no elemento da página
3. 📋 Código **copiado automaticamente**
4. 📝 **Cole** no seu teste

---

## 🎓 ORDEM DE PRIORIDADE

```
1️⃣ ARIA Roles          → role=button[name="Entrar"]
2️⃣ Test IDs            → [data-testid="login-submit"]
3️⃣ Semantic Selectors  → input[name="username"]
4️⃣ Text Content        → text=Entrar
5️⃣ CSS Classes         → .btn-primary
6️⃣ XPath               → //button[@type="submit"]
```

**Sempre prefira ARIA quando disponível!**

---

## 📚 Próximos Passos

1. **Abrir Inspector**: `npx playwright codegen http://127.0.0.1:5173`
2. **Copiar seletores** deste documento
3. **Colar nos campos** do Inspector
4. **Testar** se elementos são encontrados
5. **Copiar código gerado** para seus testes

---

**Documento criado em**: 2025-12-05  
**Última atualização**: 2025-12-05  
**Versão**: 1.0
