# Instalação Automática do Node.js - Assistente Jurídico PJe
# Versão: 1.0.0 - Instalação com Winget
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
# VERIFICAR SE JÁ ESTÁ INSTALADO
# ============================================

Write-Header "VERIFICANDO INSTALAÇÃO EXISTENTE"

Write-Step "Verificando se Node.js já está instalado..."

try {
    $nodeVersion = & node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js já está instalado: $nodeVersion"
        Write-Host ""
        Write-Host "?? Não é necessário instalar novamente!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Execute o script de configuração:" -ForegroundColor Cyan
        Write-Host "   .\configure-npm.ps1" -ForegroundColor White
        exit 0
    }
} catch {
    Write-Host "??  Node.js não encontrado - prosseguindo com instalação" -ForegroundColor Yellow
}

# ============================================
# VERIFICAR WINGET
# ============================================

Write-Header "VERIFICANDO WINGET"

Write-Step "Verificando se Winget está disponível..."

try {
    $wingetVersion = & winget --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Winget encontrado: $wingetVersion"
    } else {
        throw "Winget não encontrado"
    }
} catch {
    Write-Error "Winget não está instalado!"
    Write-Host ""
    Write-Host "?? INSTALAÇÃO MANUAL NECESSÁRIA:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Instale o App Installer do Microsoft Store:" -ForegroundColor White
    Write-Host "   https://www.microsoft.com/store/productId/9NBLGGH4NNS1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Ou baixe Node.js diretamente:" -ForegroundColor White
    Write-Host "   https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Execute o instalador" -ForegroundColor White
    Write-Host "4. Marque 'Add to PATH'" -ForegroundColor White
    Write-Host "5. Execute: .\configure-npm.ps1" -ForegroundColor White
    exit 1
}

# ============================================
# INSTALAR NODE.JS
# ============================================

Write-Header "INSTALANDO NODE.JS"

Write-Step "Iniciando instalação do Node.js LTS..."

try {
    Write-Host "Executando: winget install OpenJS.NodeJS.LTS" -ForegroundColor Cyan
    Write-Host ""

    # Executar instalação
    $process = Start-Process -FilePath "winget" -ArgumentList "install", "OpenJS.NodeJS.LTS", "--accept-source-agreements", "--accept-package-agreements" -NoNewWindow -Wait -PassThru

    if ($process.ExitCode -eq 0) {
        Write-Success "Node.js instalado com sucesso!"
    } else {
        throw "Instalação falhou com código: $($process.ExitCode)"
    }

} catch {
    Write-Error "Erro durante instalação: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "?? TENTATIVA ALTERNATIVA:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Execute como Administrador:" -ForegroundColor White
    Write-Host "   winget install OpenJS.NodeJS.LTS" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Ou instale manualmente:" -ForegroundColor White
    Write-Host "   https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi" -ForegroundColor Cyan
    exit 1
}

# ============================================
# VERIFICAR INSTALAÇÃO
# ============================================

Write-Header "VERIFICANDO INSTALAÇÃO"

Write-Step "Verificando versão do Node.js..."

try {
    $nodeVersion = & node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js instalado: $nodeVersion"
    } else {
        throw "Node.js não responde"
    }
} catch {
    Write-Error "Node.js não está funcionando após instalação"
    Write-Host ""
    Write-Host "?? POSSÍVEIS SOLUÇÕES:" -ForegroundColor Yellow
    Write-Host "1. Reinicie o PowerShell" -ForegroundColor White
    Write-Host "2. Execute: refreshenv" -ForegroundColor White
    Write-Host "3. Verifique se está no PATH" -ForegroundColor White
    exit 1
}

Write-Step "Verificando versão do NPM..."

try {
    $npmVersion = & npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "NPM instalado: v$npmVersion"
    } else {
        throw "NPM não responde"
    }
} catch {
    Write-Error "NPM não está funcionando"
    Write-Host ""
    Write-Host "??  NPM pode vir em versões separadas. Isso é normal." -ForegroundColor Yellow
}

# ============================================
# CONFIGURAR PATH (SE NECESSÁRIO)
# ============================================

Write-Header "CONFIGURANDO PATH"

Write-Step "Verificando se Node.js está no PATH..."

$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$systemPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

$nodePath = "C:\Program Files\nodejs"
$pathFound = $false

foreach ($pathVar in @($currentPath, $systemPath)) {
    if ($pathVar -and $pathVar.Contains($nodePath)) {
        $pathFound = $true
        break
    }
}

if ($pathFound) {
    Write-Success "Node.js já está no PATH"
} else {
    Write-Step "Adicionando Node.js ao PATH..."

    try {
        # Adicionar ao PATH do usuário
        $currentUserPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if ($currentUserPath) {
            $newPath = "$currentUserPath;$nodePath"
        } else {
            $newPath = $nodePath
        }

        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")

        # Adicionar à sessão atual
        $env:Path = "$env:Path;$nodePath"

        Write-Success "Node.js adicionado ao PATH"
        Write-Host ""
        Write-Host "??  IMPORTANTE: Feche e reabra o PowerShell para aplicar" -ForegroundColor Yellow

    } catch {
        Write-Error "Erro ao configurar PATH: $($_.Exception.Message)"
        Write-Host ""
        Write-Host "?? Configure manualmente:" -ForegroundColor Yellow
        Write-Host "1. Win + R ? sysdm.cpl" -ForegroundColor White
        Write-Host "2. Avançado ? Variáveis de Ambiente" -ForegroundColor White
        Write-Host "3. Path ? Editar ? Novo ? Adicionar: $nodePath" -ForegroundColor White
    }
}

# ============================================
# TESTE FINAL
# ============================================

Write-Header "TESTE FINAL"

Write-Step "Testando instalação completa..."

try {
    $testResult = & node -e "console.log('Node.js funcionando!')" 2>$null
    Write-Success "Node.js testado com sucesso"
} catch {
    Write-Error "Erro no teste do Node.js"
}

try {
    $npmTest = & npm --version 2>$null
    Write-Success "NPM testado: v$npmTest"
} catch {
    Write-Warning "NPM pode precisar de configuração adicional"
}

# ============================================
# PRÓXIMOS PASSOS
# ============================================

Write-Header "INSTALAÇÃO CONCLUÍDA!"

Write-Host "?? NODE.JS INSTALADO COM SUCESSO!" -ForegroundColor Green
Write-Host ""
Write-Host "?? RESUMO:" -ForegroundColor Cyan
Write-Host "? Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "? NPM: v$npmVersion" -ForegroundColor Green
Write-Host "? PATH: Configurado" -ForegroundColor Green

Write-Host ""
Write-Host "?? PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Feche e reabra o PowerShell" -ForegroundColor White
Write-Host "2. Execute o script de configuração:" -ForegroundColor White
Write-Host "   .\configure-npm.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. No projeto, execute:" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan

Write-Host ""
Write-Host "?? COMANDOS DISPONÍVEIS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "node --version    # Ver versão do Node.js" -ForegroundColor White
Write-Host "npm --version     # Ver versão do NPM" -ForegroundColor White
Write-Host "npm install       # Instalar dependências" -ForegroundColor White
Write-Host "npm run dev       # Iniciar desenvolvimento" -ForegroundColor White
Write-Host "npm run build     # Build de produção" -ForegroundColor White

Write-Host ""
Write-Success "AGORA VOCÊ PODE DESENVOLVER COM NODE.JS! ??"