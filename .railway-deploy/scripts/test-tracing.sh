#!/bin/bash
# Script para testar configuração de tracing OpenTelemetry
# Uso: bash scripts/test-tracing.sh

set -e

echo "🔍 Testando Configuração de Tracing OpenTelemetry..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar variável de ambiente
check_env_var() {
    local var_name=$1
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ $var_name não configurado${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $var_name configurado${NC}"
        echo "   Valor: $var_value"
        return 0
    fi
}

# Carregar variáveis do .env.local se existir
if [ -f .env.local ]; then
    echo "📂 Carregando .env.local..."
    set -a
    source .env.local
    set +a
    echo ""
else
    echo -e "${YELLOW}⚠️  Arquivo .env.local não encontrado${NC}"
    echo "   Copie .env.local.example para .env.local e configure"
    echo ""
fi

# Verificar VITE_OTLP_ENDPOINT
echo "1️⃣  Verificando VITE_OTLP_ENDPOINT..."
if check_env_var "VITE_OTLP_ENDPOINT"; then
    ENDPOINT=$VITE_OTLP_ENDPOINT
    
    # Extrair host e porta do endpoint
    if [[ $ENDPOINT =~ http://([^:]+):([0-9]+) ]]; then
        HOST="${BASH_REMATCH[1]}"
        PORT="${BASH_REMATCH[2]}"
        
        echo ""
        echo "2️⃣  Testando conectividade com $HOST:$PORT..."
        
        # Verificar se é localhost
        if [ "$HOST" = "localhost" ] || [ "$HOST" = "127.0.0.1" ]; then
            # Testar se porta está aberta
            if command -v nc &> /dev/null; then
                if nc -z $HOST $PORT 2>/dev/null; then
                    echo -e "${GREEN}✅ Porta $PORT está aberta em $HOST${NC}"
                    echo "   AI Toolkit Trace Viewer provavelmente está rodando"
                else
                    echo -e "${RED}❌ Porta $PORT está fechada em $HOST${NC}"
                    echo -e "${YELLOW}⚠️  Ative o AI Toolkit Trace Viewer:${NC}"
                    echo "   1. Pressione Ctrl+Shift+P (ou Cmd+Shift+P no Mac)"
                    echo "   2. Digite: AI Toolkit: Open Trace Viewer"
                    echo "   3. Pressione Enter"
                fi
            else
                echo -e "${YELLOW}⚠️  Comando 'nc' não disponível para testar porta${NC}"
                echo "   Instale: apt-get install netcat (Linux) ou brew install netcat (Mac)"
            fi
        else
            # Endpoint externo - tentar ping
            echo "   Endpoint externo detectado: $HOST"
            if ping -c 1 $HOST &> /dev/null; then
                echo -e "${GREEN}✅ Host $HOST está acessível${NC}"
            else
                echo -e "${RED}❌ Host $HOST não está acessível${NC}"
                echo "   Verifique sua conexão de rede"
            fi
        fi
    elif [[ $ENDPOINT =~ https://([^/]+) ]]; then
        HOST="${BASH_REMATCH[1]}"
        echo ""
        echo "2️⃣  Testando conectividade HTTPS com $HOST..."
        
        # Tentar curl se disponível
        if command -v curl &> /dev/null; then
            if curl -s --head --request GET "$ENDPOINT" | grep "200\|301\|302\|401\|403" > /dev/null; then
                echo -e "${GREEN}✅ Endpoint HTTPS acessível${NC}"
            else
                echo -e "${YELLOW}⚠️  Endpoint retornou resposta inesperada${NC}"
                echo "   Endpoint pode ainda estar correto (alguns coletores não respondem a GET)"
            fi
        else
            echo -e "${YELLOW}⚠️  Comando 'curl' não disponível${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Formato de endpoint não reconhecido: $ENDPOINT${NC}"
    fi
else
    echo ""
    echo -e "${YELLOW}⚠️  Configure VITE_OTLP_ENDPOINT no .env.local${NC}"
    echo ""
    echo "Exemplos:"
    echo "  # Desenvolvimento (AI Toolkit):"
    echo "  VITE_OTLP_ENDPOINT=http://localhost:4318/v1/traces"
    echo ""
    echo "  # Produção (Azure Monitor):"
    echo "  VITE_OTLP_ENDPOINT=https://YOUR-REGION.monitor.azure.com/v1/traces"
fi

echo ""
echo "3️⃣  Verificando dependências OpenTelemetry..."

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ node_modules não encontrado${NC}"
    echo "   Execute: npm install"
    exit 1
fi

# Verificar pacotes OpenTelemetry
REQUIRED_PACKAGES=(
    "@opentelemetry/api"
    "@opentelemetry/sdk-trace-web"
    "@opentelemetry/exporter-trace-otlp-http"
    "@opentelemetry/resources"
    "@opentelemetry/semantic-conventions"
)

MISSING_PACKAGES=()

for package in "${REQUIRED_PACKAGES[@]}"; do
    if [ -d "node_modules/$package" ]; then
        echo -e "${GREEN}✅ $package instalado${NC}"
    else
        echo -e "${RED}❌ $package NÃO instalado${NC}"
        MISSING_PACKAGES+=("$package")
    fi
done

if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ Pacotes faltando. Execute:${NC}"
    echo "   npm install"
    exit 1
fi

echo ""
echo "4️⃣  Verificando arquivos de tracing..."

TRACING_FILES=(
    "src/lib/otel-integration.ts"
    "src/lib/tracing.ts"
    "src/lib/agent-tracing.ts"
    "src/components/TracingDashboard.tsx"
)

for file in "${TRACING_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file existe${NC}"
    else
        echo -e "${RED}❌ $file NÃO encontrado${NC}"
    fi
done

echo ""
echo "5️⃣  Verificando inicialização em main.tsx..."

if grep -q "initializeOpenTelemetry" src/main.tsx; then
    echo -e "${GREEN}✅ OpenTelemetry inicializado em main.tsx${NC}"
else
    echo -e "${RED}❌ initializeOpenTelemetry NÃO encontrado em main.tsx${NC}"
    echo "   Adicione no início do arquivo:"
    echo ""
    echo "   import { initializeOpenTelemetry } from './lib/otel-integration';"
    echo "   initializeOpenTelemetry();"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ${#MISSING_PACKAGES[@]} -eq 0 ] && [ -n "$VITE_OTLP_ENDPOINT" ]; then
    echo -e "${GREEN}✅ Configuração de tracing parece estar OK!${NC}"
    echo ""
    echo "📚 Próximos passos:"
    echo "   1. Execute: npm run dev"
    echo "   2. Ative o AI Toolkit: Ctrl+Shift+P → 'AI Toolkit: Open Trace Viewer'"
    echo "   3. Navegue no sistema e veja os traces em tempo real!"
    echo ""
    echo "📖 Documentação completa: docs/TRACING_SETUP.md"
else
    echo -e "${RED}❌ Alguns problemas foram encontrados${NC}"
    echo ""
    echo "Corrija os itens acima e execute novamente:"
    echo "   bash scripts/test-tracing.sh"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
