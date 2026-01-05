# 🔵 Guia Completo de Migração para Azure DevOps + Monitoring

**Objetivo**: Migrar do GitHub Actions para Azure DevOps e implementar monitoramento completo com Azure Application Insights, Load Testing e Monitor.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Migração do GitHub Actions para Azure Pipelines](#migração-github-actions-para-azure-pipelines)
3. [Implementação do Application Insights](#implementação-application-insights)
4. [Configuração de Load Testing](#configuração-load-testing)
5. [Deploy de Dashboards Azure Monitor](#deploy-dashboards-azure-monitor)
6. [Validação e Testes](#validação-e-testes)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Pré-requisitos

### **Conta e Recursos Azure**

- ✅ Conta Azure ativa (criar em: https://azure.microsoft.com/free)
- ✅ Subscrição válida (Free Tier disponível)
- ✅ Azure DevOps Organization criada (https://dev.azure.com)
- ✅ Azure CLI instalado (https://aka.ms/installazurecli)

### **Ferramentas Locais**

```bash
# Verificar instalações
az --version          # Azure CLI
node --version        # Node.js 22.x
npm --version         # npm
git --version         # Git
```

### **Permissões Necessárias**

- **Azure**: `Contributor` ou `Owner` no Resource Group
- **Azure DevOps**: `Project Administrator`
- **GitHub**: `Admin` no repositório (para migração)

---

## 🔄 Migração GitHub Actions → Azure Pipelines

### **Passo 1: Criar Recursos no Azure**

```bash
# 1. Login no Azure
az login

# 2. Criar Resource Group
az group create \
  --name assistente-juridico-rg \
  --location brazilsouth

# 3. Criar Application Insights
az monitor app-insights component create \
  --app assistente-juridico-insights \
  --location brazilsouth \
  --resource-group assistente-juridico-rg \
  --kind web \
  --application-type web

# 4. Obter Connection String
az monitor app-insights component show \
  --app assistente-juridico-insights \
  --resource-group assistente-juridico-rg \
  --query "connectionString" \
  --output tsv
```

**Salvar o Connection String** - será usado nas variáveis de ambiente.

### **Passo 2: Configurar Azure DevOps Project**

1. **Criar Novo Projeto**:
   - Acessar: https://dev.azure.com
   - Clicar em **New Project**
   - Nome: `Assistente Jurídico PJe`
   - Visibility: `Private`
   - Version Control: `Git`

2. **Importar Repositório do GitHub**:
   ```bash
   # No Azure DevOps → Repos → Files
   # Clicar em "Import"
   # Clone URL: https://github.com/thiagobodevanadv-alt/assistente-jur-dico-principal
   ```

3. **Configurar Service Connection**:
   - **Azure DevOps** → **Project Settings** → **Service connections**
   - Clicar em **New service connection**
   - Selecionar **Azure Resource Manager**
   - Autenticação: **Service Principal (automatic)**
   - Scope: **Subscription**
   - Nome: `Azure-Subscription-Connection`

4. **Configurar Service Connection do GitHub** (para triggers):
   - **New service connection** → **GitHub**
   - Autorizar Azure DevOps
   - Selecionar repositório: `assistente-jur-dico-principal`

### **Passo 3: Configurar Azure Pipeline**

1. **Criar Pipeline**:
   - Azure DevOps → Pipelines → **New Pipeline**
   - Selecionar: **Azure Repos Git**
   - Selecionar repositório importado
   - Selecionar: **Existing Azure Pipelines YAML file**
   - Path: `/azure-pipelines.yml`

2. **Configurar Variáveis Secretas**:
   ```
   Azure DevOps → Pipelines → Library → New variable group
   ```

   **Criar Variable Group**: `production-secrets`

   | Variável | Valor | Tipo |
   |----------|-------|------|
   | `VERCEL_TOKEN` | `<seu_token_vercel>` | Secret |
   | `VERCEL_ORG_ID` | `thiagobodevan-org` | Regular |
   | `VERCEL_PROJECT_ID` | `assistente-juridico-github` | Regular |
   | `VITE_GOOGLE_CLIENT_ID` | `<seu_client_id>` | Secret |
   | `VITE_GOOGLE_API_KEY` | `<sua_api_key>` | Secret |
   | `VITE_AZURE_INSIGHTS_CONNECTION_STRING` | `<connection_string>` | Secret |
   | `SUBSCRIPTION_ID` | `<sua_subscription_id>` | Regular |

3. **Vincular Variable Group ao Pipeline**:
   ```yaml
   # Adicionar ao azure-pipelines.yml (já configurado)
   variables:
     - group: production-secrets
   ```

4. **Executar Primeira Build**:
   - Clicar em **Run Pipeline**
   - Aguardar execução completa
   - Validar que todos os stages passaram ✅

### **Passo 4: Configurar SonarCloud**

1. **Criar Connection no Azure DevOps**:
   - **Project Settings** → **Service connections**
   - **New** → **SonarCloud**
   - Token: Obter em https://sonarcloud.io/account/security
   - Nome: `SonarCloud-Connection`

2. **Configurar Organization**:
   - Acessar: https://sonarcloud.io
   - **My Account** → **Organizations**
   - Importar organização do GitHub
   - Criar projeto: `assistente-juridico-pje`

3. **Obter Project Key**:
   ```
   Copiar: thiagobodevan-a11y_assistente-juridico-p
   ```

4. **Atualizar azure-pipelines.yml**:
   ```yaml
   # Já configurado no arquivo
   - task: SonarCloudPrepare@1
     inputs:
       SonarCloud: 'SonarCloud-Connection'
       organization: 'thiagobodevan-org'
       scannerMode: 'CLI'
       configMode: 'manual'
       cliProjectKey: 'thiagobodevan-a11y_assistente-juridico-p'
   ```

---

## 📊 Implementação Application Insights

### **Passo 1: Instalar Dependências**

```bash
# No diretório do projeto
npm install --save @microsoft/applicationinsights-web \
                   @microsoft/applicationinsights-react-js \
                   history
```

### **Passo 2: Configurar Variável de Ambiente**

Adicionar ao `.env.local` (desenvolvimento):
```bash
VITE_AZURE_INSIGHTS_CONNECTION_STRING="InstrumentationKey=...;IngestionEndpoint=..."
```

Adicionar ao **Vercel** (produção):
```bash
# Vercel Dashboard → Settings → Environment Variables
VITE_AZURE_INSIGHTS_CONNECTION_STRING = "<connection_string>"
```

### **Passo 3: Integrar no App**

Editar `src/main.tsx`:

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 🔵 NOVO: Importar Application Insights
import { appInsights, browserHistory, reactPlugin } from './lib/azure-insights';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// 🔵 NOVO: Cleanup ao desmontar
window.addEventListener('beforeunload', () => {
  appInsights.flush();
});
```

### **Passo 4: Validar Integração**

```bash
# 1. Rodar app localmente
npm run dev

# 2. Abrir navegador
http://localhost:5173

# 3. Verificar console
# Deve aparecer: "✅ Azure Application Insights loaded successfully"

# 4. Verificar no Azure Portal
# Portal Azure → Application Insights → Live Metrics
# Deve mostrar métricas em tempo real
```

---

## 🧪 Configuração Load Testing

### **Passo 1: Criar Recurso de Load Testing**

```bash
# 1. Instalar extensão Azure Load Testing
az extension add --name load

# 2. Criar recurso
az load create \
  --name assistente-juridico-load-test \
  --resource-group assistente-juridico-rg \
  --location brazilsouth
```

### **Passo 2: Upload do Teste**

```bash
# Upload do arquivo de configuração
az load test create \
  --load-test-resource assistente-juridico-load-test \
  --resource-group assistente-juridico-rg \
  --test-id agents-stress-test \
  --display-name "Agents Stress Test" \
  --description "Teste de carga dos agentes IA" \
  --test-plan azure-load-testing.yaml
```

### **Passo 3: Executar Teste**

```bash
# Executar cenário de carga normal
az load test-run create \
  --load-test-resource assistente-juridico-load-test \
  --resource-group assistente-juridico-rg \
  --test-id agents-stress-test \
  --test-run-id "run-$(date +%Y%m%d-%H%M%S)" \
  --display-name "Normal Load Test" \
  --description "Teste com 50 usuários simultâneos"

# Monitorar execução
az load test-run show \
  --load-test-resource assistente-juridico-load-test \
  --resource-group assistente-juridico-rg \
  --test-run-id <test-run-id>
```

### **Passo 4: Visualizar Resultados**

```
Portal Azure → Load Testing → assistente-juridico-load-test → Test runs
```

**Métricas Analisadas**:
- Response time (avg, p50, p95, p99)
- Throughput (req/s)
- Error rate (%)
- Concurrent users

---

## 📈 Deploy Dashboards Azure Monitor

### **Passo 1: Executar Script de Deploy**

```powershell
# No PowerShell (Windows) ou PowerShell Core (Linux/Mac)
cd scripts

.\deploy-azure-dashboard.ps1 `
  -SubscriptionId "sua-subscription-id" `
  -ResourceGroup "assistente-juridico-rg" `
  -AppInsightsName "assistente-juridico-insights" `
  -Location "brazilsouth"
```

### **Passo 2: Acessar Dashboard**

```
Portal Azure → Dashboards → Assistente-Juridico-Agents-Dashboard
```

**Widgets Disponíveis**:
1. 📊 Tarefas Concluídas por Agente
2. ⏱️ Tempo Médio de Processamento
3. ❌ Taxa de Erro por Agente
4. 📈 Eventos dos Agentes (Tempo Real)
5. ✅ Status das Tarefas
6. 📩 Intimações Processadas
7. 📝 Minutas Geradas
8. 🐛 Erros Recentes
9. 🌐 Chamadas de API
10. 💾 Redis Operations
11. ⚡ Performance Metrics

### **Passo 3: Configurar Alertas**

Os alertas são criados automaticamente pelo script:

| Alerta | Condição | Severidade |
|--------|----------|------------|
| `HighErrorRate-Agents` | Taxa de erro > 10% | 2 (High) |
| `SlowAgentProcessing` | Tempo médio > 5s | 3 (Medium) |
| `CriticalExceptions-Agents` | > 5 exceções em 5min | 1 (Critical) |

**Configurar Ações de Alerta**:
```bash
# Criar Action Group para notificações
az monitor action-group create \
  --name "AgentsAlerts-ActionGroup" \
  --resource-group assistente-juridico-rg \
  --short-name "AgentsAlert" \
  --action email admin thiagobodevanadvocacia@gmail.com \
  --action webhook webhook-alert "https://assistente-juridico-github.vercel.app/api/notifications/send"
```

---

## ✅ Validação e Testes

### **Checklist de Validação**

#### **Azure Pipelines**
- [ ] Pipeline executa sem erros
- [ ] Build completo em < 10 minutos
- [ ] Testes unitários passam (100%)
- [ ] Testes E2E passam (Chromium + Firefox)
- [ ] SonarCloud analysis completa
- [ ] Deploy para Vercel funciona

#### **Application Insights**
- [ ] Connection string configurada
- [ ] Live Metrics mostrando dados
- [ ] Custom Events aparecendo (Agent_*)
- [ ] Exceptions sendo trackadas
- [ ] Dependencies (API/Redis) visíveis

#### **Load Testing**
- [ ] Teste de carga normal executado
- [ ] Response time < 3s (p95)
- [ ] Error rate < 5%
- [ ] Throughput > 10 req/s

#### **Azure Monitor Dashboard**
- [ ] Dashboard criado com sucesso
- [ ] 11 widgets funcionando
- [ ] Dados aparecendo em tempo real
- [ ] Alertas configurados
- [ ] Action Groups configurados

### **Testes Manuais**

#### **Teste 1: Tracking de Agente**
```typescript
// No navegador (Console)
import { trackAgentTask } from '@/lib/azure-insights';

trackAgentTask('harvey', 'ANALYZE_DOCUMENT', 'COMPLETED', 1500);

// Verificar em:
// Portal Azure → Application Insights → Logs
// Executar query:
// customEvents | where name == 'Agent_TaskExecuted'
```

#### **Teste 2: Tracking de Erro**
```typescript
// Forçar erro
import { trackError } from '@/lib/azure-insights';

trackError(new Error('Teste de erro'), {
  component: 'test',
  agentId: 'harvey',
  severity: 'error'
});

// Verificar em:
// Portal Azure → Application Insights → Failures
```

#### **Teste 3: Load Test Manual**
```bash
# Executar teste de pico
az load test-run create \
  --load-test-resource assistente-juridico-load-test \
  --resource-group assistente-juridico-rg \
  --test-id agents-stress-test \
  --scenario PeakLoad

# Monitorar dashboard em tempo real
```

---

## 🔧 Troubleshooting

### **Problema: Pipeline falha no build**

**Sintomas**:
```
Error: Build failed with exit code 1
```

**Solução**:
```bash
# 1. Verificar variáveis de ambiente
Azure DevOps → Pipelines → Edit → Variables

# 2. Validar localmente
npm ci
npm run build

# 3. Verificar logs detalhados
Azure DevOps → Pipeline → Job → Logs
```

### **Problema: Application Insights não recebe dados**

**Sintomas**:
- Live Metrics vazio
- Sem custom events

**Solução**:
```typescript
// 1. Verificar connection string
console.log(import.meta.env.VITE_AZURE_INSIGHTS_CONNECTION_STRING);

// 2. Forçar flush
import { appInsights } from '@/lib/azure-insights';
appInsights.flush();

// 3. Verificar no navegador
// DevTools → Network → Filtrar por "dc.services"
// Deve haver chamadas para Application Insights
```

### **Problema: Load Test falha**

**Sintomas**:
```
Error: Test run failed - target not responding
```

**Solução**:
```bash
# 1. Verificar se app está no ar
curl https://assistente-juridico-github.vercel.app/api/health

# 2. Reduzir carga inicial
# Editar azure-load-testing.yaml
# Reduzir virtualUsers para 10

# 3. Verificar quotas
az load show --name assistente-juridico-load-test \
             --resource-group assistente-juridico-rg \
             --query "quota"
```

### **Problema: Dashboard não carrega**

**Sintomas**:
- Dashboard em branco
- "No data available"

**Solução**:
```bash
# 1. Verificar permissões
az role assignment list \
  --assignee $(az account show --query user.name -o tsv) \
  --resource-group assistente-juridico-rg

# 2. Re-deploy dashboard
.\scripts\deploy-azure-dashboard.ps1 -SubscriptionId "..." -ResourceGroup "..."

# 3. Verificar Application Insights
# Portal Azure → Application Insights → Usage and estimated costs
# Confirmar que há dados sendo ingeridos
```

---

## 📚 Recursos Adicionais

### **Documentação Oficial**

- [Azure Pipelines](https://docs.microsoft.com/azure/devops/pipelines)
- [Application Insights](https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview)
- [Azure Load Testing](https://docs.microsoft.com/azure/load-testing)
- [Azure Monitor](https://docs.microsoft.com/azure/azure-monitor)

### **Custos Estimados** (Por Mês)

| Serviço | Free Tier | Custo Estimado |
|---------|-----------|----------------|
| **Azure Pipelines** | 1800 min/mês | Grátis |
| **Application Insights** | 5 GB/mês | $5-10/mês |
| **Load Testing** | 50 VUh/mês | Grátis |
| **Azure Monitor** | 5 GB logs/mês | Grátis |
| **Storage** | 5 GB | $0.50/mês |
| **TOTAL** | - | **$5-15/mês** |

### **Scripts Úteis**

```bash
# Ver status de todos os recursos
az resource list \
  --resource-group assistente-juridico-rg \
  --output table

# Ver custos acumulados
az consumption usage list \
  --resource-group assistente-juridico-rg \
  --output table

# Exportar dashboard como JSON
az portal dashboard show \
  --name Assistente-Juridico-Agents-Dashboard \
  --resource-group assistente-juridico-rg \
  > dashboard-backup.json
```

---

## 🎯 Próximos Passos

1. ✅ **Migração concluída** - Azure Pipelines funcionando
2. ✅ **Monitoring ativo** - Application Insights coletando dados
3. ✅ **Load Testing configurado** - Testes de carga disponíveis
4. ✅ **Dashboards criados** - Visualização em tempo real

**Recomendações**:
- 📊 Monitorar dashboard diariamente
- 🧪 Executar load tests semanalmente
- 📈 Revisar alertas e ajustar thresholds
- 🔄 Iterar baseado em métricas reais

---

**Última Atualização**: 2024-01-XX  
**Versão**: 1.0  
**Autor**: DevOps Team
