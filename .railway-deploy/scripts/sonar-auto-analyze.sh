#!/usr/bin/env bash
# ============================================================================
# 🔍 SONAR AUTO ANALYZER
# ============================================================================
# Script de análise automática que integra SonarLint + SonarCloud
# Roda periodicamente para detectar e reportar issues de qualidade
#
# Uso: ./scripts/sonar-auto-analyze.sh [--fix] [--watch] [--full]
#   --fix    Tenta corrigir issues automaticamente via ESLint
#   --watch  Modo contínuo (roda a cada 5 minutos)
#   --full   Análise completa de todo o projeto
# ============================================================================

set -euo pipefail

# Carregar biblioteca comum se existir
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "${SCRIPT_DIR}/lib/common.sh" ]]; then
    # shellcheck source=lib/common.sh
    source "${SCRIPT_DIR}/lib/common.sh"
fi

# Cores
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# Configurações
readonly PROJECT_ROOT="${SCRIPT_DIR}/.."
readonly SONAR_TOKEN="${SONAR_TOKEN:-}"
readonly SONAR_PROJECT="portprojetoautomacao-debug_assistente-jur-dico-principalrepli"
readonly SONAR_ORG="portprojetoautomacao-debug"
readonly RESULTS_DIR="${PROJECT_ROOT}/.sonar-results"
readonly LOG_FILE="${RESULTS_DIR}/analysis.log"

# Flags
FIX_MODE=false
WATCH_MODE=false
FULL_MODE=false

# ============================================================================
# FUNÇÕES UTILITÁRIAS
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $*" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" | tee -a "$LOG_FILE"
}

log_header() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$LOG_FILE"
    echo -e "${CYAN}  $*${NC}" | tee -a "$LOG_FILE"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$LOG_FILE"
}

# ============================================================================
# SETUP
# ============================================================================

setup() {
    mkdir -p "$RESULTS_DIR"
    
    # Iniciar log
    echo "===== Análise iniciada em $(date '+%Y-%m-%d %H:%M:%S') =====" >> "$LOG_FILE"
    
    cd "$PROJECT_ROOT"
}

# ============================================================================
# ANÁLISE LOCAL (ESLint + TypeScript)
# ============================================================================

run_local_analysis() {
    log_header "🔍 Análise Local (ESLint + TypeScript)"
    
    local errors=0
    local warnings=0
    
    # TypeScript check
    log_info "Executando type-check..."
    if npx tsc --noEmit --skipLibCheck 2>&1 | tee -a "$LOG_FILE"; then
        log_success "TypeScript: 0 erros"
    else
        log_error "TypeScript: erros encontrados"
        ((errors++)) || true
    fi
    
    # ESLint
    log_info "Executando ESLint..."
    local eslint_output
    eslint_output=$(npm run lint 2>&1) || true
    echo "$eslint_output" >> "$LOG_FILE"
    
    # Extrair contagem de erros e warnings
    local lint_summary
    lint_summary=$(echo "$eslint_output" | grep -E "✖.*problems" || echo "0 problems")
    
    if echo "$lint_summary" | grep -q "0 errors"; then
        log_success "ESLint: 0 erros"
    else
        local error_count
        error_count=$(echo "$lint_summary" | grep -oP '\d+(?= errors?)' || echo "0")
        log_error "ESLint: $error_count erros"
        errors=$((errors + error_count))
    fi
    
    local warning_count
    warning_count=$(echo "$lint_summary" | grep -oP '\d+(?= warnings?)' || echo "0")
    warnings=$((warnings + warning_count))
    log_info "ESLint: $warning_count warnings"
    
    # Salvar resumo
    {
        echo "timestamp: $(date -Iseconds)"
        echo "errors: $errors"
        echo "warnings: $warnings"
    } > "${RESULTS_DIR}/local-summary.txt"
    
    return $errors
}

# ============================================================================
# ANÁLISE SONARCLOUD (via API)
# ============================================================================

