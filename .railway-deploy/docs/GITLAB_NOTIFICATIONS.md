# 📢 Guia de Notificações do GitLab

> Configure notificações personalizadas para seu pipeline CI/CD

## 🎯 Opções Disponíveis

### 1️⃣ Email (Built-in) ✅ MAIS FÁCIL

**Já configurado automaticamente!** GitLab envia emails para:
- ❌ Pipeline failed
- ✅ Pipeline fixed (depois de falhar)
- 🏷️ Deploy completo

**Configurar:**
1. GitLab > Settings > Notifications
2. Escolha o nível: Disabled, Participating, Watch, etc.

---

### 2️⃣ Slack Integration

**Passos:**

1. **Criar Slack App:**
   - Acesse: https://api.slack.com/apps
   - Clique "Create New App" → "From scratch"
   - Nome: "GitLab CI/CD"
   - Workspace: Seu workspace

2. **Configurar Webhook:**
   - No app, vá em "Incoming Webhooks"
   - Ative "Activate Incoming Webhooks"
   - Clique "Add New Webhook to Workspace"
   - Escolha o canal (ex: #deployments)
   - Copie a URL: `https://hooks.slack.com/services/XXX/YYY/ZZZ`

3. **Adicionar no GitLab:**
   - GitLab > Settings > Integrations > Slack notifications
   - Cole a Webhook URL
   - Escolha os eventos (Pipeline, Deploy)
   - Teste e salve

4. **Adicionar no Pipeline (.gitlab-ci.yml):**

```yaml
notify_slack_success:
  stage: .post
  image: curlimages/curl:latest
  script:
    - |
      curl -X POST -H 'Content-type: application/json' \
      --data "{
        \"text\": \":white_check_mark: Pipeline *${CI_PROJECT_NAME}* succeeded!\",
        \"attachments\": [{
          \"color\": \"good\",
          \"fields\": [
            {\"title\": \"Branch\", \"value\": \"${CI_COMMIT_REF_NAME}\", \"short\": true},
            {\"title\": \"Author\", \"value\": \"${CI_COMMIT_AUTHOR}\", \"short\": true},
            {\"title\": \"Pipeline\", \"value\": \"<${CI_PIPELINE_URL}|#${CI_PIPELINE_ID}>\", \"short\": false}
          ]
        }]
      }" \
      ${SLACK_WEBHOOK_URL}
  when: on_success
  only:
    - main

notify_slack_failure:
  stage: .post
  image: curlimages/curl:latest
  script:
    - |
      curl -X POST -H 'Content-type: application/json' \
      --data "{
        \"text\": \":x: Pipeline *${CI_PROJECT_NAME}* failed!\",
        \"attachments\": [{
          \"color\": \"danger\",
          \"fields\": [
            {\"title\": \"Branch\", \"value\": \"${CI_COMMIT_REF_NAME}\", \"short\": true},
            {\"title\": \"Author\", \"value\": \"${CI_COMMIT_AUTHOR}\", \"short\": true},
            {\"title\": \"Pipeline\", \"value\": \"<${CI_PIPELINE_URL}|#${CI_PIPELINE_ID}>\", \"short\": false}
          ]
        }]
      }" \
      ${SLACK_WEBHOOK_URL}
  when: on_failure
  only:
    - main
```

5. **Adicionar variável secreta:**
   - GitLab > Settings > CI/CD > Variables
   - Key: `SLACK_WEBHOOK_URL`
   - Value: `https://hooks.slack.com/services/XXX/YYY/ZZZ`
   - Protected: ✅
   - Masked: ✅

---

### 3️⃣ Discord Integration

**Passos:**

1. **Criar Webhook no Discord:**
   - Servidor > Configurações do Canal > Integrações
   - Webhooks > Novo Webhook
   - Nome: "GitLab CI/CD"
   - Copie a URL: `https://discord.com/api/webhooks/XXX/YYY`

2. **Adicionar no Pipeline (.gitlab-ci.yml):**

```yaml
notify_discord_success:
  stage: .post
  image: curlimages/curl:latest
  script:
    - |
      curl -X POST -H 'Content-type: application/json' \
      --data "{
        \"embeds\": [{
          \"title\": \"✅ Pipeline Succeeded!\",
          \"description\": \"**${CI_PROJECT_NAME}** build completed successfully\",
          \"color\": 3066993,
          \"fields\": [
            {\"name\": \"Branch\", \"value\": \"${CI_COMMIT_REF_NAME}\", \"inline\": true},
            {\"name\": \"Author\", \"value\": \"${CI_COMMIT_AUTHOR}\", \"inline\": true},
            {\"name\": \"Commit\", \"value\": \"${CI_COMMIT_SHORT_SHA}\", \"inline\": true},
            {\"name\": \"Pipeline\", \"value\": \"[#${CI_PIPELINE_ID}](${CI_PIPELINE_URL})\"}
          ]
        }]
      }" \
      ${DISCORD_WEBHOOK_URL}
  when: on_success
  only:
    - main

notify_discord_failure:
  stage: .post
  image: curlimages/curl:latest
  script:
    - |
      curl -X POST -H 'Content-type: application/json' \
      --data "{
        \"embeds\": [{
          \"title\": \"❌ Pipeline Failed!\",
          \"description\": \"**${CI_PROJECT_NAME}** build failed\",
          \"color\": 15158332,
          \"fields\": [
            {\"name\": \"Branch\", \"value\": \"${CI_COMMIT_REF_NAME}\", \"inline\": true},
            {\"name\": \"Author\", \"value\": \"${CI_COMMIT_AUTHOR}\", \"inline\": true},
            {\"name\": \"Commit\", \"value\": \"${CI_COMMIT_SHORT_SHA}\", \"inline\": true},
            {\"name\": \"Pipeline\", \"value\": \"[#${CI_PIPELINE_ID}](${CI_PIPELINE_URL})\"}
          ]
        }]
      }" \
      ${DISCORD_WEBHOOK_URL}
  when: on_failure
  only:
    - main
```

3. **Adicionar variável secreta:**
   - GitLab > Settings > CI/CD > Variables
   - Key: `DISCORD_WEBHOOK_URL`
   - Value: `https://discord.com/api/webhooks/XXX/YYY`
   - Protected: ✅
   - Masked: ✅

---

### 4️⃣ Telegram Bot

**Passos:**

1. **Criar Bot:**
   - Abra @BotFather no Telegram
   - `/newbot`
   - Nome: "GitLab CI Bot"
   - Username: `seu_projeto_ci_bot`
   - Copie o token: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

2. **Pegar Chat ID:**
   - Envie mensagem para o bot
   - Acesse: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Copie o `chat_id`

3. **Adicionar no Pipeline:**

```yaml
notify_telegram:
  stage: .post
  image: curlimages/curl:latest
  script:
    - |
      STATUS=$(if [ "$CI_JOB_STATUS" == "success" ]; then echo "✅ SUCESSO"; else echo "❌ FALHOU"; fi)
      curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="${TELEGRAM_CHAT_ID}" \
      -d parse_mode="Markdown" \
      -d text="*${STATUS}* - Pipeline ${CI_PROJECT_NAME}%0A%0A*Branch:* ${CI_COMMIT_REF_NAME}%0A*Author:* ${CI_COMMIT_AUTHOR}%0A*Pipeline:* [#${CI_PIPELINE_ID}](${CI_PIPELINE_URL})"
  when: always
```

4. **Adicionar variáveis:**
   - `TELEGRAM_BOT_TOKEN`: Token do bot
   - `TELEGRAM_CHAT_ID`: ID do chat

---

### 5️⃣ Microsoft Teams

**Webhook URL:**
- Teams > Canal > Conectores > Webhook de Entrada
- Configure e copie a URL

```yaml
notify_teams:
  stage: .post
  image: curlimages/curl:latest
  script:
    - |
      curl -X POST -H 'Content-Type: application/json' \
      --data "{
        \"@type\": \"MessageCard\",
        \"themeColor\": \"0076D7\",
        \"title\": \"Pipeline ${CI_JOB_STATUS}\",
        \"text\": \"${CI_PROJECT_NAME} - ${CI_COMMIT_REF_NAME}\",
        \"sections\": [{
          \"facts\": [
            {\"name\": \"Author\", \"value\": \"${CI_COMMIT_AUTHOR}\"},
            {\"name\": \"Commit\", \"value\": \"${CI_COMMIT_SHORT_SHA}\"}
          ]
        }]
      }" \
      ${TEAMS_WEBHOOK_URL}
```

---

## 🚀 Quick Start - Recomendado

**Para começar rápido, use Email + notificações built-in do pipeline:**

Já está funcionando! Veja no final de cada job do pipeline:
- ✅ Sucesso mostrado em verde
- ❌ Falha mostrada em vermelho

**Quer mais?** Configure Slack ou Discord (15 minutos).

---

## 📊 Comparação

| Método | Facilidade | Recursos | Tempo Setup |
|--------|-----------|----------|-------------|
| Email | ⭐⭐⭐⭐⭐ | Básico | 0min (já funciona) |
| Pipeline Logs | ⭐⭐⭐⭐⭐ | Básico | 0min (já funciona) |
| Slack | ⭐⭐⭐⭐ | Avançado | 15min |
| Discord | ⭐⭐⭐⭐ | Avançado | 10min |
| Telegram | ⭐⭐⭐ | Médio | 20min |
| Teams | ⭐⭐⭐ | Médio | 15min |

---

## ✅ Recomendação

**Para seu projeto:**
1. ✅ **Email** (já funciona) - Para notificações importantes
2. ✅ **Pipeline logs** (já funciona) - Para debug
3. 🎯 **Slack/Discord** (opcional) - Se tiver equipe colaborando

Não precisa de todos! Escolha 1-2 que fazem sentido para você.
