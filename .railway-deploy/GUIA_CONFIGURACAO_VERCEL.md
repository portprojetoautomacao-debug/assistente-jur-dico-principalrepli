# 🚀 Guia de Configuração - Agentes V2 no Vercel

## 📋 Visão Geral

Este guia mostra como configurar e usar os 15 agentes de IA no **Vercel Serverless** (sem servidor backend tradicional).

---

## 🏗️ Arquitetura Vercel Serverless

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL DEPLOYMENT                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────────┐                  ┌──────────────────┐
│  FRONTEND (SPA)  │                  │ API FUNCTIONS    │
│  React + Vite    │                  │  /api/*.ts       │
│                  │                  │                  │
│  • Dashboard     │◄─────────────────┤  • agents-v2.ts  │
│  • Chat UI       │   fetch()        │  • observability │
│  • Metrics       │                  │  • todoist.ts    │
└──────────────────┘                  │  • djen.ts       │
                                      └──────────────────┘
                                               │
                                               ▼
                                      ┌──────────────────┐
                                      │   CORE ENGINE    │
                                      │  lib/ai/*.ts     │
                                      │                  │
                                      │  • core-agent.ts │
                                      │  • orchestrator  │
                                      │  • tools.ts      │
                                      │  • registry.ts   │
                                      └──────────────────┘
```

**Características:**
- ✅ **Sem servidor backend** - Apenas Vercel Functions
- ✅ **Auto-scaling** - Vercel gerencia carga automaticamente
- ✅ **Deploy instantâneo** - `vercel --prod`
- ✅ **Edge Functions** - Baixa latência global

---

## 📁 Estrutura de Arquivos

```
assistente-juridico-p/
├── api/                          # ← Vercel Serverless Functions
│   ├── agents-v2.ts              # POST /api/agents-v2 (executa agentes)
│   ├── observability.ts          # GET /api/observability (circuit breakers)
│   ├── todoist.ts                # Integração Todoist
│   └── djen.ts                   # Buscar intimações DJEN
│
├── lib/ai/                       # ← Core Engine (usado pelas functions)
│   ├── agents-registry.ts        # ★ CONFIGURAÇÃO DOS 15 AGENTES
│   ├── core-agent.ts             # ReAct pattern
│   ├── agent-orchestrator.ts     # Orquestração multi-agente
│   ├── tools.ts                  # Ferramentas (buscarIntimacao, etc)
│   ├── circuit-breaker.ts        # Resiliência
│   └── orchestrator-examples.ts  # Workflows prontos
│
└── src/                          # ← Frontend React
    ├── components/
    │   └── AgentOrchestrationPanel.tsx  # UI V2
    └── hooks/
        └── use-real-agent-client.ts     # Chamadas para /api/agents-v2
```

---

## ⚙️ Passo 1: Configurar os 15 Agentes

**Arquivo:** `lib/ai/agents-registry.ts`

Este é o **único arquivo de configuração** que você precisa editar:

```typescript
export const AGENTS: Record<AgentId, AgentPersona> = {
  harvey: {
    id: "harvey",
    name: "Harvey Specter",
    description: "Assistente jurídico estratégico...",
    systemPrompt: `
Você é Harvey Specter, o estrategista-chefe do escritório.

RESPONSABILIDADES:
- Analisar visão macro do escritório
- Monitorar saúde financeira e performance
- Identificar riscos e oportunidades
- Fornecer recomendações executivas baseadas em dados REAIS

DIRETRIZES:
- SEMPRE use ferramentas para obter dados atualizados
- Combine dados objetivos com recomendações práticas
- Priorize ações de alto impacto

PROIBIDO:
- Inventar dados ou métricas
- Dar recomendações sem fundamento
    `.trim(),
    toolNames: [
      "consultarProcessoPJe",
      "calcularPrazos",
      "criarTarefa",
      "registrarLogAgente",
    ],
  },

  justine: {
    id: "justine",
    name: "Mrs. Justin-e",
    description: "Especialista em intimações e prazos",
    systemPrompt: `
Você é Mrs. Justin-e, a especialista em intimações.

FLUXO DE TRABALHO PADRÃO:
1. Buscar próxima intimação pendente (use buscarIntimacaoPendente)
2. Ler e interpretar o texto da intimação
3. Identificar prazo(s) legal(is)
4. Calcular data final do prazo (use calcularPrazos)
5. Criar tarefa no sistema (use criarTarefa)

DIRETRIZES:
- SEMPRE use as ferramentas para buscar dados reais
- Identifique corretamente o tipo de prazo
- Calcule prazos considerando dias úteis

PROIBIDO:
- Inventar intimações
- Calcular prazos manualmente
    `.trim(),
    toolNames: [
      "buscarIntimacaoPendente",
      "calcularPrazos",
      "criarTarefa",
      "enviarMensagemWhatsApp",
      "registrarLogAgente",
    ],
  },

  // ... outros 13 agentes
};
```

### 📝 Como Customizar um Agente

**Exemplo: Alterar o comportamento do agente "justine"**

1. Abra `lib/ai/agents-registry.ts`
2. Localize o agente `justine`
3. Edite o `systemPrompt` para mudar o comportamento
4. Adicione/remova `toolNames` conforme necessário

**Ferramentas disponíveis:**
- `buscarIntimacaoPendente` - Busca intimações do DJEN/PJe
- `criarTarefa` - Cria tarefa no Todoist
- `calcularPrazos` - Calcula prazos processuais
- `consultarProcessoPJe` - Consulta processo no PJe
- `enviarMensagemWhatsApp` - Envia mensagem via Evolution API
- `registrarLogAgente` - Registra logs de execução

---

## 🔄 Passo 2: Workflows (Orquestração)

Os workflows estão **prontos** em `lib/ai/orchestrator-examples.ts`.

### Workflow 1: Intimação (Sequential)

**Fluxo:**
```
Justin-e busca intimação
    ↓
Gestão-Prazos calcula deadline
    ↓
Justin-e cria tarefa no Todoist
```

**Como usar:**
```typescript
import { intimacaoWorkflow } from './lib/ai/orchestrator-examples';

const result = await intimacaoWorkflow({
  baseUrl: 'https://seu-app.vercel.app',
  evolutionApiUrl: process.env.EVOLUTION_API_URL!,
  evolutionApiKey: process.env.EVOLUTION_API_KEY!,
});

console.log(result.success); // true
console.log(result.traces);  // Timeline de execução
```

### Workflow 2: Análise Paralela

**Fluxo:**
```
┌─ Análise-Risco      ─┐
├─ Pesquisa-Juris     ─┤ → Resultado consolidado (3x mais rápido)
└─ Análise-Financeira ─┘
```

**Como usar:**
```typescript
import { caseAnalysisParallel } from './lib/ai/orchestrator-examples';

const result = await caseAnalysisParallel('CASO-123', context);
// Duração: ~3s (vs. 9s sequencial)
```

### Workflow 3: Hierárquico

**Fluxo:**
```
      Harvey (coordenador)
       /              \
Gestão-Prazos    Monitor-DJEN
```

**Como usar:**
```typescript
import { hierarchicalReview } from './lib/ai/orchestrator-examples';

const result = await hierarchicalReview(context);
```

### Workflow 4: Consenso

**Fluxo:**
```
Harvey analisa    → Voto: ALTO
Análise-Risco     → Voto: ALTO  → Consenso: RISCO ALTO
Pesquisa-Juris    → Voto: MÉDIO
```

**Como usar:**
```typescript
import { consensusDecisionWorkflow } from './lib/ai/orchestrator-examples';

const result = await consensusDecisionWorkflow('CASO-456', context);
```

---

## 🌐 Passo 3: API Endpoints (Vercel Functions)

### POST /api/agents-v2

**Executa um agente individual**

**Request:**
```bash
curl -X POST https://seu-app.vercel.app/api/agents-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "justine",
    "message": "Processar próxima intimação",
    "sessionId": "session-123"
  }'
```

**Response:**
```json
{
  "ok": true,
  "answer": "Encontrei 1 intimação pendente do processo 1234567-89.2024.8.07.0001. Prazo calculado: 15 dias úteis (vence em 10/12/2024). Tarefa criada no Todoist: #TASK-789",
  "traces": [
    {
      "type": "thought",
      "content": "Vou buscar intimações pendentes...",
      "timestamp": "2024-11-23T10:30:00Z"
    },
    {
      "type": "action",
      "content": "buscarIntimacaoPendente",
      "timestamp": "2024-11-23T10:30:01Z"
    },
    {
      "type": "observation",
      "content": "Encontrada intimação: Apresentar contestação em 15 dias",
      "timestamp": "2024-11-23T10:30:02Z"
    },
    {
      "type": "final",
      "content": "Tarefa criada com sucesso",
      "timestamp": "2024-11-23T10:30:05Z"
    }
  ],
  "totalDuration": "5200"
}
```

### GET /api/observability?action=circuit-breakers

**Monitora saúde das APIs**

**Request:**
```bash
curl https://seu-app.vercel.app/api/observability?action=circuit-breakers
```

**Response:**
```json
{
  "summary": {
    "total": 8,
    "healthy": 6,
    "degraded": 1,
    "down": 1
  },
  "services": [
    {
      "name": "djen-api",
      "status": "healthy",
      "failureRate": 0.02,
      "lastFailure": "2024-11-23T09:15:00Z"
    },
    {
      "name": "pje-api",
      "status": "down",
      "failureRate": 0.98,
      "lastFailure": "2024-11-23T10:25:00Z"
    }
  ]
}
```

---

## 🎨 Passo 4: Frontend (UI)

O componente `AgentOrchestrationPanel` já está integrado.

**Localização:** `src/components/AgentOrchestrationPanel.tsx`

**Como usar:**

1. Acesse a aba **"Orquestração V2"** no dashboard
2. Escolha um dos 15 agentes
3. Digite uma mensagem (ex: "Analisar intimações de hoje")
4. Clique em **"Executar"**
5. Veja os traces em tempo real na aba **"Traces"**

**Abas disponíveis:**
- **Agentes Disponíveis** - Execute agentes individualmente
- **Circuit Breakers** - Status das APIs em tempo real
- **Traces** - Timeline detalhada de execução (ReAct pattern)

---

## 🔐 Passo 5: Variáveis de Ambiente (Vercel)

Configure no **Vercel Dashboard → Settings → Environment Variables**:

```env
# LLM (Gemini)
GEMINI_API_KEY=your-gemini-key

# Todoist
TODOIST_API_TOKEN=your-todoist-token

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://your-evolution-instance.com
EVOLUTION_API_KEY=your-evolution-key

# Base URL (automático no Vercel)
VERCEL_URL=your-app.vercel.app
```

**Importante:**
- No Vercel, `process.env.VERCEL_URL` é setado automaticamente
- As functions em `/api` têm acesso às env vars
- Nunca commite credenciais no Git

---

## 🚀 Passo 6: Deploy no Vercel

### Opção 1: Deploy via CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy produção
vercel --prod
```

### Opção 2: Deploy via GitHub

1. Conecte o repositório no [Vercel Dashboard](https://vercel.com)
2. Selecione o repo `assistente-juridico-p`
3. Configure as env vars
4. Deploy automático a cada push

### Verificar Deploy

```bash
# Testar localmente primeiro
npm run dev

# Acessar
open http://localhost:5000

# Testar API
curl http://localhost:5000/api/agents-v2 \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"agentId":"harvey","message":"Analisar escritório"}'
```

---

## 📊 Passo 7: Monitoramento

### Circuit Breakers (Resiliência)

Os Circuit Breakers protegem contra falhas em APIs externas:

```typescript
// Automático em lib/ai/tools.ts
const breaker = CircuitBreakerRegistry.get('djen-api', {
  failureThreshold: 5,  // 5 falhas = OPEN
  timeout: 60000,       // 60s
});

await breaker.execute(async () => {
  // Chamada para API externa
  return await fetch('/api/djen/check');
});
```

**Estados:**
- **CLOSED** (verde) - API saudável, tudo normal
- **HALF_OPEN** (amarelo) - Testando recuperação
- **OPEN** (vermelho) - API fora, requisições bloqueadas

### Observabilidade

**Traces automáticos:**
```typescript
const result = await fetch('/api/agents-v2', {
  method: 'POST',
  body: JSON.stringify({
    agentId: 'justine',
    message: 'Processar intimações',
  }),
});

const { traces } = await result.json();

// Traces contém:
// - type: thought | action | observation | final
// - content: O que o agente pensou/fez
// - timestamp: Quando ocorreu
// - duration: Tempo de execução
```

---

## 🛠️ Troubleshooting

### Problema: "Agente não responde"

**Solução:**
1. Verifique se a API key do Gemini está configurada
2. Verifique logs no Vercel Dashboard → Functions
3. Teste localmente: `npm run dev`

### Problema: "Circuit Breaker OPEN"

**Solução:**
1. Acesse `/api/observability?action=circuit-breakers`
2. Identifique qual API está down
3. Verifique credenciais (Todoist, Evolution, etc)
4. Aguarde 60s para auto-recovery (HALF_OPEN)

### Problema: "Timeout na execução"

**Solução:**
1. Vercel Functions têm limite de 10s (Hobby) ou 60s (Pro)
2. Use workflows paralelos para reduzir tempo
3. Considere upgrade para Vercel Pro

---

## 📚 Recursos Adicionais

### Documentação Completa

- **ARQUITETURA_VISUAL.md** - Diagramas e fluxos
- **ORCHESTRATION_GUIDE.md** - Padrões de orquestração
- **AGENTES_V2_IMPLEMENTACAO_FINAL.md** - Detalhes técnicos
- **V2_INTEGRATION_GUIDE.md** - Integração frontend/backend

### Código de Exemplo

```typescript
// Executar workflow de intimação
import { intimacaoWorkflow } from './lib/ai/orchestrator-examples';

const context = {
  baseUrl: process.env.VERCEL_URL || 'http://localhost:5000',
  evolutionApiUrl: process.env.EVOLUTION_API_URL!,
  evolutionApiKey: process.env.EVOLUTION_API_KEY!,
};

const result = await intimacaoWorkflow(context);

if (result.success) {
  console.log('✅ Workflow concluído!');
  console.log(`Duração: ${result.totalDuration}ms`);
  console.log(`Tarefas: ${result.results.length}`);
} else {
  console.error('❌ Erro no workflow:', result.error);
}
```

---

## 🎯 Resumo

**Configuração em 3 passos:**

1. **Configurar agentes** → Edite `lib/ai/agents-registry.ts`
2. **Configurar env vars** → Vercel Dashboard → Settings
3. **Deploy** → `vercel --prod`

**Usar no app:**

1. Acesse a aba **"Orquestração V2"**
2. Escolha um agente
3. Execute e veja traces em tempo real

**Monitorar:**

- Circuit Breakers: `/api/observability?action=circuit-breakers`
- Traces: Veja na aba "Traces" do painel
- Logs: Vercel Dashboard → Functions

---

**Status:** ✅ Tudo pronto para produção!

- 15 agentes configurados
- 4 padrões de orquestração
- Circuit Breakers ativos
- Observabilidade completa
- Deploy Vercel otimizado

🚀 **Próximo passo:** `vercel --prod` e comece a usar!
