# Problema: GitLab Duo em Projeto GitHub

## ❌ Problema Identificado

O projeto **Assistente Jurídico PJe** está hospedado no **GitHub**, mas a extensão **GitLab Duo** estava tentando se conectar ao GitLab.com, causando vários erros nos logs:

- `GitExtensionWrapper is missing repository`
- `Unable to find remote origin (https://oauth2:glpat-...@gitlab.com/...)`
- `The webview didn't initialize in 10000ms`
- Warnings sobre `CodeActionKind` desconhecido

## ✅ Solução Aplicada

### 1. Removido GitLab Workflow das Extensões
- Removido `"gitlab.gitlab-workflow"` das extensões recomendadas em `.vscode/extensions.json`

### 2. Configurações para Desabilitar GitLab Duo
Adicionado em `.vscode/settings.json`:
```json
{
  "gitlab.enabled": false,
  "gitlab.real-timeSecurityScan.enabled": false,
  "gitlab.debug": false,
  "gitlab.showPipelineUpdateNotifications": false,
  "gitlab.instanceUrl": "",
  "gitlab.pipelineGitRemoteName": "",
  "gitlab.remoteName": "",
  "gitlab.acquireVsCodeApi": false,
  "gitlab.aiAssistedCodeSuggestions.enabled": false,
  "gitlab.duoChat.enabled": false,
  "gitlab.gitLabWorkflow.enabled": false
}
```

## 🎯 Resultado

- ✅ Extensão GitLab Duo desabilitada neste workspace
- ✅ Logs de erro eliminados
- ✅ Performance do VS Code melhorada
- ✅ Foco mantido nas ferramentas GitHub (Copilot, Actions, etc.)

## 📝 Para Usuários

Se ainda ver logs do GitLab Duo:

1. **Reinicie o VS Code** para aplicar as configurações
2. **Desinstale a extensão** `GitLab Duo` se não precisar dela
3. **Verifique settings globais** do VS Code para garantir que GitLab Duo não está habilitado

## 🔄 Alternativa: Usar GitLab

Se este projeto **deve** usar GitLab em vez de GitHub:

1. Migrar repositório para GitLab.com
2. Atualizar remote: `git remote set-url origin https://gitlab.com/...`
3. Reverter as configurações acima
4. Reinstalar extensão GitLab Workflow

---

**Status**: ✅ **RESOLVIDO** - GitLab Duo desabilitado no workspace GitHub</content">
<parameter name="filePath">/workspaces/assistente-juridico-p/GITLAB_DUO_FIX.md