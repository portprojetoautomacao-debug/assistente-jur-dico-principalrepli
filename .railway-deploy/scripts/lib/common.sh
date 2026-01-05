#!/bin/bash
# Biblioteca comum para scripts shell
# Resolve 74 MAJOR issues de shell scripts duplicados

# ============================================================================
# CORES E FORMATAÇÃO
# ============================================================================

# Definir cores como constantes (evita duplicação literal)
readonly COLOR_RED='\033[0;31m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[0;33m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_CYAN='\033[0;36m'
readonly COLOR_RESET='\033[0m'

# ============================================================================
# FUNÇÕES DE LOG
# ============================================================================

# Log com timestamp
log() {
  local message="$1"
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ${message}"
}

# Log de info
log_info() {
  local message="$1"
  echo -e "${COLOR_BLUE}ℹ️  ${message}${COLOR_RESET}"
}

# Log de sucesso
log_success() {
  local message="$1"
  echo -e "${COLOR_GREEN}✅ ${message}${COLOR_RESET}"
}

# Log de warning
log_warning() {
  local message="$1"
  echo -e "${COLOR_YELLOW}⚠️  ${message}${COLOR_RESET}"
}

# Log de erro
log_error() {
  local message="$1"
  echo -e "${COLOR_RED}❌ ${message}${COLOR_RESET}" >&2
}

# ============================================================================
# VALIDAÇÕES
# ============================================================================

# Verificar se comando existe
command_exists() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1
  return $?
}

# Verificar se arquivo existe
file_exists() {
  local file="$1"
  [[ -f "$file" ]]
  return $?
}

# Verificar se diretório existe
dir_exists() {
  local dir="$1"
  [[ -d "$dir" ]]
  return $?
}

# Verificar se variável está definida e não vazia
is_set() {
  local var="$1"
  [[ -n "$var" ]]
  return $?
}

# ============================================================================
# TRATAMENTO DE ERROS
# ============================================================================

# Sair com erro
die() {
  local message="$1"
  local exit_code="${2:-1}"
  log_error "$message"
  exit "$exit_code"
}

# Verificar exit code do último comando
check_exit_code() {
  local exit_code=$?
  local message="$1"
  
  if [[ $exit_code -ne 0 ]]; then
    die "$message" "$exit_code"
  fi
  
  return 0
}

# ============================================================================
# VALIDAÇÃO DE DEPENDÊNCIAS
# ============================================================================

