# 🚀 Guia Rápido de Setup Azure - 5 Minutos

**Objetivo**: Configurar toda a infraestrutura Azure em 5 minutos com um único script.

---

## ⚡ Setup Automático (Recomendado)

### **Passo 1: Obter Subscription ID**

```powershell
# Login no Azure
az login

# Listar subscriptions disponíveis
az account list --output table

# Copiar o "SubscriptionId" da subscription desejada
```

### **Passo 2: Executar Script Automático**

```powershell
# No diretório raiz do projeto
cd scripts

# Executar setup completo
.\setup-azure-complete.ps1 -SubscriptionId "SUA-SUBSCRIPTION-ID-AQUI"
```

**O script irá**:
1. ✅ Verificar pré-requisitos (Azure CLI, Node.js, npm)
2. ✅ Fazer login no Azure
3. ✅ Criar Resource Group
4. ✅ Criar Application Insights
5. ✅ Criar Load Testing Resource
6. ✅ Configurar variáveis de ambiente (.env.local)
7. ✅ Deploy do dashboard Azure Monitor
8. ✅ Executar validação completa

**Tempo estimado**: 3-5 minutos

---

## 📋 Checklist Pós-Setup

Após executar o script automático, complete os seguintes itens:

### **Imediato** (5 min)

- [ ] **Configurar no Vercel**:
  1. Acessar: https://vercel.com/dashboard
  2. Projeto: `assistente-juridico-github`
  3. Settings → Environment Variables
  4. Adicionar: `VITE_AZURE_INSIGHTS_CONNECTION_STRING`
  5. Colar o valor exibido pelo script (já copiado!)
  6. Salvar e re-deploy

- [ ] **Validar Application Insights**:
  1. Acessar: https://portal.azure.com
  2. Navegar para: Application Insights → assistente-juridico-insights
  3. Live Metrics → Aguardar 2-3 minutos
  4. Verificar se dados aparecem

### **Curto Prazo** (1-2 dias)

- [ ] **Configurar Azure DevOps**:
  1. Criar projeto: https://dev.azure.com
  2. Importar repositório do GitHub
  3. Criar Service Connection (Azure + GitHub)
  4. Criar Variable Group: `production-secrets`
  5. Criar Pipeline usando `azure-pipelines.yml`

- [ ] **Executar Primeiro Build**:
  1. Azure DevOps → Pipelines → Run
  2. Aguardar conclusão (8-12 min)
  3. Verificar que todos os stages passaram ✅

- [ ] **Verificar Dashboard**:
  1. Portal Azure → Dashboards
  2. Selecionar: `Assistente-Juridico-Agents-Dashboard`
  3. Verificar que 11 widgets estão funcionando

### **Médio Prazo** (1 semana)

- [ ] **Executar Load Test Baseline**:
  ```bash
  npm run azure:load-test
  ```
  
- [ ] **Configurar Alertas**:
  1. Portal Azure → Monitor → Alerts
  2. Action Groups → Adicionar email/webhook
  3. Vincular aos alertas criados

- [ ] **Ajustar Thresholds**:
  1. Analisar métricas reais por 3-5 dias
  2. Ajustar alertas baseado em baseline
  3. Documentar valores de referência

- [ ] **Treinar Equipe**:
  1. Apresentar dashboard Azure Monitor
  2. Explicar métricas principais
  3. Demonstrar como investigar alertas
  4. Documentar procedimentos de resposta

### **Longo Prazo** (1 mês)

- [ ] **Migrar Completamente**:
  1. Desabilitar GitHub Actions workflows
  2. Mover todos os deploys para Azure Pipelines
  3. Configurar auto-scaling baseado em métricas
  4. Implementar Application Insights em todas as APIs

- [ ] **Otimizar Custos**:
  1. Revisar uso de Application Insights
  2. Ajustar sampling percentage se necessário
  3. Configurar retention policies
  4. Monitorar billing alerts

---

## 🔧 Troubleshooting Rápido

### **Erro: "Azure CLI não instalado"**

```powershell
# Instalar Azure CLI
winget install Microsoft.AzureCLI

# Ou via Chocolatey
choco install azure-cli

# Ou baixar instalador
# https://aka.ms/installazurecli
```

### **Erro: "Subscription não encontrada"**

```powershell
# Listar subscriptions
az account list --output table

# Definir subscription padrão
az account set --subscription "SUBSCRIPTION-ID"
```

### **Erro: "Application Insights não recebe dados"**

1. Verificar connection string:
   ```bash
   cat .env.local | grep AZURE_INSIGHTS
   ```

2. Verificar no código:
   ```typescript
   // src/lib/azure-insights.ts deve estar importado
   // Verificar console do navegador para erros
   ```

3. Forçar flush de dados:
   ```typescript
   import { appInsights } from '@/lib/azure-insights';
   appInsights.flush();
   ```

### **Erro: "Dashboard não carrega"**

```powershell
# Re-deploy do dashboard
cd scripts
.\deploy-azure-dashboard.ps1 -SubscriptionId "..." -ResourceGroup "assistente-juridico-rg" -AppInsightsName "assistente-juridico-insights"
```

---

## 📊 Verificação de Sucesso

Execute este checklist para confirmar que tudo está funcionando:

```powershell
# 1. Validar integração
npm run azure:validate

# 2. Verificar recursos no Azure
az resource list --resource-group assistente-juridico-rg --output table

# 3. Verificar Application Insights
az monitor app-insights component show `
  --app assistente-juridico-insights `
  --resource-group assistente-juridico-rg `
  --query "{name:name,provisioningState:provisioningState,connectionString:connectionString}"

# 4. Testar tracking localmente
npm run dev
# Abrir http://localhost:5173
# Verificar console: "✅ Azure Application Insights loaded successfully"
```

---

## 🎯 Comandos Úteis

```powershell
# Ver todos os recursos criados
az resource list --resource-group assistente-juridico-rg --output table

# Ver custos acumulados
az consumption usage list --resource-group assistente-juridico-rg --output table

# Ver logs do Application Insights
az monitor app-insights query `
  --app assistente-juridico-insights `
  --resource-group assistente-juridico-rg `
  --analytics-query "customEvents | take 10"

# Executar load test manualmente
az load test-run create `
  --load-test-resource assistente-juridico-load-test `
  --resource-group assistente-juridico-rg `
  --test-id agents-stress-test `
  --test-run-id "run-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
```

---

## 📚 Próximos Passos

Após completar o setup inicial:

1. **Ler o guia completo**: `docs/AZURE_MIGRATION_GUIDE.md`
2. **Configurar Azure DevOps** (ver seção específica no guia)
3. **Executar load tests** para estabelecer baseline
4. **Ajustar alertas** baseado em métricas reais
5. **Treinar equipe** no uso do dashboard

---

## 💡 Dicas

- **Custo**: Com Free Tier, esperado **$5-15/mês**
- **Dados**: Application Insights retém dados por **90 dias** (Free Tier)
- **Sampling**: Configurado para **50% em produção** (reduz custos)
- **Alertas**: Configurados com **auto-mitigate** (desliga automaticamente quando resolvido)

---

**Última Atualização**: 2024-01-XX  
**Versão**: 1.0  
**Tempo de Execução**: 5 minutos