run_sonarcloud_analysis() {
    log_header "☁️ Análise SonarCloud (API)"
    
    if [[ -z "$SONAR_TOKEN" ]]; then
        log_warn "SONAR_TOKEN não configurado. Pulando análise remota."
        return 0
    fi
    
    log_info "Buscando issues do SonarCloud..."
    
    # Buscar issues OPEN ordenados por severidade
    local response
    response=$(curl -s -u "${SONAR_TOKEN}:" \
        "https://sonarcloud.io/api/issues/search?componentKeys=${SONAR_PROJECT}&statuses=OPEN&ps=50&s=SEVERITY&asc=false" \
        2>&1) || {
        log_error "Falha ao conectar com SonarCloud"
        return 1
    }
    
    # Verificar se resposta é válida
    if ! echo "$response" | jq -e '.issues' > /dev/null 2>&1; then
        log_error "Resposta inválida do SonarCloud"
        echo "$response" >> "$LOG_FILE"
        return 1
    fi
    
    # Extrair métricas
    local total_issues
    total_issues=$(echo "$response" | jq '.total // 0')
    
    local blocker_count critical_count major_count minor_count
    blocker_count=$(echo "$response" | jq '[.issues[] | select(.severity == "BLOCKER")] | length')
    critical_count=$(echo "$response" | jq '[.issues[] | select(.severity == "CRITICAL")] | length')
    major_count=$(echo "$response" | jq '[.issues[] | select(.severity == "MAJOR")] | length')
    minor_count=$(echo "$response" | jq '[.issues[] | select(.severity == "MINOR")] | length')
    
    log_info "Total de issues: $total_issues"
    [[ "$blocker_count" -gt 0 ]] && log_error "BLOCKER: $blocker_count"
    [[ "$critical_count" -gt 0 ]] && log_error "CRITICAL: $critical_count"
    [[ "$major_count" -gt 0 ]] && log_warn "MAJOR: $major_count"
    [[ "$minor_count" -gt 0 ]] && log_info "MINOR: $minor_count"
    
    # Salvar issues para processamento
    echo "$response" | jq '.issues' > "${RESULTS_DIR}/sonar-issues.json"
    
    # Gerar relatório legível
    log_info "Gerando relatório de issues..."
    echo "$response" | jq -r '.issues[] | "\(.severity) | \(.rule | split(":")[1]) | \(.component | split(":")[1]) | L\(.line // "?") | \(.message[0:60])..."' \
        > "${RESULTS_DIR}/sonar-issues.txt"
    
    # Salvar resumo
    {
        echo "timestamp: $(date -Iseconds)"
        echo "total: $total_issues"
        echo "blocker: $blocker_count"
        echo "critical: $critical_count"
        echo "major: $major_count"
        echo "minor: $minor_count"
    } > "${RESULTS_DIR}/sonar-summary.txt"
    
    log_success "Relatório salvo em ${RESULTS_DIR}/sonar-issues.txt"
}

# ============================================================================
# AUTO-FIX (ESLint --fix)
# ============================================================================

run_auto_fix() {
    log_header "🔧 Auto-Fix (ESLint)"
    
    log_info "Aplicando correções automáticas..."
    
    if npm run lint -- --fix 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Correções automáticas aplicadas"
    else
        log_warn "Algumas correções podem ter falhado"
    fi
    
    # Verificar se há mudanças
    if git diff --quiet; then
        log_info "Nenhuma mudança detectada"
    else
        local changed_files
        changed_files=$(git diff --name-only | wc -l)
        log_success "$changed_files arquivo(s) modificado(s)"
        
        # Listar arquivos modificados
        git diff --name-only | head -10 | while read -r file; do
            log_info "  📝 $file"
        done
    fi
}

# ============================================================================
# ANÁLISE COMPLETA
# ============================================================================

run_full_analysis() {
    log_header "🚀 Análise Completa do Projeto"
    
    # 1. Análise local
    run_local_analysis || true
    
    # 2. Análise SonarCloud
    run_sonarcloud_analysis || true
    
    # 3. Auto-fix se habilitado
    if [[ "$FIX_MODE" == "true" ]]; then
        run_auto_fix
    fi
    
    # 4. Testes unitários
    log_header "🧪 Testes Unitários"
    log_info "Executando testes..."
    if npm run test:run 2>&1 | tee -a "$LOG_FILE" | tail -5; then
        log_success "Testes passaram"
    else
        log_warn "Alguns testes falharam"
    fi
    
    # 5. Gerar relatório final
    generate_report
}

