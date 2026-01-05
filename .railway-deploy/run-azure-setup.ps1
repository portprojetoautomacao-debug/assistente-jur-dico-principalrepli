# ========================================
# SCRIPT DE SETUP AZURE - PASSO A PASSO
# ========================================
# Execute este script APÓS reiniciar o terminal
# PowerShell precisa ser executado como Administrador

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SETUP AZURE - ASSISTENTE JURÍDICO PJE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Passo 1: Verificar instalação do Azure CLI
Write-Host "PASSO 1/5: Verificando Azure CLI..." -ForegroundColor Yellow
try {
    $azVersion = az --version 2>&1 | Select-Object -First 1
    Write-Host "   ✅ Azure CLI instalado: $azVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Azure CLI não encontrado!" -ForegroundColor Red
    Write-Host "   Por favor, reinicie o terminal e execute este script novamente." -ForegroundColor Yellow
    exit 1
}

# Passo 2: Login no Azure
Write-Host ""
Write-Host "PASSO 2/5: Fazendo login no Azure..." -ForegroundColor Yellow
Write-Host "   Uma janela do navegador será aberta para autenticação." -ForegroundColor Cyan
Write-Host ""

try {
    az login
    Write-Host "   ✅ Login realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro no login: $_" -ForegroundColor Red
    exit 1
}

# Passo 3: Listar subscriptions e obter ID
Write-Host ""
Write-Host "PASSO 3/5: Obtendo Subscription ID..." -ForegroundColor Yellow
Write-Host ""

$subscriptions = az account list --output json | ConvertFrom-Json

if ($subscriptions.Count -eq 0) {
    Write-Host "   ❌ Nenhuma subscription encontrada!" -ForegroundColor Red
    exit 1
}

Write-Host "   Subscriptions disponíveis:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   ID | Nome                    | Estado" -ForegroundColor White
Write-Host "   ---|-------------------------|--------" -ForegroundColor White

$index = 1
foreach ($sub in $subscriptions) {
    $name = $sub.name
    $id = $sub.id
    $state = $sub.state
    Write-Host "   $index  | $name | $state" -ForegroundColor White
    $index++
}

Write-Host ""

# Se houver apenas 1 subscription, usar automaticamente
if ($subscriptions.Count -eq 1) {
    $subscriptionId = $subscriptions[0].id
    $subscriptionName = $subscriptions[0].name
    Write-Host "   ✅ Usando subscription: $subscriptionName" -ForegroundColor Green
    Write-Host "   ID: $subscriptionId" -ForegroundColor Cyan
} else {
    # Perguntar qual subscription usar
    $choice = Read-Host "   Escolha o número da subscription (1-$($subscriptions.Count))"
    $subscriptionId = $subscriptions[$choice - 1].id
    $subscriptionName = $subscriptions[$choice - 1].name
    Write-Host "   ✅ Subscription selecionada: $subscriptionName" -ForegroundColor Green
}

# Definir subscription padrão
az account set --subscription $subscriptionId

# Passo 4: Executar setup completo
Write-Host ""
Write-Host "PASSO 4/5: Executando setup automático..." -ForegroundColor Yellow
Write-Host "   Isso vai criar todos os recursos Azure necessários." -ForegroundColor Cyan
Write-Host "   Tempo estimado: 5-8 minutos" -ForegroundColor Cyan
Write-Host ""

$confirm = Read-Host "   Continuar? (S/n)"
if ($confirm -eq "n" -or $confirm -eq "N") {
    Write-Host "   ❌ Setup cancelado pelo usuário." -ForegroundColor Yellow
    exit 0
}

try {
    # Navegar para pasta scripts
    Push-Location -Path "scripts"
    
    # Executar script de setup
    .\setup-azure-complete.ps1 -SubscriptionId $subscriptionId
    
    # Voltar para pasta raiz
    Pop-Location
    
    Write-Host ""
    Write-Host "   ✅ Setup automático concluído!" -ForegroundColor Green
    
} catch {
    Write-Host "   ❌ Erro no setup: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Passo 5: Executar validação
Write-Host ""
Write-Host "PASSO 5/5: Validando integração..." -ForegroundColor Yellow
Write-Host ""

try {
    npm run azure:validate
    Write-Host ""
    Write-Host "   ✅ Validação concluída!" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Alguns testes de validação falharam (normal antes do primeiro deploy)" -ForegroundColor Yellow
}

# Resumo final
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ✅ SETUP CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Configurar no Vercel:" -ForegroundColor White
Write-Host "      - Acessar: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host "      - Projeto: assistente-juridico-github" -ForegroundColor Cyan
Write-Host "      - Settings → Environment Variables" -ForegroundColor Cyan
Write-Host "      - Adicionar: VITE_AZURE_INSIGHTS_CONNECTION_STRING" -ForegroundColor Cyan
Write-Host "      - Valor: (já copiado para clipboard!)" -ForegroundColor Cyan
Write-Host ""
Write-Host "   2. Verificar Dashboard:" -ForegroundColor White
Write-Host "      - https://portal.azure.com" -ForegroundColor Cyan
Write-Host "      - Application Insights → assistente-juridico-insights" -ForegroundColor Cyan
Write-Host "      - Live Metrics (aguardar 2-3 min após deploy)" -ForegroundColor Cyan
Write-Host ""
Write-Host "   3. Executar Load Test (opcional):" -ForegroundColor White
Write-Host "      - npm run azure:load-test" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Documentação:" -ForegroundColor Yellow
Write-Host "   - Ver AZURE_SETUP_INSTRUCOES.md para mais detalhes" -ForegroundColor Cyan
Write-Host ""
