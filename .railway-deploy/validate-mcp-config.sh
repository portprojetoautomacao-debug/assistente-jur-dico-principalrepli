#!/bin/bash

# 🔍 Script de Validação da Configuração MCP
# Verifica se o servidor Todoist MCP está configurado corretamente

set -e

echo "🔍 Validando configuração MCP..."
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se npx existe
echo "1️⃣ Verificando npx..."
if command -v npx &> /dev/null; then
    NPX_PATH=$(which npx)
    echo -e "${GREEN}✓${NC} npx encontrado em: $NPX_PATH"
else
    echo -e "${RED}✗${NC} npx NÃO encontrado no PATH"
    exit 1
fi

# 2. Verificar Node.js
echo ""
echo "2️⃣ Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_PATH=$(which node)
    echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION em: $NODE_PATH"
else
    echo -e "${RED}✗${NC} Node.js NÃO encontrado"
    exit 1
fi

# 3. Verificar arquivo de configuração MCP
echo ""
echo "3️⃣ Verificando arquivo .cursor/mcp.json..."
MCP_FILE=".cursor/mcp.json"

if [ -f "$MCP_FILE" ]; then
    echo -e "${GREEN}✓${NC} Arquivo encontrado: $MCP_FILE"
    
    # Verificar se contém configuração do Todoist
    if grep -q "todoist" "$MCP_FILE"; then
        echo -e "${GREEN}✓${NC} Configuração do Todoist encontrada"
        
        # Verificar se o caminho do npx está correto
        CONFIGURED_NPX=$(grep -oP '(?<="command": ")[^"]*' "$MCP_FILE" | head -1)
        echo "   Comando configurado: $CONFIGURED_NPX"
        
        if [ "$CONFIGURED_NPX" = "$NPX_PATH" ]; then
            echo -e "${GREEN}✓${NC} Caminho do npx está correto!"
        else
            echo -e "${YELLOW}⚠${NC} Caminho do npx difere do sistema"
            echo "   Sistema: $NPX_PATH"
            echo "   Configurado: $CONFIGURED_NPX"
            echo ""
            echo "   Deseja atualizar? (s/n)"
            read -r RESPONSE
            if [[ "$RESPONSE" =~ ^[Ss]$ ]]; then
                sed -i "s|\"command\": \".*npx\"|\"command\": \"$NPX_PATH\"|g" "$MCP_FILE"
                echo -e "${GREEN}✓${NC} Arquivo atualizado!"
            fi
        fi
    else
        echo -e "${RED}✗${NC} Configuração do Todoist NÃO encontrada"
    fi
else
    echo -e "${RED}✗${NC} Arquivo $MCP_FILE NÃO encontrado"
    exit 1
fi

# 4. Verificar conectividade com o endpoint MCP
echo ""
echo "4️⃣ Testando conectividade com ai.todoist.net..."
if curl -s --head --max-time 5 "https://ai.todoist.net/mcp" | head -n 1 | grep -q "HTTP"; then
    echo -e "${GREEN}✓${NC} Endpoint acessível"
else
    echo -e "${YELLOW}⚠${NC} Não foi possível verificar o endpoint (pode estar OK mesmo assim)"
fi

echo ""
echo "════════════════════════════════════════"
echo -e "${GREEN}✓ Validação concluída!${NC}"
echo "════════════════════════════════════════"
echo ""
echo "💡 Próximos passos:"
echo "   1. Recarregue a janela do VS Code/Cursor (Ctrl+Shift+P → 'Reload Window')"
echo "   2. Verifique os logs do servidor MCP"
echo "   3. Se o erro persistir, veja .cursor/README_MCP.md"
echo ""
