#!/usr/bin/env bash
set -euo pipefail

# railway-cli-configure.sh
# Script para configurar projeto Railway via CLI (DSPy bridge + variáveis de ambiente)
# Uso: ./scripts/railway-cli-configure.sh --project <RAILWAY_PROJECT_ID> --vercel-url <VERCEL_URL>

print_help() {
  cat <<'EOF'
Uso: $0 [--project PROJECT_ID] [--vercel-url VERCEL_URL] [--non-interactive]

Exemplo:
  ./scripts/railway-cli-configure.sh --project a364e7f2-c234-477b-8dac-918f00f64737 \
    --vercel-url https://assistente-juridico-github.vercel.app

O script:
  - Verifica e instala Railway CLI (via npm) se necessário
  - Autentica no Railway (railway login)
  - Conecta ao projeto Railway com `railway link -p PROJECT_ID`
  - Pergunta/usa variáveis do ambiente local (.env) e configura secrets no Railway
  - Pode realizar `railway up` (deploy) no final
EOF
}

PROJECT_ID=""
VERCEL_URL=""
NON_INTERACTIVE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT_ID="$2"; shift 2;;
    --vercel-url)
      VERCEL_URL="$2"; shift 2;;
    --non-interactive)
      NON_INTERACTIVE=true; shift 1;;
    -h|--help)
      print_help; exit 0;;
    *)
      echo "Unknown option: $1"; print_help; exit 1;;
  esac
done

if ! command -v railway &> /dev/null; then
  echo "Railway CLI não encontrado. Instalando via npm..."
  npm install -g @railway/cli
fi

echo "Railway CLI: $(railway --version 2>/dev/null || echo 'unknown')"

if ! railway whoami &> /dev/null; then
  echo "Railway: autenticando (abra o browser se solicitado)..."
  railway login
fi

if [[ -z "$PROJECT_ID" ]]; then
  read -p "Digite o Railway PROJECT ID (ex: a364e7f2-...): " PROJECT_ID
fi

echo "Conectando ao projeto Railway: $PROJECT_ID"
railway link -p "$PROJECT_ID"

# Carrega .env se houver
if [[ -f ".env" ]]; then
  echo "Carregando variáveis de .env";
  # shellcheck disable=SC1090
  source .env || true
fi

ask_or_default() {
  # $1 = var name, $2 = default
  local n=$1
  local def=${2:-}
  local val=""
  # indirect expansion in bash for var name
  if [[ -n "${!n:-}" ]]; then
    val=${!n}
    echo "$val"
    return 0
  fi
  if [[ "$NON_INTERACTIVE" == "true" ]]; then
    echo "$def"
    return 0
  fi
  read -p "$n [ENTER para usar valor padrão '${def}']: " input
  if [[ -z "$input" ]]; then
    echo "$def"
  else
    echo "$input"
  fi
}

echo "Preparando variáveis de ambiente para o DSPy Bridge..."

# Gera token seguro se não houver
if [[ -z "${DSPY_API_TOKEN:-}" ]]; then
  echo "Gerando DSPY_API_TOKEN temporário..."
  DSPY_API_TOKEN=$(openssl rand -base64 32)
  echo "Token gerado (não compartilhe): ${DSPY_API_TOKEN:0:10}..."
fi

if [[ -z "${DSPY_PORT:-}" ]]; then
  DSPY_PORT=8765
fi

if [[ -z "${ALLOWED_ORIGINS:-}" ]]; then
  if [[ -n "$VERCEL_URL" ]]; then
    ALLOWED_ORIGINS="$VERCEL_URL"
  else
    ALLOWED_ORIGINS=$(ask_or_default "ALLOWED_ORIGINS" "https://assistente-juridico-github.vercel.app")
  fi
fi

if [[ -z "${NODE_ENV:-}" ]]; then
  NODE_ENV=production
fi

if [[ -z "${DSPY_LM_MODEL:-}" ]]; then
  DSPY_LM_MODEL="openai/gpt-3.5-turbo"
fi

echo "As variáveis a serem configuradas no Railway (não serão exibidos valores sensíveis):"
echo "  - DSPY_API_TOKEN"
echo "  - DSPY_PORT=$DSPY_PORT"
echo "  - ALLOWED_ORIGINS=$ALLOWED_ORIGINS"
echo "  - NODE_ENV=$NODE_ENV"
echo "  - DSPY_LM_MODEL=$DSPY_LM_MODEL"

railway variables set DSPY_API_TOKEN="$DSPY_API_TOKEN"
railway variables set DSPY_PORT="$DSPY_PORT"
railway variables set ALLOWED_ORIGINS="$ALLOWED_ORIGINS"
railway variables set NODE_ENV="$NODE_ENV"
railway variables set DSPY_LM_MODEL="$DSPY_LM_MODEL"

# Optional variables (Qdrant, Upstash, OpenAI/Gemini, Resend, Embeddings)
for v in "QDRANT_URL" "QDRANT_API_KEY" "UPSTASH_REDIS_REST_URL" "UPSTASH_REDIS_REST_TOKEN" \
         "GEMINI_API_KEY" "OPENAI_API_KEY" "EMBEDDINGS_API_KEY" "RESEND_API_KEY"; do
  if [[ -n "${!v:-}" ]]; then
    echo "Configurando $v..."
    railway variables set $v="${!v}"
  else
    if [[ "$NON_INTERACTIVE" == "false" ]]; then
      read -p "Deseja configurar $v no Railway agora? (s/N): " yn
      if [[ "$yn" =~ ^[Yy]$ ]]; then
        read -p "Cole o valor de $v: " val
        railway variables set $v="$val"
      else
        echo "Pulando $v"
      fi
    fi
  fi
done

echo "Variáveis configuradas. Verificando algumas configurações..."
railway variables

if [[ "$NON_INTERACTIVE" == "true" ]]; then
  echo "Non-interactive mode: não executarei 'railway up' automaticamente. Rode 'railway up' para iniciar o deploy.";
  exit 0
fi

read -p "Executar 'railway up' agora para fazer deploy? (S/n): " doit
doit=${doit:-S}
if [[ "$doit" =~ ^[Ss]$ ]]; then
  echo "Executando deploy..."
  railway up
  echo "Railway deploy concluído. Acompanhe logs: railway logs --tail 100"
else
  echo "Pulando deploy (você pode rodar: railway up)."
fi

echo "Próximo passo: configure Vercel com as variáveis necessárias (DSPY_BRIDGE_URL, DSPY_API_TOKEN, VITE_DSPY_URL, VITE_DSPY_API_TOKEN entre outras)"
