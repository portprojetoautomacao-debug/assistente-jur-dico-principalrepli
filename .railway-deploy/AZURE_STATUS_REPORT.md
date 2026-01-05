# 📊 Relatório de Status - Azure Application Insights

**Data**: ${new Date().toISOString().split('T')[0]}  
**Projeto**: Assistente Jurídico PJe  
**Status Geral**: ⚠️ **Implementado mas NÃO Ativado**

---

## ✅ O QUE JÁ ESTÁ IMPLEMENTADO (100%)

### 1. Integração com Application Insights
- **Arquivo**: `src/lib/azure-insights.ts` (350+ linhas)
- **Funcionalidades**:
  - ✅ Tracking de agentes (trackAgentTask, trackAgentPerformance)
  - ✅ Tracking de APIs (trackAPICall, trackRedisCall)
  - ✅ Tracking de erros (trackError)
  - ✅ Tracking de usuário (identifyUser, trackUserAction)
  - ✅ Tracking de business metrics (intimações, minutas, prazos)
  - ✅ Performance tracking (startTimer, measurePerformance)

### 2. Scripts de Automação
- **Setup Completo**: `scripts/setup-azure-complete.ps1` (200+ linhas)
  - Cria Resource Group automaticamente
  - Cria Application Insights
  - Cria Load Testing resource
  - Configura .env.local
  - Deploy do dashboard
  - Validação completa
  
- **Validação**: `scripts/validate-azure-integration.js`
  - 20+ testes automatizados
  - Verifica arquivos de configuração
  - Valida variáveis de ambiente
  - Testa dependências npm
  - Valida Azure CLI
  - Checa recursos Azure

- **Deploy Dashboard**: `scripts/deploy-azure-dashboard.ps1`
  - Deploy automático do dashboard
  - 11 widgets pré-configurados
  - 3 alertas automáticos

### 3. Configuração de Pipeline
- **Azure Pipelines**: `azure-pipelines.yml` (400+ linhas)
  - 5 stages: Build, Security, Deploy, Post-Deploy, Monitoring
  - Testes E2E automatizados
  - SonarCloud integration
  - Deploy para Vercel
  - Health checks pós-deploy
  - Métricas de performance

### 4. Load Testing
- **Config**: `azure-load-testing.yaml`
  - 5 cenários de teste (Normal, Peak, Stress, Resilience, Soak)
  - Pass/fail criteria configurados
  - Métricas: Response time, Error rate, Throughput

### 5. Dashboard
- **Template**: `azure-dashboard-template.json`
  - 11 widgets configurados:
    - Tarefas Concluídas por Agente
    - Tempo Médio de Processamento
    - Taxa de Erro por Agente
    - Eventos dos Agentes (Tempo Real)
    - Status das Tarefas
    - Intimações Processadas
    - Minutas Geradas
    - Erros Recentes
    - Chamadas de API
    - Redis Operations
    - Performance Metrics

### 6. Documentação
- ✅ `docs/AZURE_MIGRATION_GUIDE.md` - Guia completo (600+ linhas)
- ✅ `docs/AZURE_QUICKSTART.md` - Setup em 5 minutos (200+ linhas)
- ✅ `docs/AZURE_CHECKLIST.md` - Checklist detalhado (400+ linhas)
- ✅ `docs/AZURE_TRAINING_GUIDE.md` - Guia de treinamento

---

## ⚠️ O QUE ESTÁ PENDENTE (Requer Ação Humana)

### 1. Azure CLI NÃO Instalado
**Problema**: Comando `az --version` falhou  
**Solução**:
```powershell
# Opção 1: Winget (recomendado)
winget install Microsoft.AzureCLI

# Opção 2: Chocolatey
choco install azure-cli

# Opção 3: Instalador direto
# Baixar: https://aka.ms/installazurecli
```

