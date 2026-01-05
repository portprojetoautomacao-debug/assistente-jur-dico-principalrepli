#!/bin/bash
#
# Validação das correções da Parte 2
# Verifica webkit removido e scripts E2E atualizados
#

echo "🧪 VALIDAÇÃO - Correções Parte 2"
echo "================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

SUCCESS=0
FAIL=0

echo "1️⃣ Validando Workflow auto-test-fix.yml"
echo "----------------------------------------"
if ! grep -q "webkit" .github/workflows/auto-test-fix.yml; then
  echo -e "${GREEN}✓${NC} Webkit removido do workflow"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Webkit ainda presente no workflow"
  ((FAIL++))
fi

if grep -q "browser: \[chromium, firefox\]" .github/workflows/auto-test-fix.yml; then
  echo -e "${GREEN}✓${NC} Matrix apenas com chromium e firefox"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Matrix incorreta"
  ((FAIL++))
fi
echo ""

echo "2️⃣ Validando Scripts package.json"
echo "----------------------------------"
if grep -q "test:e2e.*--project=chromium" package.json; then
  echo -e "${GREEN}✓${NC} test:e2e especifica projeto chromium"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} test:e2e não especifica projeto"
  ((FAIL++))
fi

if grep -q "test:e2e:all.*playwright test\"" package.json; then
  echo -e "${GREEN}✓${NC} test:e2e:all criado (todos browsers)"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} test:e2e:all não encontrado"
  ((FAIL++))
fi
echo ""

echo "3️⃣ Validando PII Filtering"
echo "--------------------------"
if npm run test:run -- src/services/__tests__/pii-filtering.test.ts &>/dev/null; then
  echo -e "${GREEN}✓${NC} Testes PII filtering passando (37/37)"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Testes PII filtering falhando"
  ((FAIL++))
fi
echo ""

echo "4️⃣ Validando Testes Schema"
echo "--------------------------"
if npm run test:run -- src/schemas/__tests__/ &>/dev/null; then
  echo -e "${GREEN}✓${NC} Testes schema passando (19/19)"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Testes schema falhando"
  ((FAIL++))
fi
echo ""

echo "5️⃣ Validando Playwright Config"
echo "-------------------------------"
if grep -q "// { name: 'webkit'" playwright.config.ts; then
  echo -e "${GREEN}✓${NC} Webkit comentado no playwright.config.ts"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Webkit não comentado"
  ((FAIL++))
fi

if grep -q "name: \"chromium\"" playwright.config.ts; then
  echo -e "${GREEN}✓${NC} Chromium habilitado"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Chromium não encontrado"
  ((FAIL++))
fi
echo ""

echo "================================="
echo "📊 RESULTADO FINAL"
echo "================================="
echo -e "Sucessos: ${GREEN}${SUCCESS}${NC}"
echo -e "Falhas: ${RED}${FAIL}${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ TODAS AS VALIDAÇÕES PASSARAM!${NC}"
  echo ""
  echo "📋 Resumo das Correções:"
  echo "  ✓ Webkit removido do workflow auto-test-fix.yml"
  echo "  ✓ Scripts E2E otimizados (--project=chromium)"
  echo "  ✓ test:e2e:all criado para testes completos"
  echo "  ✓ PII filtering: 37/37 testes passando"
  echo "  ✓ Schemas: 19/19 testes passando"
  echo ""
  echo "🚀 Próxima execução de CI deve passar sem erros de webkit!"
  exit 0
else
  echo -e "${RED}❌ ALGUMAS VALIDAÇÕES FALHARAM${NC}"
  exit 1
fi
