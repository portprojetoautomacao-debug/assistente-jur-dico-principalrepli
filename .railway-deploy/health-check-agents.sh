#!/bin/bash

# Script para verificar saúde dos agentes GitLab Kubernetes
# Implementa verificações de status e troubleshooting

set -e

echo "🏥 Verificação de Saúde dos Agentes GitLab Kubernetes"
echo "===================================================="
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

# Verificar conectividade do cluster
check_cluster_connectivity() {
    log "Verificando conectividade do cluster..."

    if ! kubectl cluster-info &>/dev/null; then
        error "Cluster Kubernetes não acessível"
        return 1
    fi

    success "Cluster acessível"
    return 0
}

# Verificar pods do agente
check_agent_pods() {
    log "Verificando pods do agente..."

    # Verificar namespace gitlab-agent
    if kubectl get namespace gitlab-agent &>/dev/null; then
        success "Namespace gitlab-agent existe"

        # Verificar pods
        pod_count=$(kubectl get pods -n gitlab-agent --no-headers 2>/dev/null | wc -l)
        if [[ "$pod_count" -gt 0 ]]; then
            success "Pods do agente encontrados: $pod_count"

            echo "📊 Status dos pods:"
            kubectl get pods -n gitlab-agent --no-headers | while read -r line; do
                pod_name=$(echo "$line" | awk '{print $1}')
                status=$(echo "$line" | awk '{print $3}')
                case $status in
                    "Running") echo -e "  ${GREEN}🟢 $pod_name: $status${NC}" ;;
                    "Pending") echo -e "  ${YELLOW}🟡 $pod_name: $status${NC}" ;;
                    "Failed") echo -e "  ${RED}🔴 $pod_name: $status${NC}" ;;
                    *) echo -e "  ⚪ $pod_name: $status" ;;
                esac
            done
        else
            warning "Nenhum pod do agente encontrado"
        fi
    else
        warning "Namespace gitlab-agent não existe"
    fi
}