### 2. Arquivo .env.local NÃO Existe
**Problema**: Variável `VITE_AZURE_INSIGHTS_CONNECTION_STRING` não configurada  
**Solução**:
```bash
# 1. Copiar template
cp .env.example .env.local

# 2. Adicionar manualmente:
# VITE_AZURE_INSIGHTS_CONNECTION_STRING="InstrumentationKey=...;IngestionEndpoint=..."
```

### 3. Recursos Azure NÃO Criados
**Problema**: Resource Group, Application Insights não existem  
**Solução**:
```powershell
# 1. Login
az login

# 2. Obter Subscription ID
az account list --output table

# 3. Executar setup automático
cd scripts
.\setup-azure-complete.ps1 -SubscriptionId "SUA-SUBSCRIPTION-ID-AQUI"
```

### 4. Vercel NÃO Configurado
**Problema**: Variável de ambiente não adicionada no Vercel  
**Solução**:
```
1. Acessar: https://vercel.com/dashboard
2. Projeto: assistente-juridico-github
3. Settings → Environment Variables
4. Add New:
   - Nome: VITE_AZURE_INSIGHTS_CONNECTION_STRING
   - Valor: (copiar do output do script)
   - Environments: Production, Preview, Development
5. Salvar e Re-deploy
```

---

## 🚀 PASSO A PASSO PARA ATIVAR (15-20 minutos)

### **Passo 1: Instalar Azure CLI** (5 min)
```powershell
# Opção mais rápida (Winget)
winget install Microsoft.AzureCLI

# Fechar e reabrir terminal após instalação
```

### **Passo 2: Login no Azure** (2 min)
```powershell
# Faz login e abre navegador
az login

# Listar subscriptions disponíveis
az account list --output table

# Copiar o SubscriptionId da subscription desejada
```

### **Passo 3: Executar Setup Automático** (5 min)
```powershell
# Navegar para pasta de scripts
cd scripts

# Executar setup (substituir SUA-SUBSCRIPTION-ID)
.\setup-azure-complete.ps1 -SubscriptionId "SUA-SUBSCRIPTION-ID-AQUI"

# O script vai:
# ✅ Criar Resource Group
# ✅ Criar Application Insights
# ✅ Criar Load Testing resource
# ✅ Configurar .env.local
# ✅ Deploy do dashboard
# ✅ Executar validação
# ✅ Copiar Connection String para clipboard
```

### **Passo 4: Configurar no Vercel** (3 min)
```
1. Abrir: https://vercel.com/dashboard
2. Selecionar projeto: assistente-juridico-github
3. Settings → Environment Variables
4. Add New
5. Nome: VITE_AZURE_INSIGHTS_CONNECTION_STRING
6. Valor: CTRL+V (já copiado do passo 3)
7. Environments: Marcar todas (Production, Preview, Development)
8. Salvar
9. Redeploy (aguardar 2-3 min)
```

### **Passo 5: Validar Integração** (5 min)
```powershell
# Executar validação completa
npm run azure:validate

# Resultado esperado:
# ✅ Passaram: 18-20 testes
# ⚠️ Alguns avisos são normais (ex: Load Testing não disponível em todas regiões)
```

### **Passo 6: Verificar Dashboard** (2 min)
```
1. Abrir: https://portal.azure.com
2. Navegar: Application Insights → assistente-juridico-insights
3. Clicar em: Live Metrics
4. Aguardar 2-3 minutos
5. Verificar: Dados aparecendo em tempo real
```

---

## 📊 COMO VERIFICAR SE ESTÁ FUNCIONANDO

### 1. No Portal Azure
```
1. Acessar: https://portal.azure.com
2. Application Insights → assistente-juridico-insights
3. Live Metrics → Ver métricas em tempo real
4. Failures → Ver erros capturados
5. Performance → Ver chamadas de API
6. Usage → Ver usuários ativos
```

### 2. No Código
```typescript
// Em qualquer componente React
import { trackAgentTask } from '@/lib/azure-insights';

// Exemplo: Tracking de tarefa de agente
trackAgentTask('harvey', 'ANALYZE_DOCUMENT', 'COMPLETED', 1500);

// Verificar no Azure Portal após 1-2 minutos:
// Application Insights → Logs → Query:
// customEvents | where name == "Agent_TaskExecuted"
```

