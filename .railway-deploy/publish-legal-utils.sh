#!/bin/bash

# 🚀 Script para publicar o pacote legal-utils no GitHub Packages
# Uso: ./publish-legal-utils.sh

set -e  # Para em caso de erro

echo "╔════════════════════════════════════════════════════════╗"
echo "║     Publicando pacote legal-utils                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar se está autenticado
echo -e "${YELLOW}📋 Passo 1: Verificando autenticação...${NC}"
if ! grep -q "//npm.pkg.github.com/:_authToken" ~/.npmrc 2>/dev/null; then
    echo -e "${RED}❌ Erro: Você precisa configurar o token primeiro!${NC}"
    echo ""
    echo "Faça o seguinte:"
    echo "1. Crie um token: https://github.com/settings/tokens/new"
    echo "   - Marque: write:packages"
    echo "2. Execute:"
    echo "   echo '//npm.pkg.github.com/:_authToken=SEU_TOKEN_AQUI' >> ~/.npmrc"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Autenticação configurada${NC}"
echo ""

# 2. Ir para a pasta do pacote
echo -e "${YELLOW}📁 Passo 2: Acessando pasta do pacote...${NC}"
cd packages/legal-utils
echo -e "${GREEN}✅ Pasta: $(pwd)${NC}"
echo ""

# 3. Mostrar informações do pacote
echo -e "${YELLOW}📦 Passo 3: Informações do pacote:${NC}"
PACKAGE_NAME=$(grep '"name"' package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/')
PACKAGE_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/')
echo "   Nome: $PACKAGE_NAME"
echo "   Versão: $PACKAGE_VERSION"
echo ""

# 4. Confirmar publicação
echo -e "${YELLOW}❓ Deseja publicar? (s/n)${NC}"
read -r resposta
if [[ ! "$resposta" =~ ^[Ss]$ ]]; then
    echo -e "${RED}❌ Publicação cancelada${NC}"
    exit 0
fi

# 5. Publicar
echo ""
echo -e "${YELLOW}🚀 Passo 4: Publicando...${NC}"
npm publish

# 6. Sucesso!
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ PACOTE PUBLICADO COM SUCESSO!            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "📦 Pacote: $PACKAGE_NAME@$PACKAGE_VERSION"
echo ""
echo "🔗 Ver pacote em:"
echo "   https://github.com/thiagobodevan-a11y?tab=packages"
echo ""
echo "📥 Para instalar em outro projeto:"
echo "   npm install $PACKAGE_NAME"
echo ""
echo "📚 Para usar no código:"
echo "   import { calcularPrazo } from '$PACKAGE_NAME';"
echo ""
