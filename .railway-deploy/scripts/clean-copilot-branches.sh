#!/bin/bash
# Script para deletar branches copilot/* obsoletas

echo "🗑️ LIMPEZA DE BRANCHES COPILOT OBSOLETAS"
echo "========================================"
echo ""

# Contar total de branches copilot
TOTAL=$(git branch -r | grep "origin/copilot/" | wc -l)
echo "📊 Total de branches copilot/ encontradas: $TOTAL"
echo ""

# Listar todas as branches copilot
echo "📋 Listando branches copilot/* remotas:"
echo "--------------------------------------"
git branch -r | grep "origin/copilot/" | sed 's/  origin\///' | nl
echo ""

# Perguntar confirmação
read -p "⚠️  Deseja deletar TODAS estas $TOTAL branches copilot/*? (digite 'SIM' para confirmar): " confirmacao

if [[ "$confirmacao" != "SIM" ]]; then
    echo "❌ Operação cancelada pelo usuário."
    echo ""
    echo "💡 Para deletar manualmente, use:"
    echo "   git push origin --delete copilot/<nome-da-branch>"
    exit 0
fi

echo ""
echo "🚀 Iniciando deleção de $TOTAL branches..."
echo "--------------------------------------"
echo ""

# Contador
SUCCESS=0
FAILED=0

# Deletar cada branch
git branch -r | grep "origin/copilot/" | sed 's/  origin\///' | while read branch; do
    echo "🗑️  Deletando: $branch"
    
    if git push origin --delete "$branch" 2>&1 | grep -q "deleted"; then
        ((SUCCESS++))
        echo "   ✅ Deletada com sucesso"
    else
        ((FAILED++))
        echo "   ❌ Falha ao deletar"
    fi
    
    # Pequeno delay para evitar rate limiting
    sleep 0.5
done

echo ""
echo "========================================"
echo "✅ LIMPEZA CONCLUÍDA!"
echo ""
echo "📊 Estatísticas:"
echo "   Total processadas: $TOTAL"
echo "   Sucesso: $SUCCESS"
echo "   Falhas: $FAILED"
echo ""
echo "💡 Para verificar branches restantes:"
echo "   git fetch --prune origin"
echo "   git branch -r | grep 'origin/copilot/'"
echo "========================================"
