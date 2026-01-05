# ?? Script de Verificação Pós-Deploy
# Verifica se o deploy local está funcionando corretamente

Write-Host "?? VERIFICAÇÃO PÓS-DEPLOY - ASSISTENTE JURÍDICO PJe" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# ============================================
# 1. VERIFICAR SERVIDOR
# ============================================

Write-Host "?? VERIFICANDO SERVIDOR..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "? Servidor respondendo na porta 5173" -ForegroundColor Green
    } else {
        throw "Status code: $($response.StatusCode)"
    }
} catch {
    $errors += "Servidor não está respondendo na porta 5173"
    Write-Host "? Servidor não está rodando" -ForegroundColor Red
    Write-Host "?? Execute: npm run dev" -ForegroundColor Yellow
}

# ============================================
# 2. VERIFICAR API HEALTH
# ============================================

Write-Host "?? VERIFICANDO API..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173/api/health" -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        $content = $response.Content | ConvertFrom-Json
        if ($content.status -eq "ok") {
            Write-Host "? API Health OK" -ForegroundColor Green
        } else {
            $warnings += "API retornou status diferente de 'ok'"
            Write-Host "??  API Health: $($content.status)" -ForegroundColor Yellow
        }
    } else {
        throw "Status code: $($response.StatusCode)"
    }
} catch {
    $errors += "API não está respondendo"
    Write-Host "? API não está respondendo" -ForegroundColor Red
}

# ============================================
# 3. VERIFICAR REDIS
# ============================================

Write-Host "???  VERIFICANDO REDIS..." -ForegroundColor Yellow

$redisUrl = $env:UPSTASH_REDIS_REST_URL
$redisToken = $env:UPSTASH_REDIS_REST_TOKEN

if ($redisUrl -and $redisToken) {
    try {
        # Tentar fazer uma requisição simples ao Redis
        $headers = @{
            "Authorization" = "Bearer $redisToken"
        }
        $response = Invoke-WebRequest -Uri "$redisUrl/get/test" -Headers $headers -TimeoutSec 10 -ErrorAction Stop

        if ($response.StatusCode -eq 200) {
            Write-Host "? Redis conectado" -ForegroundColor Green
        } else {
            throw "Status code: $($response.StatusCode)"
        }
    } catch {
        $warnings += "Não foi possível conectar ao Redis"
        Write-Host "??  Redis não acessível" -ForegroundColor Yellow
        Write-Host "?? Verifique UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN no .env" -ForegroundColor Cyan
    }
} else {
    $warnings += "Credenciais Redis não configuradas"
    Write-Host "??  Credenciais Redis não encontradas" -ForegroundColor Yellow
    Write-Host "?? Configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN no .env" -ForegroundColor Cyan
}

# ============================================
# 4. VERIFICAR ARQUIVOS ESTÁTICOS
# ============================================

Write-Host "?? VERIFICANDO ARQUIVOS..." -ForegroundColor Yellow

$requiredFiles = @(
    "package.json",
    ".env",
    "src/App.tsx",
    "src/main.tsx",
    "vite.config.ts",
    "dist/index.html"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "? $file" -ForegroundColor Green
    } else {
        $errors += "Arquivo não encontrado: $file"
        Write-Host "? $file" -ForegroundColor Red
    }
}

# ============================================
# 5. VERIFICAR DEPENDÊNCIAS
# ============================================

Write-Host "?? VERIFICANDO DEPENDÊNCIAS..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    $moduleCount = (Get-ChildItem "node_modules" -Directory | Measure-Object).Count
    Write-Host "? $moduleCount módulos instalados" -ForegroundColor Green
} else {
    $errors += "node_modules não encontrado"
    Write-Host "? node_modules não encontrado" -ForegroundColor Red
}

# ============================================
# 6. VERIFICAR BUILD
# ============================================

Write-Host "?? VERIFICANDO BUILD..." -ForegroundColor Yellow

if (Test-Path "dist") {
    $filesCount = (Get-ChildItem "dist" -Recurse -File | Measure-Object).Count
    Write-Host "? Build existe ($filesCount arquivos)" -ForegroundColor Green
} else {
    $errors += "Build não encontrado"
    Write-Host "? Build não encontrado" -ForegroundColor Red
    Write-Host "?? Execute: npm run build" -ForegroundColor Yellow
}

# ============================================
# 7. VERIFICAR TESTES
# ============================================

Write-Host "?? VERIFICANDO TESTES..." -ForegroundColor Yellow

try {
    $testResult = npm run test:run 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "? Testes passando" -ForegroundColor Green
    } else {
        $warnings += "Alguns testes podem estar falhando"
        Write-Host "??  Verifique os testes manualmente" -ForegroundColor Yellow
    }
} catch {
    $warnings += "Não foi possível executar testes"
    Write-Host "??  Testes não puderam ser verificados" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# RESULTADO FINAL
# ============================================

Write-Host "?? RESULTADO DA VERIFICAÇÃO" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

if ($errors.Count -eq 0) {
    Write-Host "?? DEPLOY FUNCIONANDO PERFEITAMENTE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "?? Acesse: http://localhost:5173" -ForegroundColor White
    Write-Host "?? API:    http://localhost:5173/api/health" -ForegroundColor White
} else {
    Write-Host "? PROBLEMAS ENCONTRADOS:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   • $error" -ForegroundColor Red
    }
}

if ($warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "??  AVISOS:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "   • $warning" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "?? Para mais informações, consulte:" -ForegroundColor Cyan
Write-Host "   • DEPLOY_LOCAL.md" -ForegroundColor White
Write-Host "   • README.md" -ForegroundColor White
Write-Host "   • BUILD_GUIDE.md" -ForegroundColor White

Write-Host ""
Write-Host "???  Comandos úteis:" -ForegroundColor Cyan
Write-Host "   • npm run dev     - Iniciar desenvolvimento" -ForegroundColor White
Write-Host "   • npm run build   - Build de produção" -ForegroundColor White
Write-Host "   • npm run test    - Executar testes" -ForegroundColor White
Write-Host "   • npm run lint    - Verificar código" -ForegroundColor White

Write-Host ""