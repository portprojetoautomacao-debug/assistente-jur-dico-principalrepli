# Configuração Completa do NPM - Assistente Jurídico PJe
# Versão: 2.0.0 - Configuração Automática
# Data: 09/12/2024

$ErrorActionPreference = "Stop"

# Cores para output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"
$White = "White"

function Write-Color {
    param($Text, $Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Write-Header {
    param($Text)
    Write-Host ""
    Write-Host "??????????????????????????????????????????????????????????????????" -ForegroundColor Cyan
    Write-Host "? $Text" -ForegroundColor Cyan
    Write-Host "??????????????????????????????????????????????????????????????????" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param($Text)
    Write-Host "?? $Text" -ForegroundColor Yellow
}

function Write-Success {
    param($Text)
    Write-Host "? $Text" -ForegroundColor Green
}

function Write-Error {
    param($Text)
    Write-Host "? $Text" -ForegroundColor Red
}

# ============================================
# PASSO 1: DETECTAR NODE.JS E NPM
# ============================================

Write-Header "PASSO 1/5 - DETECTANDO NODE.JS E NPM"

Write-Step "Verificando instalação do Node.js..."

try {
    $nodeVersion = & node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js encontrado: $nodeVersion"
    } else {
        throw "Node.js não encontrado"
    }
} catch {
    Write-Error "Node.js não está instalado!"
    Write-Host ""
    Write-Host "?? INSTALAÇÃO NECESSÁRIA:" -ForegroundColor Yellow
    Write-Host "1. Baixe Node.js 22.x LTS:" -ForegroundColor White
    Write-Host "   https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Execute o instalador" -ForegroundColor White
    Write-Host "3. Marque 'Add to PATH' durante instalação" -ForegroundColor White
    Write-Host "4. Reinicie o PowerShell" -ForegroundColor White
    Write-Host "5. Execute este script novamente" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou use winget:" -ForegroundColor Yellow
    Write-Host "   winget install OpenJS.NodeJS.LTS" -ForegroundColor Cyan
    exit 1
}

Write-Step "Verificando instalação do NPM..."

try {
    $npmVersion = & npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "NPM encontrado: v$npmVersion"
    } else {
        throw "NPM não encontrado"
    }
} catch {
    Write-Error "NPM não está instalado!"
    Write-Host ""
    Write-Host "?? O NPM vem com o Node.js. Reinstale o Node.js seguindo as instruções acima." -ForegroundColor Yellow
    exit 1
}

# ============================================
# PASSO 2: VERIFICAR CAMINHO DO SISTEMA
# ============================================

Write-Header "PASSO 2/5 - VERIFICANDO CAMINHO DO SISTEMA"

Write-Step "Localizando pasta do Node.js..."

$nodePaths = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:APPDATA\npm",
    "$env:LOCALAPPDATA\Programs\nodejs"
)

$nodePath = $null
foreach ($path in $nodePaths) {
    if (Test-Path "$path\node.exe") {
        $nodePath = $path
        break
    }
}

if ($nodePath) {
    Write-Success "Node.js localizado em: $nodePath"
} else {
    Write-Error "Não foi possível localizar a pasta do Node.js"
    Write-Host ""
    Write-Host "?? Verifique se o Node.js foi instalado corretamente" -ForegroundColor Yellow
    exit 1
}

Write-Step "Verificando se Node.js está no PATH..."

$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$systemPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

$pathFound = $false
$pathsToCheck = @($currentPath, $systemPath)

foreach ($pathVar in $pathsToCheck) {
    if ($pathVar -and $pathVar.Contains($nodePath)) {
        $pathFound = $true
        break
    }
}

if ($pathFound) {
    Write-Success "Node.js está no PATH do sistema"
} else {
    Write-Error "Node.js NÃO está no PATH do sistema!"
    Write-Host ""
    Write-Host "?? ADICIONANDO AO PATH..." -ForegroundColor Yellow

    # Adicionar ao PATH do usuário (mais seguro)
    $currentUserPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentUserPath) {
        $newPath = "$currentUserPath;$nodePath"
    } else {
        $newPath = $nodePath
    }

    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")

    # Adicionar à sessão atual também
    $env:Path = "$env:Path;$nodePath"

    Write-Success "Node.js adicionado ao PATH do usuário"
    Write-Host ""
    Write-Host "??  IMPORTANTE: Feche e reabra o PowerShell para aplicar as mudanças" -ForegroundColor Yellow
}

# ============================================
# PASSO 3: CONFIGURAR NPM GLOBAL
# ============================================

Write-Header "PASSO 3/5 - CONFIGURANDO NPM GLOBAL"

Write-Step "Verificando configuração global do NPM..."

try {
    $npmConfig = & npm config list --global 2>$null
    Write-Success "Configuração NPM global OK"
} catch {
    Write-Error "Erro na configuração global do NPM"
}

Write-Step "Configurando cache do NPM..."

try {
    & npm config set cache "$env:APPDATA\npm-cache" --global 2>$null
    Write-Success "Cache configurado em: $env:APPDATA\npm-cache"
} catch {
    Write-Warning "Não foi possível configurar cache (não crítico)"
}

Write-Step "Configurando timeout do NPM..."

