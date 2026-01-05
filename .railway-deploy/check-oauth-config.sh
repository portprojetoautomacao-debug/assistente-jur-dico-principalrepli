#!/bin/bash
# Diagnóstico de configuração OAuth

# Carregar biblioteca comum
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/scripts/lib/common.sh" || {
    echo "❌ Erro: não foi possível carregar scripts/lib/common.sh"
    exit 1
}

print_header "DIAGNÓSTICO GOOGLE OAUTH - Vercel"

log_info "📋 URLs de Produção Configuradas:"
echo "  - https://assistente-juridico-github.vercel.app"
echo "  - https://assistente-juridico-github.vercel.app"
echo ""

log_info "🔑 Variáveis de Ambiente Necessárias:"
echo ""
echo "VITE_GOOGLE_CLIENT_ID:"
if [[ -n "$VITE_GOOGLE_CLIENT_ID" ]]; then
  log_success "Configurado: ${VITE_GOOGLE_CLIENT_ID:0:40}..."
else
  log_error "NÃO CONFIGURADO"
  echo "  👉 Adicione no Vercel Dashboard: Settings → Environment Variables"
fi
echo ""

echo "VITE_REDIRECT_URI:"
if [[ -n "$VITE_REDIRECT_URI" ]]; then
  log_success "Configurado: $VITE_REDIRECT_URI"
else
  log_warning "Não configurado (usará origin automático)"
  echo "  👉 Opcional, mas recomendado para produção"
fi
echo ""

echo "VITE_GOOGLE_API_KEY:"
if [[ -n "$VITE_GOOGLE_API_KEY" ]]; then
  log_success "Configurado: ${VITE_GOOGLE_API_KEY:0:20}..."
else
  log_warning "Não configurado (opcional para algumas features)"
fi
echo ""

echo "📝 Checklist Google Cloud Console:"
echo "  1. Acesse: https://console.cloud.google.com/apis/credentials"
echo "  2. Selecione o projeto correto"
echo "  3. Clique em 'OAuth 2.0 Client IDs'"
echo "  4. Verifique 'Authorized JavaScript origins':"
echo "     - https://assistente-juridico-github.vercel.app"
echo "     - https://assistente-juridico-github.vercel.app"
echo "  5. Verifique 'Authorized redirect URIs':"
echo "     - https://assistente-juridico-github.vercel.app"
echo "     - https://assistente-juridico-github.vercel.app"
echo ""

echo "🚀 Como Configurar no Vercel:"
echo "  1. Acesse: https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/settings/environment-variables"
echo "  2. Adicione as variáveis:"
echo "     - VITE_GOOGLE_CLIENT_ID = [seu-client-id].apps.googleusercontent.com"
echo "     - VITE_REDIRECT_URI = https://assistente-juridico-github.vercel.app (ou github)"
echo "  3. Selecione: Production, Preview, Development"
echo "  4. Salve e faça redeploy"
echo ""

echo "🔄 Para Redeploy:"
echo "  git commit -m 'fix: atualizar config OAuth' && git push"
echo "  Ou use: Vercel Dashboard → Deployments → Redeploy"
echo ""
