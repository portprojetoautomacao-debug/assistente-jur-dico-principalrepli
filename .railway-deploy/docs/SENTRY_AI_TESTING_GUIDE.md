# 🧪 Guia de Teste - Sentry AI Agents Monitoring v2

## 📋 Visão Geral

Guia prático para validar a instrumentação do **Harvey Specter** com Sentry AI Agents Monitoring v2.

---

## ✅ Fase 1: Harvey Specter - Instrumentação Completa

### 🔧 Alterações Implementadas

#### 1. Hook `useAIStreaming` (`src/hooks/use-ai-streaming.ts`)

**Instrumentação adicionada:**

```typescript
import { createChatSpan } from "@/lib/sentry-gemini-integration-v2";

interface UseAIStreamingOptions {
  // ... opções existentes
  agentId?: string; // 🆕 ID do agente (ex: "harvey-specter")
  sessionId?: string; // 🆕 ID único da sessão
  conversationTurn?: number; // 🆕 Contador de turnos
}
```

**Span criado:**

```typescript
await createChatSpan(
  {
    agentName: agentId,
    system: "gemini",
    model,
    temperature,
    maxTokens,
  },
  messages,
  async (span) => {
    // Atributos de conversação
    span?.setAttribute("conversation.session_id", sessionId);
    span?.setAttribute("conversation.turn", conversationTurn);

    // Fazer chamada LLM
    const result = await fetch("/api/llm-stream", { ... });

    // Adicionar resposta
    span?.setAttribute("gen_ai.response.text", JSON.stringify([result]));

    return result;
  }
);
```

#### 2. Componente `HarveySpecterChat` (`src/components/HarveySpecterChat.tsx`)

**Tracking de conversação adicionado:**

```typescript
const [sessionId] = useState(`harvey-${Date.now()}`); // 🆕 Session ID único
const [conversationTurn, setConversationTurn] = useState(0); // 🆕 Contador

const { streamChat } = useAIStreaming({
  agentId: "harvey-specter", // 🆕 ID do agente
  sessionId, // 🆕 Passar sessionId
  conversationTurn, // 🆕 Passar turno atual
  // ... outras opções
});

// Incrementar turno após cada mensagem
setConversationTurn((prev) => prev + 1);
```

---

## 🧪 Como Testar

### 1️⃣ Pré-requisitos

#### Verificar configuração do Sentry

```bash
# Verificar se SENTRY_DSN está configurado
echo $SENTRY_DSN
# Ou no .env
grep SENTRY_DSN .env
```

**Esperado:**

```
SENTRY_DSN=https://...@sentry.io/...
```

#### Verificar se Sentry está inicializado

Abra `src/main.tsx` e confirme:

```typescript
Sentry.init({
  dsn: config.sentryDsn,
  integrations: [
    // ... outras integrações
  ],
  tracesSampleRate: 1.0, // 100% de traces capturados
});
```

### 2️⃣ Executar App em Dev

```bash
npm run dev
```

**Acessar:** http://localhost:5173

### 3️⃣ Abrir Harvey Specter Chat

1. No dashboard, clicar no avatar do **Harvey Specter** (canto superior direito)
2. Ou navegar para a aba "Assistente Jurídico"

### 4️⃣ Enviar Mensagens de Teste

#### Teste 1: Mensagem Simples

**Input:**

```
Olá Harvey, quais são os processos mais urgentes?
```

**Esperado:**

- Harvey responde com estatísticas reais
- Streaming funciona normalmente
- Sem erros no console

#### Teste 2: Perguntas sobre Prazos

**Input:**

```
Quais prazos vencem nos próximos 7 dias?
```

**Esperado:**

- Harvey responde com lista de prazos
- Insights clicáveis aparecem (se houver prazos)

#### Teste 3: Conversação Multi-turn

**Inputs (sequenciais):**

```
1. Mostre o resumo do escritório
2. E quanto a receita deste mês?
3. Há tarefas pendentes para os agentes?
```

**Esperado:**

- Harvey mantém contexto
- Cada resposta incrementa o turno (0 → 1 → 2)
- sessionId permanece o mesmo

---

## 📊 Validar no Dashboard Sentry

### 5️⃣ Acessar Dashboard AI Agents

1. Login em https://sentry.io
2. Selecionar projeto: **assistente-juridico-p**
3. Menu lateral: **Insights** → **AI**
4. Aba: **AI Agents**

### 6️⃣ Verificar Spans no Sentry

#### O que deve aparecer:

**1. Span Principal - `gen_ai.chat`**

| Atributo                    | Valor Esperado                 |
| --------------------------- | ------------------------------ |
| `op`                        | `gen_ai.chat`                  |
| `name`                      | `chat gemini-2.5-pro`          |
| `gen_ai.system`             | `gemini`                       |
| `gen_ai.request.model`      | `gemini-2.5-pro` ou `gpt-4o-mini` |
| `gen_ai.request.messages`   | JSON com mensagens enviadas    |
| `gen_ai.request.temperature`| `0.7` (ou configurado)         |
| `gen_ai.request.max_tokens` | `2000` (ou configurado)        |

