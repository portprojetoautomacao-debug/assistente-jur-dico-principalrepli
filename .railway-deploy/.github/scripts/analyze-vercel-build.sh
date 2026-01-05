#!/bin/bash

# ============================================================================
# Análise Automática de Build Vercel
# ============================================================================
# Este script analisa logs de build do Vercel e gera relatório técnico
#
# Uso:
#   ./analyze-vercel-build.sh <vercel-build-log.txt>
#   ou
#   vercel logs <deployment-id> | ./analyze-vercel-build.sh
#
# Autor: Sistema de CI/CD
# Data: 2025-12-01
# ============================================================================

set -euo pipefail

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de logging
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# ============================================================================
# Função: Extrair métricas do build
# ============================================================================
extract_metrics() {
    local log_file="$1"
    
    log_info "Extraindo métricas do build..."
    
    # Tempo total de build
    local build_start=$(grep -o "[0-9][0-9]:[0-9][0-9]:[0-9][0-9]\.[0-9]*" "$log_file" | head -1)
    local build_end=$(grep -o "[0-9][0-9]:[0-9][0-9]:[0-9][0-9]\.[0-9]*" "$log_file" | tail -1)
    
    # Número de pacotes
    local packages=$(grep -o "added [0-9]* packages" "$log_file" | grep -o "[0-9]*" || echo "N/A")
    
    # Vulnerabilidades
    local vulnerabilities=$(grep -o "found [0-9]* vulnerabilities" "$log_file" | grep -o "[0-9]*" || echo "0")
    
    # Módulos transformados
    local modules=$(grep -o "[0-9]* modules transformed" "$log_file" | grep -o "^[0-9]*" || echo "N/A")
    
    # Tempo de build Vite
    local vite_time=$(grep -o "built in [0-9.]*s" "$log_file" | grep -o "[0-9.]*" || echo "N/A")
    
    # Erros TypeScript
    local ts_errors=$(grep -c "error TS" "$log_file" || echo "0")
    
    # PWA cache
    local pwa_entries=$(grep -o "precache.*[0-9]* entries" "$log_file" | grep -o "[0-9]*" || echo "N/A")
    
    echo "==================================================================="
    echo "📊 MÉTRICAS DO BUILD"
    echo "==================================================================="
    echo ""
    echo "Build Start:          $build_start"
    echo "Build End:            $build_end"
    echo "Pacotes Instalados:   $packages"
    echo "Vulnerabilidades:     $vulnerabilities"
    echo "Módulos Transformados: $modules"
    echo "Tempo Vite Build:     ${vite_time}s"
    echo "Erros TypeScript:     $ts_errors"
    echo "PWA Cache Entries:    $pwa_entries"
    echo ""
    
    # Avaliação
    if [ "$vulnerabilities" -eq 0 ]; then
        log_success "Zero vulnerabilidades detectadas"
    else
        log_warning "$vulnerabilities vulnerabilidades encontradas"
    fi
    
    if [ "$ts_errors" -eq 0 ]; then
        log_success "Build sem erros TypeScript"
    else
        log_warning "$ts_errors erros TypeScript (podem não ser bloqueantes)"
    fi
}

# ============================================================================
# Função: Analisar bundles gerados
# ============================================================================
analyze_bundles() {
    local log_file="$1"
    
    log_info "Analisando bundles JavaScript..."
    
    echo ""
    echo "==================================================================="
    echo "📦 TOP 10 MAIORES BUNDLES"
    echo "==================================================================="
    echo ""
    
    # Extrair linha com arquivos .js e tamanhos
    grep -E "assets/.*\.js.*[0-9]+\.[0-9]+ kB" "$log_file" | \
        sed 's/.*assets\///' | \
        sed 's/\x1B\[[0-9;]*[JKmsu]//g' | \
        awk '{print $2, $1}' | \
        sort -rh | \
        head -10 | \
        nl
    
    echo ""
    
    # Tamanho total estimado
    local total_kb=$(grep -E "assets/.*\.js.*[0-9]+\.[0-9]+ kB" "$log_file" | \
        sed 's/\x1B\[[0-9;]*[JKmsu]//g' | \
        awk '{sum += $(NF-1)} END {print sum}')
    
    echo "Total estimado: ${total_kb} kB (~$(echo "scale=2; $total_kb/1024" | bc) MB)"
    
    if (( $(echo "$total_kb > 5000" | bc -l) )); then
        log_warning "Bundle total > 5 MB - considere code splitting"
    elif (( $(echo "$total_kb > 3000" | bc -l) )); then
        log_info "Bundle total entre 3-5 MB - aceitável"
    else
        log_success "Bundle total < 3 MB - excelente!"
    fi
}

