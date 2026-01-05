# 🤖 GitLab Duo Code Review - Guia Completo

## ✅ Como Usar GitLab Duo para Revisar Código

### 1️⃣ **Via VS Code (Recomendado)**

Você já tem a extensão **GitLab Workflow** instalada!

#### Passo a Passo:

1. **Abra VS Code**
2. **Selecione o código** que quer revisar
3. **Abra o Painel GitLab Workflow:**
   - Clique no ícone do GitLab na sidebar esquerda
   - Ou pressione `Ctrl+Shift+P` → "GitLab: Open Duo Chat"

4. **Use os Comandos:**
   - `/explain` - Explica o código selecionado
   - `/refactor` - Sugere melhorias e refatoração
   - `/fix` - Identifica e corrige problemas
   - `/tests` - Gera testes unitários
   - `/docs` - Gera documentação

#### Exemplo:

```typescript
// Selecione este código no VS Code:
async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/${userId}`)
  const data = response.json()
  return data
}

// Depois digite no Duo Chat:
/refactor melhorando error handling e performance

// Duo sugerirá:
// - Adicionar try/catch
// - Validar resposta HTTP
// - Usar AbortController para timeout
// - Adicionar logging
```

---

### 2️⃣ **Via GitLab Web IDE**

1. **Acesse seu repositório:**
   https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p

2. **Clique em "Edit → Web IDE"** (ou pressione `.`)

3. **Selecione o código** no editor

4. **Clique no ícone de Copilot** (💬) na barra lateral

5. **Use os comandos** igual como em VS Code

---

### 3️⃣ **Via Merge Request (MR) - AUTOMÁTICO**

Quando você criar um MR, GitLab Duo pode revisar automaticamente!

#### Ativar Revisão Automática:

1. **Crie um Merge Request:**
   ```bash
   git push origin feature/seu-branch
   ```

2. **Acesse o MR no GitLab**

3. **No painel de mudanças**, clique em "**Request Duo Review**"

4. **Duo analisa e comenta** com sugestões de melhoria

---

## 🎯 Exemplos de Uso

### Exemplo 1: Revisar Função

**Código Original:**
```typescript
function calculateTotal(items) {
  let total = 0
  for (let i = 0; i < items.length; i++) {
    total = total + items[i].price * items[i].quantity
  }
  return total
}
```

**Comando:**
```
/refactor melhorando legibilidade e performance
```

**Sugestão do Duo:**
```typescript
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}
```

---

### Exemplo 2: Revisar API Call

**Código Original:**
```typescript
async function getUser(id: string) {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
}
```

**Comando:**
```
/fix adicionar tratamento de erros e validações
```

**Sugestão do Duo:**
```typescript
async function getUser(id: string): Promise<User> {
  if (!id) throw new Error('User ID is required')
  
  try {
    const res = await fetch(`/api/users/${id}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    
    const data = await res.json()
    return validateUserData(data)
  } catch (error) {
    captureError(error as Error)
    throw error
  }
}
```

---

### Exemplo 3: Gerar Testes

**Código:**
```typescript
function isPalindrome(str: string): boolean {
  const cleaned = str.replace(/[^a-z0-9]/gi, '').toLowerCase()
  return cleaned === cleaned.split('').reverse().join('')
}
```

**Comando:**
```
/tests incluir casos extremos
```

**Sugestão do Duo:**
```typescript
describe('isPalindrome', () => {
  it('should return true for valid palindromes', () => {
    expect(isPalindrome('A man, a plan, a canal: Panama')).toBe(true)
  })
  
  it('should return false for non-palindromes', () => {
    expect(isPalindrome('hello')).toBe(false)
  })
  
  it('should handle empty strings', () => {
    expect(isPalindrome('')).toBe(true)
  })
  
  it('should handle special characters', () => {
    expect(isPalindrome('!@#$%')).toBe(true)
  })
})
```

---

## 🔑 Requisitos

### ✅ Já Tem Instalado:
- GitLab Workflow VS Code extension ✅
- Token de Acesso Pessoal ✅
- Acesso ao GitLab Duo (Free tier com limitações)

### ⏳ Pode Ser Necessário:
- **GitLab Duo Subscription** para uso ilimitado
- Plano Free: Algumas requisições
- Premium: Ilimitado

---

## 🚀 Workflow Recomendado

### Para Cada Feature:

1. **Crie uma branch:**
   ```bash
   git checkout -b feature/sua-feature
   ```

2. **Desenvolva o código**

3. **Revise com GitLab Duo:**
   - No VS Code: Selecione → `/refactor`
   - Ou: `/tests` para gerar testes
   - Ou: `/explain` para documentar

4. **Aplique as sugestões**

5. **Faça o commit:**
   ```bash
   git add .
   git commit -m "feat: sua feature com revisão Duo"
   ```

6. **Crie Merge Request:**
   ```bash
   git push origin feature/sua-feature
   ```

7. **No GitLab:**
   - Abra o MR
   - Clique "Request Duo Review"
   - Duo revisa automaticamente

8. **Merge após aprovação**

---

## 💡 Dicas Úteis

### 1. Combinar Comandos
```
/refactor com foco em performance, adicione TypeScript types e gere testes
```

### 2. Contexto Específico
```
/refactor para melhor testabilidade seguindo padrão de serviço
```

### 3. Pedir Explicação
```
/explain este código é thread-safe?
```

### 4. Sugerir Pattern
```
/refactor use o padrão Factory para instanciar objetos
```

---

## 🎯 Próximos Passos

1. [ ] Abra o VS Code
2. [ ] Selecione um arquivo (ex: `src/services/error-tracking.ts`)
3. [ ] Abra GitLab Workflow Chat
4. [ ] Digite: `/explain` para que Duo explique o arquivo
5. [ ] Digite: `/refactor` para sugestões de melhoria
6. [ ] Aplique as mudanças
7. [ ] Crie um MR e peça "Duo Review"

---

## 📚 Recursos

- [GitLab Duo Docs](https://docs.gitlab.com/ee/user/ai_features/duo.html)
- [GitLab Workflow VS Code](https://marketplace.visualstudio.com/items?itemName=gitlab.gitlab-workflow)
- [GitLab Duo Code Review](https://docs.gitlab.com/ee/user/ai_features/code_review.html)
- [Repository X-Ray](https://docs.gitlab.com/ee/user/ai_features/repo_xray.html)

---

## ✅ Checklist

- [x] GitLab Workflow instalado no VS Code
- [x] Token configurado
- [x] Sentry Error Tracking ativo
- [ ] Testar `/explain` em um arquivo
- [ ] Testar `/refactor` com sugestões
- [ ] Testar `/tests` para gerar testes
- [ ] Criar MR com "Duo Review"
- [ ] Configurar webhook de revisão automática (opcional)

---

**Pronto? Abra o VS Code e teste agora! 🚀**
