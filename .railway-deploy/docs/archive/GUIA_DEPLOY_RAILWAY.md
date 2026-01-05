# 🚂 Guia de Deploy no Railway

> Deploy rápido com $5/mês grátis de crédito no Railway

## 🎯 Visão Geral

Railway é uma excelente plataforma para hospedar aplicações web com:

- ✅ **$5/mês grátis** em créditos (renovado mensalmente)
- ✅ **Sem sleep**: Aplicação sempre ativa
- ✅ Deploy automático via GitHub
- ✅ PostgreSQL grátis incluído
- ✅ SSL automático (HTTPS)
- ✅ Interface moderna e intuitiva
- ✅ Logs excelentes em tempo real

⚠️ **Requer cartão de crédito** para verificação (mas não cobra se ficar dentro do free tier)

## 📋 Pré-requisitos

- Conta no [Railway](https://railway.app) (grátis)
- Cartão de crédito para verificação
- Repositório no GitHub
- Credenciais do Google OAuth

## 🚀 Passo a Passo

### 1. Criar Conta no Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em **"Login"** ou **"Start a New Project"**
3. Faça login com GitHub
4. Autorize o Railway a acessar seus repositórios
5. Adicione cartão de crédito para verificação
   - Não se preocupe: **não será cobrado** se ficar dentro dos $5/mês

### 2. Criar Novo Projeto

1. No dashboard, clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Procure por `assistente-juridico-pje`
4. Clique no repositório

### 3. Configurar Variáveis de Ambiente

⚠️ **Importante**: Configure as variáveis **ANTES** do primeiro deploy

1. No projeto, clique na aba **"Variables"**
2. Adicione as seguintes variáveis:

#### Variáveis Obrigatórias

```
NODE_VERSION=20
VITE_APP_ENV=production
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
VITE_REDIRECT_URI=https://seu-app.up.railway.app
GITHUB_TOKEN=ghp_xxxxx
GITHUB_RUNTIME_PERMANENT_NAME=seu-runtime-name
```

#### Variáveis Opcionais

```
VITE_GEMINI_API_KEY=AIza... (alternativa ao Spark)
DJEN_TRIBUNAIS=TST,TRT3,TJMG,TRF1,TJES,TJSP,STJ
```

### 4. Configurar Build e Start

Railway detecta automaticamente projetos Node.js, mas você pode customizar:

1. Clique em **"Settings"**
2. Em **"Build"**, configure:
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
3. Em **"Deploy"**, configure:
   - **Root Directory**: `/` (raiz do projeto)
   - **Watch Paths**: `/src/**` (opcional)

### 5. Fazer o Deploy

1. Railway iniciará o build automaticamente
2. Aguarde ~3-5 minutos
3. Quando terminar: ✅ **Deploy successful!**

### 6. Obter a URL da Aplicação

1. No dashboard do projeto, clique em **"Settings"**
2. Role até **"Domains"**
3. Clique em **"Generate Domain"**
4. Copie a URL gerada (ex: `https://assistente-juridico-pje.up.railway.app`)

### 7. Atualizar OAuth e Variáveis

#### Google Cloud Console

1. Acesse [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. Edite seu OAuth Client ID
3. Em **"Authorized JavaScript origins"**, adicione:
   ```
   https://seu-app.up.railway.app
   ```
4. Em **"Authorized redirect URIs"**, adicione:
   ```
   https://seu-app.up.railway.app
   ```
5. Salve

#### Atualizar Variável no Railway

1. Volte ao Railway
2. Vá em **Variables**
3. Edite `VITE_REDIRECT_URI` para a URL correta
4. Railway fará redeploy automaticamente

### 8. Testar a Aplicação

1. Acesse a URL do Railway
2. Clique em **"Login com Google"**
3. Autorize o acesso
4. Deve funcionar perfeitamente! ✅

---

## 🚀 Deploy via Railway CLI (Avançado)

### Instalação

```bash
# Via npm
npm install -g @railway/cli

# Via brew (macOS)
brew install railway

# Via scoop (Windows)
scoop install railway
```

### Login

```bash
railway login
```

### Link ao Projeto

```bash
# Na pasta do projeto
railway link
```

### Deploy

```bash
railway up
```

### Gerenciar Variáveis

```bash
# Listar variáveis
railway variables

# Adicionar variável
railway variables set VITE_GOOGLE_CLIENT_ID="seu-client-id"

# Remover variável
railway variables delete NOME_VARIAVEL
```

---

## ⚙️ Configuração Avançada

### Custom Domain

1. Vá em **Settings** → **Domains**
2. Clique em **"Custom Domain"**
3. Digite seu domínio (ex: `app.seuescritorio.com.br`)
4. Configure o CNAME no seu provedor de DNS:
   ```
   CNAME app.seuescritorio.com.br → seu-app.up.railway.app
   ```
5. Aguarde propagação DNS (~15 minutos)
6. SSL será configurado automaticamente

### Adicionar PostgreSQL

Se precisar de banco de dados:

1. No projeto, clique em **"New"**
2. Selecione **"Database"** → **"PostgreSQL"**
3. O banco será criado e conectado automaticamente
4. Variável `DATABASE_URL` será adicionada automaticamente

### Deploy de Múltiplas Branches

1. Vá em **Settings** → **Deploy**
2. Em **"Deploy Triggers"**, configure:
   - **Production**: `main` branch
   - **Staging**: `develop` branch (crie novo service)

### Cron Jobs

Railway não tem cron nativo, mas você pode usar:

1. **GitHub Actions** para disparar builds
2. **Serviço externo** como [cron-job.org](https://cron-job.org)
3. **Railway Templates** com cron

---

## 📊 Monitoramento

### Logs em Tempo Real

1. No dashboard, clique em **"Deployments"**
2. Selecione o deployment ativo
3. Veja logs em tempo real com filtros:
   - Build logs
   - Application logs
   - System logs

### Métricas

1. Vá em **"Metrics"**
2. Veja:
   - CPU usage
   - Memory usage
   - Network I/O
   - Request count

### Alertas

Configure notificações:

1. Vá em **Settings** → **Notifications**
2. Ative notificações para:
   - Deploy failures
   - Build errors
   - Resource limits

---

## 🔧 Troubleshooting

### ❌ Build Falhou

**Erro:** `npm ERR! code ELIFECYCLE`

**Solução:**
```bash
# Limpe cache localmente
rm -rf node_modules package-lock.json
npm install
npm run build

# Se funcionar, comite e push novamente
```

No Railway:
1. **Settings** → **General**
2. **Restart Build**

---

### ❌ Aplicação não inicia

**Erro:** `Application failed to respond`

**Solução:**
- Verifique que `PORT` está correto
- Railway automaticamente define `PORT`, use `process.env.PORT` se tiver backend

Para este projeto (SPA), deve funcionar sem problemas com `npm start`.

---

### ❌ Creditos Acabaram

**Erro:** `Usage limit exceeded`

**Solução:**
- Railway oferece $5/mês grátis
- Se acabar, você pode:
  1. **Upgrade para plano pago** ($5/mês inicial)
  2. **Migrar para Render** (gratuito com sleep)
  3. **Esperar início do próximo mês** (créditos resetam)

**Monitorar uso:**
1. Vá em **Settings** → **Usage**
2. Veja consumo atual e estimativa mensal

---

### ❌ OAuth não funciona

**Erro:** Erro ao fazer login com Google

**Solução:**
1. Confirme que `VITE_REDIRECT_URI` está correto
2. Verifique se adicionou a URL no Google Cloud Console
3. Aguarde alguns minutos para propagar
4. Limpe cache do navegador

---

## 💰 Gestão de Custos

### Plano Gratuito

- **$5/mês em créditos** grátis
- **1 GB RAM** por serviço
- **1 GB disco** por serviço
- **100 GB banda** por mês

### O que consome créditos?

| Recurso | Custo Estimado |
|---------|----------------|
| **Web service (sempre ativo)** | ~$5-7/mês |
| **PostgreSQL** | Incluído no free tier |
| **Banda (100 GB)** | Incluído |

### Dicas para economizar:

1. **Otimize build**: Use `npm ci` ao invés de `npm install`
2. **Monitore uso**: Verifique consumo semanalmente
3. **Escale quando necessário**: Não use recursos desnecessários
4. **Use sleep em dev**: Para ambientes de desenvolvimento

---

## 🆚 Railway vs Outras Plataformas

| Feature | Railway | Vercel | Render |
|---------|---------|--------|--------|
| **Preço** | $5/mês grátis | Gratuito | Gratuito |
| **Sleep** | ❌ Não | ❌ Não | ✅ Sim (15 min) |
| **Cartão necessário** | ✅ Sim | ❌ Não | ❌ Não |
| **PostgreSQL** | ✅ Grátis | 💰 Pago | 💰 Pago |
| **Logs** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Interface** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Use Railway se:**
- ✅ Tem cartão de crédito
- ✅ Precisa de PostgreSQL grátis
- ✅ Quer aplicação sempre ativa
- ✅ $5/mês é suficiente para seu uso

**Use Vercel se:**
- ✅ Não quer fornecer cartão
- ✅ Precisa de performance máxima
- ✅ Quer preview de PRs automático

**Use Render se:**
- ✅ Não quer fornecer cartão
- ✅ Não se importa com sleep
- ✅ Quer 100% gratuito

---

## 📖 Recursos Úteis

- 📘 [Documentação Oficial](https://docs.railway.app/)
- 🎓 [Railway Templates](https://railway.app/templates)
- 💬 [Discord Community](https://discord.gg/railway)
- 🐛 [Status Page](https://status.railway.app/)

---

## 🎯 Checklist Final

Antes de considerar o deploy completo:

- [ ] Variáveis de ambiente configuradas
- [ ] URL do Railway adicionada no Google OAuth
- [ ] `VITE_REDIRECT_URI` atualizada
- [ ] Aplicação acessível via HTTPS
- [ ] Login com Google funcionando
- [ ] Dados persistindo corretamente
- [ ] Logs sem erros críticos
- [ ] Monitoramento de uso configurado

---

**Deploy concluído! Sua aplicação está no ar com Railway! 🚂**

**Próximos passos:**
- 📊 Monitore o uso de créditos semanalmente
- 🔔 Configure notificações de deploy
- 🗄️ Considere adicionar PostgreSQL se precisar de persistência
