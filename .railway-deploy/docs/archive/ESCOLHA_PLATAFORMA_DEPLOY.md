# 🚀 Deploy Rápido - Escolha Sua Plataforma

> Guia de decisão rápida para escolher a melhor plataforma de deploy gratuita

## ⚡ Qual plataforma usar? (30 segundos para decidir)

### Você quer a melhor performance e já usa Vercel?
👉 Use **Vercel** - Já está configurado!
- 📖 [GUIA_RAPIDO_DEPLOY.md](./GUIA_RAPIDO_DEPLOY.md)

---

### Você quer 100% grátis SEM cartão de crédito?
👉 Use **Render** - Deploy em 15 minutos!
- 📖 [GUIA_DEPLOY_RENDER.md](./GUIA_DEPLOY_RENDER.md)
- ⚠️ App "dorme" após 15 min de inatividade

---

### Você quer CDN global super rápido?
👉 Use **Netlify** - Perfeito para SPAs!
- 📖 [GUIA_DEPLOY_NETLIFY.md](./GUIA_DEPLOY_NETLIFY.md)
- ✅ Arquivo `netlify.toml` já configurado

---

### Você precisa de banco de dados PostgreSQL grátis?
👉 Use **Railway** - $5/mês grátis + PostgreSQL!
- 📖 [GUIA_DEPLOY_RAILWAY.md](./GUIA_DEPLOY_RAILWAY.md)
- ⚠️ Requer cartão (mas não cobra)

---

### Ainda em dúvida? Ver comparação completa
👉 [PLATAFORMAS_DEPLOY_GRATIS.md](./PLATAFORMAS_DEPLOY_GRATIS.md)

---

## 📊 Comparação Ultra-Rápida

| Critério | Melhor Opção |
|----------|-------------|
| **Mais rápido** | ⭐ Vercel / Cloudflare Pages |
| **Mais fácil** | ⭐ Netlify / Render |
| **100% grátis** | ⭐ Render / Netlify / Vercel |
| **Sem cartão** | ⭐ Render / Netlify / Vercel |
| **Sem sleep** | ⭐ Vercel / Netlify |
| **Com banco** | ⭐ Railway |
| **Mais features** | ⭐ Vercel |

---

## 🎯 Recomendação por Caso de Uso

### 👨‍💼 Produção para clientes
**Vercel** - Sem sleep, performance máxima, analytics incluído
- [GUIA_RAPIDO_DEPLOY.md](./GUIA_RAPIDO_DEPLOY.md)

### 🧪 Testes e desenvolvimento
**Render** - 100% grátis, fácil de usar, sem compromisso
- [GUIA_DEPLOY_RENDER.md](./GUIA_DEPLOY_RENDER.md)

### 🚀 Portfólio pessoal
**Netlify** - CDN global, domínio customizado fácil
- [GUIA_DEPLOY_NETLIFY.md](./GUIA_DEPLOY_NETLIFY.md)

### 💾 Precisa de persistência
**Railway** - PostgreSQL grátis, app sempre ativo
- [GUIA_DEPLOY_RAILWAY.md](./GUIA_DEPLOY_RAILWAY.md)

---

## ⏱️ Tempo de Deploy

| Plataforma | Tempo Estimado | Dificuldade |
|------------|----------------|-------------|
| **Vercel** | 5 minutos | ⭐ Fácil |
| **Render** | 15 minutos | ⭐ Fácil |
| **Netlify** | 10 minutos | ⭐ Fácil |
| **Railway** | 15 minutos | ⭐⭐ Médio |
| **Fly.io** | 30 minutos | ⭐⭐⭐ Difícil |

---

## 🛠️ Pré-requisitos Comuns

Todas as plataformas precisam de:

1. ✅ Repositório no GitHub
2. ✅ Credenciais Google OAuth ([OAUTH_SETUP.md](./OAUTH_SETUP.md))
3. ✅ Token do GitHub para Spark ([veja .env.example](./.env.example))

