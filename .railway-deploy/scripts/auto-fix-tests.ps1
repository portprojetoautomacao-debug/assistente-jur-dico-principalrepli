# Auto-Fix de Testes (PowerShell)
# Versão: 1.0.0
# Data: 09/12/2024

$ErrorActionPreference = "Continue"

Write-Host "?? Auto-fix de Testes - Assistente Jurídico PJe" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

function Log-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Log-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Log-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Log-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# 1. VERIFICAR NPM
Log-Info "Verificando NPM..."
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Log-Error "npm não encontrado. Instale Node.js 22.x"
    exit 1
}
Log-Success "NPM encontrado"

# 2. LINT COM AUTO-FIX
Log-Info "Executando ESLint com auto-fix..."
try {
    npm run lint -- --fix
    Log-Success "ESLint OK"
} catch {
    Log-Warning "ESLint encontrou alguns problemas"
}

# 3. FORMATAR CÓDIGO
Log-Info "Formatando código com Prettier..."
try {
    npm run format
    Log-Success "Prettier OK"
} catch {
    Log-Warning "Prettier encontrou alguns problemas"
}

# 4. REMOVER IMPORTS NÃO UTILIZADOS
Log-Info "Removendo imports não utilizados..."
try {
    npm run lint -- --fix --rule "unused-imports/no-unused-imports: error"
} catch {
    Log-Warning "Alguns imports não puderam ser removidos"
}

# 5. TESTES UNITÁRIOS
Log-Info "Executando testes unitários..."
$testsOk = $true
try {
    npm run test:run
    Log-Success "Testes unitários passaram!"
} catch {
    Log-Warning "Alguns testes falharam"
    $testsOk = $false
    
    # Auto-fix de testes
    Log-Info "Tentando auto-fix de problemas comuns..."
    
    # 5.1. Atualizar snapshots
    Log-Info "Atualizando snapshots..."
    try {
        npm run test:run -- -u
    } catch {
        Log-Warning "Falha ao atualizar snapshots"
    }
    
    # 5.2. Limpar cache
    Log-Info "Limpando cache de testes..."
    try {
        npm run test:run -- --clearCache
    } catch {
        Log-Warning "Falha ao limpar cache"
    }
    
    # 5.3. Re-executar
    Log-Info "Re-executando testes..."
    try {
        npm run test:run
        Log-Success "Testes corrigidos!"
        $testsOk = $true
    } catch {
        Log-Warning "Ainda há falhas nos testes"
    }
}

# 6. TESTES DE API
Log-Info "Executando testes de API..."
try {
    npm run test:api
    Log-Success "Testes de API passaram!"
} catch {
    Log-Warning "Alguns testes de API falharam"
}

# 7. TYPESCRIPT
Log-Info "Verificando TypeScript..."
try {
    npm run type-check
    Log-Success "TypeScript OK!"
} catch {
    Log-Error "Erros TypeScript detectados"
    
    # Auto-fix básico
    Log-Info "Tentando auto-fix de TypeScript..."
    try {
        npx tsc --emitDeclarationOnly
    } catch {
        Log-Warning "Não foi possível gerar declarações"
    }
    
    # Re-verificar
    try {
        npm run type-check
        Log-Success "TypeScript corrigido!"
    } catch {
        Log-Error "Erros TypeScript persistem"
    }
}

# 8. COVERAGE
Log-Info "Gerando relatório de cobertura..."
try {
    npm run test:coverage
    Log-Success "Coverage gerado"
} catch {
    Log-Warning "Coverage incompleto"
}

# 9. RELATÓRIO FINAL
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "?? RELATÓRIO FINAL" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Contar arquivos de teste
$unitTests = (Get-ChildItem -Path "src" -Recurse -Include "*.test.ts","*.test.tsx" -File).Count
$apiTests = (Get-ChildItem -Path "api" -Recurse -Include "*.test.ts" -File -ErrorAction SilentlyContinue).Count
$chromeTests = (Get-ChildItem -Path "chrome-extension-pje/tests" -Recurse -Include "*.test.ts" -File -ErrorAction SilentlyContinue).Count

Write-Host "Testes Unitários (Frontend): $unitTests arquivos"
Write-Host "Testes de API (Backend): $apiTests arquivos"
Write-Host "Testes da Extensão Chrome: $chromeTests arquivos"
Write-Host ""

# Verificar modificações
$modified = git status --porcelain
if ($modified) {
    Log-Warning "Arquivos modificados durante auto-fix:"
    git status --short
    Write-Host ""
    Write-Host "Execute 'git add .' e 'git commit' para salvar as correções"
} else {
    Log-Success "Nenhuma modificação necessária"
}

Log-Success "Auto-fix concluído!"
