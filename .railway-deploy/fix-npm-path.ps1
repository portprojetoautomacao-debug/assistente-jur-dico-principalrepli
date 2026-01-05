# Fix NPM PATH - Assistente Jurídico
# Adiciona Node.js e NPM ao PATH automaticamente

$ErrorActionPreference = "Stop"

Write-Host "?? Configurando NPM no PATH..." -ForegroundColor Cyan
Write-Host ""

# Procurar Node.js em locais comuns
$possiblePaths = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:APPDATA\npm",
    "$env:LOCALAPPDATA\Programs\nodejs"
)

$nodePath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path "$path\node.exe") {
        $nodePath = $path
        break
    }
}

if ($nodePath) {
    Write-Host "? Node.js encontrado em: $nodePath" -ForegroundColor Green
    
    # Adicionar ao PATH da sessão atual
    $env:Path = "$nodePath;$env:Path"
    
    # Verificar versões
    Write-Host ""
    Write-Host "Versões instaladas:" -ForegroundColor Cyan
    node --version
    npm --version
    
    Write-Host ""
    Write-Host "? NPM configurado para esta sessão!" -ForegroundColor Green
    Write-Host ""
    Write-Host "?? Para tornar permanente:" -ForegroundColor Yellow
    Write-Host "   1. Win + R ? sysdm.cpl" -ForegroundColor White
    Write-Host "   2. Avançado ? Variáveis de Ambiente" -ForegroundColor White
    Write-Host "   3. Path ? Editar ? Novo ? Adicionar: $nodePath" -ForegroundColor White
    
} else {
    Write-Host "? Node.js não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "?? Instale Node.js 22.x de:" -ForegroundColor Yellow
    Write-Host "   https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ou use o instalador:" -ForegroundColor Yellow
    Write-Host "   winget install OpenJS.NodeJS.LTS" -ForegroundColor Cyan
    
    exit 1
}
