#!/bin/bash
# Script de validação do Scheduler DJEN
# Data: 04/01/2026

set -e

echo "════════════════════════════════════════════════════════"
echo "🧪 TESTE DE VALIDAÇÃO - SCHEDULER DJEN"
echo "════════════════════════════════════════════════════════"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função de validação
check_test() {
    local test_name="$1"
    local test_command="$2"

    echo -n "📋 Testando: $test_name... "

    local output
    if output=$(eval "$test_command" 2>&1); then
        echo -e "${GREEN}✅ PASSOU${NC}"
        return 0
    else
        echo -e "${RED}❌ FALHOU${NC}"
        if [ -n "${VERBOSE:-}" ]; then
            echo "   Erro: $output"
        fi
        return 1
    fi
}

# Contadores
PASSED=0
FAILED=0

echo "1️⃣ VERIFICAÇÕES DE ARQUIVOS"
echo "─────────────────────────────────────────────────────────"

# Teste 1: Arquivo do scheduler existe
if check_test "Arquivo djen-scheduler.ts existe" "test -f backend/src/services/djen-scheduler.ts"; then
    ((PASSED+=1))
else
    ((FAILED+=1))
fi

# Teste 2: node-cron instalado
if check_test "Pacote node-cron instalado" "grep -q '\"node-cron\"' backend/package.json"; then
    ((PASSED+=1))
else
    ((FAILED+=1))
fi

# Teste 3: Importação no server.ts
if check_test "Scheduler importado em server.ts" "grep -q 'iniciarSchedulerDJEN' backend/src/server.ts"; then
    ((PASSED+=1))
else
    ((FAILED+=1))
fi

echo ""
echo "2️⃣ VERIFICAÇÕES DE IMPLEMENTAÇÃO"
echo "─────────────────────────────────────────────────────────"

# Teste 4: Função processarPublicacoesDJEN existe
if check_test "Função processarPublicacoesDJEN implementada" "grep -q 'export async function processarPublicacoesDJEN' backend/src/services/djen-scheduler.ts"; then
    ((PASSED+=1))
else
    ((FAILED+=1))
fi

# Teste 5: Função iniciarSchedulerDJEN existe
if check_test "Função iniciarSchedulerDJEN implementada" "grep -q 'export function iniciarSchedulerDJEN' backend/src/services/djen-scheduler.ts"; then
    ((PASSED+=1))
else
    ((FAILED+=1))
fi

# Teste 6: Cron job 01:00 configurado
if check_test "Cron job 01:00 configurado" "grep -q '0 1 \* \* \*' backend/src/services/djen-scheduler.ts"; then
    ((PASSED+=1))
else
    ((FAILED+=1))
fi

# Teste 7: Cron job 09:00 configurado
if check_test "Cron job 09:00 configurado" "grep -q '0 9 \* \* \*' backend/src/services/djen-scheduler.ts"; then
    ((PASSED+=1))
else
    ((FAILED+=1))
fi

# Teste 8: Timezone configurado
if check_test "Timezone America/Sao_Paulo configurado" "grep -q 'America/Sao_Paulo' backend/src/services/djen-scheduler.ts"; then
    ((PASSED+=1))
else
    ((FAILED+=1))
fi

echo ""
echo "3️⃣ VERIFICAÇÕES DE DOCUMENTAÇÃO"
echo "─────────────────────────────────────────────────────────"

# Teste 9: Documentação existe
if check_test "DJEN_SCHEDULER_README.md existe" "test -f DJEN_SCHEDULER_README.md"; then
    ((PASSED+=1))
else
    ((FAILED+=1))
fi

# Teste 10: .env.example atualizado
if check_test "DJEN_SCHEDULER_ENABLED em .env.example" "grep -q 'DJEN_SCHEDULER_ENABLED' .env.example"; then
    ((PASSED+=1))
else
    ((FAILED+=1))
fi

# Teste 11: Variável TZ em .env.example
if check_test "TZ em .env.example" "grep -q 'TZ=America/Sao_Paulo' .env.example"; then
    ((PASSED+=1))
else
    ((FAILED+=1))
fi

echo ""
echo "4️⃣ VERIFICAÇÕES DE INTEGRAÇÃO"
echo "─────────────────────────────────────────────────────────"

# Teste 12: Rota de trigger manual existe
if check_test "Rota /api/djen existe" "test -f backend/src/routes/djen.ts"; then
    ((PASSED+=1))
else
    ((FAILED+=1))
fi

# Teste 13: Função executarManualmente exportada
if check_test "Função executarManualmente implementada" "grep -q 'export async function executarManualmente' backend/src/services/djen-scheduler.ts"; then
    ((PASSED+=1))
else
    ((FAILED+=1))
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "📊 RESULTADO DOS TESTES"
echo "════════════════════════════════════════════════════════"
echo ""

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

printf "✅ Testes passados: %b%s%b\n" "$GREEN" "$PASSED" "$NC"
printf "❌ Testes falhados: %b%s%b\n" "$RED" "$FAILED" "$NC"
printf "📈 Taxa de sucesso: %b%s%%%b\n" "$GREEN" "$PERCENTAGE" "$NC"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
    echo ""
    echo "✅ O Scheduler DJEN está configurado corretamente."
    echo "✅ Para ativar, defina DJEN_SCHEDULER_ENABLED=true no .env"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Configure as variáveis de ambiente (.env)"
    echo "   2. Inicie o backend: cd backend && npm run dev"
    echo "   3. Monitore os logs nos horários programados (01:00 e 09:00)"
    echo "   4. Teste manualmente: curl -X POST http://localhost:3001/api/djen/trigger-manual"
    echo ""
    exit 0
else
    echo -e "${RED}❌ ALGUNS TESTES FALHARAM${NC}"
    echo ""
    echo "⚠️  Revise os itens acima e corrija os problemas antes de ativar."
    echo ""
    exit 1
fi
