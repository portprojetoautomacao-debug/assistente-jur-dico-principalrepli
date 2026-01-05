# 📚 Guia de Treinamento - Azure Monitor Dashboard

**Objetivo**: Capacitar a equipe para usar o dashboard Azure Monitor e responder a alertas.

---

## 👥 Para Quem é Este Guia

- **Desenvolvedores**: Monitorar performance e debugar problemas
- **DevOps**: Gerenciar infraestrutura e responder a alertas
- **Gestores**: Visualizar métricas de negócio e KPIs
- **Operadores**: Monitorar agentes IA em tempo real

---

## 🎯 Objetivos de Aprendizado

Ao final deste treinamento, você será capaz de:

1. ✅ Acessar e navegar pelo dashboard Azure Monitor
2. ✅ Interpretar todas as 11 métricas dos agentes
3. ✅ Identificar problemas de performance
4. ✅ Responder adequadamente a alertas
5. ✅ Executar queries customizadas no Log Analytics

---

## 📊 Seção 1: Navegando no Dashboard

### **Como Acessar**

1. **Portal Azure**:
   - URL: https://portal.azure.com
   - Login com credenciais Azure
   - Navegar: Dashboards → `Assistente-Juridico-Agents-Dashboard`

2. **Link Direto** (após deploy):
   ```
   https://portal.azure.com/#@/dashboard/arm/subscriptions/{subscription-id}/resourcegroups/assistente-juridico-rg/providers/Microsoft.Portal/dashboards/Assistente-Juridico-Agents-Dashboard
   ```

### **Layout do Dashboard**

O dashboard está organizado em 4 seções:

#### **Seção 1: Performance dos Agentes** (Linha 1)
- 📊 **Tarefas Concluídas** (esquerda)
- ⏱️ **Tempo Médio de Processamento** (direita)

#### **Seção 2: Erros e Atividade** (Linha 2)
- ❌ **Taxa de Erro** (esquerda)
- 📈 **Eventos Timeline** (direita)

#### **Seção 3: Métricas de Negócio** (Linha 3)
- ✅ **Status Tarefas** (esquerda)
- 📩 **Intimações Processadas** (centro)
- 📝 **Minutas Geradas** (direita)

#### **Seção 4: Diagnóstico** (Linhas 4-6)
- 🐛 **Erros Recentes** (linha 4)
- 🌐 **APIs Chamadas** (linha 5 esquerda)
- 💾 **Redis Operations** (linha 5 direita)
- ⚡ **Performance P50/P95/P99** (linha 6)

---

## 📈 Seção 2: Interpretando as Métricas

### **1. 📊 Tarefas Concluídas por Agente**

**O que mostra**: Total de tarefas processadas com sucesso por cada agente nas últimas 24h.

**Como interpretar**:
- ✅ **Normal**: Harvey (50-100), Mrs. Justin-e (30-80), Outros (10-50)
- ⚠️ **Atenção**: Agente com 0 tarefas (pode estar desabilitado)
- 🔴 **Problema**: Queda brusca (>50%) comparado ao dia anterior

**Ações**:
- Se agente está inativo: Verificar se foi desabilitado manualmente
- Se queda de performance: Investigar erros (widget "Erros Recentes")

### **2. ⏱️ Tempo Médio de Processamento**

**O que mostra**: Tempo médio (em milissegundos) que cada agente leva para processar uma tarefa.

**Como interpretar**:
- ✅ **Normal**: 500-2000ms
- ⚠️ **Atenção**: 2000-5000ms (lentidão moderada)
- 🔴 **Problema**: >5000ms (latência alta)

**Ações**:
- Tempo alto: Verificar se API externa está lenta (widget "APIs Chamadas")
- Tempo crescendo: Pode indicar memory leak ou problema de conexão

### **3. ❌ Taxa de Erro por Agente**

**O que mostra**: Porcentagem de tarefas que falharam.

