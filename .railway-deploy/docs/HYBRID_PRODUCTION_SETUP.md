# 🚀 Hybrid AI Architecture - Production Setup Guide

## 📋 Visão Geral

Este guia detalha os passos necessários para colocar a arquitetura híbrida em produção no Vercel.

**Status Atual**: ✅ PRs #191 e #192 merged - Stubs implementados com segurança

**Próxima Etapa**: Configurar variáveis de ambiente e deploy

---

## ✅ Pré-Requisitos

### 1. Dependências Node.js

```bash
npm install
```

> **NOTA**: A dependência `resend` está opcional. Instale apenas se for usar email service:
> ```bash
> npm install resend
> ```

### 2. Conta Vercel

- Projeto já configurado em: https://assistente-juridico-github.vercel.app/
- Acesso ao Vercel Dashboard

### 3. Serviços Externos (Opcionais)

| Serviço | Status | Necessário para |
|---------|--------|-----------------|
| **Qdrant Cloud** | 🟡 Opcional | Vector search e RAG |
| **DSPy Bridge** | 🟡 Opcional | Otimização de prompts |
| **AutoGen** | ✅ Implementado | Orquestração de agentes (local apenas) |
| **Resend** | 🟡 Opcional | Email notifications |

---

## 🔧 Configuração Passo-a-Passo

### PASSO 1: Variáveis de Ambiente no Vercel

Acesse: **Vercel Dashboard → Settings → Environment Variables**

#### 📌 Variáveis Obrigatórias (Já Configuradas)

```env
# Motor de IA Principal
GEMINI_API_KEY=your-gemini-api-key
VITE_GEMINI_API_KEY=your-gemini-api-key

# Storage
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Sentry (Monitoramento)
VITE_SENTRY_DSN=your-sentry-dsn
```

#### 🆕 Variáveis da Arquitetura Híbrida (Adicionar)

```env
# AutoGen Orchestrator API Key
# Gere um token seguro de 32+ caracteres
AUTOGEN_API_KEY=<GENERATE_SECURE_TOKEN>

# Qdrant Vector Database (Opcional)
# Deixe em branco se não for usar RAG
VITE_QDRANT_URL=
VITE_QDRANT_API_KEY=
VITE_QDRANT_COLLECTION=legal_docs

# DSPy Bridge Service (Opcional)
# Deixe em branco se não for usar otimização de prompts
VITE_DSPY_URL=
VITE_DSPY_API_TOKEN=

# Email Service (Opcional)
# Deixe em branco se não for usar notificações por email
RESEND_API_KEY=
RESEND_FROM_EMAIL=assistente@assistente-juridico-github.vercel.app
```

#### 🔐 Como Gerar Tokens Seguros

```bash
# Gerar AUTOGEN_API_KEY
openssl rand -base64 32

# Ou use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

### PASSO 2: Deploy Vercel

#### Método 1: Push Automático (Recomendado)

```bash
git push origin main
```

O Vercel detecta automaticamente e inicia o deploy.

#### Método 2: Deploy Manual via CLI

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Deploy para produção
vercel --prod
```

---

### PASSO 3: Configurar Qdrant (Opcional)

Se quiser usar **vector search e RAG**:

#### Opção A: Qdrant Cloud (Recomendado para produção)

1. Acesse: https://cloud.qdrant.io/
2. Crie uma conta gratuita
3. Crie um cluster (free tier = 1GB)
4. Copie:
   - **Cluster URL**: `https://xyz.qdrant.io`
   - **API Key**: Gere em Settings → API Keys
5. Adicione no Vercel:
   ```env
   VITE_QDRANT_URL=https://xyz.qdrant.io
   VITE_QDRANT_API_KEY=your-qdrant-api-key
   ```

#### Opção B: Qdrant Self-Hosted (Dev/Testing)

```bash
# Docker local (não funciona em Vercel)
docker run -p 6333:6333 qdrant/qdrant
```

---

### PASSO 4: Configurar DSPy Bridge (Opcional)

Se quiser usar **otimização automática de prompts**:

#### Requisitos

- Python 3.8+
- Servidor dedicado ou cloud function separada

#### Instalação

```bash
# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variável
export DSPY_API_TOKEN="$(openssl rand -base64 32)"

# Iniciar bridge
python scripts/dspy_bridge.py
```

#### Deploy do Bridge (Opções)

| Opção | Prós | Contras |
|-------|------|---------|
| **Fly.io** | Grátis, Python nativo | Configuração adicional |
| **Railway** | Fácil deploy | Limite de horas grátis |
| **AWS Lambda** | Escalável | Complexo, cold start |
| **Google Cloud Run** | Escalável | Requer GCP |

**Recomendação**: Deixe o DSPy Bridge para **Fase 2** (otimização futura).

---

### PASSO 5: Configurar Email Service (Opcional)

Se quiser usar **notificações por email**:

