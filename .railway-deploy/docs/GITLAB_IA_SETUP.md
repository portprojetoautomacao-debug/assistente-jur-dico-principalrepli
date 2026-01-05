# 🤖 IA no GitLab - Guia Completo

## 📍 O que está disponível para você

### ✅ Já Configurado
- GitLab Workflow no VS Code
- GitHub CLI (gh) com suporte a IA
- Acesso ao repositório GitLab

### 🚀 Como Usar IA no GitLab

---

## 1️⃣ GitLab Duo (Gratuito no Free Plan)

**GitLab Duo** é a IA nativa do GitLab, disponível gratuitamente em alguns planos.

### Ativar GitLab Duo

1. Acesse seu repositório no GitLab:
   - https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p

2. Vá em **Settings → General → Duo Features**

3. Ative as opções de IA:
   - ✅ Code Suggestions
   - ✅ Explain Code
   - ✅ Summarize MR Changes

### Usar Code Suggestions

**No GitLab Web Editor:**
1. Abra um arquivo no repositório
2. Clique no botão "Edit"
3. Enquanto digita, sugestões aparecem automaticamente
4. Pressione `Tab` para aceitar

**Exemplo:**
```javascript
// Digite:
function fetchUser(

// GitLab Duo sugere:
function fetchUser(userId) {
  return fetch(`/api/users/${userId}`)
    .then(res => res.json())
}
```

### Explicar Código

1. Selecione um bloco de código no GitLab
2. Clique no menu de contexto (⋯)
3. Selecione "Explain code"
4. GitLab explica o que o código faz

### Resumo de MR (Merge Request)

1. Crie ou abra um MR
2. Na seção de descrição, clique "Generate description"
3. GitLab cria resumo automático

---

## 2️⃣ GitHub Copilot via VS Code (Se Premium)

Se você tiver acesso ao GitHub Copilot:

### Instalar Extensão

```bash
# No VS Code, abra Extensions e procure:
"GitHub Copilot"

# Ou instale via CLI:
code --install-extension GitHub.copilot
```

### Usar Copilot

**Autocompletar Código:**
- Comece a digitar uma função
- Copilot sugere o resto
- Pressione `Tab` para aceitar

**Exemplo:**
```typescript
// Digite:
async function deployToKubernetes(

// Copilot completa:
async function deployToKubernetes(
  namespace: string,
  deployment: string,
  image: string
): Promise<void> {
  const kubectl = new KubernetesClient()
  await kubectl.setImage(namespace, deployment, image)
}
```

**Comandos Copilot:**
- `Ctrl+I` (Windows/Linux) ou `Cmd+I` (Mac) - Abrir Copilot Chat
- Descreva o que quer fazer em linguagem natural
- Copilot gera código

---

## 3️⃣ GitLab Workflow no VS Code (Já Configurado!)

Você já tem a extensão instalada. Recursos disponíveis:

### Conectar ao GitLab

1. Abra VS Code
2. Vá em **Extensions → GitLab Workflow**
3. Clique em "Sign in"
4. Use seu token GitLab (já configurado ✅)

### Recursos Disponíveis

**Ver Pipeline Status:**
- `Ctrl+Shift+P` → "GitLab: Show Pipeline"
- Mostra status do pipeline atual

**Ver Merge Requests:**
- `Ctrl+Shift+P` → "GitLab: Show Merge Requests"
- Lista todos os MRs do projeto

**Criar MR:**
- `Ctrl+Shift+P` → "GitLab: Create Merge Request"
- Cria MR da branch atual

**Ver Issues:**
- `Ctrl+Shift+P` → "GitLab: Show Issues"
- Lista todas as issues

**Atribuir a Si Mesmo:**
- Clique em uma issue
- Selecione "Assign to me"

---

## 4️⃣ Usar IA via Command Line

### GitHub CLI com IA (Disponível)

```bash
# Ver help
gh --help

# Usar com repositórios GitHub (seu projeto também tem GitHub)
gh issue create --title "Feature XYZ" --body "Description"
gh pr create --title "Fix: XYZ" --body "Description"
```

### GitLab CLI (glab)

