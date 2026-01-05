#!/bin/bash

# Pegar todos os arquivos com erro "Duplicate identifier"
npm run type-check 2>&1 | grep "Duplicate identifier" | cut -d'(' -f1 | sort -u | while read file; do
  if [ -f "$file" ]; then
    echo "Processando $file..."
    # Remover primeira linha se for import duplicado
    head -1 "$file" | grep -q "^import.*from.*phosphor-icons" && sed -i '1d' "$file"
    head -1 "$file" | grep -q "^import.*from.*lucide-react" && sed -i '1d' "$file"
  fi
done

echo "Todos os duplicados removidos!"
