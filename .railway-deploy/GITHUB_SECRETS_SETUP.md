# Configuração de Secrets Avançados - GitHub Actions

Como não foi possível configurar via CLI neste ambiente, siga estes passos para configurar os secrets avançados manualmente:

## 📋 Secrets Necessários

### 1. AUTO_ROLLBACK_ENABLED
**Valor:** `true`
**Descrição:** Habilita rollback automático em caso de falha de deployment

### 2. NOTIFICATION_WEBHOOK_URL (Opcional)
**Valor:** URL do seu webhook (Slack, Discord, Teams, etc.)
**Descrição:** URL para receber notificações de deployment

## 🛠️ Como Configurar Manualmente

### Passo 1: Acesse as Configurações do Repositório
1. Vá para: https://github.com/thiagobodevan-a11y/assistente-juridico-p
2. Clique em **"Settings"** (ícone de engrenagem)
3. No menu lateral esquerdo, clique em **"Secrets and variables"**
4. Clique em **"Actions"**

### Passo 2: Adicione os Secrets

#### Secret 1: AUTO_ROLLBACK_ENABLED
1. Clique em **"New repository secret"**
2. **Name:** `AUTO_ROLLBACK_ENABLED`
3. **Value:** `true`
4. Clique em **"Add secret"**

#### Secret 2: NOTIFICATION_WEBHOOK_URL (Opcional)
1. Clique em **"New repository secret"**
2. **Name:** `NOTIFICATION_WEBHOOK_URL`
3. **Value:** Cole a URL do seu webhook (exemplos abaixo)
4. Clique em **"Add secret"**

## 🌐 Exemplos de URLs de Webhook

### Slack
```
https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```
Para obter: Slack → Apps → Incoming WebHooks → Add to Slack

### Discord
```
https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK
```
Para obter: Server Settings → Integrations → Webhooks → New Webhook

### Microsoft Teams
```
https://outlook.office.com/webhook/YOUR/TEAMS/WEBHOOK
```
Para obter: Channel → Connectors → Incoming Webhook

## ✅ Verificação

Após configurar os secrets, você pode verificar se estão funcionando fazendo um deploy de teste no Vercel e observando os logs do workflow `vercel-webhook-automation.yml` no GitHub Actions.

## 🔧 Funcionalidades Ativadas

Com estes secrets configurados, o sistema irá:

- **🔄 Rollback Automático:** Em caso de falha no deployment, o sistema tentará fazer rollback para a versão anterior estável automaticamente
- **📢 Notificações:** Todas as ações de deployment serão notificadas via webhook para o canal configurado

## 📊 Status Atual

- ✅ **Vercel Webhook:** Configurado e funcional
- ✅ **GitHub Actions Workflow:** Criado e testado
- ✅ **Variáveis de Ambiente:** Configuradas no Vercel
- 🔄 **Secrets Avançados:** Aguardando configuração manual

## 🚀 Próximo Passo

Após configurar os secrets, faça um push para a branch `main` para testar a integração completa!