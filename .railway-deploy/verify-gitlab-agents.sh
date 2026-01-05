#!/bin/bash
# Verificar status dos GitLab Agents

set -e

echo "🔍 Verificando status dos GitLab Agents..."
echo "Limite do GitLab: 7 agentes por projeto"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função para verificar status
check_agent() {
    local agent_name=$1
    local config_file=".gitlab/agents/${agent_name}/config.yaml"

    echo -e "${BLUE}🔍 Verificando agente: ${agent_name}${NC}"

    if [[ -f "$config_file" ]]; then
        echo -e "  ${GREEN}✅ Configuração existe${NC}"

        # Verificar se tem ci_access
        if grep -q "ci_access:" "$config_file"; then
            echo -e "  ${GREEN}✅ CI/CD access configurado${NC}"
        else
            echo -e "  ${YELLOW}⚠️  CI/CD access não configurado${NC}"
        fi

        # Verificar se tem user_access
        if grep -q "user_access:" "$config_file"; then
            echo -e "  ${GREEN}✅ User access configurado${NC}"
        else
            echo -e "  ${YELLOW}⚠️  User access não configurado${NC}"
        fi

        # Verificar se tem gitops
        if grep -q "gitops:" "$config_file"; then
            echo -e "  ${GREEN}✅ GitOps configurado${NC}"
        else
            echo -e "  ${YELLOW}⚠️  GitOps não configurado${NC}"
        fi

        # Verificar se tem remote_development
        if grep -q "remote_development:" "$config_file"; then
            echo -e "  ${GREEN}✅ Remote Development habilitado${NC}"
        else
            echo -e "  ${YELLOW}⚠️  Remote Development não configurado${NC}"
        fi

    else
        echo -e "  ${RED}❌ Configuração não encontrada${NC}"
    fi

    echo ""
}

# Agentes existentes
echo "📊 AGENTES EXISTENTES (4/7):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_agent "assistente-juridico-agent"
check_agent "agente-cluster"
check_agent "agenterevisor"
check_agent "agenterevisor2"

# Agentes faltando
echo "📋 AGENTES PARA CRIAR (3 restantes):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${YELLOW}1. agente-desenvolvimento${NC}"
echo "   - Foco: Ambiente de desenvolvimento"
echo "   - Recursos: Desenvolvimento remoto, debug"
echo ""

echo -e "${YELLOW}2. agente-qa${NC}"
echo "   - Foco: Testes automatizados e QA"
echo "   - Recursos: Testes E2E, performance, segurança"
echo ""

echo -e "${YELLOW}3. agente-producao${NC}"
echo "   - Foco: Ambiente de produção"
echo "   - Recursos: Monitoramento, escalabilidade, backup"
echo ""

echo "🎯 PRÓXIMOS PASSOS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Criar estrutura de diretórios para novos agentes"
echo "2. Configurar config.yaml para cada agente"
echo "3. Registrar agentes no GitLab"
echo "4. Testar conectividade de cada agente"
echo "5. Configurar permissões específicas por ambiente"
echo ""

echo "💡 DICAS DE CONFIGURAÇÃO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "- Use namespaces diferentes por ambiente"
echo "- Configure RBAC específico por agente"
echo "- Habilite GitOps apenas onde necessário"
echo "- Monitore recursos e limits por agente"
echo "- Use secrets para credenciais sensíveis"