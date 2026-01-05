# 🚀 Instruções de Setup Azure - Passo a Passo

**Status Atual**: Azure Cloud Shell detectado, mas CLI local não instalado  
**Tempo Estimado**: 20-25 minutos  
**Data**: 13/12/2024

---

## 📋 SITUAÇÃO ATUAL

✅ **Você já tem**:
- Conta Azure ativa (detectada)
- Assinatura: "Azure subscription 1"
- Resource Group: cloud-shell-storage-eastus
- Acesso ao Cloud Shell

❌ **Faltando**:
- Azure CLI instalado localmente
- Recursos Application Insights criados
- Variáveis de ambiente configuradas

---

## 🎯 OPÇÃO 1: INSTALAÇÃO LOCAL (RECOMENDADO)

### **Passo 1: Instalar Azure CLI Local** (5 min)

Abra um **PowerShell como Administrador** e execute:

```powershell
# Opção A: Via Winget (mais rápido)
winget install Microsoft.AzureCLI

# OU Opção B: Via Chocolatey (se já tem instalado)
choco install azure-cli

# OU Opção C: Instalador MSI
# Baixar: https://aka.ms/installazurecli
```

**⚠️ IMPORTANTE**: Após instalar, **FECHE e REABRA** o terminal!

---

### **Passo 2: Verificar Instalação** (1 min)

```powershell
# Verificar versão instalada
az --version

# Deve retornar algo como:
# azure-cli                         2.55.0
```

---

### **Passo 3: Login no Azure** (2 min)

```powershell
# Fazer login (abre navegador automaticamente)
az login

# Listar subscriptions disponíveis
az account list --output table

# Copiar o SubscriptionId da "Azure subscription 1"
```

**Você verá algo assim:**
```
Name                  SubscriptionId                        State
--------------------  ------------------------------------  -------
Azure subscription 1  xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  Enabled
```

**📋 COPIE o SubscriptionId** - vamos usar no próximo passo!

---

### **Passo 4: Executar Setup Automático** (5-8 min)

Com o SubscriptionId copiado, execute:

```powershell
# Navegar para pasta de scripts
cd scripts

# Executar setup completo (SUBSTITUA o ID!)
.\setup-azure-complete.ps1 -SubscriptionId "SEU-SUBSCRIPTION-ID-AQUI"
```

**O script irá**:
1. ✅ Criar Resource Group: `assistente-juridico-rg`
2. ✅ Criar Application Insights: `assistente-juridico-insights`
3. ✅ Criar Load Testing: `assistente-juridico-load-test`
4. ✅ Configurar `.env.local` automaticamente
5. ✅ Deploy do dashboard Azure Monitor
6. ✅ Configurar 3 alertas automáticos
7. ✅ Executar validação completa
8. ✅ **COPIAR Connection String para clipboard**

**Resultado Esperado**:
```
============================================
  ✅ SETUP CONCLUÍDO COM SUCESSO!
============================================

📊 Recursos Criados:
   ✅ Resource Group: assistente-juridico-rg
   ✅ Application Insights: assistente-juridico-insights
   ✅ Load Testing: assistente-juridico-load-test
   ✅ Dashboard: Assistente-Juridico-Agents-Dashboard

🔐 Variáveis Configuradas:
   ✅ .env.local atualizado
   ✅ Connection String copiado para clipboard!
```

---

### **Passo 5: Configurar no Vercel** (3 min)

1. **Abrir Vercel Dashboard**:
   - https://vercel.com/dashboard

2. **Selecionar Projeto**:
   - `assistente-juridico-github`

3. **Adicionar Variável de Ambiente**:
   - Ir em: **Settings** → **Environment Variables**
   - Clicar em: **Add New**
   - Nome: `VITE_AZURE_INSIGHTS_CONNECTION_STRING`
   - Valor: **CTRL+V** (já foi copiado pelo script!)
   - Environments: Marcar **TODAS** (Production, Preview, Development)
   - Clicar: **Save**

4. **Re-deploy**:
   - Vercel vai fazer re-deploy automaticamente
   - Aguardar 2-3 minutos

---

### **Passo 6: Validar Integração** (5 min)

