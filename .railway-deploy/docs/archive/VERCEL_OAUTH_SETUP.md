# Configuração Google OAuth para Vercel - Guia Completo

## 🎯 Resumo Executivo

Este aplicativo usa **Google Sign-In One Tap** para autenticação. Você precisa configurar:
1. URLs autorizadas no Google Cloud Console
2. Variáveis de ambiente no Vercel
3. Client ID do Google no código

## 📋 URLs do Seu Aplicativo Vercel

Com base no seu deployment, estas são as URLs corretas:

### ✅ URL de Produção (Recomendada)
```
https://assistente-juridico-ultimo.vercel.app
```

### 🔧 URLs de Preview (Opcional - para testes)
```
https://assistente-juridico-ultimo-git-main-thiagos-projects-9834ca6f.vercel.app
https://assistente-juridico-ultimo-nmozt2qx2-thiagos-projects-9834ca6f.vercel.app
```

**Nota:** URLs de preview mudam a cada novo deploy. Para facilitar, configure apenas a URL de produção.

---

## 🚀 Passo a Passo de Configuração

### 1️⃣ Configurar Google Cloud Console

#### A. Acessar Console de Credenciais
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Selecione seu projeto (ou crie um novo)

#### B. Criar/Editar OAuth Client ID
1. Clique em **"Create Credentials"** → **"OAuth client ID"**
   - Se já existe, clique no nome para editar
2. Tipo de aplicação: **Web application**
3. Nome: `Assistente Jurídico PJe - Vercel`

#### C. Configurar Authorized JavaScript Origins

⚠️ **IMPORTANTE:** O Google Sign-In One Tap requer **Authorized JavaScript origins**, NÃO redirect URIs tradicionais.

Adicione as seguintes URLs em **"Authorized JavaScript origins"**:

```
https://assistente-juridico-ultimo.vercel.app
http://localhost:5173
```

**Opcional** - Para preview deployments, adicione também:
```
https://assistente-juridico-ultimo-git-main-thiagos-projects-9834ca6f.vercel.app
```

#### D. Configurar Authorized redirect URIs

Adicione as mesmas URLs em **"Authorized redirect URIs"**:

```
https://assistente-juridico-ultimo.vercel.app
http://localhost:5173
```

**Por quê adicionar em ambos?** 
- **JavaScript origins** → Para Google Sign-In One Tap funcionar
- **Redirect URIs** → Para compatibilidade com Google Calendar API e outros serviços OAuth

#### E. Salvar e Copiar Client ID

1. Clique em **"Save"**
2. **Copie o Client ID** - formato: `xxxxx.apps.googleusercontent.com`
3. ⚠️ **NÃO precisa do Client Secret** para Google Sign-In One Tap

---

### 2️⃣ Configurar Variáveis de Ambiente no Vercel

#### A. Acessar Configurações do Projeto
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: `assistente-juridico-ultimo`
3. Vá em **Settings** → **Environment Variables**

#### B. Adicionar Variáveis Necessárias

Adicione as seguintes variáveis (clique em "Add" para cada uma):

##### 1. VITE_GOOGLE_CLIENT_ID (Obrigatória)
- **Key:** `VITE_GOOGLE_CLIENT_ID`
- **Value:** `seu-client-id-aqui.apps.googleusercontent.com` (cole o Client ID copiado)
- **Environment:** Marque **Production**, **Preview** e **Development**

##### 2. VITE_REDIRECT_URI (Obrigatória)
- **Key:** `VITE_REDIRECT_URI`
- **Value:** `https://assistente-juridico-ultimo.vercel.app`
- **Environment:** Marque **Production** apenas
  
Para Preview (opcional):
- **Value:** `https://assistente-juridico-ultimo-git-main-thiagos-projects-9834ca6f.vercel.app`
- **Environment:** Marque **Preview** apenas

##### 3. VITE_APP_ENV (Obrigatória)
- **Key:** `VITE_APP_ENV`
- **Value:** `production`
- **Environment:** Marque **Production** apenas

##### 4. GITHUB_TOKEN (Obrigatória - para Spark API)
- **Key:** `GITHUB_TOKEN`
- **Value:** `ghp_xxxxxxxxxxxxxxxxxxxx` (seu GitHub Personal Access Token)
- **Environment:** Marque **Production**, **Preview** e **Development**
- **Como criar:**
  1. Acesse: https://github.com/settings/tokens/new
  2. Scopes necessários: `repo`, `workflow`
  3. Clique em "Generate token"
  4. Copie o token (só aparece uma vez!)

##### 5. GITHUB_RUNTIME_PERMANENT_NAME (Obrigatória - para Spark API)
- **Key:** `GITHUB_RUNTIME_PERMANENT_NAME`
- **Value:** `97a1cb1e48835e0ecf1e` (encontre no arquivo `runtime.config.json` do seu projeto)
- **Environment:** Marque **Production**, **Preview** e **Development**

#### C. Variáveis Opcionais (Recomendadas)

##### Google Gemini API (Alternativa ao Spark LLM)
- **Key:** `VITE_GEMINI_API_KEY`
- **Value:** Sua API Key do Gemini
- **Environment:** Todos os ambientes
- **Como obter:** https://aistudio.google.com/app/apikey

##### Vercel KV (Para armazenamento persistente)
- Estas são configuradas automaticamente quando você adiciona Vercel KV ao projeto
- Não precisa adicionar manualmente

---

### 3️⃣ Verificar runtime.config.json

O arquivo `runtime.config.json` na raiz do projeto deve conter:

```json
{
  "runtime": "97a1cb1e48835e0ecf1e",
  "version": "1.0.0"
}
```

