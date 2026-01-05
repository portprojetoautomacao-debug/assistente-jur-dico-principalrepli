# GitHub Actions Workflows

Este projeto utiliza GitHub Actions para CI/CD (Integração Contínua e Deploy Contínuo). Os workflows estão configurados para garantir qualidade de código, segurança e deployment automatizado.

## 📋 Workflows Disponíveis

### 1. CI (Continuous Integration)
**Arquivo**: `.github/workflows/ci.yml`

**Quando executa**:
- Push em branches: `main`, `develop`, `copilot/**`
- Pull Requests para: `main`, `develop`

**O que faz**:
- ✅ Build e testes em múltiplas versões do Node.js (18.x, 20.x)
- ✅ Executa linter (ESLint)
- ✅ Roda testes unitários
- ✅ Faz upload dos artifacts de build
- ✅ Análise de segurança com npm audit
- ✅ Verifica dependências desatualizadas

**Matriz de Build**:
```yaml
Node.js: [18.x, 20.x]
```

### 2. Deploy
**Arquivo**: `.github/workflows/deploy.yml`

**Quando executa**:
- Push na branch `main`
- Manualmente via workflow_dispatch

**O que faz**:
- 🚀 Deploy automático para Vercel
- 📦 Build com variáveis de ambiente de produção
- 💬 Comenta URL do deploy em PRs
- ✅ Notificação de status do deploy

**Secrets necessários**:
```
VITE_GOOGLE_CLIENT_ID
VITE_GOOGLE_API_KEY
VITE_REDIRECT_URI
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### 3. Code Quality
**Arquivo**: `.github/workflows/code-quality.yml`

**Quando executa**:
- Push em `main` e `develop`
- Pull Requests
- Semanalmente (toda segunda-feira às 00:00 UTC)

**O que faz**:
- 🔍 Análise de código com CodeQL
- 📊 Verificação de dependências
- 🔒 Análise de segurança
- 📏 Verificação de tipos TypeScript
- 📦 Análise de tamanho do bundle

### 4. Pull Request
**Arquivo**: `.github/workflows/pr.yml`

**Quando executa**:
- Ao abrir, sincronizar ou reabrir um PR
- Quando PR estiver pronto para review

**O que faz**:
- ✅ Validação completa do PR
- 🔄 Verifica conflitos de merge
- 🏷️ Adiciona labels automáticas
- 📊 Comenta resumo da validação
- 📦 Verifica limites de tamanho do bundle
- 🔍 Valida que package-lock.json foi atualizado

**Labels automáticos**:
- `documentation` - Mudanças em arquivos .md
- `ui` - Mudanças em componentes ou estilos
- `config` - Mudanças em arquivos de configuração
- `dependencies` - Mudanças em package.json
- `types` - Mudanças em arquivos TypeScript
- `api` - Mudanças na API
- `testing` - Mudanças em testes
- `ci-cd` - Mudanças em workflows
- `security` - Mudanças relacionadas à segurança

### 5. Release
**Arquivo**: `.github/workflows/release.yml`

**Quando executa**:
- Push de tags no formato `v*.*.*` (ex: v1.0.0)
- Manualmente via workflow_dispatch

**O que faz**:
- 📦 Cria build de produção
- 📝 Gera changelog automático
- 🏷️ Cria release no GitHub
- 📁 Anexa arquivo ZIP do build
- 🚀 Aciona deploy de produção

**Como criar uma release**:
```bash
# Criar tag
git tag v1.0.0
git push origin v1.0.0

