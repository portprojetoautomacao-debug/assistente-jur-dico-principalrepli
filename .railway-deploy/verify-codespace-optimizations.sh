#!/bin/bash

# ==========================================
# VERIFICAR OTIMIZAÇÕES DO CODESPACE
# ==========================================

# Não usamos 'set -e' aqui porque este script de verificação
# deve continuar executando todas as checagens mesmo que algumas falhem.

echo "================================================"
echo "🔍 VERIFICANDO OTIMIZAÇÕES DO CODESPACE"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success_count=0
warning_count=0
error_count=0

# Function to check
check_item() {
    local name="$1"
    local expected="$2"
    local actual="$3"
    
    if [ "$expected" = "$actual" ]; then
        echo -e "${GREEN}✅${NC} $name: $actual"
        ((success_count++))
    else
        echo -e "${RED}❌${NC} $name: Esperado '$expected', encontrado '$actual'"
        ((error_count++))
    fi
}

check_warning() {
    local name="$1"
    local value="$2"
    local threshold="$3"
    
    if [ "$value" -le "$threshold" ]; then
        echo -e "${GREEN}✅${NC} $name: $value (OK)"
        ((success_count++))
    else
        echo -e "${YELLOW}⚠️${NC} $name: $value (Acima do ideal: $threshold)"
        ((warning_count++))
    fi
}

echo "📋 1. VERIFICANDO DEVCONTAINER.JSON"
echo "-----------------------------------"

# Check CPU requirement
cpu_req=$(grep -A 3 '"hostRequirements"' .devcontainer/devcontainer.json | awk -F: '/"cpus"/ { gsub(/[^0-9]/, "", $2); print $2; exit }')
check_item "CPUs solicitadas" "4" "$cpu_req"

# Check Memory requirement
mem_req=$(grep -A 3 '"hostRequirements"' .devcontainer/devcontainer.json | awk -F: '/"memory"/ { gsub(/[^0-9A-Za-z]/, "", $2); print $2; exit }')
check_item "Memória solicitada" "8gb" "$mem_req"

# Check postStartCommand
if grep -q 'auto-init.sh' .devcontainer/devcontainer.json; then
    echo -e "${RED}❌${NC} postStartCommand: Ainda executando auto-init.sh"
    ((error_count++))
else
    echo -e "${GREEN}✅${NC} postStartCommand: Modo LITE ativado"
    ((success_count++))
fi

echo ""
echo "📋 2. VERIFICANDO TASKS AUTOMÁTICAS"
echo "-----------------------------------"

# Count auto-start tasks
auto_tasks=$(grep -c '"runOn": "folderOpen"' .vscode/tasks.json 2>/dev/null || true)
auto_tasks=${auto_tasks:-0}
check_item "Tasks com auto-start" "0" "$auto_tasks"

echo ""
echo "📋 3. VERIFICANDO FILE WATCHERS (VITE)"
echo "--------------------------------------"

# Check if node_modules is ignored
if grep -q 'node_modules' vite.config.ts; then
    echo -e "${GREEN}✅${NC} node_modules/ ignorado no watch"
    ((success_count++))
else
    echo -e "${RED}❌${NC} node_modules/ NÃO ignorado (1.3GB)"
    ((error_count++))
fi

# Check if pkg is ignored
if grep -q 'pkg' vite.config.ts; then
    echo -e "${GREEN}✅${NC} pkg/ ignorado no watch"
    ((success_count++))
else
    echo -e "${YELLOW}⚠️${NC} pkg/ NÃO ignorado (898MB)"
    ((warning_count++))
fi

# Check if .git is ignored
if grep -q '.git' vite.config.ts; then
    echo -e "${GREEN}✅${NC} .git/ ignorado no watch"
    ((success_count++))
else
    echo -e "${YELLOW}⚠️${NC} .git/ NÃO ignorado (311MB)"
    ((warning_count++))
fi

echo ""
echo "📋 4. VERIFICANDO GITIGNORE"
echo "---------------------------"

# Check if pkg is in gitignore
if grep -q '^pkg/' .gitignore; then
    echo -e "${GREEN}✅${NC} pkg/ adicionado ao .gitignore"
    ((success_count++))
else
    echo -e "${YELLOW}⚠️${NC} pkg/ NÃO está no .gitignore"
    ((warning_count++))
fi

echo ""
echo "📋 5. VERIFICANDO RECURSOS DO SISTEMA"
echo "-------------------------------------"

# Check available memory
if command -v free &> /dev/null; then
    available_mem=$(free -g | awk '/^Mem:/ {print $7}')
    check_warning "Memória disponível" "$available_mem" "2"
fi

# Check CPU cores
cpu_cores=$(nproc)
echo -e "${GREEN}ℹ️${NC}  CPU cores disponíveis: $cpu_cores"

# Check running Node.js processes
node_processes=$(pgrep -c node 2>/dev/null || echo "0")
check_warning "Processos Node.js ativos" "$node_processes" "3"

echo ""
echo "📋 6. VERIFICANDO DIRETÓRIOS GRANDES"
echo "------------------------------------"

# Check node_modules size
if [ -d "node_modules" ]; then
    nm_size=$(du -sh node_modules | cut -f1)
    echo -e "${GREEN}ℹ️${NC}  node_modules/: $nm_size"
fi

# Check pkg size
if [ -d "pkg" ]; then
    pkg_size=$(du -sh pkg | cut -f1)
    echo -e "${GREEN}ℹ️${NC}  pkg/: $pkg_size"
fi

# Check .git size
if [ -d ".git" ]; then
    git_size=$(du -sh .git | cut -f1)
    echo -e "${GREEN}ℹ️${NC}  .git/: $git_size"
fi

echo ""
echo "================================================"
echo "📊 RESUMO"
echo "================================================"
echo -e "${GREEN}✅ Sucessos:${NC} $success_count"
echo -e "${YELLOW}⚠️  Avisos:${NC} $warning_count"
echo -e "${RED}❌ Erros:${NC} $error_count"
echo ""

if [ $error_count -eq 0 ] && [ $warning_count -eq 0 ]; then
    echo -e "${GREEN}🎉 PERFEITO! Todas as otimizações foram aplicadas corretamente!${NC}"
    echo ""
    echo "Seu Codespace agora deve:"
    echo "  ✅ Não desconectar mais"
    echo "  ✅ Iniciar em 30-60 segundos"
    echo "  ✅ Consumir apenas 500MB-1GB RAM ao abrir"
    echo "  ✅ Ser muito mais estável"
    echo ""
    echo "Para iniciar o desenvolvimento:"
    echo "  📦 Frontend: npm run dev"
    echo "  🚀 Full Stack: npm run dev (terminal 1) + cd backend && npm run dev (terminal 2)"
    exit 0
elif [ $error_count -eq 0 ]; then
    echo -e "${YELLOW}⚠️  ATENÇÃO: Há alguns avisos, mas nada crítico.${NC}"
    echo "O Codespace deve funcionar bem, mas pode ser otimizado ainda mais."
    exit 0
else
    echo -e "${RED}❌ ERRO: Algumas otimizações não foram aplicadas corretamente.${NC}"
    echo ""
    echo "Revise os itens marcados com ❌ acima."
    echo "Consulte: .github/CODESPACES_LITE_MODE.md"
    exit 1
fi
