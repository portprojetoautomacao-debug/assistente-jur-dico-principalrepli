#!/bin/bash
# Script para configurar variáveis críticas do GitLab CI/CD
# Essenciais para funcionamento do app com DJEN e agentes IA

set -e

echo "🔧 Configurando variáveis críticas do GitLab CI/CD..."
echo ""

# Carregar token
if [[ -f .gitlab-token ]]; then
    source .gitlab-token
else
    echo "❌ Arquivo .gitlab-token não encontrado!"
    exit 1
fi

PROJECT_ID=76287668

# Função para criar variável
create_variable() {
    local key="$1"
    local value="$2"
    local protected="${3:-false}"
    local masked="${4:-false}"

    echo "📝 Configurando variável: $key"

    curl -s -X POST \
        --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
        --header "Content-Type: application/json" \
        --data "{\"key\": \"$key\", \"value\": \"$value\", \"protected\": $protected, \"masked\": $masked}" \
        "https://gitlab.com/api/v4/projects/$PROJECT_ID/variables" > /dev/null

    if [[ $? -eq 0 ]]; then
        echo "✅ $key configurada"
    else
        echo "❌ Falha ao configurar $key"
    fi
}

echo "🔑 Configurando variáveis essenciais..."
echo ""

# Variáveis críticas para funcionamento do app
# GITHUB_TOKEN deve ser configurado manualmente no GitLab CI/CD Settings
# Nunca hardcode tokens no código!
create_variable "GITHUB_TOKEN" "\${GITHUB_TOKEN:-configure_me}" true false
create_variable "GITLAB_TOKEN" "$GITLAB_TOKEN" true true
create_variable "KUBE_INGRESS_BASE_DOMAIN" "assistente-juridico-github.vercel.app" false false
create_variable "AUTO_DEVOPS_PLATFORM_TARGET" "kubernetes" false false
create_variable "AUTO_DEVOPS_DEPLOY_STRATEGY" "continuous" false false

# Variáveis para DJEN
create_variable "DJEN_API_KEY" "" false true  # Deixe vazio por enquanto
create_variable "DJEN_ENABLED" "true" false false

# Variáveis para agentes IA
create_variable "AGENTS_ENABLED" "true" false false
create_variable "SPARK_KV_ENABLED" "true" false false

# Variáveis de produção
create_variable "NODE_ENV" "production" false false
create_variable "VERCEL_ENV" "production" false false

echo ""
echo "🎯 Próximos passos manuais necessários:"
echo ""
echo "1️⃣  Configurar DJEN_API_KEY:"
echo "   • Vá para: https://gitlab.com/thiagobodevan-a11y-group/assistente-juridico-p/-/settings/ci_cd"
echo "   • Adicione a variável DJEN_API_KEY com sua chave da API DJEN"
echo ""
echo "2️⃣  Verificar GitLab Kubernetes Agents:"
echo "   • Vá para: Infrastructure > Kubernetes clusters"
echo "   • Verifique se os agents estão conectados"
echo ""
echo "3️⃣  Executar pipeline de teste:"
echo "   • Faça um commit para testar o pipeline atualizado"
echo ""
echo "⏰ Timeline: ~2-3 horas para configuração completa"
echo ""

# Verificar se variáveis foram criadas
echo "🔍 Verificando variáveis configuradas..."
sleep 2

VARIABLES=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "https://gitlab.com/api/v4/projects/$PROJECT_ID/variables")

COUNT=$(echo "$VARIABLES" | jq -r 'length')
echo "📊 Total de variáveis configuradas: $COUNT"

echo "$VARIABLES" | jq -r '.[] | "✅ \(.key)"' 2>/dev/null || echo "⚠️  Não foi possível listar variáveis"

echo ""
echo "✅ Configuração básica concluída!"
echo "🔄 Execute este script novamente após configurar DJEN_API_KEY manualmente"