```powershell
# Voltar para pasta raiz
cd ..

# Executar validação completa
npm run azure:validate
```

**Resultado Esperado**:
```
✅ Passaram: 18-20 testes
⚠️ Alguns avisos são normais (ex: Load Testing pode não estar disponível)
```

---

### **Passo 7: Verificar Dashboard** (2 min)

1. **Abrir Portal Azure**:
   - https://portal.azure.com

2. **Navegar para Application Insights**:
   - Buscar: "Application Insights"
   - Selecionar: `assistente-juridico-insights`

3. **Ver Live Metrics**:
   - Clicar em: **Live Metrics**
   - Aguardar 2-3 minutos
   - Verificar: Dados aparecendo em tempo real

4. **Ver Dashboard**:
   - Ir em: **Dashboards**
   - Selecionar: `Assistente-Juridico-Agents-Dashboard`
   - Verificar: 11 widgets funcionando

---

## 🎯 OPÇÃO 2: USAR CLOUD SHELL (ALTERNATIVA)

Se não quiser instalar localmente, pode usar o Cloud Shell do Azure:

### **Passo 1: Abrir Cloud Shell**
- https://shell.azure.com
- Ou no Portal Azure: clicar no ícone `>_` no topo

### **Passo 2: Upload dos Scripts**
```bash
# No Cloud Shell, criar diretório
mkdir ~/assistente-juridico
cd ~/assistente-juridico

# Fazer upload manual dos arquivos:
# - setup-azure-complete.ps1
# - deploy-azure-dashboard.ps1
# - azure-dashboard-template.json
# (Use botão "Upload/Download files" no Cloud Shell)
```

### **Passo 3: Executar Setup**
```bash
# Obter Subscription ID
az account show --query id --output tsv

# Executar script PowerShell no Cloud Shell
pwsh ./setup-azure-complete.ps1 -SubscriptionId "SEU-ID"
```

**⚠️ Limitação**: Você precisará **copiar manualmente** o Connection String gerado.

---

## 🔍 TROUBLESHOOTING

### **Erro: "Azure CLI não reconhecido"**
**Causa**: CLI não instalado ou terminal não foi reiniciado  
**Solução**:
```powershell
# 1. Fechar terminal completamente
# 2. Reabrir como Administrador
# 3. Testar: az --version
```

---

### **Erro: "Subscription não encontrada"**
**Causa**: Não está logado ou subscription incorreta  
**Solução**:
```powershell
# Re-login
az login

# Listar subscriptions
az account list --output table

# Definir subscription padrão
az account set --subscription "SEU-SUBSCRIPTION-ID"
```

---

### **Erro: "Resource Group já existe"**
**Causa**: Script já foi executado antes  
**Solução**:
```powershell
# Opção 1: Usar Resource Group existente
# O script detecta automaticamente

# Opção 2: Deletar e recriar
az group delete --name assistente-juridico-rg --yes
# Depois executar script novamente
```

---

### **Erro: "Application Insights não recebe dados"**
**Causa**: Connection String não configurada corretamente  
**Solução**:
```powershell
# 1. Verificar .env.local
cat .env.local | Select-String "AZURE"

# 2. Verificar no Vercel
# Vercel Dashboard → Settings → Environment Variables
# Confirmar que VITE_AZURE_INSIGHTS_CONNECTION_STRING existe

# 3. Re-deploy no Vercel
vercel --prod
```

---

### **Erro: "Dashboard não aparece"**
**Causa**: Deploy do dashboard falhou  
**Solução**:
```powershell
# Re-executar deploy do dashboard
cd scripts
.\deploy-azure-dashboard.ps1 `
  -SubscriptionId "SEU-ID" `
  -ResourceGroup "assistente-juridico-rg" `
  -AppInsightsName "assistente-juridico-insights"
