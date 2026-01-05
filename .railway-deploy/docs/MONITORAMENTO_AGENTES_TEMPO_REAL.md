# 🧠 Sistema de Monitoramento em Tempo Real dos Agentes IA

## 📊 Visão Geral

O sistema agora possui **visibilidade completa** do "pensamento" e atividades de cada agente IA em tempo real. Você pode ver exatamente:

- 📝 **Qual petição** está sendo redigida
- ⚖️ **Para qual processo** o agente está trabalhando
- 🔍 **Que prazo** está calculando
- 💭 **O que o agente está "pensando"** em cada etapa
- ⏱️ **Progresso** e tempo de processamento
- 📊 **Tokens** utilizados e estimativas

## 🎯 Como Acessar

### No Painel Web

1. Acesse: `https://assistente-juridico-github.vercel.app/`
2. Vá para **"Agentes IA"** no menu lateral
3. Clique na aba **"Atividade em Tempo Real"**
4. Você verá dois painéis:
   - **Pensamento em Tempo Real** (novo!) - Tarefas em andamento agora
   - **Registro de Atividades** - Histórico de tarefas concluídas

### API Endpoints

#### 1. Ver Pensamento dos Agentes

```bash
# Ver todas as tarefas ativas
GET https://assistente-juridico-github.vercel.app/api/agent-thinking

# Ver pensamento de uma tarefa específica
GET https://assistente-juridico-github.vercel.app/api/agent-thinking?taskId=abc123
```

**Resposta:**
```json
{
  "activeTasks": [
    {
      "taskId": "task-123",
      "agentId": "redacao-peticoes",
      "agentName": "Redação de Petições",
      "taskType": "DRAFT_PETITION",
      "status": "in_progress",
      "priority": "high",
      "data": {
        "processNumber": "1234567-89.2024.5.02.0999",
        "petitionType": "Contestação"
      },
      "thinking": [
        {
          "stage": "INICIANDO",
          "details": {
            "processo": "1234567-89.2024.5.02.0999",
            "tipoPeticao": "Contestação",
            "partes": "Empresa XYZ vs João Silva"
          }
        },
        {
          "stage": "ANALISANDO",
          "details": {
            "promptSize": "2500 caracteres",
            "estimativaTokens": 625
          }
        }
      ],
      "currentStage": "ANALISANDO",
      "thinkingCount": 2
    }
  ]
}
```

#### 2. Diagnóstico da Fila de Agentes

```bash
GET https://assistente-juridico-github.vercel.app/api/debug-agent-queue
```

**Resposta:**
```json
{
  "summary": {
    "totalInQueue": 10,
    "pending": 8,
    "queued": 0,
    "processing": 2,
    "failed": 0,
    "totalCompleted": 145,
    "estimatedProcessingTime": "30 minutos (2 batches de 10 tarefas)"
  },
  "breakdown": {
    "byStatus": {
      "pending": 8,
      "in_progress": 2
    },
    "byAgent": {
      "redacao-peticoes": 3,
      "gestao-prazos": 2,
      "analise-risco": 5
    },
    "byType": {
      "DRAFT_PETITION": 3,
      "CALCULATE_DEADLINE": 2,
      "RISK_ANALYSIS": 5
    }
  },
  "oldestTasks": [
    {
      "id": "task-abc",
      "agentId": "redacao-peticoes",
      "type": "DRAFT_PETITION",
      "createdAt": "2025-12-03T23:00:00Z",
      "ageMinutes": 45
    }
  ]
}
```

## 📝 Etapas de Processamento

Cada tarefa passa por 5 etapas monitoradas:

### 1. 🚀 INICIANDO
**O que acontece:**
- Agente recebe a tarefa
- Identifica processo, prioridade, tipo
- Extrai dados específicos (petição, prazo, etc.)

**Exemplo de log:**
```json
{
  "stage": "INICIANDO",
  "details": {
    "descricao": "Redigir contestação para processo trabalhista",
    "processo": "1234567-89.2024.5.02.0999",
    "prioridade": "high",
    "tipoPeticao": "Contestação",
    "partes": "Empresa XYZ vs João Silva"
  }
}
```

### 2. 📚 CONTEXTO_RECUPERADO
**O que acontece:**
- Busca na memória jurídica (precedentes, jurisprudência)
- Carrega contexto relevante para a tarefa

**Exemplo de log:**
```json
{
  "stage": "CONTEXTO_RECUPERADO",
  "details": {
    "memoriaItens": "Contexto jurídico carregado (5 itens)"
  }
}
```

### 3. 🔍 ANALISANDO
**O que acontece:**
- Prepara prompt para o Gemini AI
- Estima tokens necessários
- Envia para processamento

**Exemplo de log:**
```json
{
  "stage": "ANALISANDO",
  "details": {
    "promptSize": "2500 caracteres",
    "taskType": "DRAFT_PETITION",
    "agentRole": "Redação de Petições",
    "estimativaTokens": 625
  }
}
```

