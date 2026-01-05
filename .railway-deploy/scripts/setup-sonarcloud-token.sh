#!/bin/bash
# Setup SonarCloud Token para SonarLint
# Este script configura o token do SonarCloud nas User Settings do VS Code

set -e

echo "🔑 Setup SonarCloud Token"
echo "=========================="
echo ""
echo "Este script irá configurar o token do SonarCloud para o SonarLint."
echo ""
echo "📋 Passos:"
echo "1. Acesse: https://sonarcloud.io/account/security"
echo "2. Gere um USER token (não project token)"
echo "3. Cole o token quando solicitado"
echo ""

# Solicitar token
read -sp "Digite o token do SonarCloud: " SONAR_TOKEN
echo ""

if [ -z "$SONAR_TOKEN" ]; then
  echo "❌ Token vazio. Cancelando."
  exit 1
fi

# Determinar o caminho do settings.json de usuário
if [ -d "$HOME/.vscode-server" ]; then
  SETTINGS_DIR="$HOME/.vscode-server/data/Machine"
elif [ -d "$HOME/.vscode" ]; then
  SETTINGS_DIR="$HOME/.vscode"
else
  echo "❌ Não foi possível encontrar o diretório de configurações do VS Code."
  exit 1
fi

SETTINGS_FILE="$SETTINGS_DIR/settings.json"

# Criar diretório se não existir
mkdir -p "$SETTINGS_DIR"

# Criar arquivo de settings se não existir
if [ ! -f "$SETTINGS_FILE" ]; then
  echo "{}" > "$SETTINGS_FILE"
fi

# Adicionar token ao settings.json
if command -v jq &> /dev/null; then
  # Usar jq se disponível
  jq --arg token "$SONAR_TOKEN" \
    '.["sonarlint.connectedMode.connections.sonarcloud"] = [{
      "organizationKey": "thiagobodevan-a11y-assistente-juridico-p",
      "token": $token
    }]' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp"
  mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
else
  # Fallback: adicionar manualmente
  echo ""
  echo "⚠️  jq não disponível. Por favor, adicione manualmente:"
  echo ""
  echo "Adicione no arquivo $SETTINGS_FILE:"
  echo ""
  echo '  "sonarlint.connectedMode.connections.sonarcloud": ['
  echo '    {'
  echo '      "organizationKey": "thiagobodevan-a11y-assistente-juridico-p",'
  echo "      \"token\": \"$SONAR_TOKEN\""
  echo '    }'
  echo '  ]'
  echo ""
  exit 1
fi

echo ""
echo "✅ Token configurado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Recarregue a janela do VS Code (Ctrl+Shift+P → 'Reload Window')"
echo "2. Execute: SonarLint: Update all project bindings to SonarCloud"
echo "3. Verifique a conexão em: SonarLint Output"
echo ""
