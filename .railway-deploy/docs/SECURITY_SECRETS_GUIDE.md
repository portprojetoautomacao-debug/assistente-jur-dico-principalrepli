# 🔐 Guia de Segurança - Proteção de Secrets

**Objetivo**: Garantir que nenhum secret ou credencial seja commitado no Git.

---

## ✅ Status Atual (Verificado em 2024-01-XX)

### **Arquivos .env**
- ✅ Nenhum arquivo `.env` sensível no Git
- ✅ `.gitignore` configurado corretamente
- ✅ Todos os `.env.*` estão ignorados

### **Secrets no Código**
- ✅ GitHub Secret Scanning ativo
- ✅ Workflow de segurança configurado (`.github/workflows/security-scan.yml`)
- ✅ Pre-commit hooks recomendados (ver seção abaixo)

---

## 🚨 Arquivos que NUNCA Devem Ser Commitados

### **Variáveis de Ambiente**
```
.env
.env.local
.env.*.local
.env.development
.env.production
.env.vercel
.env.staging
*.backup
.env.backup
.env.local.backup
.env.vercel.backup
```

### **Credenciais e Chaves**
```
credentials.json
secrets.json
*.pem
*.key
*.cert
*.pfx
serviceAccountKey.json
.gitlab-token
```

### **Tokens e API Keys**
- GitHub Personal Access Tokens (ghp_*, gho_*, ghs_*)
- Google API Keys (AIza...)
- AWS Keys (AKIA...)
- Upstash Redis tokens
- Qualquer string que comece com:
  - `sk-` (OpenAI/Stripe)
  - `re_` (Resend)
  - `xoxb-` (Slack)
  - `qdrant_` (Qdrant)

---

## 🛡️ Proteções Implementadas

### **1. .gitignore (Nível Repositório)**
✅ Configurado em `.gitignore`

### **2. GitHub Secret Scanning (Nível Plataforma)**
✅ Workflow: `.github/workflows/security-scan.yml`

**Verifica**:
- Arquivos `.env` commitados
- Private keys (strings contendo "PRIVATE KEY")
- GitHub tokens (gh[pso]_...)
- AWS keys (AKIA...)
- Generic API keys (padrões comuns)

**Execução**:
- Todo push para `main`
- Todo pull request
- Manualmente via workflow_dispatch

### **3. Pre-commit Hooks (Nível Local - Recomendado)**

**Instalação**:
```bash
npm install --save-dev husky lint-staged

# Ativar husky
npx husky install

# Adicionar hook de pre-commit
npx husky add .husky/pre-commit "npx lint-staged"
```

**Configuração em `package.json`**:
```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.env*": [
      "echo '⚠️  WARNING: .env file detected! Please remove before committing.'",
      "exit 1"
    ]
  }
}
```

---

## 🔧 Como Remover Secrets Já Commitados

### **Passo 1: Remover do Staging/Working Directory**
```bash
# Remover do Git mas manter local
git rm --cached .env.vercel .env.production .env.local .env.staging

# Commit a remoção
git commit -m "security: remove sensitive .env files from git tracking"
```

### **Passo 2: Remover do Histórico Completo do Git**

⚠️ **IMPORTANTE**: Isso reescreve o histórico do Git!

**Opção A: Usando git-filter-repo** (Recomendado)
```bash
# Instalar git-filter-repo
pip install git-filter-repo

# Remover arquivos do histórico
git filter-repo --invert-paths \
  --path .env.vercel \
  --path .env.production \
  --path .env.local \
  --path .env.staging \
  --force
```

