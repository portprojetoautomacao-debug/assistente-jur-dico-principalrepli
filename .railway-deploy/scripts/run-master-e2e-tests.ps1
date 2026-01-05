#!/usr/bin/env pwsh
# 🧪 Master E2E Test Runner (PowerShell)
# Executa todos os testes end-to-end do sistema

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🧪 TESTES END-TO-END - Assistente Jurídico PJe             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Iniciado em: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

# Criar diretório para relatórios
New-Item -ItemType Directory -Force -Path "test-reports" | Out-Null

$results = @()
$startTime = Get-Date

# Função para executar teste
function Run-Test {
    param(
        [string]$Name,
        [scriptblock]$Command,
        [switch]$Optional
    )
    
    Write-Host ""
    Write-Host "▶️  $Name" -ForegroundColor Yellow
    Write-Host "────────────────────────────────────────────────────────────────" -ForegroundColor Gray
    
    $testStart = Get-Date
    try {
        & $Command
        $duration = (Get-Date) - $testStart
        Write-Host "✅ $Name: PASSOU ($($duration.TotalSeconds.ToString('F2'))s)" -ForegroundColor Green
        
        $script:results += [PSCustomObject]@{
            Test = $Name
            Status = "PASS"
            Duration = $duration.TotalSeconds
            Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        }
        return $true
    }
    catch {
        $duration = (Get-Date) - $testStart
        if ($Optional) {
            Write-Host "⚠️  $Name: FALHOU (opcional - continuando)" -ForegroundColor Yellow
            Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor DarkYellow
            
            $script:results += [PSCustomObject]@{
                Test = $Name
                Status = "WARN"
                Duration = $duration.TotalSeconds
                Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
                Error = $_.Exception.Message
            }
            return $true
        }
        else {
            Write-Host "❌ $Name: FALHOU" -ForegroundColor Red
            Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor DarkRed
            
            $script:results += [PSCustomObject]@{
                Test = $Name
                Status = "FAIL"
                Duration = $duration.TotalSeconds
                Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
                Error = $_.Exception.Message
            }
            return $false
        }
    }
}

# ============================================================================
# 1. VALIDAÇÃO DE AMBIENTE
# ============================================================================

Write-Host "📦 Fase 1: Validação de Ambiente" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Gray

Run-Test "Node.js Version" {
    $version = node --version
    Write-Host "   Version: $version" -ForegroundColor White
    if (-not $version) { throw "Node.js não encontrado" }
}

Run-Test "npm Version" {
    $version = npm --version
    Write-Host "   Version: $version" -ForegroundColor White
    if (-not $version) { throw "npm não encontrado" }
}

Run-Test "TypeScript Instalado" {
    $version = npx tsc --version
    Write-Host "   $version" -ForegroundColor White
    if (-not $version) { throw "TypeScript não encontrado" }
}

# ============================================================================
# 2. VERIFICAÇÃO DE CONFIGURAÇÃO
# ============================================================================

Write-Host ""
Write-Host "🔐 Fase 2: Verificação de Configuração" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Gray

if (Test-Path ".env") {
    Write-Host "   ✅ Arquivo .env encontrado" -ForegroundColor Green
    
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -match "VITE_GEMINI_API_KEY") {
        Write-Host "   ✅ VITE_GEMINI_API_KEY configurada" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  VITE_GEMINI_API_KEY não encontrada" -ForegroundColor Yellow
    }
    
    if ($envContent -match "UPSTASH_REDIS_REST_URL") {
        Write-Host "   ✅ UPSTASH_REDIS_REST_URL configurada" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  UPSTASH_REDIS_REST_URL não encontrada" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Arquivo .env não encontrado" -ForegroundColor Yellow
}

# ============================================================================
# 3. TYPE CHECK
# ============================================================================

Write-Host ""
Write-Host "🔨 Fase 3: TypeScript Type Check" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Gray

Run-Test "TypeScript Type Check" {
    npm run type-check 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Type check encontrou erros"
    }
    Write-Host "   ✅ Sem erros de tipagem" -ForegroundColor Green
} -Optional

# ============================================================================
# 4. LINTING
# ============================================================================

Write-Host ""
Write-Host "🧹 Fase 4: ESLint" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Gray

Run-Test "ESLint Check" {
    npm run lint 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Linting encontrou problemas"
    }
    Write-Host "   ✅ Sem problemas de lint" -ForegroundColor Green
} -Optional

# ============================================================================
# 5. TESTES UNITÁRIOS
# ============================================================================