**Como interpretar**:
- ✅ **Normal**: 0-2%
- ⚠️ **Atenção**: 2-10%
- 🔴 **Problema**: >10%

**Ações**:
- Taxa alta: Investigar "Erros Recentes" para identificar causa
- Erro recorrente: Pode indicar problema de configuração ou API externa

### **4. 📈 Eventos dos Agentes (Timeline)**

**O que mostra**: Atividade dos agentes ao longo do tempo (últimas 24h).

**Como interpretar**:
- ✅ **Normal**: Distribuição uniforme ao longo do dia
- ⚠️ **Atenção**: Picos irregulares (pode indicar sobrecarga pontual)
- 🔴 **Problema**: Longos períodos sem atividade (sistema parado)

**Ações**:
- Picos: Verificar se foi carga legítima (muitas intimações) ou problema
- Inatividade: Verificar health endpoints e logs de erro

### **5. ✅ Status das Tarefas**

**O que mostra**: Pizza chart com distribuição Concluídas vs Falhadas.

**Como interpretar**:
- ✅ **Normal**: 95-98% concluídas, 2-5% falhadas
- ⚠️ **Atenção**: 85-95% concluídas
- 🔴 **Problema**: <85% concluídas

**Ações**:
- Alta taxa de falha: Investigar erros e corrigir configurações

### **6. 📩 Intimações Processadas**

**O que mostra**: Volume de intimações processadas ao longo do tempo.

**Como interpretar**:
- ✅ **Normal**: Picos pela manhã (horário comercial tribunais)
- ⚠️ **Atenção**: Volume muito baixo ou muito alto

**Ações**:
- Volume baixo: Verificar se DJEN está funcionando
- Volume alto inesperado: Verificar se não é spam/dados duplicados

### **7. 📝 Minutas Geradas**

**O que mostra**: Volume de documentos criados pelos agentes.

**Como interpretar**:
- ✅ **Normal**: Proporcional às intimações (~70-80% das intimações)
- ⚠️ **Atenção**: Muito baixo (agentes não estão gerando minutas)

**Ações**:
- Volume baixo: Verificar agente de redação de petições

### **8. 🐛 Erros Recentes**

**O que mostra**: Últimos 50 erros registrados pelos agentes.

**Colunas**:
- **timestamp**: Quando ocorreu
- **agentId**: Qual agente gerou o erro
- **taskId**: ID da tarefa que falhou
- **message**: Mensagem de erro
- **details**: Detalhes técnicos

**Como usar**:
1. Identificar padrões (mesmo erro repetindo)
2. Verificar agentId para isolar problema
3. Ler details para entender causa raiz

### **9. 🌐 APIs Chamadas**

**O que mostra**: Top 10 APIs mais chamadas e tempo médio de resposta.

**Como interpretar**:
- ✅ **Normal**: Tempo médio <2s
- ⚠️ **Atenção**: Tempo médio 2-5s
- 🔴 **Problema**: Tempo médio >5s

**Ações**:
- API lenta: Verificar se é problema do provedor ou da rede
- Alta quantidade de chamadas: Verificar se há loop ou retry excessivo

### **10. 💾 Redis Operations**

**O que mostra**: Operações no cache Redis (Upstash).

**Colunas**:
- **name**: Tipo de operação (GET, SET, DEL)
- **Count**: Quantidade de vezes executada
- **AvgDuration**: Tempo médio (ms)
- **SuccessRate**: Taxa de sucesso (%)

**Como interpretar**:
- ✅ **Normal**: SuccessRate >99%, AvgDuration <100ms
- ⚠️ **Atenção**: SuccessRate 95-99%
- 🔴 **Problema**: SuccessRate <95% ou AvgDuration >500ms

**Ações**:
- Baixa success rate: Problemas de conexão com Upstash
- Alta latência: Pode indicar necessidade de upgrade do plano

### **11. ⚡ Performance P50/P95/P99**