Instale se quiser usar GitLab via CLI:

```bash
# Instalar (se permission permitir)
curl -s https://gitlab.com/cli/cli/-/releases/latest/downloads/glab_Linux_x86_64.tar.gz | tar xz

# Ou via package manager
brew install glab  # Mac
sudo apt install glab  # Linux

# Configurar
glab auth login

# Usar
glab mr create --title "Fix: Issue XYZ"
glab pipeline list
glab issue create --title "Bug report"
```

---

## 5️⃣ Alternativas de IA Externas

### 🔗 Integração com Claude (Este Chat)
- Você já está usando! 🎉
- Pode pedir ajuda com código aqui
- Gero código direto nos arquivos

### 🔗 Integração com OpenAI/ChatGPT

**Via VS Code Extension:**

1. Instale "ChatGPT - Genie AI":
   ```bash
   code --install-extension genieai.chatgpt-vscode
   ```

2. Configure sua API key do OpenAI

3. Use com:
   - `Ctrl+Shift+I` - Code completions
   - `Ctrl+Shift+J` - Chat com IA

### 🔗 Integração com Codeium (Grátis)

1. Instale "Codeium":
   ```bash
   code --install-extension Exafunction.codeium
   ```

2. Sign up em https://codeium.com

3. Use autocompletar gratuito

---

## 📋 Meu Recomendado para Você

### ✅ Usar AGORA (Sem custo extra):

1. **GitLab Duo** - Nativo, sempre disponível
2. **GitHub Copilot** - Se tiver subscription
3. **Este Chat (Claude)** - Para questões complexas
4. **Codeium** - Free tier generoso

### 💰 Se quiser pagar:

- **GitHub Copilot** - $10/mês ou $100/ano
- **OpenAI API** - Pay as you go (~$0.002/requisição)
- **GitLab Premium** - Mais features de IA

---

## 🎯 Quick Start para Hoje

### 1. Ativar GitLab Duo

```bash
# Já está pronto! Acesse:
# https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p
# Settings → General → Duo Features → Enable
```

### 2. Usar IA no Próximo Commit

```bash
# Quando fizer um arquivo novo:
1. No VS Code, escreva:
   function deployApp(

2. Se tiver Copilot:
   - Pressione Tab para aceitar sugestão
   
3. Se não tiver:
   - Use `Ctrl+Shift+I` se tiver Codeium
   - Ou me peça ajuda aqui!
```

### 3. Usar IA em MR

```bash
1. Crie um Merge Request
2. GitLab Duo gera descrição automática
3. Revise e commit
```

---

## 🔧 Troubleshooting

### ❌ IA não aparece no VS Code

**Solução:**
1. Verifique se extensão está instalada
2. Recarregue VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"
3. Verifique token GitLab em Settings

### ❌ Sugestões de IA não aparecem

**Solução:**
1. GitLab Duo requer plan específico
2. Tente Codeium (gratuito): https://codeium.com
3. Ou use Copilot se tiver subscription

### ❌ Error ao conectar GitLab Workflow

**Solução:**
```bash
# Verifique token
cat ~/.config/glab-cli/config.yml  # Se usar glab

# Ou reconfigure VS Code
# Settings → GitLab Workflow → Sign out → Sign in novamente
```

---

## 📚 Recursos

### GitLab Duo
- https://docs.gitlab.com/ee/user/project/repository/code_suggestions.html
- https://docs.gitlab.com/ee/user/ai_features.html

### GitHub Copilot
- https://github.com/features/copilot
- https://docs.github.com/en/copilot

### Codeium
- https://codeium.com

### GitLab Workflow VS Code
- https://marketplace.visualstudio.com/items?itemName=gitlab.gitlab-workflow

---

## ✨ Próximas Ações

1. [ ] Ativar GitLab Duo no seu repositório
2. [ ] Testar code suggestions no próximo commit
3. [ ] Usar IA para gerar descrição de MR
4. [ ] Se quiser mais features: Subscribe GitHub Copilot
5. [ ] Ou instalar Codeium para autocompletar grátis

**Tudo pronto? Comece a usar IA! 🚀**
