#!/bin/bash
# Script para iniciar o backend no Replit remotamente via SSH

HOST="3d18fe18-49cb-4d5c-b908-0599fc01a62c-00-39tn00ki6b5vd.picard.replit.dev"
USER="3d18fe18-49cb-4d5c-b908-0599fc01a62c"
KEY="$HOME/.ssh/replit"

echo "🚀 Iniciando backend no Replit..."

ssh -o StrictHostKeyChecking=no -i "$KEY" -p 22 "$USER@$HOST" << 'ENDSSH'
cd /home/runner/workspace

echo "📦 Verificando dependências..."
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "Instalando dependências do backend..."
    cd backend && npm install && cd ..
fi

echo "🔨 Building aplicação..."
npm run build:deploy

echo "🚀 Iniciando servidor em modo produção..."
npm run start:production &

sleep 5

echo "✅ Verificando status..."
curl -s http://localhost:3001/health

ENDSSH

echo ""
echo "✅ Comandos enviados! Aguarde 30 segundos e teste:"
echo "   https://3d18fe18-49cb-4d5c-b908-0599fc01a62c-00-39tn00ki6b5vd.picard.replit.dev/health"
