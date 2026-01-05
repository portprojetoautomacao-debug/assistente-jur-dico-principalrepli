# Guia Rápido: Configurando GitHub Actions

Este guia mostrará como configurar GitHub Actions para seu projeto em poucos minutos.

## ⚡ Setup Rápido (5 minutos)

### Passo 1: Verificar Workflows

Os workflows já estão configurados em `.github/workflows/`. Não é necessário criar nada!

```bash
ls .github/workflows/
# Você verá: ci.yml, deploy.yml, code-quality.yml, pr.yml, release.yml, nightly.yml
```

### Passo 2: Configurar Secrets

Vá em **Settings → Secrets and variables → Actions** no GitHub e adicione:

#### Secrets Obrigatórios:
```
VITE_GOOGLE_CLIENT_ID       # Seu Client ID do Google OAuth
VITE_GOOGLE_API_KEY          # Sua API Key do Google
VITE_REDIRECT_URI            # URL do seu app (ex: https://seu-app.vercel.app)
```

#### Secrets para Deploy (Opcional):
```
VERCEL_TOKEN                 # Token do Vercel (veja abaixo)
VERCEL_ORG_ID                # ID da organização no Vercel
VERCEL_PROJECT_ID            # ID do projeto no Vercel
```

### Passo 3: Obter Secrets do Vercel

Se você quer deploy automático, execute:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Criar token
vercel token create

# Linkar projeto e obter IDs
cd seu-projeto
vercel link

# Os IDs estarão em .vercel/project.json
cat .vercel/project.json
```

### Passo 4: Testar

Faça um push para qualquer branch:

```bash
git add .
git commit -m "test: configurando GitHub Actions"
git push
```

Vá em **Actions** no GitHub para ver os workflows executando! 🎉

## 📋 O que Acontece Automaticamente?

### Em cada Push/PR:
- ✅ Build do projeto
- ✅ Linter (ESLint)
- ✅ Testes (se houver)
- ✅ Análise de segurança
- ✅ Verificação de tipos TypeScript

### Em Push para Main:
- 🚀 Deploy automático para Vercel
- 📦 Build de produção
- 🔒 Análise de segurança avançada

### Em PRs:
- 🏷️ Labels automáticos
- 💬 Comentários com resumo
- 🔍 Verificação de conflitos
- 📊 Análise de tamanho do bundle

### Diariamente:
- 🌙 Build noturno
- 📦 Verificação de dependências desatualizadas
- 🔒 Auditoria de segurança

### Em Tags (v*.*.* ):
- 🏷️ Criação de release
- 📝 Changelog automático
- 📁 Build em ZIP
- 🚀 Deploy de produção

## 🎯 Workflows Essenciais

### 1. CI (Integração Contínua)
**Quando**: Todo push e PR  
**Faz**: Build + Lint + Tests  
**Tempo**: ~2-3 minutos

### 2. Deploy
**Quando**: Push em `main`  
**Faz**: Deploy para Vercel  
**Tempo**: ~3-4 minutos  
**Requer**: Secrets do Vercel

### 3. Code Quality
**Quando**: PRs e semanalmente  
**Faz**: CodeQL + Security  
**Tempo**: ~5-7 minutos

## 🔧 Configurações Avançadas

### Desabilitar um Workflow

Edite o arquivo `.github/workflows/{nome}.yml` e adicione no topo:

```yaml
on:
  workflow_dispatch:  # Apenas execução manual
```

### Modificar Horários

Para alterar quando o workflow executa:

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Todo dia às 2h UTC
```

Exemplos de cron:
- `0 2 * * *` - Todo dia às 2h UTC
- `0 0 * * 1` - Toda segunda-feira à meia-noite
- `0 */6 * * *` - A cada 6 horas

### Adicionar Notificações

Para receber notificações do Slack/Discord, adicione ao final do workflow:

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  if: always()
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 📊 Monitorando Workflows

