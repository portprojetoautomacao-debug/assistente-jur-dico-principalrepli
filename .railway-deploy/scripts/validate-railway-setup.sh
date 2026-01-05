#!/bin/bash
# 🔍 Script de Validação - Railway Setup
# Verifica se DSPy Bridge está configurado e respondendo corretamente

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs
RAILWAY_URL="https://assistente-juridico-pje-production-2d98.up.railway.app"
HEALTH_ENDPOINT="$RAILWAY_URL/health"
OPTIMIZE_ENDPOINT="$RAILWAY_URL/optimize"

# Token de autenticação
DSPY_TOKEN="IFoHADHNOrs/liJgUFDYKgnWVTAvMhfnotUxywmelho="

echo "🔍 Validando configuração Railway - DSPy Bridge"
echo "================================================"
echo ""

# 1. Verificar Railway CLI
echo "1️⃣ Verificando Railway CLI..."
if command -v railway &> /dev/null; then
    echo -e "${GREEN}✅ Railway CLI instalado${NC}"
    railway --version
else
    echo -e "${RED}❌ Railway CLI não encontrado${NC}"
    exit 1
fi
echo ""

# 2. Verificar autenticação
echo "2️⃣ Verificando autenticação Railway..."
if railway whoami &> /dev/null; then
    USER=$(railway whoami 2>&1 | grep -o "[^ ]*@[^ ]*")
    echo -e "${GREEN}✅ Autenticado como: $USER${NC}"
else
    echo -e "${RED}❌ Não autenticado. Execute: railway login${NC}"
    exit 1
fi
echo ""

# 3. Verificar projeto vinculado
echo "3️⃣ Verificando projeto vinculado..."
if railway status &> /dev/null; then
    PROJECT=$(railway status 2>&1 | grep "Project:" | cut -d: -f2 | xargs)
    SERVICE=$(railway status 2>&1 | grep "Service:" | cut -d: -f2 | xargs)
    ENV=$(railway status 2>&1 | grep "Environment:" | cut -d: -f2 | xargs)
    echo -e "${GREEN}✅ Projeto: $PROJECT${NC}"
    echo -e "${GREEN}✅ Serviço: $SERVICE${NC}"
    echo -e "${GREEN}✅ Ambiente: $ENV${NC}"
else
    echo -e "${RED}❌ Nenhum projeto vinculado${NC}"
    exit 1
fi
echo ""

# 4. Verificar variáveis de ambiente
echo "4️⃣ Verificando variáveis de ambiente..."
REQUIRED_VARS=("DSPY_API_TOKEN" "DSPY_PORT" "ALLOWED_ORIGINS" "NODE_ENV")
ALL_VARS=$(railway variables 2>&1)

for VAR in "${REQUIRED_VARS[@]}"; do
    if echo "$ALL_VARS" | grep -q "$VAR"; then
        echo -e "${GREEN}✅ $VAR configurado${NC}"
    else
        echo -e "${YELLOW}⚠️  $VAR não encontrado${NC}"
    fi
done
echo ""

# 5. Testar endpoint de health
echo "5️⃣ Testando endpoint de health..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_ENDPOINT" 2>&1)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check OK (200)${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ Health check falhou (HTTP $HTTP_CODE)${NC}"
    echo "   URL: $HEALTH_ENDPOINT"
    echo "   Response: $BODY"
    echo ""
    echo -e "${YELLOW}💡 Dicas:${NC}"
    echo "   - Verifique se o deploy Railway está ativo"
    echo "   - Confira os logs: railway logs"
    echo "   - Acesse o dashboard: https://railway.app/project/609047f7-6398-45cc-8f64-35083f920139"
fi
echo ""

# 6. Testar endpoint de otimização (com autenticação)
echo "6️⃣ Testando endpoint de otimização..."
OPTIMIZE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$OPTIMIZE_ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DSPY_TOKEN" \
    -d '{
        "prompt": "Test prompt",
        "context": "Test context"
    }' 2>&1)

HTTP_CODE=$(echo "$OPTIMIZE_RESPONSE" | tail -n1)
BODY=$(echo "$OPTIMIZE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✅ Endpoint de otimização OK (${HTTP_CODE})${NC}"
    echo "   Response: ${BODY:0:100}..."
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${YELLOW}⚠️  Endpoint protegido corretamente (401 Unauthorized)${NC}"
    echo "   Autenticação funcionando, mas token pode estar incorreto"
elif [ "$HTTP_CODE" = "404" ]; then
    echo -e "${YELLOW}⚠️  Endpoint /optimize não encontrado (404)${NC}"
    echo "   Verificar se scripts/dspy_bridge.py expõe rota /optimize"
else
    echo -e "${RED}❌ Endpoint de otimização falhou (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
fi
echo ""

# 7. Resumo
echo "================================================"
echo "📊 RESUMO DA VALIDAÇÃO"
echo "================================================"
echo ""
echo "🔗 URLs Railway:"
echo "   Public:   $RAILWAY_URL"
echo "   Health:   $HEALTH_ENDPOINT"
echo "   Optimize: $OPTIMIZE_ENDPOINT"
echo ""
echo "🔑 Token DSPY:"
echo "   ${DSPY_TOKEN:0:20}..."
echo ""
echo "📝 Próximos passos:"
echo "   1. Se health check falhou: verifique logs com 'railway logs'"
echo "   2. Configure as variáveis no Vercel (veja RAILWAY_SETUP_MANUAL.md)"
echo "   3. Teste integração frontend -> Railway"
echo ""
echo "📚 Documentação completa: RAILWAY_SETUP_MANUAL.md"
echo ""
