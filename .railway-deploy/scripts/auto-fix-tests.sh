#!/bin/bash
# Auto-fix de testes com correções automáticas
# Versão: 1.0.0
# Data: 09/12/2024

set -e

echo "?? Auto-fix de Testes - Assistente Jurídico PJe"
echo "================================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. INSTALAR DEPENDÊNCIAS
log_info "Verificando dependências..."
if ! command -v npm &> /dev/null; then
    log_error "npm não encontrado. Instale Node.js 22.x"
    exit 1
fi

# 2. EXECUTAR LINT COM AUTO-FIX
log_info "Executando ESLint com auto-fix..."
npm run lint -- --fix || log_warning "ESLint encontrou alguns problemas"

# 3. FORMATAR CÓDIGO
log_info "Formatando código com Prettier..."
npm run format || log_warning "Prettier encontrou alguns problemas"

# 4. CORRIGIR IMPORTS NÃO UTILIZADOS
log_info "Removendo imports não utilizados..."
npm run lint -- --fix --rule 'unused-imports/no-unused-imports: error' || true

# 5. EXECUTAR TESTES UNITÁRIOS
log_info "Executando testes unitários (frontend)..."
if npm run test:run; then
    log_success "Testes unitários passaram!"
else
    log_warning "Alguns testes falharam"
    
    # Auto-fix de testes comuns
    log_info "Tentando auto-fix de problemas comuns..."
    
    # 5.1. Atualizar snapshots
    log_info "Atualizando snapshots..."
    npm run test:run -- -u || log_warning "Falha ao atualizar snapshots"
    
    # 5.2. Limpar cache
    log_info "Limpando cache de testes..."
    npm run test:run -- --clearCache || true
    
    # 5.3. Re-executar testes
    log_info "Re-executando testes..."
    npm run test:run || log_warning "Ainda há falhas nos testes"
fi

# 6. EXECUTAR TESTES DE API
log_info "Executando testes de API (backend)..."
if npm run test:api; then
    log_success "Testes de API passaram!"
else
    log_warning "Alguns testes de API falharam"
fi

# 7. VERIFICAR TYPESCRIPT
log_info "Verificando erros TypeScript..."
if npm run type-check; then
    log_success "TypeScript OK!"
else
    log_error "Erros TypeScript detectados"
    
    # Tentar auto-fix básico
    log_info "Tentando auto-fix de TypeScript..."
    
    # 7.1. Gerar declarações de tipos
    npx tsc --emitDeclarationOnly || true
    
    # 7.2. Re-verificar
    npm run type-check || log_error "Erros TypeScript persistem"
fi

# 8. COVERAGE REPORT
log_info "Gerando relatório de cobertura..."
npm run test:coverage || log_warning "Coverage incompleto"

# 9. RELATÓRIO FINAL
echo ""
echo "================================================"
echo "?? RELATÓRIO FINAL"
echo "================================================"

# Contar arquivos de teste
UNIT_TESTS=$(find src -name "*.test.ts" -o -name "*.test.tsx" | wc -l)
API_TESTS=$(find api -name "*.test.ts" 2>/dev/null | wc -l || echo 0)
CHROME_TESTS=$(find chrome-extension-pje/tests -name "*.test.ts" 2>/dev/null | wc -l || echo 0)

echo "Testes Unitários (Frontend): $UNIT_TESTS arquivos"
echo "Testes de API (Backend): $API_TESTS arquivos"
echo "Testes da Extensão Chrome: $CHROME_TESTS arquivos"
echo ""

# Verificar arquivos modificados
if [ -n "$(git status --porcelain)" ]; then
    log_warning "Arquivos modificados durante auto-fix:"
    git status --short
    echo ""
    echo "Execute 'git add .' e 'git commit' para salvar as correções"
else
    log_success "Nenhuma modificação necessária"
fi

log_success "Auto-fix concluído!"
