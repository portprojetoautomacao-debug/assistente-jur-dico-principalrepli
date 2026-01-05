#!/bin/bash
# Script para executar testes E2E com verificações automáticas

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 EXECUTANDO TESTES E2E AUTOMATIZADOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado. Criando com valores padrão..."
    cat > .env << 'EOF'
# Modo de autenticação
VITE_AUTH_MODE=simple

# Credenciais de teste
TEST_USER_EMAIL=adm
TEST_USER_PASSWORD=adm123

# URL base
BASE_URL=http://127.0.0.1:5173
USE_PROD_BASE_URL=false
EOF
    echo "✅ Arquivo .env criado com sucesso!"
fi

# Verificar se credenciais estão configuradas
if ! grep -q "TEST_USER_EMAIL=adm" .env 2>/dev/null; then
    echo "⚠️  Credenciais de teste não encontradas no .env"
    echo "   Adicionando credenciais padrão..."
    echo "" >> .env
    echo "# Credenciais de teste E2E" >> .env
    echo "TEST_USER_EMAIL=adm" >> .env
    echo "TEST_USER_PASSWORD=adm123" >> .env
fi

# Verificar se Playwright está instalado
if ! npx playwright --version &>/dev/null; then
    echo "📦 Instalando Playwright..."
    npm install --save-dev @playwright/test
fi

# Verificar se browsers estão instalados
if ! npx playwright list-files | grep -q "chromium" 2>/dev/null; then
    echo "🌐 Instalando browsers do Playwright..."
    npx playwright install chromium firefox
fi

# Limpar storageState antigo se existir
if [ -f tests/e2e/storageState.json ]; then
    echo "🗑️  Removendo storageState antigo..."
    rm -f tests/e2e/storageState.json
fi

# Verificar se servidor dev está rodando
if ! curl -s http://127.0.0.1:5173 >/dev/null 2>&1; then
    echo "⚠️  Servidor dev não está rodando"
    echo "   Os testes irão iniciar o servidor automaticamente"
fi

echo ""
echo "✅ PRÉ-REQUISITOS VERIFICADOS"
echo ""
echo "📋 CONFIGURAÇÃO:"
echo "   • Modo auth: simple"
echo "   • Usuário: adm"
echo "   • URL: http://127.0.0.1:5173"
echo ""
echo "🚀 INICIANDO TESTES..."
echo ""

# Executar testes
npm run test:e2e

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ TODOS OS TESTES PASSARAM!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📊 Ver relatório: npx playwright show-report"
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ ALGUNS TESTES FALHARAM"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🔍 Debug:"
    echo "   • Ver relatório: npx playwright show-report"
    echo "   • Rodar com UI: npx playwright test --ui"
    echo "   • Modo debug: npx playwright test --debug"
fi

exit $EXIT_CODE
