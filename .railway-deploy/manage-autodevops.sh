#!/bin/bash

# Script para gerenciar Auto DevOps no GitLab CI/CD
# Facilita ativação/desativação sem conflitos

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos no diretório correto
check_project_root() {
    if [ ! -f ".gitlab-ci.yml" ] || [ ! -f "package.json" ]; then
        print_error "Este script deve ser executado na raiz do projeto assistente-juridico-p"
        exit 1
    fi
}

# Verificar status atual do Auto DevOps
check_autodevops_status() {
    if grep -q "^  - local: '.gitlab-ci-auto-devops.yml'" .gitlab-ci.yml; then
        echo "enabled"
    elif grep -q "^# - local: '.gitlab-ci-auto-devops.yml'" .gitlab-ci.yml; then
        echo "disabled"
    else
        echo "unknown"
    fi
}

# Ativar Auto DevOps
enable_autodevops() {
    print_message "Ativando GitLab Auto DevOps..."

    # Verificar se o arquivo existe
    if [ ! -f ".gitlab-ci-auto-devops.yml" ]; then
        print_error "Arquivo .gitlab-ci-auto-devops.yml não encontrado!"
        print_message "Execute este script do repositório para recriar o arquivo."
        exit 1
    fi

    # Habilitar no .gitlab-ci.yml - corrigir indentação
    sed -i 's|  # - local: '\''.gitlab-ci-auto-devops.yml'\''|  - local: '\''.gitlab-ci-auto-devops.yml'\''|' .gitlab-ci.yml

    print_success "Auto DevOps ativado!"
    print_warning "Configure as variáveis necessárias no GitLab CI/CD Settings:"
    echo "  - KUBE_INGRESS_BASE_DOMAIN"
    echo "  - VERCEL_TOKEN (se usar Vercel)"
    print_message "Consulte .gitlab/AUTO_DEVOPS_README.md para instruções completas"
}

# Desativar Auto DevOps
disable_autodevops() {
    print_message "Desativando GitLab Auto DevOps..."

    # Desabilitar no .gitlab-ci.yml
    sed -i 's|  - local: '\''.gitlab-ci-auto-devops.yml'\''|  # - local: '\''.gitlab-ci-auto-devops.yml'\''|' .gitlab-ci.yml

    print_success "Auto DevOps desativado!"
    print_message "O pipeline agora usa apenas a configuração básica (security, test, build)"
}

# Mostrar status
show_status() {
    local status=$(check_autodevops_status)

    echo "=== STATUS DO GITLAB AUTO DEVOPS ==="
    echo ""
    if [ "$status" = "enabled" ]; then
        print_success "Auto DevOps: ATIVADO"
        echo ""
        print_message "Stages disponíveis:"
        echo "  ✅ security, test, build (básicos)"
        echo "  ✅ deploy, review, staging, production (Auto DevOps)"
        echo "  ✅ canary, incremental rollout, performance (Auto DevOps)"
    else
        print_warning "Auto DevOps: DESATIVADO"
        echo ""
        print_message "Stages disponíveis:"
        echo "  ✅ security, test, build (básicos apenas)"
    fi
    echo ""
    print_message "Para alterar o status:"
    echo "  $0 enable   - Ativar Auto DevOps"
    echo "  $0 disable  - Desativar Auto DevOps"
}

# Mostrar ajuda
show_help() {
    echo "=== GERENCIADOR DE GITLAB AUTO DEVOPS ==="
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos:"
    echo "  status   - Mostrar status atual do Auto DevOps"
    echo "  enable   - Ativar Auto DevOps"
    echo "  disable  - Desativar Auto DevOps"
    echo "  help     - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 status"
    echo "  $0 enable"
    echo "  $0 disable"
    echo ""
    echo "Documentação: .gitlab/AUTO_DEVOPS_README.md"
}

# Função principal
main() {
    check_project_root

    case "${1:-status}" in
        "status")
            show_status
            ;;
        "enable")
            if [ "$(check_autodevops_status)" = "enabled" ]; then
                print_warning "Auto DevOps já está ativado!"
                exit 0
            fi
            enable_autodevops
            ;;
        "disable")
            if [ "$(check_autodevops_status)" = "disabled" ]; then
                print_warning "Auto DevOps já está desativado!"
                exit 0
            fi
            disable_autodevops
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Comando desconhecido: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"