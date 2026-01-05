# 🐰 CodeRabbit - Guia de Configuração Completa

**Status**: ✅ Pré-requisitos configurados | ⏳ Autenticação pendente

---

## 📋 Pré-requisitos (✅ Completo)

- ✅ **CodeRabbit Extension**: v0.16.4 instalada
- ✅ **Git User**: Configurado (Thiago Bodevan Veiga)
- ✅ **GitHub CLI**: Instalado (v2.83.2)
- ✅ **Repository**: `portprojetoautomacao-debug/assistente-jur-dico-principalrepli`

---

## 🔐 Etapa 1: Autenticação GitHub (OBRIGATÓRIA)

O CodeRabbit precisa acessar o repositório. Execute:

```bash
gh auth login
```

**Escolha as opções:**
1. GitHub.com
2. HTTPS
3. Login with a web browser
4. Cole o código de 8 dígitos no navegador

**Verificar autenticação:**
```bash
gh auth status
```

---

## ⚙️ Etapa 2: Configuração do CodeRabbit

### 2.1 Configurações Atuais (.vscode/settings.json)

```json
{
  "coderabbit.agentType": "Native",
  "coderabbit.autoReviewMode": "prompt"
}
```

### 2.2 Configurações Opcionais (Adicionar se necessário)

```json
{
  "coderabbit.enableAutoReview": true,
  "coderabbit.reviewOnSave": false,
  "coderabbit.showInlineComments": true
}
```

---

## 🚀 Etapa 3: Testar Funcionalidades

### 3.1 Comandos no Command Palette (Ctrl+Shift+P)

1. **`CodeRabbit: Initiate Review for Current File`**
   - Revisa o arquivo atual com sugestões de IA

2. **`CodeRabbit: Show Settings`**
   - Abre painel de configurações

3. **`CodeRabbit: Review All Changed Files`**
   - Revisa todos os arquivos modificados

4. **`CodeRabbit: Clear Cache`**
   - Limpa cache se houver problemas

### 3.2 Workflow Automático

1. Faça mudanças em um arquivo TypeScript
2. Salve o arquivo (Ctrl+S)
3. CodeRabbit pergunta: "Deseja revisar este arquivo?"
4. Clique em "Yes" para obter sugestões

---

## 🔍 Troubleshooting

### ❌ "CodeRabbit is not responding"

**Causas:**
- GitHub não autenticado
- Repositório não conectado
- Cache corrompido

**Solução:**
```bash
# 1. Re-autenticar GitHub
gh auth logout
gh auth login

# 2. Limpar cache do CodeRabbit
# No VS Code: Ctrl+Shift+P → "CodeRabbit: Clear Cache"

# 3. Recarregar VS Code
# Ctrl+Shift+P → "Developer: Reload Window"
```

### ❌ "No issues found" (mas há problemas óbvios)

**Solução:**
```bash
# Forçar re-análise
# Ctrl+Shift+P → "CodeRabbit: Review All Changed Files"
```

### ❌ "Repository not connected"

**Solução:**
```bash
# Verificar remote do Git
git remote -v

# Deve mostrar:
# origin  https://github.com/portprojetoautomacao-debug/assistente-jur-dico-principalrepli

# Se não aparecer, adicione:
git remote add origin https://github.com/portprojetoautomacao-debug/assistente-jur-dico-principalrepli
```

---

## 📊 Integração com GitHub Copilot

O CodeRabbit usa `agentType: "Native"`, integrando com GitHub Copilot para:

- **Code Generation**: Sugestões de código baseadas nas reviews
- **Auto-Fix**: Aplicação automática de correções
- **Context-Aware**: 40+ fontes de contexto do repositório

---

## 🎯 Checklist Final

- [ ] `gh auth login` executado com sucesso
- [ ] `gh auth status` mostra conta autenticada
- [ ] Abrir arquivo `.ts` ou `.tsx`
- [ ] Executar: `CodeRabbit: Initiate Review for Current File`
- [ ] Verificar sugestões aparecendo no painel

---

## 📝 Comandos Rápidos

```bash
# Ver status de autenticação GitHub
gh auth status

# Listar extensões instaladas
code --list-extensions | grep coderabbit

# Ver configurações Git
git config --global --list | grep user

# Testar conexão com GitHub
gh repo view portprojetoautomacao-debug/assistente-jur-dico-principalrepli
```

---

## 🔗 Documentação Oficial

- [CodeRabbit VSCode Extension](https://marketplace.visualstudio.com/items?itemName=coderabbit.coderabbit-vscode)
- [GitHub CLI Authentication](https://cli.github.com/manual/gh_auth_login)

---

**Próximo passo**: Execute `gh auth login` e teste um review!