### 3. Dashboard Azure Monitor
```
1. Portal Azure → Dashboards
2. Selecionar: Assistente-Juridico-Agents-Dashboard
3. Verificar 11 widgets com dados em tempo real
```

---

## 🎯 BENEFÍCIOS APÓS ATIVAÇÃO

### **Monitoramento em Tempo Real**
- ✅ Rastrear performance de todos os 15 agentes IA
- ✅ Detectar erros automaticamente antes do usuário reportar
- ✅ Identificar gargalos de performance
- ✅ Monitorar uso de APIs externas (DJEN, DataJud, Google Calendar)

### **Alertas Automáticos**
- ✅ **HighErrorRate-Agents**: Taxa de erro >10% em 5 minutos
- ✅ **SlowAgentProcessing**: Tempo médio >5 segundos
- ✅ **CriticalExceptions-Agents**: >5 exceções em 5 minutos

### **Business Insights**
- ✅ Quantas intimações foram processadas hoje?
- ✅ Quantas minutas os agentes geraram esta semana?
- ✅ Qual agente é mais utilizado?
- ✅ Qual o tempo médio de resposta dos agentes?

### **DevOps Insights**
- ✅ Frequência de deployments
- ✅ Taxa de sucesso dos builds
- ✅ Tempo médio de recovery após falhas
- ✅ Performance de APIs (p50, p95, p99)

---

## 💰 CUSTOS ESTIMADOS

### **Free Tier (Recomendado para iniciar)**
- Application Insights: **5 GB/mês GRÁTIS**
- Load Testing: **50 VUh/mês GRÁTIS**
- Azure Monitor: **5 GB logs/mês GRÁTIS**
- Azure Pipelines: **1800 min/mês GRÁTIS**

### **Custo Real Estimado** (após Free Tier)
- Application Insights: $5-10/mês
- Load Testing: $0 (dentro do free tier)
- Storage: $0.50/mês
- **TOTAL: $5-15/mês** (muito provável ficar dentro do free tier)

---

## 📞 SUPORTE

### Em caso de problemas:

1. **Consultar troubleshooting**: `docs/AZURE_MIGRATION_GUIDE.md` (seção Troubleshooting)
2. **Executar validação**: `npm run azure:validate`
3. **Verificar logs**: Portal Azure → Application Insights → Logs

### Erros comuns:

**Erro: "Azure CLI não instalado"**
- Solução: Instalar via `winget install Microsoft.AzureCLI`

**Erro: "Subscription não encontrada"**
- Solução: Executar `az account set --subscription "SUBSCRIPTION-ID"`

**Erro: "Application Insights não recebe dados"**
- Solução: Verificar `VITE_AZURE_INSIGHTS_CONNECTION_STRING` em `.env.local` e no Vercel

**Erro: "Dashboard não carrega"**
- Solução: Re-executar `.\scripts\deploy-azure-dashboard.ps1`

---

## 📚 PRÓXIMOS PASSOS (APÓS ATIVAÇÃO)

### Curto Prazo (1 semana)
- [ ] Executar primeiro load test: `npm run azure:load-test`
- [ ] Configurar alertas para email/webhook
- [ ] Ajustar thresholds baseado em dados reais

### Médio Prazo (1 mês)
- [ ] Configurar Azure DevOps project
- [ ] Migrar CI/CD do GitHub Actions para Azure Pipelines
- [ ] Implementar Application Insights em todas as APIs

### Longo Prazo (3 meses)
- [ ] Auto-scaling baseado em métricas
- [ ] Dashboards customizados por equipe
- [ ] Integração com ferramentas de BI (Power BI)

---

**Status**: ⚠️ **Aguardando Ação Humana**  
**Tempo Estimado**: 15-20 minutos para ativação completa  
**Próxima Revisão**: Após executar Passo 1-6 acima

