# 🔐 Guia de Configuração de Variáveis de Ambiente - Vercel

**Objetivo**: Configurar todas as variáveis de ambiente necessárias para o funcionamento completo dos agentes IA.

---

## 📋 Checklist de Variáveis

### ✅ **Obrigatórias** (Sistema não funciona sem elas)

| Variável | Descrição | Onde Obter | Valor de Exemplo |
|----------|-----------|------------|------------------|
| `GEMINI_API_KEY` | Chave da API Gemini 2.5 Pro | https://makersuite.google.com/app/apikey | `AIzaSy...` |
| `DATAJUD_API_KEY` | Chave da API DataJud (CNJ) | https://datajud-api.cnj.jus.br | `datajud_...` |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Secret para bypass de webhooks | Gerar manualmente | UUID v4 qualquer |

### ⚠️ **Recomendadas** (Funcionalidades avançadas)

| Variável | Descrição | Onde Obter | Valor de Exemplo |
|----------|-----------|------------|------------------|
| `UPSTASH_REDIS_REST_URL` | URL do Redis Upstash | https://console.upstash.com | `https://...upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Token do Redis Upstash | https://console.upstash.com | `AY...` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID (Calendar) | https://console.cloud.google.com | `123...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret | https://console.cloud.google.com | `GOCSPX-...` |
| `SENTRY_DSN` | Sentry error tracking | https://sentry.io | `https://...@sentry.io/...` |

### 🔄 **Opcionais** (Integrações externas)

| Variável | Descrição | Onde Obter | Valor de Exemplo |
|----------|-----------|------------|------------------|
| `QDRANT_URL` | Qdrant Cloud vector database | https://cloud.qdrant.io | `https://...qdrant.io:6333` |
| `QDRANT_API_KEY` | Chave da API Qdrant | https://cloud.qdrant.io | `qdrant_...` |
| `DSPY_BRIDGE_URL` | URL do DSPy Bridge (Railway) | https://railway.app | `https://...railway.app` |
| `RESEND_API_KEY` | Email service (Resend) | https://resend.com | `re_...` |
| `TODOIST_API_TOKEN` | Todoist task integration | https://todoist.com/prefs/integrations | `0123...` |

---

## 🚀 Como Configurar no Vercel

### **Método 1: Via Dashboard (Recomendado)**

1. **Acessar o Projeto**:
   - URL: https://vercel.com/dashboard
   - Selecionar: `assistente-juridico-github`

2. **Abrir Configurações**:
   - Clicar em **Settings** (ícone de engrenagem)
   - Menu lateral: **Environment Variables**

3. **Adicionar Variável**:
   - Clicar em **Add New**
   - Preencher campos:
     - **Name**: Nome da variável (ex: `GEMINI_API_KEY`)
     - **Value**: Valor secreto
     - **Environments**: Selecionar:
       - ✅ Production
       - ✅ Preview
       - ✅ Development
   - Clicar em **Save**

4. **Repetir para todas as variáveis**

### **Método 2: Via CLI (Avançado)**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Adicionar variável
vercel env add GEMINI_API_KEY production
# Cole o valor quando solicitado

# Adicionar para todos os ambientes
vercel env add GEMINI_API_KEY preview
vercel env add GEMINI_API_KEY development
```

---

## 🔑 Como Obter as Chaves

### **1. GEMINI_API_KEY** (Obrigatória)

**Passo a Passo**:
1. Acessar: https://makersuite.google.com/app/apikey
2. Fazer login com conta Google
3. Clicar em **Create API Key**
4. Copiar a chave gerada (começa com `AIzaSy...`)
5. Adicionar ao Vercel como `GEMINI_API_KEY`

**⚠️ Importante**: Ativar o modelo **Gemini 2.5 Pro** no projeto do Google Cloud.

### **2. DATAJUD_API_KEY** (Obrigatória)

**Passo a Passo**:
1. Acessar: https://datajud-api.cnj.jus.br
2. Criar conta como advogado/escritório
3. Solicitar acesso à API pública
4. Aguardar aprovação (1-3 dias úteis)
5. Copiar a chave fornecida
6. Adicionar ao Vercel como `DATAJUD_API_KEY`

**Alternativa**: Usar a API pública do DataJud (sem autenticação) para testes:
```typescript
// API pública (limitada)
const DATAJUD_PUBLIC_URL = "https://api-publica.datajud.cnj.jus.br";
```

### **3. VERCEL_AUTOMATION_BYPASS_SECRET** (Obrigatória)

**Gerar UUID v4**:
```bash
# PowerShell (Windows)
[guid]::NewGuid().ToString()

# Linux/Mac
uuidgen

# Online
# Acessar: https://www.uuidgenerator.net/version4
```

**Exemplo de valor**: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### **4. UPSTASH_REDIS_REST_URL e TOKEN** (Recomendadas)

**Passo a Passo**:
1. Acessar: https://console.upstash.com
2. Criar conta gratuita
3. Clicar em **Create Database**
4. Configurar:
   - **Name**: `assistente-juridico-db`
   - **Type**: Regional
   - **Region**: US-East (mais próxima do Vercel)
   - **Tier**: Free (gratuito)
5. Após criação, copiar:
   - **UPSTASH_REDIS_REST_URL**: URL completa
   - **UPSTASH_REDIS_REST_TOKEN**: Token de autenticação
6. Adicionar ambas ao Vercel

### **5. GOOGLE_CLIENT_ID e SECRET** (Recomendadas)

**Passo a Passo**:
1. Acessar: https://console.cloud.google.com
2. Criar novo projeto ou selecionar existente
3. Menu: **APIs & Services** → **Credentials**
4. Clicar em **Create Credentials** → **OAuth 2.0 Client ID**
5. Configurar:
   - **Application type**: Web application
   - **Name**: Assistente Jurídico PJe
   - **Authorized redirect URIs**:
     - `https://assistente-juridico-github.vercel.app/auth/callback`
     - `http://localhost:5173/auth/callback` (desenvolvimento)
