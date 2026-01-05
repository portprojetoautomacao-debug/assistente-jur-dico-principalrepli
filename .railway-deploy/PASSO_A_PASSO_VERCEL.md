# 🎯 Passo a Passo - Resolva Agora em 5 Minutos

## ✅ STATUS: Variável já configurada

Você confirmou que `VITE_GOOGLE_CLIENT_ID` está configurada no Vercel. Ótimo!

Agora precisamos garantir que o **deploy mais recente** está usando essa variável.

---

## 🔄 PASSO 1: Force um Redeploy (IMPORTANTE)

Se você adicionou a variável DEPOIS do último deploy, o build não tem ela ainda.

### Como fazer:

1. Acesse: https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/deployments

2. Você verá uma lista de deployments. O primeiro deve ser:
   ```
   ✅ Ready  fix: corrigir Google OAuth para produção Vercel  (bdc6aa7)
   ```

3. Clique nesse deployment

4. No canto superior direito, clique no botão **"... (três pontos)"**

5. Selecione **"Redeploy"**

6. Confirme clicando em **"Redeploy"** novamente

7. Aguarde ~2 minutos até aparecer **"Ready"** ✅

---

## 🔍 PASSO 2: Verifique se a Variável Está no Build

Após o redeploy, teste:

1. Acesse: https://assistente-juridico-github.vercel.app

2. Pressione **F12** (abre DevTools)

3. Vá na aba **Console**

4. Cole este comando e pressione Enter:
   ```javascript
   console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID?.substring(0, 30));
   ```

### Resultado esperado:
```
✅ Client ID: 123456789012-abcdefghijklmn...
```

### Se mostrar `undefined`:
```
❌ Client ID: undefined
```
**Causa**: Variável não foi incluída no build  
**Solução**: Verifique se selecionou **Production** ao adicionar a variável no Vercel

---

## 📋 PASSO 3: Verifique URLs no Google Cloud Console

Mesmo com a variável correta, o Google precisa autorizar as URLs.

1. Acesse: https://console.cloud.google.com/apis/credentials

2. Clique no projeto que contém suas credenciais OAuth

3. Clique no **Client ID** que você está usando

4. **Verifique** se estas URLs estão em **"Authorized JavaScript origins"**:
   ```
   https://assistente-juridico-github.vercel.app
   https://assistente-juridico-github.vercel.app
   ```

5. **Verifique** se estas URLs estão em **"Authorized redirect URIs"**:
   ```
   https://assistente-juridico-github.vercel.app
   https://assistente-juridico-github.vercel.app
   ```

6. Se faltarem, clique em **"+ ADD URI"** e adicione

7. Clique em **"SAVE"** no final da página

8. **Aguarde 5 minutos** para as mudanças propagarem nos servidores do Google

---

## 🧪 PASSO 4: Teste o Login

1. Acesse: https://assistente-juridico-github.vercel.app

2. **Hard refresh** (Ctrl+Shift+R ou Cmd+Shift+R)

3. Você deve ver o botão **"Sign in with Google"**

4. Clique no botão

5. **Popup do Google deve abrir** ✅

6. Faça login

7. Dashboard deve aparecer ✅

---

## ⚠️ Problemas Comuns

### 1. App ainda fica "Carregando..."

**Causa**: Cache do browser  
**Solução**: 
- Hard refresh (Ctrl+Shift+R)
- Ou teste em aba anônima
- Ou limpe cache do site

### 2. Erro "redirect_uri_mismatch"

**Causa**: URLs não autorizadas no Google Console  
**Solução**: Volte ao PASSO 3 e adicione as URLs exatas

### 3. Erro "Invalid client"

**Causa**: Client ID incorreto ou expirado  
**Solução**: 
- Verifique se copiou o Client ID completo (termina com `.apps.googleusercontent.com`)
- Gere novo Client ID se necessário

### 4. Popup não abre

**Causa**: Bloqueado por AdBlocker ou popup blocker  
**Solução**:
- Desabilite AdBlocker temporariamente
- Permita popups para o site
- Teste em outro browser

---

## 📸 Como Deve Estar Após Correção

### Console (F12):
```
✅ No errors in console
✅ Client ID: 123456789012-abc...
✅ Script loaded from accounts.google.com
```

### Vercel Deployment:
```
✅ Status: Ready
✅ Environment Variables: VITE_GOOGLE_CLIENT_ID set
✅ Build Command: npm run build
✅ Output Directory: dist
```

### Google Cloud Console:
```
✅ Authorized JavaScript origins:
   - https://assistente-juridico-github.vercel.app
   - https://assistente-juridico-github.vercel.app

✅ Authorized redirect URIs:
   - https://assistente-juridico-github.vercel.app
   - https://assistente-juridico-github.vercel.app
```

---

## �� Resumo Rápido

1. ✅ Variável configurada no Vercel
2. 🔄 **Faça redeploy** (PASSO 1)
3. 🔍 **Verifique variável** no console (PASSO 2)
4. 📋 **Adicione URLs** no Google Console (PASSO 3)
5. 🧪 **Teste** (PASSO 4)

**Tempo total**: ~5-7 minutos

---

## 🆘 Precisa de Ajuda?

Se após seguir todos os passos ainda não funcionar, me envie:

1. Screenshot do console (F12) com erros
2. Resultado deste comando no console:
   ```javascript
   console.log(JSON.stringify({
     clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID?.substring(0, 30),
     hostname: window.location.hostname,
     hasGoogle: !!window.google
   }, null, 2));
   ```

---

**Data**: 2024-12-01  
**Commit**: bdc6aa7  
**Status**: ✅ Código corrigido, aguardando testes
