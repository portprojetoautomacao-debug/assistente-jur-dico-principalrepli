# 🎯 COMANDOS PRONTOS - COPIE E COLE

**Status**: ✅ Login concluído - Pronto para criar recursos  
**Tempo**: ~10 minutos

---

## ⚡ OPÇÃO 1: SCRIPT AUTOMÁTICO (RECOMENDADO)

### **Comando Único - Copie e Cole:**

```powershell
.\scripts\setup-azure-complete.ps1 -SubscriptionId "ac55a48c-bd53-4df0-959d-e142451a7081"
```

**Quando perguntar "Usar esta conta? (S/n)":**
- Digite: `S`
- Pressione: ENTER

**Tempo**: 8 minutos

---

## ⚡ OPÇÃO 2: COMANDOS MANUAIS (SE SCRIPT FALHAR)

### **Copie TODO este bloco e cole no PowerShell:**

```powershell
# Configuração
$subscriptionId = "ac55a48c-bd53-4df0-959d-e142451a7081"
$resourceGroup = "assistente-juridico-rg"
$location = "brazilsouth"
$appInsightsName = "assistente-juridico-insights"

Write-Host "🚀 Iniciando setup Azure..." -ForegroundColor Cyan

# 1. Definir subscription
Write-Host "1/6: Configurando subscription..." -ForegroundColor Yellow
az account set --subscription $subscriptionId
Write-Host "✅ Subscription configurada" -ForegroundColor Green

# 2. Criar Resource Group
Write-Host "2/6: Criando Resource Group..." -ForegroundColor Yellow
az group create --name $resourceGroup --location $location
Write-Host "✅ Resource Group criado" -ForegroundColor Green

# 3. Criar Application Insights
Write-Host "3/6: Criando Application Insights..." -ForegroundColor Yellow
az monitor app-insights component create `
  --app $appInsightsName `
  --location $location `
  --resource-group $resourceGroup `
  --kind web `
  --application-type web
Write-Host "✅ Application Insights criado" -ForegroundColor Green

# 4. Obter Connection String
Write-Host "4/6: Obtendo Connection String..." -ForegroundColor Yellow
$connectionString = az monitor app-insights component show `
  --app $appInsightsName `
  --resource-group $resourceGroup `
  --query "connectionString" `
  --output tsv
Write-Host "✅ Connection String obtido" -ForegroundColor Green

# 5. Criar/Atualizar .env.local
Write-Host "5/6: Configurando .env.local..." -ForegroundColor Yellow
$envContent = ""
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
}

if ($envContent -match "VITE_AZURE_INSIGHTS_CONNECTION_STRING") {
    $envContent = $envContent -replace 'VITE_AZURE_INSIGHTS_CONNECTION_STRING=.*', "VITE_AZURE_INSIGHTS_CONNECTION_STRING=`"$connectionString`""
} else {
    $envContent += "`nVITE_AZURE_INSIGHTS_CONNECTION_STRING=`"$connectionString`"`n"
}

$envContent | Set-Content ".env.local" -NoNewline
Write-Host "✅ .env.local atualizado" -ForegroundColor Green

# 6. Copiar Connection String
Write-Host "6/6: Copiando Connection String..." -ForegroundColor Yellow
$connectionString | Set-Clipboard
Write-Host "✅ Connection String copiado para clipboard!" -ForegroundColor Green

