#!/bin/bash
# Script para aplicar melhorias padronizadas em todos os agentes LangGraph
# Uso: ./scripts/apply-agent-improvements.sh [agent-id|all]

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 APLICAÇÃO DE MELHORIAS EM AGENTES LANGGRAPH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

AGENT_ID="${1:-all}"

# Lista de todos os agentes (exceto harvey e justine que já estão atualizados)
ALL_AGENTS=(
    "monitor-djen"
    "analise-documental"
    "analise-risco"
    "compliance"
    "comunicacao-clientes"
    "estrategia-processual"
    "financeiro"
    "gestao-prazos"
    "organizacao-arquivos"
    "pesquisa-juris"
    "redacao-peticoes"
    "revisao-contratual"
    "traducao-juridica"
)

# Melhorias a serem aplicadas (baseado em harvey_graph.ts e justine_graph.ts)
IMPROVEMENTS=(
    "1. ✅ Sentry AI Monitoring v2 com createInvokeAgentSpan"
    "2. ✅ Circuit Breaker e Graceful Degradation"
    "3. ✅ Timeout configurável por agente"
    "4. ✅ Retry policy com exponential backoff"
    "5. ✅ Logs estruturados com contexto"
    "6. ✅ Validação de entrada e saída"
    "7. ✅ Error handling com classificação"
    "8. ✅ Session tracking e turn counter"
)

# Função para verificar se agente existe
check_agent_exists() {
    local agent_id=$1
    local agent_file="src/agents/${agent_id}/${agent_id}_graph.ts"

    if [[ -f "$agent_file" ]]; then
        return 0
    else
        return 1
    fi
}

# Função para criar backup do agente
backup_agent() {
    local agent_id=$1
    local agent_file="src/agents/${agent_id}/${agent_id}_graph.ts"
    local backup_file="${agent_file}.backup.$(date +%Y%m%d_%H%M%S)"

    echo "📦 Criando backup: ${backup_file}"
    cp "$agent_file" "$backup_file"
}

# Função para aplicar melhorias no agente
apply_improvements() {
    local agent_id=$1
    local agent_file="src/agents/${agent_id}/${agent_id}_graph.ts"

    echo ""
    echo "🔧 Aplicando melhorias no agente: ${agent_id}"
    echo "   Arquivo: ${agent_file}"
    
    # Verificar se já tem as melhorias
    if grep -q "createInvokeAgentSpan" "$agent_file"; then
        echo "   ⚠️  Agente já possui melhorias aplicadas (createInvokeAgentSpan detectado)"
        return 0
    fi

    echo ""
    echo "   Melhorias que serão aplicadas:"
    for improvement in "${IMPROVEMENTS[@]}"; do
        echo "   $improvement"
    done

    echo ""
    read -p "   Aplicar melhorias? (s/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "   ⏭️  Pulando agente ${agent_id}"
        return 0
    fi

    # Criar backup antes de modificar
    backup_agent "$agent_id"

    # Aplicar transformações via Node.js script
    node scripts/transform-agent.mjs "$agent_id"

    echo "   ✅ Melhorias aplicadas com sucesso!"
}

# Função para validar agente após melhorias
validate_agent() {
    local agent_id=$1

    echo ""
    echo "🧪 Validando agente ${agent_id}..."

    # Verificar sintaxe TypeScript
    npx tsc --noEmit src/agents/${agent_id}/${agent_id}_graph.ts 2>&1 | head -20

    if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
        echo "   ✅ Sintaxe TypeScript válida"
    else
        echo "   ❌ Erro de sintaxe TypeScript"
        return 1
    fi

    # Rodar testes se existirem
    if [[ -f "src/agents/${agent_id}/__tests__/${agent_id}.test.ts" ]]; then
        echo "   🧪 Rodando testes..."
        npm run test -- "src/agents/${agent_id}/__tests__/${agent_id}.test.ts" || true
    fi
}

# Função para gerar relatório
generate_report() {
    local success_count=$1
    local total_count=$2

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 RELATÓRIO DE MELHORIAS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Agentes processados: ${success_count}/${total_count}"
    echo "Taxa de sucesso: $(( success_count * 100 / total_count ))%"
    echo ""
    echo "📝 Próximos passos:"
    echo "   1. Revisar os arquivos modificados"
    echo "   2. Rodar testes completos: npm run test"
    echo "   3. Validar build: npm run build"
    echo "   4. Ativar agentes: ./scripts/activate-langgraph-agents.sh all"
    echo ""
}

# ==============================================================================
# MAIN
# ==============================================================================

if [[ "$AGENT_ID" == "all" ]]; then
    echo "🔄 Aplicando melhorias em TODOS os agentes..."
    echo ""

    SUCCESS_COUNT=0
    TOTAL_COUNT=${#ALL_AGENTS[@]}

    for agent in "${ALL_AGENTS[@]}"; do
        if check_agent_exists "$agent"; then
            apply_improvements "$agent"
            if [[ $? -eq 0 ]]; then
                validate_agent "$agent"
                ((SUCCESS_COUNT++))
            fi
        else
            echo "⚠️  Agente ${agent} não encontrado, pulando..."
        fi
        echo ""
    done

    generate_report "$SUCCESS_COUNT" "$TOTAL_COUNT"

else
    # Aplicar em agente específico
    if ! check_agent_exists "$AGENT_ID"; then
        echo "❌ Agente '${AGENT_ID}' não encontrado!"
        echo ""
        echo "Agentes disponíveis:"
        for agent in "${ALL_AGENTS[@]}"; do
            echo "  - $agent"
        done
        exit 1
    fi

    apply_improvements "$AGENT_ID"
    validate_agent "$AGENT_ID"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Processo concluído!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
