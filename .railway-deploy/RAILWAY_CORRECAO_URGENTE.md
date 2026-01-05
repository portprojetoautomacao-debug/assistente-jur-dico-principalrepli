# 🚨 CORREÇÃO URGENTE - Railway Configurado Incorretamente

## ❌ Problema Detectado

Variáveis **INCORRETAS** foram configuradas no Railway:

```bash
❌ VITE_REDIRECT_URI=https://assistente-juridico-pje.onrender.com
❌ VITE_APP_ENV=produção
❌ DJEN_TRIBUNAIS=TST,TRT3,TJMG,TRF1,TJES,TJSP,STJ
```

### Por que está errado?

1. **URL errada**: `onrender.com` é da plataforma **Render**, não usamos ela
   - ✅ URL correta: `https://assistente-juridico-github.vercel.app`

2. **Variáveis no lugar errado**: `VITE_*` são variáveis de **frontend** (Vercel)
   - Railway hospeda apenas **DSPy Bridge** (backend Python)
   - Frontend está no **Vercel**

3. **OAuth vai quebrar**: Google OAuth espera redirect para Vercel, não Render
   - Resultado: Erro `400: redirect_uri_mismatch`

---

## ✅ Solução - Passo a Passo (5 minutos)

### 1️⃣ Remover Variáveis Incorretas do Railway

Acesse: https://railway.app/project/609047f7-6398-45cc-8f64-35083f920139

Em **Settings → Variables**, **DELETE** estas variáveis:

```bash
❌ VITE_REDIRECT_URI
❌ VITE_APP_ENV
❌ DJEN_TRIBUNAIS
❌ GITHUB_API_URL (se existir - não é necessária no Railway)
```

### 2️⃣ Verificar Variáveis CORRETAS no Railway

Mantenha/adicione apenas estas:

```bash
✅ DSPY_API_TOKEN=IFoHADHNOrs/liJgUFDYKgnWVTAvMhfnotUxywmelho=
✅ DSPY_PORT=8765
✅ ALLOWED_ORIGINS=https://assistente-juridico-github.vercel.app
✅ NODE_ENV=production
✅ PYTHON_VERSION=3.11
✅ DSPY_LM_MODEL=openai/gpt-3.5-turbo
```

**Comando rápido via CLI:**

```bash
# Remover variáveis incorretas
railway variables --unset VITE_REDIRECT_URI
railway variables --unset VITE_APP_ENV
railway variables --unset DJEN_TRIBUNAIS
railway variables --unset GITHUB_API_URL

# Adicionar/atualizar variáveis corretas
railway variables --set "ALLOWED_ORIGINS=https://assistente-juridico-github.vercel.app"
railway variables --set "DSPY_PORT=8765"
railway variables --set "NODE_ENV=production"
railway variables --set "PYTHON_VERSION=3.11"
railway variables --set "DSPY_LM_MODEL=openai/gpt-3.5-turbo"
```

### 3️⃣ Configurar Variáveis CORRETAS no Vercel

Acesse: https://vercel.com/thiagobodevanadv-alt/assistente-juridico-p/settings/environment-variables

Adicione/atualize:

```bash
# Frontend/OAuth
VITE_REDIRECT_URI=https://assistente-juridico-github.vercel.app
VITE_APP_ENV=production
DJEN_TRIBUNAIS=TST,TRT3,TJMG,TRF1,TJES,TJSP,STJ
GITHUB_API_URL=https://api.github.com

# Conexão com Railway (depois que deploy Railway estiver ativo)
DSPY_BRIDGE_URL=https://assistente-juridico-pje-production-2d98.up.railway.app
DSPY_API_TOKEN=IFoHADHNOrs/liJgUFDYKgnWVTAvMhfnotUxywmelho=
VITE_DSPY_URL=https://assistente-juridico-pje-production-2d98.up.railway.app
VITE_DSPY_API_TOKEN=IFoHADHNOrs/liJgUFDYKgnWVTAvMhfnotUxywmelho=
```

**Comando rápido via Vercel CLI:**