# ============================================================================
# Função: Detectar erros e avisos
# ============================================================================
detect_issues() {
    local log_file="$1"
    
    log_info "Detectando erros e avisos..."
    
    echo ""
    echo "==================================================================="
    echo "🚨 ERROS E AVISOS"
    echo "==================================================================="
    echo ""
    
    # Erros TypeScript
    if grep -q "error TS" "$log_file"; then
        echo "❌ Erros TypeScript encontrados:"
        grep "error TS" "$log_file" | head -10
        echo ""
    else
        log_success "Nenhum erro TypeScript"
    fi
    
    # Warnings
    if grep -qi "warning" "$log_file"; then
        echo "⚠️  Warnings encontrados:"
        grep -i "warning" "$log_file" | grep -v "max-warnings" | head -5
        echo ""
    fi
    
    # Deprecated
    if grep -qi "deprecated" "$log_file"; then
        echo "⚠️  Dependências deprecated:"
        grep -i "deprecated" "$log_file" | head -5
        echo ""
    fi
}

# ============================================================================
# Função: Analisar otimizações
# ============================================================================
analyze_optimizations() {
    local log_file="$1"
    
    log_info "Analisando otimizações aplicadas..."
    
    echo ""
    echo "==================================================================="
    echo "⚡ OTIMIZAÇÕES"
    echo "==================================================================="
    echo ""
    
    # Phosphor Icons
    if grep -q "Phosphor Icons Optimizer" "$log_file"; then
        log_success "Phosphor Icons tree-shaking ativo"
        grep -A 3 "Phosphor Icons Optimizer" "$log_file"
        echo ""
    fi
    
    # PWA
    if grep -q "PWA v" "$log_file"; then
        log_success "PWA configurado"
        grep "PWA v" "$log_file"
        grep "precache" "$log_file" | head -1
        echo ""
    fi
    
    # Code splitting
    local chunks=$(grep -c "\.js.*kB" "$log_file" || echo "0")
    if [ "$chunks" -gt 50 ]; then
        log_success "Code splitting ativo ($chunks chunks)"
    elif [ "$chunks" -gt 20 ]; then
        log_info "Code splitting moderado ($chunks chunks)"
    else
        log_warning "Poucos chunks gerados ($chunks) - considere lazy loading"
    fi
}

# ============================================================================
# Função: Gerar score final
# ============================================================================
generate_score() {
    local log_file="$1"
    
    local score=10.0
    
    # Penalidades
    local vulnerabilities=$(grep -o "found [0-9]* vulnerabilities" "$log_file" | grep -o "[0-9]*" || echo "0")
    local ts_errors=$(grep -c "error TS" "$log_file" || echo "0")
    local warnings=$(grep -c "warning" "$log_file" || echo "0")
    
    score=$(echo "$score - ($vulnerabilities * 0.5)" | bc)
    score=$(echo "$score - ($ts_errors * 0.3)" | bc)
    score=$(echo "$score - ($warnings * 0.01)" | bc)
    
    # Limitar entre 0 e 10
    if (( $(echo "$score < 0" | bc -l) )); then
        score=0
    fi
    
    echo ""
    echo "==================================================================="
    echo "⭐ SCORE FINAL"
    echo "==================================================================="
    printf "Score: %.1f/10\n" "$score"
    
    if (( $(echo "$score >= 9" | bc -l) )); then
        log_success "Excelente! Build de alta qualidade"
    elif (( $(echo "$score >= 7" | bc -l) )); then
        log_info "Bom build, algumas melhorias possíveis"
    elif (( $(echo "$score >= 5" | bc -l) )); then
        log_warning "Build aceitável, requer otimizações"
    else
        log_error "Build com problemas significativos"
    fi
    
    echo ""
}

# ============================================================================
# Main
# ============================================================================
main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║        🔍 ANÁLISE AUTOMÁTICA DE BUILD VERCEL                     ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Verificar se recebeu arquivo ou stdin
    if [ $# -eq 0 ]; then
        # Ler de stdin
        local temp_file=$(mktemp)
        cat > "$temp_file"
        LOG_FILE="$temp_file"
    else
        LOG_FILE="$1"
        if [ ! -f "$LOG_FILE" ]; then
            log_error "Arquivo não encontrado: $LOG_FILE"
            exit 1
        fi
    fi
    
    # Executar análises
    extract_metrics "$LOG_FILE"
    analyze_bundles "$LOG_FILE"
    detect_issues "$LOG_FILE"
    analyze_optimizations "$LOG_FILE"
    generate_score "$LOG_FILE"
    
    # Limpar arquivo temporário se usado
    if [ $# -eq 0 ]; then
        rm -f "$temp_file"
    fi
    
    echo ""
    log_success "Análise concluída!"
    echo ""
}

# Executar
main "$@"
