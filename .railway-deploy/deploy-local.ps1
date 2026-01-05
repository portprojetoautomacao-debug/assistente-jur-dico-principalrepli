# ?? Script de Deploy Local Automático
# Assistente Jurídico PJe - Deploy Local Completo

Write-Host "?? ASSISTENTE JURÍDICO PJe - DEPLOY LOCAL AUTOMÁTICO" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretório correto
$currentDir = Get-Location
$expectedDir = "assistente-jur-dico-principal"

if ($currentDir.Path -notlike "*$expectedDir*") {
    Write-Host "? ERRO: Execute este script dentro da pasta '$expectedDir'" -ForegroundColor Red
    Write-Host "?? Você está em: $currentDir" -ForegroundColor Yellow
    exit 1
}

Write-Host "?? Diretório correto: $currentDir" -ForegroundColor Green
Write-Host ""

# ============================================
# 1. VERIFICAÇÃO DE PRÉ-REQUISITOS
# ============================================

Write-Host "?? VERIFICANDO PRÉ-REQUISITOS..." -ForegroundColor Yellow

# Verificar Node.js
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "? Node.js: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js não encontrado"
    }
} catch {
    Write-Host "? Node.js não encontrado. Instale Node.js 22.x" -ForegroundColor Red
    Write-Host "?? Download: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar npm
try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "? npm: $npmVersion" -ForegroundColor Green
    } else {
        throw "npm não encontrado"
    }
} catch {
    Write-Host "? npm não encontrado" -ForegroundColor Red
    exit 1
}

# Verificar se package.json existe
if (Test-Path "package.json") {
    Write-Host "? package.json encontrado" -ForegroundColor Green
} else {
    Write-Host "? package.json não encontrado" -ForegroundColor Red
    exit 1
}

# Verificar se .env existe
if (Test-Path ".env") {
    Write-Host "? Arquivo .env encontrado" -ForegroundColor Green
} else {
    Write-Host "??  Arquivo .env não encontrado. Criando template..." -ForegroundColor Yellow

    @"
# === CONFIGURAÇÕES OBRIGATÓRIAS ===
VITE_GEMINI_API_KEY=sua_chave_gemini_aqui
UPSTASH_REDIS_REST_URL=https://sua-instancia.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_token_aqui

# === CONFIGURAÇÕES OPCIONAIS ===
VITE_GOOGLE_CLIENT_ID=seu_client_id_google
VITE_GOOGLE_API_KEY=sua_api_key_google
VITE_SENTRY_DSN=seu_dsn_sentry

# === AMBIENTE ===
VITE_APP_ENV=development
"@ | Out-File -FilePath ".env" -Encoding UTF8

    Write-Host "?? Template .env criado. Edite com suas credenciais!" -ForegroundColor Yellow
    Write-Host "?? Execute novamente após configurar o .env" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ============================================
# 2. INSTALAÇÃO DE DEPENDÊNCIAS
# ============================================

Write-Host "?? INSTALANDO DEPENDÊNCIAS..." -ForegroundColor Yellow

try {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "? Dependências instaladas com sucesso" -ForegroundColor Green
    } else {
        throw "Falha na instalação"
    }
} catch {
    Write-Host "? Falha ao instalar dependências" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# 3. VERIFICAÇÃO DE BUILD
# ============================================

Write-Host "?? VERIFICANDO BUILD..." -ForegroundColor Yellow

try {
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "? Build realizado com sucesso" -ForegroundColor Green
    } else {
        throw "Falha no build"
    }
} catch {
    Write-Host "? Falha no build. Verifique os erros acima." -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# 4. INICIALIZAÇÃO DO REDIS (OPCIONAL)
# ============================================

Write-Host "???  VERIFICANDO REDIS..." -ForegroundColor Yellow

$redisUrl = $env:UPSTASH_REDIS_REST_URL
$redisToken = $env:UPSTASH_REDIS_REST_TOKEN

if ($redisUrl -and $redisToken) {
    Write-Host "? Credenciais Redis encontradas" -ForegroundColor Green

    # Tentar inicializar configuração
    try {
        $initUrl = "http://localhost:5173/api/kv?action=init"
        Write-Host "?? Inicializando configuração Redis..." -ForegroundColor Yellow
        Write-Host "??  Nota: O servidor precisa estar rodando para esta etapa" -ForegroundColor Yellow
        Write-Host "?? Execute o servidor primeiro com: npm run dev" -ForegroundColor Cyan
    } catch {
        Write-Host "??  Não foi possível inicializar Redis (servidor não está rodando)" -ForegroundColor Yellow
    }
} else {
    Write-Host "??  Credenciais Redis não encontradas no .env" -ForegroundColor Yellow
    Write-Host "?? Configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN" -ForegroundColor Cyan
}

Write-Host ""

# ============================================
# 5. INICIANDO SERVIDOR DE DESENVOLVIMENTO
# ============================================

Write-Host "?? INICIANDO SERVIDOR DE DESENVOLVIMENTO..." -ForegroundColor Yellow
Write-Host ""
Write-Host "?? URLs disponíveis:" -ForegroundColor Cyan
Write-Host "   ?? App:     http://localhost:5173" -ForegroundColor White
Write-Host "   ?? API:     http://localhost:5173/api/health" -ForegroundColor White
Write-Host "   ?? Preview: http://localhost:4173 (após build)" -ForegroundColor White
Write-Host ""
Write-Host "?? Para parar o servidor: Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Iniciar servidor
npm run dev