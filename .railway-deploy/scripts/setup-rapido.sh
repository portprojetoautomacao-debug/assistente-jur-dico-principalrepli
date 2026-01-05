#!/bin/bash
# Script de Setup Rápido - Assistente Jurídico PJe
# Configura ambiente de desenvolvimento em poucos minutos

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

echo ""
echo "🚀 Setup Rápido - Assistente Jurídico PJe"
echo "=========================================="
echo ""

# 1. Verificar Node.js
info "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    error "Node.js não está instalado!"
    echo ""
    echo "Instale Node.js v20+ em: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 20 ]; then
    error "Node.js v$NODE_VERSION detectado. Requer v20+"
    exit 1
fi
success "Node.js $(node -v) detectado"

# 2. Instalar dependências
info "Instalando dependências do frontend..."
npm install || exit 1
success "Dependências do frontend instaladas"

if [ -d "backend" ]; then
    info "Instalando dependências do backend..."
    (cd backend && npm install) || exit 1
    success "Dependências do backend instaladas"
fi

# 3. Configurar .env
if [ ! -f .env ]; then
    info "Criando arquivo .env..."
    cp .env.example .env
    success "Arquivo .env criado"
    echo ""
    warning "⚠️  IMPORTANTE: Configure suas chaves de API no arquivo .env"
    echo ""
    echo "Edite o arquivo .env e configure:"
    echo "  1. VITE_GEMINI_API_KEY     (obtenha em: https://aistudio.google.com/app/apikey)"
    echo "  2. UPSTASH_REDIS_REST_URL  (obtenha em: https://console.upstash.com/redis)"
    echo "  3. UPSTASH_REDIS_REST_TOKEN"
    echo "  4. DATABASE_URL            (obtenha em: https://console.neon.tech)"
    echo ""
    read -p "Pressione ENTER após configurar o .env ou CTRL+C para sair..."
else
    success "Arquivo .env já existe"
fi

# 4. Inicializar banco de dados
if [ -d "backend" ]; then
    info "Inicializando banco de dados..."
    (cd backend && npm run db:init) || warning "Falha ao inicializar DB (pode já estar inicializado)"
fi

# 5. Verificar build
info "Testando build..."
npm run build &> /dev/null || {
    warning "Build falhou, mas isso é normal se variáveis de ambiente estiverem incompletas"
}

# 6. Resumo
echo ""
echo "======================================"
success "Setup completo! 🎉"
echo "======================================"
echo ""
echo "📝 Próximos passos:"
echo ""
echo "  1. Configure variáveis de ambiente (se ainda não fez):"
echo "     $ code .env  # ou nano .env"
echo ""
echo "  2. Valide a configuração:"
echo "     $ ./scripts/validar-ambiente-deploy.sh"
echo ""
echo "  3. Inicie o servidor de desenvolvimento:"
echo "     $ npm run dev"
echo ""
echo "  4. Acesse a aplicação:"
echo "     http://localhost:5173"
echo ""
echo "  5. Faça login com:"
echo "     Usuário: adm"
echo "     Senha: adm123"
echo ""
echo "📖 Documentação completa:"
echo "   GUIA_CONFIGURACAO_AMBIENTE_IMPLANTACAO.md"
echo ""