**O que mostra**: Percentis de latência das operações críticas.

**O que são percentis**:
- **P50 (Mediana)**: 50% das operações são mais rápidas que este valor
- **P95**: 95% das operações são mais rápidas
- **P99**: 99% das operações são mais rápidas

**Como interpretar**:
- ✅ **Normal**: P50 <1s, P95 <3s, P99 <5s
- ⚠️ **Atenção**: P95 3-5s, P99 5-10s
- 🔴 **Problema**: P95 >5s, P99 >10s

**Ações**:
- P99 alto mas P95 OK: Alguns requests lentos ocasionais (aceitável)
- P95 alto: Problema sistêmico de performance

---

## 🚨 Seção 3: Respondendo a Alertas

### **Alertas Configurados**

#### **Alerta 1: HighErrorRate-Agents** (Severidade 2 - High)

**Condição**: Taxa de erro > 10%

**Quando dispara**: Mais de 10% das tarefas falharam em 5 minutos

**Como responder**:
1. **Investigar causa**:
   - Abrir dashboard → Widget "Erros Recentes"
   - Identificar mensagem de erro recorrente
   
2. **Verificar serviços dependentes**:
   - APIs externas funcionando?
   - Redis acessível?
   - Gemini API com quota disponível?

3. **Ações corretivas**:
   - Erro de API: Aguardar recuperação ou implementar fallback
   - Erro de configuração: Corrigir variável de ambiente
   - Erro de código: Deploy de hotfix

4. **Comunicar**:
   - Notificar equipe via Slack/Teams
   - Atualizar status page se necessário

#### **Alerta 2: SlowAgentProcessing** (Severidade 3 - Medium)

**Condição**: Tempo médio > 5 segundos

**Quando dispara**: Processamento lento por 10 minutos consecutivos

**Como responder**:
1. **Identificar gargalo**:
   - Widget "APIs Chamadas" → API lenta?
   - Widget "Redis Operations" → Cache lento?
   - Widget "Performance P95/P99" → Qual operação está lenta?

2. **Ações imediatas**:
   - Aumentar timeout se requests estão sendo cancelados prematuramente
   - Verificar se há degradação de serviço externo

3. **Ações de médio prazo**:
   - Implementar caching adicional
   - Otimizar queries
   - Considerar auto-scaling

#### **Alerta 3: CriticalExceptions-Agents** (Severidade 1 - Critical)

**Condição**: > 5 exceções em 5 minutos

**Quando dispara**: Múltiplas falhas críticas em curto período

**Como responder**:
1. **Ação imediata**:
   - Pausar agentes afetados se problema persiste
   - Verificar se deploy recente introduziu bug

2. **Investigar**:
   - Widget "Erros Recentes" → Stack traces
   - Logs do Vercel → Erros de runtime
   - Sentry (se configurado) → Detailed traces

3. **Comunicar urgência**:
   - Notificar on-call engineer
   - Escalar para tech lead se não resolver em 15min

---

## 🔍 Seção 4: Queries Customizadas

### **Acessar Log Analytics**

1. Portal Azure → Application Insights → Logs
2. Fechar tutorial (se aparecer)
3. Digitar query no editor

### **Queries Úteis**

#### **Query 1: Agentes Mais Ativos Hoje**

```kql
customEvents
| where timestamp > ago(1d)
| where name == "Agent_TaskExecuted"
| summarize Tasks = count() by AgentId = tostring(customDimensions.agentId)
| order by Tasks desc
| render barchart
```

#### **Query 2: Taxa de Erro por Hora**

```kql
customEvents
| where timestamp > ago(24h)
| where name == "Agent_TaskExecuted"
| summarize 
    Total = count(),
    Failed = countif(tostring(customDimensions.status) == "FAILED")
    by bin(timestamp, 1h)
| extend ErrorRate = (Failed * 100.0) / Total
| project timestamp, ErrorRate
| render timechart
```

