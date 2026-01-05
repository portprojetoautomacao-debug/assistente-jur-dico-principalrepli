#!/bin/bash
# 🧪 Master E2E Test Runner
# Executa todos os testes end-to-end do sistema em sequência

set -e  # Sair em caso de erro

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🧪 TESTES END-TO-END COMPLETOS - Assistente Jurídico PJe   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Iniciado em: $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Criar diretório para relatórios
mkdir -p test-reports

# Função para log com timestamp
log() {
  echo "[$(date '+%H:%M:%S')] $1"
}

# Função para executar teste e registrar resultado
run_test() {
  local test_name="$1"
  local test_command="$2"
  local optional="$3"
  
  echo ""
  log "▶️  $test_name"
  echo "────────────────────────────────────────────────────────────────"
  
  if eval "$test_command"; then
    log "✅ $test_name: PASSOU"
    echo "$test_name,PASS,$(date '+%Y-%m-%d %H:%M:%S')" >> test-reports/master-e2e.csv
    return 0
  else
    if [ "$optional" = "optional" ]; then
      log "⚠️  $test_name: FALHOU (opcional - continuando)"
      echo "$test_name,WARN,$(date '+%Y-%m-%d %H:%M:%S')" >> test-reports/master-e2e.csv
      return 0
    else
      log "❌ $test_name: FALHOU (crítico)"
      echo "$test_name,FAIL,$(date '+%Y-%m-%d %H:%M:%S')" >> test-reports/master-e2e.csv
      return 1
    fi
  fi
}

# Inicializar CSV de relatório
echo "Test,Status,Timestamp" > test-reports/master-e2e.csv

# ============================================================================
# 1. VALIDAÇÃO DE AMBIENTE
# ============================================================================

log "📦 Fase 1: Validação de Ambiente"
echo "════════════════════════════════════════════════════════════════"

run_test "Node.js Version" "node --version | grep -E 'v(18|19|20|21|22|23|24)'"
run_test "npm Version" "npm --version"
run_test "TypeScript Instalado" "npx tsc --version"

# ============================================================================
# 2. VERIFICAÇÃO DE CONFIGURAÇÃO
# ============================================================================

log "🔐 Fase 2: Verificação de Configuração"
echo "════════════════════════════════════════════════════════════════"

if [ -f ".env" ]; then
  log "✅ Arquivo .env encontrado"
  
  # Verificar variáveis críticas (sem expor valores)
  if grep -q "VITE_GEMINI_API_KEY" .env 2>/dev/null; then
    log "✅ VITE_GEMINI_API_KEY configurada"
  else
    log "⚠️  VITE_GEMINI_API_KEY não encontrada em .env"
  fi
  
  if grep -q "UPSTASH_REDIS_REST_URL" .env 2>/dev/null; then
    log "✅ UPSTASH_REDIS_REST_URL configurada"
  else
    log "⚠️  UPSTASH_REDIS_REST_URL não encontrada em .env"
  fi
else
  log "⚠️  Arquivo .env não encontrado (pode usar variáveis de ambiente do sistema)"
fi

# ============================================================================
# 3. TYPE CHECK
# ============================================================================

log "🔨 Fase 3: TypeScript Type Check"
echo "════════════════════════════════════════════════════════════════"

run_test "TypeScript Type Check" "npm run type-check" "optional"

# ============================================================================
# 4. LINTING
# ============================================================================

log "🧹 Fase 4: ESLint"
echo "════════════════════════════════════════════════════════════════"

run_test "ESLint Check" "npm run lint" "optional"

# ============================================================================
# 5. TESTES UNITÁRIOS
# ============================================================================

log "🧪 Fase 5: Testes Unitários e Integração"
echo "════════════════════════════════════════════════════════════════"

run_test "Testes Unit

ários (Vitest)" "npm run test:run"

# ============================================================================
# 6. TESTES DE API
# ============================================================================

log "🌐 Fase 6: Testes de API"
echo "════════════════════════════════════════════════════════════════"

run_test "Testes de API" "npm run test:api" "optional"

# ============================================================================
# 7. TESTES DA EXTENSÃO CHROME
# ============================================================================

log "🔌 Fase 7: Testes Extensão Chrome"
echo "════════════════════════════════════════════════════════════════"

if [ -d "chrome-extension-pje" ]; then
  run_test "Testes Extensão Chrome PJe" "npm run test:chrome" "optional"
else
  log "⚠️  Diretório chrome-extension-pje não encontrado (pulando)"
fi

# ============================================================================
# 8. BUILD DE PRODUÇÃO
# ============================================================================

log "🏗️  Fase 8: Build de Produção"
echo "════════════════════════════════════════════════════════════════"

run_test "Build de Produção" "npm run build"

if [ -d "dist" ]; then
  log "✅ Diretório dist/ criado com sucesso"
  
  # Verificar se index.html foi gerado
  if [ -f "dist/index.html" ]; then
    log "✅ index.html gerado"
  else
    log "❌ index.html NÃO encontrado em dist/"
  fi
  
  # Listar tamanho dos bundles
  log "📊 Tamanho dos bundles principais:"
  find dist/assets -name "*.js" -type f -exec du -h {} \; | sort -hr | head -n 5 || true
else
  log "❌ Diretório dist/ NÃO foi criado"
fi

# ============================================================================
# 9. SERENA MCP (se configurado)
# ============================================================================

log "🔍 Fase 9: Verificação Serena MCP"
echo "════════════════════════════════════════════════════════════════"

if command -v pwsh &> /dev/null; then
  run_test "Serena MCP Verification" "npm run setup:mcp" "optional"
else
  log "⚠️  PowerShell não disponível (pulando verificação Serena)"
fi

# ============================================================================
# RELATÓRIO FINAL
# ============================================================================

echo ""
echo "════════════════════════════════════════════════════════════════"
log "📊 RELATÓRIO FINAL"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Contar resultados
TOTAL=$(wc -l < test-reports/master-e2e.csv)
TOTAL=$((TOTAL - 1))  # Remover header
PASSED=$(grep -c ",PASS," test-reports/master-e2e.csv || echo 0)
FAILED=$(grep -c ",FAIL," test-reports/master-e2e.csv || echo 0)
WARNED=$(grep -c ",WARN," test-reports/master-e2e.csv || echo 0)

echo "Total de Testes:  $TOTAL"
echo "✅ Passou:        $PASSED"
echo "❌ Falhou:        $FAILED"
echo "⚠️  Warnings:      $WARNED"
echo ""

# Calcular porcentagem
if [ $TOTAL -gt 0 ]; then
  SUCCESS_RATE=$(( (PASSED * 100) / TOTAL ))
  echo "Taxa de Sucesso:  ${SUCCESS_RATE}%"
fi

echo ""
log "Relatório completo salvo em: test-reports/master-e2e.csv"
log "Build artifacts em: dist/"
echo ""

# Mostrar testes falhados
if [ $FAILED -gt 0 ]; then
  echo "❌ TESTES FALHADOS:"
  grep ",FAIL," test-reports/master-e2e.csv | cut -d',' -f1 || true
  echo ""
  exit 1
fi

# Conclusão
if [ $FAILED -eq 0 ] && [ $PASSED -gt 0 ]; then
  echo "🎉 TODOS OS TESTES CRÍTICOS PASSARAM!"
  echo ""
  echo "✨ O sistema está pronto para produção!"
  echo ""
  exit 0
else
  echo "⚠️  Alguns testes opcionais falharam, mas sistema está operacional"
  echo ""
  exit 0
fi
