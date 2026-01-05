# ⚡ Configuração Rápida - GitHub Secrets para Deploy Vercel

**Projeto:** assistente-jurídico-último  
**Data:** 18 de novembro de 2025

---

## 🎯 Copy & Paste - Configuração em 5 Minutos

### Passo 1: Obter VERCEL_ORG_ID

**Execute no terminal:**

```bash
cd /home/runner/work/assistente-jurdico-p/assistente-jurdico-p

# Se não tem Vercel CLI instalado
npm install -g vercel@latest

# Login (abrirá navegador)
vercel login

# Vincular ao projeto
vercel link
# Selecione: thiagos-projects-9834ca6f
# Projeto: assistente-jurídico-último

# Ver o ORG_ID
cat .vercel/project.json
```

**Copie o valor de `"orgId"`** - será algo como:
- `team_xxxxxxxxxxxxxxxxxxxxx` OU
- `user_xxxxxxxxxxxxxxxxxxxxx`

---

### Passo 2: Adicionar Secrets no GitHub

**URL direta:** https://github.com/thiagobodevan-a11y/assistente-jurdico-p/settings/secrets/actions

Clique em **"New repository secret"** e adicione cada um:

#### Secret 1/6: VERCEL_TOKEN ✅
```
Nome: VERCEL_TOKEN
Valor: ROh3NzABqd1N5Ksm68N3n68L
```
*Salvar secret*

#### Secret 2/6: VERCEL_PROJECT_ID ✅
```
Nome: VERCEL_PROJECT_ID
Valor: 5BKmD71HE
```
*Salvar secret*

#### Secret 3/6: VERCEL_ORG_ID ⚠️
```
Nome: VERCEL_ORG_ID
Valor: [Cole o orgId do Passo 1]
```
*Salvar secret*

#### Secret 4/6: VITE_REDIRECT_URI ✅
```
Nome: VITE_REDIRECT_URI
Valor: https://assistente-jurídico-último.vercel.app
```
*Salvar secret*

