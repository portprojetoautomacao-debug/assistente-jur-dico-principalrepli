# 🚀 COMECE AQUI - Configuração OAuth para Vercel

> **Este é o ponto de partida!** Leia este documento primeiro para entender o que fazer.

---

## ❓ Sua Pergunta

**"Qual é a URL de retorno (callback) do meu aplicativo para configurar no Vercel?"**

## ✅ Resposta Rápida

Seu aplicativo usa **Google Sign-In One Tap**, que funciona diferente do OAuth tradicional.  
**NÃO há URL de callback tradicional.**

Em vez disso, configure estas URLs no Google Cloud Console:

### 📍 URLs para Configurar

**Authorized JavaScript origins** (campo obrigatório):
```
https://assistente-juridico-ultimo.vercel.app
http://localhost:5173
```

**Authorized redirect URIs** (mesmo campo, para compatibilidade):
```
https://assistente-juridico-ultimo.vercel.app
http://localhost:5173
```

---

## 🎯 O Que Fazer Agora

### Opção 1: Configuração Rápida (10 minutos) ⚡

**Abra este documento:** [CONFIGURACAO_RAPIDA_VERCEL.md](./CONFIGURACAO_RAPIDA_VERCEL.md)

Você encontrará:
- ✅ URLs prontas para copiar e colar
- ✅ Tabela de variáveis de ambiente
- ✅ 3 passos simples
- ✅ Teste rápido

### Opção 2: Guia Completo (20 minutos) 📖

**Abra este documento:** [VERCEL_OAUTH_SETUP.md](./VERCEL_OAUTH_SETUP.md)

Você encontrará:
- ✅ Passo a passo detalhado com screenshots mentais
- ✅ Explicação de cada campo
- ✅ Troubleshooting completo
- ✅ Checklist final

### Opção 3: Entender Primeiro (15 minutos) 🎓

**Abra este documento:** [INDICE_OAUTH_VERCEL.md](./INDICE_OAUTH_VERCEL.md)

Você encontrará:
- ✅ Índice completo de toda documentação
- ✅ Diferentes caminhos de leitura
- ✅ FAQs
- ✅ Links para todos os recursos

---

## 🔑 Informação Essencial

### Variáveis de Ambiente Necessárias no Vercel

Vá em: **Settings → Environment Variables** e adicione:

| Variável | Onde Obter | Ambiente |
|----------|-----------|----------|
| `VITE_GOOGLE_CLIENT_ID` | Google Cloud Console | Production |
| `VITE_REDIRECT_URI` | URL do Vercel | Production |
| `VITE_APP_ENV` | Digite `production` | Production |
| `GITHUB_TOKEN` | GitHub Settings | Todos |
| `GITHUB_RUNTIME_PERMANENT_NAME` | runtime.config.json | Todos |

### Links Diretos

- 🔐 **Google Cloud Console:** https://console.cloud.google.com/apis/credentials
- 🚀 **Vercel Dashboard:** https://vercel.com/dashboard
- 🔑 **Criar GitHub Token:** https://github.com/settings/tokens/new

---

## 💡 Por Que Não Há Callback URL Tradicional?

Seu aplicativo usa **Google Sign-In One Tap**, que:

✅ **Funciona direto no navegador** (JavaScript)  
✅ **Não precisa de servidor para callback**  
✅ **Mais simples e seguro**  
✅ **Melhor experiência do usuário** (popup nativo do Google)

Diferente do OAuth tradicional que precisa de:
- ❌ Rota `/api/auth/callback` no servidor
- ❌ Client Secret
- ❌ Troca de código por token

Para entender melhor, veja: [FLUXO_AUTENTICACAO.md](./FLUXO_AUTENTICACAO.md)

---

## 📚 Todos os Documentos Disponíveis

1. **CONFIGURACAO_RAPIDA_VERCEL.md** - Referência rápida (5-10 min)
2. **VERCEL_OAUTH_SETUP.md** - Guia completo (15-20 min)
3. **RESUMO_CONFIGURACAO_OAUTH.md** - Resumo técnico (10 min)
4. **FLUXO_AUTENTICACAO.md** - Diagramas visuais (10 min)
5. **INDICE_OAUTH_VERCEL.md** - Índice navegável (2 min)

---

## ✅ Checklist Rápido

### Google Cloud Console
- [ ] Acessar https://console.cloud.google.com/apis/credentials
- [ ] Criar/editar OAuth Client ID (Web application)
- [ ] Adicionar `https://assistente-juridico-ultimo.vercel.app` em "Authorized JavaScript origins"
- [ ] Adicionar mesma URL em "Authorized redirect URIs"
- [ ] Adicionar `http://localhost:5173` em ambos (para dev local)
- [ ] Copiar Client ID

### Vercel Dashboard
- [ ] Acessar Settings → Environment Variables
- [ ] Adicionar `VITE_GOOGLE_CLIENT_ID` (do Google Console)
- [ ] Adicionar `VITE_REDIRECT_URI=https://assistente-juridico-ultimo.vercel.app`
- [ ] Adicionar `VITE_APP_ENV=production`
- [ ] Adicionar `GITHUB_TOKEN` (criar em github.com/settings/tokens)
- [ ] Adicionar `GITHUB_RUNTIME_PERMANENT_NAME=97a1cb1e48835e0ecf1e`
- [ ] Clicar em **Redeploy**

### Teste
- [ ] Acessar https://assistente-juridico-ultimo.vercel.app
- [ ] Clicar em "Login com Google"
- [ ] Verificar se login funciona

---

## �� Problemas Comuns

### ❌ "redirect_uri_mismatch"
→ URL não corresponde exatamente  
→ Verifique se não tem barra `/` no final  
→ Aguarde 5-10 minutos para propagação

### ❌ "Invalid client ID"
→ `VITE_GOOGLE_CLIENT_ID` não configurado no Vercel  
→ Adicione e faça Redeploy

### ❌ Botão não aparece
→ Abra Console do navegador (F12)  
→ Veja erro na aba Console  
→ Teste em aba anônima

**Para mais soluções:** Veja seção "Solução de Problemas" em [VERCEL_OAUTH_SETUP.md](./VERCEL_OAUTH_SETUP.md)

---

## 🎯 Próximo Passo

**Escolha um caminho e comece:**

1. 🏃 **Rápido:** Abra [CONFIGURACAO_RAPIDA_VERCEL.md](./CONFIGURACAO_RAPIDA_VERCEL.md) e siga os passos
2. 📖 **Detalhado:** Abra [VERCEL_OAUTH_SETUP.md](./VERCEL_OAUTH_SETUP.md) para guia completo
3. 🎓 **Aprender:** Abra [INDICE_OAUTH_VERCEL.md](./INDICE_OAUTH_VERCEL.md) para explorar

**Tempo estimado:** 10-20 minutos para configuração completa

---

**Boa sorte! 🚀**

_Última atualização: 2025-11-18_
