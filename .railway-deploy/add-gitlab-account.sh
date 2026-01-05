#!/bin/bash
# Script para adicionar conta GitLab no VS Code usando PAT (Personal Access Token)

set -e

echo "🔧 Adicionando conta GitLab no VS Code..."
echo ""

# Carregar token
if [[ -f .gitlab-token ]]; then
    source .gitlab-token
else
    echo "❌ Arquivo .gitlab-token não encontrado!"
    exit 1
fi

# Verificar qual é o remote correto do GitLab
echo "📡 Verificando remotes do GitLab..."
git remote -v | grep gitlab

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 INSTRUÇÕES PARA ADICIONAR CONTA GITLAB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "A extensão GitLab Workflow usa autenticação PAT (Personal Access Token)."
echo "O erro anterior foi causado por tentativa de usar OAuth."
echo ""
echo "📋 Siga estes passos EXATAMENTE:"
echo ""
echo "1️⃣  Pressione: Ctrl+Shift+P"
echo ""
echo "2️⃣  Digite e selecione: 'GitLab: Add Account (GitLab.com)'"
echo "    ⚠️  NÃO selecione 'Add Account with OAuth'"
echo ""
echo "3️⃣  Quando aparecer a caixa de diálogo:"
echo "    • URL: https://gitlab.com"
echo "    • Pressione ENTER"
echo ""
echo "4️⃣  Cole o token (copie agora):"
echo ""
echo "    ${GITLAB_TOKEN}"
echo ""
echo "5️⃣  Pressione ENTER para confirmar"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 DICA: O token já está na área de transferência!"
echo ""

# Copiar token para clipboard (se disponível)
if command -v xclip &> /dev/null; then
    echo -n "$GITLAB_TOKEN" | xclip -selection clipboard
    echo "✅ Token copiado para área de transferência (xclip)"
elif command -v pbcopy &> /dev/null; then
    echo -n "$GITLAB_TOKEN" | pbcopy
    echo "✅ Token copiado para área de transferência (pbcopy)"
elif command -v clip.exe &> /dev/null; then
    echo -n "$GITLAB_TOKEN" | clip.exe
    echo "✅ Token copiado para área de transferência (clip.exe)"
else
    echo "ℹ️  Copie manualmente o token acima"
fi

echo ""
echo "🎯 Após adicionar a conta, você verá:"
echo "   • Status do pipeline na barra inferior"
echo "   • Ícone GitLab (🦊) na sidebar lateral"
echo "   • Notificações de pipeline (se habilitadas)"
echo ""
