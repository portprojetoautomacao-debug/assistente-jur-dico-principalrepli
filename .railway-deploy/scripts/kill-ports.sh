#!/bin/bash
# Kill processes using specific ports before E2E tests
# This prevents "EADDRINUSE" errors

PORTS=(5173 5252)

echo "🔍 Verificando portas em uso..."

for PORT in "${PORTS[@]}"; do
  echo "Verificando porta $PORT..."

  # Tentar fuser (Linux)
  if command -v fuser &> /dev/null; then
    fuser -k ${PORT}/tcp 2>/dev/null && echo "✅ Porta $PORT liberada (fuser)" || echo "ℹ️  Porta $PORT já livre"
  # Tentar lsof (macOS/Linux)
  elif command -v lsof &> /dev/null; then
    PID=$(lsof -ti:${PORT})
    if [ ! -z "$PID" ]; then
      kill -9 $PID 2>/dev/null && echo "✅ Porta $PORT liberada (lsof)" || echo "⚠️  Falha ao liberar porta $PORT"
    else
      echo "ℹ️  Porta $PORT já livre"
    fi
  # Fallback: netstat + kill (universal)
  else
    PID=$(netstat -nlp 2>/dev/null | grep ":${PORT}" | awk '{print $7}' | cut -d'/' -f1)
    if [ ! -z "$PID" ]; then
      kill -9 $PID 2>/dev/null && echo "✅ Porta $PORT liberada (netstat)" || echo "⚠️  Falha ao liberar porta $PORT"
    else
      echo "ℹ️  Porta $PORT já livre"
    fi
  fi
done

echo "✅ Verificação de portas concluída"
exit 0
