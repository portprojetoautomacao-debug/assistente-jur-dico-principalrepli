#!/bin/bash
# Script para analisar o Replit remotamente

echo "🔍 Análise Remota do Replit - Assistente Jurídico PJe"
echo "=" | tr '=' '=' | head -c 60 && echo

# Host Replit
HOST="3d18fe18-49cb-4d5c-b908-0599fc01a62c-00-39tn00ki6b5vd.picard.replit.dev"
USER="3d18fe18-49cb-4d5c-b908-0599fc01a62c"
KEY="/home/node/.ssh/replit"

# Função para executar comandos remotos
remote_exec() {
    ssh -i "$KEY" "$USER@$HOST" "$@"
}

echo "📡 1. Verificando conexão..."
remote_exec 'echo "✅ Conectado ao Replit" && pwd'

echo ""
echo "📁 2. Verificando estrutura do projeto..."
remote_exec 'cd /home/runner/workspace && ls -la | head -15'

echo ""
echo "🔧 3. Verificando processos Node.js..."
remote_exec 'ps aux | grep -E "(node|npm|tsx)" | grep -v grep'

echo ""
echo "🌐 4. Verificando portas em uso..."
remote_exec 'netstat -tlnp 2>/dev/null | grep -E "(3001|5000)" || lsof -i :3001 -i :5000 2>/dev/null'

echo ""
echo "💚 5. Testando health check..."
remote_exec 'curl -s http://localhost:3001/health 2>&1 | head -5'

echo ""
echo "📦 6. Verificando package.json..."
remote_exec 'cd /home/runner/workspace && cat package.json | grep -E "(name|version|scripts)" | head -10'

echo ""
echo "🔐 7. Verificando variáveis de ambiente..."
remote_exec 'cd /home/runner/workspace && ls -la .env* 2>/dev/null'

echo ""
echo "📝 8. Últimos logs (se houver)..."
remote_exec 'tail -20 /tmp/app.log 2>/dev/null || tail -20 /home/runner/workspace/backend/backend.log 2>/dev/null || echo "Nenhum log encontrado"'

echo ""
echo "✅ Análise concluída!"
