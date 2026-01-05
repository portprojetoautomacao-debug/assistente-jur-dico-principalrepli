# 🔍 Guia de Configuração - OpenTelemetry Tracing

## ⚡ Quick Start (5 minutos)

### 1. Configurar Endpoint OTLP

Edite o arquivo `.env.local`:

```bash
# Desenvolvimento (padrão - AI Toolkit)
VITE_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

### 2. Ativar AI Toolkit Trace Viewer

No VS Code:
1. Pressione `Ctrl+Shift+P` (Windows) ou `Cmd+Shift+P` (Mac)
2. Digite: "AI Toolkit: Open Trace Viewer"
3. Pressione Enter

### 3. Executar o Sistema

```bash
npm run dev
```

### 4. Visualizar Traces

- Navegue no sistema (ex: criar uma minuta, processar intimação)
- Volte ao AI Toolkit Trace Viewer
- Veja os traces aparecerem em tempo real! 🎉

---

## 🌐 Configurações para Produção

### Opção 1: Azure Monitor (Recomendado para Microsoft Stack)

```bash
# .env.local ou .env.production
VITE_OTLP_ENDPOINT=https://YOUR-REGION.monitor.azure.com/v1/traces
```

**Como obter:**
1. Portal Azure → Application Insights
2. Overview → Configure OpenTelemetry
3. Copie o endpoint OTLP HTTP

**Benefícios:**
- ✅ Integração nativa com Azure
- ✅ Visualização de traces no Azure Portal
- ✅ Correlação com Application Insights
- ✅ Alertas automáticos

### Opção 2: Datadog APM

```bash
VITE_OTLP_ENDPOINT=https://api.datadoghq.com/api/v2/traces
```

**Como configurar:**
1. Datadog Dashboard → APM → Setup Instructions
2. Habilite "OpenTelemetry Ingestion"
3. Obtenha API Key
4. Configure header `DD-API-KEY` (requer modificação em `otel-integration.ts`)

**Benefícios:**
- ✅ APM robusto com métricas
- ✅ Distributed tracing avançado
- ✅ Dashboards prontos para LLMs
- ✅ Machine learning para anomalias

### Opção 3: Honeycomb

```bash
VITE_OTLP_ENDPOINT=https://api.honeycomb.io/v1/traces
```

**Como configurar:**
1. Honeycomb → Settings → API Keys
2. Crie novo API Key
3. Configure header `X-Honeycomb-Team` (requer modificação)

**Benefícios:**
- ✅ Observabilidade especializada em IA
- ✅ Queries poderosas (BubbleUp, etc.)
- ✅ Excelente para debugging de LLM

### Opção 4: Jaeger (Self-Hosted)

```bash
VITE_OTLP_ENDPOINT=http://your-jaeger-host:4318/v1/traces
```

**Como instalar:**
```bash
# Docker Compose
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest
```

**Acesso UI:** http://localhost:16686

**Benefícios:**
- ✅ Totalmente gratuito e open-source
- ✅ Controle total dos dados
- ✅ Sem custos de tráfego

---

## 🔧 Configuração Avançada

### Headers Customizados (se necessário)

Edite `src/lib/otel-integration.ts`:

```typescript
// Configurar exportador OTLP
const otlpExporter = new OTLPTraceExporter({
  url: OTLP_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
    // Adicione headers customizados aqui:
    'X-API-Key': 'sua-api-key', // Datadog, Honeycomb, etc.
    'Authorization': 'Bearer token', // Autenticação customizada
  },
  timeoutMillis: 5000,
});
```

### Sampling (Reduzir Volume de Traces)

Para produção com alto tráfego:

```typescript
// src/lib/otel-integration.ts
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

