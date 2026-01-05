# 🚀 Deploy do Assistente Jurídico PJe

> Guia completo para fazer deploy em plataformas gratuitas

## ⚡ Início Rápido

**Nunca fez deploy antes? Comece aqui:**

1. **Execute o verificador** (2 minutos)
   ```bash
   ./verificar-pre-deploy.sh
   ```

2. **Escolha sua plataforma** (30 segundos)
   - 📖 [ESCOLHA_PLATAFORMA_DEPLOY.md](./ESCOLHA_PLATAFORMA_DEPLOY.md)

3. **Siga o guia** (5-15 minutos)
   - 📘 [Render](./GUIA_DEPLOY_RENDER.md) - 100% grátis, sem cartão
   - 📗 [Netlify](./GUIA_DEPLOY_NETLIFY.md) - CDN global
   - 📕 [Railway](./GUIA_DEPLOY_RAILWAY.md) - $5/mês grátis + PostgreSQL
   - 📙 [Vercel](./GUIA_RAPIDO_DEPLOY.md) - Melhor performance

---

## 🎯 Qual plataforma usar?

### Para produção séria
**→ Vercel** - Sem sleep, performance máxima, analytics
- [GUIA_RAPIDO_DEPLOY.md](./GUIA_RAPIDO_DEPLOY.md)

### Para projetos pessoais/teste
**→ Render** - 100% grátis, fácil, sem cartão
- [GUIA_DEPLOY_RENDER.md](./GUIA_DEPLOY_RENDER.md)

### Para sites estáticos rápidos
**→ Netlify** - CDN global, drag & drop
- [GUIA_DEPLOY_NETLIFY.md](./GUIA_DEPLOY_NETLIFY.md)

### Para apps com banco de dados
**→ Railway** - PostgreSQL grátis incluído
- [GUIA_DEPLOY_RAILWAY.md](./GUIA_DEPLOY_RAILWAY.md)

---

## 📊 Comparação Rápida

| Plataforma | Grátis | Fácil | Sem Sleep | Banco |
|------------|--------|-------|-----------|-------|
| **Vercel** | ✅ | ⭐⭐⭐⭐⭐ | ✅ | ❌ |
| **Render** | ✅ | ⭐⭐⭐⭐⭐ | ❌ | ❌ |
| **Netlify** | ✅ | ⭐⭐⭐⭐⭐ | ✅ | ❌ |
| **Railway** | $5/mês | ⭐⭐⭐⭐ | ✅ | ✅ |

**Ver comparação completa:**
- 📊 [PLATAFORMAS_DEPLOY_GRATIS.md](./PLATAFORMAS_DEPLOY_GRATIS.md)

---

## 📖 Guias Completos

### Por Plataforma

- **Render** → [GUIA_DEPLOY_RENDER.md](./GUIA_DEPLOY_RENDER.md) (15 min)
  - 100% gratuito sem cartão
  - Deploy automático via GitHub
  - App "dorme" após 15 min

- **Netlify** → [GUIA_DEPLOY_NETLIFY.md](./GUIA_DEPLOY_NETLIFY.md) (10 min)
  - CDN global ultra-rápido
  - 3 métodos de deploy
  - Netlify Functions

- **Railway** → [GUIA_DEPLOY_RAILWAY.md](./GUIA_DEPLOY_RAILWAY.md) (15 min)
  - $5/mês em créditos grátis
  - PostgreSQL incluído
  - App sempre ativo

- **Vercel** → [GUIA_RAPIDO_DEPLOY.md](./GUIA_RAPIDO_DEPLOY.md) (5 min)
  - Melhor performance
  - Preview de PRs automático
  - Já configurado no projeto

### Decisão e Comparação

- **Decisão Rápida** → [ESCOLHA_PLATAFORMA_DEPLOY.md](./ESCOLHA_PLATAFORMA_DEPLOY.md)
- **Comparação Completa** → [PLATAFORMAS_DEPLOY_GRATIS.md](./PLATAFORMAS_DEPLOY_GRATIS.md)
- **Índice Completo** → [INDICE_DEPLOY_COMPLETO.md](./INDICE_DEPLOY_COMPLETO.md)

---

## 🛠️ Pré-requisitos

