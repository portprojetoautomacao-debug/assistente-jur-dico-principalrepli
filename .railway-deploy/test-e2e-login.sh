#!/bin/bash
# Script de teste rápido do login E2E

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 TESTE RÁPIDO DE LOGIN E2E"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se servidor está rodando
if ! curl -s http://127.0.0.1:5173 >/dev/null 2>&1; then
    echo "❌ Servidor dev não está rodando!"
    echo "   Execute: npm run dev"
    exit 1
fi

echo "✅ Servidor dev: RODANDO"
echo ""

# Verificar credenciais
if [ -z "$TEST_USER_EMAIL" ]; then
    echo "⚠️  TEST_USER_EMAIL não configurado, usando padrão: adm"
    export TEST_USER_EMAIL=adm
fi

if [ -z "$TEST_USER_PASSWORD" ]; then
    echo "⚠️  TEST_USER_PASSWORD não configurado, usando padrão: adm123"
    export TEST_USER_PASSWORD=adm123
fi

echo "📧 Credenciais de teste:"
echo "   Usuário: $TEST_USER_EMAIL"
echo "   Senha: $TEST_USER_PASSWORD"
echo ""

# Limpar storageState antigo
if [ -f tests/e2e/storageState.json ]; then
    echo "🗑️  Removendo storageState antigo..."
    rm -f tests/e2e/storageState.json
fi

echo "🚀 Executando apenas global-setup..."
echo ""

# Executar apenas o global setup
npx playwright test --grep "^$" --global-setup tests/e2e/global-setup.ts 2>&1 | tee /tmp/e2e-setup.log

echo ""
if [ -f tests/e2e/storageState.json ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ LOGIN E2E BEM-SUCEDIDO!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📄 StorageState criado com sucesso"
    echo "   Arquivo: tests/e2e/storageState.json"
    echo ""
    echo "🎉 Testes E2E agora rodarão com autenticação!"
    echo ""
    exit 0
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ LOGIN E2E FALHOU"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🔍 LOG COMPLETO:"
    cat /tmp/e2e-setup.log
    echo ""
    echo "💡 TROUBLESHOOTING:"
    echo "   1. Verifique se VITE_AUTH_MODE=simple está no .env"
    echo "   2. Teste login manual em http://127.0.0.1:5173"
    echo "   3. Credenciais: adm / adm123"
    echo "   4. Execute: npx playwright test --debug"
    echo ""
    exit 1
fi
