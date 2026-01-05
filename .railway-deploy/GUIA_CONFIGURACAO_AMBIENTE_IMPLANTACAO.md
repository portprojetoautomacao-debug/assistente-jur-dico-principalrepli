# 🚀 Guia Completo de Configuração do Ambiente de Implantação

> **Assistente Jurídico PJe v1.4.0+**
> 
> Guia passo a passo para configurar e implantar o sistema em produção

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
3. [Opções de Deployment](#opções-de-deployment)
4. [Configuração Passo a Passo](#configuração-passo-a-passo)
5. [Validação e Testes](#validação-e-testes)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Pré-requisitos

### Software Necessário

- **Node.js**: v20.0.0 ou superior (recomendado: v22)
- **npm**: v9.0.0 ou superior
- **Git**: Para controle de versão
- **Conta GitHub**: Para CI/CD
- **Editor**: VS Code (recomendado)

### Contas e Serviços Obrigatórios

| Serviço | Propósito | Plano | Custo |
|---------|-----------|-------|-------|
| **Vercel** | Hosting principal | Hobby/Pro | $0-$20/mês |
| **Google Cloud** | Gemini API (IA) | Free tier | $0-$5/mês |
| **Upstash Redis** | Banco de dados KV | Free tier | $0/mês |
| **Neon PostgreSQL** | Banco de dados SQL | Free tier | $0/mês |

### Contas e Serviços Opcionais

| Serviço | Propósito | Quando Usar |
|---------|-----------|-------------|
| **Sentry** | Error tracking | Recomendado para produção |
| **Qdrant Cloud** | Busca vetorial | Se usar RAG avançado |
| **Resend** | Envio de emails | Se precisar notificações |
| **Railway** | DSPy Bridge | Se usar otimização de prompts |

---

## 📝 Configuração de Variáveis de Ambiente

### Estrutura de Arquivos

```
📁 Projeto
├── .env                    # Local - desenvolvimento (NUNCA commitar)
├── .env.example            # Template com todas variáveis
├── .env.local.example      # Template local alternativo
├── .env.vercel.production  # Referência para Vercel
└── .env.test               # Ambiente de testes
```

### Variáveis Obrigatórias

#### 1. Google Gemini API (Motor de IA)

```bash
# Obtenha em: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=AIza...seu-token-aqui
GEMINI_API_KEY=AIza...seu-token-aqui  # Mesma chave para backend
VITE_GEMINI_MODEL=gemini-2.5-pro
```

**Como obter:**
1. Acesse https://aistudio.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

#### 2. Upstash Redis (Armazenamento)

```bash
# Obtenha em: https://console.upstash.com/redis
UPSTASH_REDIS_REST_URL=https://YOUR-ENDPOINT.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR-TOKEN-HERE
```

**Como obter:**
1. Acesse https://console.upstash.com/redis
2. Crie uma conta (login via GitHub ou email)
3. Clique em "Create Database"
4. Escolha região "São Paulo (GRU)" para menor latência
5. Copie "REST URL" e "REST Token" da aba "REST API"

#### 3. PostgreSQL (Minutas)

```bash
# Obtenha em: https://console.neon.tech
DATABASE_URL=postgres://user:password@host:5432/database?sslmode=require
```

**Como obter:**
1. Acesse https://console.neon.tech
2. Crie conta gratuita
3. Clique em "Create Project"
4. Escolha região "São Paulo" ou "US East"
5. Copie a "Connection String" completa

#### 4. Autenticação (Modo Simples para Desenvolvimento)

```bash
# Para desenvolvimento local (login: adm/adm123)
VITE_AUTH_MODE=simple

# Para produção com Google OAuth
VITE_AUTH_MODE=google
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
VITE_REDIRECT_URI=https://seu-dominio.vercel.app
```

### Variáveis Recomendadas (Produção)

#### 5. Monitoramento e Analytics

```bash
# Sentry - Error Tracking
VITE_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/project-id
VITE_ENABLE_PII_FILTERING=true  # LGPD - sempre true em produção

# Google Analytics (Opcional)
VITE_GTM_ID=GTM-XXXXXXX
VITE_GA4_ID=G-XXXXXXXXXX
```

#### 6. Notificações por Email (Opcional)

```bash
# Resend API
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@seudominio.com
ADMIN_EMAIL=admin@seudominio.com
```

### Variáveis Opcionais Avançadas

#### 7. Busca Vetorial (Qdrant)

```bash
# Apenas se for usar RAG avançado
QDRANT_URL=https://your-cluster.cloud.qdrant.io:6333
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_COLLECTION=legal_docs
QDRANT_VECTOR_SIZE=768
```

#### 8. Otimização de Prompts (DSPy Bridge)

```bash
# Apenas se implementar DSPy Bridge
DSPY_BRIDGE_URL=https://your-app.railway.app
DSPY_API_TOKEN=your-secure-token-here
DSPY_PORT=8765
```

#### 9. Integração Todoist (Tarefas)

```bash
# Opcional - Gestão de tarefas
TODOIST_API_TOKEN=your-todoist-token
```

---

## 🌐 Opções de Deployment

### Opção 1: Vercel (Recomendado) ⭐

**Vantagens:**
- ✅ Deploy automático via GitHub
- ✅ Serverless functions integradas
- ✅ CDN global automático
- ✅ SSL gratuito
- ✅ Preview deployments para PRs

**Limitações:**
- ⚠️ Plano Hobby: máximo 12 serverless functions
- ⚠️ Plano Pro necessário para 15+ endpoints ($20/mês)

**Quando usar:** Produção principal, ideal para 90% dos casos

### Opção 2: Railway

**Vantagens:**
- ✅ Suporta containers Docker
- ✅ Banco de dados PostgreSQL integrado
- ✅ Ideal para DSPy Bridge (Python)
- ✅ $5 de crédito gratuito/mês

**Limitações:**
- ⚠️ Requer configuração manual
- ⚠️ Sem CDN nativo

**Quando usar:** Para deploy do DSPy Bridge ou backend customizado

### Opção 3: Docker (Self-Hosted)

**Vantagens:**
- ✅ Controle total do ambiente
- ✅ Pode rodar on-premise
- ✅ Ideal para corporações

**Limitações:**
- ⚠️ Requer infraestrutura própria
- ⚠️ Mais complexo de configurar
- ⚠️ Você gerencia updates e segurança

**Quando usar:** Ambientes corporativos com requisitos específicos

---

## 🛠️ Configuração Passo a Passo

### Parte 1: Setup Local (Desenvolvimento)

#### Passo 1: Clonar e Instalar

```bash
# Clone o repositório
git clone https://github.com/thiagobodevanadv-alt/assistente-juridico-p.git
cd assistente-juridico-p

# Instalar dependências
npm install

# Instalar dependências do backend
cd backend
npm install
cd ..
```

#### Passo 2: Configurar Variáveis Locais

```bash
# Copiar template
cp .env.example .env

# Editar com suas chaves
nano .env  # ou code .env
```

**Mínimo para rodar localmente:**

```bash
# .env
VITE_AUTH_MODE=simple
VITE_GEMINI_API_KEY=AIza...
GEMINI_API_KEY=AIza...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
DATABASE_URL=postgres://...
```

#### Passo 3: Inicializar Banco de Dados

```bash
# Inicializar schema PostgreSQL
cd backend
npm run db:init
cd ..
```

#### Passo 4: Testar Localmente

```bash
# Terminal 1 - Frontend
npm run dev
# Acesse: http://localhost:5173

# Terminal 2 - Backend (em outra aba)
cd backend
npm run dev
# API rodando em: http://localhost:3001
```

#### Passo 5: Validar Configuração

```bash
# Verificar tipos TypeScript
npm run type-check

# Verificar lint
npm run lint

# Rodar testes
npm run test:run

# Build de produção
npm run build
```

### Parte 2: Deploy no Vercel (Produção)

#### Passo 1: Preparar Repositório

```bash
# Commitar mudanças (se houver)
git add .
git commit -m "chore: preparar para deploy"
git push origin main
```

#### Passo 2: Conectar ao Vercel

1. Acesse https://vercel.com/new
2. Clique em "Import Git Repository"
3. Selecione seu repositório GitHub
4. Clique em "Import"

#### Passo 3: Configurar Build Settings

**Framework Preset:** Vite
**Root Directory:** `./`
**Build Command:** `npm run build:deploy`
**Output Directory:** `dist`
**Install Command:** `npm ci --include=dev`

#### Passo 4: Adicionar Environment Variables

No Vercel Dashboard → Settings → Environment Variables:

**Adicione TODAS as variáveis obrigatórias:**

```bash
# Copie do seu .env local
VITE_GEMINI_API_KEY=...
GEMINI_API_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
DATABASE_URL=...
VITE_AUTH_MODE=simple  # ou google
VITE_ENABLE_PII_FILTERING=true
```

**Scope das variáveis:**
- ✅ Production
- ✅ Preview
- ✅ Development

#### Passo 5: Deploy

Clique em "Deploy" → Aguarde ~2-5 minutos

**URL de produção:**
```
https://seu-projeto.vercel.app
```

### Parte 3: Configuração Pós-Deploy

#### Passo 1: Testar Health Check

```bash
curl https://seu-projeto.vercel.app/api/health
# Esperado: {"status":"ok","timestamp":"..."}
```

#### Passo 2: Testar Autenticação

1. Acesse `https://seu-projeto.vercel.app`
2. Login com `adm` / `adm123` (se VITE_AUTH_MODE=simple)
3. Verifique se dashboard carrega

#### Passo 3: Testar Agentes IA

1. Navegue até "Chat com Harvey"
2. Digite qualquer pergunta jurídica
3. Aguarde resposta (deve levar 2-5s)
4. Verifique se resposta é coerente

#### Passo 4: Monitorar Logs

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Ver logs em tempo real
vercel logs --follow
```

---

## ✅ Validação e Testes

### Checklist de Validação

Use este checklist antes de considerar o deploy concluído:

#### Build e Deploy

- [ ] `npm run type-check` passa sem erros
- [ ] `npm run lint` tem 0 erros (warnings OK se < 150)
- [ ] `npm run build` completa com sucesso
- [ ] Deploy no Vercel completo sem erros
- [ ] URL de produção acessível

#### Funcionalidades Core

- [ ] Login funciona (adm/adm123 ou Google OAuth)
- [ ] Dashboard carrega sem erros
- [ ] Chat com Harvey responde corretamente
- [ ] Processos podem ser criados/editados
- [ ] Minutas podem ser criadas no editor Tiptap
- [ ] Calculadora de prazos funciona

#### APIs e Integrações

- [ ] `/api/health` retorna 200 OK
- [ ] `/api/status` retorna dados do sistema
- [ ] `/api/agents?action=status` lista 15 agentes
- [ ] Upstash Redis conecta (ver logs)
- [ ] PostgreSQL conecta (ver logs)
- [ ] Gemini API responde (testar chat)

#### Monitoramento

- [ ] Sentry recebendo eventos (se configurado)
- [ ] Logs aparecem no Vercel Dashboard
- [ ] Métricas de performance visíveis
- [ ] Erros são capturados e reportados

#### Segurança

- [ ] HTTPS ativo (Vercel faz automaticamente)
- [ ] PII Filtering habilitado (`VITE_ENABLE_PII_FILTERING=true`)
- [ ] Variáveis sensíveis não expostas no frontend
- [ ] CORS configurado corretamente
- [ ] Headers de segurança presentes (ver `vercel.json`)

### Script de Validação Automática

Crie um arquivo `scripts/validar-deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🔍 Validando deploy do Assistente Jurídico PJe..."

# 1. Health Check
echo "✅ Testando health check..."
curl -f https://seu-projeto.vercel.app/api/health || exit 1

# 2. Status
echo "✅ Testando status..."
curl -f https://seu-projeto.vercel.app/api/status || exit 1

# 3. Agentes
echo "✅ Verificando agentes..."
AGENTS=$(curl -s https://seu-projeto.vercel.app/api/agents?action=status | jq '.agents | length')
if [ "$AGENTS" -ne 15 ]; then
  echo "❌ Esperado 15 agentes, encontrado $AGENTS"
  exit 1
fi

# 4. Frontend
echo "✅ Testando frontend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://seu-projeto.vercel.app)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "❌ Frontend retornou $HTTP_CODE"
  exit 1
fi

echo "🎉 Validação completa! Deploy OK."
```

Execute:

```bash
chmod +x scripts/validar-deploy.sh
./scripts/validar-deploy.sh
```

---

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Build falha com "No more than 12 Serverless Functions"

**Erro:**
```
Error: No more than 12 Serverless Functions can be added to a Deployment 
on the Hobby plan.
```

**Solução:**
- Upgrade para Vercel Pro Plan ($20/mês)
- OU consolidar endpoints (não recomendado)

**Como fazer upgrade:**
1. Vercel Dashboard → Settings → Billing
2. Change Plan → Pro
3. Deploy novamente

#### 2. Variáveis de ambiente não carregam

**Sintomas:**
- Gemini retorna erro de API key inválida
- Upstash/PostgreSQL não conectam
- Agentes não respondem

**Solução:**
1. Verificar no Vercel Dashboard → Settings → Environment Variables
2. Garantir que variáveis têm scope "Production"
3. Redeployar: `vercel --prod --force`
4. Limpar cache: Settings → General → Clear Build Cache

#### 3. CORS bloqueando requisições

**Sintomas:**
- Erro no console: "CORS policy blocked"
- APIs não respondem do frontend

**Solução:**
Verificar `vercel.json` tem headers corretos:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

#### 4. TypeScript build errors

**Erro:**
```
TS2307: Cannot find module '@/components/...'
```

**Solução:**
```bash
# Limpar cache
rm -rf node_modules dist
npm ci
npm run build
```

#### 5. Gemini API não responde

**Sintomas:**
- Chat não responde
- Erro: "API key invalid"

**Verificações:**
1. API key está correta e ativa em https://aistudio.google.com/app/apikey
2. Variável `VITE_GEMINI_API_KEY` configurada no Vercel
3. Quota não excedida (1500 req/dia no free tier)
4. Modelo `gemini-2.5-pro` está disponível

**Teste local:**
```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=$VITE_GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

#### 6. PostgreSQL timeout

**Sintomas:**
- Erro: "Connection timeout"
- Minutas não salvam

**Solução:**
1. Verificar `DATABASE_URL` tem `?sslmode=require`
2. Testar conexão:
```bash
psql "$DATABASE_URL" -c "SELECT 1;"
```
3. Verificar IP allowlist no Neon (deve permitir 0.0.0.0/0 para Vercel)

#### 7. Upstash Redis não conecta

**Sintomas:**
- Erro: "ECONNREFUSED"
- Processos/expedientes não salvam

**Solução:**
1. Testar REST endpoint:
```bash
curl "$UPSTASH_REDIS_REST_URL/ping" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```
2. Verificar região do database (deve ser GRU para menor latência)
3. Regenerar token se necessário (Upstash Console → Database → REST API)

---

## 📚 Recursos Adicionais

### Documentação Técnica

| Documento | Descrição |
|-----------|-----------|
| `README.md` | Visão geral do projeto |
| `DEPLOY_CHECKLIST.md` | Checklist de deploy |
| `VERCEL_DEPLOYMENT_GUIDE.md` | Guia específico Vercel |
| `.env.example` | Template de variáveis |
| `docs/HYBRID_ARCHITECTURE.md` | Arquitetura do sistema |

### Links Úteis

| Serviço | URL |
|---------|-----|
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Gemini API Keys** | https://aistudio.google.com/app/apikey |
| **Upstash Console** | https://console.upstash.com/redis |
| **Neon Console** | https://console.neon.tech |
| **Sentry** | https://sentry.io |
| **GitHub Repo** | https://github.com/thiagobodevanadv-alt/assistente-juridico-p |

### Comandos Rápidos

```bash
# Desenvolvimento local
npm run dev                    # Frontend em http://localhost:5173
cd backend && npm run dev      # Backend em http://localhost:3001

# Validações
npm run type-check             # Verificar TypeScript
npm run lint                   # Verificar código
npm run test:run               # Rodar testes

# Build
npm run build                  # Build frontend
npm run build:deploy           # Build completo (frontend + backend)

# Deploy
vercel                         # Deploy preview
vercel --prod                  # Deploy produção
vercel logs --follow           # Ver logs em tempo real

# Troubleshooting
vercel env pull                # Baixar variáveis do Vercel
vercel --force                 # Forçar rebuild
```

---

## 🎯 Próximos Passos

Após completar este guia:

1. ✅ **Configurar Custom Domain** (opcional)
   - Vercel Dashboard → Domains → Add Domain
   - Configurar DNS (A/CNAME records)

2. ✅ **Habilitar Analytics** (recomendado)
   - Vercel Analytics (grátis no Pro)
   - Google Analytics (configurar GTM_ID)

3. ✅ **Configurar Alertas** (produção)
   - Sentry alerts para erros críticos
   - Uptime monitoring (UptimeRobot, Checkly)

4. ✅ **Backup Automático** (importante)
   - Configurar cron job `/api/cron?action=backup`
   - Configurar backup do PostgreSQL (Neon automático)

5. ✅ **Documentar Processos** (time)
   - Documentar runbook de incidentes
   - Criar guia de onboarding para equipe

---

## 📞 Suporte

**Problemas ou dúvidas?**

- 📖 Consulte o README principal
- 🐛 Abra uma issue no GitHub
- 💬 Consulte a documentação em `/docs`
- 🔍 Verifique logs no Vercel Dashboard

**Status do Sistema:**
- 🟢 Production: https://seu-projeto.vercel.app
- 📊 Status Page: https://vercel.com/status

---

**Versão do Guia:** 1.0.0
**Última Atualização:** Janeiro 2026
**Compatível com:** Assistente Jurídico PJe v1.4.0+
