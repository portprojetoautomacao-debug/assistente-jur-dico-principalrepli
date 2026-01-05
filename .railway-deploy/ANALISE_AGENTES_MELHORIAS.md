# 📊 Análise de Agentes IA - Identificação de Melhorias

## 🔴 Problemas Identificados

### 1. **Dados Simulados em Produção**

O código atual em `/src/lib/agents.ts` contém **dados completamente simulados** na função `processTaskWithAI`:

#### Exemplos de Simulações Encontradas:

```typescript
// ❌ Delays aleatórios simulando processamento
const processingTime = 1500 + Math.random() * 3000

// ❌ Números de processo falsos gerados aleatoriamente
processo: `${Math.floor(Math.random() * 9000000) + 1000000}-${Math.floor(Math.random() * 90) + 10}.2024.8.07.0001`

// ❌ Dados fictícios de intimações
const hasNewIntimations = Math.random() > 0.7

// ❌ Valores de confiança aleatórios
confidence: 0.92 + Math.random() * 0.08

// ❌ Petições com placeholders
${asString(task.data?.requerente) || '[REQUERENTE]'}
[Redigido automaticamente pela IA - Requer revisão humana]
[ADVOGADO(A)]
OAB/XX XXXXX

// ❌ Casos precedentes inventados
number: `REsp ${Math.floor(Math.random() * 2000000) + 1000000}/DF`

// ❌ Análises financeiras fictícias
totalBilled: (Math.random() * 50000 + 10000).toFixed(2)
```

### 2. **Falta de Integração Real**

Os agentes **NÃO estão conectados** aos serviços reais:
- ❌ Não consultam DJEN de verdade
- ❌ Não buscam DataJud real
- ❌ Não calculam prazos com APIs reais
- ❌ Não criam tarefas no Todoist
- ❌ Não enviam mensagens WhatsApp
- ❌ Apenas simulam tempos de processamento

### 3. **Arquitetura Inadequada para Produção**

- **Sem separação de responsabilidades**: Tudo misturado em um arquivo
- **Sem sistema de tools**: Não usa ferramentas modulares
- **Sem client LLM real**: O `/api/agents.ts` tenta usar Spark mas o `/src/lib/agents.ts` só simula
- **Sem registro de ações**: Logs inexistentes ou insuficientes
- **Sem tratamento de erro adequado**: Apenas retorna dados simulados

---

## ✅ Melhorias Propostas

### **Fase 1: Arquitetura Profissional (Baseada no Modelo)**

Implementar a arquitetura descrita no documento modelo:

```
lib/ai/
  ├── core-agent.ts          # Motor genérico de agentes
  ├── http-llm-client.ts     # Cliente LLM usando /api/llm-proxy
  ├── tools.ts               # Ferramentas reais (DJEN, Todoist, etc.)
  └── agents-registry.ts     # Registro dos 15 agentes

api/
  └── agents.ts              # Endpoint orquestrador
```

### **Fase 2: Implementação de Tools Reais**

Criar ferramentas que **realmente chamam APIs**:

#### ✅ Tools a Implementar:

1. **`buscarIntimacaoPendente`**
   - Conecta com `/api/djen/check`
   - Retorna intimações REAIS, não simuladas

2. **`criarTarefa`**
   - Conecta com `/api/todoist`
   - Cria tarefas REAIS no Todoist

3. **`calcularPrazos`**
   - Conecta com `/api/deadline/calculate`
   - Calcula prazos usando calendário jurídico REAL

4. **`consultarProcessoPJe`**
   - Conecta com `/api/serviços-legais`
   - Busca dados REAIS do processo

5. **`enviarMensagemWhatsApp`**
   - Conecta com Evolution API
   - Envia mensagens REAIS

6. **`registrarLogAgente`**
   - Conecta com `/api/kv`
   - Registra logs em Redis/Upstash

### **Fase 3: Remoção de Dados Simulados**

**Remover COMPLETAMENTE**:
- ❌ `Math.random()` para gerar dados
- ❌ Delays artificiais (`setTimeout`)
- ❌ Placeholders `[ADVOGADO]`, `[Cliente]`, `[REQUERENTE]`
- ❌ Números de processo inventados
- ❌ Jurisprudências fictícias
- ❌ Valores financeiros aleatórios

**Substituir por**:
- ✅ Chamadas HTTP reais para APIs
- ✅ Processamento assíncrono real com LLM
- ✅ Dados extraídos de fontes oficiais
- ✅ Erros reais quando APIs falharem

### **Fase 4: Sistema de Agentes Profissional**

#### 15 Agentes Definidos:

