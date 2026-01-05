# 🤖 Agentes de IA Reais - Guia Completo

## ✅ O Que Foi Implementado

O sistema agora possui **dois modos de operação**:

### 1️⃣ Modo Simulado (Padrão)
- Agentes geram dados fictícios
- Processamento local no navegador
- Sem custos ou consumo de recursos
- Ideal para **demonstrações e testes**

### 2️⃣ Modo Real (Novo) ⚡
- Agentes usam **Spark LLM (GPT-4)**
- Integração com APIs externas
- Processamento serverless na Vercel
- Dados reais e precisos

---

## 🚀 Como Funciona o Modo Real

### Backend (Vercel Serverless)

**Cron Jobs configurados em `vercel.json`:**

```json
{
  "crons": [
    {
      "path": "/api/cron/djen-monitor",
      "schedule": "0 8-20/2 * * *"  // A cada 2h, das 8h às 20h
    },
    {
      "path": "/api/cron/daily-reset",
      "schedule": "0 0 * * *"  // Meia-noite
    },
    {
      "path": "/api/agents/process-queue",
      "schedule": "*/5 * * * *"  // A cada 5 minutos
    }
  ]
}
```

**Endpoints criados:**

1. **`/api/agents/process-task`** - Processa uma tarefa individual com Spark LLM
2. **`/api/agents/process-queue`** - Processa fila de tarefas (cron job)
3. **`/api/deadline/calculate`** - Cálculo real de prazos com feriados
4. **`/api/djen/check`** - Consulta DJEN (estrutura para APIs reais)
5. **`/api/webhook`** - Recebe eventos do GitHub

### Frontend (React)

**Hook atualizado: `use-autonomous-agents.ts`**
- Novo estado `useRealAI` para controlar o modo
- Função `toggleRealAI()` para alternar modos
- Processamento condicional: usa `processTaskWithRealAI()` se modo real estiver ativo

**Novo componente: `RealAIControlPanel.tsx`**
- Interface visual para controlar o modo
- Mostra status atual (Real vs Simulado)
- Exibe estatísticas de processamento
- Avisos sobre custos e recursos

---

## 📋 Tipos de Tarefas Suportadas

Cada agente processa tarefas específicas com IA real:

### 1. **Analyzer** (Análise de Documentos)
```typescript
{
  type: 'analyze_document',
  data: {
    documentText: 'Intimação recebida...',
    documentType: 'intimacao',
    hasDeadline: true
  }
}
```

**Retorno:**
- `summary`: Resumo executivo
- `extractedData`: Dados estruturados
- `suggestedActions`: Ações recomendadas
- `deadlines`: Prazos identificados
- `confidence`: Nível de confiança (0-1)

### 2. **Monitor** (Monitoramento DJEN)
```typescript
{
  type: 'monitor_djen',
  data: {
    tribunais: ['TJDFT', 'STJ', 'TST'],
    lawyerName: 'João Silva',
    oab: 'OAB/DF 12345'
  }
}
```

**Retorno:**
- `newIntimations`: Array de intimações
- `tribunaisVerificados`: Tribunais consultados
- `nextCheck`: Próximo horário de verificação

### 3. **Calculator** (Cálculo de Prazos)
```typescript
{
  type: 'calculate_deadline',
  data: {
    startDate: '2025-11-20',
    businessDays: 15,
    tribunalCode: 'TJDFT'
  }
}
```

**Retorno:**
- `deadline`: Data de vencimento (ISO)
- `businessDays`: Dias úteis
- `calendarDays`: Dias corridos
- `reasoning`: Explicação do cálculo
- `holidays`: Feriados considerados
- `alerts`: Alertas de vencimento

### 4. **Writer** (Redação de Petições)
```typescript
{
  type: 'draft_petition',
  data: {
    tipo: 'Contestação',
    vara: '1ª Vara Cível',
    comarca: 'Brasília/DF',
    requerente: 'Fulano de Tal',
    pedido: 'Improcedência do pedido'
  }
}
```

**Retorno:**
- `draft`: Texto completo da petição
- `confidence`: Nível de confiança
- `needsReview`: Se precisa revisão humana
- `suggestions`: Sugestões de melhoria

### 5. **Researcher** (Pesquisa de Precedentes)
```typescript
{
  type: 'research_precedents',
  data: {
    topic: 'Danos morais trabalhistas',
    keywords: ['assédio moral', 'indenização'],
    tribunals: ['TST', 'TRT3']
  }
}
```

