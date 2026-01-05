#!/bin/bash

# Script para conectar agentes GitLab ao cluster Kubernetes
# Uso: ./connect-gitlab-agents.sh

set -e

echo "🔗 Conectando Agentes GitLab ao Cluster Kubernetes"
echo "=================================================="
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

# Verificar se kubectl está disponível
log "Verificando kubectl..."
if ! command -v kubectl &> /dev/null; then
    error "kubectl não encontrado. Instale o kubectl primeiro."
    exit 1
fi

# Verificar se estamos conectados ao cluster
log "Verificando conexão com o cluster..."
if ! kubectl cluster-info &> /dev/null; then
    error "Não foi possível conectar ao cluster Kubernetes"
    exit 1
fi

success "Conectado ao cluster Kubernetes"

# Agentes a conectar
agents=(
    "agente-desenvolvimento:desenvolvimento"
    "agente-qa:qa"
    "agente-producao:production"
)

echo ""
echo "📋 AGENTES PARA CONECTAR:"
echo "=========================="

for agent_info in "${agents[@]}"; do
    IFS=':' read -r agent_name namespace <<< "$agent_info"

    echo ""
    echo "🔧 Agente: $agent_name (namespace: $namespace)"
    echo "   Status no GitLab: Nunca conectei"
    echo ""
    echo "   📝 PASSOS PARA CONECTAR:"
    echo "   1. No GitLab, clique no agente '$agent_name'"
    echo "   2. Clique em 'Connect cluster'"
    echo "   3. Selecione 'Connect with agent'"
    echo "   4. Copie o comando kubectl fornecido"
    echo "   5. Execute o comando aqui no terminal"
    echo ""
    echo "   🔑 O comando será similar a:"
    echo "   kubectl apply -f 'https://gitlab.com/api/v4/projects/<PROJECT_ID>/clusters/agents/<AGENT_ID>/kubeconfig'"
    echo ""
    echo "   📁 Arquivos locais:"
    echo "   - Config: .gitlab/agents/$agent_name/config.yaml"
    echo "   - Token: .gitlab/agents/$agent_name/token.txt (será criado)"
    echo "   - Kubeconfig: .gitlab/agents/$agent_name/kubeconfig (será criado)"
    echo ""
    echo "   ⚠️  IMPORTANTE: Use o token correto para cada agente!"
    echo ""
    read -p "   Pressione ENTER quando tiver o comando kubectl para $agent_name..."
    echo ""
done

echo ""
success "Todos os agentes foram preparados para conexão!"
echo ""
echo "💡 PRÓXIMOS PASSOS APÓS CONEXÃO:"
echo "=================================="
echo ""
echo "1. Execute: ./scripts/test-gitlab-agents.sh"
echo "2. Verifique: ./verify-gitlab-agents.sh"
echo "3. Teste CI/CD: git push origin main"
echo ""
echo "4. Monitore logs:"
echo "   kubectl logs -n <namespace> -l app=gitlab-agent"
echo ""
echo "5. Configure variáveis no GitLab CI/CD se necessário"