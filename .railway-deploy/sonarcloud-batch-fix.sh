#!/bin/bash
# Script para análise e correção futura de issues SonarCloud
# Uso: ./sonarcloud-batch-fix.sh [--dry-run]

set -e

DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 Modo DRY-RUN ativado - apenas mostrando mudanças"
fi

echo "📊 Análise de Issues SonarCloud Remanescentes"
echo "=============================================="
echo ""

# Função para contar ocorrências
count_issues() {
  local pattern="$1"
  local files="$2"
  echo "Procurando: $pattern em $files"
  grep -r "$pattern" $files 2>/dev/null | wc -l || echo "0"
}

echo "📈 Estatísticas:"
echo ""

# window vs globalThis
WINDOW_COUNT=$(grep -r "window\." src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "globalThis.window" | wc -l || echo "0")
echo "  - Usos de 'window.' (exceto globalThis.window): $WINDOW_COUNT"

# Condições negadas
NEGATED_COUNT=$(grep -rn "if (!" src/ api/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
echo "  - Condições negadas (if !...): $NEGATED_COUNT"

# TODOs
TODO_COUNT=$(grep -rn "TODO" src/ api/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
echo "  - Comentários TODO: $TODO_COUNT"

# Props sem Readonly
PROPS_COUNT=$(grep -rn "Props {" src/components/ --include="*.tsx" 2>/dev/null | grep -v "Readonly<" | wc -l || echo "0")
echo "  - Props sem Readonly: $PROPS_COUNT"

echo ""
echo "🎯 Correções Prioritárias Recomendadas:"
echo ""
echo "1. APIs Deprecated (3 issues - 45min esforço):"
echo "   - printWindow.document.write() → usar createElement"
echo "   - ElementRef deprecated → usar ComponentPropsWithoutRef"
echo "   - navigator.platform → usar userAgentData.platform"
echo ""
echo "2. TODOs Críticos (8 issues - avaliar individualmente):"
echo "   - api/lib/auth.ts:72"
echo "   - api/lib/cache.ts:202"
echo "   - src/lib/analytics.ts:140"
echo "   - src/components/editor/TiptapEditor.tsx:165"
echo ""
echo "3. Refatorações Cosméticas (baixa prioridade):"
echo "   - window → globalThis (~60 ocorrências)"
echo "   - Union types → Type aliases (5 ocorrências)"
echo ""

if [[ "$DRY_RUN" == "false" ]]; then
  echo "⚠️  Para aplicar correções, execute este script com --dry-run primeiro"
  echo "    Depois revise e descomente as seções de correção desejadas"
fi

echo ""
echo "✅ Análise completa. Ver SONARCLOUD_FIXES_APPLIED.md para detalhes."
