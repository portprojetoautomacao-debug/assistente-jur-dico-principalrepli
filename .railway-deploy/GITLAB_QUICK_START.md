# ⚡ GitLab Workflow - Guia Rápido

## 🔐 Token Configurado
✅ **Token**: `glpat-TyuAdkI93U_tsO0s6QexmG86MQp1Oml4ZThxCw.01.12094aj61`  
✅ **Projeto**: assistente-juridico-p (ID: 76287668)  
✅ **URL**: https://gitlab.com

---

## 🚀 Como Começar (3 Passos)

### 1️⃣ Adicionar Conta no VS Code
```
Ctrl+Shift+P (ou Cmd+Shift+P no Mac)
Digite: GitLab: Add Account
Cole o token: glpat-TyuAdkI93U_tsO0s6QexmG86MQp1Oml4ZThxCw.01.12094aj61
Confirme: https://gitlab.com
```

### 2️⃣ Ver Pipeline na Barra Inferior
- A barra de status mostra automaticamente o status do pipeline
- Clique para ações rápidas (criar, cancelar, retentar)

### 3️⃣ Ver Jobs na Sidebar
- Clique no ícone GitLab (🦊) na sidebar esquerda
- Expanda "For current branch"
- Clique em um job para ver o log

---

## 📋 Comandos Mais Usados

Abra Command Palette: `Ctrl+Shift+P`

| Comando | O que faz |
|---------|-----------|
| `GitLab: Create New Pipeline` | Cria novo pipeline |
| `GitLab: Validate GitLab CI Config` | Valida `.gitlab-ci.yml` |
| `GitLab: View Latest Pipeline` | Abre pipeline no navegador |
| `GitLab: Retry Last Pipeline` | Retenta pipeline falho |
| `GitLab: Cancel Last Pipeline` | Cancela pipeline em execução |
| `GitLab: Download Artifacts` | Baixa artefatos do pipeline |

---

## 🎯 Atalhos Úteis

| Ação | Atalho |
|------|--------|
| Command Palette | `Ctrl+Shift+P` |
| Abrir Terminal | `` Ctrl+` `` |
| Validar CI/CD | Abrir `.gitlab-ci.yml` + `Ctrl+Shift+P` + "Validate" |
| Autocompletar variável | Digite `$CI_` no `.gitlab-ci.yml` |

---

## ✅ Status do Pipeline

Na barra inferior você verá:

- ✅ **Pipeline Passed** - Sucesso
- ❌ **Pipeline Failed** - Falhou
- ⏳ **Pipeline Running** - Executando
- ⏸️ **Pipeline Pending** - Aguardando
- 🚫 **Pipeline Canceled** - Cancelado

---

## 🔧 Arquivos Importantes

- **`.gitlab-token`** - Token do GitLab (NÃO commitar!)
- **`.gitlab-ci.yml`** - Configuração CI/CD
- **`setup-gitlab-vscode.sh`** - Script de configuração
- **`docs/GITLAB_VSCODE_GUIA.md`** - Guia completo

---

## 🆘 Problemas?

### Token não funciona?
```bash
./setup-gitlab-vscode.sh
```

### Pipeline não aparece?
1. Verifique se está na branch correta
2. `Ctrl+Shift+P` > `Developer: Reload Window`

### Validação não funciona?
- Arquivo deve terminar com `.yml` ou `.yaml`
- Arquivo deve começar com `.gitlab-ci`

---

## 📚 Documentação Completa

Ver: `docs/GITLAB_VSCODE_GUIA.md`

---

**Última atualização**: 23/11/2025
