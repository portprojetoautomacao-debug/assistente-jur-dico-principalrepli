#!/bin/bash

# Script para testar e validar configuração de Review Apps
# Assistente Jurídico PJe

echo "🔍 Testando configuração de Review Apps"
echo "======================================="

# Verificar se o arquivo .gitlab-ci.yml existe
if [[ ! -f ".gitlab-ci.yml" ]]; then
    echo "❌ Arquivo .gitlab-ci.yml não encontrado!"
    exit 1
fi

echo "✅ Arquivo .gitlab-ci.yml encontrado"

# Verificar se há jobs de review app configurados
if grep -q "deploy-review" .gitlab-ci.yml; then
    echo "✅ Job 'deploy-review' encontrado"
else
    echo "❌ Job 'deploy-review' não encontrado"
fi

if grep -q "stop-review" .gitlab-ci.yml; then
    echo "✅ Job 'stop-review' encontrado"
else
    echo "❌ Job 'stop-review' não encontrado"
fi

# Verificar se há environment configurado corretamente
if grep -q "review/\$CI_COMMIT_REF_SLUG" .gitlab-ci.yml; then
    echo "✅ Environment dinâmico configurado"
else
    echo "❌ Environment dinâmico não configurado"
fi

# Verificar se há auto_stop_in configurado
if grep -q "auto_stop_in:" .gitlab-ci.yml; then
    echo "✅ Auto-stop configurado"
else
    echo "⚠️ Auto-stop não configurado (recomendado)"
fi

# Verificar se há on_stop configurado
if grep -q "on_stop:" .gitlab-ci.yml; then
    echo "✅ Stop job referenciado"
else
    echo "⚠️ Stop job não referenciado"
fi

# Verificar route map
if [[ -f ".gitlab/route-map.yml" ]]; then
    echo "✅ Arquivo route-map.yml encontrado"
    echo "📊 Mapeamentos encontrados:"
    grep -c "source:" .gitlab/route-map.yml | xargs echo "   - Total de mapeamentos:"
else
    echo "⚠️ Arquivo route-map.yml não encontrado (opcional)"
fi

# Verificar se as regras estão corretas
if grep -q "merge_request_event" .gitlab-ci.yml; then
    echo "✅ Trigger para merge requests configurado"
else
    echo "❌ Trigger para merge requests não configurado"
fi

# Verificar se há branches específicas configuradas
if grep -q "^feature\/" .gitlab-ci.yml; then
    echo "✅ Trigger para branches feature/ configurado"
else
    echo "ℹ️ Trigger para branches feature/ não configurado"
fi

echo ""
echo "📋 Resumo da configuração:"
echo "=========================="

# Contar jobs de review app
REVIEW_JOBS=$(grep -c "deploy-review\|stop-review" .gitlab-ci.yml)
echo "- Jobs de Review App: $REVIEW_JOBS"

# Verificar se usa Vercel
if grep -q "vercel" .gitlab-ci.yml; then
    echo "- Plataforma: Vercel ✅"
else
    echo "- Plataforma: Não identificada ⚠️"
fi

# Verificar se há URL dinâmica
if grep -q "\$CI_COMMIT_REF_SLUG" .gitlab-ci.yml; then
    echo "- URL dinâmica: Configurada ✅"
else
    echo "- URL dinâmica: Não configurada ❌"
fi

echo ""
echo "🎯 Como testar os Review Apps:"
echo "=============================="
echo "1. Criar uma branch feature: git checkout -b feature/teste-review-app"
echo "2. Fazer uma alteração qualquer"
echo "3. Commit e push: git add . && git commit -m 'Teste review app' && git push origin feature/teste-review-app"
echo "4. Criar um Merge Request no GitLab"
echo "5. Aguardar o pipeline executar"
echo "6. Na aba 'Environments' do MR, clicar em 'View app'"
echo ""
echo "🛑 Como parar um Review App:"
echo "============================"
echo "1. Ir para o pipeline do MR"
echo "2. No job 'stop-review', clicar em 'Play' (▶️)"
echo ""
echo "🔗 Links úteis:"
echo "- Documentação GitLab: https://docs.gitlab.com/ee/ci/review_apps/"
echo "- Route Maps: https://docs.gitlab.com/ee/ci/review_apps/#route-maps"
echo ""
echo "✅ Configuração validada!"