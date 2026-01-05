# ⚡ Configuração Rápida - Vercel OAuth

**Guia completo:** [VERCEL_OAUTH_SETUP.md](./VERCEL_OAUTH_SETUP.md)

## 🎯 URLs Para Copiar e Colar

### 1. No Google Cloud Console

**Authorized JavaScript origins:**
```
https://assistente-juridico-ultimo.vercel.app
http://localhost:5173
```

**Authorized redirect URIs:**
```
https://assistente-juridico-ultimo.vercel.app
http://localhost:5173
```

### 2. Variáveis de Ambiente no Vercel

Vá em: **Settings → Environment Variables**

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | `seu-client-id.apps.googleusercontent.com` | Production, Preview, Development |
| `VITE_REDIRECT_URI` | `https://assistente-juridico-ultimo.vercel.app` | Production |
| `VITE_APP_ENV` | `production` | Production |
| `GITHUB_TOKEN` | `ghp_seu-token-aqui` | Production, Preview, Development |
| `GITHUB_RUNTIME_PERMANENT_NAME` | `97a1cb1e48835e0ecf1e` | Production, Preview, Development |

## 📝 Passos Rápidos

1. **Google Cloud Console** (https://console.cloud.google.com/apis/credentials)
   - Criar/editar OAuth Client ID
   - Adicionar URLs acima em "Authorized JavaScript origins"
   - Adicionar URLs acima em "Authorized redirect URIs"
   - Copiar Client ID

2. **Vercel Dashboard** (https://vercel.com/dashboard)
   - Ir em Settings → Environment Variables
   - Adicionar variáveis da tabela acima
   - Clicar em "Redeploy"

3. **Testar**
   - Acessar: https://assistente-juridico-ultimo.vercel.app
   - Clicar em "Login com Google"

## ❗ Erros Comuns

**"redirect_uri_mismatch"** → URL incorreta no Google Console
- ✅ Use exatamente: `https://assistente-juridico-ultimo.vercel.app` (sem `/` no final)
- ⏰ Aguarde 5-10 minutos após configurar

**"Invalid client ID"** → Variável não configurada no Vercel
- ✅ Adicione `VITE_GOOGLE_CLIENT_ID` em Production
- 🔄 Faça Redeploy

**Botão não aparece** → Console do navegador (F12) mostrará o erro
- ✅ Verifique se `VITE_GOOGLE_CLIENT_ID` está configurado
- 🔍 Teste em aba anônima

## 🔗 Links Úteis

- 📖 [Guia Completo Vercel](./VERCEL_OAUTH_SETUP.md)
- 🔐 [Criar Token GitHub](https://github.com/settings/tokens/new)
- ☁️ [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- 🚀 [Dashboard Vercel](https://vercel.com/dashboard)

---

**Precisa de ajuda?** Veja o guia completo em [VERCEL_OAUTH_SETUP.md](./VERCEL_OAUTH_SETUP.md)
