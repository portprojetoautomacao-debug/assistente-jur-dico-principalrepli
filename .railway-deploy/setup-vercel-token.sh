#!/bin/bash

# Script para configurar token do Vercel
# Este script ajuda a gerar e configurar um novo token do Vercel

echo "🔧 Configuração do Token Vercel"
echo "================================"

echo ""
echo "Para resolver o problema do deploy, precisamos de um token válido do Vercel."
echo ""
echo "Passos para gerar um novo token:"
echo ""
echo "1. Acesse: https://vercel.com/account/tokens"
echo "2. Clique em 'Create Token'"
echo "3. Dê um nome descritivo (ex: 'assistente-juridico-deploy')"
echo "4. Copie o token gerado"
echo ""
echo "5. No GitHub, vá para: Settings > Secrets and variables > Actions"
echo "6. Clique em 'New repository secret'"
echo "7. Nome: VERCEL_TOKEN"
echo "8. Valor: Cole o token copiado"
echo "9. Clique em 'Add secret'"
echo ""
echo "Após configurar o secret, execute um novo push para testar:"
echo "git commit --allow-empty -m 'Trigger deploy test'"
echo "git push"
echo ""
echo "Ou manualmente no GitHub Actions > Deploy Automatizado > Run workflow"
echo ""
echo "⚠️  IMPORTANTE: Nunca compartilhe ou commite tokens em código!"
echo ""

# Verificar se o token atual existe (sem mostrar o valor)
echo "Verificando configuração atual..."
if gh secret list | grep -q VERCEL_TOKEN; then
    echo "✅ Secret VERCEL_TOKEN existe no GitHub"
    echo "ℹ️  Se o deploy ainda falha, o token pode ter expirado"
else
    echo "❌ Secret VERCEL_TOKEN não encontrado no GitHub"
fi

echo ""
echo "📋 Lista de secrets configurados:"
gh secret list --json name | jq -r '.[].name' 2>/dev/null || echo "Não foi possível listar secrets (verifique permissões)"

echo ""
echo "🔗 Links úteis:"
echo "- Vercel Tokens: https://vercel.com/account/tokens"
echo "- GitHub Secrets: https://github.com/thiagobodevan-a11y/assistente-juridico-p/settings/secrets/actions"
echo "- Vercel Login CLI: vercel login (se quiser usar CLI localmente)"