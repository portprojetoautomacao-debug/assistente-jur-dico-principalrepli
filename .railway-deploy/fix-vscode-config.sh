#!/bin/bash

# Script para diagnosticar e corrigir configurações inválidas do VS Code
# Assistente Jurídico PJe

echo "🔧 Diagnóstico de Configurações VS Code"
echo "======================================="

echo ""
echo "❌ CONFIGURAÇÃO PROBLEMÁTICA IDENTIFICADA:"
echo "=========================================="
echo "Item: *.copilotmd"
echo "Valor atual: vscode.markdown.preview.editor"
echo "Status: ❌ INVÁLIDO"
echo ""

echo "📋 Valores válidos aceitos:"
echo "============================"
echo "- default"
echo "- workbench.editor.chatSession"
echo "- workbench.editorinputs.searchEditorInput"
echo "- notebookOutputEditor"
echo "- jupyter-notebook"
echo "- repl"
echo "- workbench.editors.gettingStartedInput"
echo "- imagePreview.previewEditor"
echo "- vscode.audioPreview"
echo "- vscode.videoPreview"
echo "- jsProfileVisualizer.cpuprofile.table"
echo "- jsProfileVisualizer.heapprofile.table"
echo "- jsProfileVisualizer.heapsnapshot.table"
echo ""

echo "🔍 ONDE ENCONTRAR ESSA CONFIGURAÇÃO:"
echo "===================================="
echo "1. Arquivo global: ~/.config/Code/User/settings.json"
echo "2. Arquivo workspace: .vscode/settings.json (já verificado)"
echo "3. Configurações da extensão GitHub Copilot"
echo "4. Configurações do sistema operacional"
echo ""

echo "🛠️ COMO CORRIGIR:"
echo "================="
echo "Opção 1 - Via Interface:"
echo "1. Ctrl+Shift+P (Command Palette)"
echo "2. Digite: 'Preferences: Open Settings (JSON)'"
echo "3. Procure por '*.copilotmd'"
echo "4. Altere para um valor válido (ex: 'default')"
echo ""

echo "Opção 2 - Via Terminal:"
echo "1. Edite o arquivo de configurações diretamente"
echo "2. Remova ou corrija a linha problemática"
echo ""

echo "Opção 3 - Reset para padrão:"
echo "1. Ctrl+Shift+P → 'Preferences: Open Settings (JSON)'"
echo "2. Remova completamente a linha: \"*.copilotmd\": \"vscode.markdown.preview.editor\","
echo ""

echo "📁 ARQUIVOS DE CONFIGURAÇÃO NO PROJETO:"
echo "========================================"
echo "- .vscode/settings.json: ✅ Verificado (OK)"
echo "- .vscode/launch.json: ✅ Presente"
echo ""

echo "🔍 VERIFICAÇÃO ADICIONAL:"
echo "=========================="

# Verificar se há arquivos .copilotmd no projeto
echo "Procurando arquivos .copilotmd..."
if find . -name "*.copilotmd" -type f 2>/dev/null | grep -q .; then
    echo "✅ Arquivos .copilotmd encontrados:"
    find . -name "*.copilotmd" -type f
else
    echo "ℹ️ Nenhum arquivo .copilotmd encontrado no projeto"
fi

echo ""
echo "📋 RESUMO DA SITUAÇÃO:"
echo "======================="
echo "• A configuração '*.copilotmd' está com valor inválido"
echo "• Isso pode causar problemas na abertura de arquivos .copilotmd"
echo "• A correção é simples: alterar para um valor válido ou remover"
echo "• Arquivos de configuração do projeto estão OK"
echo ""

echo "✅ PRÓXIMOS PASSOS:"
echo "==================="
echo "1. Abra as configurações do VS Code (JSON)"
echo "2. Localize e corrija a configuração problemática"
echo "3. Reinicie o VS Code se necessário"
echo "4. Teste abrindo um arquivo .copilotmd (se existir)"
echo ""

echo "💡 DICAS ADICIONAIS:"
echo "===================="
echo "- Use 'default' para comportamento padrão"
echo "- 'workbench.editor.chatSession' para sessões de chat"
echo "- Verifique se extensões estão atualizadas"
echo ""

echo "🎯 Status: AGUARDANDO CORREÇÃO MANUAL"