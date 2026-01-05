#!/bin/bash

# 🎯 Playwright Inspector - Script de Demonstração
# Projeto: Assistente Jurídico PJe
# Data: 2025-12-05

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 PLAYWRIGHT INSPECTOR - DEMONSTRAÇÃO INTERATIVA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se servidor está rodando
if ! curl -s http://127.0.0.1:5173 > /dev/null; then
    echo "⚠️  Servidor não está rodando!"
    echo ""
    echo "Por favor, execute em outro terminal:"
    echo "  $ npm run dev"
    echo ""
    exit 1
fi

echo "✅ Servidor detectado em http://127.0.0.1:5173"
echo ""

# Menu interativo
echo "Escolha uma opção:"
echo ""
echo "1️⃣  Inspector Básico (Página Principal)"
echo "2️⃣  Inspector - Agentes IA"
echo "3️⃣  Inspector - Dashboard"
echo "4️⃣  Inspector - CRM de Processos"
echo "5️⃣  Inspector - Calculadora de Prazos"
echo ""
echo "6️⃣  Inspector com Dark Mode"
echo "7️⃣  Inspector Mobile (iPhone 12)"
echo "8️⃣  Inspector com Autenticação Salva"
echo ""
echo "9️⃣  Abrir Playwright UI Mode (Interface Completa)"
echo "🔟  Debug de Teste Específico"
echo ""
read -p "Digite o número da opção (1-10): " option

case $option in
    1)
        echo ""
        echo "🚀 Abrindo Inspector na página principal..."
        echo ""
        echo "📝 DICAS:"
        echo "  - Clique em 🎯 'Pick Locator' para selecionar elementos"
        echo "  - Use o campo 'Locator' para testar seletores CSS/XPath"
        echo "  - Use o campo 'Aria' para testar seletores de acessibilidade"
        echo "  - Marque ☑️ 'Copy on Pick' para copiar código automaticamente"
        echo ""
        npx playwright codegen http://127.0.0.1:5173
        ;;
    2)
        echo ""
        echo "🤖 Abrindo Inspector - Agentes IA..."
        echo ""
        echo "📝 ELEMENTOS PARA TESTAR:"
        echo "  • Status badges dos agentes"
        echo "  • Botões de toggle (Ativar/Desativar)"
        echo "  • Cards de métricas"
        echo "  • Logs de atividade"
        echo ""
        npx playwright codegen http://127.0.0.1:5173/agentes
        ;;
    3)
        echo ""
        echo "📊 Abrindo Inspector - Dashboard..."
        echo ""
        echo "📝 ELEMENTOS PARA TESTAR:"
        echo "  • Cards de estatísticas"
        echo "  • Botões de navegação"
        echo "  • Widgets de publicações DJEN"
        echo "  • Gráficos e métricas"
        echo ""
        npx playwright codegen http://127.0.0.1:5173/dashboard
        ;;
    4)
        echo ""
        echo "📁 Abrindo Inspector - CRM de Processos..."
        echo ""
        echo "📝 ELEMENTOS PARA TESTAR:"
        echo "  • Kanban boards (drag-and-drop)"
        echo "  • Cards de processos"
        echo "  • Filtros e busca"
        echo "  • Botões de ação"
        echo ""
        npx playwright codegen http://127.0.0.1:5173/processos
        ;;
    5)
        echo ""
        echo "⏰ Abrindo Inspector - Calculadora de Prazos..."
        echo ""
        echo "📝 ELEMENTOS PARA TESTAR:"
        echo "  • Campos de data"
        echo "  • Dropdowns de tipo de prazo"
        echo "  • Botão calcular"
        echo "  • Resultados exibidos"
        echo ""
        npx playwright codegen http://127.0.0.1:5173/calculadora
        ;;
    6)
        echo ""
        echo "🌙 Abrindo Inspector com Dark Mode..."
        echo ""
        npx playwright codegen --color-scheme=dark http://127.0.0.1:5173
        ;;
    7)
        echo ""
        echo "📱 Abrindo Inspector Mobile (iPhone 12)..."
        echo ""
        echo "📝 DICAS:"
        echo "  • Testa responsividade"
        echo "  • Verifica touch events"
        echo "  • Valida layout mobile"
        echo ""
        npx playwright codegen --device="iPhone 12" http://127.0.0.1:5173
        ;;
    8)
        echo ""
        echo "🔐 Abrindo Inspector com Autenticação Salva..."
        echo ""
        
        # Verificar se arquivo de autenticação existe
        if [ -f "playwright/.auth/user.json" ]; then
            echo "✅ Usando autenticação salva de: playwright/.auth/user.json"
            npx playwright codegen --load-storage=playwright/.auth/user.json http://127.0.0.1:5173/dashboard
        else
            echo "⚠️  Arquivo de autenticação não encontrado!"
            echo ""
            echo "Vou criar um novo arquivo de autenticação..."
            echo ""
            npx playwright codegen --save-storage=playwright/.auth/user.json http://127.0.0.1:5173
        fi
        ;;
    9)
        echo ""
        echo "🎨 Abrindo Playwright UI Mode (Interface Completa)..."
        echo ""
        echo "📝 RECURSOS DISPONÍVEIS:"
        echo "  • Lista de todos os testes"
        echo "  • Execução interativa"
        echo "  • Time travel debugging"
        echo "  • Screenshots e vídeos"
        echo "  • Locator Picker integrado"
        echo ""
        npx playwright test --ui
        ;;
    10)
        echo ""
        echo "🐛 Debug de Teste Específico..."
        echo ""
        echo "Testes disponíveis:"
        echo "  1. Agentes UI (agents-ui.spec.ts)"
        echo "  2. Navegação (app-flow.spec.ts)"
        echo "  3. Básicos (basic.spec.ts)"
        echo ""
        read -p "Escolha o teste (1-3): " test_option
        
        case $test_option in
            1)
                echo ""
                echo "🐛 Debugando: agents-ui.spec.ts"
                npx playwright test tests/e2e/agents-ui.spec.ts --debug
                ;;
            2)
                echo ""
                echo "🐛 Debugando: app-flow.spec.ts"
                npx playwright test tests/e2e/app-flow.spec.ts --debug
                ;;
            3)
                echo ""
                echo "🐛 Debugando: basic.spec.ts"
                npx playwright test tests/e2e/basic.spec.ts --debug
                ;;
            *)
                echo "❌ Opção inválida!"
                exit 1
                ;;
        esac
        ;;
    *)
        echo ""
        echo "❌ Opção inválida!"
        echo "Por favor, escolha um número entre 1 e 10."
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Inspector fechado!"
echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo "  1. Cole o código gerado nos seus testes"
echo "  2. Substitua seletores CSS por ARIA roles quando possível"
echo "  3. Adicione data-testid em componentes críticos"
echo "  4. Execute os testes: npm run test:e2e"
echo ""
echo "📚 Documentação completa em: PLAYWRIGHT_LOCATORS_GUIDE.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