1. Acesse: https://resend.com/
2. Crie uma conta gratuita (100 emails/dia)
3. Adicione um domínio verificado ou use teste
4. Copie a **API Key**
5. Adicione no Vercel:
   ```env
   RESEND_API_KEY=re_your-api-key
   RESEND_FROM_EMAIL=assistente@seu-dominio.com
   ```
6. **Instale a dependência**:
   ```bash
   npm install resend
   git add package.json package-lock.json
   git commit -m "feat: adicionar resend para email service"
   git push
   ```

---

### PASSO 6: Validação Pós-Deploy

#### 1. Health Check

```bash
curl https://assistente-juridico-github.vercel.app/api/status?type=health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2024-12-07T...",
  "environment": "production"
}
```

#### 2. Testar AutoGen Orchestrator

```bash
curl -X POST https://assistente-juridico-github.vercel.app/api/agents/autogen_orchestrator \
  -H "Authorization: Bearer YOUR_AUTOGEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Analisar processo 1234567-89.2024.5.02.0999",
    "agents": ["harvey", "justine"]
  }'
```

#### 3. Verificar Logs

```bash
# Via Vercel CLI
vercel logs --follow

# Ou no dashboard: https://vercel.com/assistente-juridico-p/logs
```

---

## 📊 Monitoramento de Produção

### Sentry (Error Tracking)

- **Dashboard**: https://sentry.io/
- **Alertas**: Configurar para erros críticos
- **Performance**: Monitorar latência dos agentes

### Vercel Analytics

- **URL**: https://vercel.com/assistente-juridico-p/analytics
- **Métricas**: Core Web Vitals, Speed Index, etc.

### Upstash Redis

- **Dashboard**: https://console.upstash.com/
- **Métricas**: Comandos/seg, Latência, Storage usado

---

## 🚨 Troubleshooting

### Erro: "Cannot find module 'resend'"

**Causa**: Dependência `resend` não instalada.

**Solução**:
```bash
npm install resend
git add package.json package-lock.json
git commit -m "feat: adicionar resend"
git push
```

Ou **desabilite email service** (stubs vão retornar erro, mas não quebra o sistema).

---

### Erro: "AUTOGEN_API_KEY not configured"

**Causa**: Variável de ambiente não configurada.

**Solução**:
1. Acesse Vercel Dashboard → Environment Variables
2. Adicione: `AUTOGEN_API_KEY=<token-gerado>`
3. Redeploy: `vercel --prod` ou push para main

---

### Erro: "Qdrant API error: 401 Unauthorized"

**Causa**: API Key inválida ou não configurada.

**Solução**:
1. Verifique `VITE_QDRANT_API_KEY` no Vercel
2. Regenere API key no Qdrant Cloud se necessário
3. Redeploy

---

### Erro: "Timeout" em `/api/agents/autogen_orchestrator`

**Causa**: Limite de 45s do Vercel.

**Solução**:
- Reduza `maxRounds` na requisição
- Use menos agentes por vez
- Considere dividir tarefas complexas

---

## 📈 Roadmap de Implementação

### ✅ Fase 1: Foundation (COMPLETA)

- [x] Stubs implementados (PRs #191, #192)
- [x] Configuração Vercel
- [x] Documentação

### 🔄 Fase 2: Integração Completa (Próxima)

- [ ] Implementar LangGraph workflows completos
- [ ] Integrar Qdrant para RAG
- [ ] Adicionar testes E2E para novos endpoints
- [ ] Implementar DSPy optimization

### 🚀 Fase 3: Produção Full (Futuro)

- [ ] AutoGen multi-agent conversations
- [ ] Prompt optimization automática
- [ ] Monitoring avançado
- [ ] Fine-tuning de prompts com métricas

---

## 🔗 Links Úteis

| Recurso | URL |
|---------|-----|
| **App Produção** | https://assistente-juridico-github.vercel.app/ |
| **Vercel Dashboard** | https://vercel.com/assistente-juridico-p |
| **Qdrant Cloud** | https://cloud.qdrant.io/ |
| **Resend** | https://resend.com/ |
| **Sentry** | https://sentry.io/ |
| **Docs Híbrida** | `/docs/HYBRID_ARCHITECTURE.md` |
| **Stubs README** | `/docs/HYBRID_STUBS_README.md` |

---

## 💡 Dicas de Segurança

1. **Nunca commite tokens** - Use `.env` e Vercel Environment Variables
2. **Rotacione API keys** - Troque periodicamente (a cada 90 dias)
3. **Rate limiting** - Implementado em todos os stubs (100 req/min)
4. **Timeout protection** - 30-45s máximo por operação
5. **Input validation** - Zod schemas em todos os endpoints
6. **CORS restrito** - Apenas origens autorizadas

---

## 📞 Suporte

**Problemas?** Abra uma issue no GitHub:
https://github.com/thiagobodevan-a11y/assistente-juridico-p/issues

**Documentação adicional**:
- `HYBRID_ARCHITECTURE.md` - Visão técnica completa
- `HYBRID_STUBS_README.md` - Detalhes dos stubs implementados
- `.env.example` - Todas as variáveis disponíveis