const tracerProvider = new WebTracerProvider({
  resource,
  sampler: new TraceIdRatioBasedSampler(0.1), // 10% dos traces
});
```

---

## 📊 O Que Será Rastreado

### Operações de Agentes
- ✅ Processamento de tarefas
- ✅ Execução de agentes (Harvey, Mrs. Justin-e, etc.)
- ✅ Geração de minutas
- ✅ Análise de intimações

### Chamadas LLM
- ✅ Requisições ao Gemini 2.5 Pro
- ✅ Tokens usados (prompt + completion)
- ✅ Temperatura e parâmetros
- ✅ Tempo de resposta

### API Endpoints
- ✅ `/api/agents` - Processamento de agentes
- ✅ `/api/cron` - Jobs agendados
- ✅ `/api/llm-stream` - Streaming LLM

### Eventos Customizados
- ✅ `task.started` - Início de processamento
- ✅ `task.completed` - Conclusão com sucesso
- ✅ `task.failed` - Falha com erro
- ✅ `agent.status.processing` - Mudança de status

---

## 🐛 Troubleshooting

### Traces não aparecem no AI Toolkit

**Solução 1: Verificar se o Trace Viewer está aberto**
```
Ctrl+Shift+P → "AI Toolkit: Open Trace Viewer"
```

**Solução 2: Verificar endpoint**
```bash
echo $VITE_OTLP_ENDPOINT
# Deve ser: http://localhost:4318/v1/traces
```

**Solução 3: Verificar inicialização**
Abra o Console do navegador e procure:
```
✅ [OpenTelemetry] Inicializado com sucesso
📊 [OpenTelemetry] Endpoint: http://localhost:4318/v1/traces
```

### Erro: "Failed to fetch" ou CORS

**Solução: Usar HTTPS em produção**
```bash
# Produção - sempre HTTPS
VITE_OTLP_ENDPOINT=https://seu-collector.com/v1/traces
```

### Traces não aparecem em produção

**Verificar:**
1. Endpoint está acessível (teste com `curl`)
2. Headers de autenticação configurados
3. CORS permitindo origem do app
4. Firewall/proxy não bloqueando porta

---

## 📈 Métricas e Atributos

### Atributos Padrão em Todos os Spans

```typescript
{
  'service.name': 'assistente-juridico-pje',
  'service.version': '1.0.1',
  'deployment.environment': 'production',
  'telemetry.sdk.name': 'opentelemetry',
  'telemetry.sdk.language': 'typescript'
}
```

### Atributos de Agentes

```typescript
{
  'agent.id': 'harvey',
  'agent.name': 'Harvey Specter',
  'task.id': 'uuid',
  'task.type': 'ANALYZE_INTIMATION',
  'task.priority': 'high',
  'processing_time_ms': 1234,
  'tokens_used': 500
}
```

### Atributos de LLM

```typescript
{
  'llm.model': 'gemini-2.5-pro',
  'llm.temperature': 0.7,
  'llm.max_tokens': 4096,
  'llm.prompt_tokens': 250,
  'llm.completion_tokens': 750,
  'llm.total_tokens': 1000,
  'llm.response_time_ms': 2340
}
```

---

## 🎯 Próximos Passos

1. **Configure o endpoint** no `.env.local`
2. **Ative o Trace Viewer** (Ctrl+Shift+P)
3. **Execute o sistema** (`npm run dev`)
4. **Teste uma operação** (criar minuta, processar intimação)
5. **Visualize os traces** em tempo real!

---

## 📚 Documentação Adicional

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [AI Toolkit Trace Viewer](https://marketplace.visualstudio.com/items?itemName=ms-windows-ai-studio.windows-ai-studio)
- [Azure Monitor OpenTelemetry](https://learn.microsoft.com/azure/azure-monitor/app/opentelemetry-enable)
- [Datadog OpenTelemetry](https://docs.datadoghq.com/tracing/trace_collection/opentelemetry/)

---

**Precisa de ajuda?** Abra uma issue no GitHub ou consulte a documentação em `.github/copilot-instructions.md`
