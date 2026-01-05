#!/bin/bash

echo "🔧 Corrigindo instalação do TypeScript..."
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Diretório do projeto
PROJECT_DIR="/workspaces/assistente-jur-dico-principal"
cd "$PROJECT_DIR"

# 1. Verificar versão do TypeScript no package.json
echo "📋 Verificando package.json..."
TS_VERSION=$(cat package.json | grep -o '"typescript": "[^"]*"' | cut -d'"' -f4)
echo "  Versão no package.json: $TS_VERSION"
echo ""

# 2. Verificar instalação atual
echo "📦 Verificando instalação atual..."
if [ -d "node_modules/typescript" ]; then
    INSTALLED_VERSION=$(npm list typescript --depth=0 | grep typescript@ | sed 's/.*typescript@//' | sed 's/ .*//')
    echo "  Versão instalada: $INSTALLED_VERSION"
    
    # Verificar tamanho dos arquivos críticos
    TSSERVER_SIZE=$(stat -c%s "node_modules/typescript/lib/_tsserver.js" 2>/dev/null || echo "0")
    TSC_SIZE=$(stat -c%s "node_modules/typescript/lib/_tsc.js" 2>/dev/null || echo "0")
    
    echo "  Tamanho _tsserver.js: $TSSERVER_SIZE bytes"
    echo "  Tamanho _tsc.js: $TSC_SIZE bytes"
    
    # Verificar se os arquivos têm tamanho razoável (>10KB)
    if [ "$TSSERVER_SIZE" -lt 10000 ] || [ "$TSC_SIZE" -lt 10000 ]; then
        echo -e "${RED}  ❌ Arquivos muito pequenos - instalação pode estar corrompida${NC}"
        NEED_REINSTALL=true
    else
        echo -e "${GREEN}  ✅ Arquivos parecem estar OK${NC}"
        NEED_REINSTALL=false
    fi
else
    echo -e "${RED}  ❌ TypeScript não encontrado em node_modules${NC}"
    NEED_REINSTALL=true
fi
echo ""

# 3. Reinstalar se necessário
if [ "$NEED_REINSTALL" = true ]; then
    echo "🔄 Reinstalando TypeScript..."
    
    # Limpar cache do npm
    echo "  Limpando cache..."
    npm cache clean --force > /dev/null 2>&1
    
    # Remover node_modules/typescript
    echo "  Removendo instalação antiga..."
    rm -rf node_modules/typescript
    
    # Reinstalar
    echo "  Instalando TypeScript $TS_VERSION..."
    npm install --save-dev typescript@$TS_VERSION --prefer-offline --no-audit
    
    echo ""
fi

# 4. Verificar instalação final
echo "✅ Verificação final..."
if [ -f "node_modules/typescript/lib/tsserver.js" ] && [ -f "node_modules/typescript/lib/_tsserver.js" ]; then
    echo -e "${GREEN}  ✅ tsserver.js encontrado${NC}"
    echo -e "${GREEN}  ✅ _tsserver.js encontrado${NC}"
else
    echo -e "${RED}  ❌ Arquivos do tsserver não encontrados${NC}"
    exit 1
fi

# Verificar se o TypeScript funciona
if npx tsc --version > /dev/null 2>&1; then
    TS_CLI_VERSION=$(npx tsc --version | sed 's/Version //')
    echo -e "${GREEN}  ✅ TypeScript CLI funcionando (v$TS_CLI_VERSION)${NC}"
else
    echo -e "${RED}  ❌ TypeScript CLI não está funcionando${NC}"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ TypeScript instalado e funcionando!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Próximos passos:"
echo "  1. Recarregue a janela do VS Code (Ctrl+Shift+P > 'Reload Window')"
echo "  2. Quando solicitado, selecione 'Use Workspace Version' para TypeScript"
echo "  3. Verifique a barra de status do VS Code (canto inferior direito)"
echo ""
