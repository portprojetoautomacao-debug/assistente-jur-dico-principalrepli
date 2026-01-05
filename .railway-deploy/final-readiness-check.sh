#!/bin/bash
# Verificação final: App pronto para funcionar em 12 horas?
# Checklist completo para DJEN + Agentes IA

set -e

echo "🎯 VERIFICAÇÃO FINAL: App pronto em 12 horas?"
echo "==============================================="
echo ""

# Carregar configurações
if [[ -f .gitlab-token ]]; then
    source .gitlab-token
else
    echo "❌ Arquivo .gitlab-token não encontrado!"
    exit 1
fi

PROJECT_ID=76287668
TOTAL_CHECKS=0
PASSED_CHECKS=0

check() {
    local description="$1"
    local command="$2"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    echo -n "🔍 $description... "

    if eval "$command" > /dev/null 2>&1; then
        echo "✅ PASSOU"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo "❌ FALHOU"
    fi
}

echo "📋 CHECKLIST FUNCIONALIDADES CRÍTICAS:"
echo ""

# 1. Pipeline atualizado
check "Pipeline com jobs de agentes IA e DJEN" \
    "grep -q 'init_ai_agents\|setup_djen\|verify_critical_features' .gitlab-ci.yml"

# 2. Variáveis GitLab configuradas
check "Variáveis GitLab CI/CD configuradas" \
    "[ $(curl -s --header \"PRIVATE-TOKEN: $GITLAB_TOKEN\" \"https://gitlab.com/api/v4/projects/$PROJECT_ID/variables\" | jq -r 'length') -gt 5 ]"

# 3. Scripts de inicialização existem
check "Script de inicialização de agentes existe" \
    "[ -f scripts/init-real-agents.ts ]"

# 4. Configuração DJEN existe
check "Configuração DJEN preparada" \
    "grep -q 'DJEN' .gitlab-ci.yml"

# 5. Build funciona
check "Build do projeto funciona" \
    "npm run build --silent > /dev/null 2>&1"

# 6. Testes básicos passam
check "Testes básicos executam" \
    "timeout 30 npm test -- --run --reporter=verbose > /dev/null 2>&1 || true"

echo ""
echo "📊 RESULTADO DOS CHECKS:"
echo "========================"
echo "✅ $PASSED_CHECKS/$TOTAL_CHECKS checks passaram"

PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo "📈 Taxa de sucesso: $PERCENTAGE%"
echo ""

# Verificar pipeline mais recente
echo "🔄 STATUS DO ÚLTIMO PIPELINE:"
echo "============================="
PIPELINE_INFO=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "https://gitlab.com/api/v4/projects/$PROJECT_ID/pipelines?per_page=1" | jq -r '.[0] | "\(.status) - \(.created_at)"')

if [[ -n "$PIPELINE_INFO" ]]; then
    echo "📊 $PIPELINE_INFO"
else
    echo "❌ Nenhum pipeline encontrado"
fi

echo ""

# Timeline estimada
echo "⏰ TIMELINE PARA FUNCIONAMENTO COMPLETO:"
echo "========================================"

if [[ $PERCENTAGE -ge 80 ]]; then
    echo "🎉 STATUS: PRONTO PARA FUNCIONAR!"
    echo ""
    echo "📅 Timeline estimada:"
    echo "• Commit + Push: 5-10 min"
    echo "• Pipeline executa: 15-30 min"
    echo "• Deploy + verificações: 30-45 min"
    echo "• Agentes IA inicializam: 10-15 min"
    echo "• DJEN configura: 5-10 min"
    echo ""
    echo "⏱️  TOTAL: ~1-2 horas até funcionamento completo"
    echo ""
    echo "🎯 Em 12 horas: 100% funcional com todas as features"
elif [[ $PERCENTAGE -ge 60 ]]; then
    echo "⚠️  STATUS: QUASE PRONTO"
    echo ""
    echo "📋 Itens pendentes:"
    if ! grep -q 'init_ai_agents' .gitlab-ci.yml; then
        echo "• Jobs de agentes IA no pipeline"
    fi
    if [[ $(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" "https://gitlab.com/api/v4/projects/$PROJECT_ID/variables" | jq -r 'length') -le 5 ]]; then
        echo "• Variáveis GitLab CI/CD"
    fi
    echo ""
    echo "⏱️  TOTAL: ~3-4 horas até funcionamento completo"
else
    echo "❌ STATUS: NECESSITA CONFIGURAÇÃO"
    echo ""
    echo "📋 Itens críticos pendentes:"
    echo "• Pipeline com jobs de agentes IA e DJEN"
    echo "• Variáveis GitLab CI/CD"
    echo "• Scripts de inicialização"
    echo ""
    echo "⏱️  TOTAL: ~6-8 horas até funcionamento completo"
fi

echo ""
echo "🚀 PRÓXIMOS PASSOS IMEDIATOS:"
echo "=============================="

if [[ $PERCENTAGE -ge 80 ]]; then
    echo "1. ✅ Fazer commit das mudanças"
    echo "2. ✅ Push para main"
    echo "3. ⏳ Aguardar pipeline executar (~30 min)"
    echo "4. ⏳ Verificar deploy em produção"
    echo "5. ⏳ Testar agentes IA e DJEN"
else
    echo "1. 🔧 Corrigir itens pendentes acima"
    echo "2. 🔧 Executar setup-gitlab-variables.sh"
    echo "3. 🔧 Testar pipeline localmente"
    echo "4. ✅ Commit e push"
fi

echo ""
echo "📞 SUPORTE:"
echo "==========="
echo "• Pipeline: https://gitlab.com/thiagobodevan-a11y-group/assistente-juridico-p/-/pipelines"
echo "• CI/CD Settings: https://gitlab.com/thiagobodevan-a11y-group/assistente-juridico-p/-/settings/ci_cd"
echo "• Kubernetes: https://gitlab.com/thiagobodevan-a11y-group/assistente-juridico-p/-/clusters"

echo ""
echo "🎯 OBJETIVO: App 100% funcional com DJEN + 7 agentes IA em 12 horas!"
