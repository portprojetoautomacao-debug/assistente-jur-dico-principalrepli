# ⚡ Copilot Automação - Referência Rápida

## 🚀 Comandos Úteis

### Ver atividade do bot
```bash
# Commits automáticos de hoje
git log --since="1 day ago" --author="github-actions" --oneline

# Todos commits do bot
git log --author="github-actions" --oneline

# Issues abertas pelo Copilot
gh issue list --label "copilot"

# PRs criadas pelo bot
gh pr list --author "github-actions[bot]"

# Últimas execuções do workflow
gh run list --workflow=copilot-auto-fix.yml --limit 10

# Ver detalhes de uma execução
gh run view <run-id>
```

### Executar workflow manualmente
```bash
# Trigger do auto-fix agora
gh workflow run copilot-auto-fix.yml

# Ver status da execução
gh run watch
```

### Monitorar arquivos protegidos
```bash
# Ver se algum arquivo protegido foi modificado
git diff --name-only | grep -E '(.env|package.json|vercel.json|.github/workflows/)'
```

## 📊 Horários de Automação

| Ação | Horário | Frequência |
|------|---------|------------|
| **Auto-fix automático** | 9:00 BRT | Diário |
| **Verificação de dependências** | 9:00 BRT | Semanal (segunda) |
| **Quality check** | A cada push | Contínuo |
| **Type check background** | Sempre | A cada 30s |
| **Testes watch mode** | Sempre | A cada alteração |

## 🎯 Checklist Diário (10 minutos)

- [ ] Ver commits do bot: `git log --author="github-actions" --since="1 day ago"`
- [ ] Verificar issues: `gh issue list --label "copilot"`
- [ ] Aprovar PRs se houver: `gh pr list --author "github-actions[bot]"`
- [ ] Verificar workflow passou: `gh run list --workflow=copilot-auto-fix.yml --limit 1`
- [ ] ☕ Café!

## 🔧 Troubleshooting

### Bot não está fazendo commits automáticos?

1. Verificar se workflow está habilitado:
   ```bash
   gh workflow view copilot-auto-fix.yml
   ```

2. Verificar permissões do GITHUB_TOKEN:
   - Settings → Actions → General
   - Workflow permissions: "Read and write permissions"

3. Ver logs da última execução:
   ```bash
   gh run view --log
   ```

### Auto-save não está funcionando no VSCode?

1. Recarregar VSCode: `Ctrl+Shift+P` → "Reload Window"
2. Verificar settings.json:
   ```bash
   cat .vscode/settings.json | grep autoSave
   ```
3. Deve mostrar: `"files.autoSave": "afterDelay"`

### ESLint não está auto-fixing ao salvar?

1. Verificar extensão instalada:
   ```bash
   code --list-extensions | grep eslint
   ```
2. Deve mostrar: `dbaeumer.vscode-eslint`
3. Recarregar VSCode

## 📚 Documentação Completa

- **Setup inicial**: `.github/COPILOT_AGENT_SETUP.md`
- **Automação total**: `.github/COPILOT_AUTONOMOUS.md`
- **Instruções do projeto**: `.github/copilot-instructions.md`
- **Configuração workspace**: `.github/copilot-workspace.yml`

## 🆘 Precisa de Ajuda?

Use o Copilot Chat:

```
@workspace como funciona a automação do Copilot neste projeto?
```

```
@workspace /explain explique o workflow copilot-auto-fix.yml
```

```
@workspace mostre os últimos commits automáticos
```

## 🎉 Quick Wins

### Quer ver a automação em ação AGORA?

1. **Teste local (30 segundos):**
   ```bash
   # Abra src/App.tsx e adicione import não usado
   echo "import { useState } from 'react';" >> src/App.tsx
   # Salve (Ctrl+S) - import será removido automaticamente!
   ```

2. **Teste workflow (2 minutos):**
   ```bash
   gh workflow run copilot-auto-fix.yml
   gh run watch
   ```

3. **Ver resultado:**
   ```bash
   git log --oneline -1
   # Deve mostrar commit do bot se houver correções
   ```

---

**Última atualização:** 3 de dezembro de 2025  
**Versão:** 1.0.0 - Automação Nível 2 (Semi-Automático)
