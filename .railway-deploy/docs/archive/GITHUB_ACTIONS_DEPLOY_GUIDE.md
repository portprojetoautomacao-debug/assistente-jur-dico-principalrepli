# Guia Completo: GitHub Actions e Deploy Automático

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Workflows Configurados](#workflows-configurados)
3. [Configuração de Secrets](#configuração-de-secrets)
4. [Deploy Automático](#deploy-automático)
5. [Preview de PRs](#preview-de-prs)
6. [Troubleshooting](#troubleshooting)
7. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

Este repositório possui automação completa de CI/CD com GitHub Actions e Vercel:

- ✅ **Build e testes automáticos** em cada push
- ✅ **Deploy automático para produção** quando mesclado na main
- ✅ **Deploy preview** para cada Pull Request
- ✅ **Análise de segurança** com CodeQL
- ✅ **Validação de qualidade** de código
- ✅ **Cache inteligente** para builds mais rápidos

---

## 🔄 Workflows Configurados

### 1. **CI Workflow** (`.github/workflows/ci.yml`)
**Quando executa:** Push em `main`, `develop`, `copilot/**` ou PRs

**O que faz:**
- ✅ Build em Node 18 e 20 (matriz)
- ✅ Lint com ESLint
- ✅ Testes com Vitest
- ✅ Upload de artefatos de build
- ✅ Cache de dependências (~50% mais rápido)

**Tempo:** ~3-5 minutos

### 2. **Deploy Workflow** (`.github/workflows/deploy.yml`)
**Quando executa:**
- Push na branch `main` → Deploy em **produção**
- Pull Request aberto/atualizado → Deploy **preview**
- Manualmente via workflow_dispatch → Escolha o ambiente

**O que faz:**
- ✅ Valida código (lint + build)
- ✅ Deploy no Vercel
- ✅ Comenta URL de preview em PRs
- ✅ Atualiza comentário em novos commits
- ✅ Gera resumo de deployment

**Tempo:** ~5-8 minutos

### 3. **PR Workflow** (`.github/workflows/pr.yml`)
**Quando executa:** PRs abertos/atualizados

**O que faz:**
- ✅ Valida ausência de conflitos
- ✅ Verifica sincronização package.json ↔ package-lock.json
- ✅ Valida bundle size
- ✅ Adiciona labels automáticos
- ✅ Comenta resumo de validação

**Tempo:** ~4-6 minutos

### 4. **Code Quality Workflow** (`.github/workflows/code-quality.yml`)
**Quando executa:** Push, PRs ou semanalmente (segunda às 00:00 UTC)

**O que faz:**
- 🔒 Análise CodeQL de segurança
- 🔍 Revisão de dependências
- 📝 Verificação de tipos TypeScript
- 📦 Análise de tamanho de bundle

**Tempo:** ~8-12 minutos (CodeQL é mais lento)

### 5. **Release Workflow** (`.github/workflows/release.yml`)
**Quando executa:** Criação de tag (ex: `v1.0.0`)

**O que faz:**
- 📦 Cria release no GitHub
- 📎 Anexa artefatos de build
- 📝 Gera changelog automático
- 🚀 Deploy de produção

### 6. **Nightly Workflow** (`.github/workflows/nightly.yml`)
**Quando executa:** Diariamente às 02:00 UTC

**O que faz:**
- 🌙 Build noturno da branch develop
- 🔒 Auditoria de segurança
- 📊 Relatório de bundle size
- 📈 Métricas de qualidade

---

## 🔐 Configuração de Secrets

### Secrets Obrigatórios

Acesse: **GitHub → Settings → Secrets and variables → Actions**

#### Para Build e Deploy Funcionarem:

```bash
# 1. Google OAuth (obrigatório para funcionalidades do app)
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
VITE_REDIRECT_URI=https://seu-app.vercel.app

# 2. Vercel Deploy (obrigatório para deploy automático)
VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_ORG_ID=team_xxxxxxxxxxxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxxxxxxx
```

### Como Obter os Secrets

#### Google OAuth
1. Acesse [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crie ou selecione um projeto
3. Vá em **Credenciais** → **Criar credenciais** → **ID do cliente OAuth 2.0**
4. Configure as origens autorizadas:
   - `http://localhost:5173` (desenvolvimento)
   - `https://seu-app.vercel.app` (produção)
5. Copie o **Client ID**
6. Para a API Key: **Credenciais** → **Criar credenciais** → **Chave de API**

#### Vercel Tokens
```bash
# Instalar Vercel CLI
npm install -g vercel

# Login no Vercel
vercel login

# Criar token de acesso
# Vá em: https://vercel.com/account/tokens
# Clique em "Create Token"
# Nome: "GitHub Actions Deploy"
# Scope: Full Account
# Copie o token gerado

# Obter IDs do projeto
cd seu-repositorio
vercel link

# Ver os IDs (salve orgId e projectId)
cat .vercel/project.json
```

### Secrets Opcionais

```bash
# GitHub Token (já disponível automaticamente como GITHUB_TOKEN)
# Só configure se precisar de permissões extras

# Gemini API (alternativa ao Spark LLM)
VITE_GEMINI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🚀 Deploy Automático

### Deploy em Produção (Automático)

**Como funciona:**
1. Você faz merge de um PR na branch `main`
2. GitHub Actions detecta o push
3. Workflow de deploy executa automaticamente
4. Build é feito com variáveis de produção
5. Deploy no Vercel em produção
6. URL de produção atualizada

**Sem configuração adicional necessária!**

### Deploy Manual

Se precisar fazer deploy manual:

1. Vá em **Actions** → **Deploy**
2. Clique em **Run workflow**
3. Escolha o ambiente:
   - `production` → Deploy em produção
   - `staging` → Deploy de teste
   - `preview` → Deploy temporário
4. Clique em **Run workflow**

---

## 🔍 Preview de PRs

### Como Funciona

**Automático para cada PR:**

1. Você abre ou atualiza um Pull Request
2. GitHub Actions cria um deploy preview no Vercel
3. Um comentário é adicionado ao PR com a URL do preview
4. A cada novo commit, o comentário é atualizado com nova URL
5. Você pode testar mudanças antes do merge!

### Exemplo de Comentário

```markdown
## 🚀 Deploy Preview Ready!

**Preview URL:** https://assistente-juridico-xxxxx.vercel.app

### Deployment Details
- **Environment:** Preview
- **Commit:** `abc1234`
- **Branch:** `feature/nova-funcionalidade`

### Quick Links
- 🔗 [View Preview](https://assistente-juridico-xxxxx.vercel.app)
- 📊 [View Logs](https://github.com/seu-repo/actions/runs/123456)

_This preview will be automatically updated with new commits._
```

### Testar Preview Localmente

Antes de fazer commit, teste localmente:

```bash
# Instalar dependências
npm ci

# Build de produção
npm run build

# Servir build localmente
npm run preview

# Ou usar o Vercel CLI
vercel dev
```

---

## 🐛 Troubleshooting

### Build Falha no CI

**Problema:** Build falha com erro de TypeScript
```bash
❌ TypeScript type checking failed
```

**Solução:**
```bash
# Rodar localmente para ver erros
npm run build

# Verificar tipos
npx tsc --noEmit

# Corrigir erros de tipo e commit
```

---

### Deploy Falha: Secrets Missing

**Problema:** Deploy falha com erro de variáveis de ambiente
```
Error: Missing required environment variable
```

**Solução:**
1. Verifique se todos os secrets estão configurados no GitHub
2. Acesse: Settings → Secrets and variables → Actions
3. Verifique se os nomes estão corretos (case-sensitive!)
4. Re-run o workflow após adicionar secrets

---

### Deploy Falha: Vercel Token Inválido

**Problema:**
```
Error: Invalid token
```

**Solução:**
```bash
# Gerar novo token no Vercel
# https://vercel.com/account/tokens

# Atualizar secret VERCEL_TOKEN no GitHub
# Settings → Secrets → Actions → Update VERCEL_TOKEN
```

---

### Preview URL Não Aparece em PRs

**Problema:** PR não recebe comentário com URL de preview

**Verificar:**
1. Workflow de deploy executou? (aba Actions)
2. Secret `VERCEL_TOKEN` está configurado?
3. PR não está em draft? (previews só para PRs prontos)
4. Permissões do GITHUB_TOKEN estão corretas?

**Solução:**
```yaml
# Verificar em .github/workflows/deploy.yml
permissions:
  pull-requests: write  # ← Necessário para comentar
```

---

### Bundle Size Warning

**Problema:**
```
⚠️ Some chunks are larger than 500 kB
```

**Não é um erro!** É apenas um aviso.

**Para otimizar (opcional):**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        }
      }
    }
  }
})
```

---

### Cache Não Funciona

**Problema:** Build sempre lento, cache não restaurado

**Solução:**
```bash
# Limpar cache no GitHub
# Actions → Caches → Delete all caches

# Fazer novo push para recriar cache
git commit --allow-empty -m "rebuild cache"
git push
```

---

## ✅ Boas Práticas

### 1. Sempre Testar Localmente Antes de Commit

```bash
# Checklist antes de push:
npm run lint      # ✅ Lint pass?
npm run build     # ✅ Build pass?
npm test          # ✅ Tests pass?

# Só então:
git add .
git commit -m "feat: nova funcionalidade"
git push
```

### 2. Usar PRs para Tudo

❌ **Não fazer:** Push direto na `main`
```bash
git checkout main
git commit -m "fix"
git push  # ❌ Evite isso!
```

✅ **Fazer:** Criar PR
```bash
git checkout -b fix/bug-importante
git commit -m "fix: corrige bug importante"
git push origin fix/bug-importante
# Então criar PR no GitHub
```

**Vantagens:**
- Preview automático para testar
- Revisão de código
- CI valida antes de merge
- Histórico mais limpo

### 3. Usar Conventional Commits

Padronize mensagens de commit:

```bash
feat: adiciona nova funcionalidade
fix: corrige bug na autenticação
docs: atualiza README
style: formata código
refactor: refatora componente X
test: adiciona testes para Y
chore: atualiza dependências
```

**Benefício:** Changelog automático nas releases!

### 4. Monitorar Workflow Status

Adicione badges ao README:

```markdown
![CI Status](https://github.com/seu-usuario/seu-repo/workflows/CI/badge.svg)
![Deploy Status](https://github.com/seu-usuario/seu-repo/workflows/Deploy/badge.svg)
```

### 5. Proteger Branch Main

Recomendações de proteção:

Settings → Branches → Add rule para `main`:
- ✅ Require pull request before merging
- ✅ Require status checks to pass
  - ✅ CI / Build and Test
  - ✅ Code Quality / CodeQL Analysis
- ✅ Require branches to be up to date
- ✅ Require conversation resolution before merging
- ❌ Include administrators (para desenvolvimento)

### 6. Revisar PRs Automatizados (Dependabot)

Dependabot abrirá PRs para atualizar dependências.

**Processo:**
1. Revisar changelog da dependência
2. Verificar se CI passa
3. Testar preview se necessário
4. Merge se tudo OK

### 7. Usar Environments do GitHub (Avançado)

Configure ambientes para aprovações:

Settings → Environments → New environment

**Production:**
- Required reviewers: você
- Deployment branches: apenas `main`

**Preview:**
- Sem restrições

---

## 📊 Monitoramento

### Dashboards Úteis

1. **Actions Tab:** Ver histórico de workflows
   - `https://github.com/seu-usuario/seu-repo/actions`

2. **Vercel Dashboard:** Ver deploys
   - `https://vercel.com/seu-time/seu-projeto`

3. **Security Tab:** Ver alertas CodeQL
   - `https://github.com/seu-usuario/seu-repo/security`

### Métricas Importantes

Monitore:
- ✅ Taxa de sucesso de builds (meta: >95%)
- ✅ Tempo médio de build (meta: <5min)
- ✅ Tempo de deploy (meta: <8min)
- ✅ Alertas de segurança (meta: 0)
- ✅ Coverage de testes (meta: >70%)

---

## 🔄 Atualizações

### Atualizar Workflows

Workflows são atualizados automaticamente pelo Dependabot para:
- Ações do GitHub (ex: `actions/checkout@v4` → `v5`)
- Dependências npm

### Atualizar Este Guia

Ao fazer mudanças nos workflows, atualize este guia:

```bash
# Editar GITHUB_ACTIONS_DEPLOY_GUIDE.md
git add GITHUB_ACTIONS_DEPLOY_GUIDE.md
git commit -m "docs: atualiza guia de GitHub Actions"
```

---

## 📚 Recursos Adicionais

### Documentação Oficial
- [GitHub Actions](https://docs.github.com/en/actions)
- [Vercel Deployments](https://vercel.com/docs/deployments/overview)
- [CodeQL](https://codeql.github.com/docs/)

### Documentação do Projeto
- `GITHUB_ACTIONS_CONFIGURADO.md` - Setup inicial
- `GITHUB_ACTIONS_CORRECOES.md` - Correções aplicadas
- `DEPLOYMENT_FIX_COMPLETE.md` - Fix de deployment Vercel
- `README.md` - Visão geral do projeto

---

## 🆘 Suporte

Se tiver problemas:

1. 📖 Consulte a seção [Troubleshooting](#troubleshooting)
2. 🔍 Verifique logs detalhados na aba Actions
3. 🐛 Abra uma issue descrevendo o problema
4. 💬 Consulte a documentação oficial do GitHub Actions

---

**Última atualização:** 2025-11-18  
**Versão:** 2.0  
**Autor:** GitHub Copilot  
**Status:** ✅ Configuração completa e testada