### 4. ✍️ RESPOSTA_GERADA
**O que acontece:**
- Recebe resposta do Gemini AI
- Valida e parseia o resultado

**Exemplo de log:**
```json
{
  "stage": "RESPOSTA_GERADA",
  "details": {
    "preview": "EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA 2ª VARA DO TRABALHO...",
    "tokensUsados": 1250
  }
}
```

### 5. ✅ CONCLUÍDO
**O que acontece:**
- Salva resultado na memória jurídica
- Marca tarefa como concluída
- Registra métricas

**Exemplo de log:**
```json
{
  "stage": "CONCLUÍDO",
  "details": {
    "resultado": "Petição de contestação redigida com sucesso",
    "tempoProcessamento": "3500ms",
    "proximasAcoes": "Revisar e protocolar"
  }
}
```

## 🔍 Detalhes Específicos por Tipo de Tarefa

### DRAFT_PETITION (Redigir Petição)
```json
{
  "tipoPeticao": "Contestação",
  "partes": "Empresa XYZ vs João Silva",
  "processo": "1234567-89.2024.5.02.0999"
}
```

### CALCULATE_DEADLINE (Calcular Prazo)
```json
{
  "dataPublicacao": "2025-12-03",
  "diasPrazo": 15,
  "processo": "1234567-89.2024.5.02.0999"
}
```

### ANALYZE_INTIMATION (Analisar Intimação)
```json
{
  "tribunal": "TRT-2",
  "instancia": "1ª Instância",
  "processo": "1234567-89.2024.5.02.0999"
}
```

## 📊 Painel de Pensamento em Tempo Real

O novo componente `AgentThinkingPanel` mostra:

### Informações Exibidas
- ✅ Nome do agente
- ✅ Tipo de tarefa (ícone + label)
- ✅ Processo vinculado
- ✅ Estágio atual (com emoji)
- ✅ Badge de prioridade (se urgente)
- ✅ Detalhes específicos da tarefa
- ✅ Preview da resposta (quando disponível)
- ✅ Tokens usados
- ✅ Tempo de processamento
- ✅ Timeline de etapas concluídas

### Atualização Automática
- **Polling**: A cada 3 segundos
- **Sem reload**: Atualiza apenas os dados necessários
- **Performance**: Mostra apenas tarefas ativas (em processamento)

## 🔧 Integração com Sistema Existente

### Como os Logs São Salvos

1. **Durante processamento** (`api/agents.ts`):
   ```typescript
   await logAgentThinking(task, agent, 'INICIANDO', {
     descricao: task.data?.description,
     processo: task.data?.processNumber
   });
   ```

2. **Armazenamento no Redis** (Upstash KV):
   - `agent-thinking-logs` - Histórico geral (últimos 500)
   - `task-thinking:{taskId}` - Logs de tarefa específica (expira em 1h)

3. **Consumo no frontend**:
   ```typescript
   const response = await fetch('/api/agent-thinking');
   const data = await response.json();
   // Exibe no AgentThinkingPanel
   ```

## 📈 Benefícios

### Para Operadores Humanos
- ✅ **Transparência total** - Saber exatamente o que cada agente está fazendo
- ✅ **Detecção de problemas** - Ver se algum agente está travado
- ✅ **Acompanhamento de progresso** - Quantos tokens, quanto tempo
- ✅ **Validação de qualidade** - Preview das respostas geradas

### Para Debugging
- ✅ **Logs estruturados** - JSON com dados específicos por tipo
- ✅ **Timeline completa** - Ver todas as etapas de processamento
- ✅ **Diagnóstico de fila** - Saber se há gargalos
- ✅ **Métricas em tempo real** - Tokens, tempo, throughput

### Para Auditoria
- ✅ **Rastreabilidade** - Cada ação registrada com timestamp
- ✅ **Histórico preservado** - Últimos 500 pensamentos salvos
- ✅ **Dados estruturados** - Fácil de exportar e analisar
- ✅ **Conformidade** - Registro completo para compliance

## 🚀 Próximos Passos

Para expandir o sistema de monitoramento:

1. **Webhooks**: Notificar quando tarefa concluir
2. **Métricas agregadas**: Dashboard com estatísticas
3. **Alertas**: Avisar se agente travar por mais de 5 minutos
4. **Export**: Baixar logs em CSV/JSON
5. **Filtros**: Filtrar por agente, tipo, processo
6. **Streaming real-time**: WebSocket em vez de polling

## 🔒 Segurança e Performance

### Segurança
- ✅ Logs não contêm dados sensíveis (senhas, chaves)
- ✅ Preview limitado a 200 caracteres
- ✅ Expiração automática de logs de tarefa (1h)

### Performance
- ✅ Polling otimizado (3s)
- ✅ Histórico limitado (500 itens)
- ✅ Consultas eficientes no Redis
- ✅ Paginação automática no painel

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs no painel "Logs do Servidor"
2. Acesse `/api/debug-agent-queue` para diagnóstico
3. Verifique Vercel logs para erros backend

---

**Deploy em produção**: ✅ Disponível em https://assistente-juridico-github.vercel.app/
