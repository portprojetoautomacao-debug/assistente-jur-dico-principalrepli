#!/bin/bash

# Script de configuração de testes locais
# Assistente Jurídico PJe - Modo Manutenção

set -e

echo "🧪 Configurando ambiente de testes locais..."
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar Node.js
echo "1️⃣ Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado${NC}"
    echo "Instalando Node.js..."
    if command -v apk &> /dev/null; then
        sudo apk add --no-cache nodejs npm
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y nodejs npm
    else
        echo -e "${RED}❌ Gerenciador de pacotes não suportado${NC}"
        exit 1
    fi
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION} - npm ${NPM_VERSION}${NC}"
echo ""

# 2. Instalar dependências
echo "2️⃣ Instalando dependências..."
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps
    echo -e "${GREEN}✅ Dependências instaladas${NC}"
else
    echo -e "${YELLOW}⚠️  node_modules já existe, pulando instalação${NC}"
fi
echo ""

# 3. Verificar arquivos de configuração
echo "3️⃣ Verificando arquivos de configuração de testes..."
if [ -f "vitest.config.ts" ]; then
    echo -e "${GREEN}✅ vitest.config.ts encontrado${NC}"
else
    echo -e "${RED}❌ vitest.config.ts não encontrado${NC}"
    exit 1
fi

if [ -f "vitest.config.node.ts" ]; then
    echo -e "${GREEN}✅ vitest.config.node.ts encontrado${NC}"
else
    echo -e "${YELLOW}⚠️  vitest.config.node.ts não encontrado${NC}"
fi
echo ""

# 4. Listar testes disponíveis
echo "4️⃣ Testes disponíveis:"
echo ""
echo -e "${YELLOW}📦 Testes unitários (src/)${NC}"
find tests src -name "*.test.ts" 2>/dev/null | wc -l | xargs echo "   Arquivos:"
echo ""
echo -e "${YELLOW}🔌 Testes de API (api/)${NC}"
find api -name "*.test.ts" 2>/dev/null | wc -l | xargs echo "   Arquivos:"
echo ""
echo -e "${YELLOW}🧩 Testes Chrome Extension${NC}"
if [ -d "chrome-extension-pje/tests" ]; then
    find chrome-extension-pje/tests -name "*.test.ts" 2>/dev/null | wc -l | xargs echo "   Arquivos:"
else
    echo "   Nenhum teste encontrado"
fi
echo ""

# 5. Comandos disponíveis
echo "5️⃣ Comandos de teste disponíveis:"
echo ""
echo -e "${GREEN}  npm run test${NC}           - Testes em modo watch"
echo -e "${GREEN}  npm run test:run${NC}       - Executar todos os testes unitários (1x)"
echo -e "${GREEN}  npm run test:api${NC}       - Executar testes de API"
echo -e "${GREEN}  npm run test:chrome${NC}    - Executar testes da extensão Chrome"
echo -e "${GREEN}  npm run test:all${NC}       - Executar TODOS os testes"
echo -e "${GREEN}  npm run test:coverage${NC}  - Testes com cobertura de código"
echo -e "${GREEN}  npm run test:ui${NC}        - Interface visual de testes"
echo ""

# 6. Executar teste rápido
echo "6️⃣ Executando teste rápido de validação..."
echo ""

# Executar apenas um arquivo de teste simples com limite de memória
NODE_OPTIONS="--max-old-space-size=512" npm run test:run -- --reporter=verbose --bail=1 src/lib/config.test.ts 2>&1 | head -50

echo ""
echo -e "${GREEN}✅ Configuração de testes concluída!${NC}"
echo ""
echo "📚 Próximos passos:"
echo "   1. Execute 'npm run test:run' para testar tudo"
echo "   2. Execute 'npm run test:ui' para interface gráfica"
echo "   3. Veja README.md seção '🧪 Dicas de Testes Rápidos'"
echo ""
