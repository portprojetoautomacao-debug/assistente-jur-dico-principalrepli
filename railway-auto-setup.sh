#!/bin/bash
# Script automático para configurar variáveis no Railway
# - NÃO hardcoda segredos: carrega dos arquivos .env do repositório
# - Aplica via: railway variables --set "KEY=VALUE"
# - Opcional: faz deploy no final

set -euo pipefail

echo "🚂 Configurando variáveis Railway automaticamente..."

if ! command -v railway >/dev/null 2>&1; then
    echo "❌ Railway CLI não encontrado!"
    echo "   Instale com: npm i -g @railway/cli"
    exit 1
fi

if ! railway status >/dev/null 2>&1; then
    echo "❌ Railway CLI não autenticado/sem projeto vinculado."
    echo "   Execute: railway login  (e depois: railway link)"
    exit 1
fi

echo "✅ Railway CLI OK (autenticado)"

load_env_file() {
    local filePath="$1"
    if [[ ! -f "$filePath" ]]; then
        return 1
    fi

    # Parser simples de .env:
    # - ignora comentários e linhas vazias
    # - aceita valores com espaços (ex.: GOOGLE_SCOPES=a b c)
    # - não executa nada (diferente de "source")
    while IFS= read -r rawLine || [[ -n "${rawLine}" ]]; do
        # Remove CRLF e espaços nas pontas
        local line="${rawLine%$'\r'}"
        line="${line#${line%%[![:space:]]*}}"
        line="${line%${line##*[![:space:]]}}"

        [[ -z "${line}" ]] && continue
        [[ "${line}" == \#* ]] && continue

        # Suporta linhas com prefixo "export "
        if [[ "${line}" == export\ * ]]; then
            line="${line#export }"
        fi

        if [[ "${line}" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
            local key="${BASH_REMATCH[1]}"
            local value="${BASH_REMATCH[2]}"

            # Remove aspas externas, se existirem
            if [[ "${value}" =~ ^\"(.*)\"$ ]]; then
                value="${BASH_REMATCH[1]}"
            elif [[ "${value}" =~ ^'(.*)'$ ]]; then
                value="${BASH_REMATCH[1]}"
            fi

            # Não sobrescreve um valor já definido com string vazia (comum em .env de exemplo)
            if [[ -z "${value}" && -n "${!key-}" ]]; then
                continue
            fi

            export "${key}=${value}"
        fi
    done < "$filePath"

    echo "✅ Carregado: $(basename "$filePath")"
    return 0
}

echo ""
echo "📦 Carregando variáveis base (.env → .env.local → .env.railway)..."
load_env_file "./.env" || true
load_env_file "./.env.local" || true
load_env_file "./.env.railway" || true

set_var() {
    local key="$1"
    local value="$2"

    if [[ -z "${value}" ]]; then
        echo "❌ Variável obrigatória ausente: $key"
        return 1
    fi

    railway_set_with_retry "${key}" "${value}"
}

set_optional_var() {
    local key="$1"
    local value="$2"
    if [[ -z "${value}" ]]; then
        echo "ℹ️  Skip (vazia): ${key}"
        return 0
    fi
    railway_set_with_retry "${key}" "${value}"
}

railway_set_with_retry() {
    local key="$1"
    local value="$2"
    local maxAttempts="${RAILWAY_SET_MAX_ATTEMPTS:-6}"
    local attempt=1

    while (( attempt <= maxAttempts )); do
        local output
        output="$(railway variables --set "${key}=${value}" 2>&1)" && {
            echo "✅ Set: ${key}"
            return 0
        }

        # Backoff para rate limit do Railway
        if echo "${output}" | grep -qi "rate limit"; then
            local sleepSeconds=$(( attempt * 8 ))
            echo "⏳ Rate limit ao setar ${key}. Tentativa ${attempt}/${maxAttempts}. Aguardando ${sleepSeconds}s..."
            sleep "${sleepSeconds}"
            attempt=$(( attempt + 1 ))
            continue
        fi

        echo "❌ Falha ao setar ${key}." >&2
        return 1
    done

    echo "❌ Falha ao setar ${key} após ${maxAttempts} tentativas (rate limit persistente)." >&2
    return 1
}

echo ""
echo "📋 Aplicando variáveis essenciais..."

PORT_VALUE="${PORT:-${BACKEND_PORT:-3001}}"
set_var "NODE_ENV" "${NODE_ENV:-production}"
set_var "PORT" "${PORT_VALUE}"

echo ""
echo "🗄️  Database..."
set_var "DATABASE_URL" "${DATABASE_URL:-}"

echo ""
echo "🤖 Gemini / Google AI..."
GEMINI_KEY_VALUE="${GEMINI_API_KEY:-${VITE_GEMINI_API_KEY:-${GOOGLE_API_KEY:-${VITE_GOOGLE_API_KEY:-}}}}"
set_var "GEMINI_API_KEY" "${GEMINI_KEY_VALUE}"
set_var "GOOGLE_API_KEY" "${GEMINI_KEY_VALUE}"
set_var "VITE_GEMINI_API_KEY" "${GEMINI_KEY_VALUE}"

echo ""
echo "🔍 Qdrant..."
set_var "VITE_QDRANT_URL" "${VITE_QDRANT_URL:-${QDRANT_URL:-}}"
set_var "VITE_QDRANT_API_KEY" "${VITE_QDRANT_API_KEY:-${QDRANT_API_KEY:-}}"

echo ""
echo "🔍 Sonar..."
set_optional_var "SONAR_TOKEN" "${SONAR_TOKEN:-}"

echo ""
echo "🛡️  Rate limiting..."
set_optional_var "RATE_LIMIT_ENABLED" "${RATE_LIMIT_ENABLED:-true}"
set_optional_var "RATE_LIMIT_MAX_REQUESTS" "${RATE_LIMIT_MAX_REQUESTS:-100}"
set_optional_var "AI_RATE_LIMIT_MAX_REQUESTS" "${AI_RATE_LIMIT_MAX_REQUESTS:-30}"
set_optional_var "RATE_LIMIT_WINDOW_MS" "${RATE_LIMIT_WINDOW_MS:-900000}"

echo ""
echo "⏰ DJEN..."
set_optional_var "DJEN_SCHEDULER_ENABLED" "${DJEN_SCHEDULER_ENABLED:-false}"
set_optional_var "DJEN_OAB_NUMERO" "${DJEN_OAB_NUMERO:-184404}"
set_optional_var "DJEN_OAB_UF" "${DJEN_OAB_UF:-MG}"
set_optional_var "DJEN_ADVOGADO_NOME" "${DJEN_ADVOGADO_NOME:-Thiago Bodevan Veiga}"
set_optional_var "TZ" "${TZ:-America/Sao_Paulo}"

echo ""
echo "🌐 URLs..."
set_optional_var "FRONTEND_URL" "${FRONTEND_URL:-https://assistente-juridico-p.vercel.app}"
set_optional_var "ALLOWED_ORIGINS" "${ALLOWED_ORIGINS:-https://assistente-juridico-p.vercel.app}"

echo ""
echo "🔐 Sessão..."
if [[ -z "${SESSION_SECRET:-}" ]]; then
    # Gera um segredo real caso não exista nenhum nos .env
    SESSION_SECRET="$(openssl rand -base64 48 2>/dev/null || true)"
fi
set_var "SESSION_SECRET" "${SESSION_SECRET}"

echo ""
echo "📊 Observabilidade..."
set_optional_var "VITE_OTLP_ENDPOINT" "${VITE_OTLP_ENDPOINT:-http://localhost:4318/v1/traces}"

echo ""
echo "⚙️  App..."
set_optional_var "VITE_APP_ENV" "${VITE_APP_ENV:-production}"
set_optional_var "VITE_APP_VERSION" "${VITE_APP_VERSION:-1.0.0}"

echo ""
echo "🎉 Variáveis aplicadas com sucesso no Railway."

DEPLOY_AFTER_SETUP="${DEPLOY_AFTER_SETUP:-true}"
if [[ "${DEPLOY_AFTER_SETUP}" == "true" ]]; then
    echo ""
    echo "🚀 Fazendo deploy (railway up --detach)..."
    railway up --detach
    echo "✅ Deploy disparado."
    echo "📊 Logs: railway logs"
    echo "🔗 Status: railway status"
else
    echo ""
    echo "ℹ️  Deploy não executado (DEPLOY_AFTER_SETUP=false)."
    echo "🚀 Para fazer deploy: railway up --detach"
fi
