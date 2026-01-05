# 🚀 Guia Completo de Deploy no Render

> Deploy 100% gratuito do Assistente Jurídico PJe no Render em 15 minutos

## 📋 Índice

1. [Por que Render?](#por-que-render)
2. [Pré-requisitos](#pré-requisitos)
3. [Passo a Passo](#passo-a-passo)
4. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
5. [Configuração do Google OAuth](#configuração-do-google-oauth)
6. [Deploy Automático](#deploy-automático)
7. [Troubleshooting](#troubleshooting)
8. [Limitações do Plano Gratuito](#limitações-do-plano-gratuito)

## Por que Render?

✅ **Vantagens:**
- **100% Gratuito** para aplicações web estáticas
- **Deploy automático** a cada push no GitHub
- **SSL grátis** (HTTPS automático)
- **Builds rápidos** com cache de dependências
- **Interface simples** e intuitiva
- **Sem necessidade de cartão de crédito**
- **750 horas/mês grátis** (suficiente para uso contínuo)

⚠️ **Limitações:**
- Aplicação "dorme" após 15 minutos de inatividade (primeira requisição pode demorar 30-60s)
- 512 MB de RAM no plano gratuito
- 100 GB de largura de banda por mês

## Pré-requisitos

Antes de começar, você precisa ter:

- ✅ Conta no GitHub (com o repositório do projeto)
- ✅ Conta no [Render](https://render.com) (criar é grátis)
- ✅ Credenciais do Google OAuth configuradas (veja [OAUTH_SETUP.md](./OAUTH_SETUP.md))
- ✅ Token do GitHub (para funcionalidades de IA com Spark)

## Passo a Passo

### 1. Criar Conta no Render

1. Acesse [render.com](https://render.com)
2. Clique em **"Get Started for Free"**
3. Faça login com sua conta do GitHub
4. Autorize o Render a acessar seus repositórios

### 2. Criar Novo Web Service

1. No dashboard do Render, clique em **"New +"**
2. Selecione **"Web Service"**
3. Conecte seu repositório:
   - Se não aparecer, clique em **"Configure account"** e autorize o repositório
   - Procure por `assistente-juridico-pje` ou o nome do seu fork
4. Clique em **"Connect"**

### 3. Configurar o Serviço

Na tela de configuração, preencha:

#### Configurações Básicas

| Campo | Valor |
|-------|-------|
| **Name** | `assistente-juridico-pje` (ou qualquer nome único) |
| **Region** | `Oregon (US West)` ou `Frankfurt (EU Central)` |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm start` |

#### Plano

- Selecione **"Free"** (0 USD/mês)

### 4. Configurar Variáveis de Ambiente

⚠️ **IMPORTANTE**: Antes de fazer o deploy, configure as variáveis de ambiente necessárias.

Clique em **"Advanced"** e adicione as seguintes variáveis:

#### Variáveis Obrigatórias

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `NODE_VERSION` | `20` | Versão do Node.js |
| `VITE_APP_ENV` | `production` | Ambiente da aplicação |
| `VITE_REDIRECT_URI` | `https://seu-app.onrender.com` | URL do seu app (atualize após deploy) |
| `VITE_GOOGLE_CLIENT_ID` | `seu-client-id.apps.googleusercontent.com` | OAuth Google Client ID |
| `GITHUB_RUNTIME_PERMANENT_NAME` | `seu-runtime-name` | Nome do runtime do Spark |
| `GITHUB_TOKEN` | `ghp_xxxxx` ou `github_pat_xxxxx` | Token do GitHub |

#### Variáveis Opcionais

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `VITE_GEMINI_API_KEY` | `AIza...` | API key do Google Gemini (alternativa ao Spark) |
| `DJEN_TRIBUNAIS` | `TST,TRT3,TJMG,TRF1,TJES,TJSP,STJ` | Tribunais para monitorar |

> 💡 **Dica**: O arquivo `render.yaml` no repositório já contém essas configurações. O Render detectará automaticamente.

### 5. Fazer o Deploy

1. Revise todas as configurações
2. Clique em **"Create Web Service"**
3. Aguarde o build e deploy (leva ~3-5 minutos)
4. Quando terminar, você verá: ✅ **"Your service is live"**

### 6. Obter a URL do Aplicativo

Após o deploy bem-sucedido:

1. No dashboard, encontre a URL do seu app: `https://seu-app.onrender.com`
2. **IMPORTANTE**: Copie esta URL, você precisará dela para configurar o OAuth

## Configuração do Google OAuth

Após obter a URL do Render, você precisa atualizar as configurações do Google OAuth:

### 1. Atualizar Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Selecione seu projeto OAuth
3. Clique no **Client ID** que você criou
4. Em **"Authorized JavaScript origins"**, adicione:
   ```
   https://seu-app.onrender.com
   ```
5. Em **"Authorized redirect URIs"**, adicione:
   ```
   https://seu-app.onrender.com
   ```
6. Clique em **"Save"**

### 2. Atualizar Variável no Render

1. Volte ao dashboard do Render
2. Vá em **Environment** no menu lateral
3. Edite a variável `VITE_REDIRECT_URI`
4. Atualize o valor para: `https://seu-app.onrender.com`
5. Clique em **"Save Changes"**
6. O Render fará um novo deploy automaticamente

### 3. Testar a Aplicação

1. Acesse `https://seu-app.onrender.com`
2. Clique em **"Login com Google"**
3. Autorize o acesso
4. Você deve ser redirecionado para o dashboard ✅

## Deploy Automático

O Render monitora automaticamente o branch configurado. **A cada push no GitHub**, um novo deploy é iniciado automaticamente!

### Ver Logs de Deploy

1. No dashboard do Render, clique no seu serviço
2. Vá na aba **"Logs"**
3. Você verá os logs do build e da aplicação em tempo real

### Suspender Deploy Automático

Se quiser desabilitar deploy automático:

1. Vá em **Settings**
2. Em **"Build & Deploy"**, desative **"Auto-Deploy"**
3. Depois, você pode fazer deploy manual clicando em **"Manual Deploy"**

## Troubleshooting

### ❌ Build Falhou

**Erro:** `npm ERR! code ELIFECYCLE`

**Solução:**
- Verifique se o `package.json` está correto
- Confirme que `NODE_VERSION` está definida como `20`
- Veja os logs completos em **Logs** → **Build Logs**

---

### ❌ Aplicação não inicia

**Erro:** `Failed to start service`

**Solução:**
- Verifique o **Start Command**: deve ser `npm start`
- Confirme que o build gerou a pasta `dist/`
- Veja os logs em **Logs** → **Deploy Logs**

---

### ❌ Erro 403 ou "Failed to fetch"

**Erro:** Aplicação abre mas mostra erros ao carregar dados

**Solução:**
- Verifique se `GITHUB_TOKEN` está configurado corretamente
- Confirme que `GITHUB_RUNTIME_PERMANENT_NAME` está correto
- Veja [CORRECAO_403_VERCEL_JSON.md](./CORRECAO_403_VERCEL_JSON.md) para mais detalhes

---

### ❌ OAuth não funciona

**Erro:** Erro ao fazer login com Google

**Solução:**
1. Confirme que `VITE_REDIRECT_URI` está correto
2. Verifique se adicionou a URL do Render no Google Cloud Console
3. Aguarde alguns minutos (pode demorar para propagar)
4. Limpe o cache do navegador e tente novamente

---

### ⏱️ App muito lento na primeira requisição

**Isso é esperado!** No plano gratuito, a aplicação "dorme" após 15 minutos de inatividade. A primeira requisição pode demorar 30-60 segundos para "acordar" o serviço.

**Soluções:**
- **Upgrade para plano pago** ($7/mês) - mantém o app sempre ativo
- **Use um serviço de ping** como [UptimeRobot](https://uptimerobot.com/) (gratuito) para fazer ping a cada 5 minutos
- **Aceite a limitação** - após a primeira requisição, a resposta é rápida

## Limitações do Plano Gratuito

### ⚠️ O que você precisa saber:

| Limitação | Descrição | Como contornar |
|-----------|-----------|----------------|
| **Sleep após inatividade** | App dorme após 15 min sem uso | Use UptimeRobot para ping automático |
| **512 MB RAM** | Memória limitada | Suficiente para esta aplicação |
| **100 GB/mês de banda** | Largura de banda mensal | Suficiente para uso moderado |
| **750 horas/mês** | Tempo de execução | Suficiente se usar 1 serviço |
| **Sem persistência de dados** | Arquivos temporários são perdidos | Use Vercel KV ou banco externo |

### ✅ O que funciona perfeitamente:

- ✅ Deploy automático via GitHub
- ✅ SSL/HTTPS gratuito
- ✅ Builds rápidos com cache
- ✅ Logs em tempo real
- ✅ Rollback para versões anteriores
- ✅ Múltiplos ambientes (dev, staging, prod)

## Próximos Passos

Agora que sua aplicação está no ar:

1. ✅ Configure o monitoramento de uptime com [UptimeRobot](https://uptimerobot.com/)
2. ✅ Configure notificações de deploy no Render
3. ✅ Explore o [Dashboard de Métricas](https://dashboard.render.com/) do Render
4. 📖 Leia sobre [outras plataformas gratuitas](./PLATAFORMAS_DEPLOY_GRATIS.md)

## Comparação com Outras Plataformas

Quer ver outras opções gratuitas? Veja:

- 📖 [PLATAFORMAS_DEPLOY_GRATIS.md](./PLATAFORMAS_DEPLOY_GRATIS.md) - Comparação completa
- 📖 [GUIA_DEPLOY_RAILWAY.md](./GUIA_DEPLOY_RAILWAY.md) - Deploy no Railway
- 📖 [GUIA_DEPLOY_NETLIFY.md](./GUIA_DEPLOY_NETLIFY.md) - Deploy no Netlify

## Suporte

Precisa de ajuda?

- 📖 [TROUBLESHOOTING_DEPLOY.md](./TROUBLESHOOTING_DEPLOY.md)
- 📖 [README.md](./README.md)
- 🐛 [Abra uma issue](https://github.com/seu-usuario/assistente-juridico-pje/issues)

---

**Feito com ❤️ para a comunidade jurídica**
