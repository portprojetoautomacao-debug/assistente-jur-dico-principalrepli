#!/bin/bash

# 🔍 Script de Verificação da Configuração SonarQube
# Este script verifica se todas as dependências e configurações do SonarQube estão corretas

set -e

echo "🔍 Verificando Configuração SonarQube..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar comando
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✅ $1 encontrado: $(command -v "$1")${NC}"
        if [ -n "$2" ]; then
            echo -e "   ${BLUE}Versão: $($1 $2 2>&1 | head -1)${NC}"
        fi
        return 0
    else
        echo -e "${RED}❌ $1 não encontrado${NC}"
        return 1
    fi
}

# Função para verificar arquivo
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ Arquivo existe: $1${NC}"
        return 0
    else
        echo -e "${RED}❌ Arquivo não encontrado: $1${NC}"
        return 1
    fi
}

# Função para verificar variável de ambiente
check_env_var() {
    if [ -n "${!1}" ]; then
        echo -e "${GREEN}✅ Variável $1 definida${NC}"
        # Mostrar apenas primeiros 10 caracteres do token
        local value="${!1}"
        echo -e "   ${BLUE}Valor: ${value:0:10}...${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Variável $1 não definida${NC}"
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 1. Verificando Dependências do Sistema"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_command "node" "--version"
check_command "npm" "--version"
check_command "npx" "--version"
check_command "java" "-version"

# Verificar JAVA_HOME
if [ -n "$JAVA_HOME" ]; then
    echo -e "${GREEN}✅ JAVA_HOME definido: $JAVA_HOME${NC}"
else
    echo -e "${YELLOW}⚠️  JAVA_HOME não definido${NC}"
    # Tentar detectar Java
    if [ -d "/usr/local/sdkman/candidates/java/current" ]; then
        export JAVA_HOME="/usr/local/sdkman/candidates/java/current"
        echo -e "${BLUE}   Auto-detectado: $JAVA_HOME${NC}"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 2. Verificando Arquivos de Configuração"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_file ".cursor/mcp.json"
check_file ".vscode/settings.json"
check_file "sonar-project.properties"
check_file ".env.example"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 3. Verificando Variáveis de Ambiente"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Carregar .env se existir
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
    source .env
else
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    echo -e "   ${BLUE}Copie .env.example para .env e configure SONARQUBE_TOKEN${NC}"
fi

echo ""
check_env_var "SONARQUBE_TOKEN"
check_env_var "PATH"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 4. Verificando Configuração MCP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f ".cursor/mcp.json" ]; then
    if grep -q "sonarqube" ".cursor/mcp.json"; then
        echo -e "${GREEN}✅ Servidor SonarQube MCP configurado em mcp.json${NC}"
    else
        echo -e "${RED}❌ Servidor SonarQube MCP não encontrado em mcp.json${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo .cursor/mcp.json não encontrado${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 5. Verificando Configuração VS Code"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f ".vscode/settings.json" ]; then
    if grep -q "sonarlint.connectedMode.connections.sonarcloud" ".vscode/settings.json"; then
        echo -e "${GREEN}✅ Connected Mode configurado no VS Code${NC}"
    else
        echo -e "${YELLOW}⚠️  Connected Mode não encontrado em settings.json${NC}"
    fi
    
    if grep -q "sonarlint.analyser.automaticAnalysis.enabled" ".vscode/settings.json"; then
        echo -e "${GREEN}✅ Análise automática habilitada${NC}"
    else
        echo -e "${YELLOW}⚠️  Análise automática não configurada${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo .vscode/settings.json não encontrado${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 6. Testando Conexão com SonarCloud"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -n "$SONARQUBE_TOKEN" ]; then
    echo "Testando conexão com SonarCloud..."
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -u "$SONARQUBE_TOKEN:" \
        "https://sonarcloud.io/api/authentication/validate")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ Token SonarCloud válido e autenticado${NC}"
    else
        echo -e "${RED}❌ Token SonarCloud inválido ou erro de autenticação (HTTP $response)${NC}"
        echo -e "   ${BLUE}Verifique se o token está correto em .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  SONARQUBE_TOKEN não definido, pulando teste de conexão${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 7. Resumo da Configuração"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Contar sucessos e falhas
total=0
success=0

# Verificações principais
checks=(
    "node:check_command node --version"
    "java:check_command java -version"
    "mcp.json:check_file .cursor/mcp.json"
    "settings.json:check_file .vscode/settings.json"
    "sonar-project.properties:check_file sonar-project.properties"
)

for check in "${checks[@]}"; do
    total=$((total + 1))
    name="${check%%:*}"
    cmd="${check#*:}"
    
    if eval "$cmd" &> /dev/null; then
        success=$((success + 1))
    fi
done

echo -e "${BLUE}Total de verificações: $total${NC}"
echo -e "${GREEN}Sucessos: $success${NC}"
echo -e "${RED}Falhas: $((total - success))${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Próximos Passos"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -z "$SONARQUBE_TOKEN" ]; then
    echo -e "${YELLOW}1. Configure o token do SonarCloud:${NC}"
    echo "   - Acesse: https://sonarcloud.io/account/security"
    echo "   - Gere um User Token"
    echo "   - Copie para .env: SONARQUBE_TOKEN=seu_token"
    echo ""
fi

echo -e "${BLUE}2. Reinicie o VS Code para aplicar as configurações${NC}"
echo ""
echo -e "${BLUE}3. Teste a análise:${NC}"
echo "   - Abra um arquivo .ts ou .tsx"
echo "   - Salve o arquivo (Ctrl+S)"
echo "   - Veja os issues no painel Problems"
echo ""
echo -e "${BLUE}4. Leia a documentação completa:${NC}"
echo "   - cat SONARQUBE_MCP_SETUP.md"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Verificação concluída!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
