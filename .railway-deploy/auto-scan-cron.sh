#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# 🤖 AUTO SCAN ISSUES - CRON JOB LOCAL
# ═══════════════════════════════════════════════════════════════════════════
# Script para executar scan de TODOs e criar issues automaticamente
# Pode ser executado manualmente ou via crontab
#
# INSTALAÇÃO NO CRONTAB:
# crontab -e
# Adicionar linha: 0 */6 * * * /workspaces/assistente-juridico-p/auto-scan-cron.sh >> /tmp/auto-scan.log 2>&1
# 
# FREQUÊNCIAS SUGERIDAS:
# - A cada 6 horas:   0 */6 * * *
# - Diariamente 9h:   0 9 * * *
# - A cada hora:      0 * * * *
# - Segunda a sexta:  0 9 * * 1-5
# ═══════════════════════════════════════════════════════════════════════════

set -e

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÕES
# ═══════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Carregar biblioteca comum
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/scripts/lib/common.sh" || {
    echo "❌ Erro: não foi possível carregar scripts/lib/common.sh"
    exit 1
}

LOG_FILE="${SCRIPT_DIR}/logs/auto-scan-cron.log"
LOCK_FILE="/tmp/auto-scan-cron.lock"

# ═══════════════════════════════════════════════════════════════════════════
# VERIFICAÇÕES INICIAIS
# ═══════════════════════════════════════════════════════════════════════════

# Criar diretório de logs se não existir
mkdir -p "${SCRIPT_DIR}/logs"

# Banner
print_header "AUTO SCAN ISSUES - EXECUÇÃO PERIÓDICA"
log_info "Iniciando scan automático de TODOs..."

# Verificar se já está rodando
if [[ -f "${LOCK_FILE}" ]]; then
  PID=$(cat "${LOCK_FILE}")
  if ps -p "${PID}" > /dev/null 2>&1; then
    log_warning "Script já está em execução (PID: ${PID})"
    exit 0
  else
    log_warning "Removendo lock file obsoleto"
    rm -f "${LOCK_FILE}"
  fi
fi

# Criar lock file
echo $$ > "${LOCK_FILE}"

# Cleanup ao sair
trap "rm -f ${LOCK_FILE}" EXIT

# Verificar GitHub CLI
if ! command_exists gh; then
  log_error "GitHub CLI (gh) não está instalado!"
  log_info "Instale com: brew install gh (Mac) ou apt install gh (Ubuntu)"
  exit 1
fi

# Verificar autenticação
if ! gh auth status &> /dev/null; then
  log_error "GitHub CLI não está autenticado!"
  log_info "Execute: gh auth login"
  exit 1
fi

# Ir para diretório do projeto
cd "${SCRIPT_DIR}"

# ═══════════════════════════════════════════════════════════════════════════
# BUSCA DE TODOs
# ═══════════════════════════════════════════════════════════════════════════

log_info "🔍 Buscando TODOs no código..."

# Pattern com todos os 72 triggers
PATTERN="TODO|FIXME|ISSUE|HACK|PENDENTE|REVISAR|CORRIGIR|VERIFICAR|ATENÇÃO|URGENTE|BUG|JURIDICO|PRAZO|INTIMACAO|VALIDAR|COMPLIANCE|LGPD|SEGURANCA|REFACTOR|OPTIMIZE|DEPRECATED|BREAKING|PERFORMANCE|ACCESSIBILITY|A11Y|SECURITY|TEST|DOC|DOCS|CRITICAL|WARNING|NOTE|IDEA|ENHANCEMENT|FEATURE|QUESTION|REVIEW|DEBT|CLEANUP|ATENCAO"

# Buscar em arquivos TypeScript/JavaScript
TODOS=$(grep -rn -E "($PATTERN)" . \
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
  --exclude-dir=logs \
  2>/dev/null || true)

if [[ -z "$TODOS" ]]; then
  log_success "Nenhum TODO encontrado no código!"
  log_info "Sistema está limpo ✨"
  exit 0
fi

# Contar TODOs
TODO_COUNT=$(echo "$TODOS" | wc -l)
log_success "Encontrados ${TODO_COUNT} TODOs no código"

