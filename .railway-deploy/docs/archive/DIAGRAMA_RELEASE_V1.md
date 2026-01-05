# 📊 Diagrama de Fluxo - Sistema de Release Automático v1.0.0

## 🎯 Visão Geral

Este diagrama mostra o fluxo completo do sistema de release automático implementado para o **Assistente Jurídico PJe**.

---

## 🔄 Fluxo Completo de Release

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DESENVOLVEDOR                               │
│                                                                     │
│  1. Atualiza CHANGELOG.md com mudanças                             │
│  2. Atualiza versão no package.json                                │
│  3. Cria tag: git tag -a v1.0.0 -m "Release v1.0.0"                │
│  4. Push: git push origin v1.0.0                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ Tag pushed
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS - RELEASE WORKFLOW                │
│                   (.github/workflows/release.yml)                   │
│                                                                     │
│  Triggered by: push tags 'v*.*.*'                                  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │ Job: create-release                                        │    │
│  │                                                            │    │
│  │  Step 1: Checkout code                                    │    │
│  │          ✅ Fetch full git history                         │    │
│  │                                                            │    │
│  │  Step 2: Setup Node.js 20.x                               │    │
│  │          ✅ Cache npm dependencies                         │    │
│  │                                                            │    │
│  │  Step 3: Install dependencies                             │    │
│  │          ✅ npm ci                                          │    │
│  │                                                            │    │
│  │  Step 4: Build application                                │    │
│  │          ✅ npm run build                                   │    │
│  │          ✅ Environment: production                         │    │
│  │                                                            │    │
│  │  Step 5: Create release archive                           │    │
│  │          ✅ ZIP da pasta dist/                             │    │
│  │          ✅ Nome: assistente-juridico-pje-v1.0.0.zip       │    │
│  │                                                            │    │
│  │  Step 6: Generate changelog                               │    │
│  │          ✅ Extrai notas do CHANGELOG.md                   │    │
│  │          ✅ Gera release_notes.md                          │    │
│  │                                                            │    │
│  │  Step 7: Create GitHub Release                            │    │
│  │          ✅ Upload ZIP file                                │    │
│  │          ✅ Adiciona release notes                         │    │
│  │          ✅ Marca como latest release                      │    │
│  │          ✅ Pre-release se beta/alpha                      │    │
│  │                                                            │    │
│  │  Step 8: Deploy to production                             │    │
│  │          ✅ Usa actions/github-script@v7                   │    │
│  │          ✅ Chama API do GitHub Actions                    │    │
│  │          ✅ Aciona workflow deploy.yml                     │    │
│  │                                                            │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ✅ GitHub Release publicada                                        │
│  ✅ Arquivo ZIP disponível para download                            │
│  ✅ Release notes visíveis                                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ Workflow dispatch acionado
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   GITHUB ACTIONS - DEPLOY WORKFLOW                  │
│                    (.github/workflows/deploy.yml)                   │
│                                                                     │
│  Triggered by: workflow_dispatch do release.yml                    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │ Job: deploy-vercel                                         │    │
│  │                                                            │    │
│  │  Step 1: Checkout code                                    │    │
│  │          ✅ Código mais recente da main                    │    │
│  │                                                            │    │
│  │  Step 2: Setup Node.js 20.x                               │    │
│  │          ✅ Cache npm dependencies                         │    │
│  │                                                            │    │
│  │  Step 3: Install dependencies                             │    │
│  │          ✅ npm ci                                          │    │
│  │                                                            │    │
│  │  Step 4: Run linter                                       │    │
│  │          ✅ npm run lint                                    │    │
│  │          ⚠️  Continue on error                             │    │
│  │                                                            │    │
│  │  Step 5: Build application                                │    │
│  │          ✅ npm run build                                   │    │
│  │          ✅ Environment: production                         │    │
│  │          ✅ Com todas as variáveis de ambiente             │    │
│  │                                                            │    │
│  │  Step 6: Validate Vercel secrets                          │    │
│  │          ✅ VERCEL_TOKEN                                    │    │
│  │          ✅ VERCEL_ORG_ID                                   │    │
│  │          ✅ VERCEL_PROJECT_ID                              │    │
│  │          ❌ Falha se algum secret estiver faltando         │    │
│  │                                                            │    │
│  │  Step 7: Deploy to Vercel                                 │    │
│  │          ✅ Instala vercel CLI                             │    │
│  │          ✅ Deploy com --prod flag                         │    │
│  │          ✅ Captura deployment URL                         │    │
│  │          ✅ Valida URL de sucesso                          │    │
│  │                                                            │    │
│  │  Step 8: Add deployment summary                           │    │
│  │          ✅ Summary no GitHub Actions                      │    │
│  │          ✅ URL do deployment                              │    │
│  │          ✅ Informações de ambiente                        │    │
│  │                                                            │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │ Job: deploy-notification                                   │    │
│  │                                                            │    │
│  │  Depends on: deploy-vercel                                │    │
│  │                                                            │    │
│  │  Step 1: Notify deployment status                         │    │
│  │          ✅ Summary com checklist completo                 │    │
│  │          ✅ Links para recursos                            │    │
│  │          ✅ Troubleshooting se falhar                      │    │
│  │                                                            │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ✅ Deploy em produção completado                                   │
│  ✅ URL de produção atualizada                                      │
│  ✅ Logs disponíveis                                                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ Deploy successful
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           VERCEL PRODUCTION                         │
│                                                                     │
│  ✅ Aplicação deployada e acessível                                 │
│  ✅ URL: https://assistente-juridico-pje.vercel.app                │
│  ✅ Versão: v1.0.0                                                  │
│  ✅ Status: Live                                                    │
│                                                                     │
│  Features disponíveis:                                             │
│  • Dashboard Inteligente                                           │
│  • 7 Agentes IA Autônomos                                          │
│  • Integração DJEN/DataJud                                         │
│  • Google Calendar Sync                                            │
│  • Gestão de Processos (Kanban)                                    │
│  • Gestão Financeira                                               │
│  • Calculadora de Prazos                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Detalhes dos Componentes

