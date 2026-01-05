#!/bin/bash
# Verificar configuração do GitLab Workflow

set -e

echo "🔍 Verificando configuração do GitLab Workflow..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar
check() {
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

# 1. Verificar arquivo de token
echo "1️⃣  Verificando arquivo .gitlab-token..."
if [[ -f .gitlab-token ]]; then
    source .gitlab-token
    check "Arquivo .gitlab-token existe"
    
    if [[ -n "$GITLAB_TOKEN" ]]; then
        check "Token está definido"
        echo "   Token: ${GITLAB_TOKEN:0:20}..."
    else
        echo -e "${RED}❌ Token não está definido${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo .gitlab-token não encontrado${NC}"
    exit 1
fi

echo ""

# 2. Verificar configuração do VS Code
echo "2️⃣  Verificando .vscode/settings.json..."
if [[ -f .vscode/settings.json ]]; then
    check "Arquivo settings.json existe"
    
    if grep -q "gitlab.instanceUrl" .vscode/settings.json; then
        check "Configuração do GitLab encontrada"
    else
        echo -e "${RED}❌ Configuração do GitLab não encontrada${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo settings.json não encontrado${NC}"
fi

echo ""

# 3. Verificar remotes do Git
echo "3️⃣  Verificando remotes do Git..."
if git remote | grep -q "gitlab"; then
    check "Remote 'gitlab' configurado"
    git remote get-url gitlab
else
    echo -e "${YELLOW}⚠️  Remote 'gitlab' não encontrado${NC}"
fi

echo ""

# 4. Testar conexão com API do GitLab
echo "4️⃣  Testando conexão com GitLab API..."
RESPONSE=$(curl -s -w "%{http_code}" --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID" -o /tmp/gitlab_response.json)

if [[ "$RESPONSE" = "200" ]]; then
    check "Conexão com API bem-sucedida"
    
    PROJECT_NAME=$(jq -r '.name' /tmp/gitlab_response.json)
    PROJECT_PATH=$(jq -r '.path_with_namespace' /tmp/gitlab_response.json)
    
    echo "   Projeto: $PROJECT_NAME"
    echo "   Caminho: $PROJECT_PATH"
else
    echo -e "${RED}❌ Falha na conexão (HTTP $RESPONSE)${NC}"
fi

echo ""

# 5. Verificar último pipeline
echo "5️⃣  Verificando último pipeline..."
PIPELINE=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID/pipelines?per_page=1")

if [[ -n "$PIPELINE" ]] && [ "$PIPELINE" != "[]" ]]; then
    check "Pipeline encontrado"
    
    PIPELINE_ID=$(echo "$PIPELINE" | jq -r '.[0].id')
    PIPELINE_STATUS=$(echo "$PIPELINE" | jq -r '.[0].status')
    PIPELINE_REF=$(echo "$PIPELINE" | jq -r '.[0].ref')
    
    echo "   ID: $PIPELINE_ID"
    echo "   Status: $PIPELINE_STATUS"
    echo "   Branch: $PIPELINE_REF"
else
    echo -e "${YELLOW}⚠️  Nenhum pipeline encontrado${NC}"
fi

echo ""

# 6. Verificar extensão GitLab Workflow
echo "6️⃣  Verificando extensão GitLab Workflow..."
if code --list-extensions | grep -q "gitlab.gitlab-workflow"; then
    check "Extensão GitLab Workflow instalada"
else
    echo -e "${RED}❌ Extensão não instalada${NC}"
    echo "   Instale com: code --install-extension gitlab.gitlab-workflow"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Resumo
echo "📊 RESUMO DA VERIFICAÇÃO"
echo ""

if [[ "$RESPONSE" = "200" ]]; then
    echo -e "${GREEN}✅ Tudo configurado corretamente!${NC}"
    echo ""
    echo "🎯 Próximo passo:"
    echo "   Execute: ./add-gitlab-account.sh"
    echo "   E siga as instruções para adicionar a conta no VS Code"
else
    echo -e "${RED}⚠️  Alguns problemas encontrados${NC}"
    echo ""
    echo "🔧 Execute para corrigir:"
    echo "   ./setup-gitlab-vscode.sh"
fi

echo ""
echo "📚 Documentação:"
echo "   • Guia rápido: GITLAB_QUICK_START.md"
echo "   • Guia completo: docs/GITLAB_VSCODE_GUIA.md"
echo "   • Troubleshooting: docs/GITLAB_TROUBLESHOOTING.md"
echo ""
