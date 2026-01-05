# 🚀 Configurações de Deploy - Assistente Jurídico PJe

**Documentação completa para deploy em qualquer plataforma**
**Data:** 04 de Janeiro de 2026
**Versão:** 1.0.1

---

## 📋 Índice

1. [Requisitos de Sistema](#requisitos-de-sistema)
2. [Configuração Atual (Replit)](#configuração-atual-replit)
3. [Variáveis de Ambiente](#variáveis-de-ambiente)
4. [Comandos de Build e Deploy](#comandos-de-build-e-deploy)
5. [Portas e Serviços](#portas-e-serviços)
6. [Plataformas Alternativas](#plataformas-alternativas)
7. [Checklist de Deploy](#checklist-de-deploy)

---

## 🖥️ Requisitos de Sistema

### Runtime
- **Node.js:** >= 20.0.0 (recomendado: 22.x)
- **npm:** >= 9.0.0
- **Python:** 3.13+ (para notebooks e scripts de avaliação)

### Serviços Externos Necessários
- **PostgreSQL:** 16+ (Banco de dados principal)
- **Redis:** (Opcional - para KV store, fallback in-memory)
- **Qdrant:** (Opcional - Vector DB para RAG)

### Build Requirements
- **Memória:** Mínimo 2GB RAM (recomendado 4GB)
- **Disco:** ~500MB (node_modules) + 200MB (build)
- **CPU:** 2+ cores

---

## ⚙️ Configuração Atual (Replit)

### Arquitetura
```
┌─────────────────────────────────────┐
│   Frontend (Vite + React)          │
│   Porta: 5000 (dev) / 3001 (prod)  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Backend (Express + Node.js)       │
│   Porta: 3001                       │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
   ┌───▼───┐      ┌───▼────┐
   │  DB   │      │  APIs  │
   │ Neon  │      │ Ext.   │
   └───────┘      └────────┘
```

### Deployment Target
**Tipo:** Autoscale (Replit)
**Build Command:** `npm run build:deploy`
**Start Command:** `npm run start:production`

### Workflow de Desenvolvimento
**Modo:** Parallel
**Tasks:**
1. Frontend Dev Server (porta 5000)
2. Backend Agents Server (porta 3001)

---

## 🔐 Variáveis de Ambiente

### Arquivo: `.env` (ou `.env.local`)

#### 🔑 Essenciais (Obrigatórias)

```bash
# Banco de Dados PostgreSQL
DATABASE_URL="postgresql://user:pass@host:5432/database?sslmode=require"

# API Google Gemini (IA)
VITE_GEMINI_API_KEY="sua-chave-google-ai"

# Porta do Backend
BACKEND_PORT="3001"
PORT="3001"

# Ambiente
NODE_ENV="production"
```

#### 🌐 Autenticação (Opcional)

```bash
# Modo de autenticação ('simple' ou 'google')
VITE_AUTH_MODE="simple"

# Google OAuth (apenas se VITE_AUTH_MODE=google)
VITE_GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
VITE_REDIRECT_URI="https://seu-dominio.com"
```

#### 📊 Serviços Externos (Opcionais)

```bash
# Qdrant (Vector Database)
QDRANT_URL="https://sua-instancia.qdrant.io"
QDRANT_API_KEY="sua-chave-qdrant"

# Upstash Redis (Key-Value Store)
UPSTASH_REDIS_REST_URL="https://sua-instancia.upstash.io"
UPSTASH_REDIS_REST_TOKEN="seu-token-upstash"

# Azure Application Insights (Monitoramento)
APPINSIGHTS_CONNECTION_STRING="InstrumentationKey=..."
APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=..."

# Sentry (Error Tracking)
VITE_SENTRY_DSN="https://...@sentry.io/..."
SENTRY_AUTH_TOKEN="seu-token-sentry"
```

#### 📅 Scheduler DJEN (Monitoramento Automático)

```bash
# Habilitar scheduler
DJEN_SCHEDULER_ENABLED="false"

# Timezone
TZ="America/Sao_Paulo"

# Dados do advogado
DJEN_OAB_NUMERO="184404"
DJEN_OAB_UF="MG"
DJEN_ADVOGADO_NOME="Thiago Bodevan Veiga"
```

#### 📧 Notificações Email (Futuro)

```bash
EMAIL_NOTIFICACAO_ENABLED="false"
EMAIL_NOTIFICACAO_DESTINO="seu-email@exemplo.com"
# EMAIL_SERVICE_API_KEY="chave-provedor"
```

### Total de Variáveis
- **Essenciais:** 5
- **Opcionais:** 20+
- **Arquivo completo:** `.env.example` (504 linhas)

---

## 🔨 Comandos de Build e Deploy

### Development (Local)

```bash
# Frontend apenas
npm run dev

# Frontend + Backend em paralelo
npm run dev:with-api

# Backend apenas
cd backend && npm run dev
```

### Build de Produção

```bash
# Build completo (frontend + backend)
npm run build:deploy

# Etapas separadas:
npm install                # Instalar dependências frontend
npm run build              # Build frontend (Vite)
npm run build:backend      # Build backend (TypeScript)
```

### Start de Produção

```bash
# Servidor unificado (backend serve frontend estático)
npm run start:production

# Equivalente a:
NODE_ENV=production node backend/dist/backend/src/server.js
```

### Testes

```bash
# Testes unitários
npm run test
npm run test:run          # Single run
npm run test:coverage     # Com cobertura

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e

# Todos os testes
npm run test:all
```

### Linting e Formatação

```bash
npm run lint              # Verificar erros
npm run lint:fix          # Corrigir automaticamente
npm run format            # Prettier
npm run type-check        # TypeScript
```

---

## 🌐 Portas e Serviços

### Portas Configuradas

| Porta Interna | Porta Externa | Serviço | Ambiente |
|--------------|--------------|---------|----------|
| **3001** | **80** | Backend API | Produção |
| **5000** | **80** | Frontend Vite Dev | Desenvolvimento |
| 5001 | - | Reservada | - |
| 5002 | - | Reservada | - |
| 5173 | 5173 | Vite Dev (Alt) | Dev |
| 5174 | 3002 | Vite Preview | Preview |
| 5252 | 6800 | Serviço Adicional | - |
| 9323 | 4200 | Serviço Adicional | - |

### Endpoints da API

```
BASE_URL: http://localhost:3001

GET  /health              - Health check
GET  /api/agents/list     - Listar agentes IA
POST /api/agents/execute  - Executar agente
GET  /api/minutas         - Listar minutas
POST /api/minutas         - Criar minuta
POST /api/ai/continuar    - IA para edição
GET  /api/djen/publications - Publicações DJEN
POST /api/llm/chat        - Proxy LLM
```

---

## 🏗️ Estrutura de Arquivos Importantes

```
assistente-juridico-p/
├── .replit              # ⚙️ Configuração Replit
├── package.json         # 📦 Dependências Frontend
├── vite.config.ts       # ⚡ Config Vite
├── tsconfig.json        # 🔷 TypeScript Config
├── .env.example         # 🔐 Template variáveis
├── tailwind.config.js   # 🎨 Tailwind CSS
│
├── backend/
│   ├── package.json     # 📦 Dependências Backend
│   ├── src/
│   │   ├── server.ts    # 🚀 Entry point
│   │   ├── routes/      # 🛣️ Rotas API
│   │   └── db/          # 🗄️ Database
│   └── dist/            # 📤 Build output
│
├── src/
│   ├── main.tsx         # ⚛️ React entry
│   ├── App.tsx          # 📱 App principal
│   ├── components/      # 🧩 Componentes React
│   ├── hooks/           # 🪝 Custom hooks
│   ├── services/        # 🔌 API clients
│   └── lib/             # 📚 Utilitários
│
├── dist/                # 📤 Frontend build
├── public/              # 🖼️ Assets estáticos
└── notebooks/           # 📓 Jupyter notebooks
```

---

## 🌟 Plataformas Alternativas Recomendadas

### 1️⃣ **Vercel** ⭐ (Mais Fácil)

**Vantagens:**
- Deploy automático via GitHub
- CDN global
- Serverless functions incluídas
- Gratuito para projetos pessoais

**Configuração:**
```json
// vercel.json
{
  "buildCommand": "npm run build:deploy",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/backend/dist/backend/src/server.js" },
    { "source": "/(.*)", "destination": "/" }
  ],
  "env": {
    "NODE_ENV": "production",
    "BACKEND_PORT": "3001"
  }
}
```

**Limitações:**
- Serverless (não mantém conexões persistentes)
- Timeout de 10s (hobby) ou 60s (pro)
- Precisa adapter para backend serverless

---

### 2️⃣ **Railway** ⭐⭐ (Recomendado)

**Vantagens:**
- Suporta Node.js fullstack
- PostgreSQL incluído (provisionado automaticamente)
- Deploy via GitHub
- Gratuito: $5/mês de crédito

**Configuração:**
```toml
# railway.toml
[build]
builder = "nixpacks"
buildCommand = "npm run build:deploy"

[deploy]
startCommand = "npm run start:production"
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 10

[[services]]
name = "app"
port = 3001

[[services]]
name = "postgres"
image = "postgres:16"
```

**Variáveis Railway:**
- Conectar ao PostgreSQL Railway: `DATABASE_URL` (auto)
- Adicionar outras variáveis manualmente

---

### 3️⃣ **Render** ⭐⭐

**Vantagens:**
- PostgreSQL gratuito
- Deploy automático
- SSL incluído
- Logs persistentes

**Configuração:**
```yaml
# render.yaml
services:
  - type: web
    name: assistente-juridico
    runtime: node
    plan: free
    buildCommand: npm run build:deploy
    startCommand: npm run start:production
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: assistente-juridico-db
          property: connectionString

databases:
  - name: assistente-juridico-db
    plan: free
    databaseName: assistente_juridico
    user: admin
```

---

### 4️⃣ **Fly.io** ⭐⭐⭐ (Mais Flexível)

**Vantagens:**
- Suporta qualquer runtime
- PostgreSQL gerenciado
- Edge computing global
- Gratuito: 3 VMs shared

**Configuração:**
```toml
# fly.toml
app = "assistente-juridico"

[build]
  builder = "heroku/buildpacks:20"

[env]
  NODE_ENV = "production"
  PORT = "3001"

[[services]]
  internal_port = 3001
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[deploy]
  release_command = "npm run db:init"
```

**Deploy:**
```bash
fly launch
fly secrets set DATABASE_URL="..." VITE_GEMINI_API_KEY="..."
fly deploy
```

---

### 5️⃣ **DigitalOcean App Platform**

**Vantagens:**
- Gerenciado
- PostgreSQL incluído
- $5/mês (básico)
- Simples de usar

**Configuração:**
```yaml
# .do/app.yaml
name: assistente-juridico
services:
- name: web
  github:
    repo: seu-usuario/assistente-juridico
    branch: main
  build_command: npm run build:deploy
  run_command: npm run start:production
  http_port: 3001
  instance_count: 1
  instance_size_slug: basic-xxs

databases:
- name: db
  engine: PG
  version: "16"
```

---

### 6️⃣ **Heroku** (Tradicional)

**Configuração:**
```
# Procfile
web: npm run start:production

# package.json (adicionar)
"heroku-postbuild": "npm run build:deploy"
```

**Deploy:**
```bash
heroku create assistente-juridico
heroku addons:create heroku-postgresql:essential-0
heroku config:set VITE_GEMINI_API_KEY="..."
git push heroku main
```

---

### 7️⃣ **AWS / Azure / GCP** (Empresarial)

**AWS Elastic Beanstalk:**
- Node.js platform
- RDS PostgreSQL
- Application Load Balancer

**Azure App Service:**
- Node 20 LTS
- Azure Database for PostgreSQL
- Application Insights (já configurado)

**Google Cloud Run:**
- Container-based
- Cloud SQL PostgreSQL
- Auto-scaling

---

## 📊 Comparação de Plataformas

| Plataforma | Custo/mês | PostgreSQL | Deploy Automático | Serverless | Build Time | Recomendação |
|------------|-----------|------------|-------------------|------------|------------|--------------|
| **Replit** | $0-25 | ❌ (Neon ext) | ✅ | ❌ | ~2min | Protótipo |
| **Vercel** | $0-20 | ❌ (Neon ext) | ✅ | ✅ | ~1min | Frontend |
| **Railway** | $5-20 | ✅ Incluído | ✅ | ❌ | ~3min | ⭐ Melhor |
| **Render** | $0-7 | ✅ Free | ✅ | ❌ | ~4min | Gratuito |
| **Fly.io** | $0-10 | ✅ Incluído | ✅ | ❌ | ~2min | Avançado |
| **DigitalOcean** | $5-12 | ✅ Incluído | ✅ | ❌ | ~3min | Simples |
| **Heroku** | $7-25 | ✅ Add-on | ✅ | ❌ | ~5min | Legado |

**Recomendação:** Railway (melhor custo-benefício + facilidade)

---

## ✅ Checklist de Deploy

### Antes do Deploy

- [ ] Variáveis de ambiente configuradas (`.env`)
- [ ] `DATABASE_URL` válida (PostgreSQL)
- [ ] `VITE_GEMINI_API_KEY` válida
- [ ] Dependências instaladas (`npm install`)
- [ ] Build local bem-sucedido (`npm run build`)
- [ ] Testes passando (`npm run test:all`)
- [ ] TypeScript sem erros (`npm run type-check`)
- [ ] Lint OK (`npm run lint`)

### Durante o Deploy

- [ ] Build command: `npm run build:deploy`
- [ ] Start command: `npm run start:production`
- [ ] Porta configurada: `3001`
- [ ] Node.js versão: `>= 20.0.0`
- [ ] Variáveis de ambiente injetadas
- [ ] PostgreSQL conectado

### Após o Deploy

- [ ] Health check respondendo (`/health`)
- [ ] API funcionando (`/api/agents/list`)
- [ ] Frontend carregando (`/`)
- [ ] Autenticação funcionando
- [ ] Banco de dados acessível
- [ ] Logs sem erros críticos
- [ ] Performance aceitável (< 3s TTFB)

---

## 🔧 Troubleshooting Comum

### Build Fails

**Erro:** `Out of memory`
**Solução:** Aumentar heap do Node.js
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

**Erro:** `Module not found`
**Solução:** Limpar cache e reinstalar
```bash
rm -rf node_modules package-lock.json
npm install
```

### Runtime Errors

**Erro:** `Cannot connect to database`
**Solução:** Verificar `DATABASE_URL` e firewall

**Erro:** `Port 3001 already in use`
**Solução:**
```bash
lsof -ti:3001 | xargs kill -9
```

**Erro:** `ENOENT: no such file or directory`
**Solução:** Build não foi executado corretamente
```bash
npm run build:deploy
```

---

## 📚 Recursos Adicionais

### Documentação
- [Guia de Deploy Completo](./DEPLOY_README.md)
- [Configuração OAuth](./OAUTH_SETUP.md)
- [Scheduler DJEN](./DJEN_SCHEDULER_README.md)
- [Azure Setup](./AZURE_SETUP_COMPLETO.md)

### Scripts Úteis
- `scripts/start-dev-with-api.cjs` - Dev fullstack
- `scripts/validate-azure-integration.js` - Testar Azure
- `scripts/deploy-azure-dashboard.ps1` - Dashboard Azure
- `auto-init.sh` - Inicialização automática

### Monitoramento
- **Sentry:** Rastreamento de erros
- **Azure App Insights:** Performance e telemetria
- **OpenTelemetry:** Traces distribuídos

---

**Última atualização:** 04/01/2026
**Versão do documento:** 1.0
**Autor:** GitHub Copilot
