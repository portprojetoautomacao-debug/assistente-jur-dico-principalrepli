#!/bin/bash
# Script de teste para validar sistema de issues automático

# Não parar em erros para continuar todos os testes
set +e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0
TEST_DIR=$(mktemp -d)

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Testes do Sistema de Issues Automático${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Função de teste
test_case() {
  local name="$1"
  local command="$2"
  local expected="$3"

  echo -e "${BLUE}Testing: $name${NC}"

  if eval "$command" | grep -q "$expected"; then
    echo -e "${GREEN}✅ PASS: $name${NC}\n"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAIL: $name${NC}\n"
    ((TESTS_FAILED++))
  fi
}

# Teste 1: Verificar GitHub CLI instalado
echo -e "${YELLOW}📦 Teste 1: Verificar dependências${NC}"
test_case "GitHub CLI instalado" "gh --version" "gh version"

# Teste 2: Verificar autenticação GitHub
echo -e "${YELLOW}🔐 Teste 2: Verificar autenticação${NC}"
test_case "GitHub autenticado" "gh auth status 2>&1" "Logged in"

# Teste 3: Verificar script bash existe e é executável
echo -e "${YELLOW}📄 Teste 3: Verificar arquivos${NC}"
if [ -f "auto-create-issues.sh" ] && [ -x "auto-create-issues.sh" ]; then
  echo -e "${GREEN}✅ PASS: Script bash existe e é executável${NC}\n"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ FAIL: Script bash não existe ou não é executável${NC}\n"
  ((TESTS_FAILED++))
fi

# Teste 4: Verificar GitHub Action workflow existe
if [ -f ".github/workflows/auto-create-issues.yml" ]; then
  echo -e "${GREEN}✅ PASS: GitHub Action workflow existe${NC}\n"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ FAIL: GitHub Action workflow não existe${NC}\n"
  ((TESTS_FAILED++))
fi

# Teste 5: Verificar settings.json tem triggers
echo -e "${YELLOW}⚙️  Teste 5: Verificar configuração VS Code${NC}"
if grep -q "githubIssues.createIssueTriggers" .vscode/settings.json; then
  TRIGGER_COUNT=$(grep -o '"TODO"' .vscode/settings.json | wc -l)
  if [ "$TRIGGER_COUNT" -ge 1 ]; then
    echo -e "${GREEN}✅ PASS: Settings.json configurado com triggers${NC}\n"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAIL: Settings.json sem triggers suficientes${NC}\n"
    ((TESTS_FAILED++))
  fi
else
  echo -e "${RED}❌ FAIL: Settings.json não configurado${NC}\n"
  ((TESTS_FAILED++))
fi

# Teste 6: Criar arquivo de teste com TODOs
echo -e "${YELLOW}🔬 Teste 6: Testar detecção de TODOs${NC}"
cat > "$TEST_DIR/test-file.ts" << 'EOF'
// TODO: Teste de detecção automática
// FIXME: Bug de teste
// JURIDICO: Teste jurídico
function testFunction() {
  // SECURITY: Teste de segurança
  return true;
}
EOF

DETECTED_TODOS=$(grep -rn -E "//\s*(TODO|FIXME|JURIDICO|SECURITY)" "$TEST_DIR/test-file.ts" | wc -l)
if [ "$DETECTED_TODOS" -eq 4 ]; then
  echo -e "${GREEN}✅ PASS: 4 TODOs detectados corretamente${NC}\n"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ FAIL: Esperado 4 TODOs, detectado $DETECTED_TODOS${NC}\n"
  ((TESTS_FAILED++))
fi

# Teste 7: Verificar pattern do GitHub Action
echo -e "${YELLOW}🎯 Teste 7: Validar pattern do GitHub Action${NC}"
if grep -q "TODO_PATTERN" .github/workflows/auto-create-issues.yml; then
  PATTERN_LINE=$(grep "TODO_PATTERN" .github/workflows/auto-create-issues.yml)
  # Verificar se contém as palavras-chave principais (ordem não importa)
  if echo "$PATTERN_LINE" | grep -q "TODO" && \
     echo "$PATTERN_LINE" | grep -q "FIXME" && \
     echo "$PATTERN_LINE" | grep -q "JURIDICO" && \
     echo "$PATTERN_LINE" | grep -q "SECURITY"; then
    echo -e "${GREEN}✅ PASS: Pattern do GitHub Action configurado corretamente${NC}\n"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAIL: Pattern do GitHub Action incompleto${NC}\n"
    ((TESTS_FAILED++))
  fi
else
  echo -e "${RED}❌ FAIL: TODO_PATTERN não encontrado no workflow${NC}\n"
  ((TESTS_FAILED++))
fi

# Teste 8: Verificar template de issue em português
echo -e "${YELLOW}🇧🇷 Teste 8: Verificar template português${NC}"
if grep -q "ISSUE_TEMPLATE" .github/workflows/auto-create-issues.yml; then
  if grep -A 10 "ISSUE_TEMPLATE" .github/workflows/auto-create-issues.yml | grep -q "Comentário\|Localização"; then
    echo -e "${GREEN}✅ PASS: Template de issue em português${NC}\n"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAIL: Template não está em português${NC}\n"
    ((TESTS_FAILED++))
  fi
else
  echo -e "${RED}❌ FAIL: ISSUE_TEMPLATE não configurado${NC}\n"
  ((TESTS_FAILED++))
fi

# Teste 9: Verificar labels automáticas configuradas
echo -e "${YELLOW}🏷️  Teste 9: Verificar configuração de labels${NC}"
if grep -q "LABEL" .github/workflows/auto-create-issues.yml; then
  if grep "LABEL" .github/workflows/auto-create-issues.yml | grep -q "auto-created"; then
    echo -e "${GREEN}✅ PASS: Labels automáticas configuradas${NC}\n"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAIL: Label 'auto-created' não configurada${NC}\n"
    ((TESTS_FAILED++))
  fi
else
  echo -e "${RED}❌ FAIL: Configuração de labels ausente${NC}\n"
  ((TESTS_FAILED++))
fi

# Teste 10: Verificar auto-atribuição
echo -e "${YELLOW}👤 Teste 10: Verificar auto-atribuição${NC}"
if grep -q "AUTO_ASSIGN" .github/workflows/auto-create-issues.yml; then
  if grep "AUTO_ASSIGN" .github/workflows/auto-create-issues.yml | grep -q "true"; then
    echo -e "${GREEN}✅ PASS: Auto-atribuição habilitada${NC}\n"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAIL: Auto-atribuição desabilitada${NC}\n"
    ((TESTS_FAILED++))
  fi
else
  echo -e "${RED}❌ FAIL: AUTO_ASSIGN não configurado${NC}\n"
  ((TESTS_FAILED++))
fi

# Teste 11: Verificar fechamento automático
echo -e "${YELLOW}🔄 Teste 11: Verificar fechamento automático${NC}"
if grep -q "CLOSE_ISSUES" .github/workflows/auto-create-issues.yml; then
  if grep "CLOSE_ISSUES" .github/workflows/auto-create-issues.yml | grep -q "true"; then
    echo -e "${GREEN}✅ PASS: Fechamento automático habilitado${NC}\n"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAIL: Fechamento automático desabilitado${NC}\n"
    ((TESTS_FAILED++))
  fi
else
  echo -e "${RED}❌ FAIL: CLOSE_ISSUES não configurado${NC}\n"
  ((TESTS_FAILED++))
fi

# Teste 12: Verificar prevenção de duplicatas
echo -e "${YELLOW}♻️  Teste 12: Verificar prevenção de duplicatas${NC}"
if grep -q "UPDATE_EXISTING" .github/workflows/auto-create-issues.yml; then
  if grep "UPDATE_EXISTING" .github/workflows/auto-create-issues.yml | grep -q "true"; then
    echo -e "${GREEN}✅ PASS: Prevenção de duplicatas habilitada${NC}\n"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAIL: Prevenção de duplicatas desabilitada${NC}\n"
    ((TESTS_FAILED++))
  fi
else
  echo -e "${RED}❌ FAIL: UPDATE_EXISTING não configurado${NC}\n"
  ((TESTS_FAILED++))
fi

# Teste 13: Verificar documentação
echo -e "${YELLOW}📚 Teste 13: Verificar documentação${NC}"
DOCS_FOUND=0
[ -f ".vscode/AUTO_ISSUES_README.md" ] && ((DOCS_FOUND++))
[ -f ".vscode/AUTO_ISSUES_QUICK_REF.md" ] && ((DOCS_FOUND++))
[ -f ".vscode/AUTO_ISSUES_CHECKLIST.md" ] && ((DOCS_FOUND++))
[ -f ".vscode/AUTO_ISSUES_EXAMPLES.md" ] && ((DOCS_FOUND++))

if [ "$DOCS_FOUND" -eq 4 ]; then
  echo -e "${GREEN}✅ PASS: 4 documentos encontrados${NC}\n"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ FAIL: Esperado 4 documentos, encontrado $DOCS_FOUND${NC}\n"
  ((TESTS_FAILED++))
fi

# Teste 14: Verificar script de criação de labels
echo -e "${YELLOW}🎨 Teste 14: Verificar script de labels${NC}"
if [ -f "create-github-labels.sh" ] && [ -x "create-github-labels.sh" ]; then
  echo -e "${GREEN}✅ PASS: Script de labels existe e é executável${NC}\n"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ FAIL: Script de labels não existe ou não é executável${NC}\n"
  ((TESTS_FAILED++))
fi

# Teste 15: Verificar VS Code task
echo -e "${YELLOW}⚙️  Teste 15: Verificar VS Code task${NC}"
if [ -f ".vscode/tasks.json" ]; then
  if grep -q "auto-scan-issues" .vscode/tasks.json; then
    echo -e "${GREEN}✅ PASS: Task 'auto-scan-issues' configurada${NC}\n"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAIL: Task 'auto-scan-issues' não encontrada${NC}\n"
    ((TESTS_FAILED++))
  fi
else
  echo -e "${RED}❌ FAIL: tasks.json não existe${NC}\n"
  ((TESTS_FAILED++))
fi

# Limpeza
rm -rf "$TEST_DIR"

# Resumo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Resumo dos Testes${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Testes passados: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Testes falhos: $TESTS_FAILED${NC}"
TOTAL=$((TESTS_PASSED + TESTS_FAILED))
PERCENTAGE=$((TESTS_PASSED * 100 / TOTAL))
echo -e "${BLUE}📈 Taxa de sucesso: $PERCENTAGE%${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 Todos os testes passaram! Sistema configurado corretamente.${NC}\n"
  exit 0
else
  echo -e "${RED}⚠️  Alguns testes falharam. Verifique a configuração.${NC}\n"
  echo -e "${YELLOW}📖 Consulte: .vscode/AUTO_ISSUES_CHECKLIST.md${NC}\n"
  exit 1
fi
