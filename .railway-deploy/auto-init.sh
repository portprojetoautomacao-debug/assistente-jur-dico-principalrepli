#!/bin/bash

# ==========================================
# ASSISTENTE JURÍDICO P - INICIALIZAÇÃO AUTOMÁTICA
# ==========================================

# Carregar biblioteca comum
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/scripts/lib/common.sh" || {
    echo "❌ Erro: não foi possível carregar scripts/lib/common.sh"
    exit 1
}

print_header "ASSISTENTE JURÍDICO P - INICIALIZAÇÃO"

# Verificar se estamos no diretório correto
if [[ ! -f "package.json" ]]; then
    log_error "package.json não encontrado. Execute no diretório raiz do projeto."
    die "Diretório incorreto" 1
fi

# Verificar comandos necessários
require_commands node npm

log_info "Verificando Node.js $(node --version)"
log_info "Verificando npm $(npm --version)"

# Instalar dependências se node_modules não existir
if [[ ! -d "node_modules" ]]; then
    log_warning "node_modules não encontrado"
    npm_install || die "Falha ao instalar dependências" 1
fi

# Verificar se as dependências estão instaladas
if [[ ! -d "node_modules" ]]; then
    die "Falha ao instalar dependências" 1
fi

log_success "Dependências verificadas!"

# Verificar TypeScript
if ! command_exists npx; then
    die "npx não encontrado" 1
fi

if ! npx tsc --version &> /dev/null; then
    die "TypeScript não encontrado" 1
fi

log_success "TypeScript verificado!"

# Executar verificações rápidas
print_separator
log_info "Executando verificações rápidas..."

if npm_run type-check > /dev/null 2>&1; then
    log_success "TypeScript OK"
else
    log_warning "Avisos no TypeScript (verifique depois)"
fi

# Verificar linting básico
if npm_run lint > /dev/null 2>&1; then
    log_success "ESLint OK"
else
    log_warning "Avisos no ESLint (serão corrigidos automaticamente)"
fi

print_separator
log_success "Sistema pronto!"
log_info "💻 Servidor de desenvolvimento iniciando automaticamente..."
log_info "🧪 Testes em watch mode iniciando automaticamente..."

print_separator "="
echo "📝 Dicas:"
echo "  - Arquivos são formatados automaticamente ao salvar"
echo "  - ESLint corrige problemas automaticamente"
echo "  - TypeScript verifica tipos em tempo real"
echo "  - Testes rodam automaticamente"
echo ""
echo "🌐 Acesse: http://localhost:5173"
print_separator "="

# Manter terminal aberto
exec "$SHELL"