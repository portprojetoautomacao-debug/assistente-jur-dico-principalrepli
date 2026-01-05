# 🚂 Configuração de Variáveis Railway

## 📋 Comandos Rápidos (Copiar e Colar)

### 1️⃣ Variáveis Essenciais (OBRIGATÓRIAS)

```bash
# Ambiente e Porta
railway variables set NODE_ENV=production
railway variables set PORT=3001

# Database PostgreSQL (substitua com sua URL)
railway variables set DATABASE_URL="postgresql://user:password@host:5432/database"
```

### 2️⃣ Gemini API (Google AI) - **RECOMENDADO**

```bash
# Obtenha em: https://aistudio.google.com/app/apikey
railway variables set VITE_GEMINI_API_KEY="sua-chave-aqui"
railway variables set GEMINI_API_KEY="sua-chave-aqui"
```

### 3️⃣ Chroma Cloud (Vector Database) - Opcional

```bash
# Obtenha em: https://trychroma.com/
railway variables set CHROMA_API_KEY="ck-xxxxxxxx"
railway variables set CHROMA_TENANT="seu-tenant-id"
railway variables set CHROMA_DATABASE="Demo"
railway variables set CHROMA_COLLECTION_NAME="assistente-juridico-repo"
```

### 4️⃣ Upstash Redis (Cache/KV) - Opcional

```bash
# Obtenha em: https://console.upstash.com/
railway variables set UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
railway variables set UPSTASH_REDIS_REST_TOKEN="seu-token"
```

### 5️⃣ Datadog APM (Monitoring) - Opcional

```bash
railway variables set DD_API_KEY="sua-chave-datadog"
railway variables set DD_SERVICE="assistente-juridico-api"
railway variables set DD_ENV="production"
railway variables set DD_SITE="datadoghq.com"
railway variables set DD_TRACE_ENABLED="true"
railway variables set DD_LOGS_INJECTION="true"
railway variables set DD_PROFILING_ENABLED="false"
```

### 6️⃣ Sentry (Error Tracking) - Opcional

```bash
# Obtenha em: https://sentry.io/
railway variables set VITE_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
railway variables set VITE_APP_VERSION="1.0.0"
railway variables set VITE_ENABLE_PII_FILTERING="true"
```

### 7️⃣ Rate Limiting (Proteção API)

```bash
railway variables set RATE_LIMIT_ENABLED="true"
railway variables set RATE_LIMIT_MAX_REQUESTS="100"
railway variables set AI_RATE_LIMIT_MAX_REQUESTS="30"
railway variables set RATE_LIMIT_WINDOW_MS="900000"
```

### 8️⃣ DJEN Scheduler (Opcional)

```bash
railway variables set DJEN_SCHEDULER_ENABLED="false"  # ou "true"
railway variables set DJEN_OAB_NUMERO="184404"
railway variables set DJEN_OAB_UF="MG"
railway variables set DJEN_ADVOGADO_NOME="Seu Nome"
railway variables set TZ="America/Sao_Paulo"
```

### 9️⃣ Frontend URL

```bash
# URL do frontend deployado (Vercel/Netlify)
railway variables set FRONTEND_URL="https://seu-app.vercel.app"
```

---

## 🎬 Comandos Úteis do Railway CLI

### Instalar CLI
```bash
npm i -g @railway/cli
```

### Login
```bash
railway login
```

### Listar variáveis atuais
```bash
railway variables
```

### Deletar uma variável
```bash
railway variables delete NOME_VARIAVEL
```

### Ver logs em tempo real
```bash
railway logs -f
```

### Forçar redeploy
```bash
railway up --detach
```

### Abrir app no navegador
```bash
railway open
```

### Ver status do projeto
```bash
railway status
```

---

## 🤖 Usar Script Automático

Se preferir configurar tudo de uma vez:

```bash
# Dar permissão
chmod +x railway-env-setup.sh

# Executar script interativo
./railway-env-setup.sh
```

O script vai perguntar cada variável e configurar automaticamente.

---

## 🔍 Verificar Configuração

Depois de configurar, verifique se todas as variáveis necessárias estão presentes:

```bash
railway variables | grep -E "(DATABASE_URL|GEMINI_API_KEY|NODE_ENV|PORT)"
```

---

## 📊 Prioridades de Variáveis

### ✅ Essenciais (App não funciona sem)
- `NODE_ENV`
- `PORT`
- `DATABASE_URL`

### ⭐ Recomendadas (Funcionalidades principais)
- `VITE_GEMINI_API_KEY` / `GEMINI_API_KEY` - IA
- `RATE_LIMIT_ENABLED` - Segurança

### 🎁 Opcionais (Features extras)
- `CHROMA_*` - Busca semântica
- `UPSTASH_*` - Cache Redis
- `DD_*` - Monitoramento Datadog
- `VITE_SENTRY_DSN` - Error tracking
- `DJEN_*` - Scheduler automático

---

## 🚨 Troubleshooting

### Build falhou com "Cannot find module"
```bash
# Verifique se DATABASE_URL está configurada
railway variables get DATABASE_URL
```

### App não inicia
```bash
# Veja logs detalhados
railway logs -f
```

### Erro 500 em produção
```bash
# Verifique se NODE_ENV está correto
railway variables get NODE_ENV
```

---

## 📝 Exemplo Completo Mínimo

Para um deploy básico funcional:

```bash
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set DATABASE_URL="postgresql://..."
railway variables set VITE_GEMINI_API_KEY="..."
railway variables set RATE_LIMIT_ENABLED="true"
railway variables set FRONTEND_URL="https://seu-app.vercel.app"

# Redeploy
railway up --detach
```

---

## 🔗 Links Úteis

- Railway Dashboard: https://railway.app/
- Obter Gemini API Key: https://aistudio.google.com/app/apikey
- Obter Chroma Cloud: https://trychroma.com/
- Obter Upstash Redis: https://console.upstash.com/
- Obter Datadog: https://www.datadoghq.com/
- Obter Sentry: https://sentry.io/
