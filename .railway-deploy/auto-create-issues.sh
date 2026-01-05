#!/bin/bash

# ========================================
# 🤖 Auto-Create Issues from Code Comments
# ========================================
# 
# Cria issues automaticamente no GitHub a partir de
# comentários TODO, FIXME, PENDENTE, etc no código
#
# Uso: ./auto-create-issues.sh
# ========================================

set -e

# Carregar biblioteca comum
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/scripts/lib/common.sh" || {
    echo "❌ Erro: não foi possível carregar scripts/lib/common.sh"
    exit 1
}

log_info "🔍 Procurando por triggers no código..."

# Verificar se gh CLI está instalado
if ! command_exists gh; then
    log_error "GitHub CLI (gh) não está instalado"
    echo "Instale com: https://cli.github.com/"
    exit 1
fi

# Verificar se está autenticado
if ! gh auth status &> /dev/null; then
    log_error "GitHub CLI não está autenticado"
    echo "Execute: gh auth login"
    exit 1
fi

# Padrão de busca (todos os triggers)
PATTERN='TODO|FIXME|ISSUE|HACK|PENDENTE|REVISAR|CORRIGIR|VERIFICAR|ATENÇÃO|URGENTE|BUG|JURIDICO|PRAZO|INTIMACAO|VALIDAR|COMPLIANCE|LGPD|SEGURANCA|REFACTOR|OPTIMIZE|DEPRECATED|BREAKING|PERFORMANCE|ACCESSIBILITY|A11Y|SECURITY|TEST|DOC|DOCS'

# Contador de issues criados
ISSUES_CREATED=0

# Buscar por triggers no código
log_info "📂 Procurando em arquivos TypeScript, JavaScript, CSS, HTML..."

# Buscar em arquivos relevantes (excluir node_modules, dist, etc)
grep -rn -E "//\s*($PATTERN)" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.css" \
  --include="*.scss" \
  --include="*.html" \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=.vite \
  --exclude-dir=coverage \
  --exclude-dir=.git \
  . 2>/dev/null | while IFS=: read -r file line content; do
  
  # Ignorar comentários de teste/exemplo
  if echo "$content" | grep -qiE "(TESTE [0-9]+:|exemplo|sample|demo|FEITO EM|OBSOLETO)"; then
    continue
  fi
  
  # Extrair tipo de trigger
  TRIGGER=$(echo "$content" | grep -oE "($PATTERN)" | head -1)
  
  # Limpar comentário
  COMMENT=$(echo "$content" | sed 's|^\s*//\s*||' | sed "s|^\s*$TRIGGER:\s*||")
  
  # Gerar título
  TITLE="[$TRIGGER] $COMMENT"
  
  # Limitar tamanho do título
  if [[ ${#TITLE} -gt 100 ]]; then
    TITLE="${TITLE:0:97}..."
  fi
  
  # Gerar corpo do issue
  BODY="**Detectado automaticamente no código**

📁 **Arquivo**: \`$file\`
📍 **Linha**: $line
🏷️ **Tipo**: $TRIGGER

---

### 📝 Comentário Original

\`\`\`typescript
$content
\`\`\`

---

### 🔗 Link para o código

[Ver no repositório](https://github.com/$GITHUB_REPOSITORY/blob/main/$file#L$line)

---

🤖 *Issue criado automaticamente pelo script auto-create-issues.sh*
"

  # Determinar labels baseado no trigger
  LABELS="auto-created,needs-triage"
  
  case $TRIGGER in
    URGENTE|CRITICAL)
      LABELS="$LABELS,priority:high,urgente"
      ;;
    BUG|FIXME|CORRIGIR)
      LABELS="$LABELS,bug"
      ;;
    JURIDICO|PRAZO|INTIMACAO|COMPLIANCE|LGPD)
      LABELS="$LABELS,juridico"
      ;;
    SECURITY|SEGURANCA)
      LABELS="$LABELS,security"
      ;;
    PERFORMANCE|OPTIMIZE)
      LABELS="$LABELS,performance"
      ;;
    ACCESSIBILITY|A11Y)
      LABELS="$LABELS,accessibility"
      ;;
    TEST)
      LABELS="$LABELS,testing"
      ;;
    DOC|DOCS)
      LABELS="$LABELS,documentation"
      ;;
    REFACTOR)
      LABELS="$LABELS,refactor"
      ;;
    DEPRECATED|BREAKING)
      LABELS="$LABELS,breaking-change"
      ;;
  esac
  
  # Criar issue (verificar se já existe antes)
  EXISTING=$(gh issue list --search "$TITLE" --json number --jq '.[0].number' 2>/dev/null || echo "")
  
  if [[ -z "$EXISTING" ]]; then
    log_success "Criando issue: $TITLE"
    
    gh issue create \
      --title "$TITLE" \
      --body "$BODY" \
      --label "$LABELS" \
      --assignee "@me" 2>/dev/null || {
        log_error "Erro ao criar issue: $TITLE"
        continue
      }
    
    ((ISSUES_CREATED++))
    
    # Pequeno delay para não sobrecarregar a API
    sleep 0.5
  else
    log_warning "Issue já existe: $TITLE (#$EXISTING)"
  fi
done

echo ""
log_success "🎉 Concluído!"
log_info "📊 Total de issues criados: $ISSUES_CREATED"
log_info "🔗 Ver issues: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/issues"
