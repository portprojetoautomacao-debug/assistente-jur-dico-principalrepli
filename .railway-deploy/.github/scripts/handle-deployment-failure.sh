#!/bin/bash

echo "🚨 Deployment falhou! Iniciando procedimentos de contingência..."

# Criar issue para rastreamento
gh issue create \
  --title "🚨 Deployment Falhou: $DEPLOYMENT_NAME" \
  --body "Deployment falhou no Vercel.

**Detalhes:**
- Nome: $DEPLOYMENT_NAME
- URL: $DEPLOYMENT_URL
- Estado: $DEPLOYMENT_STATE
- Timestamp: $(date)

**Ações necessárias:**
- [ ] Investigar causa da falha
- [ ] Executar rollback se necessário
- [ ] Notificar equipe
- [ ] Resolver problema e reimplantar" \
  --label "bug,deploy-failure"

# Notificar via webhook se configurado
if [[ -n "$WEBHOOK_URL" ]]; then
  curl -X POST $WEBHOOK_URL \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"🚨 Deployment falhou: $DEPLOYMENT_NAME - $DEPLOYMENT_URL\"}"
fi