```bash
# OAuth/Frontend
vercel env add VITE_REDIRECT_URI production
# Valor: https://assistente-juridico-github.vercel.app

vercel env add VITE_APP_ENV production
# Valor: production

vercel env add DJEN_TRIBUNAIS production
# Valor: TST,TRT3,TJMG,TRF1,TJES,TJSP,STJ

# Conexão Railway
vercel env add DSPY_BRIDGE_URL production
# Valor: https://assistente-juridico-pje-production-2d98.up.railway.app

vercel env add DSPY_API_TOKEN production
# Valor: IFoHADHNOrs/liJgUFDYKgnWVTAvMhfnotUxywmelho=
```

---

## 📊 Comparação: Railway vs Vercel

| Plataforma | Hospeda | Variáveis Necessárias |
|------------|---------|----------------------|
| **Railway** | DSPy Bridge (Python backend) | `DSPY_API_TOKEN`, `DSPY_PORT`, `ALLOWED_ORIGINS`, `NODE_ENV`, `PYTHON_VERSION`, `DSPY_LM_MODEL` |
| **Vercel** | Frontend React + API Functions | `VITE_*`, `DJEN_TRIBUNAIS`, `GITHUB_API_URL`, `DSPY_BRIDGE_URL`, etc. |

### Regra Simples:

- ✅ **Railway**: Apenas variáveis do backend Python (`DSPY_*`, `ALLOWED_ORIGINS`, `NODE_ENV`)
- ✅ **Vercel**: Variáveis frontend (`VITE_*`) + integrações externas (DJEN, GitHub, Google, etc.)
- ❌ **NUNCA**: Misturar variáveis frontend no Railway ou backend no Vercel

---

## 🧪 Validação Pós-Correção

Após fazer as correções, execute:

```bash
./scripts/validate-railway-setup.sh
```

Ou teste manualmente:

```bash
# 1. Verificar variáveis Railway
railway variables

# Deve mostrar APENAS:
# - DSPY_API_TOKEN
# - DSPY_PORT
# - ALLOWED_ORIGINS
# - NODE_ENV
# - PYTHON_VERSION
# - DSPY_LM_MODEL

# 2. Testar OAuth no Vercel (após deploy)
curl https://assistente-juridico-github.vercel.app/api/health

# 3. Testar DSPy Bridge Railway (após deploy)
curl https://assistente-juridico-pje-production-2d98.up.railway.app/health
```

---

## 🔥 Impacto se NÃO corrigir:

- ❌ **OAuth quebrado** - Usuários não conseguem fazer login
- ❌ **Redirecionamento falha** - Erro 400: redirect_uri_mismatch
- ❌ **CORS errors** - Frontend não consegue chamar APIs
- ❌ **Deploy Railway falha** - Variáveis `VITE_*` não são reconhecidas pelo Python
- ❌ **Confusão de ambiente** - `produção` vs `production`

---

## ✅ Checklist de Correção

- [ ] Remover `VITE_REDIRECT_URI` do Railway
- [ ] Remover `VITE_APP_ENV` do Railway
- [ ] Remover `DJEN_TRIBUNAIS` do Railway
- [ ] Verificar `ALLOWED_ORIGINS=https://assistente-juridico-github.vercel.app` no Railway
- [ ] Adicionar `VITE_REDIRECT_URI=https://assistente-juridico-github.vercel.app` no Vercel
- [ ] Adicionar `VITE_APP_ENV=production` no Vercel
- [ ] Adicionar `DJEN_TRIBUNAIS` no Vercel
- [ ] Testar OAuth no frontend Vercel
- [ ] Testar DSPy Bridge Railway

---

**⚡ Prioridade: CRÍTICA - Corrigir antes de qualquer deploy!**

URLs corretas do projeto:
- Frontend (Vercel): `https://assistente-juridico-github.vercel.app`
- DSPy Bridge (Railway): `https://assistente-juridico-pje-production-2d98.up.railway.app`
- ~~Render~~ ❌ **NÃO ESTAMOS USANDO RENDER!**
