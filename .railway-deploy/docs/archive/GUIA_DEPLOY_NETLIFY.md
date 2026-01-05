# 🌊 Guia de Deploy no Netlify

> Deploy rápido e gratuito do Assistente Jurídico PJe no Netlify

## 🎯 Visão Geral

O Netlify é excelente para aplicações React/Vite como esta. Oferece:

- ✅ Deploy automático via GitHub
- ✅ CDN global ultra-rápido
- ✅ 100 GB/mês de banda grátis
- ✅ SSL automático (HTTPS)
- ✅ Preview de Pull Requests
- ✅ Sem sleep (aplicação sempre ativa)

## 📋 Pré-requisitos

- Conta no [Netlify](https://netlify.com) (grátis)
- Repositório no GitHub
- Credenciais do Google OAuth configuradas

## 🚀 Método 1: Deploy via Interface Web (Mais Fácil)

### Passo 1: Acessar Netlify

1. Acesse [app.netlify.com](https://app.netlify.com)
2. Faça login com GitHub
3. Clique em **"Add new site"** → **"Import an existing project"**

### Passo 2: Conectar Repositório

1. Selecione **"GitHub"**
2. Autorize o Netlify a acessar seus repositórios
3. Procure por `assistente-juridico-pje`
4. Clique no repositório

### Passo 3: Configurar Build

| Campo | Valor |
|-------|-------|
| **Branch to deploy** | `main` |
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |

### Passo 4: Variáveis de Ambiente

Clique em **"Show advanced"** → **"New variable"** e adicione:

```
NODE_VERSION=20
VITE_APP_ENV=production
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
VITE_REDIRECT_URI=https://seu-site.netlify.app
GITHUB_TOKEN=ghp_xxxxx
GITHUB_RUNTIME_PERMANENT_NAME=seu-runtime-name
```

> 💡 **Dica**: Você pode atualizar `VITE_REDIRECT_URI` depois que obtiver a URL do Netlify

### Passo 5: Deploy

1. Clique em **"Deploy site"**
2. Aguarde o build (2-3 minutos)
3. Quando terminar: ✅ Site publicado!

### Passo 6: Configurar OAuth

1. Copie a URL do site (ex: `https://seu-site.netlify.app`)
2. Vá ao [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
3. Edite seu OAuth Client ID
4. Adicione a URL em **"Authorized JavaScript origins"**
5. Adicione a URL em **"Authorized redirect URIs"**
6. Salve

### Passo 7: Atualizar Variável

1. No Netlify, vá em **Site settings** → **Environment variables**
2. Edite `VITE_REDIRECT_URI` com a URL correta
3. Clique em **"Save"**
4. Vá em **Deploys** → **Trigger deploy** → **"Deploy site"**

---

## 🚀 Método 2: Deploy via CLI (Avançado)

### Passo 1: Instalar Netlify CLI

```bash
npm install -g netlify-cli
```

### Passo 2: Login

```bash
netlify login
```

Isso abrirá o navegador para você autorizar.

### Passo 3: Criar arquivo netlify.toml

Crie o arquivo `netlify.toml` na raiz do projeto:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
  VITE_APP_ENV = "production"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Passo 4: Build Local

```bash
npm run build
```

### Passo 5: Deploy

#### Deploy de Teste (Preview)

```bash
netlify deploy
```

#### Deploy para Produção

```bash
netlify deploy --prod
```

### Passo 6: Configurar Variáveis

```bash
# Definir variáveis de ambiente
netlify env:set VITE_GOOGLE_CLIENT_ID "seu-client-id.apps.googleusercontent.com"
netlify env:set VITE_REDIRECT_URI "https://seu-site.netlify.app"
netlify env:set GITHUB_TOKEN "ghp_xxxxx"
netlify env:set GITHUB_RUNTIME_PERMANENT_NAME "seu-runtime-name"
```

---

## 🚀 Método 3: Deploy via Git (Drag & Drop)

### Passo Único

1. Acesse [app.netlify.com/drop](https://app.netlify.com/drop)
2. Faça o build localmente: `npm run build`
3. Arraste a pasta `dist/` para a área de drop
4. Pronto! Site publicado instantaneamente

⚠️ **Limitação**: Não configura deploy automático. Você precisa fazer upload manual a cada atualização.

---

## ⚙️ Configuração Avançada

### Custom Domain

1. Vá em **Domain settings**
2. Clique em **"Add custom domain"**
3. Digite seu domínio (ex: `app.seuescritorio.com.br`)
4. Configure DNS conforme instruções do Netlify
5. SSL será configurado automaticamente

### Deploy Previews (Pull Requests)

O Netlify automaticamente cria uma preview URL para cada PR!

1. Abra um Pull Request no GitHub
2. Aguarde o build no Netlify
3. Veja a URL de preview nos checks do PR
4. Teste antes de fazer merge

### Netlify Functions (APIs Serverless)

Se você quiser criar APIs serverless:

1. Crie pasta `netlify/functions/`
2. Adicione arquivos `.js` ou `.ts`
3. Deploy automático!

Exemplo: `netlify/functions/hello.js`

```javascript
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello World" })
  };
};
```

Acesse em: `https://seu-site.netlify.app/.netlify/functions/hello`

---

## 🔧 Troubleshooting

### ❌ Build falha com "npm ERR!"

**Solução:**
```bash
# Limpe cache e reinstale
rm -rf node_modules package-lock.json
npm install
npm run build
```

Se funcionar localmente, vá em:
1. **Site settings** → **Build & deploy** → **Environment**
2. Adicione: `NPM_FLAGS=--legacy-peer-deps` (se necessário)

---

### ❌ Página em branco após deploy

**Causa**: Problema com paths ou SPA routing

**Solução**: Certifique-se que o `netlify.toml` tem o redirect:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### ❌ "Failed to fetch" ou erro 403

**Solução:**
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme `GITHUB_TOKEN` e `GITHUB_RUNTIME_PERMANENT_NAME`
- Veja logs em **Deploys** → Seu deploy → **Deploy log**

---

### ❌ OAuth não funciona

**Solução:**
1. Confirme que adicionou a URL do Netlify no Google Cloud Console
2. Verifique `VITE_REDIRECT_URI` nas variáveis de ambiente
3. Aguarde ~5 minutos para propagar
4. Limpe cache do navegador

---

## 📊 Limites do Plano Gratuito

| Recurso | Limite Gratuito |
|---------|-----------------|
| **Banda** | 100 GB/mês |
| **Build minutes** | 300 min/mês |
| **Sites** | Ilimitado |
| **Team members** | 1 |
| **Functions requests** | 125k/mês |
| **Functions runtime** | 100 horas/mês |

Para a maioria dos projetos pessoais, isso é **mais que suficiente**! 🎉

---

## ⚡ Otimizações

### Cache de Build

O Netlify automaticamente faz cache de `node_modules` entre builds. Para limpar:

1. Vá em **Deploys**
2. **Deploy settings** → **Clear cache and deploy site**

### Build Hooks

Crie URLs que disparam builds automaticamente:

1. **Site settings** → **Build & deploy** → **Build hooks**
2. Clique em **"Add build hook"**
3. Use a URL gerada para disparar builds via webhook

### Split Testing

Teste múltiplas versões do site:

1. Vá em **Split testing**
2. Selecione branches para testar
3. Defina % de tráfego para cada
4. Netlify distribui automaticamente!

---

## 📊 Monitoramento

### Analytics (Pago)

O Netlify oferece analytics, mas é pago ($9/mês). Alternativas gratuitas:

- **Google Analytics**: Gratuito, completo
- **Plausible**: Open source, privado
- **Umami**: Self-hosted, gratuito

### Logs

1. Vá em **Deploys**
2. Clique no deploy
3. Veja **Deploy log** ou **Function log**

---

## 🔄 Deploy Contínuo

### Configurar Auto-Deploy

Por padrão, o Netlify faz deploy automático a cada push na branch `main`.

Para desabilitar:

1. **Site settings** → **Build & deploy**
2. **Continuous deployment**
3. Desative **"Auto publishing"**

### Deploy Branches Específicas

1. **Site settings** → **Build & deploy**
2. **Branch deploys**
3. Escolha **"Let me add individual branches"**
4. Adicione branches (ex: `develop`, `staging`)

---

## 📖 Recursos Úteis

- 📘 [Documentação Oficial](https://docs.netlify.com/)
- 🎓 [Netlify Tutorials](https://www.netlify.com/blog/tutorials/)
- 💬 [Community Forum](https://answers.netlify.com/)

---

## 🆚 Netlify vs Vercel vs Render

| Feature | Netlify | Vercel | Render |
|---------|---------|--------|--------|
| **Facilidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Sleep** | ❌ Não | ❌ Não | ✅ Sim |
| **Banda grátis** | 100 GB | 100 GB | 100 GB |
| **Build time** | 300 min | Ilimitado | Ilimitado |
| **Serverless** | ✅ Sim | ✅ Sim | ❌ Não |

**Recomendação:**
- Use **Vercel** se precisar de performance máxima
- Use **Netlify** se preferir interface mais simples
- Use **Render** se quiser 100% gratuito sem cartão

---

**Deploy concluído! Sua aplicação está no ar com Netlify! 🎉**
