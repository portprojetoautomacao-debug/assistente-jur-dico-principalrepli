# Deploy Azure Dashboard - Assistente Jurídico
# Script para criar dashboard no Azure Monitor com métricas dos agentes

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,
    
    [Parameter(Mandatory=$true)]
    [string]$AppInsightsName,
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "brazilsouth",
    
    [Parameter(Mandatory=$false)]
    [string]$DashboardName = "Assistente-Juridico-Agents-Dashboard"
)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Azure Dashboard Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Login no Azure
Write-Host "1. Fazendo login no Azure..." -ForegroundColor Yellow
try {
    az login
    az account set --subscription $SubscriptionId
    Write-Host "   ✅ Login bem-sucedido" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro no login: $_" -ForegroundColor Red
    exit 1
}

# 2. Obter Resource ID do Application Insights
Write-Host ""
Write-Host "2. Obtendo Resource ID do Application Insights..." -ForegroundColor Yellow
try {
    $appInsightsResourceId = az monitor app-insights component show `
        --app $AppInsightsName `
        --resource-group $ResourceGroup `
        --query "id" `
        --output tsv
    
    if ([string]::IsNullOrEmpty($appInsightsResourceId)) {
        throw "Application Insights '$AppInsightsName' não encontrado no Resource Group '$ResourceGroup'"
    }
    
    Write-Host "   ✅ Resource ID obtido: $appInsightsResourceId" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro: $_" -ForegroundColor Red
    exit 1
}

# 3. Deploy do Dashboard
Write-Host ""
Write-Host "3. Fazendo deploy do dashboard..." -ForegroundColor Yellow
try {
    $deploymentName = "dashboard-deployment-$(Get-Date -Format 'yyyyMMddHHmmss')"
    
    az deployment group create `
        --name $deploymentName `
        --resource-group $ResourceGroup `
        --template-file "azure-dashboard-template.json" `
        --parameters `
            dashboardName=$DashboardName `
            location=$Location `
            appInsightsResourceId=$appInsightsResourceId
    
    Write-Host "   ✅ Dashboard criado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro no deploy: $_" -ForegroundColor Red
    exit 1
}

# 4. Obter URL do Dashboard
Write-Host ""
Write-Host "4. Obtendo URL do dashboard..." -ForegroundColor Yellow
try {
    $dashboardResourceId = az portal dashboard show `
        --name $DashboardName `
        --resource-group $ResourceGroup `
        --query "id" `
        --output tsv
    
    $dashboardUrl = "https://portal.azure.com/#@/dashboard/arm$dashboardResourceId"
    
    Write-Host "   ✅ Dashboard disponível em:" -ForegroundColor Green
    Write-Host "   $dashboardUrl" -ForegroundColor Cyan
} catch {
    Write-Host "   ⚠️  Não foi possível obter URL automaticamente" -ForegroundColor Yellow
    Write-Host "   Acesse: https://portal.azure.com → Dashboards → $DashboardName" -ForegroundColor Yellow
}

# 5. Configurar Alertas
Write-Host ""
Write-Host "5. Configurando alertas automáticos..." -ForegroundColor Yellow

# Alerta: Taxa de erro alta
Write-Host "   Criando alerta: Taxa de Erro Alta..." -ForegroundColor Gray
try {
    az monitor metrics alert create `
        --name "HighErrorRate-Agents" `
        --resource-group $ResourceGroup `
        --scopes $appInsightsResourceId `
        --condition "count customMetrics/Agent_ErrorRate > 10" `
        --window-size 5m `
        --evaluation-frequency 1m `
        --severity 2 `
        --description "Taxa de erro dos agentes excedeu 10%" `
        --auto-mitigate true
    
    Write-Host "   ✅ Alerta criado: HighErrorRate-Agents" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Alerta já existe ou erro na criação" -ForegroundColor Yellow
}

# Alerta: Tempo de processamento alto
Write-Host "   Criando alerta: Tempo de Processamento Alto..." -ForegroundColor Gray
try {
    az monitor metrics alert create `
        --name "SlowAgentProcessing" `
        --resource-group $ResourceGroup `
        --scopes $appInsightsResourceId `
        --condition "avg customMetrics/Agent_AverageProcessingTime > 5000" `
        --window-size 10m `
        --evaluation-frequency 5m `
        --severity 3 `
        --description "Tempo médio de processamento dos agentes excedeu 5 segundos" `
        --auto-mitigate true
    
    Write-Host "   ✅ Alerta criado: SlowAgentProcessing" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Alerta já existe ou erro na criação" -ForegroundColor Yellow
}

# Alerta: Exceções críticas
Write-Host "   Criando alerta: Exceções Críticas..." -ForegroundColor Gray
try {
    az monitor metrics alert create `
        --name "CriticalExceptions-Agents" `
        --resource-group $ResourceGroup `
        --scopes $appInsightsResourceId `
        --condition "count exceptions > 5" `
        --window-size 5m `
        --evaluation-frequency 1m `
        --severity 1 `
        --description "Mais de 5 exceções críticas em 5 minutos" `
        --auto-mitigate true
    
    Write-Host "   ✅ Alerta criado: CriticalExceptions-Agents" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Alerta já existe ou erro na criação" -ForegroundColor Yellow
}

# 6. Resumo Final
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  ✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Dashboard:" -ForegroundColor Yellow
Write-Host "   Nome: $DashboardName" -ForegroundColor White
Write-Host "   Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "   Região: $Location" -ForegroundColor White
Write-Host ""
Write-Host "🔔 Alertas Configurados:" -ForegroundColor Yellow
Write-Host "   - HighErrorRate-Agents (Severity 2)" -ForegroundColor White
Write-Host "   - SlowAgentProcessing (Severity 3)" -ForegroundColor White
Write-Host "   - CriticalExceptions-Agents (Severity 1)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Próximos Passos:" -ForegroundColor Yellow
Write-Host "   1. Acessar o dashboard no Azure Portal" -ForegroundColor White
Write-Host "   2. Configurar ações de alerta (email, webhook)" -ForegroundColor White
Write-Host "   3. Executar testes de carga (azure-load-testing.yaml)" -ForegroundColor White
Write-Host "   4. Monitorar métricas em tempo real" -ForegroundColor White
Write-Host ""
