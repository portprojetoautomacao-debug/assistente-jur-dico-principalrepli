# ============================================
# 🐕 DATADOG NO RAILWAY - GUIA COMPLETO
# ============================================

## ✅ O que foi configurado

1. **dd-trace** adicionado ao `backend/package.json`
2. **backend/src/datadog.ts** criado (inicialização do tracer)
3. **backend/src/server.ts** ajustado para importar Datadog PRIMEIRO
4. **Variáveis de ambiente** documentadas abaixo

---

## 📋 Variáveis de ambiente no Railway

### **1. No Railway Dashboard**

Acesse: https://railway.app/project/65944b39-fdb1-491c-9395-d684e3e05204/variables

Adicione estas variáveis (**OBRIGATÓRIAS**):

```bash
DD_API_KEY=40bd0f9ceec8b7926960f1c31ffbf0ae
DD_SITE=us5.datadoghq.com
DD_SERVICE=assistente-juridico-api
DD_ENV=production
DD_VERSION=1.0.0
DD_TRACE_ENABLED=true
DD_LOGS_INJECTION=true
DD_RUNTIME_METRICS_ENABLED=true
```

### **2. Via Railway CLI (alternativa)**

```bash
# Link do projeto (se ainda não fez)
railway link -p 65944b39-fdb1-491c-9395-d684e3e05204

# Definir variáveis
railway variables set DD_API_KEY=40bd0f9ceec8b7926960f1c31ffbf0ae
railway variables set DD_SITE=us5.datadoghq.com
railway variables set DD_SERVICE=assistente-juridico-api
railway variables set DD_ENV=production
railway variables set DD_VERSION=1.0.0
railway variables set DD_TRACE_ENABLED=true
railway variables set DD_LOGS_INJECTION=true
railway variables set DD_RUNTIME_METRICS_ENABLED=true
```

---

## 🚀 Deploy e Validação

### **1. Instalar dd-trace**

```bash
cd backend
npm install
cd ..
```

### **2. Testar build localmente**

```bash
npm run build:backend
```

### **3. Deploy no Railway**

**Opção A: Git Push (recomendado)**
```bash
git add .
git commit -m "feat: Adiciona Datadog APM monitoring"
git push
# Railway detecta push e faz deploy automático
```

**Opção B: Railway CLI**
```bash
railway up
```

### **4. Validar no Datadog**

Após deploy (2-3 minutos), acesse:

**APM & Traces:**
https://us5.datadoghq.com/apm/services

Procure por: `assistente-juridico-api`

**Logs:**
https://us5.datadoghq.com/logs

Filtro: `service:assistente-juridico-api`

**Infrastructure:**
https://us5.datadoghq.com/infrastructure

---

## 🔍 Como funciona

### **Arquitetura (Railway com dd-trace)**

```
[Railway Container]
     ↓
[Node.js + dd-trace]
     ↓ (agentless)
[Datadog API (us5.datadoghq.com)]
```

**dd-trace** envia telemetria **diretamente** para o Datadog (sem agent).

### **O que é coletado automaticamente**

✅ **APM Traces:** Requisições HTTP (Express), chamadas de API externas
✅ **Logs:** Console.log com trace_id/span_id (correlação automática)
✅ **Runtime Metrics:** CPU, memória, event loop lag
✅ **Profiling:** Stack traces de CPU/memória (se `DD_PROFILING_ENABLED=true`)

### **Instrumentação automática**

dd-trace detecta e instrumenta automaticamente:
- `express`
- `http/https`
- `pg` (PostgreSQL)
- `fetch` (Node 18+)
- Outros: https://docs.datadoghq.com/tracing/trace_collection/compatibility/nodejs/

---

## 📊 Métricas e Dashboards

### **Métricas padrão coletadas**

- `runtime.node.cpu.user` (CPU)
- `runtime.node.mem.heap_used` (Memória)
- `trace.express.request` (Requisições)
- `trace.express.request.duration` (Latência)
- `trace.express.request.errors` (Erros 5xx)

### **Custom Metrics (opcional)**

Se quiser adicionar métricas customizadas, edite `backend/src/server.ts`:

```typescript
import tracer from './datadog.js';

// Incrementar contador
tracer.dogstatsd.increment('minutas.created', 1, {
  status: 'success'
});

// Gauge (valor absoluto)
tracer.dogstatsd.gauge('minutas.count', 42);

// Histogram (distribuição)
tracer.dogstatsd.histogram('llm.response_time', 1234, {
  model: 'gemini-2.5-pro'
});
```

---

## 🔧 Troubleshooting

### **"Tracer não aparece no Datadog"**

1. Confirme variáveis no Railway:
   ```bash
   railway variables
   ```

2. Verifique logs do deploy:
   ```bash
   railway logs
   ```

   Procure por:
   ```
   [Datadog APM] Tracer initialized
   [Datadog APM] Service: assistente-juridico-api
   ```

3. Se aparecer "Disabled (not in production)":
   - Certifique-se de que `DD_TRACE_ENABLED=true` está no Railway

### **"Erro de conexão com Datadog"**

- Verifique se `DD_SITE=us5.datadoghq.com` está correto
- Valide API key: https://us5.datadoghq.com/organization-settings/api-keys

### **"Logs sem trace_id"**

- Certifique-se de que `DD_LOGS_INJECTION=true`
- Use `console.log()` (dd-trace intercepta automaticamente)
- Alternativa: Winston/Bunyan com plugin dd-trace

---

## 🎯 Próximos passos

1. **Configurar Monitors/Alerts:**
   - https://us5.datadoghq.com/monitors/create

2. **Criar Dashboards customizados:**
   - https://us5.datadoghq.com/dashboard/lists

3. **Configurar Error Tracking:**
   - Já funciona automaticamente com dd-trace
   - https://us5.datadoghq.com/apm/error-tracking

4. **Profiling (opcional):**
   ```bash
   railway variables set DD_PROFILING_ENABLED=true
   ```

---

## 📚 Documentação oficial

- **dd-trace Node.js:** https://docs.datadoghq.com/tracing/trace_collection/automatic_instrumentation/dd_libraries/nodejs/
- **Railway + Datadog:** https://docs.railway.app/guides/datadog
- **APM Best Practices:** https://docs.datadoghq.com/tracing/guide/

---

**Status:** ✅ Pronto para deploy
**Compatibilidade:** Railway, Vercel, Heroku, AWS Lambda (com layer)
**Performance impact:** <1% overhead em produção
