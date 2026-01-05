#!/bin/bash

# Script para debug de agentes GitLab Kubernetes
# Implementa configuração de logs conforme documentação

set -e

echo "🐛 Debug de Agentes GitLab Kubernetes"
echo "===================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Função para sucesso
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Função para erro
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Função para aviso
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Mostrar níveis de log disponíveis
show_log_levels() {
    echo "📊 NÍVEIS DE LOG DISPONÍVEIS:"
    echo "============================="
    echo "• error - Apenas erros críticos"
    echo "• warn  - Avisos e erros"
    echo "• info  - Informações gerais (padrão)"
    echo "• debug - Detalhes completos para troubleshooting"
    echo ""
    echo "🔧 DOIS LOGGERS:"
    echo "================="
    echo "• level:      Logger geral (padrão: info)"
    echo "• grpc_level: Logger gRPC (padrão: error)"
    echo ""
}

# Configurar debug para agente
configure_debug() {
    log "Configurando debug para agente..."

    echo "🤖 AGENTES DISPONÍVEIS:"
    for agent_dir in .gitlab/agents/*/; do
        if [[ -d "$agent_dir" ]]; then
            agent_name=$(basename "$agent_dir")
            config_file="$agent_dir/config.yaml"

            if [[ -f "$config_file" ]]; then
                echo "• $agent_name"
            fi
        fi
    done
    echo ""

    read -p "Digite o nome do agente: " agent_name

    if [[ -z "$agent_name" ]]; then
        warning "Nome do agente não fornecido"
        return
    fi

    config_file=".gitlab/agents/$agent_name/config.yaml"

    if [[ ! -f "$config_file" ]]; then
        error "Arquivo de configuração não encontrado: $config_file"
        return
    fi

    echo "📝 CONFIGURAÇÃO ATUAL:"
    echo "======================"

    if grep -q "observability:" "$config_file" 2>/dev/null; then
        grep -A 10 "observability:" "$config_file"
    else
        echo "Nenhuma configuração de observabilidade encontrada"
    fi

    echo ""
    echo "🔧 OPÇÕES DE DEBUG:"
    echo "==================="
    echo "1. Ativar debug completo (level: debug, grpc_level: warn)"
    echo "2. Ativar debug gRPC (grpc_level: debug)"
    echo "3. Desativar debug (level: info, grpc_level: error)"
    echo "4. Configuração personalizada"
    echo ""

    read -p "Escolha uma opção (1-4): " choice

    case $choice in
        1)
            set_debug_config "$config_file" "debug" "warn"
            ;;
        2)
            set_debug_config "$config_file" "info" "debug"
            ;;
        3)
            set_debug_config "$config_file" "info" "error"
            ;;
        4)
            configure_custom_debug "$config_file"
            ;;
        *)
            warning "Opção inválida"
            return
            ;;
    esac

    success "Configuração aplicada"
    echo ""
    echo "📋 PRÓXIMOS PASSOS:"
    echo "==================="
    echo "1. Faça commit das mudanças:"
    echo "   git add . && git commit -m 'Configure debug logging for $agent_name'"
    echo ""
    echo "2. Push para o repositório:"
    echo "   git push"
    echo ""
    echo "3. Aguarde o agente aplicar a configuração"
    echo ""
    echo "4. Verifique os logs:"
    echo "   kubectl logs -f -l=app=gitlab-agent -n gitlab-agent"
}

# Aplicar configuração de debug
set_debug_config() {
    local config_file=$1
    local level=$2
    local grpc_level=$3

    # Remover configuração existente se houver
    if grep -q "observability:" "$config_file" 2>/dev/null; then
        # Encontrar linhas da seção observability
        start_line=$(grep -n "observability:" "$config_file" | cut -d: -f1)
        if [[ -n "$start_line" ]]; then
            # Encontrar fim da seção (próxima seção no mesmo nível)
            end_line=$(tail -n +$((start_line + 1)) "$config_file" | grep -n -E "^[a-zA-Z]" | head -1 | cut -d: -f1)
            if [[ -n "$end_line" ]]; then
                end_line=$((start_line + end_line - 1))
            else
                end_line=$(wc -l < "$config_file")
            fi

            # Remover seção existente
            sed -i "${start_line},${end_line}d" "$config_file"
        fi
    fi

    # Adicionar nova configuração no final
    echo "" >> "$config_file"
    cat >> "$config_file" << EOF
observability:
  logging:
    level: $level
    grpc_level: $grpc_level
EOF
}

# Configuração personalizada
configure_custom_debug() {
    local config_file=$1

    echo "🔧 CONFIGURAÇÃO PERSONALIZADA:"
    echo "=============================="

    read -p "Nível geral (error/warn/info/debug): " level
    read -p "Nível gRPC (error/warn/info/debug): " grpc_level

    # Validar entradas
    valid_levels=("error" "warn" "info" "debug")
    if [[ ! " ${valid_levels[@]} " =~ " ${level} " ]]; then
        error "Nível geral inválido"
        return
    fi

    if [[ ! " ${valid_levels[@]} " =~ " ${grpc_level} " ]]; then
        error "Nível gRPC inválido"
        return
    fi

    set_debug_config "$config_file" "$level" "$grpc_level"
}

# Ver logs em tempo real
view_live_logs() {
    log "Visualizando logs em tempo real..."

    if ! kubectl get namespace gitlab-agent &>/dev/null; then
        error "Namespace gitlab-agent não existe"
        return
    fi

    pod_name=$(kubectl get pods -n gitlab-agent -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

    if [[ -z "$pod_name" ]]; then
        error "Nenhum pod do agente encontrado"
        return
    fi

    echo "📜 Logs do pod: $pod_name"
    echo "Pressione Ctrl+C para sair"
    echo "=========================="

    kubectl logs -f -n gitlab-agent "$pod_name"
}

# Verificar status de debug
check_debug_status() {
    log "Verificando status de debug..."

    for agent_dir in .gitlab/agents/*/; do
        if [[ -d "$agent_dir" ]]; then
            agent_name=$(basename "$agent_dir")
            config_file="$agent_dir/config.yaml"

            if [[ -f "$config_file" ]]; then
                echo ""
                echo "🤖 Agente: $agent_name"

                if grep -q "observability:" "$config_file" 2>/dev/null; then
                    echo "📊 Configuração de logging:"
                    grep -A 5 "logging:" "$config_file" | sed 's/^/  /'
                else
                    echo "  ⚪ Sem configuração de logging (padrão: info/error)"
                fi
            fi
        fi
    done
}

# Menu principal
show_menu() {
    echo "🐛 MENU DE DEBUG:"
    echo "================="
    echo ""
    echo "1. 📋 Mostrar níveis de log disponíveis"
    echo "2. ⚙️  Configurar debug para agente"
    echo "3. 📜 Ver logs em tempo real"
    echo "4. 📊 Verificar status de debug"
    echo "5. 🚪 Sair"
    echo ""
}

# Loop principal
while true; do
    show_menu
    read -p "Escolha uma opção (1-5): " choice

    case $choice in
        1) show_log_levels ;;
        2) configure_debug ;;
        3) view_live_logs ;;
        4) check_debug_status ;;
        5) success "Saindo..."; exit 0 ;;
        *) warning "Opção inválida. Tente novamente." ;;
    esac

    echo ""
    read -p "Pressione ENTER para continuar..."
    clear
done