# Build e Deploy Local - Assistente Jurídico v1.4.0
# Execute este arquivo com: .\build-and-preview.ps1

param(
    [switch]$SkipTests,
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " BUILD E DEPLOY LOCAL - v1.4.0" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Diretório do projeto
$projectRoot = $PSScriptRoot

# Procurar npm no repositório
$npmPaths = @(
    "$projectRoot\node_modules\.bin\npm.cmd",
    "$projectRoot\node_modules\.bin\npm",
    "npm"  # Fallback para npm global
)

$npmCmd = $null
foreach ($path in $npmPaths) {
    if (Test-Path $path -ErrorAction SilentlyContinue) {
        $npmCmd = $path
        Write-Host "[INFO] npm encontrado em: $npmCmd" -ForegroundColor Green
        break
    } elseif ($path -eq "npm") {
        # Testar se npm global existe
        try {
            $null = Get-Command npm -ErrorAction Stop
            $npmCmd = "npm"
            Write-Host "[INFO] Usando npm global" -ForegroundColor Green
            break
        } catch {
            continue
        }
    }
}

if (-not $npmCmd) {
    Write-Host "[ERRO] npm não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Opções:" -ForegroundColor Yellow
    Write-Host "1. Instale Node.js 22.x de: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "2. Ou execute 'npm install' uma vez para ter npm local" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Exibir versões
Write-Host ""
Write-Host "[INFO] Versões:" -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor White
} catch {
    Write-Host "  Node.js: Não encontrado (mas npm está disponível)" -ForegroundColor Yellow
}

$npmVersion = & $npmCmd --version
Write-Host "  npm: $npmVersion" -ForegroundColor White
Write-Host ""

# PASSO 1: INSTALAR DEPENDÊNCIAS
if (-not $SkipInstall) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " PASSO 1: INSTALAR DEPENDÊNCIAS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "[INFO] Instalando dependências..." -ForegroundColor Yellow
    & $npmCmd install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao instalar dependências!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "[OK] Dependências instaladas com sucesso!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[INFO] Pulando instalação de dependências (--SkipInstall)" -ForegroundColor Yellow
    Write-Host ""
}

# PASSO 2: BUILD DE PRODUÇÃO
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " PASSO 2: BUILD DE PRODUÇÃO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[INFO] Executando build de produção..." -ForegroundColor Yellow
& $npmCmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERRO] Build falhou!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifique os erros acima e corrija antes de continuar." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[OK] Build concluído com sucesso!" -ForegroundColor Green
Write-Host ""

# Verificar tamanho do bundle
if (Test-Path "$projectRoot\dist\assets") {
    $distSize = (Get-ChildItem "$projectRoot\dist\assets" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "[INFO] Tamanho do bundle: $([math]::Round($distSize, 2)) MB" -ForegroundColor Cyan
    
    if ($distSize -gt 2) {
        Write-Host "[AVISO] Bundle maior que 2MB. Considere otimizar." -ForegroundColor Yellow
    }
    Write-Host ""
}

# PASSO 3: EXECUTAR TESTES
if (-not $SkipTests) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " PASSO 3: EXECUTAR TESTES" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "[INFO] Executando testes unitários..." -ForegroundColor Yellow
    & $npmCmd run test:run
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[AVISO] Alguns testes falharam!" -ForegroundColor Yellow
        Write-Host ""
        
        $continuar = Read-Host "Deseja continuar mesmo assim? (S/N)"
        if ($continuar -ne "S" -and $continuar -ne "s") {
            Write-Host ""
            Write-Host "Build interrompido pelo usuário." -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host ""
        Write-Host "[OK] Todos os testes passaram!" -ForegroundColor Green
    }
    Write-Host ""
} else {
    Write-Host "[INFO] Pulando testes (--SkipTests)" -ForegroundColor Yellow
    Write-Host ""
}

# PASSO 4: PREVIEW LOCAL
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " PASSO 4: PREVIEW LOCAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[INFO] Iniciando servidor de preview local..." -ForegroundColor Yellow
Write-Host "[INFO] O servidor será aberto em: " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:4173" -ForegroundColor White
Write-Host "[INFO] Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
Write-Host ""

# Tentar abrir o navegador após 2 segundos
$job = Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:4173"
}

& $npmCmd run preview

# Limpar job do navegador
Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -ErrorAction SilentlyContinue

# Se chegou aqui, o preview foi parado
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " BUILD E DEPLOY LOCAL - CONCLUÍDO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "?? Estatísticas do build:" -ForegroundColor Cyan
Write-Host "  - Arquivos compilados: dist/" -ForegroundColor White
Write-Host "  - Bundle principal: dist/assets/index-[hash].js" -ForegroundColor White
if (Test-Path "$projectRoot\dist\assets") {
    $distSize = (Get-ChildItem "$projectRoot\dist\assets" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "  - Tamanho total: $([math]::Round($distSize, 2)) MB" -ForegroundColor White
}
Write-Host ""

Write-Host "?? Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Se os testes passaram, você pode fazer deploy para Vercel" -ForegroundColor White
Write-Host "  2. Configure VITE_ENABLE_PII_FILTERING=true no Vercel" -ForegroundColor White
Write-Host "  3. Execute: vercel --prod" -ForegroundColor White
Write-Host ""

Write-Host "? Processo concluído com sucesso!" -ForegroundColor Green