```

---

## 📊 COMO SABER SE ESTÁ FUNCIONANDO?

### **1. Verificar .env.local**
```powershell
cat .env.local | Select-String "AZURE"
```

Deve retornar:
```
VITE_AZURE_INSIGHTS_CONNECTION_STRING="InstrumentationKey=...;IngestionEndpoint=..."
```

---

### **2. Verificar no Portal Azure**
```
1. https://portal.azure.com
2. Application Insights → assistente-juridico-insights
3. Live Metrics → Ver dados em tempo real
4. Failures → Ver erros capturados
5. Performance → Ver chamadas de API
```

---

### **3. Testar Tracking Manualmente**
```typescript
// Em qualquer componente React
import { trackAgentTask } from '@/lib/azure-insights';

// Enviar evento de teste
trackAgentTask('harvey', 'TEST_TASK', 'COMPLETED', 1000);
```

Verificar no Portal Azure após 1-2 minutos:
```
Application Insights → Logs → Query:
customEvents | where name == "Agent_TaskExecuted"
```

---

## 💰 CUSTOS

### **Free Tier (Primeiro Mês)**
- Application Insights: **5 GB/mês GRÁTIS**
- Load Testing: **50 VUh/mês GRÁTIS**
- Azure Monitor: **5 GB logs/mês GRÁTIS**
- Storage: **5 GB GRÁTIS**

### **Custo Real Estimado** (após Free Tier)
Para um escritório pequeno/médio:
- Application Insights: **$5-10/mês**
- Storage: **$0.50/mês**
- Load Testing: **$0** (dentro do free tier)
- **TOTAL: $5-15/mês**

**Provável**: Ficar completamente dentro do free tier nos primeiros meses!

---

## 🎯 PRÓXIMOS PASSOS APÓS SETUP

### **Imediato** (após setup)
- [ ] Verificar que dados aparecem no Live Metrics
- [ ] Testar envio de evento customizado
- [ ] Confirmar alertas configurados

### **Curto Prazo** (1 semana)
- [ ] Executar primeiro load test: `npm run azure:load-test`
- [ ] Ajustar thresholds de alertas baseado em dados reais
- [ ] Configurar notificações (email/webhook)

### **Médio Prazo** (1 mês)
- [ ] Configurar Azure DevOps project
- [ ] Migrar CI/CD para Azure Pipelines
- [ ] Implementar tracking em todas as APIs

### **Longo Prazo** (3 meses)
- [ ] Auto-scaling baseado em métricas
- [ ] Dashboards customizados
- [ ] Integração com Power BI

---

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

| Documento | Localização | Uso |
|-----------|-------------|-----|
| **Guia Completo** | `docs/AZURE_MIGRATION_GUIDE.md` | Setup detalhado |
| **Quickstart** | `docs/AZURE_QUICKSTART.md` | Setup em 5 min |
| **Checklist** | `docs/AZURE_CHECKLIST.md` | Acompanhamento |
| **Status** | `AZURE_STATUS_REPORT.md` | Situação atual |
| **Este Guia** | `AZURE_SETUP_INSTRUCOES.md` | Instruções práticas |

---

## 🆘 PRECISA DE AJUDA?

### **Suporte Técnico**
- Email: thiagobodevanadvocacia@gmail.com
- Documentação: Consultar `docs/AZURE_*.md`
- Validação: `npm run azure:validate`

### **Links Úteis**
- Portal Azure: https://portal.azure.com
- Vercel Dashboard: https://vercel.com/dashboard
- Azure CLI Docs: https://docs.microsoft.com/cli/azure/
- Application Insights Docs: https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview

---

## ✅ CHECKLIST FINAL

Marque conforme for completando:

- [ ] Azure CLI instalado e verificado (`az --version`)
- [ ] Login no Azure concluído (`az login`)
- [ ] Subscription ID copiado
- [ ] Script `setup-azure-complete.ps1` executado com sucesso
- [ ] `.env.local` criado com Connection String
- [ ] Variável adicionada no Vercel
- [ ] Re-deploy do Vercel concluído
- [ ] `npm run azure:validate` passou
- [ ] Live Metrics mostrando dados
- [ ] Dashboard visível no Portal Azure

**Status**: ⬜ Não Iniciado | ⏳ Em Progresso | ✅ Concluído

---

**Última Atualização**: 13/12/2024 16:20  
**Próxima Revisão**: Após completar setup  
**Versão**: 1.0

