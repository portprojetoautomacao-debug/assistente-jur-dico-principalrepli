# 🚀 Configuração Replit - Assistente Jurídico PJe

## ✅ Configuração Atualizada

O arquivo `.replit` foi atualizado para deployment correto no Replit Autoscale.

### 🔧 **Mudanças Implementadas:**

#### **1. Deployment em Produção**
```toml
[deployment]
deploymentTarget = "autoscale"
build = ["bash", "-c", "npm install && npm run build && cd backend && npm install && npm run build"]
run = ["bash", "-c", "cd backend && NODE_ENV=production PORT=80 node dist/server.js"]
```

**O que acontece:**
- ✅ Build do frontend (React + Vite) → arquivos em `dist/`
- ✅ Build do backend (TypeScript) → arquivos em `backend/dist/`
- ✅ Backend roda na **porta 80** em produção
- ✅ Backend serve **API + arquivos estáticos do frontend**

#### **2. Mapeamento de Portas**
```toml
[[ports]]
localPort = 3001
externalPort = 80

[[ports]]
localPort = 5000
externalPort = 80
```

**Desenvolvimento:**
- Frontend: `http://localhost:5000` (Vite dev server)
- Backend: `http://localhost:3001` (Express API)

**Produção (Deployment):**
- Tudo na **porta 80** (backend serve frontend + API)

#### **3. Workflows Paralelos**
```toml
[[workflows.workflow]]
name = "Project"
mode = "parallel"
```

- Frontend e Backend rodam **simultaneamente** em dev
- Webview mostra o frontend automaticamente
- Backend logs aparecem no console

---

## 🎯 **Como Funciona em Produção:**

### **Arquitetura de Deployment:**
```
┌─────────────────────────────────────────┐
│   Replit Autoscale (Porta 80)          │
├─────────────────────────────────────────┤
│                                         │
│   Backend Express (Node.js)             │
│   ├─ /api/*        → API Routes        │
│   └─ /*            → Frontend estático  │
│                       (dist/)           │
└─────────────────────────────────────────┘
```

### **Fluxo de Requisições:**

1. **Requisições `/api/*`** → Backend processa (rotas da API)
2. **Todas as outras requisições** → Backend serve arquivos do `/dist`
3. **SPA Fallback** → Todas as rotas não-API retornam `index.html`

---

## 📦 **Processo de Build:**

```bash
# 1. Frontend build
npm install          # Instala dependências
npm run build        # Vite build → dist/

# 2. Backend build  
cd backend
npm install          # Instala dependências do backend
npm run build        # TypeScript → backend/dist/

# 3. Production server
NODE_ENV=production PORT=80 node dist/server.js
```

---

## 🔑 **Variáveis de Ambiente:**

```toml
[userenv.shared]
BACKEND_PORT = "3001"      # Dev mode
NODE_ENV = "production"     # Production mode
```

**Adicionais necessárias** (configure no Replit Secrets):
- `VITE_GEMINI_API_KEY` - Chave API Gemini
- `UPSTASH_REDIS_REST_URL` - URL do Upstash Redis
- `UPSTASH_REDIS_REST_TOKEN` - Token do Upstash Redis
- `SENTRY_DSN` (opcional) - Monitoring com Sentry

---

## 🚀 **Como Fazer Deploy:**

### **1. No Replit (Interface Web):**
1. Commit suas mudanças no Git
2. Vá para a aba **"Deployments"**
3. Clique em **"Deploy"**
4. Aguarde o build (~2-3 minutos)
5. Acesse a URL de produção fornecida

### **2. Via Replit CLI:**
```bash
# Instalar Replit CLI (local)
npm install -g @replit/cli

# Login
replit login

# Deploy
replit deployments create
```

---

## 🐛 **Troubleshooting:**

### **Problema: 502 Bad Gateway**
**Causa:** Backend não iniciou ou não está na porta 80

**Solução:**
```bash
# Verificar logs do deployment
replit deployments logs

# Verificar se dist/ foi criado
ls -la dist/

# Verificar se backend/dist/ foi criado
ls -la backend/dist/
```

### **Problema: Build falha**
**Causa:** Dependências não instaladas ou erro TypeScript

**Solução:**
```bash
# Limpar cache
rm -rf node_modules backend/node_modules
npm install
cd backend && npm install

# Build local
npm run build
cd backend && npm run build
```

### **Problema: Dev URL dorme**
**Causa:** Dev URLs do Replit dormem após inatividade

**Solução:**
- Use **Deployment** (always on) para produção
- Dev URLs são apenas para desenvolvimento/testes

---

## ✅ **Verificação de Deployment:**

Após deploy, teste:

```bash
# 1. Health check da API
curl https://sua-url.replit.app/health

# 2. Frontend carrega
curl -I https://sua-url.replit.app/

# 3. API routes funcionam
curl https://sua-url.replit.app/api/llm/models
```

**Resposta esperada:**
- Health check: `{"status":"ok","timestamp":"..."}`
- Frontend: `200 OK` + HTML
- API: JSON com dados

---

## 📊 **Monitoramento:**

### **Logs em Tempo Real:**
```bash
# Via CLI
replit deployments logs --follow

# Via Web
Deployments → seu-deploy → View Logs
```

### **Métricas:**
- CPU Usage
- Memory Usage  
- Request Rate
- Error Rate

Acesse: **Deployments → Analytics**

---

## 🔒 **Segurança:**

### **Dev URL:**
- ✅ Pode ser privada (somente editores autenticados)
- ⚠️ Temporária, dorme após inatividade

### **Production Deployment:**
- ✅ Always on, não dorme
- ✅ SSL/HTTPS automático
- ✅ Domínio personalizado disponível
- ✅ Autoscale conforme tráfego

---

## 🔄 **Compartilhamento de Código Frontend/Backend:**

O backend pode importar código do frontend (agentes, libs) usando path aliases.

### **Configuração:**

1. **Backend tsconfig.json** usa `--tsconfig ../tsconfig.json` para herdar aliases
2. **Variáveis de ambiente** devem funcionar em ambos os contextos:
   - Use `src/lib/env-utils.ts` para acesso seguro
   - `getEnvVar("KEY")` busca em `process.env` e `import.meta.env`
   - `isDevelopment()` / `isProduction()` para verificar ambiente

### **Exemplo:**
```typescript
import { getEnvVar, isDevelopment } from "@/lib/env-utils";

const apiKey = getEnvVar("GEMINI_API_KEY"); // Busca GEMINI_API_KEY ou VITE_GEMINI_API_KEY
if (isDevelopment()) {
  console.log("Modo desenvolvimento");
}
```

---

## 📝 **Notas Importantes:**

1. **Backend serve tudo em produção** (API + Frontend)
2. **PORT=80** é obrigatório para Replit Autoscale
3. **NODE_ENV=production** ativa otimizações
4. **dist/** precisa existir antes do deploy
5. **Secrets do Replit** são injetados automaticamente
6. **Código compartilhado** deve usar `@/lib/env-utils` para variáveis de ambiente

---

## 🆘 **Suporte:**

- **Documentação Replit:** https://docs.replit.com/deployments
- **Status Replit:** https://status.replit.com
- **Community:** https://replit.com/community

---

**Última atualização:** 3 de janeiro de 2026  
**Versão da configuração:** 2.1
