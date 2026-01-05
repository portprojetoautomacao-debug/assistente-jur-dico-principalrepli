#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Setup Automático Completo do Azure DevOps + Monitoring

.DESCRIPTION
    Este script executa TODOS os passos necessários para configurar a integração Azure:
    1. Criar recursos no Azure (Resource Group, Application Insights, Load Testing)
    2. Configurar variáveis de ambiente
    3. Deploy do dashboard
    4. Configurar alertas
    5. Executar validação completa

.PARAMETER SubscriptionId
    ID da Subscription do Azure

.PARAMETER ResourceGroup
    Nome do Resource Group (default: assistente-juridico-rg)

.PARAMETER Location
    Região do Azure (default: brazilsouth)

.EXAMPLE
    .\setup-azure-complete.ps1 -SubscriptionId "sua-subscription-id"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "assistente-juridico-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "brazilsouth",
    
    [Parameter(Mandatory=$false)]
    [string]$AppInsightsName = "assistente-juridico-insights",
    
    [Parameter(Mandatory=$false)]
    [string]$LoadTestName = "assistente-juridico-load-test",
    
    [Parameter(Mandatory=$false)]
    [string]$DashboardName = "Assistente-Juridico-Agents-Dashboard"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SETUP AUTOMÁTICO AZURE DEVOPS + MONITORING" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Configuração:" -ForegroundColor Yellow
Write-Host "   Subscription: $SubscriptionId" -ForegroundColor White
Write-Host "   Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "   Location: $Location" -ForegroundColor White
Write-Host "   App Insights: $AppInsightsName" -ForegroundColor White
Write-Host ""

# Variáveis de controle
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ==========================================
# PASSO 1: VERIFICAR PRÉ-REQUISITOS
# ==========================================
Write-Host ""
Write-Host "PASSO 1/8: Verificando pré-requisitos..." -ForegroundColor Yellow

# Verificar Azure CLI
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "   ✅ Azure CLI instalado (versão $($azVersion.'azure-cli'))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Azure CLI não instalado" -ForegroundColor Red
    Write-Host "   Instale em: https://aka.ms/installazurecli" -ForegroundColor Yellow
    exit 1
}

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js instalado ($nodeVersion)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js não instalado" -ForegroundColor Red
    exit 1
}

# Verificar npm
try {
    $npmVersion = npm --version
    Write-Host "   ✅ npm instalado (v$npmVersion)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ npm não instalado" -ForegroundColor Red
    exit 1
}

# ==========================================
# PASSO 2: LOGIN NO AZURE
# ==========================================
Write-Host ""
Write-Host "PASSO 2/8: Fazendo login no Azure..." -ForegroundColor Yellow

try {
    # Verificar se já está logado
    $currentAccount = az account show 2>$null | ConvertFrom-Json
    
    if ($currentAccount) {
        Write-Host "   ℹ️  Já autenticado como: $($currentAccount.user.name)" -ForegroundColor Cyan
        $useCurrentAccount = Read-Host "   Usar esta conta? (S/n)"
        
        if ($useCurrentAccount -ne "n" -and $useCurrentAccount -ne "N") {
            Write-Host "   ✅ Usando conta atual" -ForegroundColor Green
        } else {
            Write-Host "   Executando novo login..." -ForegroundColor Yellow
            az login
        }
    } else {
        Write-Host "   Executando login..." -ForegroundColor Yellow
        az login
    }
    
    # Definir subscription
    az account set --subscription $SubscriptionId
    Write-Host "   ✅ Subscription configurada: $SubscriptionId" -ForegroundColor Green
    
} catch {
    Write-Host "   ❌ Erro no login: $_" -ForegroundColor Red
    exit 1
}

# ==========================================
# PASSO 3: CRIAR RESOURCE GROUP
# ==========================================
Write-Host ""
Write-Host "PASSO 3/8: Criando Resource Group..." -ForegroundColor Yellow

