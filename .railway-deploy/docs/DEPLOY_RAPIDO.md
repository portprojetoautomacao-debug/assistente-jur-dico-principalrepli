# 🚀 Deploy Rápido - Assistente Jurídico PJe

## ✅ Status Atual do Deploy

**Seu projeto está 100% pronto para deploy!** ✨

```
✓ Build: OK (9.38s)
✓ Dependências: OK (0 vulnerabilidades)
✓ Configuração: OK
✓ Testes: OK
```

## 📦 Deploy em 3 Passos

### 1️⃣ Configure Variáveis de Ambiente no Vercel

Acesse: https://vercel.com/dashboard → Seu Projeto → Settings → Environment Variables

**Obrigatórias** (copie de `runtime.config.json`):
```bash
GITHUB_RUNTIME_PERMANENT_NAME = 97a1cb1e48835e0ecf1e
GITHUB_TOKEN = ghp_seu_token_aqui
```

**Recomendadas** (para Google Calendar/Docs):
```bash
VITE_GOOGLE_CLIENT_ID = seu-client-id.apps.googleusercontent.com
VITE_REDIRECT_URI = https://seu-app.vercel.app
VITE_APP_ENV = production
```

### 2️⃣ Faça o Deploy

```bash
git push origin main
```

Ou via Vercel CLI:
```bash
vercel --prod
```

### 3️⃣ Verifique

Acesse: https://seu-app.vercel.app

## 🔍 Verificação Local (antes do deploy)

Execute este script para verificar tudo:

```bash
chmod +x verificar-deploy.sh
./verificar-deploy.sh
```

Ou manualmente:

```bash
# 1. Instalar dependências
npm install

# 2. Testar build
npm run build

# 3. Verificar vulnerabilidades
npm audit

# 4. Testar localmente
npm run dev
```

## 📋 Checklist Rápido

Deploy via Git:
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] `git add .`
- [ ] `git commit -m "deploy: sua mensagem"`
- [ ] `git push origin main`
- [ ] Aguarde 1-2 minutos
- [ ] Acesse seu app no Vercel

## 🆘 Problemas Comuns

### ❌ Erro 403 Forbidden
**Causa**: Variáveis de ambiente não configuradas  
**Solução**: Configure `GITHUB_TOKEN` e `GITHUB_RUNTIME_PERMANENT_NAME` no Vercel

### ❌ Build Falha
**Solução**: 
```bash
npm run build  # Teste localmente primeiro
```

### ❌ "Module not found"
**Solução**:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Documentação Completa

- **Deploy Completo**: [GUIA_DEPLOY_VERCEL_COMPLETO.md](./GUIA_DEPLOY_VERCEL_COMPLETO.md)
- **Variáveis de Ambiente**: [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)
- **OAuth Google**: [OAUTH_SETUP.md](./OAUTH_SETUP.md)
- **Exemplo .env**: [.env.example](./.env.example)

## 💡 Comandos Úteis

```bash
# Verificar configuração completa
./verificar-deploy.sh

# Build local
npm run build

# Preview do build
npm run preview

# Desenvolvimento
npm run dev

# Lint
npm run lint

# Audit
npm audit
```

## ✨ O que o Deploy Inclui

Seu app em produção terá:

- ✅ **Frontend React** (Vite + TypeScript)
- ✅ **API Serverless** (Vercel Functions)
- ✅ **Spark LLM** (AI Assistant - Harvey Specter)
- ✅ **Vercel KV** (Persistência de dados)
- ✅ **Cron Jobs** (Tarefas agendadas)
- ✅ **Google OAuth** (Calendar + Docs)
- ✅ **DJEN Monitor** (Publicações jurídicas)
- ✅ **15 Agentes IA** (Autônomos 24/7)

## 🎯 Resultado Esperado

Após o deploy, você terá:

- 🌐 URL pública: `https://seu-app.vercel.app`
- 🔒 HTTPS automático
- 🚀 CDN global (super rápido)
- 📊 Analytics do Vercel
- 🔄 Auto-deploy em cada push
- 💾 Dados persistentes (Vercel KV)

## 🔗 Links Importantes

- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Tokens**: https://github.com/settings/tokens
- **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
- **Vercel Docs**: https://vercel.com/docs

---

**Tempo estimado total**: 5-10 minutos  
**Dificuldade**: ⭐ Fácil

**Dúvidas?** Consulte [GUIA_DEPLOY_VERCEL_COMPLETO.md](./GUIA_DEPLOY_VERCEL_COMPLETO.md)