# ═══════════════════════════════════════════════════════════════════════════
# ESTATÍSTICAS
# ═══════════════════════════════════════════════════════════════════════════

log_info "📊 Estatísticas por tipo:"

# Contar cada tipo de trigger
for TRIGGER in TODO FIXME CRITICAL LGPD JURIDICO BUG SECURITY PERFORMANCE; do
  COUNT=$(echo "$TODOS" | grep -i "$TRIGGER" | wc -l || echo "0")
  if [ "$COUNT" -gt 0 ]; then
    echo "   ${TRIGGER}: ${COUNT}"
  fi
done

# ═══════════════════════════════════════════════════════════════════════════
# CRIAR ISSUES (Opcional - comentado por padrão)
# ═══════════════════════════════════════════════════════════════════════════

# NOTA: A criação de issues é feita pelo GitHub Action
# Este script apenas faz o scan e log
# Para criar issues localmente, descomente o bloco abaixo

: <<'COMMENTED_OUT'
log_info "📝 Criando issues no GitHub..."

ISSUES_CREATED=0

while IFS= read -r line; do
  FILE=$(echo "$line" | cut -d: -f1)
  LINE_NUM=$(echo "$line" | cut -d: -f2)
  CONTENT=$(echo "$line" | cut -d: -f3-)
  
  # Extrair tipo de TODO
  TODO_TYPE=$(echo "$CONTENT" | grep -oE "$PATTERN" | head -1)
  
  # Limpar conteúdo
  CLEAN_CONTENT=$(echo "$CONTENT" | sed -E 's/.*('$PATTERN')://g' | sed 's/^[[:space:]]*//')
  
  # Criar título
  TITLE="${TODO_TYPE}: ${CLEAN_CONTENT:0:80}"
  
  # Criar corpo da issue
  BODY="**🤖 Detectado automaticamente (Scan Periódico)**

**📁 Arquivo:** \`${FILE}\`
**📍 Linha:** ${LINE_NUM}
**🏷️ Tipo:** \`${TODO_TYPE}\`

**📝 Descrição:**
\`\`\`
${CLEAN_CONTENT}
\`\`\`

**⏰ Detectado em:** $(date '+%Y-%m-%d %H:%M:%S')

---
_Issue criada automaticamente pelo scan periódico_"
  
  # Verificar se já existe
  EXISTING=$(gh issue list --search "$TITLE" --json number --jq '.[0].number' 2>/dev/null || echo "")
  
  if [[ -n "$EXISTING" ]]; then
    log_info "Issue já existe: #${EXISTING} - ${TITLE:0:50}..."
  else
    # Criar issue
    ISSUE_NUM=$(gh issue create \
      --title "$TITLE" \
      --body "$BODY" \
      --label "auto-created,needs-triage,scheduled-scan" \
      --assignee "@me" \
      2>/dev/null || echo "")
    
    if [[ -n "$ISSUE_NUM" ]]; then
      log_success "Issue criada: ${ISSUE_NUM}"
      ISSUES_CREATED=$((ISSUES_CREATED + 1))
      sleep 0.5 # Rate limiting
    else
      log_error "Falha ao criar issue para: ${TITLE:0:50}..."
    fi
  fi
done <<< "$TODOS"

log_success "Issues criadas: ${ISSUES_CREATED}"
COMMENTED_OUT

# ═══════════════════════════════════════════════════════════════════════════
# RESUMO FINAL
# ═══════════════════════════════════════════════════════════════════════════

log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "📊 RESUMO DA EXECUÇÃO"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ⏰ Data/Hora: $(date '+%Y-%m-%d %H:%M:%S')"
echo "   🔍 TODOs encontrados: ${TODO_COUNT}"
echo "   📂 Diretório: ${SCRIPT_DIR}"
echo "   📝 Log: ${LOG_FILE}"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Notificação (opcional - requer notify-send)
if command_exists notify-send; then
  notify-send "🤖 Auto Scan Issues" "Scan completo! ${TODO_COUNT} TODOs encontrados" 2>/dev/null || true
fi

log_success "✨ Scan automático concluído com sucesso!"

exit 0
