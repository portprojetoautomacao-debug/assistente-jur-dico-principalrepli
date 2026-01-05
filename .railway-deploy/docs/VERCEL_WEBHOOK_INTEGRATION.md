# Integração Vercel Webhook com GitHub Actions

Este documento explica como configurar a integração entre webhooks do Vercel e GitHub Actions para automação de deployments.

## Funcionalidades

A integração permite:

- ✅ **Monitoramento automático** de deployments do Vercel
- 🚨 **Detecção de falhas** e criação automática de issues
- 🔄 **Rollback automático** (opcional) em caso de falha
- 📊 **Registro de métricas** de deployment
- 📢 **Notificações** via webhooks externos
- 🧪 **Testes de smoke** automáticos após deploy

## Configuração

### 1. Variáveis de Ambiente no Vercel

Adicione as seguintes variáveis no seu projeto Vercel:

```bash
# GitHub Integration
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO_OWNER=your-github-username
GITHUB_REPO_NAME=assistente-juridico-p

# Webhook Secret (já configurado)
VERCEL_WEBHOOK_SECRET=your-webhook-secret
```

### 2. Token de Acesso do GitHub

Crie um Personal Access Token no GitHub com as seguintes permissões:

- `repo` - Acesso completo aos repositórios
- `workflow` - Permite disparar workflows

**Localização:** GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)

### 3. Secrets no GitHub Actions

Adicione os seguintes secrets no repositório:

```bash
# Para notificações (opcional)
NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Para rollback automático (opcional)
AUTO_ROLLBACK_ENABLED=true
```

## Como Funciona

### Fluxo de Eventos

1. **Deploy no Vercel** → Webhook dispara
2. **Validação HMAC-SHA1** → Verifica autenticidade
3. **Processamento do Evento** → Identifica tipo (sucesso/falha/criação/etc.)
4. **Dispatch para GitHub Actions** → Aciona workflow automatizado
5. **Ações Automatizadas** → Rollback, notificações, testes

### Eventos Processados

- `deployment.succeeded` → ✅ Deploy bem-sucedido
- `deployment.failed` → 🚨 Deploy falhou
- `deployment.created` → 📦 Deploy iniciado
- `deployment.cancelled` → ❌ Deploy cancelado
- `domain.created` → 🌐 Domínio criado
- `domain.deleted` → 🌐 Domínio removido
- `certificate.created` → 🔒 Certificado criado
- `certificate.deleted` → 🔒 Certificado removido

## Workflows Criados

### `vercel-webhook-automation.yml`

Workflow acionado por eventos do Vercel que:

- Processa eventos de deployment
- Executa testes de smoke em produção
- Cria issues automaticamente em caso de falha
- Registra métricas de deployment
- Envia notificações configuráveis

## Testando a Integração

### 1. Deploy Manual

```bash
# Faça um push para main ou staging
git push origin main

# Monitore os logs do webhook
# Verifique se o workflow foi acionado no GitHub Actions
```

### 2. Simular Falha

Para testar o rollback automático:

1. Faça uma alteração que cause falha no build
2. Push para main
3. Verifique se o workflow detecta a falha
4. Confirme se o rollback foi executado (se habilitado)

### 3. Verificar Logs

```bash
# Logs do webhook no Vercel
# Dashboard Vercel → Functions → vercel-webhook

# Logs do workflow no GitHub
# Actions → vercel-webhook-automation
```

## Configurações Avançadas

### Rollback Automático

Para habilitar rollback automático em caso de falha:

1. Defina `AUTO_ROLLBACK_ENABLED=true` nos secrets
2. Certifique-se de que há tags de release (`release-*`)
3. O sistema fará rollback para a versão anterior estável

### Notificações Externas

Configure webhooks para notificações:

```bash
# Slack
NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Discord
NOTIFICATION_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK

# Microsoft Teams
NOTIFICATION_WEBHOOK_URL=https://outlook.office.com/webhook/YOUR/TEAMS/WEBHOOK
```

### Monitoramento Adicional

O sistema registra métricas em artifacts do GitHub Actions. Para monitoramento avançado, integre com:

- **DataDog**: Métricas customizadas
- **New Relic**: APM e monitoramento
- **Sentry**: Error tracking
- **Grafana**: Dashboards

## Troubleshooting

### Webhook Não Dispara

1. Verifique se o webhook está configurado no Vercel
2. Confirme se `VERCEL_WEBHOOK_SECRET` está correto
3. Verifique logs do Vercel Functions

### GitHub Dispatch Falha

1. Confirme se `GITHUB_TOKEN` tem permissões corretas
2. Verifique se `GITHUB_REPO_OWNER` e `GITHUB_REPO_NAME` estão corretos
3. Veja logs do workflow no GitHub Actions

### Rollback Não Funciona

1. Certifique-se de que há tags de release
2. Verifique se `AUTO_ROLLBACK_ENABLED=true`
3. Confirme permissões do token Vercel

## Segurança

- ✅ HMAC-SHA1 validation para webhooks
- ✅ GitHub token com permissões mínimas
- ✅ Secrets criptografados no GitHub
- ✅ Logs não expõem informações sensíveis

## Próximos Passos

- [ ] Configurar notificações Slack/Discord
- [ ] Habilitar rollback automático
- [ ] Integrar com ferramentas de monitoramento
- [ ] Adicionar testes mais abrangentes
- [ ] Implementar blue-green deployments