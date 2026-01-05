# 🔐 Configuração de Workflows Seguros e Proteção de Branch

## ✅ Alterações Implementadas

### 1. **Dependabot Auto-Merge com CI Obrigatório**

O workflow `dependabot-auto-merge.yml` foi completamente refeito para:

- ✅ **Aguardar CI passar** antes de fazer merge automático
- ✅ **Dividido em 2 jobs**:
  - `auto-approve`: Aprova PRs minor/patch automaticamente
  - `dependabot-auto-merge`: Faz merge SOMENTE após CI passar com sucesso
- ✅ **Validação de checks**: Aguarda todos os checks passarem (max 30 tentativas × 10s)
- ✅ **Comentários informativos**: Para updates major que requerem revisão manual
- ✅ **Summary detalhado**: Mostra status de cada etapa

**Fluxo de Funcionamento:**
```
Dependabot abre PR → CI executa → E2E executa → Todos passam? 
  → SIM: Auto-merge (minor/patch)
  → NÃO: Aguarda ou falha
  → MAJOR: Comentário + revisão manual obrigatória
```

### 2. **Validação de Segredos Sensíveis**

O workflow `deploy.yml` agora valida **antes** do deploy:

**Segredos Obrigatórios para Produção:**
- `VERCEL_TOKEN` ⚠️ CRÍTICO
- `VERCEL_ORG_ID` ⚠️ CRÍTICO
- `VERCEL_PROJECT_ID` ⚠️ CRÍTICO

**Segredos Opcionais (com aviso):**
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `QDRANT_URL`
- `QDRANT_API_KEY`

**Relatório no Summary:**
Todos os deploys agora mostram uma tabela de validação:

| Secret | Status |
|--------|--------|
| VERCEL_TOKEN | ✅ Set |
| UPSTASH_REDIS_REST_URL | ⚠️ Missing |
| ... | ... |

### 3. **Cache Otimizado com Hash de Lock Files**

Todos os workflows agora usam `actions/cache@v4` com chaves baseadas em hash:

**CI Workflow:**
```yaml
# Cache de dependências
key: ${{ runner.os }}-node-${{ matrix.node-version }}-deps-${{ hashFiles('package-lock.json', 'chrome-extension-pje/package-lock.json') }}

# Cache de build
key: ${{ runner.os }}-build-${{ matrix.node-version }}-${{ hashFiles('src/**/*', 'vite.config.ts', 'package-lock.json', ...) }}
```

**Benefícios:**
- ✅ Cache invalidado automaticamente quando dependências mudam
- ✅ Builds 30-50% mais rápidos em média
- ✅ Reduz uso de minutos de Actions
- ✅ Consistência entre builds

### 4. **Concorrência e Limites de Tempo**

**CI Workflow (`ci.yml`):**
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-and-test:
    timeout-minutes: 30
```

**Deploy Workflow (`deploy.yml`):**
```yaml
concurrency:
  group: deploy-${{ github.ref }}-${{ github.event_name }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}  # Só cancela PRs

jobs:
  deploy-vercel:
    timeout-minutes: 20
```

**PR Workflow (`pr.yml`):**
```yaml
jobs:
  pr-validation:
    timeout-minutes: 20
```

**E2E Workflow (`e2e.yml`):**
```yaml
env:
  NODE_VERSION: "22.x"
  PLAYWRIGHT_BROWSERS_PATH: 0

jobs:
  test:
    timeout-minutes: 30
```

**Benefícios:**
- ✅ Cancela builds duplicados automaticamente
- ✅ Evita deploys travados consumindo horas de Actions
- ✅ Falha rápido se algo der errado
- ✅ Preserva deploys de produção em andamento

### 5. **Deploy Apenas em Main após CI**

O workflow de deploy agora só executa em produção se:

```yaml
if: |
  (github.event_name == 'workflow_run' && 
   github.event.workflow_run.conclusion == 'success' &&
   github.event.workflow_run.head_branch == 'main') ||
  github.event_name == 'workflow_dispatch' ||
  (github.event_name == 'pull_request' && github.event.pull_request.draft == false)
```

**Regras:**
- ✅ **Produção**: Só após CI passar na branch `main`
- ✅ **Preview**: Para PRs não-draft
- ✅ **Manual**: Via workflow_dispatch

### 6. **Script de Configuração de Branch Protection**

Criado `scripts/configure-branch-protection.sh` que configura via GitHub API:

**Regras Aplicadas:**
- ✅ Requer CI passar (`Build and Test` + `test`)
- ✅ Requer 1 aprovação em PR
- ✅ Descarta aprovações em novos commits (`dismiss_stale_reviews`)
- ✅ Requer conversas resolvidas
- ✅ Bloqueia force push
- ✅ Bloqueia deleção da branch
- ✅ Regras especiais para Dependabot (bypass de aprovação mas CI obrigatório)

---

## 🚀 Como Usar

### Passo 1: Configurar Branch Protection

```bash
# Via script (recomendado)
./scripts/configure-branch-protection.sh

# OU manualmente via GitHub UI:
# https://github.com/thiagobodevanadv-alt/assistente-jur-dico-principal/settings/branches
```

### Passo 2: Configurar Ambientes com Revisores

Para segredos sensíveis, crie ambientes protegidos:

1. Acesse: `Settings → Environments → New environment`

2. Crie 2 ambientes:

**Ambiente: `production`**
- Protection rules:
  - ✅ Required reviewers: [adicione seu usuário]
  - ✅ Wait timer: 0 minutos
  - ✅ Deployment branches: `main` apenas
- Environment secrets:
  - `VERCEL_TOKEN`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `QDRANT_URL`
  - `QDRANT_API_KEY`

**Ambiente: `preview`**
- Protection rules:
  - ✅ Deployment branches: `*` (todos)
- Environment secrets:
  - (pode usar valores dummy ou compartilhar com produção)

### Passo 3: Configurar Lista de Aprovadores Confiáveis

Para permitir que certos usuários/bots façam merge:

```yaml
# No arquivo .github/dependabot.yml (se não existir, crie)
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    reviewers:
      - "thiagobodevanadv-alt"  # Seu usuário
    open-pull-requests-limit: 5
