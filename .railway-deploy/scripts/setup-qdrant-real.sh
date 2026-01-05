#!/bin/bash
# Script para configurar e testar Qdrant real no projeto
# Remove dependência de mocks e conecta ao Qdrant Cloud

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  CONFIGURAÇÃO QDRANT REAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se variáveis de ambiente estão configuradas
check_env_vars() {
    echo "🔍 Verificando variáveis de ambiente..."
    
    if [[ -z "$VITE_QDRANT_URL" ]]; then
        echo "❌ VITE_QDRANT_URL não configurada"
        echo ""
        echo "Configure no arquivo .env:"
        echo "VITE_QDRANT_URL=https://seu-cluster.qdrant.tech"
        exit 1
    fi
    
    if [[ -z "$VITE_QDRANT_API_KEY" ]]; then
        echo "❌ VITE_QDRANT_API_KEY não configurada"
        echo ""
        echo "Configure no arquivo .env:"
        echo "VITE_QDRANT_API_KEY=sua-api-key"
        exit 1
    fi
    
    echo "✅ Variáveis de ambiente configuradas"
}

# Testar conexão com Qdrant
test_connection() {
    echo ""
    echo "🔌 Testando conexão com Qdrant..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -H "api-key: $VITE_QDRANT_API_KEY" \
        "$VITE_QDRANT_URL/collections")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [[ "$http_code" == "200" ]]; then
        echo "✅ Conexão estabelecida com sucesso!"
        echo ""
        echo "📊 Coleções existentes:"
        echo "$body" | jq -r '.result.collections[]?.name // "Nenhuma coleção encontrada"' 2>/dev/null || echo "$body"
    else
        echo "❌ Falha na conexão (HTTP $http_code)"
        echo "$body"
        exit 1
    fi
}

# Criar coleção se não existir
create_collection() {
    local collection_name="${1:-jurisprudence}"
    
    echo ""
    echo "📦 Verificando coleção '${collection_name}'..."
    
    # Verificar se coleção existe
    response=$(curl -s -w "\n%{http_code}" \
        -H "api-key: $VITE_QDRANT_API_KEY" \
        "$VITE_QDRANT_URL/collections/${collection_name}")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [[ "$http_code" == "200" ]]; then
        echo "✅ Coleção '${collection_name}' já existe"
        return 0
    fi
    
    echo "📝 Criando coleção '${collection_name}'..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -X PUT \
        -H "Content-Type: application/json" \
        -H "api-key: $VITE_QDRANT_API_KEY" \
        "$VITE_QDRANT_URL/collections/${collection_name}" \
        -d '{
            "vectors": {
                "size": 768,
                "distance": "Cosine"
            },
            "optimizers_config": {
                "default_segment_number": 2
            },
            "replication_factor": 1
        }')
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [[ "$http_code" == "200" ]]; then
        echo "✅ Coleção '${collection_name}' criada com sucesso!"
    else
        echo "❌ Erro ao criar coleção (HTTP $http_code)"
        echo "$body"
        exit 1
    fi
}

# Atualizar código para remover mocks
remove_mocks() {
    echo ""
    echo "🔧 Removendo mocks do código..."
    
    # Arquivos que podem conter mocks
    local files_to_check=(
        "src/lib/qdrant-service.ts"
        "src/agents/pesquisa-juris/retrievers.ts"
        "src/agents/pesquisa-juris/pesquisa_graph.ts"
    )
    
    for file in "${files_to_check[@]}"; do
        if [[ -f "$file" ]]; then
            echo "   📝 Verificando $file..."
            
            # Verificar se tem mocks
            if grep -q "mock\|Mock\|MOCK\|stub\|Stub" "$file"; then
                echo "   ⚠️  Arquivo contém referências a mocks/stubs"
                echo "      Por favor, revise manualmente: $file"
            else
                echo "   ✅ Arquivo limpo"
            fi
        fi
    done
}

# Executar testes com Qdrant real
run_tests() {
    echo ""
    echo "🧪 Executando testes com Qdrant real..."
    
    # Garantir que não está em modo de teste
    export DEBUG_TESTS=false
    
    if [[ -f "scripts/test-qdrant-connection.ts" ]]; then
        echo "   📝 Rodando test-qdrant-connection.ts..."
        npx tsx scripts/test-qdrant-connection.ts
    fi
    
    if [[ -f "tests/qdrant-service.test.ts" ]]; then
        echo "   📝 Rodando testes unitários do Qdrant..."
        npm run test -- tests/qdrant-service.test.ts
    fi
    
    echo "   ✅ Testes concluídos"
}

# Popular com dados de exemplo (opcional)
populate_sample_data() {
    echo ""
    read -p "📚 Deseja popular com dados de exemplo? (s/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "   📝 Populando com dados jurídicos de exemplo..."
        
        if [[ -f "scripts/populate-qdrant-datajud.ts" ]]; then
            npx tsx scripts/populate-qdrant-datajud.ts
        else
            echo "   ⚠️  Script de população não encontrado"
            echo "      Crie manualmente ou use: scripts/init-qdrant-collection.ts"
        fi
    fi
}

# Gerar relatório final
generate_report() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 RELATÓRIO DE CONFIGURAÇÃO QDRANT"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Variáveis de ambiente configuradas"
    echo "✅ Conexão com Qdrant estabelecida"
    echo "✅ Coleções verificadas/criadas"
    echo ""
    echo "🔗 URL: $VITE_QDRANT_URL"
    echo "📦 Coleção principal: jurisprudence"
    echo "📐 Dimensões dos vetores: 768"
    echo "📏 Distância: Cosine"
    echo ""
    echo "📝 Próximos passos:"
    echo "   1. Revisar código em src/agents/pesquisa-juris/"
    echo "   2. Rodar testes: npm run test"
    echo "   3. Testar agente pesquisa-juris manualmente"
    echo "   4. Popular com dados reais se necessário"
    echo ""
}

# ==============================================================================
# MAIN
# ==============================================================================

check_env_vars
test_connection
create_collection "jurisprudence"
remove_mocks
run_tests
populate_sample_data
generate_report

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Configuração Qdrant concluída!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
