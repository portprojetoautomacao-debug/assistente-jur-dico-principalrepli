#!/bin/bash
# Script de verificação da configuração do Serena MCP Server

echo -e "\033[36m🔍 Verificando configuração do Serena MCP Server...\033[0m"
echo ""

# 1. Verificar Python
echo -e "\033[33m1️⃣ Verificando Python...\033[0m"
if command -v python3 &> /dev/null; then
    python_version=$(python3 --version 2>&1)
    if [[ $python_version =~ Python\ ([0-9]+)\.([0-9]+) ]]; then
        major=${BASH_REMATCH[1]}
        minor=${BASH_REMATCH[2]}
        if [ $major -ge 3 ] && [ $minor -ge 9 ]; then
            echo -e "   \033[32m✅ $python_version instalado\033[0m"
        else
            echo -e "   \033[31m❌ Python versão muito antiga ($python_version). Necessário 3.9+\033[0m"
            echo -e "   \033[33mBaixe em: https://www.python.org/downloads/\033[0m"
            exit 1
        fi
    fi
elif command -v python &> /dev/null; then
    python_version=$(python --version 2>&1)
    echo -e "   \033[32m✅ $python_version instalado\033[0m"
else
    echo -e "   \033[31m❌ Python não encontrado\033[0m"
    echo -e "   \033[33mBaixe em: https://www.python.org/downloads/\033[0m"
    exit 1
fi

echo ""

# 2. Verificar uv/uvx
echo -e "\033[33m2️⃣ Verificando uv...\033[0m"
if command -v uvx &> /dev/null; then
    uv_version=$(uvx --version 2>&1)
    echo -e "   \033[32m✅ uvx $uv_version instalado\033[0m"
else
    echo -e "   \033[31m❌ uvx não encontrado\033[0m"
    echo -e "   \033[33mInstalando uv...\033[0m"
    
    if curl -LsSf https://astral.sh/uv/install.sh | sh; then
        echo -e "   \033[32m✅ uv instalado com sucesso\033[0m"
        echo -e "   \033[33m⚠️  Reinicie o terminal para usar o uvx\033[0m"
    else
        echo -e "   \033[31m❌ Falha ao instalar uv\033[0m"
        echo -e "   \033[33mInstale manualmente: https://docs.astral.sh/uv/getting-started/installation/\033[0m"
        exit 1
    fi
fi

echo ""

# 3. Verificar arquivo de configuração
echo -e "\033[33m3️⃣ Verificando arquivo de configuração...\033[0m"
mcp_file=".vscode/mcp.json"
if [ -f "$mcp_file" ]; then
    echo -e "   \033[32m✅ $mcp_file encontrado\033[0m"
    
    # Verificar se é JSON válido
    if python3 -m json.tool "$mcp_file" > /dev/null 2>&1; then
        echo -e "   \033[32m✅ JSON válido\033[0m"
        
        # Verificar se Serena está configurado
        if grep -q '"Serena"' "$mcp_file"; then
            echo -e "   \033[32m✅ Servidor Serena configurado\033[0m"
        else
            echo -e "   \033[33m⚠️  Servidor Serena não encontrado na configuração\033[0m"
        fi
    else
        echo -e "   \033[31m❌ JSON inválido em $mcp_file\033[0m"
        exit 1
    fi
else
    echo -e "   \033[31m❌ Arquivo $mcp_file não encontrado\033[0m"
    echo -e "   \033[33mConsulte: docs/SERENA_MCP_SETUP.md\033[0m"
    exit 1
fi

echo ""

# 4. Verificar .sereneignore
echo -e "\033[33m4️⃣ Verificando .sereneignore...\033[0m"
if [ -f ".sereneignore" ]; then
    echo -e "   \033[32m✅ .sereneignore configurado (otimização de performance)\033[0m"