try {
    & npm config set timeout 60000 --global 2>$null
    Write-Success "Timeout configurado para 60 segundos"
} catch {
    Write-Warning "Não foi possível configurar timeout (não crítico)"
}

# ============================================
# PASSO 4: TESTAR FUNCIONAMENTO
# ============================================

Write-Header "PASSO 4/5 - TESTANDO FUNCIONAMENTO"

Write-Step "Testando comando node..."

try {
    $testNode = & node --version 2>$null
    Write-Success "Node.js funcionando: $testNode"
} catch {
    Write-Error "Node.js não está funcionando corretamente"
    exit 1
}

Write-Step "Testando comando npm..."

try {
    $testNpm = & npm --version 2>$null
    Write-Success "NPM funcionando: v$testNpm"
} catch {
    Write-Error "NPM não está funcionando corretamente"
    exit 1
}

Write-Step "Testando instalação de pacote..."

try {
    $null = & npm install --dry-run lodash 2>$null
    Write-Success "NPM pode instalar pacotes"
} catch {
    Write-Error "NPM não consegue instalar pacotes"
    Write-Host ""
    Write-Host "?? Possíveis causas:" -ForegroundColor Yellow
    Write-Host "   - Sem conexão com internet" -ForegroundColor White
    Write-Host "   - Firewall bloqueando" -ForegroundColor White
    Write-Host "   - Proxy necessário" -ForegroundColor White
}

# ============================================
# PASSO 5: CONFIGURAÇÃO DO PROJETO
# ============================================

Write-Header "PASSO 5/5 - CONFIGURAÇÃO DO PROJETO"

Write-Step "Verificando se estamos na pasta do projeto..."

$currentDir = Get-Location
$packageJson = Join-Path $currentDir "package.json"

if (Test-Path $packageJson) {
    Write-Success "Projeto encontrado: $currentDir"

    Write-Step "Instalando dependências do projeto..."

    try {
        & npm install
        Write-Success "Dependências instaladas com sucesso!"
    } catch {
        Write-Error "Erro ao instalar dependências"
        Write-Host ""
        Write-Host "?? Tente executar manualmente:" -ForegroundColor Yellow
        Write-Host "   npm install" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Se ainda falhar, verifique:" -ForegroundColor Yellow
        Write-Host "   - Conexão com internet" -ForegroundColor White
        Write-Host "   - package.json válido" -ForegroundColor White
        Write-Host "   - Espaço em disco suficiente" -ForegroundColor White
    }

    Write-Step "Verificando scripts disponíveis..."

    try {
        $packageContent = Get-Content $packageJson -Raw | ConvertFrom-Json
        if ($packageContent.scripts) {
            Write-Success "Scripts encontrados:"
            $packageContent.scripts.PSObject.Properties | ForEach-Object {
                Write-Host "   $($_.Name): $($_.Value)" -ForegroundColor White
            }
        } else {
            Write-Host "   Nenhum script definido" -ForegroundColor Yellow
        }
    } catch {
        Write-Warning "Não foi possível ler scripts do package.json"
    }

} else {
    Write-Host "??  Nenhum projeto Node.js encontrado nesta pasta" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para configurar um projeto:" -ForegroundColor White
    Write-Host "   npm init -y" -ForegroundColor Cyan
    Write-Host "   npm install [pacotes]" -ForegroundColor Cyan
}

# ============================================
# RELATÓRIO FINAL
# ============================================

Write-Header "CONFIGURAÇÃO CONCLUÍDA!"

Write-Host "?? RESUMO DA CONFIGURAÇÃO:" -ForegroundColor Cyan
Write-Host ""
Write-Host "? Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "? NPM: v$npmVersion" -ForegroundColor Green
Write-Host "? PATH: Configurado" -ForegroundColor Green
Write-Host "? Cache: $env:APPDATA\npm-cache" -ForegroundColor Green
Write-Host "? Timeout: 60 segundos" -ForegroundColor Green

if (Test-Path $packageJson) {
    Write-Host "? Projeto: Configurado" -ForegroundColor Green
} else {
    Write-Host "??  Projeto: Nenhum encontrado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "?? PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Feche e reabra o PowerShell" -ForegroundColor White
Write-Host "2. Execute: npm --version (para confirmar)" -ForegroundColor White
Write-Host "3. No projeto: npm run dev (para desenvolvimento)" -ForegroundColor White
Write-Host "4. No projeto: npm run build (para produção)" -ForegroundColor White

Write-Host ""
Write-Host "?? COMANDOS ÚTEIS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "npm install          # Instalar dependências" -ForegroundColor White
Write-Host "npm run dev          # Servidor de desenvolvimento" -ForegroundColor White
Write-Host "npm run build        # Build de produção" -ForegroundColor White
Write-Host "npm run test         # Executar testes" -ForegroundColor White
Write-Host "npm run lint         # Verificar código" -ForegroundColor White
Write-Host "npm outdated         # Verificar pacotes desatualizados" -ForegroundColor White
Write-Host "npm update           # Atualizar pacotes" -ForegroundColor White

Write-Host ""
Write-Success "CONFIGURAÇÃO DO NPM CONCLUÍDA COM SUCESSO! ??"
Write-Host ""
Write-Host "Se encontrar problemas, execute este script novamente." -ForegroundColor Yellow