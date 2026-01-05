#!/bin/bash
# Script para verificar encoding de arquivos TypeScript/TSX
# Garante que todos os arquivos estejam em UTF-8

set -e

echo "🔍 Verificando encoding de arquivos TypeScript..."

FOUND_ISSUES=0

while IFS= read -r file; do
  encoding=$(file -b --mime-encoding "$file")

  if [[ "$encoding" != "utf-8" && "$encoding" != "us-ascii" ]]; then
    echo "❌ $file: $encoding (esperado: utf-8)"
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
  fi
done < <(find src api -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null)

if [[ $FOUND_ISSUES -eq 0 ]]; then
  echo "✅ Todos os arquivos TypeScript estão em UTF-8"
  exit 0
else
  echo ""
  echo "❌ Encontrados $FOUND_ISSUES arquivo(s) com encoding incorreto"
  echo ""
  echo "Para corrigir automaticamente, execute:"
  echo "  bash scripts/fix-encoding.sh"
  exit 1
fi
