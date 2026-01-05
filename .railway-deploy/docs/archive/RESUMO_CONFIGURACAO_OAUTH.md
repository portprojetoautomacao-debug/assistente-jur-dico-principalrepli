# 📚 Resumo da Configuração OAuth - Vercel

Este documento resume a solução implementada para o problema de configuração OAuth no Vercel.

## 🎯 Problema Original

O usuário estava tentando configurar o aplicativo para funcionar no Vercel e enfrentava problemas de permissão de acesso à API do Spark. A questão principal era: **"Qual é a URL de retorno (callback) que devo configurar?"**

## 💡 Descoberta Chave

Após análise do código, foi identificado que:

1. **O aplicativo NÃO usa OAuth tradicional** com callback routes como `/api/auth/callback`
2. **Usa Google Sign-In One Tap**, que é um fluxo diferente
3. **Requer configuração de "Authorized JavaScript origins"**, não redirect URIs tradicionais
4. **Não precisa de rotas de callback no backend**

## 📝 Solução Implementada

### Documentação Criada

1. **VERCEL_OAUTH_SETUP.md** (299 linhas)
   - Guia completo passo a passo
   - URLs exatas do deployment Vercel
   - Instruções detalhadas para Google Cloud Console
   - Lista completa de variáveis de ambiente
   - Seção de troubleshooting
   - Explicação técnica das diferenças entre fluxos OAuth

2. **CONFIGURACAO_RAPIDA_VERCEL.md** (73 linhas)
   - Referência rápida para copy-paste
   - URLs prontas para configurar
   - Tabela de variáveis de ambiente
   - Erros comuns e soluções

### Arquivos Atualizados

1. **.env.example**
   - Adicionadas URLs corretas do Vercel nos comentários

2. **OAUTH_SETUP.md**
   - Adicionada referência ao guia específico do Vercel
   - Seção com URLs do Vercel

3. **README.md**
   - Seção destacada para configuração OAuth no Vercel
   - Links diretos para os guias

## 🔑 URLs Configuradas

### Produção (Principal)
```
https://assistente-juridico-ultimo.vercel.app
```

### Preview (Opcional)
```
https://assistente-juridico-ultimo-git-main-thiagos-projects-9834ca6f.vercel.app
https://assistente-juridico-ultimo-nmozt2qx2-thiagos-projects-9834ca6f.vercel.app
```

### Desenvolvimento
```
http://localhost:5173
```

## ⚙️ Variáveis de Ambiente Necessárias

| Variável | Descrição | Onde Obter |
|----------|-----------|------------|
| `VITE_GOOGLE_CLIENT_ID` | Client ID do Google OAuth | Google Cloud Console |
| `VITE_REDIRECT_URI` | URL de produção | Vercel deployment |
| `VITE_APP_ENV` | Ambiente (production) | Manual |
| `GITHUB_TOKEN` | Token de acesso GitHub | GitHub Settings |
| `GITHUB_RUNTIME_PERMANENT_NAME` | Nome do runtime Spark | runtime.config.json |

## 🎓 Conceitos Importantes Explicados

### Google Sign-In One Tap vs OAuth Tradicional

**Google Sign-In One Tap (usado neste projeto):**
- ✅ Implementação mais simples
- ✅ Melhor UX (popup nativo)
- ✅ Client ID é público (pode ficar no frontend)
- ✅ Não precisa de rota de callback
- ⚠️ Requer "Authorized JavaScript origins"

**OAuth Tradicional (NÃO usado):**
- Requer rota `/api/auth/callback`
- Precisa de Client Secret no servidor
- Requer "Authorized redirect URIs"
- Mais controle sobre o fluxo

### Por que "Authorized JavaScript origins"?

Google Sign-In One Tap executa no navegador (JavaScript) e faz requisições diretas para os servidores do Google. Por isso precisa validar a **origem** da requisição, não uma URL de redirecionamento.

### Por que adicionar em ambos os campos?

Embora o Google Sign-In One Tap só precise de "JavaScript origins", o aplicativo também usa:
- **Google Calendar API** (pode precisar de redirect URIs)
- **Google Docs API** (pode precisar de redirect URIs)

Por isso recomendamos adicionar as mesmas URLs nos dois campos para garantir compatibilidade total.

## ✅ Checklist para o Usuário

- [ ] Acessar Google Cloud Console
- [ ] Criar/editar OAuth Client ID
- [ ] Adicionar URLs em "Authorized JavaScript origins"
- [ ] Adicionar URLs em "Authorized redirect URIs"
- [ ] Copiar Client ID
- [ ] Abrir Vercel Dashboard
- [ ] Adicionar variáveis de ambiente
- [ ] Fazer Redeploy
- [ ] Aguardar 5-10 minutos para propagação
- [ ] Testar login na aplicação

## 🔧 Solução de Problemas

### "redirect_uri_mismatch"
→ URL no Google Console não corresponde exatamente à URL do Vercel
→ Verifique se não há barra `/` no final

### "Invalid client ID"
→ Variável `VITE_GOOGLE_CLIENT_ID` não configurada no Vercel
→ Adicione e faça Redeploy

### Botão de login não aparece
→ Abra Console do navegador (F12)
→ Verifique erros na aba Console
→ Teste em aba anônima

## 📖 Documentação de Referência

1. [VERCEL_OAUTH_SETUP.md](./VERCEL_OAUTH_SETUP.md) - Guia completo
2. [CONFIGURACAO_RAPIDA_VERCEL.md](./CONFIGURACAO_RAPIDA_VERCEL.md) - Referência rápida
3. [OAUTH_SETUP.md](./OAUTH_SETUP.md) - Guia geral
4. [.env.example](./.env.example) - Exemplo de variáveis

## 🚀 Próximos Passos

Após a configuração inicial, o usuário pode:

1. ✅ Testar o login com Google
2. ✅ Configurar integração com Google Calendar
3. ✅ Configurar integração com Google Docs
4. ✅ Adicionar domínio customizado (se necessário)
5. ✅ Configurar ambiente de preview separado (opcional)

## 📝 Notas Técnicas

### Implementação no Código

O componente `GoogleAuth.tsx` usa:
```typescript
// Carrega script do Google Sign-In
const script = document.createElement('script')
script.src = 'https://accounts.google.com/gsi/client'

// Inicializa com Client ID
google.accounts.id.initialize({
  client_id: config.google.clientId,
  callback: handleCredentialResponse,
})
```

### Configuração Lida de

```typescript
// src/lib/config.ts
export const config = {
  google: {
    clientId: getEnvVar('VITE_GOOGLE_CLIENT_ID', ''),
    redirectUri: getEnvVar('VITE_REDIRECT_URI', window.location.origin),
  },
}
```

### Validação

```typescript
// src/lib/config.ts
export const validateConfig = (): boolean => {
  if (!config.google.clientId) {
    errors.push('Google Client ID is not configured')
  }
  // ...
}
```

---

**Criado:** 2025-11-18  
**Versão:** 1.0  
**Autor:** GitHub Copilot
