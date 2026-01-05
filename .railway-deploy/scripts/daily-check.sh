#!/bin/bash

# ✅ CHECKLIST DIÁRIO AUTOMÁTICO - Assistente Jurídico PJe
# Executa verificações obrigatórias do sistema em produção
# Uso: ./scripts/daily-check.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ CHECKLIST DIÁRIO OBRIGATÓRIO - ${TIMESTAMP}"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Contadores
PASSED=0
FAILED=0
WARNINGS=0

# Função para reportar sucesso
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED+=1))
}

# Função para reportar falha
fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED+=1))
}

# Função para reportar warning
warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS+=1))
}

# Função para info
info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo "????????????????????????????????????????????????????????????"
echo "  1??  HEALTH CHECK DO SISTEMA (2 min)"
echo "????????????????????????????????????????????????????????????"
echo ""

# 1. Health Check
# Permite sobrescrever via variável de ambiente (útil para ambientes/staging).
BASE_URL="${DAILY_CHECK_BASE_URL:-https://assistente-juridico-github.vercel.app}"
info "Verificando health check..."

HEALTH_OK=false
HEALTH_ENDPOINT=""
HTTP_CODE="000"
BODY=""

# Ordem prioriza o endpoint documentado no checklist de deploy.
for endpoint in "/api/status?type=health" "/api/health" "/health"; do
    info "Verificando ${endpoint}..."
    HEALTH_RESPONSE=$(curl -s --max-time 30 --connect-timeout 10 -w "\n%{http_code}" "${BASE_URL}${endpoint}" || echo "000")
    HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
    BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -Eq '"status"\s*:\s*"ok"'; then
        HEALTH_OK=true
        HEALTH_ENDPOINT="$endpoint"
        break
    fi
done

if [ "$HEALTH_OK" = true ]; then
    pass "API Health: OK (${HEALTH_ENDPOINT}) (HTTP $HTTP_CODE)"
else
    fail "API Health: FALHOU (HTTP $HTTP_CODE)"
    echo "   Endpoint testado: ${BASE_URL}/api/status?type=health, ${BASE_URL}/api/health e ${BASE_URL}/health"
    echo "   Verifique: https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/logs"
fi

echo ""
echo "????????????????????????????????????????????????????????????"
echo "  2??  VERIFICAR ERROS SENTRY (3 min)"
echo "????????????????????????????????????????????????????????????"
echo ""

info "Acessar manualmente: https://sentry.io/organizations/thiagobodevan-a11y/issues/"
info "Filtrar: is:unresolved, last 24h"
warn "META: 0 erros críticos, < 5 erros médios (verificação manual)"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  3️⃣  TYPE CHECK (1 min)"
echo "═══════════════════════════════════════════════════════════"
echo ""

TYPECHECK_LOG="/tmp/type-check.log"
if npm run type-check >"$TYPECHECK_LOG" 2>&1; then
    pass "Type Check: SEM ERROS"
else
    fail "Type Check: ERROS ENCONTRADOS"
    echo "   Execute: npm run type-check"
    echo "   Verifique: $TYPECHECK_LOG"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  4️⃣  LINT (1 min)"
echo "═══════════════════════════════════════════════════════════"
echo ""

LINT_LOG="/tmp/lint.log"
LINT_EXIT=0
if npm run lint >"$LINT_LOG" 2>&1; then
    LINT_EXIT=0
else
    LINT_EXIT=$?
fi

LINT_OUTPUT=$(cat "$LINT_LOG" 2>/dev/null || echo "")
SUMMARY_LINE=$(echo "$LINT_OUTPUT" | grep -E 'problems? \(' | tail -n 1 || true)

ERROR_COUNT=$(echo "$SUMMARY_LINE" | grep -Eo '[0-9]+ errors?' | head -n 1 | grep -Eo '[0-9]+' || true)
WARNING_COUNT=$(echo "$SUMMARY_LINE" | grep -Eo '[0-9]+ warnings?' | head -n 1 | grep -Eo '[0-9]+' || true)

ERROR_COUNT=${ERROR_COUNT:-0}
WARNING_COUNT=${WARNING_COUNT:-0}

if [ "$LINT_EXIT" -eq 0 ]; then
    if [ "$WARNING_COUNT" -le 150 ]; then
        pass "Lint: $ERROR_COUNT erros, $WARNING_COUNT warnings (OK)"
    else
        warn "Lint: $ERROR_COUNT erros, $WARNING_COUNT warnings (ACIMA DO LIMITE: 150)"
    fi
else
    fail "Lint: $ERROR_COUNT ERROS, $WARNING_COUNT warnings"
    echo "   Execute: npm run lint:fix"
    echo "   Verifique: $LINT_LOG"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  5️⃣  TESTES UNITÁRIOS (2 min)"
echo "═══════════════════════════════════════════════════════════"
echo ""

if npm run test:run 2>&1 | tee /tmp/test.log | grep -q "Test Files.*passed"; then
    TEST_FILES=$(grep -oP 'Test Files\s+\K\d+(?=\s+passed)' /tmp/test.log || echo "?")
    TESTS=$(grep -oP 'Tests\s+\K\d+(?=\s+passed)' /tmp/test.log || echo "?")
    pass "Testes: $TEST_FILES arquivos, $TESTS testes PASSARAM"
else
    fail "Testes: FALHARAM"
    echo "   Execute: npm run test:run"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  6️⃣  BUILD DE PRODUÇÃO (3 min)"
echo "═══════════════════════════════════════════════════════════"
echo ""

if npm run build 2>&1 | tee /tmp/build.log | grep -q "built in"; then
    BUILD_TIME=$(grep -oP 'built in \K[\d.]+s' /tmp/build.log || echo "?")
    pass "Build: SUCESSO em $BUILD_TIME"
else
    fail "Build: FALHOU"
    echo "   Execute: npm run build"
    echo "   Verifique: /tmp/build.log"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  7️⃣  MÉTRICAS VERCEL (2 min)"
echo "═══════════════════════════════════════════════════════════"
echo ""

info "Acessar: https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/analytics"
warn "META: LCP < 2.5s, Error Rate < 1% (verificação manual)"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  8️⃣  RECURSOS (2 min)"
echo "═══════════════════════════════════════════════════════════"
echo ""

info "Upstash Redis: https://console.upstash.com/redis/"
warn "META: < 90% memória (verificação manual)"

info "Qdrant Cloud: https://cloud.qdrant.io/clusters"
warn "META: < 900MB storage (verificação manual)"

info "Gemini API: https://aistudio.google.com/app/apikey"
warn "META: < 80% quota diária (verificação manual)"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  📊 RESUMO DO CHECKLIST"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo -e "  ${GREEN}✓ Passou:${NC}     $PASSED checks"
echo -e "  ${RED}✗ Falhou:${NC}     $FAILED checks"
echo -e "  ${YELLOW}⚠ Warnings:${NC}   $WARNINGS checks"
echo ""

# Status final
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ CHECKLIST DIÁRIO: SUCESSO${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    exit 0
else
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ✗ CHECKLIST DIÁRIO: FALHAS DETECTADAS${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  Ações recomendadas:"
    echo "  1. Revisar logs acima"
    echo "  2. Criar issue no GitHub com label 'daily-check-failure'"
    echo "  3. Se crítico, notificar tech lead"
    echo "  4. Consultar: docs/RUNBOOK.md"
    echo ""
    exit 1
fi
