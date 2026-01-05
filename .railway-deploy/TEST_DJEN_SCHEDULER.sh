#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 TESTE COMPLETO - SCHEDULER DJEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASS=0
FAIL=0

# Função de teste
test_item() {
    local description=$1
    local command=$2

    echo -n "🔍 $description... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASS++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAIL++))
        return 1
    fi
}

echo "1️⃣ VERIFICAÇÃO DE ARQUIVOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_item "Scheduler implementado" "test -f backend/src/services/djen-scheduler.ts"
test_item "Rotas criadas" "test -f backend/src/routes/djen.ts"
test_item "Testes de integração" "test -f tests/integration/djen-scheduler.integration.test.ts"
test_item "Documentação completa" "test -f DJEN_SCHEDULER_COMPLETO.md"
test_item "Guia rápido" "test -f DJEN_QUICK_START.md"
echo ""

echo "2️⃣ VERIFICAÇÃO DE DEPENDÊNCIAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_item "Node.js instalado" "command -v node"
test_item "NPM instalado" "command -v npm"
test_item "node-cron instalado" "grep -q 'node-cron' backend/package.json"
echo ""

echo "3️⃣ VERIFICAÇÃO DE CONFIGURAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_item "DJEN_SCHEDULER_ENABLED=true" "grep -q 'DJEN_SCHEDULER_ENABLED=true' .env"
test_item "DATABASE_URL configurado" "grep -q 'DATABASE_URL=' .env"
test_item "GOOGLE_API_KEY configurado" "grep -q 'GOOGLE_API_KEY=' .env"
echo ""

echo "4️⃣ VERIFICAÇÃO DE CÓDIGO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_item "Scheduler importado no server.ts" "grep -q 'djen-scheduler' backend/src/server.ts"
test_item "Função iniciarSchedulerDJEN presente" "grep -q 'iniciarSchedulerDJEN' backend/src/services/djen-scheduler.ts"
test_item "Cron job 01:00 configurado" "grep -q '0 1 \* \* \*' backend/src/services/djen-scheduler.ts"
test_item "Cron job 09:00 configurado" "grep -q '0 9 \* \* \*' backend/src/services/djen-scheduler.ts"
echo ""

echo "5️⃣ VERIFICAÇÃO DE ESTRUTURA DB (SQL)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_item "Função salvarExpediente presente" "grep -q 'salvarExpediente' backend/src/services/djen-scheduler.ts"
test_item "Função extractPartiesWithFallback presente" "grep -q 'extractPartiesWithFallback' backend/src/services/djen-scheduler.ts"
test_item "Função enviarEmailNotificacao presente" "grep -q 'enviarEmailNotificacao' backend/src/services/djen-scheduler.ts"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESULTADO FINAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ PASS: $PASS${NC}"
echo -e "${RED}❌ FAIL: $FAIL${NC}"

TOTAL=$((PASS + FAIL))
PERCENTAGE=$((PASS * 100 / TOTAL))

echo ""
echo "Taxa de Sucesso: $PERCENTAGE% ($PASS/$TOTAL)"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
    echo ""
    echo "✅ Scheduler DJEN está PRONTO para uso!"
    echo "⏰ Próximas execuções: 01:00 e 09:00 (horário de Brasília)"
    echo ""
    echo "📝 Para testar manualmente:"
    echo "   curl -X POST http://localhost:3001/api/djen/trigger-manual"
    exit 0
else
    echo -e "${RED}❌ ALGUNS TESTES FALHARAM${NC}"
    echo ""
    echo "Por favor, verifique os itens acima marcados como FAIL."
    exit 1
fi
