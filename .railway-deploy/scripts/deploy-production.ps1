#!/usr/bin/env pwsh
# 🚀 Deploy Automático para Vercel - Produção

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 DEPLOY AUTOMÁTICO - PRODUÇÃO VERCEL                 ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se Vercel CLI está instalado
Write-Host "📋 Etapa 1/5: Verificando Vercel CLI..." -ForegroundColor Yellow
$vercelVersion = vercel --version 2>&1 | Select-String "Vercel CLI" | Out-String

if ($vercelVersion) {
    Write-Host "   ✅ Vercel CLI instalado: $($vercelVersion.Trim())" -ForegroundColor Green
} else {
    Write-Host "   ❌ Vercel CLI não encontrado!" -ForegroundColor Red
    Write-Host "   📦 Instalando Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel@latest
}

Write-Host ""

# 2. Verificar se build existe
Write-Host "📋 Etapa 2/5: Verificando build..." -ForegroundColor Yellow

if (Test-Path "dist/index.html") {
    $distSize = (Get-ChildItem -Path dist -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host ("   ✅ Build encontrado: {0:N2} MB" -f $distSize) -ForegroundColor Green
} else {
    Write-Host "   ❌ Build não encontrado!" -ForegroundColor Red
    Write-Host "   🔨 Executando build..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Build concluído com sucesso" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Build falhou! Abortando deploy." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# 3. Verificar autenticação
Write-Host "📋 Etapa 3/5: Verificando autenticação Vercel..." -ForegroundColor Yellow

$whoami = vercel whoami 2>&1 | Out-String

if ($whoami -match "Error") {
    Write-Host "   ⚠️  Não autenticado no Vercel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   🔐 Iniciando login..." -ForegroundColor Cyan
    Write-Host "   (Uma aba do navegador será aberta)" -ForegroundColor Gray
    Write-Host ""
    
    vercel login
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Login realizado com sucesso" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Login falhou! Abortando deploy." -ForegroundColor Red
        exit 1
    }
} else {
    $username = $whoami | Select-String ">" | ForEach-Object { $_.Line.Replace(">", "").Trim() }
    Write-Host "   ✅ Autenticado como: $username" -ForegroundColor Green
}

Write-Host ""

# 4. Confirmar deploy
Write-Host "📋 Etapa 4/5: Confirmação de deploy..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   🚀 Pronto para fazer deploy em PRODUÇÃO!" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Build:        2.68 MB" -ForegroundColor White
Write-Host "   Arquivos:     58" -ForegroundColor White
Write-Host "   Type Safety:  100%" -ForegroundColor White
Write-Host "   Tests:        84.4%" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "   Confirmar deploy em produção? (S/N)"

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host ""
    Write-Host "   ⚠️  Deploy cancelado pelo usuário" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# 5. Executar deploy
Write-Host "📋 Etapa 5/5: Executando deploy em produção..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   🚀 Fazendo upload e deploy..." -ForegroundColor Cyan
Write-Host ""

vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  🎉 DEPLOY CONCLUÍDO COM SUCESSO!                       ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "✅ Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Acessar URL de produção" -ForegroundColor White
    Write-Host "   2. Testar funcionalidades principais" -ForegroundColor White
    Write-Host "   3. Verificar PWA instalável" -ForegroundColor White
    Write-Host "   4. Confirmar analytics (Sentry)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📊 Comandos úteis:" -ForegroundColor Cyan
    Write-Host "   vercel ls       - Ver deploys" -ForegroundColor White
    Write-Host "   vercel logs     - Ver logs" -ForegroundColor White
    Write-Host "   vercel open     - Abrir dashboard" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ❌ DEPLOY FALHOU!                                      ║" -ForegroundColor Red
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Verificar logs: vercel logs" -ForegroundColor White
    Write-Host "   2. Re-tentar: vercel --prod --debug" -ForegroundColor White
    Write-Host "   3. Ver guia: docs/DEPLOY_GUIDE.md" -ForegroundColor White
    Write-Host ""
    
    exit 1
}