### 1. Tag Git

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
```

- **Formato**: `v*.*.*` (versionamento semântico)
- **Tipo**: Tag anotada (não lightweight)
- **Imutável**: Não pode ser movida após criação
- **Trigger**: Aciona workflow de release automaticamente

### 2. GitHub Release

**Criada automaticamente contendo**:

- 📝 Release notes extraídas do CHANGELOG.md
- 📦 Arquivo ZIP da aplicação
- 🏷️ Tag Git referenciada
- 🔗 Links para código fonte
- 📊 Assets para download
- ✅ Marcada como "latest" release

**URL**: `https://github.com/thiagobodevan-a11y/assistente-jurdico-p/releases/tag/v1.0.0`

### 3. Workflow de Release

**Arquivo**: `.github/workflows/release.yml`

**Triggers**:
- Push de tags `v*.*.*`
- Workflow dispatch manual

**Jobs**:
1. `create-release` - Cria release e aciona deploy
2. `notify-release` - Notifica status

**Secrets necessários**:
- `GITHUB_TOKEN` (automático)
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_API_KEY`
- `VITE_REDIRECT_URI`

### 4. Workflow de Deploy

**Arquivo**: `.github/workflows/deploy.yml`

**Triggers**:
- Push na branch `main`
- Pull Requests
- Workflow dispatch (chamado pelo release.yml)

**Ambientes**:
- **Production**: Branch main ou workflow dispatch
- **Preview**: Pull requests
- **Staging**: Opcional via workflow dispatch

**Validações**:
- ✅ Lint
- ✅ Build
- ✅ Secrets configurados
- ✅ URL de deployment válida

### 5. Vercel Deployment

**Processo**:
1. Recebe código do GitHub Actions
2. Executa build na nuvem
3. Valida build artifacts
4. Deploy zero-downtime
5. Atualiza URL de produção
6. Mantém deployments anteriores

**Cache e Otimizações**:
- Build cache habilitado
- Otimização automática de assets
- CDN global
- HTTPS automático

---

## ⏱️ Timeline Típica

```
T+0s    → Push da tag v1.0.0
T+5s    → Workflow Release inicia
T+30s   → Build completo
T+45s   → GitHub Release criada
T+50s   → Workflow Deploy acionado
T+55s   → Build de produção inicia
T+2min  → Build de produção completo
T+3min  → Deploy no Vercel iniciado
T+5min  → Deploy completado
T+5min  → ✅ Aplicação live em produção
```

**Tempo total médio**: 5-10 minutos

---

## 🎯 Benefícios do Sistema

### Para Desenvolvedores

✅ **Processo simples**: 3 comandos para release completa  
✅ **Sem intervenção manual**: Tudo automatizado  
✅ **Rollback fácil**: Tags imutáveis permitem voltar  
✅ **Documentação automática**: Release notes do CHANGELOG  

### Para o Projeto

✅ **Versionamento semântico**: Padrão da indústria  
✅ **Rastreabilidade**: Cada versão tem tag Git  
✅ **Auditoria completa**: Histórico de releases  
✅ **Deploy confiável**: Validações antes de produção  

### Para Usuários

✅ **Atualizações rápidas**: Deploy em minutos  
✅ **Zero downtime**: Deploy sem interrupções  
✅ **Versões estáveis**: Só vai para produção após testes  
✅ **Rollback rápido**: Se necessário, volta versão anterior  

---

## 🔐 Segurança

### Secrets Protegidos

- Armazenados no GitHub Secrets
- Nunca expostos em logs
- Criptografados em repouso
- Acessíveis apenas em workflows autorizados

### Validações

- ✅ CodeQL security scanning
- ✅ Validação de secrets antes de deploy
- ✅ Build em ambiente isolado
- ✅ Verificação de deployment URL

### Compliance

- ✅ Versões imutáveis (auditoria)
- ✅ Histórico completo (CHANGELOG)
- ✅ Processo documentado (VERSIONAMENTO.md)
- ✅ Tags assinadas (opcional com GPG)

---

## 📈 Métricas de Sucesso

### Indicadores de Qualidade

- **Build Success Rate**: Objetivo 100%
- **Deploy Success Rate**: Objetivo 100%
- **Time to Production**: < 10 minutos
- **Rollback Time**: < 5 minutos

### Monitoramento

- GitHub Actions logs
- Vercel deployment logs
- Application monitoring
- Error tracking

---

## 🚀 Status Atual

✅ **Sistema configurado e testado**  
✅ **Documentação completa**  
✅ **Pronto para primeira release (v1.0.0)**  
✅ **Workflows validados**  
✅ **Segurança verificada (0 alertas)**  

---

## 📚 Referências

- [VERSIONAMENTO.md](./VERSIONAMENTO.md) - Guia completo
- [CHANGELOG.md](./CHANGELOG.md) - Histórico de versões
- [PROXIMOS_PASSOS_V1.md](./PROXIMOS_PASSOS_V1.md) - Instruções
- [RESUMO_IMPLEMENTACAO_V1.md](./RESUMO_IMPLEMENTACAO_V1.md) - Resumo
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel Docs](https://vercel.com/docs)

---

**Versão do diagrama**: 1.0.0  
**Última atualização**: 2025-11-18  
**Status**: ✅ Sistema operacional
