# 🚀 Guia Completo de Deploy - Arquitetura Híbrida

Este guia contém todas as instruções para colocar a arquitetura híbrida em produção.

## 📊 Visão Geral da Stack

```
┌─────────────────────────────────────────────┐
│  VERCEL (Frontend + API Serverless)        │
│  ├── React + Vite                          │
│  ├── API Routes (Node.js 22)               │
│  ├── LangGraph Agents (client-side)        │
│  └── AutoGen Orchestrator (serverless)     │
└────────────┬───────────────────┬────────────┘
             │                   │
    ┌────────▼────────┐  ┌───────▼──────────┐
    │ Qdrant Cloud    │  │  Railway         │
    │ (Vector DB)     │  │  (DSPy Bridge)   │
    │ Free: 1GB       │  │  Free: 500h/mês  │
    └─────────────────┘  └──────────────────┘
```

---

## ✅ Pré-requisitos

- [x] Node.js 22+ instalado
- [x] Python 3.11+ instalado
- [x] Conta GitHub (para Vercel)
- [x] Conta Google (para Gemini API)

---

## 📝 Passo 1: Configuração Local

### 1.1 Clonar e Instalar

```bash
# Clone o repositório (se ainda não fez)
git clone https://github.com/thiagobodevan-a11y/assistente-juridico-p.git
cd assistente-juridico-p

# Instale dependências Node.js
npm install

# Crie e configure .env
cp .env.example .env
```

### 1.2 Configurar Variáveis de Ambiente

Edite o arquivo `.env` e configure:

```bash
# ========== OBRIGATÓRIO ==========

# Gemini API (motor de IA principal)
GEMINI_API_KEY=your-gemini-key-here
# Obtenha em: https://aistudio.google.com/app/apikey (GRÁTIS)

# Qdrant (Vector Database)
QDRANT_URL=http://localhost:6333  # Local para dev
QDRANT_API_KEY=dev-local-key
QDRANT_COLLECTION=legal-docs

# AutoGen (Orchestration)
AUTOGEN_API_KEY=dev-autogen-key

# DSPy Bridge
DSPY_BRIDGE_URL=http://localhost:8765
DSPY_API_TOKEN=secure-random-token-change-me
DSPY_PORT=8765
ALLOWED_ORIGINS=http://localhost:5173

# LangGraph
LANGGRAPH_TIMEOUT=30000
LANGGRAPH_MAX_RETRIES=3
```

### 1.3 Instalar Dependências Python

```bash
# Criar virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Instalar pacotes
pip install dspy-ai fastapi uvicorn qdrant-client
```

### 1.4 Testar Localmente

```bash
# Terminal 1: Rodar servidor dev
npm run dev

# Terminal 2: Rodar DSPy bridge
source venv/bin/activate
export DSPY_API_TOKEN="your-token-here"
python3 scripts/dspy_bridge.py

# Terminal 3: Rodar testes
npm run test:integration
```

---

## ☁️ Passo 2: Deploy em Produção

### 2.1 Qdrant Cloud (Vector Database)

**Plano:** Free Tier (1GB storage, suficiente para ~100k documentos)

1. **Criar conta:** https://cloud.qdrant.io/signup
2. **Criar cluster:**
   - Clique em "Create Cluster"
   - Nome: `assistente-juridico`
   - Região: `us-east-1` (mais próxima do Vercel)
   - Tier: **Free**
3. **Obter credenciais:**
   - Cluster URL: `https://xxx.cloud.qdrant.io`
   - API Key: (copie da dashboard)
4. **Atualizar .env:**
   ```bash
   QDRANT_URL=https://xxx.cloud.qdrant.io
   QDRANT_API_KEY=your-real-api-key
   ```

---

### 2.2 Railway (DSPy Bridge Python)

**Plano:** Free Tier (500 horas/mês, ~$0)

#### Opção A: Deploy via GitHub (Recomendado)

1. **Criar conta:** https://railway.app/login
2. **Novo projeto:**
   - "New Project" → "Deploy from GitHub repo"
   - Autorize acesso ao repositório
   - Selecione `assistente-juridico-p`
3. **Configurar deploy:**
   - **Start Command:** `python3 scripts/dspy_bridge.py`
   - **Root Directory:** `/` (raiz)
4. **Adicionar variáveis de ambiente:**
   ```
   DSPY_API_TOKEN=generate-a-secure-random-token-here
   DSPY_PORT=8765
   ALLOWED_ORIGINS=https://assistente-juridico-github.vercel.app
   DSPY_LM_MODEL=openai/gpt-3.5-turbo
   ```
5. **Deploy:**
   - Railway fará build e deploy automático
   - Copie a URL gerada (ex: `https://dspy-bridge-production.up.railway.app`)
6. **Atualizar .env local e Vercel:**
   ```bash
   DSPY_BRIDGE_URL=https://your-app.up.railway.app
   ```

#### Opção B: Deploy via Railway CLI

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Iniciar projeto
railway init

# Deploy
railway up

