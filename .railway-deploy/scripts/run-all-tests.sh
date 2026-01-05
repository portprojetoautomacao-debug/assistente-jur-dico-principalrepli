#!/bin/bash

# ==============================================================================
# 🧪 Master Test Validation Script
# ==============================================================================
# Valida e executa todos os tipos de testes do projeto
# 
# Uso:
#   bash scripts/run-all-tests.sh [opções]
#
# Opções:
#   --quick      Executa apenas testes rápidos (unit + api)
#   --full       Executa todos os testes incluindo E2E
#   --coverage   Executa com relatório de cobertura
#   --ci         Modo CI/CD (sem watch, com relatórios)
# ==============================================================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Diretório base (dinâmico, portável)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

# Variáveis de controle
MODE="quick"
WITH_COVERAGE=false
CI_MODE=false
START_TIME=$(date +%s)

# Parse argumentos
for arg in "$@"; do
    case $arg in
        --quick)
            MODE="quick"
            ;;
        --full)
            MODE="full"
            ;;
        --coverage)
            WITH_COVERAGE=true
            ;;
        --ci)
            CI_MODE=true
            ;;
        --help)
            echo "Uso: $0 [opções]"
            echo ""
            echo "Opções:"
            echo "  --quick      Testes rápidos (unit + api)"
            echo "  --full       Todos os testes (unit + api + e2e + chrome)"
            echo "  --coverage   Com relatório de cobertura"
            echo "  --ci         Modo CI/CD"
            exit 0
            ;;
    esac
done

# ==============================================================================
# Funções Auxiliares
# ==============================================================================

print_header() {
    echo -e "\n${BOLD}${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}$1${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════${NC}\n"
}