1. **Harvey Specter** - Análise estratégica e performance
2. **Mrs. Justin-e** - Análise de intimações e prazos
3. **Análise Documental** - Processamento 24/7 de expedientes
4. **Monitor DJEN** - Monitoramento automático de publicações
5. **Gestão de Prazos** - Cálculo e acompanhamento de prazos
6. **Redação de Petições** - Assistência em redação jurídica
7. **Organização de Arquivos** - Classificação de documentos
8. **Pesquisa Jurisprudencial** - Busca de precedentes
9. **Análise de Risco** - Avaliação de riscos processuais
10. **Revisão Contratual** - Análise de contratos
11. **Comunicação com Clientes** - Geração de comunicados
12. **Análise Financeira** - Monitoramento de faturamento
13. **Estratégia Processual** - Sugestões estratégicas
14. **Tradução Jurídica** - Simplificação de jargão
15. **Compliance** - Verificação regulatória

Cada um com:
- ✅ System prompt específico
- ✅ Tools permitidas (não todas)
- ✅ Nível de autonomia definido
- ✅ Modo de interação humana configurável

---

## 🎯 Plano de Implementação

### Etapa 1: Criar Núcleo (core-agent.ts)
- Motor genérico de agentes
- Sistema de memória (RAM → Redis)
- Loop de execução com tools
- Parsing de respostas JSON do LLM

### Etapa 2: Criar Client LLM (http-llm-client.ts)
- Cliente HTTP para `/api/llm-proxy`
- Suporte a autenticação
- Tratamento de erros
- Timeout e retry

### Etapa 3: Implementar Tools (tools.ts)
- 6 tools principais conectadas a APIs reais
- Context global com URLs e API keys
- Validação de parâmetros
- Logs de execução

### Etapa 4: Definir Agentes (agents-registry.ts)
- 15 agentes com personas claras
- System prompts específicos
- Permissões de tools por agente

### Etapa 5: Atualizar API Endpoint (api/agents.ts)
- Orquestração de todos os 15 agentes
- Suporte a execução via cron
- Suporte a chamadas do frontend
- Autenticação e autorização

### Etapa 6: Deprecar Código Antigo
- Marcar `/src/lib/agents.ts` como deprecated
- Migrar componentes frontend para nova API
- Remover dependências do código antigo

---

## 📋 Variáveis de Ambiente Necessárias

```bash
# LLM
LLM_PROXY_URL=https://assistente-juridico-github.vercel.app/api/llm-proxy

# Base da aplicação
APP_BASE_URL=https://assistente-juridico-github.vercel.app

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-evolution

# Redis/KV
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# APIs jurídicas
DJEN_API_KEY=...
DATAJUD_API_KEY=...
PJE_CREDENTIALS=...

# Todoist
TODOIST_API_TOKEN=...
```

---

## 🚀 Próximos Passos

1. ✅ **Criar estrutura de arquivos** (`lib/ai/`)
2. ✅ **Implementar core-agent.ts** (motor de agentes)
3. ✅ **Implementar http-llm-client.ts** (client para Spark)
4. ✅ **Implementar tools.ts** (ferramentas reais)
5. ✅ **Implementar agents-registry.ts** (15 agentes)
6. ✅ **Atualizar /api/agents.ts** (endpoint orquestrador)
7. ✅ **Testar integração** com APIs reais
8. ✅ **Remover código simulado** antigo
9. ✅ **Documentar deployment**

---

## ⚠️ Alertas Importantes

### Dados que DEVEM ser removidos:
- 🔴 Todos os `Math.random()`
- 🔴 Todos os `crypto.randomUUID()` para IDs fictícios
- 🔴 Placeholders `[TEXTO]`
- 🔴 Delays artificiais
- 🔴 Respostas hardcoded

### O que DEVE permanecer:
- ✅ Tipos TypeScript (interfaces)
- ✅ Funções auxiliares (getTaskDescription, etc.)
- ✅ Lógica de priorização de tarefas
- ✅ Sistema de filas

---

## 📊 Resumo Executivo

| Aspecto | Situação Atual | Após Melhorias |
|---------|----------------|----------------|
| **Integração com APIs** | ❌ Simulada | ✅ Real |
| **Dados** | ❌ Fictícios | ✅ Reais |
| **LLM** | ⚠️ Parcial | ✅ Completo |
| **Arquitetura** | ❌ Monolítica | ✅ Modular |
| **Tools** | ❌ Inexistentes | ✅ 6 tools funcionais |
| **Logs** | ❌ Insuficientes | ✅ Completos |
| **Produção** | ❌ Não pronto | ✅ Pronto |

---

**Status**: Aguardando aprovação para implementação 🚀
