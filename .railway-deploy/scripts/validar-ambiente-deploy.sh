#!/bin/bash
# Script de Validação do Ambiente de Deploy
# Assistente Jurídico PJe v1.4.0+

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se .env existe
check_env_file() {
    info "Verificando arquivo .env..."
    if [ ! -f .env ]; then
        error "Arquivo .env não encontrado!"
        warning "Execute: cp .env.example .env"
        return 1
    fi
    success "Arquivo .env encontrado"
    return 0
}

# Carregar variáveis de ambiente
load_env() {
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
}

# Verificar Node.js
check_node() {
    info "Verificando Node.js..."
    if ! command -v node &> /dev/null; then
        error "Node.js não está instalado!"
        warning "Instale Node.js v20+ em: https://nodejs.org"
        return 1
    fi

    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        error "Node.js v$NODE_VERSION detectado. Requer v20+"
        return 1
    fi
    success "Node.js $(node -v) OK"
    return 0
}

# Verificar npm
check_npm() {
    info "Verificando npm..."
    if ! command -v npm &> /dev/null; then
        error "npm não está instalado!"
        return 1
    fi
    success "npm $(npm -v) OK"
    return 0
}

# Verificar dependências instaladas
check_dependencies() {
    info "Verificando node_modules..."
    if [ ! -d "node_modules" ]; then
        warning "node_modules não encontrado"
        info "Instalando dependências..."
        npm install || return 1
    fi
    success "Dependências instaladas"

    # Verificar backend
    if [ -d "backend" ]; then
        info "Verificando dependências do backend..."
        if [ ! -d "backend/node_modules" ]; then
            warning "backend/node_modules não encontrado"
            info "Instalando dependências do backend..."
            (cd backend && npm install) || return 1
        fi
        success "Dependências do backend instaladas"
    fi

    return 0
}

