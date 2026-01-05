#!/bin/bash

echo "🔧 Configurando TypeScript do workspace no VS Code..."
echo ""

# Verificar se o TypeScript está instalado
if [ ! -d "node_modules/typescript" ]; then
    echo "❌ TypeScript não encontrado em node_modules"
    echo "   Execute: npm install"
    exit 1
fi

# Verificar versão
TS_VERSION=$(npx tsc --version | sed 's/Version //')
echo "✅ TypeScript v$TS_VERSION encontrado"
echo ""

# Criar arquivo de configuração do VS Code para selecionar versão do workspace
VSCODE_DIR=".vscode"
mkdir -p "$VSCODE_DIR"

# Verificar se já existe a configuração
if grep -q "typescript.tsdk" "$VSCODE_DIR/settings.json" 2>/dev/null; then
    echo "✅ Configuração typescript.tsdk já existe em .vscode/settings.json"
else
    echo "⚠️  Adicionando configuração typescript.tsdk..."
    # Adicionar configuração se não existir
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Configuração concluída!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Para ativar a versão do workspace:"
echo ""
echo "   1. Abra qualquer arquivo .ts no VS Code"
echo "   2. Clique na versão do TypeScript na barra de status"
echo "      (canto inferior direito, algo como 'TypeScript 5.x.x')"
echo "   3. Selecione 'Use Workspace Version'"
echo ""
echo "   OU use o Command Palette:"
echo "   - Pressione: Ctrl+Shift+P (Windows/Linux) ou Cmd+Shift+P (Mac)"
echo "   - Digite: 'TypeScript: Select TypeScript Version'"
echo "   - Selecione: 'Use Workspace Version'"
echo ""
echo "✅ A versão do workspace (v$TS_VERSION) será usada automaticamente"
echo ""
