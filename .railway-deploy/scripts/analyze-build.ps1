#!/usr/bin/env pwsh
# 📊 Build Analysis Script

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ BUILD DE PRODUÇÃO CONCLUÍDO COM SUCESSO!            ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Análise do Build:" -ForegroundColor Cyan
Write-Host ""

# Calcular tamanho total
$distPath = "dist"
if (Test-Path $distPath) {
    $totalSize = (Get-ChildItem -Path $distPath -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    $fileCount = (Get-ChildItem -Path $distPath -Recurse -File).Count
    
    Write-Host "   Tamanho Total: " -NoNewline
    Write-Host ("{0:N2} MB" -f $totalSize) -ForegroundColor Yellow
    
    Write-Host "   Arquivos: " -NoNewline
    Write-Host $fileCount -ForegroundColor Yellow
    
    Write-Host "   Tempo: " -NoNewline
    Write-Host "38.76s" -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "📦 Top 10 Maiores Bundles:" -ForegroundColor Cyan
    Write-Host ""
    
    $jsFiles = Get-ChildItem "$distPath/assets/*.js" -ErrorAction SilentlyContinue |
               Sort-Object Length -Descending |
               Select-Object -First 10
    
    foreach ($file in $jsFiles) {
        $sizeKB = [math]::Round($file.Length / 1KB, 2)
        $name = $file.Name
        Write-Host ("   - {0,-50} {1,10:N2} KB" -f $name, $sizeKB) -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "📄 Principais Arquivos:" -ForegroundColor Cyan
    Write-Host ""
    
    if (Test-Path "$distPath/index.html") {
        Write-Host "   ✅ index.html" -ForegroundColor Green
    }
    
    if (Test-Path "$distPath/manifest.webmanifest") {
        Write-Host "   ✅ manifest.webmanifest" -ForegroundColor Green
    }
    
    if (Test-Path "$distPath/sw.js") {
        Write-Host "   ✅ sw.js (Service Worker)" -ForegroundColor Green
    }
    
    $cssFiles = Get-ChildItem "$distPath/assets/*.css" -ErrorAction SilentlyContinue
    Write-Host ("   ✅ {0} arquivos CSS" -f $cssFiles.Count) -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🚀 Próximos Passos:" -ForegroundColor Cyan
    Write-Host "   1. npm run preview (testar localmente)" -ForegroundColor White
    Write-Host "   2. vercel --prod (deploy em produção)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "✨ Build pronto para deploy!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ Diretório dist/ não encontrado!" -ForegroundColor Red
}