Todas as plataformas precisam de:

1. ✅ Repositório no GitHub
2. ✅ Google OAuth configurado ([OAUTH_SETUP.md](./OAUTH_SETUP.md))
3. ✅ Token do GitHub ([.env.example](./.env.example))

**Opcional:**
- Google Gemini API (alternativa gratuita ao Spark)

---

## ⚙️ Arquivos de Configuração

Já incluídos no projeto:

- **render.yaml** - Configuração completa para Render
- **netlify.toml** - Configuração completa para Netlify
- **vercel.json** - Configuração completa para Vercel
- **.env.example** - Template de variáveis de ambiente

---

## 🔍 Verificação Pré-Deploy

Execute antes de fazer deploy:

```bash
./verificar-pre-deploy.sh
```

**O script verifica:**
- ✅ Arquivos de configuração
- ✅ Scripts de build/start
- ✅ Versão do Node.js
- ✅ Build do projeto
- ✅ Documentação

**Output esperado:**
```
✓ Sucessos: 17
⚠ Avisos: 1
✗ Erros: 0

✅ TUDO PRONTO PARA DEPLOY!
```

---

## 🚦 Passos para Deploy

### 1️⃣ Verificar (2 min)

```bash
./verificar-pre-deploy.sh
```

### 2️⃣ Escolher Plataforma (30s)

- Leia: [ESCOLHA_PLATAFORMA_DEPLOY.md](./ESCOLHA_PLATAFORMA_DEPLOY.md)

### 3️⃣ Seguir Guia (5-15 min)

- **Render**: [GUIA_DEPLOY_RENDER.md](./GUIA_DEPLOY_RENDER.md)
- **Netlify**: [GUIA_DEPLOY_NETLIFY.md](./GUIA_DEPLOY_NETLIFY.md)
- **Railway**: [GUIA_DEPLOY_RAILWAY.md](./GUIA_DEPLOY_RAILWAY.md)
- **Vercel**: [GUIA_RAPIDO_DEPLOY.md](./GUIA_RAPIDO_DEPLOY.md)

### 4️⃣ Configurar OAuth (5 min)

1. Copie a URL do seu app
2. Adicione no [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
3. Atualize `VITE_REDIRECT_URI` nas variáveis de ambiente
4. Redeploy (automático na maioria das plataformas)

### 5️⃣ Testar! (1 min)

1. Acesse a URL do app
2. Clique em "Login com Google"
3. ✅ Funcionou!

---

## 🆘 Ajuda

### Problemas com deploy?
- 📖 [TROUBLESHOOTING_DEPLOY.md](./TROUBLESHOOTING_DEPLOY.md)

### Erros de OAuth?
- 📖 [OAUTH_SETUP.md](./OAUTH_SETUP.md)

### Erros 403?
- 📖 [CORRECAO_403_VERCEL_JSON.md](./CORRECAO_403_VERCEL_JSON.md)

### Ainda com dúvidas?
- 📖 [README.md](./README.md) - Documentação principal
- 🐛 [Abrir issue](https://github.com/thiagobodevan-a11y/assistente-jurdico-p/issues)

---

## 📚 Documentação Completa

Para ver TODA a documentação de deploy:

👉 **[INDICE_DEPLOY_COMPLETO.md](./INDICE_DEPLOY_COMPLETO.md)**

---

## ✅ Checklist de Deploy

- [ ] Executei `./verificar-pre-deploy.sh` com sucesso
- [ ] Escolhi a plataforma ideal para meu caso
- [ ] Li o guia da plataforma escolhida
- [ ] Configurei todas as variáveis de ambiente
- [ ] Fiz o primeiro deploy
- [ ] Configurei OAuth no Google Cloud Console
- [ ] Atualizei `VITE_REDIRECT_URI`
- [ ] Testei login com Google
- [ ] Aplicação está funcionando! 🎉

---

## 🎉 Pronto!

Sua aplicação está no ar! 🚀

**Próximos passos:**
- Configure monitoramento de uptime
- Configure notificações de deploy
- Explore features da plataforma escolhida
- Considere custom domain

---

**Última atualização:** 2025-11-18  
**Versão:** 1.0.0

**Feito com ❤️ para a comunidade jurídica**