#### Secret 5/6: VITE_GOOGLE_CLIENT_ID ⚠️
```
Nome: VITE_GOOGLE_CLIENT_ID
Valor: [Seu Google Client ID]
```
*Se não tem, veja: [Como obter](#como-obter-google-oauth)*  
*Salvar secret*

#### Secret 6/6: VITE_GOOGLE_API_KEY ⚠️
```
Nome: VITE_GOOGLE_API_KEY
Valor: [Sua Google API Key]
```
*Se não tem, veja: [Como obter](#como-obter-google-oauth)*  
*Salvar secret*

---

### Passo 3: Configurar Variáveis no Vercel

**URL direta:** https://vercel.com/thiagos-projects-9834ca6f/assistente-jurídico-último/settings/environment-variables

Clique em **"Add New"** e adicione cada uma:

#### Variável 1/4: VITE_GOOGLE_CLIENT_ID
```
Key: VITE_GOOGLE_CLIENT_ID
Value: [Mesmo valor usado no GitHub]
Environments: ✅ Production  ✅ Preview  ✅ Development
```
*Save*

#### Variável 2/4: VITE_GOOGLE_API_KEY
```
Key: VITE_GOOGLE_API_KEY
Value: [Mesmo valor usado no GitHub]
Environments: ✅ Production  ✅ Preview  ✅ Development
```
*Save*

#### Variável 3/4: VITE_REDIRECT_URI
```
Key: VITE_REDIRECT_URI
Value: https://assistente-jurídico-último.vercel.app
Environments: ✅ Production  ✅ Preview  ✅ Development
```
*Save*

#### Variável 4/6: VITE_APP_ENV
```
Key: VITE_APP_ENV
Value: production
Environments: ✅ Production  ⬜ Preview  ⬜ Development
```
*Save*

#### Variável 5/6: GITHUB_TOKEN ⚠️ IMPORTANTE
```
Key: GITHUB_TOKEN
Value: [Token do GitHub com scopes: repo, workflow]
Environments: ✅ Production  ✅ Preview  ✅ Development
```
*Obter em: https://github.com/settings/tokens/new*  
*Necessário para evitar erros 403 do Spark API*  
*Save*

#### Variável 6/6: GITHUB_RUNTIME_PERMANENT_NAME ⚠️ IMPORTANTE
```
Key: GITHUB_RUNTIME_PERMANENT_NAME
Value: [Valor do arquivo runtime.config.json - ex: 97a1cb1e48835e0ecf1e]
Environments: ✅ Production  ✅ Preview  ✅ Development
```
*Obter executando: cat runtime.config.json*  
*Necessário para evitar erros 403 do Spark API*  
*Save*

**Importante:** Após salvar todas, clique em **"Redeploy"** no último deployment para aplicar as variáveis.

**Veja também:** `CONFIGURACAO_GITHUB_APP_E_SPARK.md` para configuração detalhada do GitHub App e solução de erros 403.

---

### Passo 4: Testar Deploy

**Método 1: Deploy Manual**

1. Vá para: https://github.com/thiagobodevan-a11y/assistente-jurdico-p/actions
2. Clique em **"Deploy"** (workflow)
3. Clique em **"Run workflow"**
4. Selecione branch: `main`
5. Selecione environment: `production`
6. Clique em **"Run workflow"**
7. Aguarde ~2-3 minutos
8. Verifique se concluiu com sucesso ✅

**Método 2: Deploy via PR**

```bash
# No terminal:
git checkout -b test/deploy-config
echo "# Teste deploy automático" >> TEST.md
git add TEST.md
git commit -m "test: configuração deploy"
git push origin test/deploy-config
```

No GitHub:
1. Abra um Pull Request
2. Aguarde workflow executar
3. Verifique comentário com URL de preview

---

## ✅ Checklist de Verificação

Marque conforme for completando:

### GitHub Secrets
- [ ] `VERCEL_TOKEN` = `ROh3NzABqd1N5Ksm68N3n68L` ✅
- [ ] `VERCEL_PROJECT_ID` = `5BKmD71HE` ✅
- [ ] `VERCEL_ORG_ID` = `[obtido via vercel link]` ⚠️
- [ ] `VITE_REDIRECT_URI` = `https://assistente-jurídico-último.vercel.app` ✅
- [ ] `VITE_GOOGLE_CLIENT_ID` = `[configurado]` ⚠️
- [ ] `VITE_GOOGLE_API_KEY` = `[configurado]` ⚠️

### Vercel Environment Variables
- [ ] `VITE_GOOGLE_CLIENT_ID` configurado
- [ ] `VITE_GOOGLE_API_KEY` configurado
- [ ] `VITE_REDIRECT_URI` configurado
- [ ] `VITE_APP_ENV` configurado
- [ ] Redeploy feito após adicionar variáveis

### Testes
- [ ] Deploy manual testado e bem-sucedido
- [ ] Deploy via PR testado e bem-sucedido
- [ ] URL de preview funcionando
- [ ] App abre sem erros em produção

---

## 📋 Como Obter Google OAuth

### Google Cloud Console

1. **Acesse:** https://console.cloud.google.com/apis/credentials

2. **Selecione ou crie um projeto**

3. **Criar OAuth 2.0 Client ID:**
   - Clique em **"Create Credentials"**
   - Selecione **"OAuth 2.0 Client ID"**
   - Application type: **"Web application"**
   - Name: `Assistente Jurídico PJe`
   
4. **Configurar Authorized redirect URIs:**
   ```
   http://localhost:5173
   https://assistente-jurídico-último.vercel.app
   ```

5. **Copiar Client ID:**
   - Formato: `xxxxx.apps.googleusercontent.com`
   - Use em `VITE_GOOGLE_CLIENT_ID`

6. **Criar API Key:**
   - Clique em **"Create Credentials"**
   - Selecione **"API key"**
   - Copie a chave gerada
   - Use em `VITE_GOOGLE_API_KEY`

**Documentação completa:** [OAUTH_SETUP.md](./OAUTH_SETUP.md)

---

## 🔧 Troubleshooting Rápido

### ❌ Deploy falha com "Invalid token"
```
Solução: Verifique se o token ROh3NzABqd1N5Ksm68N3n68L está correto
Verifique em: GitHub → Settings → Secrets → VERCEL_TOKEN
```

### ❌ Deploy falha com "Project not found"
```
Solução: Confirme VERCEL_PROJECT_ID = 5BKmD71HE
Execute: vercel link para verificar
```

### ❌ Build bem-sucedido mas app não carrega
```
Solução: Variáveis de ambiente faltando no Vercel
1. Acesse Vercel → Settings → Environment Variables
2. Adicione todas as 4 variáveis listadas no Passo 3
3. Faça Redeploy
```

### ❌ Erro 403 "Failed to fetch KV key"
```
Solução: Configure GITHUB_TOKEN no Vercel também
Veja: QUICK_FIX_403.md
```

---

## 📚 Documentação Completa

- **DADOS_VERCEL_PROJETO.md** - Todos os dados do projeto Vercel
- **CONFIGURACAO_VERCEL_TOKEN.md** - Guia detalhado do token
- **GITHUB_SECRETS_CHECKLIST.md** - Checklist completo
- **OAUTH_SETUP.md** - Configuração Google OAuth

---

## 🎯 Status Atual

### ✅ Confirmado e Pronto
- Token Vercel: `ROh3NzABqd1N5Ksm68N3n68L`
- Project ID: `5BKmD71HE`
- URL Produção: `https://assistente-jurídico-último.vercel.app`
- Workflows atualizados e validados

### ⚠️ Requer Ação do Usuário
- Obter VERCEL_ORG_ID via `vercel link`
- Configurar Google OAuth (Client ID + API Key)
- Adicionar os 6 secrets no GitHub
- Adicionar as 4 variáveis no Vercel
- Testar deploy

### 📊 Tempo Estimado
- **Configuração completa:** 10-15 minutos
- **Se já tem Google OAuth:** 5 minutos
- **Primeiro deploy:** 2-3 minutos

---

## 💡 Dicas

1. **Copie os valores exatos** - Um espaço extra pode causar erro
2. **Não exponha os secrets** - Nunca compartilhe publicamente
3. **Teste em staging primeiro** - Use preview deployments
4. **Mantenha documentado** - Anote onde guardou as credenciais

---

**Data:** 18 de novembro de 2025  
**Projeto:** assistente-jurídico-último  
**URL:** https://assistente-jurídico-último.vercel.app  
**Status:** ⚡ Pronto para configuração
