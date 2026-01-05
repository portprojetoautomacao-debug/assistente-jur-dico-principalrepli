#!/bin/bash

# Script para guiar o registro manual dos agentes GitLab
# Uso: ./register-agents-manual.sh

set -e

echo "🤖 Guia de Registro Manual dos Agentes GitLab"
echo "============================================"
echo ""

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

# Função para erro
error() {
    local message="$1"
    echo -e "${RED}❌ ${message}${NC}"
    return 0
}

log "Verificando configurações dos agentes..."

# Verificar se os arquivos de configuração existem
agents=(
    "agente-desenvolvimento:Ambiente de desenvolvimento com debug e hot reload"
    "agente-qa:Ambiente de QA com testes automatizados e segurança"
    "agente-producao:Ambiente de produção com HA e backup"
)

for agent_info in "${agents[@]}"; do
    agent_name=$(echo $agent_info | cut -d: -f1)
    agent_desc=$(echo $agent_info | cut -d: -f2)

    config_file=".gitlab/agents/$agent_name/config.yaml"
    if [[ -f "$config_file" ]]; then
        success "Configuração encontrada: $agent_name ($agent_desc)"
    else
        error "Configuração não encontrada: $config_file"
        exit 1
    fi
done

echo ""
echo "📋 PASSOS PARA REGISTRO MANUAL:"
echo "================================="
echo ""
echo "1. Acesse o GitLab: https://gitlab.com/thiagobodevan-a11y-group/assistente-juridico-p"
echo ""
echo "2. Navegue para: Infrastructure → Kubernetes clusters → Agents"
echo ""
echo "3. Para cada agente, clique em 'Register an agent'"
echo ""
echo "4. Selecione o agente da lista e clique em 'Register'"
echo ""
echo "5. Copie o token gerado e configure como variável de ambiente:"
echo ""

for agent_info in "${agents[@]}"; do
    agent_name=$(echo $agent_info | cut -d: -f1)
    agent_desc=$(echo $agent_info | cut -d: -f2)

    echo "   🔧 $agent_name ($agent_desc)"
    echo "      Variável: ${agent_name^^}_TOKEN"
    echo "      Exemplo: export ${agent_name^^}_TOKEN='glpat-xxxxx'"
    echo ""
done

echo "6. Configure as variáveis no GitLab CI/CD:"
echo "   - Vá para Settings → CI/CD → Variables"
echo "   - Adicione cada variável acima como 'protected' e 'masked'"
echo ""

echo "7. Teste a conectividade:"
echo "   ./scripts/test-gitlab-agents.sh"
echo ""

echo "8. Verifique o status:"
echo "   ./verify-gitlab-agents.sh"
echo ""

warning "IMPORTANTE: Os agentes só funcionarão após o registro manual no GitLab"
warning "Cada agente precisa de seu próprio token único"

echo ""
success "Configurações dos agentes estão prontas para registro!"
echo ""
echo "💡 DICA: Use o script ./scripts/test-gitlab-agents.sh após registrar"
echo "         para verificar se tudo está funcionando corretamente."