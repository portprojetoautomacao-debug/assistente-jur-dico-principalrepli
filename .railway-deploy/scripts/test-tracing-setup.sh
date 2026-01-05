#!/usr/bin/env bash

# =============================================================================
# Script de Teste - Tracing com AI Toolkit
# =============================================================================
# Este script valida a configuração do tracing e exportação de traces
# para o AI Toolkit Trace Viewer na porta 4319.
#
# Uso: ./scripts/test-tracing-setup.sh
# =============================================================================

set -e

echo "🔍 Validando configuração de Tracing..."
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# 1. Verificar .env.local
# ============================================================================
echo "1️⃣ Verificando .env.local..."

if [ ! -f ".env.local" ]; then
  echo -e "${RED}❌ Arquivo .env.local não encontrado${NC}"
  exit 1
fi

OTLP_ENDPOINT=$(grep "VITE_OTLP_ENDPOINT" .env.local | cut -d '=' -f2)

if [ "$OTLP_ENDPOINT" == "http://localhost:4319/v1/traces" ]; then
  echo -e "${GREEN}✅ Endpoint OTLP configurado corretamente: $OTLP_ENDPOINT${NC}"
else
  echo -e "${RED}❌ Endpoint OTLP incorreto: $OTLP_ENDPOINT${NC}"
  echo -e "${YELLOW}   Esperado: http://localhost:4319/v1/traces${NC}"
  exit 1
fi

echo ""

# ============================================================================
# 2. Verificar porta 4319
# ============================================================================
echo "2️⃣ Verificando se porta 4319 está em uso (AI Toolkit)..."

if netstat -ano | findstr ":4319" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Porta 4319 está em uso (AI Toolkit rodando)${NC}"
else
  echo -e "${YELLOW}⚠️  Porta 4319 não está em uso${NC}"
  echo -e "${YELLOW}   Execute no VS Code: Ctrl+Shift+P → 'AI Toolkit: Open Trace Viewer'${NC}"
fi

echo ""

# ============================================================================
# 3. Verificar arquivos de tracing
# ============================================================================
echo "3️⃣ Verificando arquivos de tracing..."

TRACING_FILES=(
  "src/lib/otel-integration.ts"
  "src/lib/tracing.ts"
  "src/lib/agent-tracing.ts"
  "src/main.tsx"
)

ALL_FILES_OK=true

for file in "${TRACING_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ $file${NC}"
  else
    echo -e "${RED}❌ $file não encontrado${NC}"
    ALL_FILES_OK=false
  fi
done

if [ "$ALL_FILES_OK" = false ]; then
  exit 1
fi

echo ""

# ============================================================================
# 4. Verificar inicialização no main.tsx
# ============================================================================
echo "4️⃣ Verificando inicialização do OpenTelemetry..."

if grep -q "initializeOpenTelemetry()" src/main.tsx; then
  echo -e "${GREEN}✅ OpenTelemetry inicializado no main.tsx${NC}"
else
  echo -e "${RED}❌ initializeOpenTelemetry() não encontrado em main.tsx${NC}"
  exit 1
fi

echo ""

# ============================================================================
# 5. Verificar dependências npm
# ============================================================================
echo "5️⃣ Verificando dependências OpenTelemetry..."

OTEL_PACKAGES=(
  "@opentelemetry/api"
  "@opentelemetry/sdk-trace-web"
  "@opentelemetry/exporter-trace-otlp-http"
  "@opentelemetry/resources"
  "@opentelemetry/semantic-conventions"
)

for package in "${OTEL_PACKAGES[@]}"; do
  if npm list "$package" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ $package${NC}"
  else
    echo -e "${RED}❌ $package não instalado${NC}"
    echo -e "${YELLOW}   Execute: npm install${NC}"
    exit 1
  fi
done

echo ""

# ============================================================================
# 6. Teste de conectividade OTLP (opcional)
# ============================================================================
echo "6️⃣ Testando conectividade com endpoint OTLP..."

# Apenas alerta se não conseguir conectar (não falha o script)
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4319/health 2>&1 | grep -q "000"; then
  echo -e "${YELLOW}⚠️  Não foi possível conectar a http://localhost:4319${NC}"
  echo -e "${YELLOW}   Certifique-se de que o AI Toolkit Trace Viewer está rodando${NC}"
else
  echo -e "${GREEN}✅ Endpoint OTLP acessível${NC}"
fi

echo ""

# ============================================================================
# 7. Resumo
# ============================================================================
echo "========================================="
echo -e "${GREEN}✅ Configuração de Tracing VÁLIDA!${NC}"
echo "========================================="
echo ""
echo "📊 Próximos Passos:"
echo ""
echo "1. Iniciar AI Toolkit Trace Viewer:"
echo "   VS Code → Ctrl+Shift+P → 'AI Toolkit: Open Trace Viewer'"
echo ""
echo "2. Iniciar aplicação:"
echo "   npm run dev"
echo ""
echo "3. Executar ações dos agentes:"
echo "   - Criar intimação"
echo "   - Gerar minuta com IA"
echo "   - Pesquisar jurisprudência"
echo ""
echo "4. Visualizar traces no AI Toolkit"
echo ""
echo "📚 Documentação: docs/TRACING_VISUALIZATION_GUIDE.md"
echo ""
