#!/bin/bash
#
# Script para limpar portas usadas pelos testes E2E
# Evita erros EADDRINUSE ao executar múltiplas tentativas de teste
#

set +e  # Não falhar se os comandos de kill retornarem erro

echo "🧹 Limpando portas usadas pelos testes E2E..."

# Portas padrão usadas
VITE_PORT=${PORT:-5173}
API_PORT=${DEV_API_PORT:-5252}

# Função para matar processos em uma porta
kill_port() {
  local port=$1
  echo "Verificando porta $port..."
  
  # Usar fuser se disponível (Linux)
  if command -v fuser &> /dev/null; then
    fuser -k ${port}/tcp 2>/dev/null || true
  fi
  
  # Usar lsof como fallback (macOS/Linux)
  if command -v lsof &> /dev/null; then
    local pids=$(lsof -ti:${port} 2>/dev/null || true)
    if [ -n "$pids" ]; then
      echo "  Matando processos: $pids"
      kill -9 $pids 2>/dev/null || true
    else
      echo "  Porta $port está livre"
    fi
  fi
}

# Limpar portas
kill_port $VITE_PORT
kill_port $API_PORT

# Aguardar um pouco para garantir que as portas foram liberadas
sleep 1

echo "✅ Portas limpas com sucesso!"
exit 0  # Sempre retornar sucesso
