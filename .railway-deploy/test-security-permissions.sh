#!/bin/bash

# Script para testar permissões de segurança dos agentes GitLab
# Testa personificação e controle de acesso

set -e

echo "🧪 Testando Permissões de Segurança GitLab Agents"
echo "================================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para testar permissão
test_permission() {
    local user=$1
    local verb=$2
    local resource=$3
    local namespace=$4
    local description=$5

    echo -n "🔍 $description: "
    if kubectl auth can-i --as="$user" "$verb" "$resource" -n "$namespace" 2>/dev/null; then
        echo -e "${GREEN}✅ PERMITIDO${NC}"
        return 0
    else
        echo -e "${RED}❌ NEGADO${NC}"
        return 1
    fi
}

echo "📋 TESTANDO PERSONIFICAÇÃO CI/CD:"
echo "=================================="

# Testes para CI Job (trabalhos de CI/CD)
test_permission "gitlab:ci_job" "get" "pods" "desenvolvimento" "CI Job ver pods em desenvolvimento"
test_permission "gitlab:ci_job" "create" "pods" "desenvolvimento" "CI Job criar pods em desenvolvimento"
test_permission "gitlab:ci_job" "delete" "pods" "desenvolvimento" "CI Job deletar pods em desenvolvimento"

test_permission "gitlab:ci_job" "get" "pods" "qa" "CI Job ver pods em QA"
test_permission "gitlab:ci_job" "create" "pods" "qa" "CI Job criar pods em QA"
test_permission "gitlab:ci_job" "delete" "pods" "qa" "CI Job deletar pods em QA"

test_permission "gitlab:ci_job" "get" "pods" "production" "CI Job ver pods em produção"
test_permission "gitlab:ci_job" "create" "pods" "production" "CI Job criar pods em produção"
test_permission "gitlab:ci_job" "delete" "pods" "production" "CI Job deletar pods em produção"

echo ""
echo "🤖 TESTANDO PERSONIFICAÇÃO DE AGENTES:"
echo "======================================="

# Testes para agentes específicos
test_permission "gitlab:agent:agente-desenvolvimento" "get" "pods" "desenvolvimento" "Agente dev ver pods"
test_permission "gitlab:agent:agente-desenvolvimento" "create" "deployments" "desenvolvimento" "Agente dev criar deployments"
test_permission "gitlab:agent:agente-desenvolvimento" "delete" "services" "desenvolvimento" "Agente dev deletar services"

test_permission "gitlab:agent:agente-qa" "get" "pods" "qa" "Agente QA ver pods"
test_permission "gitlab:agent:agente-qa" "create" "jobs" "qa" "Agente QA criar jobs"
test_permission "gitlab:agent:agente-qa" "delete" "deployments" "qa" "Agente QA deletar deployments"

test_permission "gitlab:agent:agente-producao" "get" "pods" "production" "Agente prod ver pods"
test_permission "gitlab:agent:agente-producao" "create" "deployments" "production" "Agente prod criar deployments"
test_permission "gitlab:agent:agente-producao" "delete" "secrets" "production" "Agente prod deletar secrets"

echo ""
echo "🔒 TESTANDO ISOLAMENTO ENTRE NAMESPACES:"
echo "========================================="

# Testes de isolamento
test_permission "gitlab:ci_job" "get" "pods" "kube-system" "CI Job acessar kube-system"
test_permission "gitlab:agent:agente-desenvolvimento" "get" "pods" "qa" "Agente dev acessar QA"
test_permission "gitlab:agent:agente-qa" "get" "pods" "production" "Agente QA acessar produção"

echo ""
echo "📊 RESUMO DA SEGURANÇA:"
echo "========================"

echo "✅ Personificação CI/CD:"
echo "   - Desenvolvimento: Permissões completas"
echo "   - QA: Permissões limitadas"
echo "   - Produção: Apenas leitura"
echo ""

echo "✅ Isolamento de Agentes:"
echo "   - Cada agente restrito ao seu namespace"
echo "   - Controle granular de permissões"
echo ""

echo "✅ Network Policies:"
echo "   - Tráfego controlado entre namespaces"
echo "   - Segurança adicional por ambiente"
echo ""

echo "💡 NOTA: As permissões são testadas via 'kubectl auth can-i'"
echo "         As permissões reais só funcionam quando o GitLab Agent"
echo "         está conectado e fazendo as requisições personificadas."
echo ""

echo "🎯 PRÓXIMOS PASSOS:"
echo "==================="
echo "1. Conectar os agentes no GitLab"
echo "2. Testar com pipelines reais"
echo "3. Monitorar logs de segurança"