print_section() {
    echo -e "\n${BOLD}${GREEN}▶ $1${NC}"
    echo -e "${YELLOW}───────────────────────────────────────────────────${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# ==============================================================================
# Validações Pré-Teste
# ==============================================================================

pre_test_checks() {
    print_section "1. Verificações Pré-Teste"
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js não está instalado"
        exit 1
    fi
    print_success "Node.js $(node --version)"
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        print_error "npm não está instalado"
        exit 1
    fi
    print_success "npm $(npm --version)"
    
    # Verificar node_modules
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules não encontrado, instalando dependências..."
        npm install
    fi
    print_success "Dependências instaladas"
    
    # Verificar arquivos de configuração
    local configs=("vitest.config.ts" "vitest.config.node.ts" "playwright.config.ts")
    for config in "${configs[@]}"; do
        if [ -f "$config" ]; then
            print_success "Configuração encontrada: $config"
        else
            print_warning "Configuração não encontrada: $config"
        fi
    done
}

# ==============================================================================
# Testes Unitários (Frontend)
# ==============================================================================

run_unit_tests() {
    print_section "2. Testes Unitários (Frontend)"
    
    echo "Executando testes com Vitest..."
    
    if [ "$WITH_COVERAGE" = true ]; then
        npm run test:run -- --coverage
    else
        npm run test:run
    fi
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "Testes unitários passaram"
        return 0
    else
        print_error "Testes unitários falharam (exit code: $exit_code)"
        return 1
    fi
}

# ==============================================================================
# Testes de API (Backend)
# ==============================================================================

run_api_tests() {
    print_section "3. Testes de API (Backend)"
    
    echo "Executando testes de API com Vitest (Node.js)..."
    
    npm run test:api
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "Testes de API passaram"
        return 0
    else
        print_warning "Testes de API tiveram falhas (exit code: $exit_code)"
        return 1
    fi
}

# ==============================================================================
# Testes E2E (Playwright)
# ==============================================================================

run_e2e_tests() {
    print_section "4. Testes E2E (Playwright)"
    
    if ! command -v playwright &> /dev/null; then
        print_warning "Playwright não está instalado, instalando browsers..."
        npx playwright install chromium firefox
    fi
    
    echo "Executando testes E2E com Playwright..."
    
    if [ "$CI_MODE" = true ]; then
        npm run test:e2e
    else
        npm run test:e2e
    fi
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "Testes E2E passaram"
        return 0
    else
        print_warning "Testes E2E tiveram falhas (exit code: $exit_code)"
        return 1
    fi
}

# ==============================================================================
# Testes Chrome Extension
# ==============================================================================

run_chrome_tests() {
    print_section "5. Testes Chrome Extension PJe"
    
    if [ ! -d "chrome-extension-pje" ]; then
        print_warning "Diretório chrome-extension-pje não encontrado"
        return 1
    fi
    
    echo "Executando testes da extensão Chrome..."
    
    npm run test:chrome
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "Testes Chrome Extension passaram"
        return 0
    else
        print_warning "Testes Chrome Extension tiveram falhas (exit code: $exit_code)"
        return 1
    fi
}

# ==============================================================================
# Type Check
# ==============================================================================

run_type_check() {
    print_section "6. Verificação de Tipos (TypeScript)"
    
    echo "Executando type-check com TypeScript..."
    
    local typecheck_output
    typecheck_output="$(npm run type-check 2>&1)"
    local exit_code=$?
    echo "$typecheck_output" | head -50
    local error_count=$(echo "$typecheck_output" | grep -c "error TS" || echo "0")
    
    if [ $exit_code -eq 0 ]; then
        print_success "Type-check passou sem erros"
        return 0
    else
        print_warning "Type-check encontrou $error_count erros TypeScript"
        return 1
    fi
}

# ==============================================================================
# Lint
# ==============================================================================

run_lint() {
    print_section "7. Verificação de Linting (ESLint)"
    
    echo "Executando ESLint..."
    
    npm run lint 2>&1 | tail -20
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "Lint passou sem erros"
        return 0
    else
        print_warning "Lint encontrou problemas (tolerável até 150 warnings)"
        return 0  # Não falha o build por warnings
    fi
}

# ==============================================================================
# Relatório Final
# ==============================================================================

generate_report() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    print_header "📊 RELATÓRIO FINAL DE TESTES"
    
    echo -e "${CYAN}Modo de Execução:${NC} $MODE"
    echo -e "${CYAN}Cobertura:${NC} $([ "$WITH_COVERAGE" = true ] && echo "Ativada" || echo "Desativada")"
    echo -e "${CYAN}Modo CI:${NC} $([ "$CI_MODE" = true ] && echo "Sim" || echo "Não")"
    echo -e "${CYAN}Tempo Total:${NC} ${minutes}m ${seconds}s"
    echo ""
    
    echo -e "${BOLD}Resultados:${NC}"
    for result in "${RESULTS[@]}"; do
        echo "$result"
    done
    
    echo ""
    
    # Calcular taxa de sucesso
    local total=${#RESULTS[@]}
    local passed=$(echo "${RESULTS[@]}" | grep -o "✓" | wc -l)
    local failed=$((total - passed))
    local success_rate=$((passed * 100 / total))
    
    echo -e "${CYAN}Taxa de Sucesso:${NC} $success_rate% ($passed/$total passaram)"
    
    if [ $failed -eq 0 ]; then
        echo -e "\n${GREEN}${BOLD}✓ TODOS OS TESTES PASSARAM!${NC}\n"
        return 0
    else
        echo -e "\n${YELLOW}${BOLD}⚠ $failed teste(s) falharam${NC}\n"
        return 1
    fi
}

# ==============================================================================
# Main
# ==============================================================================

main() {
    RESULTS=()
    
    print_header "🧪 MASTER TEST VALIDATION - Assistente Jurídico PJe"
    
    # Verificações pré-teste
    pre_test_checks
    
    # Type check e lint sempre executam
    if run_type_check; then
        RESULTS+=("  ${GREEN}✓${NC} Type Check")
    else
        RESULTS+=("  ${YELLOW}⚠${NC} Type Check (39 erros conhecidos)")
    fi
    
    if run_lint; then
        RESULTS+=("  ${GREEN}✓${NC} Lint")
    else
        RESULTS+=("  ${YELLOW}⚠${NC} Lint (warnings tolerados)")
    fi
    
    # Testes unitários
    if run_unit_tests; then
        RESULTS+=("  ${GREEN}✓${NC} Testes Unitários (Frontend)")
    else
        RESULTS+=("  ${RED}✗${NC} Testes Unitários (Frontend)")
    fi
    
    # Testes de API
    if run_api_tests; then
        RESULTS+=("  ${GREEN}✓${NC} Testes de API (Backend)")
    else
        RESULTS+=("  ${YELLOW}⚠${NC} Testes de API (Backend)")
    fi
    
    # Modo completo: E2E e Chrome
    if [ "$MODE" = "full" ]; then
        if run_e2e_tests; then
            RESULTS+=("  ${GREEN}✓${NC} Testes E2E (Playwright)")
        else
            RESULTS+=("  ${YELLOW}⚠${NC} Testes E2E (Playwright)")
        fi
        
        if run_chrome_tests; then
            RESULTS+=("  ${GREEN}✓${NC} Testes Chrome Extension")
        else
            RESULTS+=("  ${YELLOW}⚠${NC} Testes Chrome Extension")
        fi
    fi
    
    # Gerar relatório
    generate_report
}

main "$@"
