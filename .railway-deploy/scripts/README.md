# 🛠️ Scripts de Automação - Workflows Seguros

Esta pasta contém scripts para automatizar a configuração e gerenciamento de workflows seguros e branch protection.

## 📁 Conteúdo

### 🔐 Branch Protection

**`configure-branch-protection.sh`** - Script principal para configurar proteção de branch
- Aplica regras via GitHub API
- Configura CI obrigatório
- Define requisitos de aprovação
- Cria regras especiais para Dependabot

**Uso**:
```bash
./scripts/configure-branch-protection.sh
```

**Requer**: GitHub CLI (`gh`) instalado e autenticado

---

### 🚀 Comandos Úteis

**`workflows-commands.sh`** - Conjunto de comandos para gerenciar workflows
- Aliases para operações comuns
- Funções para validação e troubleshooting
- Status de repositório em tempo real

**Uso**:
```bash
# Carregar comandos na sessão atual
source scripts/workflows-commands.sh

# Ver lista de comandos
workflows-help

# Exemplos
repo-status              # Ver status completo
ci-passed                # Verificar se CI passou
validate-setup           # Validar configuração
```

---

## 🎯 Workflows Principais

### 📋 Comandos Rápidos

```bash
# Branch Protection
branch-protect           # Aplicar proteção
branch-status            # Ver status

# CI/CD
ci-logs                  # Ver logs do CI
deploy-latest            # Ver último deploy

# Dependabot
dependabot-prs           # Listar PRs
dependabot-status        # Ver status

# Secrets
secrets-list             # Listar secrets
secrets-set <NAME>       # Definir secret

# Cache
cache-list               # Listar caches
cache-clear-all          # Limpar todos

# Testes
test-unit                # Testes unitários
test-e2e                 # Testes E2E
test-all                 # Todos os testes
```

---

## 📚 Documentação Relacionada

- **Guia Completo**: `../docs/WORKFLOWS_SEGUROS_E_BRANCH_PROTECTION.md`
- **Resumo Executivo**: `../docs/WORKFLOWS_RESUMO_EXECUTIVO.md`
- **Workflows**: `../.github/workflows/`

---

## 🔧 Pré-requisitos

### GitHub CLI
```bash
# Instalar
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Autenticar
gh auth login
```

### jq (JSON processor)
```bash
sudo apt install jq
```

---

## 🚀 Quick Start

1. **Instalar dependências**:
```bash
# GitHub CLI
gh --version || curl -sL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg

# jq
jq --version || sudo apt install -y jq
```

2. **Autenticar GitHub CLI**:
```bash
gh auth login
```

3. **Aplicar branch protection**:
```bash
./scripts/configure-branch-protection.sh
```

4. **Carregar comandos úteis**:
```bash
source scripts/workflows-commands.sh
```

5. **Validar configuração**:
```bash
validate-setup
```

---

## 📊 Estrutura de Arquivos

```
scripts/
├── README.md                           # Este arquivo
├── configure-branch-protection.sh      # Configuração de branch protection
└── workflows-commands.sh               # Comandos úteis para workflows

Relacionados:
├── .github/workflows/
│   ├── ci.yml                         # CI principal
│   ├── deploy.yml                     # Deploy Vercel
│   ├── dependabot-auto-merge.yml      # Auto-merge Dependabot
│   ├── e2e.yml                        # Testes E2E
│   └── pr.yml                         # Validação de PR
├── .github/dependabot.yml             # Configuração Dependabot
└── docs/
    ├── WORKFLOWS_SEGUROS_E_BRANCH_PROTECTION.md
    └── WORKFLOWS_RESUMO_EXECUTIVO.md
```

---

## 🔍 Troubleshooting

### "gh: command not found"
**Solução**: Instalar GitHub CLI
```bash
curl -sL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo apt update && sudo apt install gh
```

### "Not authorized"
**Solução**: Autenticar GitHub CLI
```bash
gh auth login
# Escolha: GitHub.com → HTTPS → Login via browser
```

### "jq: command not found"
**Solução**: Instalar jq
```bash
sudo apt install jq
```

### "Permission denied"
**Solução**: Tornar script executável
```bash
chmod +x scripts/*.sh
```

### "Branch protection failed"
**Possíveis causas**:
1. Sem permissões de admin no repositório
2. GitHub CLI não autenticado
3. Token sem permissões adequadas

**Solução**: Configure manualmente via UI:
https://github.com/thiagobodevanadv-alt/assistente-jur-dico-principal/settings/branches

---

## 🎯 Casos de Uso

### Verificar Status Completo
```bash
source scripts/workflows-commands.sh
repo-status
```

### Configurar Branch Protection
```bash
./scripts/configure-branch-protection.sh
```

### Validar Setup Completo
```bash
source scripts/workflows-commands.sh
validate-setup
```

### Criar PR de Teste
```bash
source scripts/workflows-commands.sh
create-test-pr
```

### Limpar Caches Antigos
```bash
source scripts/workflows-commands.sh
cache-clear-all
```

### Ver Logs de CI/Deploy
```bash
source scripts/workflows-commands.sh
ci-latest
deploy-latest
```

---

## 🔐 Segurança

- **Nunca commite tokens** no repositório
- Use **secrets do GitHub** para valores sensíveis
- Scripts validam antes de executar
- Logs não expõem informações sensíveis

---

## 📞 Suporte

- **Issues**: https://github.com/thiagobodevanadv-alt/assistente-jur-dico-principal/issues
- **Documentação**: `../docs/WORKFLOWS_SEGUROS_E_BRANCH_PROTECTION.md`
- **GitHub CLI Docs**: https://cli.github.com/manual/

---

**Última Atualização**: 9 de dezembro de 2024  
**Versão**: 1.0.0