#### **Query 3: Top 10 Erros Mais Frequentes**

```kql
exceptions
| where timestamp > ago(7d)
| where customDimensions.component == "useAutonomousAgents"
| summarize Count = count() by Message = outerMessage
| order by Count desc
| take 10
```

#### **Query 4: Latência por Tipo de Tarefa**

```kql
customMetrics
| where name startswith "Performance_"
| where timestamp > ago(1d)
| summarize 
    P50 = percentile(value, 50),
    P95 = percentile(value, 95),
    P99 = percentile(value, 99)
    by TaskType = name
| order by P95 desc
```

#### **Query 5: Minutas Geradas por Agente**

```kql
customEvents
| where timestamp > ago(7d)
| where name == "User_MinutaGenerated"
| summarize Count = count() by AgentId = tostring(customDimensions.agentId)
| order by Count desc
| render piechart
```

---

## 📋 Seção 5: Checklist de Monitoramento Diário

### **Manhã (9h)**

- [ ] Abrir dashboard Azure Monitor
- [ ] Verificar "Taxa de Erro" (deve estar <5%)
- [ ] Verificar "Tempo Médio" (deve estar <3s)
- [ ] Revisar "Erros Recentes" (últimas 12h)
- [ ] Verificar se há alertas ativos

### **Tarde (15h)**

- [ ] Verificar volume de "Intimações Processadas" (deve estar proporcional ao usual)
- [ ] Verificar "Minutas Geradas" (deve estar ~70-80% das intimações)
- [ ] Revisar performance P95/P99

### **Fim do Dia (18h)**

- [ ] Revisar resumo do dia (total tarefas, erros, performance)
- [ ] Documentar incidentes ocorridos
- [ ] Planejar correções para próximo dia

---

## 🎓 Exercícios Práticos

### **Exercício 1: Identificar Agente Lento**

1. Abrir dashboard
2. Widget "Tempo Médio de Processamento"
3. Identificar agente com tempo >5s
4. Executar query para ver detalhes:
   ```kql
   customMetrics
   | where name == "Agent_AverageProcessingTime"
   | where customDimensions.agentId == "ID_DO_AGENTE"
   | summarize avg(value) by bin(timestamp, 1h)
   | render timechart
   ```

### **Exercício 2: Investigar Erro Recorrente**

1. Widget "Erros Recentes"
2. Identificar erro que aparece >5 vezes
3. Copiar mensagem de erro
4. Executar query para ver contexto:
   ```kql
   exceptions
   | where outerMessage contains "MENSAGEM_DO_ERRO"
   | project timestamp, customDimensions, innermostMessage
   | take 10
   ```

### **Exercício 3: Comparar Performance Semanal**

1. Executar query:
   ```kql
   customMetrics
   | where name == "Performance_AgentTask_ANALYZE_DOCUMENT"
   | where timestamp > ago(7d)
   | summarize P95 = percentile(value, 95) by bin(timestamp, 1d)
   | render timechart
   ```
2. Identificar se houve degradação de performance
3. Se sim, correlacionar com deploys recentes

---

## 🚀 Próximos Passos

Após completar este treinamento:

1. **Praticar diariamente** usando o dashboard
2. **Criar alerts customizados** para suas necessidades
3. **Compartilhar insights** com a equipe
4. **Documentar problemas** e soluções encontradas
5. **Sugerir melhorias** no dashboard

---

## 📚 Recursos Adicionais

- **Documentação Azure Monitor**: https://docs.microsoft.com/azure/azure-monitor
- **Query Language (KQL)**: https://docs.microsoft.com/azure/data-explorer/kusto/query
- **Guia Completo de Migração**: `docs/AZURE_MIGRATION_GUIDE.md`
- **Application Insights Best Practices**: https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview

---

**Última Atualização**: 2024-01-XX  
**Versão**: 1.0  
**Duração do Treinamento**: 2-3 horas
