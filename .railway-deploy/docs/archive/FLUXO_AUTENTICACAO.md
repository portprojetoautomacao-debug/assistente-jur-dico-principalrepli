# 🔐 Fluxo de Autenticação - Diagrama Visual

Este documento mostra visualmente como funciona a autenticação no aplicativo.

## 📊 Arquitetura da Autenticação

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASSISTENTE JURÍDICO PJE                       │
│                  (Vercel - React + Vite + Spark)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Usa
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              GOOGLE SIGN-IN ONE TAP (OAuth 2.0)                  │
│                                                                   │
│  • Client ID: VITE_GOOGLE_CLIENT_ID                              │
│  • Tipo: Autenticação no navegador (JavaScript)                 │
│  • Popup: Nativo do Google                                       │
│  • Sem backend callback necessário                               │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Login - Passo a Passo

```
┌──────────┐
│ USUÁRIO  │
└────┬─────┘
     │
     │ 1. Acessa aplicação
     ▼
┌─────────────────────────────────┐
│  FRONTEND (Vercel)               │
│  https://assistente-juridico-   │
│  ultimo.vercel.app               │
└────┬────────────────────────────┘
     │
     │ 2. Carrega GoogleAuth.tsx
     ▼
┌─────────────────────────────────┐
│  Carrega script do Google        │
│  src: accounts.google.com/       │
│       gsi/client                 │
└────┬────────────────────────────┘
     │
     │ 3. Inicializa Google Sign-In
     ▼
┌─────────────────────────────────────────┐
│  google.accounts.id.initialize({        │
│    client_id: "xxx.apps.google...",     │
│    callback: handleCredentialResponse   │
│  })                                     │
└────┬────────────────────────────────────┘
     │
     │ 4. Renderiza botão
     ▼
┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │  🔵 Login com Google      │  │  ← Usuário clica
│  └───────────────────────────┘  │
└────┬────────────────────────────┘
     │
     │ 5. Popup do Google abre
     ▼
┌─────────────────────────────────────────┐
│  GOOGLE AUTHENTICATION POPUP             │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Fazer login com Google            │ │
│  │                                    │ │
│  │  Email: ___________________        │ │
│  │  Senha: ___________________        │ │
│  │                                    │ │
│  │  [Continuar]                       │ │
│  └────────────────────────────────────┘ │
└────┬────────────────────────────────────┘
     │
     │ 6. Usuário autentica
     │    Google valida origem:
     │    ✓ https://assistente-juridico-
     │      ultimo.vercel.app está em
     │      "Authorized JavaScript origins"
     ▼
┌─────────────────────────────────────────┐
│  GOOGLE retorna JWT Token                │
│  (credential response)                   │
└────┬────────────────────────────────────┘
     │
     │ 7. Callback executado
     ▼
┌─────────────────────────────────────────┐
│  handleCredentialResponse(response)      │
│                                          │
│  • Decodifica JWT                        │
│  • Extrai user info (email, name, etc)  │
│  • Chama onSuccess(user)                 │
└────┬────────────────────────────────────┘
     │
     │ 8. Usuário logado!
     ▼
┌─────────────────────────────────┐
│  APLICAÇÃO (estado autenticado)  │
│                                  │
│  • Mostra dados do usuário       │
│  • Habilita funcionalidades      │
│  • Pode usar Google Calendar API │
└──────────────────────────────────┘
```

## 🔑 Componentes Chave

### 1. Frontend (React)

**Arquivo:** `src/components/GoogleAuth.tsx`

```typescript
// Carrega biblioteca do Google
<script src="https://accounts.google.com/gsi/client" async></script>

// Inicializa
google.accounts.id.initialize({
  client_id: config.google.clientId,  // ← VITE_GOOGLE_CLIENT_ID
  callback: handleCredentialResponse
})

// Renderiza botão
google.accounts.id.renderButton(buttonDiv, {...})
```

### 2. Configuração

**Arquivo:** `src/lib/config.ts`

```typescript
export const config = {
  google: {
    clientId: getEnvVar('VITE_GOOGLE_CLIENT_ID', ''),
    redirectUri: getEnvVar('VITE_REDIRECT_URI', window.location.origin),
  }
}
```

### 3. Variáveis de Ambiente

**No Vercel:**
```env
VITE_GOOGLE_CLIENT_ID=572929400457-xxx.apps.googleusercontent.com
VITE_REDIRECT_URI=https://assistente-juridico-ultimo.vercel.app
VITE_APP_ENV=production
```

## 🌐 Google Cloud Console - Configuração

```
┌──────────────────────────────────────────────────────┐
│  GOOGLE CLOUD CONSOLE                                 │
│  https://console.cloud.google.com/apis/credentials    │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│  OAuth 2.0 Client ID                                  │
│  Nome: Assistente Jurídico PJe - Vercel              │
│                                                       │
│  Tipo: Web application                               │
└──────────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
┌──────────────────────┐    ┌──────────────────────────┐
│  Authorized          │    │  Authorized redirect     │
│  JavaScript origins  │    │  URIs                    │
│                      │    │                          │
│  ✓ https://          │    │  ✓ https://              │
│    assistente-       │    │    assistente-           │
│    juridico-ultimo.  │    │    juridico-ultimo.      │
│    vercel.app        │    │    vercel.app            │
│                      │    │                          │
│  ✓ http://           │    │  ✓ http://               │
│    localhost:5173    │    │    localhost:5173        │
└──────────────────────┘    └──────────────────────────┘
        │                               │
        └───────────────┬───────────────┘
                        ▼
                  ┌─────────┐
                  │ Client  │
                  │   ID    │
                  └─────────┘
                        │
                        │ Copiar para Vercel
                        ▼
          VITE_GOOGLE_CLIENT_ID
```