**Opcional mas recomendado:**
- Google Gemini API key (alternativa gratuita ao Spark)

---

## 🚦 Começar Agora

### Passo 1: Escolha a plataforma (use a tabela acima)

### Passo 2: Siga o guia correspondente

- **Render**: [GUIA_DEPLOY_RENDER.md](./GUIA_DEPLOY_RENDER.md)
- **Vercel**: [GUIA_RAPIDO_DEPLOY.md](./GUIA_RAPIDO_DEPLOY.md)
- **Netlify**: [GUIA_DEPLOY_NETLIFY.md](./GUIA_DEPLOY_NETLIFY.md)
- **Railway**: [GUIA_DEPLOY_RAILWAY.md](./GUIA_DEPLOY_RAILWAY.md)

### Passo 3: Configure OAuth

Depois do deploy, atualize o Google OAuth:

1. Google Cloud Console → Credentials
2. Adicione a URL do seu app nos "Authorized origins"
3. Atualize `VITE_REDIRECT_URI` nas variáveis de ambiente
4. Redeploy (automático na maioria das plataformas)

### Passo 4: Teste!

1. Acesse a URL do seu app
2. Clique em "Login com Google"
3. Deve funcionar! ✅

---

## ❓ Perguntas Frequentes

### Posso usar mais de uma plataforma?

Sim! Você pode fazer deploy em múltiplas plataformas. Apenas configure as variáveis de ambiente específicas para cada uma.

### E se eu quiser migrar depois?

Todas as plataformas suportam deploy via Git. É só conectar o repositório na nova plataforma e configurar as variáveis de ambiente.

### Qual é realmente a melhor?

Depende do seu caso de uso:
- **Performance**: Vercel
- **Custo zero**: Render (com sleep) ou Netlify
- **Banco de dados**: Railway
- **Simplicidade**: Netlify

### Posso usar domínio próprio?

Sim! Todas as plataformas suportam domínio customizado:
- **Vercel**: Grátis
- **Render**: Grátis
- **Netlify**: Grátis
- **Railway**: Grátis

---

## 🆘 Ajuda

### Problemas com deploy?
- [TROUBLESHOOTING_DEPLOY.md](./TROUBLESHOOTING_DEPLOY.md)

### Erros de OAuth?
- [OAUTH_SETUP.md](./OAUTH_SETUP.md)
- [VERCEL_OAUTH_SETUP.md](./VERCEL_OAUTH_SETUP.md)

### Erros 403?
- [CORRECAO_403_VERCEL_JSON.md](./CORRECAO_403_VERCEL_JSON.md)

### Dúvidas gerais?
- [README.md](./README.md)
- Abra uma [issue no GitHub](https://github.com/thiagobodevan-a11y/assistente-jurdico-p/issues)

---

## 📚 Documentação Completa

### Guias de Deploy
- 📘 [GUIA_DEPLOY_RENDER.md](./GUIA_DEPLOY_RENDER.md) - Render (15 min)
- 📗 [GUIA_DEPLOY_NETLIFY.md](./GUIA_DEPLOY_NETLIFY.md) - Netlify (10 min)
- 📕 [GUIA_DEPLOY_RAILWAY.md](./GUIA_DEPLOY_RAILWAY.md) - Railway (15 min)
- 📙 [GUIA_RAPIDO_DEPLOY.md](./GUIA_RAPIDO_DEPLOY.md) - Vercel (5 min)

### Comparações e Decisões
- 📊 [PLATAFORMAS_DEPLOY_GRATIS.md](./PLATAFORMAS_DEPLOY_GRATIS.md) - Comparação completa

### Configurações
- 🔐 [OAUTH_SETUP.md](./OAUTH_SETUP.md) - Setup OAuth
- ⚙️ [.env.example](./.env.example) - Variáveis de ambiente

---

**Escolha sua plataforma e faça o deploy em minutos! 🚀**

**Dica:** Se ainda está em dúvida, comece com **Render** (100% grátis, sem cartão) ou **Vercel** (melhor performance).