Se o valor for diferente, use esse valor na variável `GITHUB_RUNTIME_PERMANENT_NAME`.

---

### 4️⃣ Testar a Configuração

#### A. Fazer Novo Deploy
Após configurar as variáveis:
1. Vá em **Deployments** no Vercel
2. Clique em **Redeploy** no último deployment
3. Aguarde o deploy finalizar

#### B. Testar Google Sign-In
1. Acesse: `https://assistente-juridico-ultimo.vercel.app`
2. Procure pelo botão "Login com Google"
3. Clique para testar o login

#### C. Verificar Erros
Se aparecer erro:
1. Abra o Console do Navegador (F12)
2. Vá na aba "Console"
3. Procure por erros relacionados a:
   - `VITE_GOOGLE_CLIENT_ID`
   - `redirect_uri_mismatch`
   - `origin_mismatch`

---

## 🔍 Solução de Problemas Comuns

### ❌ Erro: "redirect_uri_mismatch"

**Causa:** A URL no Google Cloud Console não corresponde exatamente à URL do Vercel.

**Solução:**
1. Verifique se adicionou a URL **EXATA** em "Authorized JavaScript origins"
2. Inclua `https://` (não `http://`)
3. NÃO adicione barra `/` no final
4. Aguarde 5-10 minutos para propagação

### ❌ Erro: "Invalid client ID"

**Causa:** `VITE_GOOGLE_CLIENT_ID` não está configurado ou está incorreto.

**Solução:**
1. Verifique no Vercel se a variável está em Production
2. Copie novamente do Google Cloud Console
3. Faça redeploy

### ❌ Erro: "GITHUB_RUNTIME_PERMANENT_NAME not set"

**Causa:** Variável de ambiente para Spark API não configurada.

**Solução:**
1. Adicione `GITHUB_RUNTIME_PERMANENT_NAME=97a1cb1e48835e0ecf1e` no Vercel
2. Adicione `GITHUB_TOKEN` com token válido
3. Faça redeploy

### ❌ Login funciona local mas não no Vercel

**Causa:** Variáveis de ambiente não propagadas corretamente.

**Solução:**
1. No Vercel, vá em Settings → Environment Variables
2. Verifique se marcou **Production** para todas as variáveis
3. Clique em **Redeploy** (não apenas fazer novo commit)

### ❌ Botão do Google não aparece

**Causa:** Script do Google não carrega ou configuração incorreta.

**Solução:**
1. Abra Console do navegador (F12)
2. Verifique se há erro de CORS ou Content Security Policy
3. Verifique se `VITE_GOOGLE_CLIENT_ID` está configurado
4. Teste em aba anônima (pode ser extensão bloqueando)

---

## 📝 Checklist Final

Antes de testar, confirme:

- [ ] ✅ Client ID criado no Google Cloud Console
- [ ] ✅ Authorized JavaScript origins configurado com URL do Vercel
- [ ] ✅ Authorized redirect URIs configurado com URL do Vercel  
- [ ] ✅ `VITE_GOOGLE_CLIENT_ID` adicionado no Vercel (Production)
- [ ] ✅ `VITE_REDIRECT_URI` adicionado no Vercel (Production)
- [ ] ✅ `VITE_APP_ENV=production` adicionado no Vercel (Production)
- [ ] ✅ `GITHUB_TOKEN` adicionado no Vercel (todos ambientes)
- [ ] ✅ `GITHUB_RUNTIME_PERMANENT_NAME` adicionado no Vercel (todos ambientes)
- [ ] ✅ Redeploy feito após adicionar variáveis
- [ ] ✅ Aguardou 5-10 minutos para propagação do Google
- [ ] ✅ Testou em aba anônima

---

## 🎓 Entendendo a Diferença: Google Sign-In vs OAuth Tradicional

### Google Sign-In One Tap (usado neste projeto)
- ✅ Mais simples de implementar
- ✅ Melhor UX (popup nativo do Google)
- ✅ Não precisa de callback route no backend
- ✅ Client ID é público (pode ficar no frontend)
- ⚠️ Requer **Authorized JavaScript origins**

### OAuth Tradicional (NÃO usado neste projeto)
- Requer callback route (ex: `/api/auth/callback`)
- Precisa de Client Secret (servidor)
- Requer **Authorized redirect URIs**
- Mais controle sobre fluxo de autenticação

**Este projeto usa Google Sign-In One Tap**, por isso você NÃO precisa:
- ❌ Criar rota de callback
- ❌ Configurar Client Secret no servidor
- ❌ NextAuth ou biblioteca similar

---

## 📚 Referências Úteis

- **Google Sign-In Guide:** https://developers.google.com/identity/gsi/web/guides/overview
- **Vercel Environment Variables:** https://vercel.com/docs/projects/environment-variables
- **GitHub Personal Access Tokens:** https://github.com/settings/tokens

---

## 🆘 Precisa de Ajuda?

Se após seguir este guia você ainda tiver problemas:

1. **Verifique os logs do Vercel:**
   - Vá em Deployments → clique no deploy → Runtime Logs
   - Procure por erros nas funções `/api/spark-proxy` ou `/api/llm-proxy`

2. **Verifique o Console do navegador:**
   - Abra a aplicação no navegador
   - Pressione F12
   - Vá na aba Console
   - Procure por erros em vermelho

3. **Cole o erro completo** ao pedir ajuda, incluindo:
   - Mensagem de erro do console
   - Logs do Vercel (se houver)
   - URL que está tentando acessar

---

**Última atualização:** 2025-11-18
**Versão:** 1.0
