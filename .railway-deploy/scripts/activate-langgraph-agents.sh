#!/bin/bash
# Script para ativar agentes LangGraph quando estiverem prontos
# Uso: ./scripts/activate-langgraph-agents.sh [agent-id]

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 ATIVAÇÃO DE AGENTES LANGGRAPH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

AGENT_ID="${1:-all}"

# Função para verificar se agente está implementado
check_agent_implementation() {
    local agent_id=$1
    local agent_file="src/agents/${agent_id}/${agent_id}_graph.ts"

    if [[ -f "$agent_file" ]]; then
        echo "✅ Agente ${agent_id} encontrado em ${agent_file}"
        return 0
    else
        echo "❌ Agente ${agent_id} não encontrado (esperado: ${agent_file})"
        return 1
    fi
}

# Função para ativar agente nos testes
activate_agent_tests() {
    local agent_id=$1

    echo ""
    echo "📝 Ativando testes para agente ${agent_id}..."

    # Remover .skip dos testes do agente
    if grep -q "test.skip.*${agent_id}" tests/integration/hybrid-agents.test.ts; then
        sed -i "s/test.skip(\(.*${agent_id}.*\)/test(\1/g" tests/integration/hybrid-agents.test.ts
        echo "✅ Testes ativados em hybrid-agents.test.ts"
    fi

    if grep -q "describe.skip.*${agent_id}" tests/integration/hybrid-agents.test.ts; then
        sed -i "s/describe.skip(\(.*${agent_id}.*\)/describe(\1/g" tests/integration/hybrid-agents.test.ts
        echo "✅ Suite de testes ativada em hybrid-agents.test.ts"
    fi
}

# Função para registrar agente no sistema
register_agent() {
    local agent_id=$1

    echo ""
    echo "📋 Registrando agente ${agent_id} no sistema..."

    # Verificar se já está registrado
    if grep -q "case \"${agent_id}\":" src/lib/hybrid-agents-integration.ts; then
        echo "⚠️  Agente ${agent_id} já registrado em hybrid-agents-integration.ts"
    else
        echo "⚠️  Agente ${agent_id} precisa ser adicionado manualmente em hybrid-agents-integration.ts"
        echo "   Adicione o case no switch dentro de getLangGraphAgent()"
    fi
}

# Função para executar testes do agente
test_agent() {
    local agent_id=$1

    echo ""
    echo "🧪 Executando testes do agente ${agent_id}..."

    npm run test:run -- tests/integration/hybrid-agents.test.ts -t "${agent_id}"
}

# Lista de agentes LangGraph planejados
AGENTS=(
    "harvey"
    "justine"
    "monitor-djen"
    "analise-documental"
    "gestao-prazos"
    "redacao-peticoes"
    "pesquisa-juris"
)

if [[ "$AGENT_ID" == "all" ]]; then
    echo "🔍 Verificando todos os agentes LangGraph..."
    echo ""

    READY_COUNT=0
    TOTAL_COUNT=${#AGENTS[@]}

    for agent in "${AGENTS[@]}"; do
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Verificando: ${agent}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        if check_agent_implementation "$agent"; then
            activate_agent_tests "$agent"
            register_agent "$agent"
            ((READY_COUNT++))
        fi
        echo ""
    done

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 RESUMO DA ATIVAÇÃO"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Agentes prontos: ${READY_COUNT}/${TOTAL_COUNT}"
    echo "Agentes pendentes: $((TOTAL_COUNT - READY_COUNT))"
    echo ""

    if [[ $READY_COUNT -eq 0 ]]; then
        echo "⚠️  Nenhum agente LangGraph está implementado ainda."
        echo "   Implemente os agentes em src/agents/[agent-id]/[agent-id]_graph.ts"
        exit 1
    fi

    if [[ $READY_COUNT -eq $TOTAL_COUNT ]]; then
        echo "✅ Todos os agentes LangGraph estão prontos!"
    else
        echo "⏳ Alguns agentes ainda precisam ser implementados."
    fi

else
    # Ativar agente específico
    echo "🔍 Ativando agente: ${AGENT_ID}"
    echo ""

    if check_agent_implementation "$AGENT_ID"; then
        activate_agent_tests "$AGENT_ID"
        register_agent "$AGENT_ID"
        test_agent "$AGENT_ID"

        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "✅ Agente ${AGENT_ID} ativado com sucesso!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    else
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "❌ Agente ${AGENT_ID} não está pronto para ativação"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        exit 1
    fi
fi

echo ""
echo "🎯 Próximos passos:"
echo "   1. Commit das mudanças: git add -A && git commit -m 'feat: ativar agentes LangGraph'"
echo "   2. Executar testes: npm run test:run -- tests/integration/hybrid-agents.test.ts"
echo "   3. Verificar cobertura: npm run test:coverage"
echo ""
