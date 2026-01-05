#!/bin/bash
###############################################################################
# 🚀 Quick Start - Sistema de Testes Automáticos com Copilot
###############################################################################

cat << 'EOF'

╔════════════════════════════════════════════════════════════════╗
║         🚀 INÍCIO RÁPIDO - TESTES AUTOMÁTICOS                 ║
╚════════════════════════════════════════════════════════════════╝

Escolha uma opção:

1️⃣  Iniciar testes automáticos AGORA (modo smart)
2️⃣  Iniciar apenas testes unitários (watch contínuo)
3️⃣  Iniciar apenas testes de API
4️⃣  Validação rápida (sem watch)
5️⃣  Ver documentação completa
6️⃣  Verificar última notificação
7️⃣  Limpar resultados antigos
0️⃣  Sair

EOF

read -p "Digite sua escolha [1-7, 0 para sair]: " choice

case $choice in
    1)
        echo ""
        echo "🤖 Iniciando testes em modo SMART..."
        echo "   • Detecta mudanças automaticamente"
        echo "   • Executa apenas testes relevantes"
        echo "   • Envia resultados para Copilot"
        echo ""
        npm run test:watch:smart
        ;;
    2)
        echo ""
        echo "🧪 Iniciando testes UNITÁRIOS em watch mode..."
        echo "   • Executa a cada mudança"
        echo "   • Watch contínuo do Vitest"
        echo ""
        npm run test:watch:auto
        ;;
    3)
        echo ""
        echo "🔌 Iniciando testes de API..."
        echo "   • Monitora mudanças em api/"
        echo "   • Executa testes de integração"
        echo ""
        npm run test:watch:api
        ;;
    4)
        echo ""
        echo "⚡ Executando validação rápida..."
        npm run test:validate
        ;;
    5)
        echo ""
        echo "📚 Abrindo documentação..."
        if command -v code &> /dev/null; then
            code docs/TESTES_AUTOMATICOS_COPILOT.md
        else
            cat docs/TESTES_AUTOMATICOS_COPILOT.md
        fi
        ;;
    6)
        echo ""
        echo "📢 Última notificação para Copilot:"
        echo ""
        if [ -f .copilot-notifications/test-notification.json ]; then
            if command -v jq &> /dev/null; then
                cat .copilot-notifications/test-notification.json | jq .
            else
                cat .copilot-notifications/test-notification.json
            fi
        else
            echo "⚠️  Nenhuma notificação ainda. Execute os testes primeiro."
        fi
        ;;
    7)
        echo ""
        read -p "❓ Limpar todos os resultados antigos? (s/N): " confirm
        if [[ $confirm =~ ^[Ss]$ ]]; then
            rm -rf .test-results/* .copilot-notifications/*
            echo "✅ Resultados limpos!"
        else
            echo "❌ Operação cancelada"
        fi
        ;;
    0)
        echo ""
        echo "👋 Até logo!"
        exit 0
        ;;
    *)
        echo ""
        echo "❌ Opção inválida. Tente novamente."
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 DICA: Para parar o watch mode, pressione Ctrl+C"
echo "💬 Para análise do Copilot: @workspace analisar resultados dos testes"
echo "📚 Documentação: docs/TESTES_AUTOMATICOS_COPILOT.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
