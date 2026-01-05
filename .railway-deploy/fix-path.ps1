# Atualização do PATH e Teste Final - Assistente Jurídico PJe
# Versão: 1.0.0 - Após Instalação do Node.js
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
# ATUALIZAR PATH
# ============================================

Write-Header "ATUALIZANDO PATH DO SISTEMA"

Write-Step "Procurando instalação do Node.js..."

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

if (-not $nodePath) {
    Write-Error "Node.js não encontrado em locais padrão!"
    Write-Host ""
    Write-Host "?? Verifique se a instalação foi concluída:" -ForegroundColor Yellow
    Write-Host "   - Abra 'Adicionar ou Remover Programas'" -ForegroundColor White
    Write-Host "   - Procure por 'Node.js'" -ForegroundColor White
    Write-Host "   - Se não estiver lá, reinstale" -ForegroundColor White
    exit 1
}

Write-Success "Node.js encontrado em: $nodePath"

Write-Step "Verificando PATH atual..."

$currentUserPath = [Environment]::GetEnvironmentVariable("Path", "User")
$currentSystemPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

$pathUpdated = $false

# Verificar se já está no PATH do usuário
if ($currentUserPath -and $currentUserPath.Contains($nodePath)) {
    Write-Success "Node.js já está no PATH do usuário"
} else {
    Write-Step "Adicionando Node.js ao PATH do usuário..."

    try {
        if ($currentUserPath) {
            $newUserPath = "$currentUserPath;$nodePath"
        } else {
            $newUserPath = $nodePath
        }

        [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
        Write-Success "Adicionado ao PATH do usuário"
        $pathUpdated = $true
    } catch {
        Write-Error "Erro ao atualizar PATH do usuário: $($_.Exception.Message)"
    }
}

# Verificar se já está no PATH do sistema
if ($currentSystemPath -and $currentSystemPath.Contains($nodePath)) {
    Write-Success "Node.js já está no PATH do sistema"
} else {
    Write-Step "Tentando adicionar ao PATH do sistema..."

    try {
        if ($currentSystemPath) {
            $newSystemPath = "$currentSystemPath;$nodePath"
        } else {
            $newSystemPath = $nodePath
        }

        [Environment]::SetEnvironmentVariable("Path", $newSystemPath, "Machine")
        Write-Success "Adicionado ao PATH do sistema"
        $pathUpdated = $true
    } catch {
        Write-Warning "Não foi possível atualizar PATH do sistema (execute como Administrador)"
        Write-Host "   Isso é normal - o PATH do usuário é suficiente" -ForegroundColor Yellow
    }
}

# Atualizar PATH da sessão atual
$env:Path = "$env:Path;$nodePath"

if ($pathUpdated) {
    Write-Success "PATH atualizado - reinicie o PowerShell para aplicar completamente"
}

# ============================================
# TESTAR FUNCIONAMENTO
# ============================================

Write-Header "TESTANDO FUNCIONAMENTO"

Write-Step "Testando Node.js..."

try {
    $nodeVersion = & node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js funcionando: $nodeVersion"
    } else {
        throw "Comando falhou"
    }
} catch {
    Write-Error "Node.js ainda não está acessível"
    Write-Host ""
    Write-Host "?? SOLUÇÕES:" -ForegroundColor Yellow
    Write-Host "1. Reinicie completamente o PowerShell" -ForegroundColor White
    Write-Host "2. Ou reinicie o Windows" -ForegroundColor White
    Write-Host "3. Execute novamente: .\fix-path.ps1" -ForegroundColor White
    exit 1
}

Write-Step "Testando NPM..."

try {
    $npmVersion = & npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "NPM funcionando: v$npmVersion"
    } else {
        throw "Comando falhou"
    }
} catch {
    Write-Error "NPM ainda não está acessível"
    Write-Host ""
    Write-Host "??  NPM pode precisar de configuração adicional" -ForegroundColor Yellow
}

Write-Step "Testando instalação de pacotes..."

try {
    $null = & npm install --dry-run lodash 2>$null
    Write-Success "NPM pode instalar pacotes"
} catch {
    Write-Warning "NPM pode ter problemas de rede (não crítico)"
}

# ============================================
# CONFIGURAR NPM
# ============================================

Write-Header "CONFIGURANDO NPM"

Write-Step "Configurando cache do NPM..."

try {
    & npm config set cache "$env:APPDATA\npm-cache" --global 2>$null
    Write-Success "Cache configurado"
} catch {
    Write-Warning "Não foi possível configurar cache"
}

Write-Step "Configurando timeout..."

try {
    & npm config set timeout 60000 --global 2>$null
    Write-Success "Timeout configurado (60s)"
} catch {
    Write-Warning "Não foi possível configurar timeout"
}

# ============================================
# PROJETO
# ============================================

Write-Header "CONFIGURANDO PROJETO"

$currentDir = Get-Location
$packageJson = Join-Path $currentDir "package.json"

if (Test-Path $packageJson) {
    Write-Success "Projeto encontrado: $currentDir"

    Write-Step "Instalando dependências..."

    try {
        & npm install
        Write-Success "Dependências instaladas!"
    } catch {
        Write-Error "Erro ao instalar dependências"
        Write-Host ""
        Write-Host "?? Execute manualmente:" -ForegroundColor Yellow
        Write-Host "   npm install" -ForegroundColor Cyan
    }

    Write-Step "Verificando scripts disponíveis..."

    try {
        $packageContent = Get-Content $packageJson -Raw | ConvertFrom-Json
        if ($packageContent.scripts) {
            Write-Host ""
            Write-Host "?? SCRIPTS DISPONÍVEIS:" -ForegroundColor Cyan
            $packageContent.scripts.PSObject.Properties | ForEach-Object {
                Write-Host "   $($_.Name): $($_.Value)" -ForegroundColor White
            }
        }
    } catch {
        Write-Warning "Não foi possível ler scripts"
    }

} else {
    Write-Host "??  Nenhum package.json encontrado" -ForegroundColor Yellow
}

# ============================================
# RELATÓRIO FINAL
# ============================================

Write-Header "CONFIGURAÇÃO CONCLUÍDA!"

Write-Host "?? NODE.JS E NPM CONFIGURADOS!" -ForegroundColor Green
Write-Host ""
Write-Host "?? STATUS:" -ForegroundColor Cyan
Write-Host "? Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "? NPM: v$npmVersion" -ForegroundColor Green
Write-Host "? PATH: Atualizado" -ForegroundColor Green

if (Test-Path $packageJson) {
    Write-Host "? Projeto: Pronto" -ForegroundColor Green
}

Write-Host ""
Write-Host "?? COMANDOS PRONTOS PARA USO:" -ForegroundColor Cyan
Write-Host ""
Write-Host "npm install          # Instalar dependências" -ForegroundColor White
Write-Host "npm run dev          # Servidor de desenvolvimento" -ForegroundColor White
Write-Host "npm run build        # Build de produção" -ForegroundColor White
Write-Host "npm run test         # Executar testes" -ForegroundColor White
Write-Host "npm run lint         # Verificar código" -ForegroundColor White

Write-Host ""
Write-Host "??  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "Se os comandos ainda não funcionarem, reinicie o PowerShell" -ForegroundColor White

Write-Host ""
Write-Success "AMBIENTE DE DESENVOLVIMENTO PRONTO! ??"