#!/bin/bash

# Script para registrar agentes GitLab
# Uso: ./register-gitlab-agents.sh

set -e

echo "🤖 Registrando agentes GitLab..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    local message="$1"
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] ${message}${NC}"
    return 0
}

# Função para erro
error() {
    local message="$1"
    echo -e "${RED}❌ Erro: ${message}${NC}"
    return 0
}

# Função para sucesso
success() {
    local message="$1"
    echo -e "${GREEN}✅ ${message}${NC}"
    return 0
}

# Função para aviso
warning() {
    local message="$1"
    echo -e "${YELLOW}⚠️  ${message}${NC}"
    return 0
}

# Verificar se estamos em um repositório Git
log "Verificando repositório Git..."
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Este script deve ser executado dentro de um repositório Git"
    exit 1
fi

# Verificar se o GitLab CLI está instalado
log "Verificando GitLab CLI..."
if ! command -v glab &> /dev/null; then
    warning "GitLab CLI (glab) não encontrado. Tentando instalar..."

    # Tentar instalar via curl
    if curl -s https://gitlab.com/cli/cli/-/raw/main/scripts/install.sh | bash; then
        success "GitLab CLI instalado com sucesso"
    else
        error "Falha ao instalar GitLab CLI automaticamente"
        echo ""
        echo "Instale manualmente:"
        echo "1. curl -LO https://gitlab.com/cli/cli/-/releases/latest/downloads/glab_1.45.0_Linux_x86_64.tar.gz"
        echo "2. tar -xzf glab_1.45.0_Linux_x86_64.tar.gz"
        echo "3. sudo mv glab /usr/local/bin/"
        exit 1
    fi
fi

# Verificar versão do GitLab CLI
log "Verificando versão do GitLab CLI..."
glab --version

# Verificar se estamos logados no GitLab
log "Verificando autenticação no GitLab..."
if ! glab auth status > /dev/null 2>&1; then
    warning "Não está logado no GitLab CLI"
    echo ""
    echo "Execute um dos comandos abaixo:"
    echo "1. glab auth login (login interativo)"
    echo "2. glab auth login --token YOUR_TOKEN (usando token)"
    echo ""
    read -p "Deseja continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar se os arquivos de configuração existem
log "Verificando arquivos de configuração..."
config_files=(
    ".gitlab/agents/agente-desenvolvimento/config.toml"
    ".gitlab/agents/agente-qa/config.toml"
    ".gitlab/agents/agente-producao/config.toml"
)

for config_file in "${config_files[@]}"; do
    if [[ ! -f "$config_file" ]]; then
        error "Arquivo de configuração não encontrado: $config_file"
        exit 1
    fi
done
success "Todos os arquivos de configuração encontrados"

# Função para registrar um agente
register_agent() {
    local agent_name=$1
    local config_file=$2
    local tags=$3

    log "Registrando agente: $agent_name"

    # Verificar se o agente já existe
    if glab ci runners list | grep -q "$agent_name"; then
        warning "Agente $agent_name já existe. Pulando..."
        return 0
    fi

    # Registrar o agente usando GitLab CLI
    if glab ci runners register \
        --name "$agent_name" \
        --config-file "$config_file" \
        --tag-list "$tags" \
        --run-untagged "false" \
        --locked "true"; then
        success "Agente $agent_name registrado com sucesso"
        return 0
    else
        error "Falha ao registrar agente $agent_name"
        return 1
    fi
}

# Registrar agentes na ordem correta
echo ""
log "📋 Registrando agentes..."

# Agente de Desenvolvimento (mais permissivo)
if register_agent "assistente-juridico-dev" ".gitlab/agents/agente-desenvolvimento/config.toml" "docker,linux,dev"; then
    success "Agente de desenvolvimento registrado"
else
    error "Falha no registro do agente de desenvolvimento"
    exit 1
fi

# Agente de QA
if register_agent "assistente-juridico-qa" ".gitlab/agents/agente-qa/config.toml" "docker,linux,qa"; then
    success "Agente de QA registrado"
else
    error "Falha no registro do agente de QA"
    exit 1
fi

# Agente de Produção (mais restritivo)
if register_agent "assistente-juridico-prod" ".gitlab/agents/agente-producao/config.toml" "docker,linux,prod"; then
    success "Agente de produção registrado"
else
    error "Falha no registro do agente de produção"
    exit 1
fi

echo ""
success "🎉 Todos os agentes GitLab foram registrados com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure os tokens dos agentes nas variáveis de ambiente do GitLab:"
echo "   - AGENTE_DESENVOLVIMENTO_TOKEN"
echo "   - AGENTE_QA_TOKEN"
echo "   - AGENTE_PRODUCAO_TOKEN"
echo ""
echo "2. Verifique o status dos agentes:"
echo "   glab ci runners list"
echo ""
echo "3. Execute um pipeline para testar:"
echo "   git push origin main"
echo ""
echo "4. Monitore os logs dos agentes:"
echo "   glab ci runners status"