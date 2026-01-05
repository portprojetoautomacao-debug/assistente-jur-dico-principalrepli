#!/bin/bash

# 🔍 Script para verificar status da extensão SonarLint
# Este script verifica se a extensão está instalada e funcionando corretamente

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Verificando Status do SonarLint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se code command está disponível
if ! command -v code &> /dev/null; then
    echo -e "${RED}❌ Comando 'code' não encontrado${NC}"
    echo -e "${BLUE}   Certifique-se de que o VS Code está instalado${NC}"
    exit 1
fi

# Verificar extensões instaladas
echo "📦 Verificando extensões instaladas..."
echo ""

extensions=$(code --list-extensions 2>/dev/null || echo "")

if echo "$extensions" | grep -q "sonarsource.sonarlint-vscode"; then
    version=$(code --list-extensions --show-versions 2>/dev/null | grep "sonarsource.sonarlint-vscode" | cut -d'@' -f2)
    echo -e "${GREEN}✅ SonarLint instalado (versão: $version)${NC}"
else
    echo -e "${RED}❌ SonarLint NÃO instalado${NC}"
    echo -e "${BLUE}   Instalando agora...${NC}"
    code --install-extension sonarsource.sonarlint-vscode
    echo -e "${GREEN}✅ SonarLint instalado com sucesso!${NC}"
fi

if echo "$extensions" | grep -q "sonar-copilot-assistant"; then
    version=$(code --list-extensions --show-versions 2>/dev/null | grep "sonar-copilot-assistant" | cut -d'@' -f2)
    echo -e "${GREEN}✅ Sonar Copilot Assistant instalado (versão: $version)${NC}"
else
    echo -e "${YELLOW}⚠️  Sonar Copilot Assistant não instalado${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Verificando Configurações"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar settings.json
if [ -f ".vscode/settings.json" ]; then
    if grep -q "sonarlint.ls.javaHome" ".vscode/settings.json"; then
        java_home=$(grep "sonarlint.ls.javaHome" ".vscode/settings.json" | cut -d'"' -f4)
        echo -e "${GREEN}✅ Java Home configurado: $java_home${NC}"
        
        if [ -d "$java_home" ]; then
            echo -e "${GREEN}✅ Diretório Java existe${NC}"
        else
            echo -e "${RED}❌ Diretório Java não existe: $java_home${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Java Home não configurado em settings.json${NC}"
    fi
    
    if grep -q "sonarlint.connectedMode" ".vscode/settings.json"; then
        echo -e "${GREEN}✅ Connected Mode configurado${NC}"
    else
        echo -e "${YELLOW}⚠️  Connected Mode não configurado${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo .vscode/settings.json não encontrado${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 Verificando Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f ".env" ]; then
    if grep -q "SONARQUBE_TOKEN" ".env"; then
        echo -e "${GREEN}✅ Token definido no .env${NC}"
        # Mostrar apenas primeiros 10 caracteres
        token=$(grep "SONARQUBE_TOKEN" ".env" | cut -d'=' -f2)
        echo -e "   ${BLUE}Token: ${token:0:10}...${NC}"
    else
        echo -e "${YELLOW}⚠️  Token não definido no .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    echo -e "   ${BLUE}Copie .env.example para .env e adicione o token${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Resumo e Próximos Passos"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Contar status
has_extension=0
has_config=0
has_token=0

if echo "$extensions" | grep -q "sonarsource.sonarlint-vscode"; then
    has_extension=1
fi

if [ -f ".vscode/settings.json" ] && grep -q "sonarlint.ls.javaHome" ".vscode/settings.json"; then
    has_config=1
fi

if [ -f ".env" ] && grep -q "SONARQUBE_TOKEN" ".env"; then
    has_token=1
fi

total=$((has_extension + has_config + has_token))

echo -e "${BLUE}Status da configuração: $total/3${NC}"
echo ""

if [ $has_extension -eq 0 ]; then
    echo -e "${RED}❌ Extensão SonarLint não instalada${NC}"
    echo -e "   ${BLUE}Execute: code --install-extension sonarsource.sonarlint-vscode${NC}"
    echo ""
fi

if [ $has_config -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Configurações incompletas${NC}"
    echo -e "   ${BLUE}Verifique .vscode/settings.json${NC}"
    echo ""
fi

if [ $has_token -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Token não configurado${NC}"
    echo -e "   ${BLUE}1. Acesse: https://sonarcloud.io/account/security${NC}"
    echo -e "   ${BLUE}2. Gere um User Token${NC}"
    echo -e "   ${BLUE}3. Adicione ao .env: SONARQUBE_TOKEN=seu_token${NC}"
    echo ""
fi

if [ $total -eq 3 ]; then
    echo -e "${GREEN}✅ Tudo configurado corretamente!${NC}"
    echo ""
    echo -e "${BLUE}Próximo passo:${NC}"
    echo "1. Recarregue o VS Code: Ctrl+Shift+P → 'Developer: Reload Window'"
    echo "2. Aguarde o SonarLint inicializar"
    echo "3. Teste: Abra um arquivo .ts e salve (Ctrl+S)"
    echo "4. Veja issues no painel Problems (Ctrl+Shift+M)"
else
    echo -e "${YELLOW}⚠️  Configuração incompleta ($total/3)${NC}"
    echo ""
    echo -e "${BLUE}Complete os passos acima e execute novamente este script${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Documentação"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "• Guia Rápido: cat SONARQUBE_SETUP_RAPIDO.md"
echo "• Troubleshooting: cat SONARQUBE_TROUBLESHOOTING.md"
echo "• Setup Completo: cat SONARQUBE_MCP_SETUP.md"
echo "• Java Setup: cat JAVA_SETUP_COMPLETO.md"
echo ""