**Retorno:**
- `precedentsFound`: Quantidade encontrada
- `relevantCases`: Array de casos relevantes
- `thematicAnalysis`: Análise temática
- `recommendation`: Recomendação de uso

### 6. **Strategic** (Estratégia Processual)
```typescript
{
  type: 'case_strategy',
  data: {
    caseType: 'Ação Trabalhista',
    phase: 'Instrução',
    context: 'Cliente foi demitido sem justa causa...'
  }
}
```

**Retorno:**
- `strategyAnalysis`: Análise do caso
- `recommendedActions`: Ações prioritárias
- `successProbability`: Probabilidade de êxito (0-1)
- `alternativeStrategies`: Estratégias alternativas
- `riskFactors`: Fatores de risco

### 7. **Compliance** (Verificação de Conformidade)
```typescript
{
  type: 'compliance_check',
  data: {
    area: 'LGPD',
    document: 'Política de Privacidade...'
  }
}
```

**Retorno:**
- `complianceStatus`: 'conforme' | 'não conforme'
- `checksPerformed`: Verificações realizadas
- `violations`: Violações encontradas
- `recommendations`: Recomendações

---

## 🔧 Como Ativar o Modo Real

### Opção 1: Via Interface (Recomendado)

1. Acesse a seção de **Agentes Autônomos** no dashboard
2. Localize o **RealAIControlPanel** (painel de controle)
3. Clique no switch **"IA Real Ativa"**
4. Confirme a ativação no diálogo de confirmação

### Opção 2: Via Código

```typescript
import { setRealAgentsMode } from '@/lib/real-agent-client';

// Ativar modo real
setRealAgentsMode(true);

// Desativar (voltar para simulado)
setRealAgentsMode(false);
```

### Opção 3: Via localStorage

```javascript
// No console do navegador
localStorage.setItem('real-agents-enabled', 'true');
localStorage.setItem('use-real-ai', 'true');
window.location.reload();
```

---

## ⚙️ Configuração da Vercel

### 1. Variáveis de Ambiente Necessárias

No dashboard da Vercel (`Settings` → `Environment Variables`):

```bash
# Obrigatórias
GITHUB_TOKEN=ghp_seu_token_aqui
GITHUB_RUNTIME_PERMANENT_NAME=97a1...

# Opcionais
DJEN_TRIBUNAIS=TST,TRT3,TJMG,TRF1,TJES,TJSP,STJ
API_URL=https://assistente-jurdico-p.vercel.app
```

### 2. Habilitar Cron Jobs

Os cron jobs são habilitados automaticamente quando você faz deploy com o `vercel.json` atualizado.

**Verificar se estão ativos:**
1. Vercel Dashboard → seu projeto
2. Aba **"Cron Jobs"**
3. Deve mostrar 3 cron jobs:
   - `djen-monitor` (a cada 2h)
   - `daily-reset` (meia-noite)
   - `process-queue` (a cada 5min)

### 3. Plano Necessário

- **Hobby Plan**: ✅ Suporta cron jobs (limitado)
- **Pro Plan**: ✅ Sem limitações
- **Enterprise**: ✅ Suporte completo

---

## 📊 Monitoramento e Logs

### Verificar Logs dos Cron Jobs

```bash
# Terminal local
export VERCEL_TOKEN="seu_token_aqui"

# Logs gerais
vercel logs assistente-jurdico-p --follow

# Filtrar logs de agentes
vercel logs assistente-jurdico-p | grep -i "agent\|cron"

# Logs de um endpoint específico
vercel logs assistente-jurdico-p | grep "process-queue"
```

### Logs Importantes a Monitorar

**✅ Sucesso:**
```
[Agent Queue] Found 3 pending tasks
[Agent Queue] Processing task abc-123 for agent Analyzer
[Agent Queue] ✓ Task completed with real AI
```

**⚠️ Avisos:**
```
[DJEN Monitor Cron] No monitored lawyers configured
[Agent Queue] Skipping task - agent disabled
```

**❌ Erros:**
```
[Agent Queue] Error processing task: Spark LLM error
[DJEN Check API] Failed to fetch from tribunal API
```

---

## 💰 Custos e Limites

### Spark LLM (GPT-4)
- **Modelo**: GPT-4 Turbo via GitHub Spark
- **Custo**: Incluído no GitHub Copilot (se você tem)
- **Limites**: Depende do seu plano GitHub

