#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO AUTOMÁTICA DO GITLAB WORKFLOW NO VS CODE
# ═══════════════════════════════════════════════════════════════════════

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🦊 CONFIGURAÇÃO DO GITLAB WORKFLOW"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se a extensão está instalada
if ! code --list-extensions | grep -q "gitlab.gitlab-workflow"; then
    echo "⚠️  Extensão GitLab Workflow não está instalada!"
    echo "Instalando..."
    code --install-extension gitlab.gitlab-workflow
fi

echo "✅ Extensão GitLab Workflow detectada"
echo ""

# Informações necessárias
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PASSO 1: CRIAR PERSONAL ACCESS TOKEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Abra: https://gitlab.com/-/user_settings/personal_access_tokens"
echo ""
echo "2. Clique em 'Add new token'"
echo ""
echo "3. Configurações:"
echo "   Nome: VS Code GitLab Workflow"
echo "   Expiration: 365 days (ou mais)"
echo "   Scopes (marque estes):"
echo "   ✅ api (acesso completo à API)"
echo "   ✅ read_user (ler informações do usuário)"
echo "   ✅ read_repository (ler repositórios)"
echo "   ✅ write_repository (escrever em repositórios)"
echo ""
echo "4. Clique 'Create personal access token'"
echo ""
echo "5. COPIE O TOKEN (só aparece uma vez!)"
echo ""

read -p "Pressione ENTER após criar o token..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 PASSO 2: CONFIGURAR TOKEN NO VS CODE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "No VS Code:"
echo ""
echo "1. Pressione: Ctrl+Shift+P (ou Cmd+Shift+P no Mac)"
echo ""
echo "2. Digite: GitLab: Authenticate"
echo ""
echo "3. Selecione: https://gitlab.com"
echo ""
echo "4. Cole o token que você copiou"
echo ""
echo "5. Pressione ENTER"
echo ""

read -p "Pressione ENTER após configurar o token..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CONFIGURAÇÃO CONCLUÍDA!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Recursos disponíveis:"
echo ""
echo "📊 Barra inferior do VS Code:"
echo "   • Status do pipeline (✅/❌)"
echo "   • Link direto para pipeline"
echo "   • Branch atual"
echo ""
echo "🔍 Sidebar GitLab (ícone GitLab):"
echo "   • Ver issues"
echo "   • Ver merge requests"
echo "   • Ver pipelines"
echo "   • Ver jobs de CI/CD"
echo ""
echo "⌨️  Comandos (Ctrl+Shift+P):"
echo "   • GitLab: Create Snippet"
echo "   • GitLab: Compare Current Branch"
echo "   • GitLab: Open Active File"
echo "   • GitLab: View Pipeline"
echo "   • GitLab: Validate GitLab CI config"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 PRONTO! Recarregue o VS Code para ver as mudanças"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