# Ou manualmente pelo GitHub UI
```

### 6. Nightly Build
**Arquivo**: `.github/workflows/nightly.yml`

**Quando executa**:
- Diariamente às 02:00 UTC
- Manualmente via workflow_dispatch

**O que faz**:
- 🌙 Build noturno da branch `develop`
- 🔒 Auditoria de segurança
- 📦 Verifica dependências desatualizadas
- 📊 Relatório de tamanho do bundle
- ✅ Testes com cobertura
- 🔄 Sugestões de atualização de dependências

### 7. AI Agents Health Check
**Arquivo**: `.github/workflows/agents-health-check.yml`

**Quando executa**:
- A cada 6 horas (monitoramento contínuo)
- Push em `main` que afeta arquivos de agentes
- Manualmente via workflow_dispatch

**O que faz**:
- 🤖 Verifica configuração dos 15 agentes de IA
- 📡 Valida integração DJEN API (Comunica PJe)
- 📊 Valida integração DataJud API (CNJ)
- ⏰ Verifica configuração dos cron jobs
- 👨‍⚖️ Confirma dados do advogado configurado
- 💾 Valida uso do Spark KV storage
- 📊 Monitora limite de funções serverless (12 max)

**Validações incluídas**:
- ✅ Todos os arquivos de agentes existem
- ✅ Endpoints de API estão funcionais
- ✅ DJEN client configurado corretamente
- ✅ DataJud client configurado corretamente
- ✅ Tribunais configurados (TJMG, TRT3, TST, STJ)
- ✅ Advogado: Thiago Bodevan Veiga (OAB/MG 184.404)
- ✅ Email: thiagobodevanadvocacia@gmail.com
- ✅ Cron schedules válidos
- ✅ Spark KV keys utilizados no código

## ⚙️ Configuração

### Secrets Necessários

Configure os seguintes secrets no GitHub (Settings → Secrets and variables → Actions):

#### Para Build e Deploy:
```
VITE_GOOGLE_CLIENT_ID       - Client ID do Google OAuth
VITE_GOOGLE_API_KEY          - API Key do Google
VITE_REDIRECT_URI            - URI de redirecionamento
```

#### Para Deploy no Vercel:
```
VERCEL_TOKEN                 - Token de autenticação do Vercel
VERCEL_ORG_ID                - ID da organização no Vercel
VERCEL_PROJECT_ID            - ID do projeto no Vercel
```

#### Para AI Agents (Configurar no Vercel Dashboard):
```
GITHUB_TOKEN                      - Token do GitHub para Spark LLM API
DATAJUD_API_KEY                   - API Key do DataJud (CNJ)
VERCEL_AUTOMATION_BYPASS_SECRET   - Token bypass para webhooks e cron jobs
```

**Nota importante:** Os secrets dos agentes devem ser configurados no Vercel Dashboard (Settings → Environment Variables), não no GitHub Secrets, pois são utilizados em runtime pelas funções serverless.

### Como obter os secrets do Vercel:

1. **VERCEL_TOKEN**:
   ```bash
   vercel login
   vercel token create
   ```

2. **VERCEL_ORG_ID e VERCEL_PROJECT_ID**:
   ```bash
   cd seu-projeto
   vercel link
   # Valores estarão em .vercel/project.json
   ```

### Variáveis de Ambiente

As seguintes variáveis são usadas nos workflows:

```bash
VITE_APP_ENV=ci              # Para CI builds
VITE_APP_ENV=production      # Para production builds
VITE_APP_ENV=nightly         # Para nightly builds
```

## 🚀 Como Usar

### Executar workflow manualmente

1. Vá em "Actions" no GitHub
2. Selecione o workflow desejado
3. Clique em "Run workflow"
4. Escolha as opções necessárias
5. Clique em "Run workflow"

### Visualizar resultados

1. Vá em "Actions" no GitHub
2. Clique no workflow executado
3. Veja logs detalhados de cada job
4. Baixe artifacts se necessário

### Status Badges

Adicione badges ao README para mostrar status dos workflows:

```markdown
![CI](https://github.com/seu-usuario/assistente-juridico-pje/workflows/CI/badge.svg)
![Deploy](https://github.com/seu-usuario/assistente-juridico-pje/workflows/Deploy/badge.svg)
![Code Quality](https://github.com/seu-usuario/assistente-juridico-pje/workflows/Code%20Quality/badge.svg)
```

## 📊 Monitoramento

### Notificações

Você receberá notificações quando:
- ❌ Um workflow falhar
- ✅ Um deploy for bem-sucedido
- 🔒 Vulnerabilidades de segurança forem encontradas
- 📦 Dependências precisarem ser atualizadas

### Artifacts

Os workflows geram os seguintes artifacts:
- **build-{node-version}**: Build artifacts de cada versão do Node
- **nightly-build-{run-number}**: Builds noturnos
- **eslint-results.sarif**: Resultados do ESLint em formato SARIF

**Retenção**: 7 dias (configurável)

## 🔧 Solução de Problemas

### Build falha

1. Verifique os logs do workflow
2. Execute localmente: `npm run build`
3. Verifique se todas as variáveis de ambiente estão configuradas

### Deploy falha

1. Verifique se os secrets do Vercel estão configurados
2. Verifique se o build passou
3. Verifique logs do Vercel

### Testes falham

1. Execute localmente: `npm test`
2. Verifique se há mudanças que quebram testes existentes
3. Atualize testes se necessário

### ESLint falha

1. Execute localmente: `npm run lint`
2. Corrija os erros reportados
3. Execute `npm run lint -- --fix` para correções automáticas

## 📝 Boas Práticas

### Para Contribuidores

1. ✅ Sempre execute `npm run lint` antes de commitar
2. ✅ Execute `npm run build` para garantir que o build funciona
3. ✅ Execute `npm test` para garantir que testes passam
4. ✅ Mantenha package-lock.json atualizado
5. ✅ Escreva mensagens de commit descritivas

### Para Mantenedores

1. 🔒 Mantenha secrets atualizados e seguros
2. 📦 Revise dependências regularmente
3. 🔄 Atualize workflows conforme necessário
4. 📊 Monitore métricas de build e deploy
5. 🐛 Corrija workflows quebrados rapidamente

## 🔐 Segurança

### CodeQL Analysis

- Executa automaticamente em cada PR e push
- Analisa código para vulnerabilidades
- Reporta problemas na aba Security

### Dependency Review

- Verifica novas dependências em PRs
- Alerta sobre vulnerabilidades conhecidas
- Falha se severidade for moderada ou maior

### NPM Audit

- Executa em cada build
- Verifica todas as dependências
- Gera relatórios de vulnerabilidades

## 📚 Recursos Adicionais

- [Documentação GitHub Actions](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)

## 🆘 Suporte

Se encontrar problemas com os workflows:

1. Verifique esta documentação
2. Consulte os logs do workflow
3. Abra uma issue descrevendo o problema
4. Inclua logs relevantes e informações de ambiente