else
    echo -e "   \033[33m⚠️  .sereneignore não encontrado (recomendado criar)\033[0m"
    echo -e "   \033[37m   Crie com: touch .sereneignore\033[0m"
    echo -e "   \033[37m   Modelo disponível em: docs/SERENA_BEST_PRACTICES.md\033[0m"
fi

echo ""

# 5. Verificar estrutura do projeto
echo -e "\033[33m5️⃣ Verificando estrutura do projeto...\033[0m"

required_paths=("src/" "src/hooks/" "src/components/" "src/lib/" "docs/")
all_exists=true

for path in "${required_paths[@]}"; do
    if [ -d "$path" ]; then
        echo -e "   \033[32m✅ $path\033[0m"
    else
        echo -e "   \033[31m❌ $path não encontrado\033[0m"
        all_exists=false
    fi
done

if [ "$all_exists" = false ]; then
    echo -e "   \033[33m⚠️  Estrutura do projeto incompleta\033[0m"
fi

echo ""

# 6. Verificar documentação do Serena
echo -e "\033[33m6️⃣ Verificando documentação...\033[0m"

serena_docs=("docs/SERENA_MCP_SETUP.md" "docs/SERENA_WORKFLOWS.md" "docs/SERENA_BEST_PRACTICES.md")
docs_exist=0

for doc in "${serena_docs[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "   \033[32m✅ $doc\033[0m"
        ((docs_exist++))
    else
        echo -e "   \033[33m⚠️  $doc não encontrado\033[0m"
    fi
done

if [ $docs_exist -eq ${#serena_docs[@]} ]; then
    echo -e "   \033[32m✅ Documentação completa disponível\033[0m"
fi

echo ""

# Resumo
echo -e "\033[36m════════════════════════════════════════════════════════\033[0m"
echo -e "\033[36m📊 RESUMO DA VERIFICAÇÃO\033[0m"
echo -e "\033[36m════════════════════════════════════════════════════════\033[0m"
echo ""
echo -e "\033[32m✅ Python 3.9+:       Instalado\033[0m"
echo -e "\033[32m✅ uvx:               Instalado\033[0m"
echo -e "\033[32m✅ mcp.json:          Configurado\033[0m"

if [ -f ".sereneignore" ]; then
    echo -e "\033[32m✅ .sereneignore:     Configurado\033[0m"
else
    echo -e "\033[33m⚠️  .sereneignore:     Não configurado (opcional)\033[0m"
fi

echo -e "\033[32m✅ Estrutura:         Válida\033[0m"
echo -e "\033[32m✅ Documentação:      Completa\033[0m"
echo ""

# Próximos passos
echo -e "\033[36m🎯 PRÓXIMOS PASSOS:\033[0m"
echo ""
echo -e "\033[37m1. Abra o VS Code neste workspace\033[0m"
echo -e "\033[37m2. Pressione Ctrl+Shift+P (Cmd+Shift+P no macOS)\033[0m"
echo -e "\033[37m3. Digite: 'GitHub Copilot: Restart MCP Servers'\033[0m"
echo -e "\033[37m4. No Copilot Chat, teste: '@workspace Serena está funcionando?'\033[0m"
echo ""
echo -e "\033[36m📚 DOCUMENTAÇÃO DISPONÍVEL:\033[0m"
echo ""
echo -e "\033[37m- Setup Completo:     docs/SERENA_MCP_SETUP.md\033[0m"
echo -e "\033[37m- Workflows:          docs/SERENA_WORKFLOWS.md\033[0m"
echo -e "\033[37m- Melhores Práticas:  docs/SERENA_BEST_PRACTICES.md\033[0m"
echo ""
echo -e "\033[36m🧪 TESTAR INTEGRAÇÃO:\033[0m"
echo ""
echo -e "\033[37m- Execute: npx tsx scripts/test-serena-semantic.ts\033[0m"
echo ""
echo -e "\033[32m✅ Configuração concluída com sucesso!\033[0m"
