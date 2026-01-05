#!/bin/bash

# Script de Validação de Runtime da Vercel
# Verifica se todos os arquivos da API usam valores válidos de runtime
# Valores válidos: "edge", "experimental-edge", "nodejs"

set -euo pipefail

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
ERROR_COUNT=0
WARNING_COUNT=0
VALID_COUNT=0

# Banner
echo "════════════════════════════════════════════════════════════════"
echo "  🔍 VALIDAÇÃO DE RUNTIME VERCEL - API FUNCTIONS"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Função para validar arquivo
validate_file() {
  local file="$1"
  local filename=$(basename "$file")
  
  # Verificar se o arquivo existe
  if [[ ! -f "$file" ]]; then
    echo -e "${RED}✗${NC} Arquivo não encontrado: $file"
    ((ERROR_COUNT++))
    return
  fi
  
  # Verificar se o arquivo tem export const config
  if ! grep -q "export const config" "$file"; then
    # Arquivo sem configuração de runtime (pode ser válido)
    echo -e "${GREEN}○${NC} $filename - Sem configuração de runtime (válido)"
    ((VALID_COUNT++))
    return
  fi
  
  # Extrair valor do runtime
  local runtime_value=$(grep -A 5 "export const config" "$file" | grep -o 'runtime:.*' | sed 's/runtime://;s/[",]//g;s/ //g' | head -1)
  
  if [[ -z "$runtime_value" ]]; then
    echo -e "${YELLOW}⚠${NC} $filename - Runtime não especificado no config"
    ((WARNING_COUNT++))
    return
  fi
  
  # Validar valor do runtime
  case "$runtime_value" in
    "edge"|"experimental-edge"|"nodejs")
      echo -e "${GREEN}✓${NC} $filename - Runtime válido: $runtime_value"
      ((VALID_COUNT++))
      ;;
    nodejs[0-9]*)
      echo -e "${RED}✗${NC} $filename - Runtime INVÁLIDO: $runtime_value"
      echo "   Valores válidos: edge, experimental-edge, nodejs"
      echo "   Referência: https://vercel.link/creating-edge-functions"
      ((ERROR_COUNT++))
      ;;
    *)
      echo -e "${RED}✗${NC} $filename - Runtime desconhecido: $runtime_value"
      ((ERROR_COUNT++))
      ;;
  esac
}

# Verificar arquivos na pasta api/
echo "📂 Verificando arquivos em api/..."
echo ""

# Procurar todos os arquivos .ts na pasta api/
if [[ -d "api" ]]; then
  while IFS= read -r -d '' file; do
    validate_file "$file"
  done < <(find api -type f -name "*.ts" -print0 | sort -z)
else
  echo -e "${RED}✗${NC} Pasta 'api/' não encontrada!"
  ((ERROR_COUNT++))
fi

# Resumo final
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  📊 RESUMO DA VALIDAÇÃO"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "✓ Arquivos válidos:    ${GREEN}$VALID_COUNT${NC}"
echo -e "⚠ Avisos:              ${YELLOW}$WARNING_COUNT${NC}"
echo -e "✗ Erros:               ${RED}$ERROR_COUNT${NC}"
echo ""

# Verificações específicas
echo "════════════════════════════════════════════════════════════════"
echo "  ✅ VERIFICAÇÕES ADICIONAIS"
echo "════════════════════════════════════════════════════════════════"
echo ""

# 1. Verificar se existe nodejs22.x em algum lugar
if grep -rq 'runtime.*"nodejs22' api/ 2>/dev/null; then
  echo -e "${RED}✗${NC} CRÍTICO: Encontrado 'nodejs22.x' na pasta api/"
  echo "   Execute: grep -rn 'nodejs22' api/"
  ((ERROR_COUNT++))
else
  echo -e "${GREEN}✓${NC} Nenhuma referência a 'nodejs22.x' encontrada"
fi

# 2. Verificar se existe nodejs20.x em algum lugar
if grep -rq 'runtime.*"nodejs20' api/ 2>/dev/null; then
  echo -e "${RED}✗${NC} CRÍTICO: Encontrado 'nodejs20.x' na pasta api/"
  echo "   Execute: grep -rn 'nodejs20' api/"
  ((ERROR_COUNT++))
else
  echo -e "${GREEN}✓${NC} Nenhuma referência a 'nodejs20.x' encontrada"
fi

# 3. Verificar se existe nodejs18.x em algum lugar
if grep -rq 'runtime.*"nodejs18' api/ 2>/dev/null; then
  echo -e "${RED}✗${NC} CRÍTICO: Encontrado 'nodejs18.x' na pasta api/"
  echo "   Execute: grep -rn 'nodejs18' api/"
  ((ERROR_COUNT++))
else
  echo -e "${GREEN}✓${NC} Nenhuma referência a 'nodejs18.x' encontrada"
fi

# 4. Verificar arquivos com maxDuration > 60 (limite Hobby)
echo ""
echo "⏱️  Verificando limites de maxDuration..."
if grep -rn 'maxDuration.*[6-9][0-9]\|[1-9][0-9][0-9]' api/ 2>/dev/null | grep -v '60'; then
  echo -e "${YELLOW}⚠${NC} Arquivos com maxDuration > 60s (limite Hobby Plan: 60s, Pro: 300s)"
else
  echo -e "${GREEN}✓${NC} Todos os maxDuration dentro dos limites"
fi

# Status final
echo ""
echo "════════════════════════════════════════════════════════════════"
if [[ $ERROR_COUNT -eq 0 ]]; then
  echo -e "  ${GREEN}✅ VALIDAÇÃO COMPLETA - TODOS OS CHECKS PASSARAM${NC}"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  exit 0
else
  echo -e "  ${RED}❌ VALIDAÇÃO FALHOU - $ERROR_COUNT ERRO(S) ENCONTRADO(S)${NC}"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  echo "📚 Para corrigir, atualize os arquivos para usar:"
  echo "   export const config = {"
  echo "     runtime: \"nodejs\",  // ou \"edge\" ou \"experimental-edge\""
  echo "     maxDuration: 60,     // máximo para Hobby Plan"
  echo "   };"
  echo ""
  echo "🔗 Documentação: https://vercel.link/creating-edge-functions"
  echo ""
  exit 1
fi
