# 🔧 Troubleshooting: GitLab Workflow no VS Code

## ❌ Erro: "Cancelling the GitLab OAuth login after 60s"

### Problema
A extensão tentou usar OAuth em vez de Personal Access Token (PAT).

**Erro completo:**
```
Cancelling the GitLab OAuth login after 60s. Try again.
Request failed: Can't add GitLab account for https://gitlab.com
Bearer [HTML content] is not a legal HTTP header value
```

### ✅ Solução

**NUNCA use "Add Account with OAuth"** - isso não funciona em ambientes dev container.

Use sempre **"GitLab: Add Account (GitLab.com)"** com PAT.

---

## 📋 Passo a Passo Correto

### 1. Abrir Command Palette
- `Ctrl+Shift+P` (Windows/Linux)
- `Cmd+Shift+P` (Mac)

### 2. Selecionar o comando correto
Digite e selecione **EXATAMENTE**:
```
GitLab: Add Account (GitLab.com)
```

⚠️ **NÃO selecione**:
- ❌ `GitLab: Add Account with OAuth`
- ❌ `GitLab: Add Account (Self-Managed)`

### 3. Inserir URL
Quando solicitado, digite:
```
https://gitlab.com
```
Pressione `ENTER`

### 4. Inserir Token
Cole o token PAT:
```
glpat-TyuAdkI93U_tsO0s6QexmG86MQp1Oml4ZThxCw.01.12094aj61
```
Pressione `ENTER`

### 5. Verificar sucesso
Você deve ver:
- ✅ Mensagem de sucesso no canto inferior direito
- ✅ Ícone GitLab (🦊) aparece na sidebar
- ✅ Status do pipeline na barra inferior

---

## 🔍 Como Verificar se Está Funcionando

### Verificar conta adicionada
1. `Ctrl+Shift+P`
2. Digite: `GitLab: Show Extension Logs`
3. Procure por: `"Successfully authenticated"`

### Verificar remote configurado
Execute no terminal:
```bash
git remote -v
```

Deve mostrar:
```
gitlab  https://oauth2:TOKEN@gitlab.com/thiagobodevan-a11y-group/assistente-juridico-p.git
```

### Testar API
Execute:
```bash
./add-gitlab-account.sh
```

---

## 🚨 Erros Comuns

### Erro 1: "There is no GitLab account available"
**Causa**: Conta não foi adicionada corretamente  
**Solução**: Siga o passo a passo acima novamente

### Erro 2: "GitExtensionWrapper is missing repository"
**Causa**: Extensão não encontrou o remote do GitLab  
**Solução**: 
```bash
git remote add gitlab https://oauth2:TOKEN@gitlab.com/thiagobodevan-a11y-group/assistente-juridico-p.git
```

### Erro 3: "Bearer [HTML] is not a legal HTTP header value"
**Causa**: Token inválido ou OAuth sendo usado  
**Solução**: Use PAT em vez de OAuth

### Erro 4: Token expirado
**Causa**: Token PAT expirou  
**Solução**: 
1. Vá para: https://gitlab.com/-/user_settings/personal_access_tokens
2. Crie novo token com escopos: `api`, `read_repository`, `write_repository`
3. Atualize em `.gitlab-token`
4. Execute: `./setup-gitlab-vscode.sh`

---

## 🔐 Verificar Permissões do Token

### Escopos necessários:
- ✅ `api` - Acesso completo à API
- ✅ `read_repository` - Ler repositório
- ✅ `write_repository` - Escrever no repositório
- ✅ `read_api` - Ler dados da API

### Verificar via API:
```bash
curl -s --header "PRIVATE-TOKEN: SEU_TOKEN" \
  "https://gitlab.com/api/v4/personal_access_tokens/self" | jq
```

---

## 🔄 Resetar Configuração Completamente

Se nada funcionar, resete tudo:

```bash
# 1. Remover conta no VS Code
# Ctrl+Shift+P > GitLab: Remove Account

# 2. Limpar configurações locais
rm -f ~/.gitconfig

# 3. Reconfigurar
./setup-gitlab-vscode.sh

# 4. Adicionar conta novamente
./add-gitlab-account.sh
```

---

## 📊 Logs para Debugging

### Ver logs da extensão:
1. `Ctrl+Shift+P`
2. `GitLab: Show Extension Logs`

### Ativar debug mode:
Em `.vscode/settings.json`:
```json
{
  "gitlab.debug": true
}
```

### Ver logs no terminal:
```bash
tail -f ~/.vscode-server/data/logs/*/exthost*/output_logging_*/*/GitLab\ Workflow.log
```

---

## 🎯 Configurações Recomendadas

### Arquivo `.vscode/settings.json`
```json
{
  "gitlab.instanceUrl": "https://gitlab.com",
  "gitlab.pipelineGitRemoteName": "gitlab",
  "gitlab.remoteName": "gitlab",
  "gitlab.showPipelineUpdateNotifications": true,
  "gitlab.showStatusBarLinks": true,
  "gitlab.showMrStatusOnStatusBar": true,
  "gitlab.debug": false
}
```

---

## 💡 Dicas Avançadas

### 1. Múltiplas contas GitLab
Você pode adicionar várias instâncias do GitLab:
- GitLab.com (https://gitlab.com)
- Self-managed (https://sua-instancia.com)

### 2. Usar variáveis de ambiente
Em vez de hardcoded, use:
```bash
export GITLAB_TOKEN="seu-token"
```

### 3. Integração com GitHub
Você pode usar GitLab e GitHub simultaneamente:
```bash
git remote add github https://github.com/user/repo.git
git remote add gitlab https://gitlab.com/user/repo.git
```

---

## 🆘 Suporte

### Documentação oficial:
- https://docs.gitlab.com/ee/editor_extensions/visual_studio_code/

### Issues da extensão:
- https://gitlab.com/gitlab-org/gitlab-vscode-extension/-/issues

### Projeto:
- https://gitlab.com/thiagobodevan-a11y-group/assistente-juridico-p

---

## ✅ Checklist Final

Antes de abrir um issue, verifique:

- [ ] Token PAT está correto e não expirou
- [ ] URL é `https://gitlab.com` (não `https://gitlab.com/`)
- [ ] Comando usado foi "Add Account (GitLab.com)" não OAuth
- [ ] Remote `gitlab` está configurado
- [ ] Extensão GitLab Workflow está instalada e habilitada
- [ ] VS Code foi recarregado (`Ctrl+Shift+P` > `Reload Window`)
- [ ] Logs não mostram erros críticos
- [ ] Firewall/proxy não está bloqueando gitlab.com

---

**Última atualização**: 23/11/2025  
**Versão da extensão**: gitlab.gitlab-workflow
