#!/bin/bash
# Script para converter arquivos não-UTF-8 para UTF-8
# Detecta automaticamente o encoding e converte

set -e

echo "🔧 Convertendo arquivos para UTF-8..."

FIXED_COUNT=0

while IFS= read -r file; do
  encoding=$(file -b --mime-encoding "$file")

  if [[ "$encoding" != "utf-8" && "$encoding" != "us-ascii" ]]; then
    echo "Converting: $file ($encoding → UTF-8)"

    # Tentar detectar e converter
    if iconv -f "$encoding" -t UTF-8 "$file" > /tmp/temp-utf8-$$.txt 2>/dev/null; then
      mv /tmp/temp-utf8-$$.txt "$file"
      FIXED_COUNT=$((FIXED_COUNT + 1))
    else
      # Fallback: tentar ISO-8859-1
      echo "  Retrying with ISO-8859-1..."
      iconv -f ISO-8859-1 -t UTF-8 "$file" > /tmp/temp-utf8-$$.txt
      mv /tmp/temp-utf8-$$.txt "$file"
      FIXED_COUNT=$((FIXED_COUNT + 1))
    fi
  fi
done < <(find src api -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null)

if [[ $FIXED_COUNT -eq 0 ]]; then
  echo "✅ Nenhum arquivo precisou de conversão"
else
  echo "✅ $FIXED_COUNT arquivo(s) convertido(s) para UTF-8"
fi