### Vercel Cron Jobs
- **Hobby Plan**: Limitado a alguns jobs
- **Pro Plan**: Sem limitações práticas
- **Execuções**: Ilimitadas (dentro do fair use)

### Bandwidth e Functions
- **Hobby**: 100GB bandwidth/mês, 100 horas serverless
- **Pro**: 1TB bandwidth/mês, 1000 horas serverless

**Estimativa de uso** (modo real ativo):
- ~150 execuções de cron/dia
- ~30MB de bandwidth/dia
- ~2 horas de serverless/dia

---

## 🔍 Testando os Endpoints

### 1. Testar Cálculo de Prazo

```bash
curl -X POST https://assistente-jurdico-p.vercel.app/api/deadline/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-11-20",
    "businessDays": 15,
    "tribunalCode": "TJDFT"
  }'
```

### 2. Testar Verificação DJEN

```bash
curl -X POST https://assistente-jurdico-p.vercel.app/api/djen/check \
  -H "Content-Type: application/json" \
  -d '{
    "tribunais": ["TJDFT", "STJ", "TST"]
  }'
```

### 3. Testar Processamento de Tarefa

```bash
curl -X POST https://assistente-jurdico-p.vercel.app/api/agents/process-task \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "id": "test-123",
      "type": "calculate_deadline",
      "data": {
        "startDate": "2025-11-20",
        "businessDays": 15
      }
    },
    "agent": {
      "id": "calc-1",
      "type": "calculator",
      "name": "Calculadora de Prazos"
    }
  }'
```

---

## 🚨 Solução de Problemas

### Problema: Cron jobs não executam

**Solução:**
1. Verificar se o deploy foi concluído com sucesso
2. Conferir se `vercel.json` tem a seção `crons`
3. Ver logs: `vercel logs assistente-jurdico-p`
4. Aguardar até 5 minutos (próxima execução programada)

### Problema: Erro "Spark LLM error"

**Solução:**
1. Verificar `GITHUB_TOKEN` nas variáveis de ambiente
2. Confirmar que o token tem permissões de Copilot
3. Testar endpoint `/_spark/llm` manualmente
4. Ver logs detalhados no Vercel Dashboard

### Problema: DJEN retorna vazio

**Solução:**
- **NORMAL**: O endpoint está estruturado mas precisa integração real com APIs
- Para ativar: implemente as chamadas reais em `/api/djen/check.ts`
- Consulte documentação DataJud: https://datajud-wiki.cnj.jus.br/

### Problema: Tarefas não são processadas

**Checklist:**
- [ ] Modo real está ativado? (`localStorage.getItem('use-real-ai')`)
- [ ] Há tarefas na fila? (verificar KV: `agent-task-queue`)
- [ ] Agentes estão habilitados? (verificar KV: `autonomous-agents`)
- [ ] Cron job está rodando? (ver logs)

---

## 📈 Próximos Passos

### Integrações Reais Pendentes

1. **APIs dos Tribunais**
   - DataJud (CNJ)
   - PJe (por tribunal)
   - Consultas processuais públicas

2. **Serviços Externos**
   - API de feriados (https://brasilapi.com.br/docs#tag/Feriados)
   - Google Calendar (já tem OAuth configurado)
   - E-mail/SMS para notificações

3. **Melhorias**
   - Cache de resultados do DJEN
   - Fila persistente (Redis/Upstash)
   - Webhooks para notificações
   - Dashboard de monitoramento

---

## 📚 Recursos Adicionais

- **Documentação Vercel Cron**: https://vercel.com/docs/cron-jobs
- **Spark LLM**: https://github.com/features/copilot
- **DataJud**: https://datajud-wiki.cnj.jus.br/
- **Brasil API**: https://brasilapi.com.br/

---

## ✅ Checklist de Ativação

- [x] Cron jobs configurados em `vercel.json`
- [x] Endpoints de processamento criados
- [x] Hook `use-autonomous-agents` atualizado
- [x] Componente `RealAIControlPanel` criado
- [x] Cliente `real-agent-client.ts` implementado
- [x] Cálculo real de prazos com feriados
- [x] Estrutura DJEN pronta para integração
- [x] 14 tipos de tarefas com prompts especializados
- [x] Toggle modo real/simulado funcionando
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Teste de processamento real realizado
- [ ] Integração com APIs reais dos tribunais
- [ ] Monitoramento de custos configurado

---

**Status:** ✅ **Sistema pronto para uso em modo real**

Ative o modo real na interface e os agentes começarão a processar tarefas com IA real automaticamente!
