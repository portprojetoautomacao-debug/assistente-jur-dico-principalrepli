#!/bin/bash
# ============================================
# 🚂 RAILWAY + 🐕 DATADOG - Setup Automático
# ============================================
# Configura variáveis do Datadog no Railway CLI

set -e

echo "🚂 Railway + Datadog Setup"
echo "=========================="
echo ""

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado"
    echo ""
    echo "Instale com:"
    echo "  curl -fsSL https://railway.com/install.sh | sh"
    exit 1
fi

# Verificar se está linkado ao projeto
if ! railway status &> /dev/null; then
    echo "❌ Projeto Railway não linkado"
    echo ""
    echo "Execute primeiro:"
    echo "  railway link -p 65944b39-fdb1-491c-9395-d684e3e05204"
    exit 1
fi

echo "✅ Railway CLI configurado"
echo ""

# Solicitar API Key do Datadog
echo "📝 Configure as variáveis do Datadog:"
echo ""
read -sp "DD_API_KEY (cole sua API key): " DD_API_KEY
echo ""

if [ -z "$DD_API_KEY" ]; then
    echo "❌ DD_API_KEY não pode ser vazio"
    exit 1
fi

# Site (região)
echo ""
echo "DD_SITE (região do Datadog):"
echo "  1) us5.datadoghq.com (US5)"
echo "  2) us1.datadoghq.com (US1)"
echo "  3) datadoghq.eu (EU1)"
echo "  4) ap1.datadoghq.com (AP1)"
echo ""
read -p "Escolha (1-4) [1]: " SITE_CHOICE
SITE_CHOICE=${SITE_CHOICE:-1}

case $SITE_CHOICE in
    1) DD_SITE="us5.datadoghq.com" ;;
    2) DD_SITE="us1.datadoghq.com" ;;
    3) DD_SITE="datadoghq.eu" ;;
    4) DD_SITE="ap1.datadoghq.com" ;;
    *) DD_SITE="us5.datadoghq.com" ;;
esac

echo ""
echo "🔧 Configurando variáveis no Railway..."
echo ""

# Configurar variáveis (Railway CLI 4.x sintaxe)
railway variables --set "DD_API_KEY=$DD_API_KEY" \
  --set "DD_SITE=$DD_SITE" \
  --set "DD_ENV=production" \
  --set "DD_SERVICE=assistente-juridico-api" \
  --set "DD_VERSION=1.0.0" \
  --set "DD_TRACE_ENABLED=true" \
  --set "DD_RUNTIME_METRICS_ENABLED=true" \
  --set "DD_LOGS_INJECTION=true"

echo ""
echo "✅ Variáveis configuradas com sucesso!"
echo ""
echo "📋 Variáveis definidas:"
echo "  DD_API_KEY: ****${DD_API_KEY: -6}"
echo "  DD_SITE: $DD_SITE"
echo "  DD_ENV: production"
echo "  DD_SERVICE: assistente-juridico-api"
echo "  DD_TRACE_ENABLED: true"
echo ""
echo "🚀 Próximo passo:"
echo "  railway up"
echo ""
echo "📊 Validar no Datadog:"
echo "  https://app.$DD_SITE/apm/services"
echo ""
