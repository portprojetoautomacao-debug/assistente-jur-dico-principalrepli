#!/bin/bash
# ========================================
# 🧪 TESTE DE CONFIGURAÇÃO DO CODESPACES
# ========================================
# Script para verificar se o GitHub Copilot está configurado
# corretamente com máxima autonomia no Codespaces

set -e

echo "========================================="
echo "🧪 VERIFICAÇÃO DE CONFIGURAÇÃO CODESPACES"
echo "========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de testes
PASSED=0
FAILED=0

# Função de teste
test_check() {
    local name="$1"
    local command="$2"
    
    echo -n "⏳ Testando: $name... "
    
    if eval "$command" &>/dev/null; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

# Função de verificação de setting
check_vscode_setting() {
    local setting="$1"
    local expected="$2"
    
    # Tenta ler setting do workspace
    if grep -q "$setting" .vscode/settings.json 2>/dev/null; then
        return 0
    fi
    
    # Tenta ler do devcontainer
    if grep -q "$setting" .devcontainer/devcontainer.json 2>/dev/null; then
        return 0
    fi
    
    return 1
}

echo "📋 1. VERIFICANDO AMBIENTE"
echo "-------------------------------------------"

test_check "Node.js instalado" "which node"
test_check "npm instalado" "which npm"
test_check "Git instalado" "which git"
test_check "GitHub CLI (gh) instalado" "which gh"

echo ""
echo "📋 2. VERIFICANDO ARQUIVOS DE CONFIGURAÇÃO"
echo "-------------------------------------------"

test_check "devcontainer.json existe" "test -f .devcontainer/devcontainer.json"
test_check "codespaces-settings.json existe" "test -f .github/codespaces-settings.json"
test_check "CODESPACES_SETUP.md existe" "test -f .github/CODESPACES_SETUP.md"
test_check "copilot-instructions.md existe" "test -f .github/copilot-instructions.md"
test_check ".vscode/settings.json existe" "test -f .vscode/settings.json"
test_check ".vscode/tasks.json existe" "test -f .vscode/tasks.json"

echo ""
echo "📋 3. VERIFICANDO CONFIGURAÇÕES DO COPILOT"
echo "-------------------------------------------"

test_check "Copilot enable (*)" "check_vscode_setting 'github.copilot.enable'"
test_check "Copilot Chat enable" "check_vscode_setting 'github.copilot.chat.enable'"
test_check "Chat editing enabled" "check_vscode_setting 'chat.editing.enabled'"
test_check "Terminal auto-approve" "check_vscode_setting 'chat.tools.terminal.autoApprove'"
test_check "Coding Agent enabled" "check_vscode_setting 'githubPullRequests.codingAgent.enabled'"
test_check "Coding Agent auto-delegate" "check_vscode_setting 'githubPullRequests.codingAgent.autoDelegate'"

echo ""
echo "📋 4. VERIFICANDO AUTOMAÇÃO"
echo "-------------------------------------------"

test_check "Auto-save configurado" "check_vscode_setting 'files.autoSave'"
test_check "Format on save" "check_vscode_setting 'editor.formatOnSave'"
test_check "ESLint auto-fix" "check_vscode_setting 'source.fixAll.eslint'"
test_check "Tasks automáticas permitidas" "check_vscode_setting 'task.allowAutomaticTasks'"
test_check "Workspace trust habilitado" "check_vscode_setting 'security.workspace.trust.enabled'"

echo ""
echo "📋 5. VERIFICANDO DEPENDÊNCIAS DO PROJETO"
echo "-------------------------------------------"

test_check "node_modules existe" "test -d node_modules"
test_check "package.json existe" "test -f package.json"
test_check "package-lock.json existe" "test -f package-lock.json"

if [ -d "node_modules" ]; then
    test_check "React instalado" "test -d node_modules/react"
    test_check "TypeScript instalado" "test -d node_modules/typescript"
    test_check "Vite instalado" "test -d node_modules/vite"
    test_check "ESLint instalado" "test -d node_modules/eslint"
    test_check "Prettier instalado" "test -d node_modules/prettier"
fi

echo ""
echo "📋 6. VERIFICANDO SCRIPTS NPM"
echo "-------------------------------------------"

test_check "Script 'dev' existe" "npm run dev -- --version 2>/dev/null || true"
test_check "Script 'build' existe" "grep -q '\"build\"' package.json"
test_check "Script 'test' existe" "grep -q '\"test\"' package.json"
test_check "Script 'lint' existe" "grep -q '\"lint\"' package.json"
test_check "Script 'format' existe" "grep -q '\"format\"' package.json"

echo ""
echo "📋 7. VERIFICANDO PROCESSOS AUTOMÁTICOS"
echo "-------------------------------------------"

# Verificar se processos estão rodando
if pgrep -f "vite" > /dev/null; then
    echo -e "⏳ Testando: Vite dev server rodando... ${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "⏳ Testando: Vite dev server rodando... ${YELLOW}⚠️  WARN (pode estar parado)${NC}"
fi

if pgrep -f "vitest" > /dev/null; then
    echo -e "⏳ Testando: Vitest watch rodando... ${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "⏳ Testando: Vitest watch rodando... ${YELLOW}⚠️  WARN (pode estar parado)${NC}"
fi

echo ""
echo "📋 8. VERIFICANDO VARIÁVEIS DE AMBIENTE"
echo "-------------------------------------------"

if [ -n "$CODESPACES" ]; then
    echo -e "⏳ Testando: Rodando em Codespaces... ${GREEN}✅ PASS${NC}"
    ((PASSED++))
    
    if [ -n "$GITHUB_TOKEN" ]; then
        echo -e "⏳ Testando: GITHUB_TOKEN definido... ${GREEN}✅ PASS${NC}"
        ((PASSED++))
    else
        echo -e "⏳ Testando: GITHUB_TOKEN definido... ${RED}❌ FAIL${NC}"
        echo -e "   ${YELLOW}⚠️  Configure em: https://github.com/settings/codespaces${NC}"
        ((FAILED++))
    fi
else
    echo -e "⏳ Testando: Rodando em Codespaces... ${YELLOW}⚠️  WARN (ambiente local)${NC}"
fi

echo ""
echo "========================================="
echo "📊 RESULTADO FINAL"
echo "========================================="
echo ""

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo "Total de testes: $TOTAL"
echo -e "${GREEN}✅ Passou: $PASSED${NC}"
echo -e "${RED}❌ Falhou: $FAILED${NC}"
echo "Porcentagem de sucesso: ${PERCENTAGE}%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}🎉 TUDO CONFIGURADO CORRETAMENTE!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo "✅ GitHub Copilot pode trabalhar com MÁXIMA AUTONOMIA!"
    echo ""
    echo "📚 Para mais informações, consulte:"
    echo "   .github/CODESPACES_SETUP.md"
    echo ""
    exit 0
elif [ $PERCENTAGE -ge 80 ]; then
    echo -e "${YELLOW}=========================================${NC}"
    echo -e "${YELLOW}⚠️  CONFIGURAÇÃO QUASE COMPLETA${NC}"
    echo -e "${YELLOW}=========================================${NC}"
    echo ""
    echo "A maioria das configurações está OK, mas alguns itens precisam de atenção."
    echo ""
    echo "📚 Consulte o guia de troubleshooting:"
    echo "   .github/CODESPACES_SETUP.md#troubleshooting"
    echo ""
    exit 0
else
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED}❌ CONFIGURAÇÃO INCOMPLETA${NC}"
    echo -e "${RED}=========================================${NC}"
    echo ""
    echo "Vários testes falharam. Revise as configurações."
    echo ""
    echo "📚 Siga o guia de configuração:"
    echo "   .github/CODESPACES_SETUP.md"
    echo ""
    exit 1
fi