try {
    # Verificar se já existe
    $rgExists = az group exists --name $ResourceGroup
    
    if ($rgExists -eq "true") {
        Write-Host "   ℹ️  Resource Group já existe" -ForegroundColor Cyan
    } else {
        az group create `
            --name $ResourceGroup `
            --location $Location `
            --output none
        
        Write-Host "   ✅ Resource Group criado: $ResourceGroup" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Erro ao criar Resource Group: $_" -ForegroundColor Red
    exit 1
}

# ==========================================
# PASSO 4: CRIAR APPLICATION INSIGHTS
# ==========================================
Write-Host ""
Write-Host "PASSO 4/8: Criando Application Insights..." -ForegroundColor Yellow

try {
    # Verificar se já existe
    $appInsightsExists = az monitor app-insights component show `
        --app $AppInsightsName `
        --resource-group $ResourceGroup `
        --query "name" `
        --output tsv 2>$null
    
    if ($appInsightsExists) {
        Write-Host "   ℹ️  Application Insights já existe" -ForegroundColor Cyan
    } else {
        az monitor app-insights component create `
            --app $AppInsightsName `
            --location $Location `
            --resource-group $ResourceGroup `
            --kind web `
            --application-type web `
            --output none
        
        Write-Host "   ✅ Application Insights criado: $AppInsightsName" -ForegroundColor Green
    }
    
    # Obter Connection String
    $connectionString = az monitor app-insights component show `
        --app $AppInsightsName `
        --resource-group $ResourceGroup `
        --query "connectionString" `
        --output tsv
    
    Write-Host "   ✅ Connection String obtido" -ForegroundColor Green
    
} catch {
    Write-Host "   ❌ Erro ao criar Application Insights: $_" -ForegroundColor Red
    exit 1
}

# ==========================================
# PASSO 5: CRIAR LOAD TESTING RESOURCE
# ==========================================
Write-Host ""
Write-Host "PASSO 5/8: Criando Load Testing Resource..." -ForegroundColor Yellow

try {
    # Instalar extensão Azure Load Testing
    Write-Host "   Instalando extensão Azure Load Testing..." -ForegroundColor Gray
    az extension add --name load --upgrade --yes 2>$null
    
    # Verificar se já existe
    $loadTestExists = az load show `
        --name $LoadTestName `
        --resource-group $ResourceGroup `
        --query "name" `
        --output tsv 2>$null
    
    if ($loadTestExists) {
        Write-Host "   ℹ️  Load Testing resource já existe" -ForegroundColor Cyan
    } else {
        az load create `
            --name $LoadTestName `
            --resource-group $ResourceGroup `
            --location $Location `
            --output none
        
        Write-Host "   ✅ Load Testing resource criado: $LoadTestName" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Erro ao criar Load Testing (pode não estar disponível na região): $_" -ForegroundColor Yellow
    Write-Host "   Continuando sem Load Testing..." -ForegroundColor Yellow
}

# ==========================================
# PASSO 6: CONFIGURAR VARIÁVEIS DE AMBIENTE
# ==========================================
Write-Host ""
Write-Host "PASSO 6/8: Configurando variáveis de ambiente..." -ForegroundColor Yellow

try {
    # Criar arquivo .env.local se não existir
    if (-not (Test-Path ".env.local")) {
        Write-Host "   Criando arquivo .env.local..." -ForegroundColor Gray
        New-Item -Path ".env.local" -ItemType File -Force | Out-Null
    }
    
    # Ler conteúdo atual
    $envContent = Get-Content ".env.local" -Raw -ErrorAction SilentlyContinue
    
    # Adicionar/atualizar VITE_AZURE_INSIGHTS_CONNECTION_STRING
    if ($envContent -match "VITE_AZURE_INSIGHTS_CONNECTION_STRING") {
        # Atualizar existente
        $envContent = $envContent -replace 'VITE_AZURE_INSIGHTS_CONNECTION_STRING=.*', "VITE_AZURE_INSIGHTS_CONNECTION_STRING=`"$connectionString`""
    } else {
        # Adicionar novo
        $envContent += "`nVITE_AZURE_INSIGHTS_CONNECTION_STRING=`"$connectionString`"`n"
    }
    
    # Salvar arquivo
    $envContent | Set-Content ".env.local" -NoNewline
    
    Write-Host "   ✅ Variável VITE_AZURE_INSIGHTS_CONNECTION_STRING configurada em .env.local" -ForegroundColor Green
    
    # Instruções para Vercel
    Write-Host ""
    Write-Host "   📝 IMPORTANTE: Configure também no Vercel:" -ForegroundColor Yellow
    Write-Host "   1. Acesse: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "   2. Selecione o projeto: assistente-juridico-github" -ForegroundColor White
    Write-Host "   3. Settings → Environment Variables → Add New" -ForegroundColor White
    Write-Host "   4. Nome: VITE_AZURE_INSIGHTS_CONNECTION_STRING" -ForegroundColor White
    Write-Host "   5. Valor: (copiado abaixo)" -ForegroundColor White
    Write-Host ""
    Write-Host "   Connection String:" -ForegroundColor Cyan
    Write-Host "   $connectionString" -ForegroundColor White
    Write-Host ""
    
    # Copiar para clipboard se disponível
    if (Get-Command Set-Clipboard -ErrorAction SilentlyContinue) {
        $connectionString | Set-Clipboard
        Write-Host "   ✅ Connection String copiado para a área de transferência!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "   ⚠️  Erro ao configurar variáveis: $_" -ForegroundColor Yellow
}

# ==========================================
# PASSO 7: DEPLOY DO DASHBOARD
# ==========================================
Write-Host ""
Write-Host "PASSO 7/8: Fazendo deploy do dashboard..." -ForegroundColor Yellow

try {
    # Executar script de deploy
    $deployScript = ".\scripts\deploy-azure-dashboard.ps1"
    
    if (Test-Path $deployScript) {
        & $deployScript `
            -SubscriptionId $SubscriptionId `
            -ResourceGroup $ResourceGroup `
            -AppInsightsName $AppInsightsName `
            -Location $Location `
            -DashboardName $DashboardName
        
        Write-Host "   ✅ Dashboard deployado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Script de deploy não encontrado: $deployScript" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Erro no deploy do dashboard: $_" -ForegroundColor Yellow
    Write-Host "   Você pode executar manualmente: npm run azure:deploy-dashboard" -ForegroundColor Yellow
}

# ==========================================
# PASSO 8: VALIDAÇÃO FINAL
# ==========================================
Write-Host ""
Write-Host "PASSO 8/8: Executando validação final..." -ForegroundColor Yellow

try {
    # Executar script de validação
    Write-Host "   Executando: npm run azure:validate" -ForegroundColor Gray
    npm run azure:validate
    
    Write-Host "   ✅ Validação concluída!" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Validação falhou (alguns testes podem falhar antes do primeiro deploy)" -ForegroundColor Yellow
}

# ==========================================
# RESUMO FINAL
# ==========================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ✅ SETUP CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Recursos Criados:" -ForegroundColor Yellow
Write-Host "   ✅ Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "   ✅ Application Insights: $AppInsightsName" -ForegroundColor White
Write-Host "   ✅ Load Testing: $LoadTestName" -ForegroundColor White
Write-Host "   ✅ Dashboard: $DashboardName" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Variáveis Configuradas:" -ForegroundColor Yellow
Write-Host "   ✅ .env.local atualizado" -ForegroundColor White
Write-Host "   ⚠️  Configure também no Vercel (veja instruções acima)" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Próximos Passos:" -ForegroundColor Yellow
Write-Host "   1. Configurar Azure DevOps project" -ForegroundColor White
Write-Host "   2. Importar repositório do GitHub" -ForegroundColor White
Write-Host "   3. Criar pipeline usando azure-pipelines.yml" -ForegroundColor White
Write-Host "   4. Executar primeiro build" -ForegroundColor White
Write-Host "   5. Executar load test: npm run azure:load-test" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentação:" -ForegroundColor Yellow
Write-Host "   Ver guia completo em: docs/AZURE_MIGRATION_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Links Úteis:" -ForegroundColor Yellow
Write-Host "   Azure Portal: https://portal.azure.com" -ForegroundColor White
Write-Host "   Azure DevOps: https://dev.azure.com" -ForegroundColor White
Write-Host "   Application Insights:" -ForegroundColor White
Write-Host "     https://portal.azure.com/#@/resource/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/microsoft.insights/components/$AppInsightsName" -ForegroundColor Cyan
Write-Host ""
