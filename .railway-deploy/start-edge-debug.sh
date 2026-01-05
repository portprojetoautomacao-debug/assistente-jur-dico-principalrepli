#!/bin/bash
# Script para iniciar Edge em modo debug manual

echo "🚀 Iniciando Microsoft Edge em modo debug..."

# Matar processos Edge anteriores
pkill -f microsoft-edge 2>/dev/null || true
sleep 1

# Criar diretório de debug
mkdir -p .edge-debug-manual

# Iniciar Edge headless com debug
/usr/bin/microsoft-edge \
  --headless=new \
  --no-sandbox \
  --disable-gpu \
  --disable-dev-shm-usage \
  --disable-software-rasterizer \
  --remote-debugging-port=9223 \
  --user-data-dir="$(pwd)/.edge-debug-manual" \
  http://localhost:5173 &

EDGE_PID=$!

echo "✅ Edge iniciado (PID: $EDGE_PID)"
echo "📡 Debug port: 9223"
echo ""
echo "🔍 Para debugar:"
echo "   1. No VS Code, vá em Run and Debug (Ctrl+Shift+D)"
echo "   2. Selecione '🔗 Attach to Edge (9223)'"
echo "   3. Clique no botão Play ▶️"
echo ""
echo "🛑 Para parar: pkill -f microsoft-edge"
echo ""
echo "⏳ Aguardando conexão debug..."

# Manter script rodando
wait $EDGE_PID