# Verificar configurações dos agentes
check_agent_configs() {
    log "Verificando configurações dos agentes..."

    issues_found=0

    for agent_dir in .gitlab/agents/*/; do
        if [[ -d "$agent_dir" ]]; then
            agent_name=$(basename "$agent_dir")
            config_file="$agent_dir/config.yaml"

            echo ""
            echo "🤖 Verificando agente: $agent_name"

            if [[ -f "$config_file" ]]; then
                success "Arquivo config.yaml encontrado"

                # Verificar ci_access
                if grep -q "ci_access:" "$config_file" 2>/dev/null; then
                    success "CI/CD access configurado"
                else
                    warning "CI/CD access não configurado"
                    ((issues_found++))
                fi

                # Verificar user_access
                if grep -q "user_access:" "$config_file" 2>/dev/null; then
                    success "User access configurado"
                else
                    warning "User access não configurado"
                    ((issues_found++))
                fi

                # Verificar observability
                if grep -q "observability:" "$config_file" 2>/dev/null; then
                    success "Configuração de observabilidade encontrada"
                fi

            else
                error "Arquivo config.yaml não encontrado"
                ((issues_found++))
            fi
        fi
    done

    echo ""
    if [[ "$issues_found" -eq 0 ]]; then
        success "Todas as configurações estão OK"
    else
        warning "Encontrados $issues_found problemas de configuração"
    fi
}

# Verificar RBAC
check_rbac() {
    log "Verificando configurações RBAC..."

    rbac_file="k8s/shared/rbac-security.yaml"

    if [[ -f "$rbac_file" ]]; then
        success "Arquivo RBAC encontrado"

        # Verificar se foi aplicado
        if kubectl get clusterrolebinding gitlab:user:impersonate &>/dev/null; then
            success "RBAC para user impersonation aplicado"
        else
            warning "RBAC para user impersonation não aplicado"
        fi

        if kubectl get clusterrolebinding gitlab:project:view &>/dev/null; then
            success "RBAC para project view aplicado"
        else
            warning "RBAC para project view não aplicado"
        fi

    else
        error "Arquivo RBAC não encontrado: $rbac_file"
    fi
}

# Verificar conectividade GitLab
check_gitlab_connectivity() {
    log "Verificando conectividade com GitLab..."

    if command -v glab &> /dev/null; then
        if glab auth status &>/dev/null; then
            success "GitLab CLI autenticado"

            # Tentar listar agentes
            if glab cluster agent list &>/dev/null; then
                agent_count=$(glab cluster agent list | grep -c "assistente-juridico\|agente-" || echo "0")
                success "Agentes encontrados no GitLab: $agent_count"
            else
                warning "Erro ao listar agentes no GitLab"
            fi
        else
            warning "GitLab CLI não autenticado"
        fi
    else
        warning "GitLab CLI não instalado"
    fi
}

# Verificar logs do agente
check_agent_logs() {
    log "Verificando logs recentes do agente..."

    if kubectl get pods -n gitlab-agent &>/dev/null; then
        pod_name=$(kubectl get pods -n gitlab-agent -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

        if [[ -n "$pod_name" ]]; then
            echo "📜 Últimas 20 linhas dos logs do pod: $pod_name"
            echo "=================================================="
            kubectl logs --tail=20 -n gitlab-agent "$pod_name" 2>/dev/null || warning "Erro ao obter logs"
            echo "=================================================="
        else
            warning "Nenhum pod encontrado para logs"
        fi
    else
        warning "Namespace gitlab-agent não acessível"
    fi
}

# Verificar recursos do cluster
check_cluster_resources() {
    log "Verificando recursos do cluster..."

    echo "📊 NODES:"
    kubectl get nodes --no-headers | while read -r line; do
        node_name=$(echo "$line" | awk '{print $1}')
        status=$(echo "$line" | awk '{print $2}')
        case $status in
            "Ready") echo -e "  ${GREEN}🟢 $node_name: $status${NC}" ;;
            *) echo -e "  ${RED}🔴 $node_name: $status${NC}" ;;
        esac
    done

    echo ""
    echo "📦 NAMESPACES COM RECURSOS:"
    namespaces=("gitlab-agent" "desenvolvimento" "qa" "production")
    for ns in "${namespaces[@]}"; do
        if kubectl get namespace "$ns" &>/dev/null; then
            pod_count=$(kubectl get pods -n "$ns" --no-headers 2>/dev/null | wc -l)
            echo "  📁 $ns: $pod_count pods"
        else
            echo -e "  ${YELLOW}📁 $ns: namespace não existe${NC}"
        fi
    done
}

# Função principal
main() {
    log "Iniciando verificação de saúde..."

    local checks_passed=0
    local total_checks=7

    # Executar verificações
    if check_cluster_connectivity; then ((checks_passed++)); fi
    if check_agent_pods; then ((checks_passed++)); fi
    check_agent_configs  # Esta função não retorna status
    if check_rbac; then ((checks_passed++)); fi
    if check_gitlab_connectivity; then ((checks_passed++)); fi
    check_agent_logs  # Esta função não retorna status
    check_cluster_resources  # Esta função não retorna status

    echo ""
    echo "📊 RESUMO DA VERIFICAÇÃO:"
    echo "========================="
    echo "✅ Verificações aprovadas: $checks_passed/$total_checks"
    echo ""

    if [[ "$checks_passed" -eq "$total_checks" ]]; then
        success "Sistema saudável!"
    elif [[ "$checks_passed" -ge 4 ]]; then
        warning "Sistema com alguns problemas menores"
    else
        error "Sistema com problemas críticos"
    fi

    echo ""
    echo "💡 RECOMENDAÇÕES:"
    echo "=================="

    if ! kubectl get namespace gitlab-agent &>/dev/null; then
        echo "• Instale o agente Kubernetes no cluster"
    fi

    if ! kubectl get clusterrolebinding gitlab:user:impersonate &>/dev/null; then
        echo "• Aplique as configurações RBAC: kubectl apply -f k8s/shared/rbac-security.yaml"
    fi

    if ! glab auth status &>/dev/null; then
        echo "• Autentique no GitLab CLI: glab auth login"
    fi

    echo ""
    log "Verificação concluída"
}

# Executar verificação
main "$@"