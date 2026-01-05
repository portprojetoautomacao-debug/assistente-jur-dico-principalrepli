#!/bin/bash

# Script de Teste da Integração Vercel Webhook + GitHub Actions
# Executa verificações para garantir que a integração está funcionando

set -e

echo "🧪 Iniciando testes da integração Vercel Webhook..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[TEST]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Teste 1: Verificar se o workflow existe
log "1. Verificando se o workflow vercel-webhook-automation.yml existe..."
if [[ -f ".github/workflows/vercel-webhook-automation.yml" ]]; then
    log "✅ Workflow encontrado"
else
    error "❌ Workflow não encontrado"
    exit 1
fi

# Teste 2: Verificar se o webhook do Vercel existe
log "2. Verificando se o handler do webhook existe..."
if [[ -f "api/vercel-webhook.ts" ]]; then
    log "✅ Handler do webhook encontrado"
else
    error "❌ Handler do webhook não encontrado"
    exit 1
fi

# Teste 3: Verificar se as variáveis de ambiente estão documentadas
log "3. Verificando documentação das variáveis de ambiente..."
if [[ -f ".env.vercel.example" ]]; then
    log "✅ Arquivo de exemplo das variáveis encontrado"

    # Verificar se contém as variáveis necessárias
    if grep -q "GITHUB_TOKEN" .env.vercel.example &&
       grep -q "GITHUB_REPO_OWNER" .env.vercel.example &&
       grep -q "GITHUB_REPO_NAME" .env.vercel.example; then
        log "✅ Variáveis obrigatórias documentadas"
    else
        warn "⚠️  Algumas variáveis obrigatórias podem não estar documentadas"
    fi
else
    error "❌ Arquivo de exemplo das variáveis não encontrado"
    exit 1
fi

# Teste 4: Verificar se a documentação existe
log "4. Verificando documentação da integração..."
if [[ -f "docs/VERCEL_WEBHOOK_INTEGRATION.md" ]]; then
    log "✅ Documentação encontrada"
else
    error "❌ Documentação não encontrada"
    exit 1
fi

# Teste 5: Verificar sintaxe do workflow
log "5. Verificando sintaxe do workflow..."
if command -v yamllint &> /dev/null; then
    if yamllint .github/workflows/vercel-webhook-automation.yml > /dev/null 2>&1; then
        log "✅ Sintaxe YAML válida"
    else
        warn "⚠️  Possíveis problemas na sintaxe YAML"
    fi
else
    log "ℹ️  yamllint não disponível, pulando verificação de sintaxe"
fi

# Teste 6: Verificar se o build passa
log "6. Executando build para verificar se o código compila..."
if npm run build > /dev/null 2>&1; then
    log "✅ Build bem-sucedido"
else
    error "❌ Build falhou"
    exit 1
fi

# Teste 7: Verificar se o workflow está atualizado no README
log "7. Verificando se o workflow está documentado no README..."
if grep -q "vercel-webhook-automation.yml" .github/workflows/README.md; then
    log "✅ Workflow documentado no README"
else
    warn "⚠️  Workflow não encontrado no README"
fi

# Teste 8: Verificar configuração do webhook no código
log "8. Verificando se a integração GitHub está implementada no webhook..."
if grep -q "triggerGitHubAction" api/vercel-webhook.ts &&
   grep -q "repository_dispatch" api/vercel-webhook.ts; then
    log "✅ Integração GitHub implementada no webhook"
else
    error "❌ Integração GitHub não encontrada no webhook"
    exit 1
fi

echo ""
log "🎉 Todos os testes básicos passaram!"
echo ""
echo "📋 Próximos passos para completar a configuração:"
echo "1. Configure as variáveis de ambiente no Vercel (veja .env.vercel.example)"
echo "2. Crie um Personal Access Token no GitHub"
echo "3. Configure os secrets opcionais no GitHub Actions"
echo "4. Teste fazendo um deploy no Vercel"
echo "5. Verifique se o workflow foi acionado no GitHub Actions"
echo ""
echo "📖 Documentação completa: docs/VERCEL_WEBHOOK_INTEGRATION.md"