### Ver Execuções
1. Vá em **Actions** no GitHub
2. Clique em um workflow
3. Veja histórico e detalhes

### Baixar Artifacts
1. Abra uma execução
2. Role até **Artifacts**
3. Baixe o arquivo

### Ver Logs
1. Abra uma execução
2. Clique em um job
3. Expanda os steps para ver logs

## 🐛 Solução de Problemas

### Build Falha

**Problema**: Build falha no CI mas funciona localmente

**Solução**:
```bash
# 1. Limpe node_modules
rm -rf node_modules package-lock.json

# 2. Reinstale
npm install

# 3. Teste build
npm run build

# 4. Commit package-lock.json atualizado
git add package-lock.json
git commit -m "fix: update package-lock.json"
```

### Deploy Falha

**Problema**: Deploy workflow falha

**Checklist**:
- [ ] Secrets do Vercel configurados?
- [ ] Build passa no CI?
- [ ] Variáveis de ambiente corretas?

**Solução**:
```bash
# Teste deploy local
vercel --prod

# Se funcionar, o problema são os secrets
# Reconfigure no GitHub
```

### Linter Falha

**Problema**: ESLint reporta erros

**Solução**:
```bash
# 1. Execute localmente
npm run lint

# 2. Corrija automaticamente
npm run lint -- --fix

# 3. Corrija manualmente o que não foi auto-corrigido

# 4. Commit
git add .
git commit -m "fix: lint errors"
```

### Secrets Não Funcionam

**Problema**: Variáveis de ambiente não são reconhecidas

**Solução**:
1. Verifique se secrets começam com `VITE_` (para Vite)
2. Verifique se estão em `Settings → Secrets → Actions`
3. Secrets não aparecem em logs (segurança)
4. Use `echo "VAR set: ${{ secrets.VAR != '' }}"` para verificar

## 🎨 Personalizando

### Alterar Node.js Version

Edite `.github/workflows/ci.yml`:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]  # Adicione versões
```

### Adicionar Testes E2E

Crie novo workflow `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [ main ]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
```

### Adicionar Cache Personalizado

Para bibliotecas específicas:

```yaml
- name: Cache Cypress
  uses: actions/cache@v4
  with:
    path: ~/.cache/Cypress
    key: cypress-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

## 📚 Próximos Passos

1. ✅ **Configure secrets** - Essencial para funcionar
2. 📝 **Leia documentação completa** - [WORKFLOWS.md](.github/WORKFLOWS.md)
3. 🔒 **Configure CodeQL** - Já está ativo!
4. 📊 **Monitore execuções** - Veja aba Actions
5. 🚀 **Deploy automático** - Configure Vercel

## 💡 Dicas Pro

### 1. Status Badges

Adicione no README.md:

```markdown
![CI](https://github.com/seu-usuario/seu-repo/workflows/CI/badge.svg)
![Deploy](https://github.com/seu-usuario/seu-repo/workflows/Deploy/badge.svg)
```

### 2. Proteja Branch Main

Settings → Branches → Add rule:
- ✅ Require status checks (CI, Code Quality)
- ✅ Require review before merging
- ✅ Require linear history

### 3. Auto-merge com Dependabot

Configure em `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

### 4. Matrix Testing

Teste em múltiplos OS:

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node: [18, 20]
runs-on: ${{ matrix.os }}
```

### 5. Conditional Steps

Execute steps condicionalmente:

```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: npm run deploy
```

## 🆘 Precisa de Ajuda?

- 📖 [Documentação Completa](.github/WORKFLOWS.md)
- 🐛 [Abrir Issue](https://github.com/seu-usuario/seu-repo/issues)
- 💬 [GitHub Discussions](https://github.com/seu-usuario/seu-repo/discussions)
- 📚 [GitHub Actions Docs](https://docs.github.com/en/actions)

---

✨ **Pronto!** Seus workflows estão configurados e funcionando!