# ============================================================================
# RELATÓRIO FINAL
# ============================================================================

generate_report() {
    log_header "📊 Relatório Final"
    
    local report_file="${RESULTS_DIR}/report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# 📊 Relatório de Análise de Código

**Data:** $(date '+%Y-%m-%d %H:%M:%S')
**Projeto:** Assistente Jurídico PJe

## 🔍 Análise Local

$(cat "${RESULTS_DIR}/local-summary.txt" 2>/dev/null || echo "Não disponível")

## ☁️ SonarCloud

$(cat "${RESULTS_DIR}/sonar-summary.txt" 2>/dev/null || echo "Não disponível")

## 🔧 Issues Principais

\`\`\`
$(head -20 "${RESULTS_DIR}/sonar-issues.txt" 2>/dev/null || echo "Nenhum issue encontrado")
\`\`\`

## ✅ Ações Recomendadas

1. Corrigir issues BLOCKER/CRITICAL primeiro
2. Executar \`npm run lint -- --fix\` para correções automáticas
3. Revisar MAJOR issues manualmente
4. Manter cobertura de testes acima de 80%

---
*Gerado automaticamente por sonar-auto-analyze.sh*
EOF
    
    log_success "Relatório salvo em: $report_file"
    
    # Exibir resumo no terminal
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    RESUMO DA ANÁLISE                       ║${NC}"
    echo -e "${CYAN}╠════════════════════════════════════════════════════════════╣${NC}"
    
    if [[ -f "${RESULTS_DIR}/local-summary.txt" ]]; then
        local local_errors local_warnings
        local_errors=$(grep "errors:" "${RESULTS_DIR}/local-summary.txt" | cut -d: -f2 | tr -d ' ')
        local_warnings=$(grep "warnings:" "${RESULTS_DIR}/local-summary.txt" | cut -d: -f2 | tr -d ' ')
        echo -e "${CYAN}║${NC} TypeScript/ESLint: ${local_errors:-0} erros, ${local_warnings:-0} warnings"
    fi
    
    if [[ -f "${RESULTS_DIR}/sonar-summary.txt" ]]; then
        local sonar_total
        sonar_total=$(grep "total:" "${RESULTS_DIR}/sonar-summary.txt" | cut -d: -f2 | tr -d ' ')
        echo -e "${CYAN}║${NC} SonarCloud: ${sonar_total:-?} issues"
    fi
    
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
}

# ============================================================================
# MODO WATCH
# ============================================================================

run_watch_mode() {
    log_header "👁️ Modo Watch Ativado"
    log_info "Analisando a cada 5 minutos. Pressione Ctrl+C para parar."
    
    while true; do
        run_local_analysis || true
        
        if [[ "$FIX_MODE" == "true" ]]; then
            run_auto_fix
        fi
        
        log_info "Próxima análise em 5 minutos..."
        sleep 300
    done
}

# ============================================================================
# MAIN
# ============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --fix)
                FIX_MODE=true
                shift
                ;;
            --watch)
                WATCH_MODE=true
                shift
                ;;
            --full)
                FULL_MODE=true
                shift
                ;;
            -h|--help)
                echo "Uso: $0 [--fix] [--watch] [--full]"
                echo ""
                echo "Opções:"
                echo "  --fix    Aplicar correções automáticas (ESLint --fix)"
                echo "  --watch  Modo contínuo (análise a cada 5 minutos)"
                echo "  --full   Análise completa (local + SonarCloud + testes)"
                echo ""
                exit 0
                ;;
            *)
                log_error "Argumento desconhecido: $1"
                exit 1
                ;;
        esac
    done
}

main() {
    parse_args "$@"
    setup
    
    if [[ "$WATCH_MODE" == "true" ]]; then
        run_watch_mode
    elif [[ "$FULL_MODE" == "true" ]]; then
        run_full_analysis
    else
        run_local_analysis || true
        
        if [[ "$FIX_MODE" == "true" ]]; then
            run_auto_fix
        fi
    fi
    
    log_info "Análise concluída em $(date '+%H:%M:%S')"
}

main "$@"