**Opção B: Usando BFG Repo-Cleaner**
```bash
# Baixar BFG
# https://rtyley.github.io/bfg-repo-cleaner/

# Executar limpeza
java -jar bfg.jar --delete-files .env.* .
java -jar bfg.jar --delete-files credentials.json .

# Aplicar mudanças
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### **Passo 3: Force Push (Com Cuidado!)**
```bash
# Avisar equipe ANTES de fazer force push
git push origin --force --all
git push origin --force --tags
```

### **Passo 4: ROTACIONAR TODOS OS SECRETS EXPOSTOS**

🔴 **CRÍTICO**: Qualquer secret que foi commitado está comprometido!

**Checklist de Rotação**:
- [ ] `GEMINI_API_KEY` - Regenerar no Google AI Studio
- [ ] `DATAJUD_API_KEY` - Solicitar nova chave no CNJ
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Regenerar no Upstash Dashboard
- [ ] `GITHUB_TOKEN` / `BOT_GH_TOKEN` - Revogar e criar novo
- [ ] `GOOGLE_CLIENT_SECRET` - Regenerar no Google Cloud Console
- [ ] `VERCEL_AUTOMATION_BYPASS_SECRET` - Gerar novo UUID
- [ ] Qualquer outro secret que estava nos arquivos

**Como Rotacionar**:
1. Gerar novo secret no serviço original
2. Atualizar no Vercel Dashboard (Environment Variables)
3. Revogar/deletar secret antigo
4. Re-deploy da aplicação

---

## 🔍 Como Verificar se Há Secrets Commitados

### **Verificação Rápida (Local)**
```bash
# Buscar arquivos .env no Git
git ls-files | grep -E "^\\.env\\.(vercel|production|local|staging)$"

# Buscar possíveis API keys no código
git grep -E "AIza[0-9A-Za-z\\-_]{35}" -- . ':!node_modules' ':!dist'
git grep -E "AKIA[0-9A-Z]{16}" -- . ':!node_modules' ':!dist'
git grep -E "ghp_[a-zA-Z0-9]{36}" -- . ':!node_modules' ':!dist'
```

### **Verificação Completa (GitHub)**
- Acessar: **Settings** → **Security** → **Secret scanning**
- Verificar alertas ativos
- Resolver todos os alertas antes de fazer deploy

### **Ferramentas Automatizadas**

**gitleaks** (Recomendado)
```bash
# Instalar
brew install gitleaks  # macOS
# ou
docker pull zricethezav/gitleaks

# Escanear repositório
gitleaks detect --source . --verbose

# Escanear histórico completo
gitleaks detect --source . --log-opts="--all"
```

**truffleHog**
```bash
# Instalar
pip install truffleHog

# Escanear
trufflehog git https://github.com/thiagobodevanadv-alt/assistente-jur-dico-principal
```

---

## 📊 Monitoramento Contínuo

### **GitHub Actions Workflow**

O workflow `.github/workflows/security-scan.yml` executa verificações automáticas:

```yaml
name: 🔐 Security Scan

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: "0 0 * * 1"  # Toda segunda-feira à meia-noite

jobs:
  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Secret Scanning
        run: |
          # Verificar .env files
          if git ls-files | grep -E "^\\.env\\.(vercel|production|local|staging)$"; then
            echo "❌ CRITICAL: Found .env files!"
            exit 1
          fi
          
          # Verificar private keys
          if git grep -i "PRIVATE KEY"; then
            echo "❌ CRITICAL: Found private keys!"
            exit 1
          fi
          
          # Verificar GitHub tokens
          if git grep -E "gh[pso]_[a-zA-Z0-9]{36}"; then
            echo "❌ CRITICAL: Found GitHub tokens!"
            exit 1
          fi
```

---

## ✅ Checklist de Segurança (Antes de Cada Commit)

- [ ] Nenhum arquivo `.env.*` foi adicionado
- [ ] Nenhuma string de API key hardcoded no código
- [ ] Nenhum token ou senha em variáveis
- [ ] Testes passam sem secrets reais
- [ ] `.gitignore` está atualizado
- [ ] Pre-commit hooks instalados (opcional)
- [ ] Secret scanning do GitHub não tem alertas

---

## 🆘 Resposta a Incidentes

### **Se Você Commitou um Secret Acidentalmente**

1. **NÃO FAÇA PUSH** (se ainda não fez)
2. **Amend o commit**:
   ```bash
   git reset HEAD~1
   git checkout -- <arquivo_com_secret>
   git add .
   git commit -m "chore: seu commit original"
   ```

3. **Se já fez push**:
   - Seguir "Como Remover Secrets Já Commitados" acima
   - Rotacionar IMEDIATAMENTE todos os secrets expostos
   - Notificar a equipe

4. **Documentar o incidente**:
   - Data/hora do commit
   - Secrets expostos
   - Ações tomadas (remoção, rotação)
   - Lições aprendidas

---

## 📚 Recursos Adicionais

- [GitHub Secret Scanning Docs](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Git-filter-repo Documentation](https://github.com/newren/git-filter-repo/)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

---

**Última Atualização**: 2024-01-XX  
**Responsável**: DevSecOps Team  
**Versão**: 1.0
