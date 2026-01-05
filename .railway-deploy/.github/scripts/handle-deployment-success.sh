#!/bin/bash

echo "✅ Deployment bem-sucedido!"

# Executar testes de smoke na produção
if [[ -n "$DEPLOYMENT_URL" ]]; then
  echo "🧪 Executando testes de smoke em $DEPLOYMENT_URL..."

  # Teste básico de conectividade
  if curl -f -s --max-time 10 "$DEPLOYMENT_URL" > /dev/null; then
    echo "✅ Site está respondendo"
  else
    echo "❌ Site não está respondendo"
    exit 1
  fi
fi

# Determinar status e ícone
if [[ "$DEPLOYMENT_STATE" == "ready" ]]; then
  STATUS="✅ Deployment Bem-Sucedido"
  ICON="✅"
elif [[ "$DEPLOYMENT_STATE" == "error" || "$DEPLOYMENT_STATE" == "failed" ]]; then
  STATUS="🚨 Deployment Falhou"
  ICON="🚨"
else
  STATUS="ℹ️ Deployment Status: $DEPLOYMENT_STATE"
  ICON="ℹ️"
fi

MESSAGE="$ICON **$STATUS**

**Detalhes:**
- 📦 Nome: $DEPLOYMENT_NAME
- 🌐 URL: $DEPLOYMENT_URL
- 🚀 Estado: $DEPLOYMENT_STATE
- 📅 Timestamp: $(date)

_Workflow: ${{ github.workflow }}_"

# Enviar para webhook se configurado
if [[ -n "$NOTIFICATION_WEBHOOK_URL" ]]; then
  curl -X POST $NOTIFICATION_WEBHOOK_URL \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"$MESSAGE\"}"
fi

echo "$MESSAGE"