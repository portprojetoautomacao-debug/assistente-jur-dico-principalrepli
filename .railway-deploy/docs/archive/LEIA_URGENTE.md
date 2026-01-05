# 🚨 ERRO 401 - AÇÃO NECESSÁRIA

## O que está acontecendo?

Seu aplicativo está retornando erro **401 (Não Autorizado)** porque falta configuração no Vercel.

## 🔧 Como Corrigir (3 passos simples)

### 1️⃣ Criar um Token do GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token (classic)"**
3. Nome: `Assistente Jurídico`
4. Marque estas permissões:
   - ✅ `repo`
   - ✅ `workflow`
5. Clique em **"Generate token"**
6. **COPIE O TOKEN** (começa com `ghp_...`)

### 2️⃣ Configurar no Vercel

1. Acesse: https://vercel.com (seu projeto)
2. Vá em **Settings** → **Environment Variables**
3. Adicione estas 3 variáveis:

```
Nome: GITHUB_TOKEN
Valor: ghp_seu_token_aqui
Ambientes: ✅ Production ✅ Preview ✅ Development

Nome: GITHUB_RUNTIME_PERMANENT_NAME
Valor: 97a1cb1e48835e0ecf1e
Ambientes: ✅ Production ✅ Preview ✅ Development

Nome: GITHUB_API_URL
Valor: https://api.github.com
Ambientes: ✅ Production ✅ Preview ✅ Development
```

### 3️⃣ Redesploy

1. Vá em **Deployments**
2. Clique nos 3 pontos (...) do último deploy
3. Clique em **"Redeploy"**
4. Aguarde completar

## ✅ Pronto!

Após o redeploy, o erro 401 deve desaparecer e o aplicativo funcionará normalmente.

## 📖 Guia Detalhado

Para mais informações, veja o arquivo `CORRECAO_ERRO_401.md`

## ❓ Dúvidas?

Se o erro persistir:
1. Verifique se o token começa com `ghp_`
2. Confirme que todas as variáveis foram salvas
3. Verifique os logs do Vercel