## ⚠️ Diferença: OAuth Tradicional vs Google Sign-In One Tap

### OAuth Tradicional (NÃO usado neste projeto)

```
Frontend                 Backend                    Google
   │                        │                         │
   │  1. Clica "Login"      │                         │
   ├───────────────────────>│                         │
   │                        │  2. Redirect to Google  │
   │                        ├────────────────────────>│
   │                        │                         │
   │  3. Google Auth Page   │                         │
   │<────────────────────────────────────────────────┤
   │                        │                         │
   │  4. User authenticates │                         │
   ├────────────────────────────────────────────────>│
   │                        │                         │
   │                        │  5. Callback com code   │
   │                        │<────────────────────────┤
   │                        │                         │
   │                        │  6. Exchange code for   │
   │                        │     access token        │
   │                        ├────────────────────────>│
   │                        │                         │
   │                        │  7. Access token        │
   │                        │<────────────────────────┤
   │  8. Session cookie     │                         │
   │<───────────────────────┤                         │
```

**Requer:**
- ❌ Rota de callback: `/api/auth/callback`
- ❌ Client Secret no servidor
- ❌ Sessão no servidor
- ✅ Authorized redirect URIs

### Google Sign-In One Tap (USADO neste projeto)

```
Frontend (Browser)                            Google
   │                                            │
   │  1. Carrega google/gsi/client script       │
   ├───────────────────────────────────────────>│
   │                                            │
   │  2. Inicializa com client_id               │
   ├───────────────────────────────────────────>│
   │                                            │
   │  3. Popup abre                             │
   │<───────────────────────────────────────────┤
   │                                            │
   │  4. User authenticates                     │
   ├───────────────────────────────────────────>│
   │                                            │
   │  5. JWT Token (credential)                 │
   │<───────────────────────────────────────────┤
   │                                            │
   │  6. Decodifica JWT no browser              │
   │  7. Extrai user info                       │
   │  8. App state = logged in                  │
```

**Requer:**
- ✅ Client ID público (no frontend)
- ✅ Authorized JavaScript origins
- ❌ NÃO precisa de callback route
- ❌ NÃO precisa de Client Secret
- ✅ Mais simples e seguro

## 🔒 Segurança

### O que é público (frontend)
- ✅ `VITE_GOOGLE_CLIENT_ID` - É SEGURO expor no frontend
- ✅ `VITE_REDIRECT_URI` - É apenas uma URL
- ✅ `VITE_APP_ENV` - É apenas um flag

### O que é privado (servidor/Vercel)
- 🔐 `GITHUB_TOKEN` - Token de acesso pessoal (mantido no servidor)
- 🔐 `GITHUB_RUNTIME_PERMANENT_NAME` - Nome do runtime (mantido no servidor)

### Por que Client ID pode ser público?

O Google Sign-In One Tap valida:
1. ✅ **Origem da requisição** - deve estar em "Authorized JavaScript origins"
2. ✅ **Domínio do aplicativo** - validado pelo Google
3. ✅ **Popup do Google** - usuário autentica diretamente com Google

Mesmo que alguém copie seu Client ID, não consegue usá-lo porque:
- ❌ Origem diferente será rejeitada pelo Google
- ❌ Domínio não autorizado
- ❌ Usuário vê o nome do app real no popup do Google

## 📝 Checklist de Configuração

### Google Cloud Console
- [ ] ✅ Client ID criado
- [ ] ✅ "Authorized JavaScript origins" configurado
- [ ] ✅ `https://assistente-juridico-ultimo.vercel.app` adicionado
- [ ] ✅ `http://localhost:5173` adicionado
- [ ] ✅ "Authorized redirect URIs" configurado (mesmas URLs)
- [ ] ✅ Client ID copiado

### Vercel Dashboard
- [ ] ✅ `VITE_GOOGLE_CLIENT_ID` adicionado (Production)
- [ ] ✅ `VITE_REDIRECT_URI` adicionado (Production)
- [ ] ✅ `VITE_APP_ENV=production` adicionado (Production)
- [ ] ✅ `GITHUB_TOKEN` adicionado (todos ambientes)
- [ ] ✅ `GITHUB_RUNTIME_PERMANENT_NAME` adicionado (todos ambientes)
- [ ] ✅ Redeploy feito

### Teste
- [ ] ✅ Acessar aplicação
- [ ] ✅ Botão "Login com Google" aparece
- [ ] ✅ Clicar no botão
- [ ] ✅ Popup do Google abre
- [ ] ✅ Login funciona
- [ ] ✅ Dados do usuário aparecem

## 🔗 Links de Referência

- 📖 [VERCEL_OAUTH_SETUP.md](./VERCEL_OAUTH_SETUP.md) - Guia completo
- ⚡ [CONFIGURACAO_RAPIDA_VERCEL.md](./CONFIGURACAO_RAPIDA_VERCEL.md) - Referência rápida
- 📝 [RESUMO_CONFIGURACAO_OAUTH.md](./RESUMO_CONFIGURACAO_OAUTH.md) - Resumo técnico
- 🔐 [Google Sign-In Docs](https://developers.google.com/identity/gsi/web/guides/overview)
- ☁️ [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

---

**Última atualização:** 2025-11-18  
**Versão:** 1.0
