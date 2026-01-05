#!/bin/bash

# 🧠 Validador da Correção de Heap Out of Memory
# Verifica se NODE_OPTIONS foi adicionado aos workflows críticos

echo "🔍 Validando correção de memória nos workflows..."
echo ""

ERRORS=0
WARNINGS=0

# Workflows críticos que DEVEM ter NODE_OPTIONS
CRITICAL_WORKFLOWS=(
  ".github/workflows/ci.yml"
  ".github/workflows/build.yml"
  ".github/workflows/code-quality-analysis.yml"
)

# Workflows que PODEM precisar no futuro
OPTIONAL_WORKFLOWS=(
  ".github/workflows/sonarcloud.yml"
  ".github/workflows/performance-optimization.yml"
  ".github/workflows/advanced-tools.yml"
)

echo "📋 Verificando workflows críticos..."
for workflow in "${CRITICAL_WORKFLOWS[@]}"; do
  if [ ! -f "$workflow" ]; then
    echo "❌ Workflow não encontrado: $workflow"
    ((ERRORS++))
    continue
  fi

  if grep -q "NODE_OPTIONS.*--max-old-space-size" "$workflow"; then
    echo "✅ $workflow tem NODE_OPTIONS configurado"
  else
    echo "❌ $workflow FALTA NODE_OPTIONS"
    ((ERRORS++))
  fi
done

echo ""
echo "⚠️  Verificando workflows opcionais..."
for workflow in "${OPTIONAL_WORKFLOWS[@]}"; do
  if [ ! -f "$workflow" ]; then
    echo "⏭️  Workflow não encontrado (OK): $workflow"
    continue
  fi

  if grep -q "NODE_OPTIONS.*--max-old-space-size" "$workflow"; then
    echo "✅ $workflow tem NODE_OPTIONS configurado"
  else
    echo "⚠️  $workflow pode precisar de NODE_OPTIONS no futuro"
    ((WARNINGS++))
  fi
done

echo ""
echo "🔍 Verificando arquivo problemático..."
if [ -f "lib_agents_core_ml-optimization.ts" ]; then
  if grep -q "@tensorflow/tfjs-node" "lib_agents_core_ml-optimization.ts"; then
    echo "✅ Confirmado: lib_agents_core_ml-optimization.ts importa TensorFlow (causa raiz do problema)"
  fi
else
  echo "⚠️  Arquivo lib_agents_core_ml-optimization.ts não encontrado"
fi

echo ""
echo "📊 Resumo da Validação:"
echo "---------------------"
echo "Erros Críticos: $ERRORS"
echo "Avisos: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo "✅ Todos os workflows críticos estão corrigidos!"
  echo ""
  echo "ℹ️  O que foi feito:"
  echo "   • ci.yml: NODE_OPTIONS adicionado ao job build-and-test"
  echo "   • build.yml: NODE_OPTIONS adicionado ao job build"
  echo "   • code-quality-analysis.yml: NODE_OPTIONS adicionado a 3 jobs"
  echo ""
  echo "ℹ️  Por que isso foi necessário:"
  echo "   • lib_agents_core_ml-optimization.ts importa @tensorflow/tfjs-node (biblioteca pesada)"
  echo "   • Vite/esbuild precisa de mais memória para fazer bundle do TensorFlow"
  echo "   • NODE_OPTIONS aumenta heap de 4GB para 8GB"
  exit 0
else
  echo "❌ Ainda há $ERRORS problemas a corrigir!"
  exit 1
fi
