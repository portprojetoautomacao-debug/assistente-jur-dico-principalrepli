#!/bin/bash
#
# Script de validação completa das correções
# Testa todas as funcionalidades corrigidas
#

echo "🧪 VALIDAÇÃO COMPLETA DAS CORREÇÕES - Job Falhando"
echo "=================================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de sucessos/falhas
SUCCESS=0
FAIL=0

echo "1️⃣ Verificando Script de Limpeza de Portas"
echo "-------------------------------------------"
if [ -f scripts/cleanup-test-ports.sh ]; then
  echo -e "${GREEN}✓${NC} Script existe"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Script não existe"
  ((FAIL++))
fi

if [ -x scripts/cleanup-test-ports.sh ]; then
  echo -e "${GREEN}✓${NC} Script é executável"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Script não é executável"
  ((FAIL++))
fi

if bash scripts/cleanup-test-ports.sh; then
  echo -e "${GREEN}✓${NC} Script executa sem erro"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Script falhou"
  ((FAIL++))
fi
echo ""

echo "2️⃣ Verificando Configuração do Playwright"
echo "-----------------------------------------"
if [ -f playwright.config.ts ]; then
  echo -e "${GREEN}✓${NC} Playwright config existe"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Playwright config não existe"
  ((FAIL++))
fi

if grep -q "reuseExistingServer: true" playwright.config.ts; then
  echo -e "${GREEN}✓${NC} reuseExistingServer: true configurado"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} reuseExistingServer não configurado corretamente"
  ((FAIL++))
fi
echo ""

echo "3️⃣ Verificando package.json"
echo "----------------------------"
if grep -q "cleanup-test-ports.sh.*playwright test" package.json; then
  echo -e "${GREEN}✓${NC} Script test:e2e com cleanup"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Script test:e2e sem cleanup"
  ((FAIL++))
fi
echo ""

echo "4️⃣ Verificando Workflows GitHub"
echo "--------------------------------"
if grep -q "Cleanup test ports" .github/workflows/e2e.yml; then
  echo -e "${GREEN}✓${NC} e2e.yml com cleanup"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} e2e.yml sem cleanup"
  ((FAIL++))
fi

if grep -q "Cleanup test ports" .github/workflows/ci.yml; then
  echo -e "${GREEN}✓${NC} ci.yml com cleanup"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} ci.yml sem cleanup"
  ((FAIL++))
fi

if grep -q "Cleanup test ports" .github/workflows/deploy.yml; then
  echo -e "${GREEN}✓${NC} deploy.yml com cleanup"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} deploy.yml sem cleanup"
  ((FAIL++))
fi
echo ""

echo "5️⃣ Verificando Documentação"
echo "---------------------------"
if [ -f docs/E2E_PORT_FIX.md ]; then
  echo -e "${GREEN}✓${NC} docs/E2E_PORT_FIX.md existe"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} docs/E2E_PORT_FIX.md não existe"
  ((FAIL++))
fi

if [ -f docs/SUMMARY_JOB_FIX.md ]; then
  echo -e "${GREEN}✓${NC} docs/SUMMARY_JOB_FIX.md existe"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} docs/SUMMARY_JOB_FIX.md não existe"
  ((FAIL++))
fi
echo ""

echo "6️⃣ Executando Testes PII Filtering"
echo "-----------------------------------"
if npm run test:run -- src/services/__tests__/pii-filtering.test.ts &>/dev/null; then
  echo -e "${GREEN}✓${NC} Todos os 37 testes PII passaram"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Alguns testes PII falharam"
  ((FAIL++))
fi
echo ""

# Sumário Final
echo "=================================================="
echo "📊 RESULTADO FINAL"
echo "=================================================="
echo -e "Sucessos: ${GREEN}${SUCCESS}${NC}"
echo -e "Falhas: ${RED}${FAIL}${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ TODAS AS VALIDAÇÕES PASSARAM!${NC}"
  echo ""
  echo "🚀 Pronto para:"
  echo "  - Commit das mudanças"
  echo "  - Push para branch"
  echo "  - Merge do PR #44"
  exit 0
else
  echo -e "${RED}❌ ALGUMAS VALIDAÇÕES FALHARAM${NC}"
  echo ""
  echo "🔍 Revise os itens falhados acima"
  exit 1
fi
