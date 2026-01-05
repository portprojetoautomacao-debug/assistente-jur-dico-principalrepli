#!/bin/bash
# Build dos agentes TypeScript para JavaScript

echo "🔨 Compilando agentes TypeScript → JavaScript..."

# Instalar dependências se necessário
if [ ! -d "node_modules/@anthropic-ai" ]; then
  echo "📦 Instalando Anthropic SDK..."
  npm install @anthropic-ai/sdk
fi

# Compilar TypeScript
echo "⚙️  Compilando src/agents/**/*.ts..."
npx tsc --project tsconfig.json

# Verificar sucesso
if [ $? -eq 0 ]; then
  echo "✅ Agentes compilados com sucesso!"
  echo ""
  echo "📁 Arquivos gerados:"
  find src/agents -name "*.js" -type f | head -5
else
  echo "❌ Erro na compilação"
  exit 1
fi

echo ""
echo "🚀 Pronto! Agora execute: cd backend && npm run dev"
