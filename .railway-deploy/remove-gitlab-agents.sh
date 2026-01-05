#!/bin/bash

# Script para remoção de agentes GitLab Kubernetes
# Implementa processo completo de remoção conforme documentação

set -e

echo "🗑️  Remoção de Agentes GitLab Kubernetes"
echo "======================================="
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

# Verificar GitLab CLI
check_glab() {
    if ! command -v glab &> /dev/null; then
        error "GitLab CLI não encontrado"
        echo "Instale com: curl -s https://gitlab.com/cli/cli/-/raw/main/scripts/install.sh | bash"
        exit 1
    fi

    if ! glab auth status &> /dev/null; then
        error "Não autenticado no GitLab CLI"
        echo "Execute: glab auth login"
        exit 1
    fi
}

# Listar agentes para remoção
list_agents_for_removal() {
    log "Listando agentes disponíveis para remoção..."

    echo "🤖 AGENTES DISPONÍVEIS:"
    echo "======================="

    if glab cluster agent list 2>/dev/null; then
        glab cluster agent list | while read -r line; do
            if [[ $line == *"assistente-juridico"* ]] || [[ $line == *"agente-"* ]]; then
                agent_name=$(echo "$line" | awk '{print $1}')
                status=$(echo "$line" | awk '{print $2}')
                echo "• $agent_name (Status: $status)"
            fi
        done
    else
        error "Erro ao listar agentes"
    fi

    echo ""
    echo "📁 AGENTES LOCAIS (arquivos de configuração):"
    echo "=============================================="

    for agent_dir in .gitlab/agents/*/; do
        if [[ -d "$agent_dir" ]]; then
            agent_name=$(basename "$agent_dir")
            config_file="$agent_dir/config.yaml"

            if [[ -f "$config_file" ]]; then
                echo "• $agent_name (configurado)"
            else
                echo "• $agent_name (sem config)"
            fi
        fi
    done
}

# Remover agente via UI (orientação)
remove_agent_ui() {
    log "Orientação para remoção via GitLab UI..."

    echo "🗑️  REMOÇÃO VIA GITLAB UI:"
    echo "=========================="
    echo ""
    echo "1. 📱 Acesse o GitLab web:"
    echo "   https://gitlab.com/thiagobodevan-a11y-group/assistente-juridico-p"
    echo ""
    echo "2. 🧭 Navegue:"
    echo "   Operate > Kubernetes clusters"
    echo ""
    echo "3. 📋 Selecione a aba 'Agent'"
    echo ""
    echo "4. 🤖 Na tabela, localize o agente desejado"
    echo ""
    echo "5. 📍 Na coluna 'Options', clique nos 3 pontos (⋯)"
    echo ""
    echo "6. 🗑️  Selecione 'Delete agent'"
    echo ""
    echo "7. ⚠️  Confirme a remoção na caixa de diálogo"
    echo ""

    warning "⚠️  ATENÇÃO:"
    echo "• Esta operação remove o agente e todos os tokens associados do GitLab"
    echo "• Os recursos no cluster Kubernetes NÃO são removidos automaticamente"
    echo "• Você deve fazer a limpeza manual dos recursos no cluster"
}

# Remover agente via GraphQL (avançado)
remove_agent_graphql() {
    log "Remoção via GraphQL API..."

    warning "⚠️  MÉTODO AVANÇADO - USE COM CAUTELA"
    echo ""

    read -p "Digite o nome do agente para remover: " agent_name

    if [[ -z "$agent_name" ]]; then
        warning "Nome do agente não fornecido"
        return
    fi

    echo "🔍 Obtendo ID do agente..."

    # Query GraphQL para obter ID do agente
    query="query {
      project(fullPath: \"thiagobodevan-a11y/assistente-juridico-p\") {
        clusterAgent(name: \"$agent_name\") {
          id
          tokens {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    }"

    # Executar query (simplificado - em produção usaria curl ou glab)
    echo "📋 Query GraphQL:"
    echo "$query"
    echo ""

    warning "Para executar via GraphQL Explorer:"
    echo "1. Acesse: https://gitlab.com/-/graphql-explorer"
    echo "2. Execute a query acima"
    echo "3. Use o ID retornado na mutation de delete"
    echo ""

    echo "🗑️  Mutation para remover agente:"
    echo "mutation deleteAgent {
      clusterAgentDelete(input: { id: \"<cluster-agent-id>\" }) {
        errors
      }
    }"
    echo ""

    echo "🗑️  Mutation para remover tokens:"
    echo "mutation deleteToken {
      clusterAgentTokenDelete(input: { id: \"<cluster-agent-token-id>\" }) {
        errors
      }
    }"
}

# Limpar recursos do cluster
cleanup_cluster_resources() {
    log "Limpando recursos do cluster..."

    read -p "Digite o nome do agente removido: " agent_name

    if [[ -z "$agent_name" ]]; then
        warning "Nome do agente não fornecido"
        return
    fi

    warning "⚠️  CONFIRMAÇÃO DE LIMPEZA"
    echo "Esta operação irá remover recursos do cluster Kubernetes"
    echo "Agente removido: $agent_name"
    echo ""

    read -p "Tem certeza? Digite 'SIM' para confirmar: " confirm

    if [[ "$confirm" != "SIM" ]]; then
        warning "Operação cancelada"
        return
    fi

    # Verificar se cluster está acessível
    if ! kubectl cluster-info &>/dev/null; then
        error "Cluster Kubernetes não acessível"
        return
    fi

    echo "🧹 LIMPANDO RECURSOS..."
    echo ""

    # Remover recursos específicos do agente
    resources_file="k8s/agents/$agent_name/resources.yml"

    if [[ -f "$resources_file" ]]; then
        echo "📄 Removendo recursos do arquivo: $resources_file"
        kubectl delete -f "$resources_file" --ignore-not-found=true

        if [[ $? -eq 0 ]]; then
            success "Recursos do agente removidos do cluster"
        else
            error "Erro ao remover recursos do cluster"
        fi
    else
        warning "Arquivo de recursos não encontrado: $resources_file"
        echo ""
        echo "🔍 Procurando recursos relacionados..."

        # Procurar por recursos relacionados ao agente
        namespace="gitlab-agent"

        # Remover secrets relacionados
        secrets=$(kubectl get secrets -n "$namespace" --no-headers 2>/dev/null | grep "$agent_name" | awk '{print $1}')
        if [[ -n "$secrets" ]]; then
            echo "🔒 Removendo secrets relacionados:"
            echo "$secrets" | while read -r secret; do
                kubectl delete secret "$secret" -n "$namespace" --ignore-not-found=true
                echo "  🗑️  $secret"
            done
        fi

        # Remover configmaps relacionados
        configmaps=$(kubectl get configmaps -n "$namespace" --no-headers 2>/dev/null | grep "$agent_name" | awk '{print $1}')
        if [[ -n "$configmaps" ]]; then
            echo "📋 Removendo configmaps relacionados:"
            echo "$configmaps" | while read -r cm; do
                kubectl delete configmap "$cm" -n "$namespace" --ignore-not-found=true
                echo "  🗑️  $cm"
            done
        fi
    fi

    # Verificar se namespace gitlab-agent está vazio
    pod_count=$(kubectl get pods -n gitlab-agent --no-headers 2>/dev/null | wc -l)
    if [[ "$pod_count" -eq 0 ]]; then
        echo ""
        warning "Namespace gitlab-agent está vazio"
        read -p "Deseja remover o namespace também? (y/N): " remove_ns

        if [[ $remove_ns =~ ^[Yy]$ ]]; then
            kubectl delete namespace gitlab-agent --ignore-not-found=true
            success "Namespace gitlab-agent removido"
        fi
    fi

    success "Limpeza do cluster concluída"
}

# Remover arquivos locais
remove_local_files() {
    log "Removendo arquivos locais..."

    read -p "Digite o nome do agente: " agent_name

    if [[ -z "$agent_name" ]]; then
        warning "Nome do agente não fornecido"
        return
    fi

    agent_dir=".gitlab/agents/$agent_name"

    if [[ -d "$agent_dir" ]]; then
        echo "🗑️  Removendo diretório: $agent_dir"

        read -p "Confirmar remoção dos arquivos locais? (y/N): " confirm

        if [[ $confirm =~ ^[Yy]$ ]]; then
            rm -rf "$agent_dir"
            success "Arquivos locais removidos: $agent_dir"

            # Commit das mudanças
            echo ""
            read -p "Fazer commit da remoção? (y/N): " do_commit

            if [[ $do_commit =~ ^[Yy]$ ]]; then
                git add .
                git commit -m "Remove agent $agent_name configuration"
                success "Mudanças commitadas"
            fi
        else
            warning "Remoção cancelada"
        fi
    else
        warning "Diretório do agente não encontrado: $agent_dir"
    fi
}

# Verificar remoção
verify_removal() {
    log "Verificando remoção..."

    read -p "Digite o nome do agente removido: " agent_name

    if [[ -z "$agent_name" ]]; then
        warning "Nome do agente não fornecido"
        return
    fi

    echo "🔍 VERIFICAÇÕES:"
    echo ""

    # Verificar no GitLab
    if glab cluster agent list | grep -q "$agent_name" 2>/dev/null; then
        error "❌ Agente ainda existe no GitLab: $agent_name"
    else
        success "✅ Agente removido do GitLab: $agent_name"
    fi

    # Verificar arquivos locais
    agent_dir=".gitlab/agents/$agent_name"
    if [[ -d "$agent_dir" ]]; then
        error "❌ Arquivos locais ainda existem: $agent_dir"
    else
        success "✅ Arquivos locais removidos: $agent_dir"
    fi

    # Verificar cluster
    if kubectl cluster-info &>/dev/null; then
        namespace="gitlab-agent"

        # Verificar pods
        pod_count=$(kubectl get pods -n "$namespace" --no-headers 2>/dev/null | grep "$agent_name" | wc -l)
        if [[ "$pod_count" -eq 0 ]]; then
            success "✅ Pods do agente removidos do cluster"
        else
            error "❌ Ainda existem $pod_count pods do agente no cluster"
        fi

        # Verificar logs de unauthenticated
        echo ""
        echo "📜 Verificando logs do agente restante:"
        pods=$(kubectl get pods -n "$namespace" --no-headers 2>/dev/null | awk '{print $1}')
        if [[ -n "$pods" ]]; then
            for pod in $pods; do
                log_count=$(kubectl logs "$pod" -n "$namespace" 2>/dev/null | grep -c "unauthenticated" || echo "0")
                if [[ "$log_count" -gt 0 ]]; then
                    success "✅ Agente $pod desconectado (logs de unauthenticated encontrados)"
                fi
            done
        fi
    else
        warning "Cluster não acessível para verificação"
    fi
}

# Menu principal
show_menu() {
    echo "🗑️  MENU DE REMOÇÃO DE AGENTES:"
    echo "=============================="
    echo ""
    echo "1. 📋 Listar agentes disponíveis"
    echo "2. 🗑️  Remover agente via GitLab UI (recomendado)"
    echo "3. 🔧 Remover agente via GraphQL (avançado)"
    echo "4. 🧹 Limpar recursos do cluster"
    echo "5. 📁 Remover arquivos locais"
    echo "6. ✅ Verificar remoção completa"
    echo "7. 🚪 Sair"
    echo ""
}

# Loop principal
check_glab

while true; do
    show_menu
    read -p "Escolha uma opção (1-7): " choice

    case $choice in
        1) list_agents_for_removal ;;
        2) remove_agent_ui ;;
        3) remove_agent_graphql ;;
        4) cleanup_cluster_resources ;;
        5) remove_local_files ;;
        6) verify_removal ;;
        7) success "Saindo..."; exit 0 ;;
        *) warning "Opção inválida. Tente novamente." ;;
    esac

    echo ""
    read -p "Pressione ENTER para continuar..."
    clear
done