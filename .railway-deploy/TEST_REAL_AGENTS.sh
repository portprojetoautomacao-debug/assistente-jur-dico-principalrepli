#!/bin/bash
# Teste dos Agentes REAIS (Harvey + Justine com Claude Sonnet 4)

set -e

echo "🤖 Testando Agentes IA REAIS - Assistente Jurídico PJe"
echo "=========================================="
echo ""

# Verificar se o backend está rodando
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
  echo "❌ Backend não está rodando!"
  echo "Execute: cd backend && npm run dev"
  exit 1
fi

echo "✅ Backend online"
echo ""

# Teste 1: Harvey Specter (Estratégia)
echo "📋 Teste 1: Harvey Specter - Análise Estratégica"
echo "--------------------------------------------------"

HARVEY_RESPONSE=$(curl -s -X POST http://localhost:3001/api/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "harvey-specter",
    "task": "Analise a estratégia processual para um caso de ação trabalhista onde o reclamante alega horas extras não pagas nos últimos 5 anos. O réu é uma empresa de médio porte sem registro de ponto eletrônico."
  }')

echo "$HARVEY_RESPONSE" | jq '.'
echo ""

# Verificar se recebeu resposta real (não stub)
if echo "$HARVEY_RESPONSE" | jq -e '.result.data.summary' > /dev/null 2>&1; then
  SUMMARY=$(echo "$HARVEY_RESPONSE" | jq -r '.result.data.summary')

  if [[ ${#SUMMARY} -gt 100 ]]; then
    echo "✅ Harvey respondeu com análise real (${#SUMMARY} caracteres)"
  else
    echo "⚠️  Resposta muito curta, pode ser stub"
  fi
else
  echo "❌ Harvey não retornou análise esperada"
fi
echo ""

# Teste 2: Mrs. Justine (Intimações)
echo "📋 Teste 2: Mrs. Justine - Análise de Intimação"
echo "--------------------------------------------------"

JUSTINE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "mrs-justine",
    "task": "Analise esta intimação: PROCESSO Nº 0001234-56.2024.5.03.0001. INTIMAÇÃO: Fica a parte autora intimada para apresentar contrarrazões ao recurso ordinário interposto pela reclamada, no prazo de 8 (oito) dias, conforme art. 900, §1º do CPC/15."
  }')

echo "$JUSTINE_RESPONSE" | jq '.'
echo ""

# Verificar resposta
if echo "$JUSTINE_RESPONSE" | jq -e '.result.data.analysis' > /dev/null 2>&1; then
  ANALYSIS=$(echo "$JUSTINE_RESPONSE" | jq -r '.result.data.analysis')

  if [[ ${#ANALYSIS} -gt 100 ]]; then
    echo "✅ Justine respondeu com análise real (${#ANALYSIS} caracteres)"
  else
    echo "⚠️  Resposta muito curta, pode ser stub"
  fi
else
  echo "❌ Justine não retornou análise esperada"
fi
echo ""

# Teste 3: Estatísticas
echo "📊 Estatísticas dos Agentes"
echo "--------------------------------------------------"

STATS=$(curl -s http://localhost:3001/api/agents/stats)
echo "$STATS" | jq '.'
echo ""

# Resumo
echo "✅ TESTES CONCLUÍDOS"
echo ""
echo "💡 COMO SABER SE ESTÁ FUNCIONANDO:"
echo "1. As respostas devem ter mais de 200 caracteres"
echo "2. Deve conter análise jurídica detalhada"
echo "3. Deve citar legislação (CPC/15, CLT, etc)"
echo "4. Tempo de execução: 2-5 segundos (Claude API)"
echo ""
echo "⚠️  SE AS RESPOSTAS FOREM CURTAS:"
echo "- Verifique ANTHROPIC_API_KEY no .env"
echo "- Veja logs do backend: backend/logs/app.log"
echo "- Teste manualmente: cd backend && npm run test"