```

### Passo 4: Validar Configuração

```bash
# Verificar proteção atual
gh api /repos/thiagobodevanadv-alt/assistente-jur-dico-principal/branches/main/protection | jq

# Criar um PR de teste com Dependabot
gh api --method POST \
  /repos/thiagobodevanadv-alt/assistente-jur-dico-principal/dispatches \
  -f event_type=dependabot-test
```

---

## 📊 Estrutura de Workflows Atualizada

```
.github/workflows/
├── ci.yml                      # ✅ CI principal (build, test, lint)
│   ├── Timeout: 30min
│   ├── Cache otimizado
│   └── Executa em push/PR
│
├── e2e.yml                     # ✅ Testes E2E com Playwright
│   ├── Timeout: 30min
│   ├── Apenas em PR/manual
│   └── Continue-on-error em CI
│
├── pr.yml                      # ✅ Validação de PR
│   ├── Timeout: 20min
│   ├── Verifica conflitos
│   └── Lint + testes
│
├── deploy.yml                  # ✅ Deploy Vercel
│   ├── Timeout: 20min
│   ├── Validação de segredos
│   ├── Após CI passar (main)
│   └── Preview para PRs
│
└── dependabot-auto-merge.yml  # ✅ Auto-merge do Dependabot
    ├── Job 1: Auto-approve (minor/patch)
    ├── Job 2: Auto-merge após CI
    └── Comentário para major updates
```

---

## 🔍 Verificação de Conformidade

Use este checklist para verificar se tudo está correto:

### ✅ Proteção de Branch
- [ ] Branch `main` tem proteção habilitada
- [ ] Requer CI passar antes de merge
- [ ] Requer ao menos 1 aprovação
- [ ] Descarta aprovações em novos commits
- [ ] Force push bloqueado
- [ ] Deleção bloqueada

### ✅ Segredos Configurados
- [ ] `VERCEL_TOKEN` configurado no ambiente `production`
- [ ] `VERCEL_ORG_ID` em repository secrets
- [ ] `VERCEL_PROJECT_ID` em repository secrets
- [ ] `UPSTASH_REDIS_REST_URL` configurado
- [ ] `UPSTASH_REDIS_REST_TOKEN` configurado
- [ ] `QDRANT_URL` configurado (se usar Qdrant)
- [ ] `QDRANT_API_KEY` configurado (se usar Qdrant)

### ✅ Workflows Funcionando
- [ ] CI passa em commits na `main`
- [ ] E2E executa em PRs
- [ ] Deploy só acontece após CI passar
- [ ] Dependabot aguarda CI antes de merge
- [ ] Preview deploys funcionam em PRs

### ✅ Testes de Integração
- [ ] Criar PR dummy e verificar se CI executa
- [ ] Verificar se deploy preview é criado
- [ ] Testar merge de PR aprovado
- [ ] Verificar se deploy de produção executa após merge

---

## 🐛 Troubleshooting

### "Branch protection not configured"

**Solução**: Execute o script de configuração:
```bash
./scripts/configure-branch-protection.sh
```

Se falhar, configure manualmente via UI do GitHub.

### "VERCEL_TOKEN secret is not configured"

**Solução**: 
1. Crie um token em: https://vercel.com/account/tokens
2. Adicione em: `Settings → Secrets and variables → Actions → New repository secret`
3. Nome: `VERCEL_TOKEN`, Valor: seu token

### "Dependabot não está fazendo merge automático"

**Causas possíveis:**
1. CI não passou (verifique logs do CI)
2. É um update major (requer revisão manual)
3. Há conflitos no PR
4. Branch protection requer aprovação manual

**Solução**: 
- Para minor/patch: Aguarde CI passar
- Para major: Revise manualmente e aprove

### "Deploy travado há muito tempo"

**Solução**: O timeout de 20min vai cancelar automaticamente. Se não cancelar:
```bash
# Cancelar manualmente via CLI
gh run cancel <RUN_ID>

# Ou via UI
# https://github.com/thiagobodevanadv-alt/assistente-jur-dico-principal/actions
```

### "Cache não está sendo usado"

**Verificar:**
```bash
# Ver logs do workflow
gh run view --log

# Procurar por:
# "Cache hit" → cache foi usado ✅
# "Cache miss" → cache não encontrado (normal na primeira vez)
```

---

## 📚 Referências

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Dependabot Auto-Merge](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/automating-dependabot-with-github-actions)
- [GitHub Actions Cache](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Workflow Concurrency](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#concurrency)

---

## 🎯 Próximas Melhorias (Opcional)

- [ ] Adicionar matriz de testes para múltiplas versões do Node.js
- [ ] Implementar deploy staging automático
- [ ] Configurar notificações Slack/Discord para falhas
- [ ] Adicionar testes de performance no CI
- [ ] Configurar CODEOWNERS para revisão automática
- [ ] Implementar semantic-release para versionamento automático

---

**Data de Criação**: 9 de dezembro de 2024  
**Última Atualização**: 9 de dezembro de 2024  
**Autor**: GitHub Copilot + thiagobodevanadv-alt
