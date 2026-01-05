#!/usr/bin/env bash
set -euo pipefail

# Script para iniciar o GitHub MCP Server via Docker.
# Ajuste TOOLSETS e TOOLS conforme necessário para seu ambiente.

GITHUB_MCP_PAT=${GITHUB_MCP_PAT:-}
GITHUB_HOST=${GITHUB_HOST:-https://github.com}
GITHUB_TOOLSETS=${GITHUB_TOOLSETS:-"repos,issues,pull_requests,actions,code_security,users"}
GITHUB_TOOLS=${GITHUB_TOOLS:-}

if [[ -z "$GITHUB_MCP_PAT" ]]; then
  echo "Erro: GITHUB_MCP_PAT não está definido. Exporte a variável com seu PAT ou use .env."
  echo "Ex: export GITHUB_MCP_PAT=ghp_xxx"
  exit 1
fi

echo "Iniciando GitHub MCP Server (Docker)..."
echo "HOST: $GITHUB_HOST"
echo "TOOLSETS: $GITHUB_TOOLSETS"

docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_MCP_PAT" \
  -e GITHUB_HOST="$GITHUB_HOST" \
  -e GITHUB_TOOLSETS="$GITHUB_TOOLSETS" \
  -e GITHUB_TOOLS="$GITHUB_TOOLS" \
  ghcr.io/github/github-mcp-server

# Nota: para GitHub Enterprise, defina GITHUB_HOST com o URI completo https://ghe.example.com
## Para executar em modo read-only, adicione: -e GITHUB_READ_ONLY=1