6. Copiar **Client ID** e **Client secret**
7. Ativar APIs necessárias:
   - Google Calendar API
   - Google Drive API (se usar armazenamento)
8. Adicionar ao Vercel

---

## ✅ Validação das Variáveis

### **Testar Localmente** (Antes de fazer deploy)

1. **Criar arquivo `.env.local`** na raiz do projeto:
```bash
# API Keys Obrigatórias
GEMINI_API_KEY=AIzaSy...
DATAJUD_API_KEY=datajud_...
VERCEL_AUTOMATION_BYPASS_SECRET=a1b2c3d4-e5f6-7890-abcd-ef1234567890

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=AY...

# Google OAuth
GOOGLE_CLIENT_ID=123...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# Opcionais
QDRANT_URL=https://...qdrant.io:6333
QDRANT_API_KEY=qdrant_...
DSPY_BRIDGE_URL=https://...railway.app
RESEND_API_KEY=re_...
SENTRY_DSN=https://...@sentry.io/...
```

2. **Testar servidor local**:
```bash
npm run dev
```

3. **Verificar no console**:
```
✅ GEMINI_API_KEY loaded
✅ DATAJUD_API_KEY loaded
✅ Redis connection OK
✅ All environment variables configured
```

### **Testar no Vercel** (Após deploy)

1. **Fazer deploy**:
```bash
git add .
git commit -m "chore: configurar variáveis de ambiente"
git push origin main
```

2. **Acessar o Health Check**:
   - URL: https://assistente-juridico-github.vercel.app/api/health
   - Resposta esperada:
   ```json
   {
     "status": "ok",
     "environment": {
       "gemini": true,
       "datajud": true,
       "redis": true,
       "google": true
     },
     "agents": {
       "active": 7,
       "total": 7
     }
   }
   ```

3. **Verificar Logs no Vercel**:
   - Dashboard → Deployments → Selecionar último deploy
   - Aba **Runtime Logs**
   - Buscar por erros de variáveis faltando

---

## 🔒 Segurança

### **Boas Práticas**:

✅ **FAZER**:
- Usar valores diferentes para Production/Preview/Development
- Rotacionar chaves periodicamente (a cada 3-6 meses)
- Monitorar uso das APIs (quotas e billing)
- Usar secrets manager para backups (1Password, Bitwarden)
- Documentar data de criação e renovação

❌ **NÃO FAZER**:
- Commitar `.env` ou `.env.local` no Git
- Compartilhar chaves em texto plano (Slack, email)
- Usar mesmas chaves em múltiplos projetos
- Deixar chaves em logs ou screenshots
- Expor chaves em código frontend

### **Arquivo `.gitignore`** (Verificar se contém):
```
.env
.env.local
.env.*.local
.env.production
```

---

## 📊 Monitoramento de Uso

### **Quotas Gratuitas**:

| Serviço | Quota Free Tier | Custo Adicional |
|---------|-----------------|-----------------|
| **Gemini 2.5 Pro** | 60 requests/min | $0.00125/1K chars |
| **DataJud API** | 1000 requests/day | Ilimitado (público) |
| **Upstash Redis** | 10K commands/day | $0.20/100K |
| **Vercel** | 100 GB-hours/month | $20/mês Pro |
| **Qdrant Cloud** | 1 GB storage | $25/mês |
| **Resend Email** | 100 emails/day | $10/mês |

### **Alertas Recomendados**:

1. **Configurar no Vercel**:
   - Settings → Usage → Alerts
   - Notificar em 80% da quota

2. **Monitorar custos**:
   - Google Cloud Console → Billing
   - Upstash Dashboard → Usage
   - Vercel Dashboard → Usage

---

## 🆘 Troubleshooting

### **Erro: "Missing required environment variable"**

**Solução**:
1. Verificar se a variável está configurada no Vercel
2. Confirmar que está em **Production** (não apenas Preview)
3. Re-deploy para aplicar mudanças:
   ```bash
   vercel --prod
   ```

### **Erro: "Invalid API key"**

**Solução**:
1. Verificar se a chave não expirou
2. Confirmar que copiou o valor completo (sem espaços)
3. Re-gerar chave no serviço original
4. Atualizar no Vercel e re-deploy

### **Erro: "Redis connection timeout"**

**Solução**:
1. Verificar se o Redis Upstash está ativo
2. Confirmar que a URL está correta (incluindo porta)
3. Verificar firewall/whitelist do Upstash
4. Testar conexão local:
   ```bash
   curl $UPSTASH_REDIS_REST_URL/ping -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
   ```

---

## 🎯 Checklist Final

Antes de considerar a configuração completa, verifique:

- [ ] ✅ GEMINI_API_KEY configurada e testada
- [ ] ✅ DATAJUD_API_KEY configurada (ou usando API pública)
- [ ] ✅ VERCEL_AUTOMATION_BYPASS_SECRET gerada
- [ ] ✅ UPSTASH_REDIS_REST_URL e TOKEN configuradas
- [ ] ✅ GOOGLE_CLIENT_ID e SECRET configuradas
- [ ] ✅ Deploy realizado com sucesso
- [ ] ✅ Health check respondendo OK
- [ ] ✅ Logs sem erros de variáveis faltando
- [ ] ✅ Script de inicialização executado no browser
- [ ] ✅ 7 agentes ativos no dashboard
- [ ] ✅ Primeiro cron DJEN agendado (9h UTC)

---

**Última Atualização**: 2024-01-XX  
**Autor**: Copilot Agent  
**Versão**: 1.0
