#!/bin/bash

# ========================================
# 🔍 Validador de Configuração GitPod Ona
# ========================================

echo "🔍 Validando configuração GitPod Ona..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0
WARNINGS=0

# Função para check
check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

# Função para warning
warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

echo "📦 1. Verificando estrutura de arquivos..."
echo "----------------------------------------"

# Verificar .ona/automations.yaml
if [ -f ".ona/automations.yaml" ]; then
    check_pass "Arquivo .ona/automations.yaml existe"
else
    check_fail "Arquivo .ona/automations.yaml NÃO encontrado"
fi

# Verificar .devcontainer/devcontainer.json
if [ -f ".devcontainer/devcontainer.json" ]; then
    check_pass "Arquivo .devcontainer/devcontainer.json existe"
else
    check_fail "Arquivo .devcontainer/devcontainer.json NÃO encontrado"
fi

# Verificar package.json
if [ -f "package.json" ]; then
    check_pass "Arquivo package.json existe"
else
    check_fail "Arquivo package.json NÃO encontrado"
fi

# Verificar backend/package.json
if [ -f "backend/package.json" ]; then
    check_pass "Arquivo backend/package.json existe"
else
    check_fail "Arquivo backend/package.json NÃO encontrado"
fi

echo ""
echo "🔧 2. Verificando configurações do devcontainer..."
echo "----------------------------------------"

# Verificar se tem as features necessárias
if grep -q '"ghcr.io/devcontainers/features/node:1"' .devcontainer/devcontainer.json; then
    check_pass "Feature Node.js configurada"
else
    warn "Feature Node.js pode estar ausente"
fi

if grep -q '"ghcr.io/devcontainers/features/java:1"' .devcontainer/devcontainer.json; then
    check_pass "Feature Java configurada"
else
    warn "Feature Java pode estar ausente"
fi

# Verificar portas
if grep -q '5173' .devcontainer/devcontainer.json; then
    check_pass "Porta 5173 (Vite) configurada"
else
    warn "Porta 5173 não encontrada"
fi

echo ""
echo "🚀 3. Verificando scripts npm..."
echo "----------------------------------------"

# Verificar scripts essenciais
SCRIPTS=("dev" "build" "build:deploy" "start:production" "test" "lint")

for script in "${SCRIPTS[@]}"; do
    if grep -q "\"$script\":" package.json; then
        check_pass "Script '$script' disponível"
    else
        warn "Script '$script' não encontrado"
    fi
done

echo ""
echo "📊 4. Verificando dependências..."
echo "----------------------------------------"

if [ -d "node_modules" ]; then
    check_pass "Diretório node_modules existe"
else
    warn "Diretório node_modules não encontrado (execute: npm install)"
fi

if [ -d "backend/node_modules" ]; then
    check_pass "Diretório backend/node_modules existe"
else
    warn "Diretório backend/node_modules não encontrado"
fi

echo ""
echo "🔐 5. Verificando arquivos de ambiente..."
echo "----------------------------------------"

if [ -f ".env" ]; then
    check_pass "Arquivo .env existe"
else
    warn "Arquivo .env não encontrado (copie de .env.example)"
fi

if [ -f ".env.example" ]; then
    check_pass "Arquivo .env.example existe"
else
    warn "Arquivo .env.example não encontrado"
fi

echo ""
echo "🧪 6. Verificando estrutura de testes..."
echo "----------------------------------------"

# Verificar arquivos de configuração de testes
TEST_CONFIGS=("vitest.config.ts" "playwright.config.ts" "vitest.api.config.ts")

for config in "${TEST_CONFIGS[@]}"; do
    if [ -f "$config" ]; then
        check_pass "Configuração de teste: $config"
    else
        warn "Configuração de teste '$config' não encontrada"
    fi
done

echo ""
echo "📁 7. Verificando diretórios essenciais..."
echo "----------------------------------------"

DIRS=("src" "backend" "public" "tests" "scripts")

for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        check_pass "Diretório '$dir' existe"
    else
        warn "Diretório '$dir' não encontrado"
    fi
done

echo ""
echo "🔍 8. Verificando scripts de automação..."
echo "----------------------------------------"

SCRIPTS_FILES=(
    "auto-init.sh"
    "auto-debug-fix.sh"
    "health-check-agents.sh"
    "scripts/sonar-auto-analyze.sh"
)

for script_file in "${SCRIPTS_FILES[@]}"; do
    if [ -f "$script_file" ]; then
        if [ -x "$script_file" ]; then
            check_pass "Script '$script_file' existe e é executável"
        else
            warn "Script '$script_file' existe mas não é executável (execute: chmod +x $script_file)"
        fi
    else
        warn "Script '$script_file' não encontrado"
    fi
done

echo ""
echo "🎯 9. Testando comandos essenciais..."
echo "----------------------------------------"

# Verificar Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_pass "Node.js instalado: $NODE_VERSION"
else
    check_fail "Node.js NÃO instalado"
fi

# Verificar npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_pass "npm instalado: $NPM_VERSION"
else
    check_fail "npm NÃO instalado"
fi

# Verificar Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    check_pass "Git instalado: $GIT_VERSION"
else
    check_fail "Git NÃO instalado"
fi

echo ""
echo "========================================="
echo "📊 RESUMO DA VALIDAÇÃO"
echo "========================================="
echo -e "${GREEN}✅ Verificações passadas: $PASSED${NC}"
echo -e "${RED}❌ Verificações falhas: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Avisos: $WARNINGS${NC}"
echo ""

# Resultado final
if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 Configuração perfeita! Tudo pronto para usar.${NC}"
        exit 0
    else
        echo -e "${YELLOW}✅ Configuração OK, mas há alguns avisos.${NC}"
        exit 0
    fi
else
    echo -e "${RED}❌ Há problemas na configuração que precisam ser corrigidos.${NC}"
    exit 1
fi
