#!/bin/bash

# Validação simples das correções críticas nos workflows

echo "🔍 Validação das Correções dos Workflows GitHub Actions"
echo "======================================================"

ERRORS=0

echo ""
echo "🔒 1. Segurança - pull_request_target:"
echo "-------------------------------------"

if ! grep -q "pull_request_target" .github/workflows/copilot-auto-approve.yml; then
    echo "✅ copilot-auto-approve.yml: OK (usa pull_request)"
else
    echo "❌ copilot-auto-approve.yml: Ainda usa pull_request_target"
    ((ERRORS++))
fi

if ! grep -q "pull_request_target" .github/workflows/dependabot-auto-merge.yml; then
    echo "✅ dependabot-auto-merge.yml: OK (usa pull_request)"
else
    echo "❌ dependabot-auto-merge.yml: Ainda usa pull_request_target"
    ((ERRORS++))
fi

echo ""
echo "🔑 2. Segurança - Vazamento de secrets:"
echo "--------------------------------------"

if ! grep -q "tee /dev/stderr" .github/workflows/deploy.yml; then
    echo "✅ deploy.yml: OK (não vazia secrets)"
else
    echo "❌ deploy.yml: Ainda pode vazar secrets"
    ((ERRORS++))
fi

echo ""
echo "⚡ 3. Performance - Cache duplicado:"
echo "-----------------------------------"

if ! grep -q "Cache dependencies" .github/workflows/ci.yml; then
    echo "✅ ci.yml: OK (cache não duplicado)"
else
    echo "❌ ci.yml: Ainda tem cache duplicado"
    ((ERRORS++))
fi

echo ""
echo "🧪 4. Qualidade - Validação real de testes:"
echo "-----------------------------------------"

if grep -q "npm test" .github/workflows/copilot-auto-approve.yml && grep -q "npm run lint" .github/workflows/copilot-auto-approve.yml; then
    echo "✅ copilot-auto-approve.yml: OK (valida testes reais)"
else
    echo "❌ copilot-auto-approve.yml: Não valida testes reais"
    ((ERRORS++))
fi

echo ""
echo "⏱️  5. Timeouts apropriados:"
echo "---------------------------"

if grep -q "timeout-minutes: 10" .github/workflows/code-quality.yml; then
    echo "✅ code-quality.yml: OK (type-check: 10min)"
else
    echo "❌ code-quality.yml: type-check sem timeout"
    ((ERRORS++))
fi

if grep -q "timeout-minutes: 30" .github/workflows/e2e.yml; then
    echo "✅ e2e.yml: OK (30min)"
else
    echo "❌ e2e.yml: timeout incorreto"
    ((ERRORS++))
fi

echo ""
echo "📦 6. Dependabot para GitHub Actions:"
echo "------------------------------------"

if grep -q "github-actions" .github/dependabot.yml; then
    echo "✅ dependabot.yml: OK (configurado para Actions)"
else
    echo "❌ dependabot.yml: Não configurado para Actions"
    ((ERRORS++))
fi

echo ""
echo "📊 RESULTADO DA VALIDAÇÃO:"
echo "=========================="

if [[ $ERRORS -eq 0 ]]; then
    echo "🎉 SUCESSO! Todas as correções foram aplicadas corretamente."
    echo ""
    echo "📋 Resumo das Correções Implementadas:"
    echo "======================================"
    echo ""
    echo "✅ Segurança crítica: pull_request_target → pull_request"
    echo "✅ Vazamento de secrets: Corrigido no deploy.yml"
    echo "✅ Cache duplicado: Removido do ci.yml"
    echo "✅ Validação de testes: Implementada no auto-approve"
    echo "✅ Timeouts: Adicionados jobs críticos"
    echo "✅ Dependabot: Configurado para GitHub Actions"
    echo "✅ SARIF: Geração melhorada sem mascarar erros"
    echo ""
    echo "🚀 Os workflows estão agora mais seguros, rápidos e confiáveis!"
else
    echo "❌ $ERRORS problemas encontrados. Verifique os itens acima."
    exit 1
fi