**2. Atributos de Conversação**

| Atributo                 | Valor Esperado      |
| ------------------------ | ------------------- |
| `conversation.session_id`| `harvey-<timestamp>`|
| `conversation.turn`      | `0`, `1`, `2`, ...  |

**3. Atributos de Resposta**

| Atributo              | Valor Esperado                         |
| --------------------- | -------------------------------------- |
| `gen_ai.response.text`| JSON array com resposta do Harvey      |
| `span.status`         | `ok` (código 1)                        |

#### Como encontrar os spans:

1. No dashboard AI Agents:
   - Filtrar por `agent.name = "harvey-specter"`
   - Ou por `gen_ai.system = "gemini"`

2. Clicar em uma transação/trace
3. Ver waterfall de spans
4. Clicar no span `gen_ai.chat` para ver atributos

### 7️⃣ Verificar Métricas

**No dashboard Sentry:**

- **Latência**: Tempo de resposta das chamadas LLM
- **Taxa de erro**: % de chamadas que falharam
- **Volume**: Número total de invocações
- **Tokens** (quando disponível): Uso de input/output tokens

---

## 🐛 Troubleshooting

### Problema: Spans não aparecem no Sentry

**Soluções:**

1. **Verificar DSN configurado:**
   ```bash
   echo $SENTRY_DSN
   ```

2. **Verificar console do browser:**
   - Abrir DevTools (F12)
   - Ver se há erros do Sentry

3. **Verificar sample rate:**
   ```typescript
   // src/main.tsx
   tracesSampleRate: 1.0, // Deve ser 1.0 para capturar 100%
   ```

4. **Verificar modo debug do Sentry:**
   ```typescript
   Sentry.init({
     dsn: "...",
     debug: true, // Temporariamente ativar
   });
   ```

### Problema: Atributos `conversation.*` ausentes

**Solução:**

Verificar se `HarveySpecterChat` está passando parâmetros:

```typescript
const { streamChat } = useAIStreaming({
  agentId: "harvey-specter",
  sessionId, // ✅ Deve estar presente
  conversationTurn, // ✅ Deve estar presente
});
```

### Problema: TypeError ao chamar `createChatSpan`

**Solução:**

Verificar se o import está correto:

```typescript
import { createChatSpan } from "@/lib/sentry-gemini-integration-v2";
```

**Verificar assinatura:**

```typescript
await createChatSpan(
  config: AIAgentConfig,      // ✅ 1º parâmetro
  messages: Message[],        // ✅ 2º parâmetro
  callback: (span) => {...}   // ✅ 3º parâmetro
);
```

---

## 📈 Métricas de Sucesso

### ✅ Critérios de Aceitação - Fase 1

| Critério                               | Status |
| -------------------------------------- | ------ |
| Harvey responde corretamente           | ⏳     |
| Streaming funciona sem erros           | ⏳     |
| Spans aparecem no Sentry               | ⏳     |
| Atributos `gen_ai.*` corretos          | ⏳     |
| Atributos `conversation.*` corretos    | ⏳     |
| Contador de turnos incrementa          | ⏳     |
| sessionId único por conversa           | ⏳     |
| Sem novos erros TypeScript/ESLint      | ✅     |

### 📊 KPIs Esperados

- **Latência média**: < 5s por resposta
- **Taxa de erro**: < 5%
- **Taxa de sucesso instrumentação**: 100%
- **Coverage de agentes**: 1/15 (Fase 1) → 4/15 (Fase 2) → 15/15 (Fase 4)

---

## 🚀 Próximos Passos

### Fase 2: Migrar 3 Agentes Core

1. **Mrs. Justin-e** (`src/components/ExpedientePanel.tsx`)
   - Análise de intimações
   - Identificação de prazos

2. **Redação de Petições** (`src/lib/gemini-service.ts` → `redigiMinuta()`)
   - Geração de minutas
   - Uso de templates

3. **Monitor DJEN** (`api/djen-sync.ts`)
   - Monitoramento de publicações
   - Background job

### Features Adicionais (Fase 2)

- **Tool Calling**: Instrumentar com `createExecuteToolSpan()`
- **Handoffs**: Implementar transferência Harvey → Justin-e com `createHandoffSpan()`

---

## 📚 Referências

- [Sentry AI Agents Module - Python](https://docs.sentry.io/platforms/python/tracing/instrumentation/custom-instrumentation/ai-agents-module/)
- [Manual LLM Instrumentation - JavaScript](https://docs.sentry.io/platforms/javascript/guides/react/tracing/span-metrics/examples/#manual-llm-instrumentation-custom-ai-agent--tool-calls)
- [Google Gen AI Integration](https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/google-genai/)
- [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)

---

**Última atualização:** Dezembro 5, 2025  
**Versão:** 1.0.0 - Fase 1 (Harvey Specter)
