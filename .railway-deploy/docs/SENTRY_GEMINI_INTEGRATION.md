# Sentry Google Gen AI Integration

Integração automática do **Google Gemini 2.5 Pro** com **Sentry AI Monitoring**, adaptada da [integração Python oficial](https://docs.sentry.io/platforms/python/integrations/google-genai/).

## 📊 Visão Geral

Esta integração conecta automaticamente todas as chamadas ao Gemini com o Sentry, criando spans no dashboard **AI Insights** para monitoramento de:

- **Prompts e respostas** (inputs/outputs do LLM)
- **Uso de tokens** (input/output/total)
- **Latência** de chamadas
- **Taxa de erros** do Gemini
- **Performance** por modelo

## 🚀 Instalação e Configuração

### 1. A integração já está ativa!

A integração foi inicializada automaticamente em `/src/services/error-tracking.ts`:

```typescript
import { initGeminiIntegration } from '@/lib/sentry-gemini-integration';

// Após Sentry.init()
initGeminiIntegration({
  includePrompts: true,  // Captura prompts e outputs
  captureErrors: true    // Captura erros automaticamente
});
```

### 2. Configuração de PII (Personally Identifiable Information)

O Sentry considera **inputs/outputs de LLMs como PII** por padrão. Para incluir esses dados:

**Opção 1: Habilitar globalmente no Sentry**
```typescript
Sentry.init({
  // ...outras configs
  send_default_pii: true  // Envia PII por padrão
});
```

**Opção 2: Configurar na integração Gemini**
```typescript
initGeminiIntegration({
  includePrompts: true,  // ✅ Força captura mesmo sem send_default_pii
  captureErrors: true
});
```

**Opção 3: Desabilitar prompts explicitamente**
```typescript
initGeminiIntegration({
  includePrompts: false,  // ❌ Não captura prompts/outputs
  captureErrors: true     // ✅ Mas ainda captura erros
});
```

## 🔧 Como Usar

### ✅ Uso Automático (Recomendado)

Todas as funções do `gemini-service.ts` já estão instrumentadas automaticamente:

```typescript
import { callGemini } from '@/lib/gemini-service';

// ✅ Automaticamente instrumentado
const response = await callGemini("Analise este processo jurídico", {
  model: "gemini-2.5-pro",
  temperature: 0.7,
  maxOutputTokens: 4096
});

// Span criado automaticamente no Sentry com:
// - gen_ai.system: "gcp.gemini"
// - gen_ai.request.model: "gemini-2.5-pro"
// - gen_ai.operation.name: "chat"
// - gen_ai.request.messages: [{"role":"user", "content":"..."}]
// - gen_ai.response.text: ["resposta do modelo"]
// - gen_ai.usage.total_tokens: 1234
```

### 🎯 Uso Manual (Casos Específicos)

Se você fizer chamadas diretas à API do Gemini (fora do `gemini-service`), use o wrapper manual:

```typescript
import { instrumentGeminiCall } from '@/lib/sentry-gemini-integration';

async function myCustomGeminiCall() {
  const wrapper = instrumentGeminiCall(
    {
      model: "gemini-2.5-pro",
      operation: "generate_content",
      prompt: "Meu prompt personalizado",
      temperature: 0.8,
      maxTokens: 2048,
      startTime: Date.now()
    },
    {
      includePrompts: true,
      captureErrors: true
    }
  );

  return await wrapper(async () => {
    // Sua chamada customizada ao Gemini
    const response = await fetch(...);
    return response.json();
  });
}
```

### 🪝 React Hook

Para componentes React, use o hook `useGeminiInstrumentation`:

```typescript
import { useGeminiInstrumentation } from '@/lib/sentry-gemini-integration';

function MyComponent() {
  const { wrapGeminiCall } = useGeminiInstrumentation({
    includePrompts: true
  });

  const handleAnalyze = async () => {
    const result = await wrapGeminiCall(
      {
        model: "gemini-2.5-pro",
        prompt: "Analise este documento",
        temperature: 0.7
      },
      async () => {
        return await callGeminiAPI();
      }
    );
  };
}
```

### 🎨 Decorator Pattern

Para funções que sempre usam Gemini, use o decorator:

```typescript
import { withGeminiInstrumentation } from '@/lib/sentry-gemini-integration';

const analyzeDocument = withGeminiInstrumentation(
  async (documentText: string) => {
    // Lógica de análise
    return await callGeminiAPI(documentText);
  },
  {
    model: "gemini-2.5-pro",
    getPrompt: (text) => `Analise: ${text}`,
    temperature: 0.7
  },
  { includePrompts: true }
);

// Uso
const result = await analyzeDocument("Texto do processo...");
// ✅ Automaticamente instrumentado
```

## 📈 Visualizar Dados no Sentry

### 1. AI Insights Dashboard

Acesse: `https://sentry.io/organizations/[org]/insights/ai/agents/`

**Métricas disponíveis:**
- 📊 **Token Usage**: Custo total de tokens por modelo
- ⏱️ **Latency**: Tempo médio de resposta do Gemini
- ❌ **Error Rate**: Taxa de falhas nas chamadas
- 📈 **Request Volume**: Volume de chamadas ao longo do tempo

### 2. Traces

Acesse: `https://sentry.io/organizations/[org]/performance/trace/[trace-id]`

Cada chamada Gemini aparece como:
```
gen_ai.chat gemini-2.5-pro
├─ Attributes:
│  ├─ gen_ai.system: gcp.gemini
│  ├─ gen_ai.request.model: gemini-2.5-pro
│  ├─ gen_ai.operation.name: chat
│  ├─ gen_ai.request.messages: [{"role":"user",...}]
│  ├─ gen_ai.request.temperature: 0.7
│  ├─ gen_ai.request.max_tokens: 4096
│  ├─ gen_ai.response.text: ["Resposta do modelo..."]
│  ├─ gen_ai.usage.input_tokens: 150
│  ├─ gen_ai.usage.output_tokens: 500
│  └─ gen_ai.usage.total_tokens: 650
```

### 3. Filtros Úteis

```sql
-- Chamadas ao Gemini
op:"gen_ai.chat" AND gen_ai.system:"gcp.gemini"

-- Chamadas lentas (>5s)
op:"gen_ai.chat" AND duration:>5000

-- Erros do Gemini
op:"gen_ai.chat" AND status:internal_error

-- Por modelo
gen_ai.request.model:"gemini-2.5-pro"

-- Alto uso de tokens
gen_ai.usage.total_tokens:>1000
```

## 🔍 Atributos Capturados

### Atributos Comuns
| Atributo | Tipo | Descrição | Exemplo |
|----------|------|-----------|---------|
| `gen_ai.system` | string | Sistema de IA | `"gcp.gemini"` |
| `gen_ai.request.model` | string | Modelo usado | `"gemini-2.5-pro"` |
| `gen_ai.operation.name` | string | Tipo de operação | `"chat"` |

### Atributos de Requisição
| Atributo | Tipo | Descrição | Exemplo |
|----------|------|-----------|---------|
| `gen_ai.request.messages` | string | JSON das mensagens | `"[{\"role\":\"user\",\"content\":\"...\"}]"` |
| `gen_ai.request.temperature` | number | Temperatura do modelo | `0.7` |
| `gen_ai.request.max_tokens` | number | Limite de tokens | `4096` |

### Atributos de Resposta
| Atributo | Tipo | Descrição | Exemplo |
|----------|------|-----------|---------|
| `gen_ai.response.text` | string | JSON da resposta | `"[\"Análise completa...\"]"` |
| `gen_ai.usage.input_tokens` | number | Tokens de entrada | `150` |
| `gen_ai.usage.output_tokens` | number | Tokens de saída | `500` |
| `gen_ai.usage.total_tokens` | number | Total de tokens | `650` |

## 🛡️ Segurança e Privacidade

### PII (Personally Identifiable Information)

⚠️ **IMPORTANTE**: Prompts e respostas do Gemini podem conter dados sensíveis de clientes.

**Opções de privacidade:**

1. **Desabilitar captura de prompts**
```typescript
setGeminiIntegrationOptions({ includePrompts: false });
```

2. **Filtrar dados sensíveis antes de enviar**
```typescript
Sentry.init({
  beforeSend(event) {
    // Remover dados sensíveis
    if (event.contexts?.gemini?.prompt) {
      event.contexts.gemini.prompt = "[REDACTED]";
    }
    return event;
  }
});
```

3. **Usar Sentry Data Scrubbing**
Configure regras de scrubbing no dashboard Sentry para remover automaticamente:
- CPFs
- CNPJs
- E-mails
- Nomes de clientes
- Números de processos

## 📊 Métricas e Alertas

### Configurar Alertas

**1. Alto uso de tokens (custo)**
```
Condition: SUM(gen_ai.usage.total_tokens) > 100000
Period: 1 hour
Action: Email team
```

**2. Latência alta**
```
Condition: AVG(duration) > 5000ms
Period: 5 minutes
Action: Slack notification
```

**3. Taxa de erro elevada**
```
Condition: ERROR_RATE(gen_ai.chat) > 0.05
Period: 10 minutes
Action: PagerDuty
```

## 🧪 Verificar Integração

Execute este teste para verificar se a integração está funcionando:

```typescript
import { callGemini } from '@/lib/gemini-service';
import * as Sentry from '@sentry/react';

async function testGeminiIntegration() {
  const transaction = Sentry.startTransaction({
    name: "Test Gemini Integration",
    op: "test"
  });

  Sentry.getCurrentScope().setSpan(transaction);

  try {
    const response = await callGemini("Say hello", {
      model: "gemini-2.5-pro",
      temperature: 0.7
    });

    console.log("✅ Gemini response:", response.text);
  } finally {
    transaction.finish();
  }
}

// Executar teste
testGeminiIntegration();
```

Após executar, verifique:
1. **AI Spans tab**: `Explore > Traces > AI Spans`
2. **Performance**: Deve aparecer span `gen_ai.chat gemini-2.5-pro`
3. **Atributos**: Verificar se `gen_ai.request.messages` e `gen_ai.response.text` estão preenchidos

⏱️ **Nota**: Pode levar 1-2 minutos para os dados aparecerem no Sentry.

## 🔧 Configuração Avançada

### Alterar configuração em runtime

```typescript
import { 
  setGeminiIntegrationOptions, 
  getGeminiIntegrationOptions 
} from '@/lib/sentry-gemini-integration';

// Ver configuração atual
const config = getGeminiIntegrationOptions();
console.log(config); // { includePrompts: true, captureErrors: true }

// Alterar configuração
setGeminiIntegrationOptions({
  includePrompts: false  // Desabilitar captura de prompts
});
```

### Integração com agentes autônomos

A integração funciona automaticamente com o sistema de agentes:

```typescript
// src/lib/real-agent-client.ts já usa:
import { startAgentInvokeSpan, startAIChatSpan } from './sentry-ai-monitoring';

// ✅ Agentes automaticamente monitorados
// ✅ Chamadas Gemini dentro de agentes rastreadas
// ✅ Hierarquia de spans preservada (agent > chat)
```

## 📚 Referências

- [Sentry AI Monitoring Docs](https://docs.sentry.io/product/insights/ai/agents/)
- [Google Gen AI Python Integration](https://docs.sentry.io/platforms/python/integrations/google-genai/)
- [OpenTelemetry Gen AI Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Código fonte: `/src/lib/sentry-gemini-integration.ts`](/src/lib/sentry-gemini-integration.ts)

---

**Última atualização**: 5 de dezembro de 2025  
**Versão**: 1.0.0  
**Autor**: Assistente Jurídico PJe Team
