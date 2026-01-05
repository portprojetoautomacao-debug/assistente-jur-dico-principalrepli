# =============================================================================
# Script de Teste - Tracing com AI Toolkit (PowerShell)
# =============================================================================
# Este script valida a configuração do tracing e exportação de traces
# para o AI Toolkit Trace Viewer na porta 4319.
#
# Uso: .\scripts\test-tracing-setup.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "🔍 Validando configuração de Tracing..." -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 1. Verificar .env.local
# ============================================================================
Write-Host "1️⃣ Verificando .env.local..." -ForegroundColor Yellow

if (-Not (Test-Path ".env.local")) {
    Write-Host "❌ Arquivo .env.local não encontrado" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content ".env.local" | Out-String
$otlpEndpoint = ($envContent | Select-String -Pattern "VITE_OTLP_ENDPOINT=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()

if ($otlpEndpoint -eq "http://localhost:4319/v1/traces") {
    Write-Host "✅ Endpoint OTLP configurado corretamente: $otlpEndpoint" -ForegroundColor Green
} else {
    Write-Host "❌ Endpoint OTLP incorreto: $otlpEndpoint" -ForegroundColor Red
    Write-Host "   Esperado: http://localhost:4319/v1/traces" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ============================================================================
# 2. Verificar porta 4319
# ============================================================================
Write-Host "2️⃣ Verificando se porta 4319 está em uso (AI Toolkit)..." -ForegroundColor Yellow

$portInUse = Get-NetTCPConnection -LocalPort 4319 -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "✅ Porta 4319 está em uso (AI Toolkit rodando)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Porta 4319 não está em uso" -ForegroundColor Yellow
    Write-Host "   Execute no VS Code: Ctrl+Shift+P → 'AI Toolkit: Open Trace Viewer'" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# 3. Verificar arquivos de tracing
# ============================================================================
Write-Host "3️⃣ Verificando arquivos de tracing..." -ForegroundColor Yellow

$tracingFiles = @(
    "src\lib\otel-integration.ts",
    "src\lib\tracing.ts",
    "src\lib\agent-tracing.ts",
    "src\main.tsx"
)

$allFilesOk = $true

foreach ($file in $tracingFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file não encontrado" -ForegroundColor Red
        $allFilesOk = $false
    }
}

if (-Not $allFilesOk) {
    exit 1
}

Write-Host ""

# ============================================================================
# 4. Verificar inicialização no main.tsx
# ============================================================================
Write-Host "4️⃣ Verificando inicialização do OpenTelemetry..." -ForegroundColor Yellow

$mainContent = Get-Content "src\main.tsx" | Out-String

if ($mainContent -match "initializeOpenTelemetry\(\)") {
    Write-Host "✅ OpenTelemetry inicializado no main.tsx" -ForegroundColor Green
} else {
    Write-Host "❌ initializeOpenTelemetry() não encontrado em main.tsx" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# 5. Verificar dependências npm
# ============================================================================
Write-Host "5️⃣ Verificando dependências OpenTelemetry..." -ForegroundColor Yellow

$otelPackages = @(
    "@opentelemetry/api",
    "@opentelemetry/sdk-trace-web",
    "@opentelemetry/exporter-trace-otlp-http",
    "@opentelemetry/resources",
    "@opentelemetry/semantic-conventions"
)

foreach ($package in $otelPackages) {
    $installed = npm list $package 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $package" -ForegroundColor Green
    } else {
        Write-Host "❌ $package não instalado" -ForegroundColor Red
        Write-Host "   Execute: npm install" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# ============================================================================
# 6. Teste de conectividade OTLP (opcional)
# ============================================================================
Write-Host "6️⃣ Testando conectividade com endpoint OTLP..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:4319/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✅ Endpoint OTLP acessível" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Não foi possível conectar a http://localhost:4319" -ForegroundColor Yellow
    Write-Host "   Certifique-se de que o AI Toolkit Trace Viewer está rodando" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# 7. Resumo
# ============================================================================
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ Configuração de Tracing VÁLIDA!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Próximos Passos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Iniciar AI Toolkit Trace Viewer:"
Write-Host "   VS Code → Ctrl+Shift+P → 'AI Toolkit: Open Trace Viewer'"
Write-Host ""
Write-Host "2. Iniciar aplicação:"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "3. Executar ações dos agentes:"
Write-Host "   - Criar intimação"
Write-Host "   - Gerar minuta com IA"
Write-Host "   - Pesquisar jurisprudência"
Write-Host ""
Write-Host "4. Visualizar traces no AI Toolkit"
Write-Host ""
Write-Host "📚 Documentação: docs\TRACING_VISUALIZATION_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
