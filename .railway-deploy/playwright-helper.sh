#!/bin/bash
# Script helper para testes Playwright
# Uso: ./playwright-helper.sh [headless|headed|debug|help]

set -e

MODE="${1:-headless}"

echo "🎭 Playwright Test Runner"
echo "=========================="
echo ""

case "$MODE" in
  headless)
    echo "📦 Rodando em modo HEADLESS (sem interface gráfica)"
    echo "⚡ Mais rápido e leve"
    echo ""
    npm run test:e2e
    ;;
  
  headed)
    echo "🖥️  Rodando em modo HEADED (com interface virtual via xvfb)"
    echo "🔍 Melhor para debugging visual"
    echo ""
    npm run test:e2e:headed
    ;;
  
  debug)
    echo "🐛 Rodando em modo DEBUG (headed + inspector)"
    echo "⏸️  Permite step-by-step debugging"
    echo ""
    npm run test:e2e:debug
    ;;
  
  install)
    echo "📥 Instalando dependências do Playwright..."
    echo ""
    sudo apt-get update
    sudo apt-get install -y xvfb xauth
    npx playwright install --with-deps chromium firefox
    echo ""
    echo "✅ Instalação concluída!"
    ;;
  
  report)
    echo "📊 Abrindo relatório HTML dos testes..."
    npx playwright show-report
    ;;
  
  help|*)
    echo "Uso: $0 [modo]"
    echo ""
    echo "Modos disponíveis:"
    echo "  headless  - Roda testes sem interface gráfica (padrão, mais rápido)"
    echo "  headed    - Roda testes com interface virtual (para debug)"
    echo "  debug     - Roda em modo debug com Playwright Inspector"
    echo "  install   - Instala dependências necessárias (xvfb, browsers)"
    echo "  report    - Abre relatório HTML dos últimos testes"
    echo "  help      - Mostra esta mensagem"
    echo ""
    echo "Exemplos:"
    echo "  $0 headless"
    echo "  $0 headed"
    echo "  $0 debug"
    echo ""
    exit 0
    ;;
esac

echo ""
echo "✅ Execução concluída!"