# Adicionar env vars
railway variables set DSPY_API_TOKEN=your-token
railway variables set ALLOWED_ORIGINS=https://assistente-juridico-github.vercel.app
```

---

### 2.3 Vercel (Frontend + API)

**Plano:** Hobby (Grátis, ilimitado)

#### Setup Inicial

1. **Conectar ao GitHub:**
   - Acesse: https://vercel.com/new
   - "Import Git Repository"
   - Selecione `assistente-juridico-p`

2. **Configurar projeto:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

3. **Adicionar Environment Variables:**

   Vá em Settings → Environment Variables e adicione:

   ```
   # ========== IA E AUTOMAÇÃO ==========
   GEMINI_API_KEY=your-gemini-api-key
   VITE_GEMINI_API_KEY=your-gemini-api-key

   # ========== QDRANT (VECTOR DB) ==========
   QDRANT_URL=https://xxx.cloud.qdrant.io
   QDRANT_API_KEY=your-qdrant-api-key
   QDRANT_COLLECTION=legal-docs
   QDRANT_TIMEOUT=30000

   # ========== AUTOGEN ==========
   AUTOGEN_API_KEY=generate-secure-key
   AUTOGEN_TIMEOUT=45000
   AUTOGEN_MAX_ROUNDS=5

   # ========== DSPY BRIDGE ==========
   DSPY_BRIDGE_URL=https://your-app.up.railway.app
   DSPY_API_TOKEN=same-token-as-railway
   ALLOWED_ORIGINS=https://assistente-juridico-github.vercel.app

   # ========== LANGGRAPH ==========
   LANGGRAPH_TIMEOUT=30000
   LANGGRAPH_MAX_RETRIES=3

   # ========== UPSTASH (já configurado) ==========
   UPSTASH_REDIS_REST_URL=your-existing-url
   UPSTASH_REDIS_REST_TOKEN=your-existing-token
   ```

4. **Deploy:**
   - Clique em "Deploy"
   - Aguarde build (2-3 minutos)
   - Vercel fornecerá uma URL de produção

---

## 🧪 Passo 3: Validação

### 3.1 Testar Qdrant

```bash
# Via curl
curl -X GET "https://xxx.cloud.qdrant.io/collections" \
  -H "api-key: your-api-key"

# Deve retornar lista de collections (vazia inicialmente)
```

### 3.2 Testar DSPy Bridge

```bash
# Health check
curl https://your-app.up.railway.app/health

# Optimize prompt
curl -X POST https://your-app.up.railway.app/optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-dspy-token" \
  -d '{"prompt": "Analyze this legal document"}'
```

### 3.3 Testar Vercel Deployment

```bash
# Abrir no browser
https://assistente-juridico-github.vercel.app

# Testar API
curl https://assistente-juridico-github.vercel.app/api/health
```

---

## 📊 Passo 4: Monitoramento

### 4.1 Sentry (Error Tracking)

Já configurado! Acesse: https://sentry.io

### 4.2 Vercel Analytics

Acesse: https://vercel.com/analytics

### 4.3 Railway Logs

```bash
railway logs  # Via CLI
```

Ou acesse: https://railway.app/project/your-project/deployments

---

## 🔄 Passo 5: CI/CD Automático

Já configurado via GitHub Actions!

### Workflow Atual

```
git push origin main
    ↓
GitHub Actions executa:
├── ESLint
├── TypeScript check
├── Testes unitários
├── Testes de integração
└── Build
    ↓
    ✅ Se passar, Vercel auto-deploy
```

### Adicionar Deploy do DSPy no CI/CD

Crie `.github/workflows/deploy-railway.yml`:

```yaml
name: Deploy DSPy Bridge to Railway

on:
  push:
    branches: [main]
    paths:
      - 'scripts/dspy_bridge.py'
      - 'railway.toml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Railway CLI
        run: npm i -g @railway/cli
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 🎯 Checklist Final

- [ ] ✅ Gemini API Key configurada
- [ ] ✅ Qdrant Cloud cluster criado
- [ ] ✅ DSPy Bridge deployado no Railway
- [ ] ✅ Vercel env vars configuradas
- [ ] ✅ Deploy Vercel realizado
- [ ] ✅ Testes de health check passando
- [ ] ✅ Sentry configurado
- [ ] ✅ GitHub Actions rodando

---

## 📞 Suporte

- **Documentação:** Ver `docs/HYBRID_STUBS_README.md`
- **Issues:** https://github.com/thiagobodevan-a11y/assistente-juridico-p/issues
- **Testes:** `npm run test:integration`

---

## 💰 Custos Mensais (Free Tier)

| Serviço | Plano | Custo |
|---------|-------|-------|
| Vercel | Hobby | **$0** |
| Railway | Free | **$0** (500h) |
| Qdrant Cloud | Free | **$0** (1GB) |
| Gemini API | Free | **$0** (1500 req/dia) |
| Upstash Redis | Free | **$0** (10k commands/dia) |
| **TOTAL** | | **$0/mês** 🎉 |

---

## 🔐 Segurança em Produção

- ✅ Todas as APIs requerem autenticação
- ✅ Tokens em environment variables (não no código)
- ✅ HTTPS em todas as conexões
- ✅ Rate limiting configurado
- ✅ Timeout protection em todas operações
- ✅ Input validation em todos endpoints
- ✅ Sem `eval()` ou execução dinâmica de código

---

**Pronto para produção!** 🚀