# Verificar múltiplos comandos necessários
require_commands() {
  local missing_commands=()
  
  for cmd in "$@"; do
    if ! command_exists "$cmd"; then
      missing_commands+=("$cmd")
    fi
  done
  
  if [[ ${#missing_commands[@]} -gt 0 ]]; then
    die "Comandos não encontrados: ${missing_commands[*]}"
  fi
  
  return 0
}

# Verificar Node.js e npm
check_node_npm() {
  require_commands node npm
  
  local node_version
  node_version=$(node --version)
  log_info "Node.js: $node_version"
  
  local npm_version
  npm_version=$(npm --version)
  log_info "npm: $npm_version"
  
  return 0
}

# ============================================================================
# OPERAÇÕES GIT
# ============================================================================

# Verificar se está em repositório git
is_git_repo() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1
  return $?
}

# Verificar se há mudanças não commitadas
has_uncommitted_changes() {
  [[ -n "$(git status --porcelain)" ]]
  return $?
}

# Obter branch atual
get_current_branch() {
  git rev-parse --abbrev-ref HEAD
  return 0
}

# Verificar se branch existe
branch_exists() {
  local branch="$1"
  git rev-parse --verify "$branch" >/dev/null 2>&1
  return $?
}

# ============================================================================
# OPERAÇÕES NPM
# ============================================================================

# Instalar dependências npm
npm_install() {
  log_info "Instalando dependências npm..."
  npm install --quiet
  check_exit_code "Falha ao instalar dependências npm"
  log_success "Dependências instaladas"
  return 0
}

# Executar script npm
npm_run() {
  local script="$1"
  log_info "Executando: npm run $script"
  npm run "$script"
  return $?
}

# Verificar se script npm existe
npm_script_exists() {
  local script="$1"
  npm run | grep -q "^  $script$"
  return $?
}

# ============================================================================
# VALIDAÇÃO DE AMBIENTE
# ============================================================================

# Verificar variáveis de ambiente obrigatórias
require_env_vars() {
  local missing_vars=()
  
  for var in "$@"; do
    if ! is_set "${!var}"; then
      missing_vars+=("$var")
    fi
  done
  
  if [[ ${#missing_vars[@]} -gt 0 ]]; then
    die "Variáveis de ambiente não definidas: ${missing_vars[*]}"
  fi
  
  return 0
}

# Carregar .env se existir
load_env() {
  local env_file="${1:-.env}"
  
  if file_exists "$env_file"; then
    log_info "Carregando variáveis de $env_file"
    # shellcheck disable=SC1090
    set -a
    source "$env_file"
    set +a
    log_success "Variáveis carregadas"
  else
    log_warning "Arquivo $env_file não encontrado"
  fi
  
  return 0
}

# ============================================================================
# UTILITÁRIOS
# ============================================================================

# Perguntar sim/não
ask_yes_no() {
  local question="$1"
  local default="${2:-n}"
  
  local prompt
  if [[ "$default" == "y" ]]; then
    prompt="[Y/n]"
  else
    prompt="[y/N]"
  fi
  
  read -r -p "$question $prompt: " answer
  answer="${answer:-$default}"
  
  [[ "$answer" =~ ^[Yy]$ ]]
  return $?
}

# Limpar arquivos temporários
cleanup_temp() {
  local temp_dir="${1:-/tmp}"
  log_info "Limpando arquivos temporários em $temp_dir..."
  
  find "$temp_dir" -name "*.tmp" -type f -delete 2>/dev/null || true
  
  log_success "Limpeza concluída"
  return 0
}

# Criar backup de arquivo
backup_file() {
  local file="$1"
  
  if ! file_exists "$file"; then
    log_warning "Arquivo não existe: $file"
    return 1
  fi
  
  local backup="${file}.backup"
  cp "$file" "$backup"
  log_success "Backup criado: $backup"
  
  return 0
}

# ============================================================================
# RETRY LOGIC
# ============================================================================

# Executar comando com retry
retry() {
  local max_attempts="${1:-3}"
  local delay="${2:-5}"
  shift 2
  local cmd=("$@")
  
  local attempt=1
  
  while [[ $attempt -le $max_attempts ]]; do
    log_info "Tentativa $attempt de $max_attempts: ${cmd[*]}"
    
    if "${cmd[@]}"; then
      log_success "Comando executado com sucesso"
      return 0
    fi
    
    if [[ $attempt -lt $max_attempts ]]; then
      log_warning "Falha. Aguardando ${delay}s antes de tentar novamente..."
      sleep "$delay"
    fi
    
    ((attempt++))
  done
  
  log_error "Comando falhou após $max_attempts tentativas"
  return 1
}

# ============================================================================
# HEADER/FOOTER
# ============================================================================

# Printar header bonito
print_header() {
  local title="$1"
  local width=78
  
  echo ""
  echo "╔$(printf '═%.0s' $(seq 1 $((width - 2))))╗"
  echo "║ $(printf '%-*s' $((width - 4)) "$title") ║"
  echo "╚$(printf '═%.0s' $(seq 1 $((width - 2))))╝"
  echo ""
}

# Printar separador
print_separator() {
  local char="${1:-─}"
  local width=78
  printf '%*s\n' "$width" '' | tr ' ' "$char"
}

# ============================================================================
# EXPORTS
# ============================================================================

# Exportar funções para uso em subscripts
export -f log log_info log_success log_warning log_error
export -f command_exists file_exists dir_exists is_set
export -f die check_exit_code require_commands
export -f is_git_repo has_uncommitted_changes get_current_branch branch_exists
export -f npm_install npm_run npm_script_exists
export -f require_env_vars load_env
export -f ask_yes_no cleanup_temp backup_file
export -f retry print_header print_separator
