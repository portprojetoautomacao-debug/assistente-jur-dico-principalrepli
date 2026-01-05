#!/bin/bash
#
# Validação da correção do workflow agents-integration.yml
#

echo "🧪 VALIDAÇÃO - Correção Agents Integration"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SUCCESS=0
FAIL=0

echo "1️⃣ Verificando Workflow agents-integration.yml"
echo "-----------------------------------------------"

if grep -q "shopt -s nullglob" .github/workflows/agents-integration.yml; then
  echo -e "${GREEN}✓${NC} nullglob habilitado"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} nullglob não encontrado"
  ((FAIL++))
fi

if grep -q 'files=(tests/integration/\*.test.ts)' .github/workflows/agents-integration.yml; then
  echo -e "${GREEN}✓${NC} Array de arquivos criado"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Array não encontrado"
  ((FAIL++))
fi

if grep -q 'if \[ \${#files\[@\]} -gt 0 \]' .github/workflows/agents-integration.yml; then
  echo -e "${GREEN}✓${NC} Verificação de array length"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Verificação de length não encontrada"
  ((FAIL++))
fi

if grep -q 'ls -la tests/integration' .github/workflows/agents-integration.yml; then
  echo -e "${GREEN}✓${NC} Diagnósticos adicionados"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Diagnósticos não encontrados"
  ((FAIL++))
fi

# Verificar que o padrão antigo foi removido
if grep -q 'if ls tests/integration/\*.test.ts 1>' .github/workflows/agents-integration.yml; then
  echo -e "${RED}✗${NC} Padrão antigo (ls) ainda presente"
  ((FAIL++))
else
  echo -e "${GREEN}✓${NC} Padrão antigo (ls) removido"
  ((SUCCESS++))
fi

echo ""
echo "2️⃣ Testando Lógica Localmente"
echo "------------------------------"

# Teste 1: Arquivos existem
cd "$(git rev-parse --show-toplevel)" || exit 1
shopt -s nullglob
files=(tests/integration/*.test.ts)
if [ ${#files[@]} -gt 0 ]; then
  echo -e "${GREEN}✓${NC} Detectou ${#files[@]} arquivos de teste"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Não detectou arquivos (deveria detectar)"
  ((FAIL++))
fi

# Teste 2: Diretório inexistente
files_fake=(tests/nonexistent/*.test.ts)
if [ ${#files_fake[@]} -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Skip correto para diretório vazio"
  ((SUCCESS++))
else
  echo -e "${RED}✗${NC} Não skipou diretório vazio"
  ((FAIL++))
fi

echo ""
echo "3️⃣ Arquivos de Teste Encontrados"
echo "---------------------------------"
if [ ${#files[@]} -gt 0 ]; then
  for f in "${files[@]}"; do
    echo "  📄 $(basename "$f")"
  done
  echo ""
  echo -e "${GREEN}✓${NC} Total: ${#files[@]} arquivos"
  ((SUCCESS++))
else
  echo -e "${YELLOW}⚠${NC} Nenhum arquivo encontrado"
fi

echo ""
echo "=========================================="
echo "📊 RESULTADO FINAL"
echo "=========================================="
echo -e "Sucessos: ${GREEN}${SUCCESS}${NC}"
echo -e "Falhas: ${RED}${FAIL}${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ CORREÇÃO VALIDADA COM SUCESSO!${NC}"
  echo ""
  echo "📋 Resumo:"
  echo "  ✓ nullglob habilitado no workflow"
  echo "  ✓ Array de arquivos implementado"
  echo "  ✓ Verificação robusta de length"
  echo "  ✓ Diagnósticos adicionados"
  echo "  ✓ Padrão antigo (ls) removido"
  echo "  ✓ Lógica testada localmente"
  echo "  ✓ ${#files[@]} arquivos de teste detectados"
  echo ""
  echo "🚀 Próxima execução de CI não terá 'No test files found'"
  exit 0
else
  echo -e "${RED}❌ VALIDAÇÃO FALHOU${NC}"
  exit 1
fi
