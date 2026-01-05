#!/bin/bash
# Execute este script diretamente no terminal do Replit

echo "🚀 Iniciando Assistente Jurídico PJe em Modo Produção"
echo "=" x 60

# Parar processos antigos
echo "🛑 Parando processos antigos..."
pkill -f "node.*tsx" || true
pkill -f "vite" || true
lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:5000 2>/dev/null | xargs kill -9 2>/dev/null || true

# Garantir dependências
echo "📦 Verificando dependências..."
npm install --silent

cd backend
npm install --silent
cd ..

# Build
echo "🔨 Building aplicação..."
npm run build:deploy

# Iniciar
echo "🚀 Iniciando servidor..."
nohup npm run start:production > /tmp/app.log 2>&1 &

# Aguardar
echo "⏳ Aguardando inicialização (10 segundos)..."
sleep 10

# Verificar
echo "✅ Testando health check..."
curl -s http://localhost:3001/health | jq '.' 2>/dev/null || curl -s http://localhost:3001/health

echo ""
echo "🎉 Aplicação iniciada!"
echo "📍 URL Pública: https://3d18fe18-49cb-4d5c-b908-0599fc01a62c-00-39tn00ki6b5vd.picard.replit.dev"
echo "📋 Logs: tail -f /tmp/app.log"
