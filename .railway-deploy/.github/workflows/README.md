# 📋 GitHub Actions Workflows

Este documento descreve os workflows do GitHub Actions do projeto **Assistente Jurídico PJe**.

> **Última atualização:** 2025-11-28  
> **Total de workflows ativos:** 21

---

## 🎯 Workflows Essenciais (Core)

| Workflow | Trigger | Descrição |
|----------|---------|-----------|
| **ci.yml** | Push/PR | CI principal - lint, build, testes, security |
| **deploy.yml** | Push main, PR, Manual | Deploy para Vercel |
| **e2e.yml** | Push/PR | Testes E2E com Playwright |
| **pr.yml** | PR | Validação de Pull Requests |
| **release.yml** | Tags v*, Manual | Gestão de releases |
| **security-scan.yml** | Diário, Push | Auditoria de segurança |

---

## 🤖 Workflows de Agentes IA

| Workflow | Trigger | Descrição |
|----------|---------|-----------|
| **agents-health-check.yml** | 6h, Push em agentes | Monitora os 15 agentes IA |
| **agents-integration.yml** | Push/PR em agentes | Testes de integração dos agentes |

### Arquivos Monitorados pelos Workflows de Agentes

```
api/
├── agents.ts                    # Core dos agentes
├── agents/
│   ├── log.ts                   # Logging de agentes
│   └── process-task.ts          # Processamento de tarefas
├── cron.ts                      # Jobs agendados (8 ações)
├── djen-sync.ts                 # Sincronização DJEN
├── expedientes.ts               # Gestão de expedientes
├── intimacoes/pendente.ts       # Intimações pendentes
├── lib/
│   ├── auth.ts                  # Autenticação
│   ├── cache.ts                 # Cache
│   ├── circuit-breaker.ts       # Circuit breaker
│   ├── djen-client.ts           # Cliente DJEN
│   ├── error-handler.ts         # Handler de erros
│   ├── kv-utils.ts              # Utilitários KV
│   ├── rate-limit.ts            # Rate limiting
│   ├── retry.ts                 # Retry logic
│   ├── safe-logger.ts           # Logger seguro
│   └── validation.ts            # Validações

src/lib/
├── agents.ts                    # Definição dos 15 agentes
├── agent-schemas.ts             # Schemas Zod para validação
├── agent-tracing.ts             # Rastreamento de agentes
├── auto-pilot-djen-prazos-minutas.ts  # Auto-pilot completo
├── djen-monitor-agent.ts        # Agente monitor DJEN
├── minuta-agent.ts              # Agente de minutas
├── real-agent-client.ts         # Cliente real para agentes
├── google-services-hub.ts       # Hub de serviços Google

src/hooks/
└── use-autonomous-agents.ts     # Hook React para agentes
```

---

## 🧹 Workflows de Manutenção

| Workflow | Trigger | Descrição |
|----------|---------|-----------|
| **cleanup.yml** | Semanal | Limpa deploys antigos do Vercel |
| **backup-recovery.yml** | Diário, Manual | Backup de dados importantes |
| **badges.yml** | Push main | Gera badges de status |
| **changelog.yml** | Release | Gera changelog automático |

---

## 📊 Workflows de Qualidade

| Workflow | Trigger | Descrição |
|----------|---------|-----------|
| **code-quality-analysis.yml** | Push/PR | Análise de código (SonarCloud, etc) |
| **code-integrity-check.yml** | Push/PR | Detecta dados mock/simulados, verifica integrações |
| **performance-optimization.yml** | Semanal, Manual | Lighthouse, accessibility |
| **dependency-health.yml** | Semanal, PR deps | Saúde das dependências |

---

## 🔄 Workflows de Automação

| Workflow | Trigger | Descrição |
|----------|---------|-----------|
| **dependabot-auto-merge.yml** | PR Dependabot | Auto-merge de patches |
| **copilot-auto-approve.yml** | PR github-actions | Automação para PRs do bot |
| **copilot-setup-steps.yml** | PR, Manual | Setup do Copilot Coding Agent |
| **monitoring-alerts.yml** | 2x/dia | Alertas de monitoramento |
| **advanced-tools.yml** | Push/PR | Ferramentas avançadas de CI |

---

## 📁 Workflows Arquivados

Workflows movidos para `.github/workflows-archived/` por serem redundantes ou obsoletos:

| Arquivo | Motivo |
|---------|--------|
| ci-cd-complete.yml | Redundante com ci.yml + deploy.yml |
| deploy-rollback.yml | Funcionalidade coberta por deploy.yml |
| code-quality.yml | Substituído por code-quality-analysis.yml |
| performance.yml | Substituído por performance-optimization.yml |
| bundle-analysis.yml | Incluído em performance-optimization.yml |
| nightly.yml | CI já roda em push |
| github-cli-config.yml | Não agrega valor |
| sync-gitlab.yml | GitLab não utilizado ativamente |
| keep-alive.yml | Desnecessário para Vercel |
| vercel-webhook-automation.yml | Não utilizado |
| autofix.yml | Branch inexistente |

---

## 🚀 Arquitetura Modernizada

### Jobs Paralelos no CI

```
                    ┌──────────────┐
                    │   Checkout   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼─────┐ ┌────▼────┐ ┌─────▼─────┐
       │    Lint    │ │  Build  │ │  Security │
       │ TypeCheck  │ │  Tests  │ │   Audit   │
       └──────┬─────┘ └────┬────┘ └─────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼───────┐
                    │   CI Status  │
                    │    Check     │
                    └──────────────┘
```

### Cache Otimizado

- **npm cache**: Via `actions/setup-node@v4`
- **Vite cache**: `.vite` e `node_modules/.vite`
- **Build artifacts**: Compartilhados entre jobs

---

## 🔧 Como Usar

### Executar Workflow Manualmente

```bash
# Listar workflows
gh workflow list

# Executar CI
gh workflow run ci.yml

# Executar Deploy
gh workflow run deploy.yml -f environment=production

# Ver status
gh run list --limit 10
```

### Verificar Falhas

```bash
# Ver workflows com falha
gh run list --status failure

# Ver logs de uma run específica
gh run view <run-id> --log-failed
```

---

## 📈 Métricas

- **Tempo médio de CI:** ~3-5 minutos
- **Tempo médio de Deploy:** ~5-8 minutos
- **Taxa de sucesso:** 95%+

---

## 🛡️ Segurança

Todos os secrets necessários estão documentados em:
- `CONFIGURACAO_VERCEL_TOKEN.md`
- `GITHUB_SECRETS_SETUP.md`

### Secrets obrigatórios:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_API_KEY`

---

## 📝 Histórico de Mudanças

### 2025-11-28
- ✅ Modernizado `ci.yml` com jobs paralelos
- ✅ Modernizado `deploy.yml` mais conciso
- ✅ Arquivados 11 workflows redundantes
- ✅ Reduzido de 36 para 23 workflows ativos

---

*Documentação mantida pelo GitHub Copilot*
