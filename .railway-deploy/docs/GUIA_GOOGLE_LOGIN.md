# Guia de Implementação do Login com Google

Este guia explica como configurar corretamente o Login com Google (Google Identity Services) para este projeto.

## 1. Abordagem Utilizada

O projeto utiliza a **Google Identity Services (GIS) SDK** diretamente. Esta é a abordagem oficial moderna do Google para web apps.

Existem duas formas comuns de implementar:

1. **SDK Direto (Atual)**: Injeta o script `https://accounts.google.com/gsi/client` e usa `google.accounts.id.initialize`.
2. **Biblioteca React**: Usar `@react-oauth/google` (que é um wrapper em volta do SDK acima).

**A implementação atual (`src/components/GoogleAuth.tsx`) está correta** e segue os padrões oficiais do Google para integração direta. Não é necessário instalar bibliotecas adicionais.

## 2. Configuração Necessária (Google Cloud Console)

Para que o login funcione, você precisa configurar o projeto no Google Cloud.

### Passo 1: Criar Projeto

1. Acesse [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um novo projeto ou selecione um existente.

### Passo 2: Configurar Tela de Consentimento OAuth

1. Vá em **APIs e Serviços** > **Tela de permissão OAuth**.
2. Selecione **Externo** e clique em **Criar**.
3. Preencha:
   - **Nome do App**: Assistente Jurídico
   - **Email de suporte**: Seu email
   - **Dados de contato do desenvolvedor**: Seu email
4. Clique em **Salvar e Continuar**.
5. Em **Escopos**, adicione `userinfo.email`, `userinfo.profile` e `openid`.
6. Em **Usuários de teste**, adicione seu próprio email (importante enquanto o app não for verificado).

### Passo 3: Criar Credenciais (Client ID)

1. Vá em **APIs e Serviços** > **Credenciais**.
2. Clique em **Criar Credenciais** > **ID do cliente OAuth**.
3. Tipo de aplicativo: **Aplicativo da Web**.
4. Nome: `Assistente Jurídico Web`.
5. **Origens JavaScript autorizadas** (MUITO IMPORTANTE):
   - Adicione: `http://localhost:5173` (para desenvolvimento local)
   - Adicione: `http://127.0.0.1:5173`
   - Adicione: `https://seu-app-producao.vercel.app` (se tiver)
6. **URIs de redirecionamento autorizados**:
   - Adicione: `http://localhost:5173`
   - Adicione: `http://127.0.0.1:5173`
7. Clique em **Criar**.

### Passo 4: Copiar o Client ID

1. Copie o código que parece com `123456789-abcdef...apps.googleusercontent.com`.
2. Cole no seu arquivo `.env`:

```env
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
```

## 3. Solução de Problemas Comuns

### Erro: "Ambiente Local Detectado"

O código possui uma proteção para evitar erros em ambientes não configurados. Se você configurou o `localhost` no Google Cloud (Passo 3.5 acima), o login deve funcionar.

### Erro: "The given origin is not allowed" (no Console do Navegador)

Significa que a URL que você está usando no navegador não está na lista de **Origens JavaScript autorizadas** no Google Cloud Console.

- Verifique se está usando `http://localhost:5173` ou `http://127.0.0.1:5173`.
- O Google pode levar alguns minutos para propagar a alteração.

### Erro: "popup_closed_by_user" imediato

Geralmente acontece por causa do Cross-Origin-Opener-Policy (COOP) em alguns navegadores ou bloqueadores de popup. Tente limpar o cache ou usar aba anônima.

## 4. Código de Referência

O componente `src/components/GoogleAuth.tsx` inicializa o botão assim:

```typescript
google.accounts.id.initialize({
  client_id: config.google.clientId,
  callback: handleCredentialResponse,
});

google.accounts.id.renderButton(
  document.getElementById("google-signin-button"),
  { theme: "outline", size: "large" }
);
```

Isso cria o botão oficial "Sign in with Google".