# Verificar variáveis obrigatórias
check_required_vars() {
    info "Verificando variáveis de ambiente obrigatórias..."
    local missing=0

    # Lista de variáveis obrigatórias
    local required_vars=(
        "VITE_GEMINI_API_KEY"
        "GEMINI_API_KEY"
        "UPSTASH_REDIS_REST_URL"
        "UPSTASH_REDIS_REST_TOKEN"
        "DATABASE_URL"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Variável $var não definida"
            missing=$((missing + 1))
        else
            success "Variável $var definida"
        fi
    done

    if [ $missing -gt 0 ]; then
        error "$missing variável(is) obrigatória(s) faltando"
        warning "Configure no arquivo .env"
        return 1
    fi

    return 0
}

# Testar Gemini API
test_gemini() {
    info "Testando Gemini API..."

    if [ -z "$VITE_GEMINI_API_KEY" ]; then
        warning "VITE_GEMINI_API_KEY não definida, pulando teste"
        return 0
    fi

    local response=$(curl -s -X POST \
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=$VITE_GEMINI_API_KEY" \
        -H 'Content-Type: application/json' \
        -d '{"contents":[{"parts":[{"text":"test"}]}]}' 2>&1)

    if echo "$response" | grep -q '"candidates"'; then
        success "Gemini API respondendo"
        return 0
    else
        error "Gemini API não respondeu corretamente"
        warning "Verifique sua API key em: https://aistudio.google.com/app/apikey"
        return 1
    fi
}

# Testar Upstash Redis
test_upstash() {
    info "Testando Upstash Redis..."

    if [ -z "$UPSTASH_REDIS_REST_URL" ] || [ -z "$UPSTASH_REDIS_REST_TOKEN" ]; then
        warning "Variáveis Upstash não definidas, pulando teste"
        return 0
    fi

    local response=$(curl -s "$UPSTASH_REDIS_REST_URL/ping" \
        -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" 2>&1)

    if echo "$response" | grep -q '"result":"PONG"'; then
        success "Upstash Redis conectado"
        return 0
    else
        error "Upstash Redis não conectou"
        warning "Verifique credenciais em: https://console.upstash.com/redis"
        return 1
    fi
}

# Testar PostgreSQL
test_postgres() {
    info "Testando PostgreSQL..."

    if [ -z "$DATABASE_URL" ]; then
        warning "DATABASE_URL não definida, pulando teste"
        return 0
    fi

    if ! command -v psql &> /dev/null; then
        warning "psql não instalado, pulando teste de conexão PostgreSQL"
        warning "Instale: brew install postgresql (Mac) ou apt install postgresql-client (Linux)"
        return 0
    fi

    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        success "PostgreSQL conectado"
        return 0
    else
        error "PostgreSQL não conectou"
        warning "Verifique DATABASE_URL"
        return 1
    fi
}

# Verificar TypeScript
check_typescript() {
    info "Verificando TypeScript..."
    if npm run type-check &> /dev/null; then
        success "TypeScript OK (sem erros)"
        return 0
    else
        error "TypeScript tem erros"
        warning "Execute: npm run type-check"
        return 1
    fi
}

# Verificar Lint
check_lint() {
    info "Verificando Lint..."
    local lint_output=$(npm run lint 2>&1)
    local errors=$(echo "$lint_output" | grep -o '[0-9]* error' | cut -d ' ' -f 1 | head -1)
    local warnings=$(echo "$lint_output" | grep -o '[0-9]* warning' | cut -d ' ' -f 1 | head -1)

    # Garantir que sempre temos um número
    errors=${errors:-0}
    warnings=${warnings:-0}

    # Validar que são números
    if ! [[ "$errors" =~ ^[0-9]+$ ]]; then
        errors=0
    fi
    if ! [[ "$warnings" =~ ^[0-9]+$ ]]; then
        warnings=0
    fi

    if [ "$errors" -eq 0 ]; then
        if [ "$warnings" -le 150 ]; then
            success "Lint OK ($errors erros, $warnings warnings)"
            return 0
        else
            warning "Lint: $errors erros, $warnings warnings (limite: 150)"
            return 0
        fi
    else
        error "Lint: $errors erros encontrados"
        warning "Execute: npm run lint"
        return 1
    fi
}

# Verificar Build
check_build() {
    info "Verificando Build..."
    if npm run build &> /dev/null; then
        success "Build OK"

        # Verificar tamanho do build
        if [ -d "dist" ]; then
            local size=$(du -sh dist | cut -f1)
            info "Tamanho do build: $size"
        fi
        return 0
    else
        error "Build falhou"
        warning "Execute: npm run build"
        return 1
    fi
}

# Testar servidor local
test_local_server() {
    info "Testando servidor local..."

    # Iniciar servidor em background
    info "Iniciando servidor dev..."
    npm run dev > /dev/null 2>&1 &
    local server_pid=$!

    # Aguardar servidor iniciar
    sleep 10

    # Testar endpoint
    if curl -s http://localhost:5173 > /dev/null; then
        success "Servidor local respondendo em http://localhost:5173"
        kill $server_pid 2> /dev/null || true
        return 0
    else
        error "Servidor local não respondeu"
        kill $server_pid 2> /dev/null || true
        return 1
    fi
}

# Verificar configuração Git
check_git() {
    info "Verificando Git..."
    if ! command -v git &> /dev/null; then
        warning "Git não está instalado"
        return 0
    fi

    if [ ! -d .git ]; then
        warning "Não é um repositório Git"
        return 0
    fi

    # Verificar se há mudanças não comitadas
    if [ -n "$(git status --porcelain)" ]; then
        warning "Existem mudanças não comitadas"
        info "Execute: git status"
    else
        success "Git: sem mudanças pendentes"
    fi

    # Verificar branch
    local branch=$(git branch --show-current)
    info "Branch atual: $branch"

    return 0
}

# Relatório final
print_summary() {
    echo ""
    echo "======================================"
    echo "📊 RESUMO DA VALIDAÇÃO"
    echo "======================================"
    echo ""

    if [ $TOTAL_ERRORS -eq 0 ]; then
        success "Ambiente configurado corretamente! ✨"
        echo ""
        info "Próximos passos:"
        echo "  1. Execute: npm run dev"
        echo "  2. Acesse: http://localhost:5173"
        echo "  3. Login: adm / adm123"
        echo ""
        info "Para deploy em produção:"
        echo "  1. Configure variáveis no Vercel"
        echo "  2. Execute: git push origin main"
        echo "  3. Aguarde deploy automático"
        echo ""
    else
        error "$TOTAL_ERRORS problema(s) encontrado(s)"
        echo ""
        warning "Corrija os problemas acima antes de fazer deploy"
        warning "Consulte: GUIA_CONFIGURACAO_AMBIENTE_IMPLANTACAO.md"
        echo ""
    fi
}

# Função principal
main() {
    echo ""
    echo "🚀 Validando Ambiente de Deploy"
    echo "Assistente Jurídico PJe v1.4.0+"
    echo "======================================"
    echo ""

    TOTAL_ERRORS=0

    # Executar verificações
    check_env_file || TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    load_env
    check_node || TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    check_npm || TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    check_dependencies || TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    check_required_vars || TOTAL_ERRORS=$((TOTAL_ERRORS + 1))

    echo ""
    info "Testando conectividade..."
    test_gemini || TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    test_upstash || TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    test_postgres || TOTAL_ERRORS=$((TOTAL_ERRORS + 1))

    echo ""
    info "Verificando qualidade do código..."
    check_typescript || TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    check_lint || TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    check_build || TOTAL_ERRORS=$((TOTAL_ERRORS + 1))

    echo ""
    check_git

    # Relatório final
    print_summary

    # Exit code
    if [ $TOTAL_ERRORS -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Executar
main