Write-Host ""
Write-Host "🧪 Fase 5: Testes Unitários" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Gray

Run-Test "Testes Unitários (Vitest)" {
    npm run test:run 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Alguns testes falharam"
    }
    Write-Host "   ✅ Todos os testes passaram" -ForegroundColor Green
}

# ============================================================================
# 6. BUILD DE PRODUÇÃO
# ============================================================================

Write-Host ""
Write-Host "🏗️  Fase 6: Build de Produção" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Gray

Run-Test "Build de Produção" {
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Build falhou"
    }
    
    if (Test-Path "dist") {
        Write-Host "   ✅ Diretório dist/ criado" -ForegroundColor Green
        
        if (Test-Path "dist/index.html") {
            Write-Host "   ✅ index.html gerado" -ForegroundColor Green
        } else {
            throw "index.html não encontrado em dist/"
        }
        
        # Tamanho dos bundles
        $jsFiles = Get-ChildItem "dist/assets/*.js" -ErrorAction SilentlyContinue | 
                   Sort-Object Length -Descending | 
                   Select-Object -First 5
        
        if ($jsFiles) {
            Write-Host "   📊 Top 5 bundles:" -ForegroundColor Cyan
            foreach ($file in $jsFiles) {
                $sizeMB = ($file.Length / 1MB).ToString("F2")
                Write-Host "      - $($file.Name): ${sizeMB}MB" -ForegroundColor White
            }
        }
    } else {
        throw "Diretório dist/ não foi criado"
    }
}

# ============================================================================
# 7. SERENA MCP (se configurado)
# ============================================================================

Write-Host ""
Write-Host "🔍 Fase 7: Verificação Serena MCP" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Gray

Run-Test "Serena MCP Setup" {
    & pwsh -ExecutionPolicy Bypass -File scripts/verify-serena-setup.ps1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Verificação Serena falhou"
    }
    Write-Host "   ✅ Serena MCP configurado" -ForegroundColor Green
} -Optional

# ============================================================================
# RELATÓRIO FINAL
# ============================================================================

$totalTime = (Get-Date) - $startTime

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 RELATÓRIO FINAL" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$total = $results.Count
$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$warned = ($results | Where-Object { $_.Status -eq "WARN" }).Count

Write-Host "Total de Testes:  $total" -ForegroundColor White
Write-Host "✅ Passou:        $passed" -ForegroundColor Green
Write-Host "❌ Falhou:        $failed" -ForegroundColor Red
Write-Host "⚠️  Warnings:      $warned" -ForegroundColor Yellow
Write-Host ""
Write-Host "⏱️  Tempo Total:   $($totalTime.TotalSeconds.ToString('F2'))s" -ForegroundColor Gray
Write-Host ""

# Calcular taxa de sucesso
if ($total -gt 0) {
    $successRate = [math]::Round(($passed / $total) * 100, 2)
    Write-Host "Taxa de Sucesso:  ${successRate}%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })
}

Write-Host ""

# Salvar relatório CSV
$results | Export-Csv -Path "test-reports/master-e2e-results.csv" -NoTypeInformation
Write-Host "📄 Relatório salvo em: test-reports/master-e2e-results.csv" -ForegroundColor Gray

# Salvar relatório JSON
$reportJson = @{
    timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    totalTime = $totalTime.TotalSeconds
    summary = @{
        total = $total
        passed = $passed
        failed = $failed
        warned = $warned
        successRate = $successRate
    }
    results = $results
} | ConvertTo-Json -Depth 10

$reportJson | Out-File "test-reports/master-e2e-results.json" -Encoding UTF8
Write-Host "📄 Relatório JSON salvo em: test-reports/master-e2e-results.json" -ForegroundColor Gray

Write-Host ""

# Mostrar testes falhados
if ($failed -gt 0) {
    Write-Host "❌ TESTES FALHADOS:" -ForegroundColor Red
    $results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "   - $($_.Test)" -ForegroundColor DarkRed
        if ($_.Error) {
            Write-Host "     Erro: $($_.Error)" -ForegroundColor DarkRed
        }
    }
    Write-Host ""
    exit 1
}

# Conclusão
if ($failed -eq 0 -and $passed -gt 0) {
    Write-Host "🎉 TODOS OS TESTES CRÍTICOS PASSARAM!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✨ O sistema está pronto para produção!" -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host "⚠️  Alguns testes opcionais falharam, mas sistema está operacional" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}
