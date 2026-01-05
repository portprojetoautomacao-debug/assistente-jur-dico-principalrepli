#!/bin/bash
# Script de teste para validação e rate limiting
# Execute com: bash test-validation-rate-limiting.sh

echo "🧪 TESTES DE VALIDAÇÃO E RATE LIMITING"
echo "======================================"
echo ""

BASE_URL="http://localhost:3001"

echo "📋 Pré-requisito: Servidor deve estar rodando na porta 3001"
echo "   Inicie com: cd backend && npm run dev"
echo ""

# Test 1: Validação de agente - request inválido
echo "✅ Teste 1: POST /api/agents/execute (SEM task - deve falhar)"
curl -s -X POST "${BASE_URL}/api/agents/execute" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "harvey-specter"}' \
  | jq '.' || echo "Servidor não está rodando!"

echo ""
echo "---"
echo ""

# Test 2: Validação de agente - task muito curta
echo "✅ Teste 2: POST /api/agents/execute (task < 10 chars - deve falhar)"
curl -s -X POST "${BASE_URL}/api/agents/execute" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "harvey-specter", "task": "test"}' \
  | jq '.'

echo ""
echo "---"
echo ""

# Test 3: Validação de agente - request válido
echo "✅ Teste 3: POST /api/agents/execute (válido - deve passar)"
curl -s -X POST "${BASE_URL}/api/agents/execute" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "harvey-specter", "task": "Analisar contrato de prestação de serviços"}' \
  | jq '.'

echo ""
echo "---"
echo ""

# Test 4: Validação de minuta - campos faltando
echo "✅ Teste 4: POST /api/minutas (SEM autor - deve falhar)"
curl -s -X POST "${BASE_URL}/api/minutas" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Petição Inicial",
    "conteudo": "Conteúdo da petição...",
    "tipo": "peticao"
  }' \
  | jq '.'

echo ""
echo "---"
echo ""

# Test 5: Validação de minuta - tipo inválido
echo "✅ Teste 5: POST /api/minutas (tipo inválido - deve falhar)"
curl -s -X POST "${BASE_URL}/api/minutas" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Petição Inicial",
    "conteudo": "Conteúdo da petição...",
    "tipo": "tipo-invalido",
    "autor": "Advogado Teste"
  }' \
  | jq '.'

echo ""
echo "---"
echo ""

# Test 6: Rate Limiting - múltiplas requisições
echo "✅ Teste 6: Rate Limiting - Enviando 5 requisições rápidas"
echo "   (limite é 30 req/15min para IA, não deve bloquear ainda)"
for i in {1..5}; do
  echo "   Requisição $i/5..."
  curl -s -X POST "${BASE_URL}/api/agents/execute" \
    -H "Content-Type: application/json" \
    -d "{\"agentId\": \"harvey-specter\", \"task\": \"Requisição de teste número $i\"}" \
    -w "\n   HTTP Status: %{http_code}\n" \
    -o /dev/null
  sleep 0.5
done

echo ""
echo "---"
echo ""

# Test 7: Health check
echo "✅ Teste 7: GET /health (sem rate limit)"
curl -s "${BASE_URL}/health" | jq '.'

echo ""
echo "======================================"
echo "✅ Testes concluídos!"
echo ""
echo "📊 Resultados esperados:"
echo "   - Testes 1, 2, 4, 5: Erro de validação (400)"
echo "   - Teste 3: Sucesso ou erro de agente não carregado (200/500)"
echo "   - Teste 6: Todas com status 200 (abaixo do limite)"
echo "   - Teste 7: Status ok (200)"
echo ""
echo "💡 Dica: Para testar rate limiting de verdade, execute:"
echo "   for i in {1..35}; do curl -X POST $BASE_URL/api/agents/execute -H 'Content-Type: application/json' -d '{\"agentId\":\"test\",\"task\":\"test task 123456\"}'; done"
