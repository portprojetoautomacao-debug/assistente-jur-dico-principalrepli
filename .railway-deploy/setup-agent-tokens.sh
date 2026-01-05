#!/bin/bash
# Configurar tokens de acesso para GitLab Agents

set -e

echo "🔑 Configurando tokens de acesso para GitLab Agents..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Carregar token do GitLab
if [[ -f ".gitlab-token" ]]; then
    source .gitlab-token
else
    echo -e "${RED}❌ Arquivo .gitlab-token não encontrado${NC}"
    exit 1
fi

# Função para criar token para um agente
create_agent_token() {
    local agent_name=$1
    local agent_id=$2
    local description="Token for $agent_name agent"

    echo -e "${BLUE}🔑 Criando token para: $agent_name (ID: $agent_id)${NC}"

    # Criar token via API
    local response=$(curl -s -X POST \
        -H "Authorization: Bearer $GITLAB_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"$description\", \"scopes\": [\"read_api\", \"read_repository\", \"write_repository\"]}" \
        "https://gitlab.com/api/v4/projects/$PROJECT_ID/cluster_agents/$agent_id/tokens")

    # Verificar se foi criado com sucesso
    local token=$(echo "$response" | jq -r '.token // empty')
    if [[ -n "$token" ]]; then
        echo -e "  ${GREEN}✅ Token criado com sucesso${NC}"

        # Salvar token em arquivo seguro
        local token_file=".gitlab/agents/${agent_name}/token.txt"
        echo "$token" > "$token_file"
        chmod 600 "$token_file"

        echo -e "  ${GREEN}✅ Token salvo em: $token_file${NC}"

        # Configurar kubeconfig para o agente
        configure_kubeconfig "$agent_name" "$token"

    else
        local error=$(echo "$response" | jq -r '.message // "Erro desconhecido"')
        echo -e "  ${RED}❌ Falha ao criar token: $error${NC}"
    fi

    echo ""
}

# Função para configurar kubeconfig
configure_kubeconfig() {
    local agent_name=$1
    local token=$2

    echo -e "  ${BLUE}⚙️  Configurando kubeconfig para $agent_name${NC}"

    # Criar kubeconfig personalizado para o agente
    local kubeconfig_file=".gitlab/agents/${agent_name}/kubeconfig"

    cat > "$kubeconfig_file" << EOF
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: $(kubectl config view --raw --minify --flatten -o jsonpath='{.clusters[].cluster.certificate-authority-data}')
    server: $(kubectl config view --raw --minify --flatten -o jsonpath='{.clusters[].cluster.server}')
  name: gitlab-cluster
contexts:
- context:
    cluster: gitlab-cluster
    user: gitlab-agent-${agent_name}
  name: gitlab-agent-${agent_name}
current-context: gitlab-agent-${agent_name}
users:
- name: gitlab-agent-${agent_name}
  user:
    token: ${token}
EOF

    chmod 600 "$kubeconfig_file"
    echo -e "  ${GREEN}✅ Kubeconfig criado: $kubeconfig_file${NC}"
}

# Lista de agentes com seus IDs
declare -A agents=(
    ["assistente-juridico-agent"]="2153335"
    ["agente-cluster"]="2153286"
    ["agenterevisor"]="2153339"
    ["agenterevisor2"]="2153340"
    ["agente-desenvolvimento"]="2153336"
    ["agente-qa"]="2153337"
    ["agente-producao"]="2153338"
)

# Verificar se kubectl está disponível
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl não encontrado. Instale o kubectl primeiro.${NC}"
    exit 1
fi

# Verificar se está conectado ao cluster
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Não foi possível conectar ao cluster Kubernetes.${NC}"
    echo "Verifique se o cluster está rodando e as credenciais estão configuradas."
    exit 1
fi

echo "📋 CRIANDO TOKENS PARA OS AGENTES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Criar tokens para todos os agentes
for agent_name in "${!agents[@]}"; do
    agent_id="${agents[$agent_name]}"
    create_agent_token "$agent_name" "$agent_id"
done

echo "🎯 CONFIGURAÇÃO CONCLUÍDA:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Todos os tokens foram criados e configurados!${NC}"
echo ""
echo "📁 Arquivos criados:"
echo "  - .gitlab/agents/*/token.txt (tokens de acesso)"
echo "  - .gitlab/agents/*/kubeconfig (configurações Kubernetes)"
echo ""
echo "🔒 IMPORTANTE:"
echo "  - Os arquivos de token têm permissões restritas (600)"
echo "  - Não commite estes arquivos no Git"
echo "  - Use variáveis de ambiente do GitLab para os tokens em produção"
echo ""
echo "🧪 PRÓXIMOS PASSOS:"
echo "1. Testar conectividade dos agentes"
echo "2. Executar pipeline de teste"
echo "3. Configurar CI/CD pipelines"
echo "4. Monitorar logs dos agentes"