# Resumo
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ✅ SETUP CONCLUÍDO!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Recursos Criados:" -ForegroundColor Yellow
Write-Host "   ✅ Resource Group: $resourceGroup" -ForegroundColor White
Write-Host "   ✅ Application Insights: $appInsightsName" -ForegroundColor White
Write-Host "   ✅ .env.local configurado" -ForegroundColor White
Write-Host "   ✅ Connection String no clipboard!" -ForegroundColor White
Write-Host ""
Write-Host "🎯 PRÓXIMO PASSO:" -ForegroundColor Yellow
Write-Host "   1. Abrir: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   2. Projeto: assistente-juridico-github" -ForegroundColor White
Write-Host "   3. Settings → Environment Variables → Add New" -ForegroundColor White
Write-Host "   4. Nome: VITE_AZURE_INSIGHTS_CONNECTION_STRING" -ForegroundColor White
Write-Host "   5. Valor: CTRL+V (já está no clipboard!)" -ForegroundColor White
Write-Host "   6. Environments: Marcar TODAS" -ForegroundColor White
Write-Host "   7. Salvar" -ForegroundColor White
Write-Host ""
Write-Host "Connection String (caso precise):" -ForegroundColor Cyan
Write-Host $connectionString -ForegroundColor Gray
Write-Host ""
```

**Tempo**: 5-8 minutos

---

## 📋 DEPOIS DE EXECUTAR QUALQUER OPÇÃO ACIMA

### **1. Configurar no Vercel (3 minutos):**

O Connection String já foi copiado para o clipboard. Agora:

1. **Abrir**: https://vercel.com/dashboard
2. **Selecionar**: `assistente-juridico-github`
3. **Ir em**: Settings → Environment Variables
4. **Clicar**: Add New
5. **Preencher**:
   - Nome: `VITE_AZURE_INSIGHTS_CONNECTION_STRING`
   - Valor: **CTRL+V** (colar)
   - Environments: Marcar **TODAS**
6. **Salvar**
7. **Aguardar**: Re-deploy automático (2-3 min)

### **2. Verificar Dashboard (2 minutos):**

1. **Abrir**: https://portal.azure.com
2. **Buscar**: "Application Insights"
3. **Selecionar**: `assistente-juridico-insights`
4. **Clicar**: Live Metrics
5. **Aguardar**: 2-3 minutos
6. **Confirmar**: Dados aparecendo

### **3. Executar Validação (1 minuto):**

```powershell
npm run azure:validate
```

---

## 🚨 SE DER ERRO

### **Erro: "Resource Group já existe"**
- **Solução**: Isso é NORMAL! O script detecta e reutiliza
- Continue normalmente

### **Erro: "Application Insights já existe"**
- **Solução**: Isso é NORMAL! O script obtém o Connection String existente
- Continue normalmente

### **Erro: "Load Testing falhou"**
- **Solução**: Ignore! Load Testing é opcional
- O importante é Application Insights

### **Erro: "az: command not found"**
```powershell
# Reiniciar terminal ou adicionar ao PATH
$env:Path += ";C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin"
az --version
```

### **Erro: "Não autorizado"**
```powershell
# Re-fazer login
az logout
az login
```

---

## ✅ CHECKLIST RÁPIDO

Após executar os comandos, marque:

- [ ] Script executado com sucesso
- [ ] Connection String copiado
- [ ] `.env.local` criado/atualizado
- [ ] Variável adicionada no Vercel
- [ ] Re-deploy Vercel concluído
- [ ] Live Metrics mostrando dados
- [ ] Validação passou (`npm run azure:validate`)

---

## 📊 INFORMAÇÕES ÚTEIS

### **IDs Importantes:**
```
Subscription ID: ac55a48c-bd53-4df0-959d-e142451a7081
Tenant ID: 2c0660fe-297e-48b4-9ec3-7e00f99ccbc7
Resource Group: assistente-juridico-rg
Application Insights: assistente-juridico-insights
Location: brazilsouth
```

### **Links Diretos:**
- **Portal Azure**: https://portal.azure.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Application Insights**: https://portal.azure.com/#@/resource/subscriptions/ac55a48c-bd53-4df0-959d-e142451a7081/resourceGroups/assistente-juridico-rg/providers/microsoft.insights/components/assistente-juridico-insights

---

## 🎯 RESUMO

**Escolha uma opção:**

1. **OPÇÃO 1** (recomendada): Execute `.\scripts\setup-azure-complete.ps1 -SubscriptionId "ac55a48c-bd53-4df0-959d-e142451a7081"`
2. **OPÇÃO 2** (se a primeira falhar): Copie e cole o bloco de comandos manuais

**Depois:**
- Configure no Vercel (3 min)
- Verifique Dashboard (2 min)
- Execute validação (1 min)

**Tempo Total**: ~15 minutos

---

**Data**: 13/12/2024 16:50  
**Status**: Pronto para executar  
**Arquivo de referência**: `AZURE_SETUP_STATUS.md`
