#!/bin/bash

################################################################################
#                                                                              #
#         🔄 AUTO TEST MONITOR - Monitoramento Contínuo de Testes             #
#                                                                              #
#  Monitora continuamente a aplicação, executa testes periodicamente e        #
#  aplica correções automaticamente quando detecta problemas                   #
#                                                                              #
################################################################################

set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Configurações
WATCH_INTERVAL=300  # 5 minutos entre execuções
MAX_FAILURES=5      # Máximo de falhas consecutivas antes de alertar
FAILURES_COUNT=0
RUN_COUNT=0

# Criar diretório de logs
mkdir -p ./test-logs

print_header() {
    clear
    echo -e "${BOLD}${CYAN}"
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║          🔄 AUTO TEST MONITOR - Monitoramento Contínuo                   ║
║                                                                          ║
║  Execução automática a cada 5 minutos                                   ║
║  Correções automáticas quando detecta problemas                         ║
║  Pressione Ctrl+C para parar                                            ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

show_status() {
    echo ""
    echo -e "${BOLD}📊 STATUS ATUAL:${NC}"
    echo -e "   • Execuções: ${RUN_COUNT}"
    echo -e "   • Falhas consecutivas: ${FAILURES_COUNT}/${MAX_FAILURES}"
    echo -e "   • Próxima execução: $(date -d "+${WATCH_INTERVAL} seconds" +'%H:%M:%S')"
    echo ""
}

run_tests() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}Execução #${RUN_COUNT} - $(date +'%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Executar script de teste automático
    if ./auto-test-fix.sh > "./test-logs/monitor-${timestamp}.log" 2>&1; then
        echo -e "${GREEN}✅ Testes passaram!${NC}"
        FAILURES_COUNT=0
        return 0
    else
        echo -e "${RED}❌ Testes falharam${NC}"
        ((FAILURES_COUNT++))
        
        if [ $FAILURES_COUNT -ge $MAX_FAILURES ]; then
            echo -e "${RED}${BOLD}⚠️  ALERTA: ${MAX_FAILURES} falhas consecutivas!${NC}"
            send_alert
        fi
        
        return 1
    fi
}

send_alert() {
    echo ""
    echo -e "${RED}${BOLD}╔══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}${BOLD}║                                                                          ║${NC}"
    echo -e "${RED}${BOLD}║                    ⚠️  ALERTA CRÍTICO ⚠️                                 ║${NC}"
    echo -e "${RED}${BOLD}║                                                                          ║${NC}"
    echo -e "${RED}${BOLD}║  ${MAX_FAILURES} falhas consecutivas detectadas!                                     ║${NC}"
    echo -e "${RED}${BOLD}║  Verifique os logs em ./test-logs/                                      ║${NC}"
    echo -e "${RED}${BOLD}║                                                                          ║${NC}"
    echo -e "${RED}${BOLD}╚══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Aqui você pode adicionar integração com:
    # - Email
    # - Slack
    # - Discord
    # - SMS
    # - etc.
}

cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Encerrando monitoramento...${NC}"
    echo -e "${GREEN}Total de execuções: ${RUN_COUNT}${NC}"
    echo -e "${GREEN}Logs salvos em: ./test-logs/${NC}"
    exit 0
}

main() {
    # Capturar Ctrl+C
    trap cleanup INT TERM
    
    # Tornar auto-test-fix.sh executável
    chmod +x ./auto-test-fix.sh
    
    print_header
    
    echo -e "${CYAN}🚀 Iniciando monitoramento contínuo...${NC}"
    echo -e "${CYAN}Intervalo: ${WATCH_INTERVAL} segundos ($(($WATCH_INTERVAL / 60)) minutos)${NC}"
    echo ""
    
    while true; do
        ((RUN_COUNT++))
        
        run_tests
        
        show_status
        
        echo -e "${YELLOW}⏳ Aguardando próxima execução...${NC}"
        sleep $WATCH_INTERVAL
    done
}

# Executar
main "$@"
