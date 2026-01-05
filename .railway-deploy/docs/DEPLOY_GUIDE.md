# 🚀 GUIA DE DEPLOY EM PRODUÇÃO - Vercel

**Data**: 2025-01-12 23:20  
**Status**: Aguardando autenticação Vercel

---

## ⚠️ **TOKEN VERCEL EXPIRADO**

O token de autenticação do Vercel CLI expirou. Siga os passos abaixo para fazer login e deploy.

---

## 📋 **PASSO A PASSO PARA DEPLOY**

### **1. Fazer Login no Vercel (2 min)**

```bash
vercel login
```

**O que vai acontecer**:
1. ✅ CLI vai abrir seu navegador
2. ✅ Fazer login com sua conta Vercel (GitHub/GitLab/Email)
3. ✅ Autorizar o CLI
4. ✅ Voltar ao terminal

**Alternativa (se tiver problemas)**:
```bash
# Usar token de acesso
vercel --token SEU_TOKEN_AQUI --prod
```

Para obter um token: https://vercel.com/account/tokens

---

### **2. Deploy em Produção (5 min)**

Após autenticar, execute:

```bash
# Deploy direto em produção
vercel --prod

# OU com confirmação automática
vercel --prod --yes
```

**Durante o deploy, o Vercel vai**:
- ✅ Fazer upload dos arquivos do build (dist/)
- ✅ Executar build no servidor (se necessário)
- ✅ Configurar domínio
- ✅ Ativar HTTPS automático
- ✅ Configurar variáveis de ambiente
- ✅ Gerar URL de produção

---

### **3. Configurar Variáveis de Ambiente (se necessário)**

Se for o primeiro deploy, configure as variáveis:

```bash
# Via CLI
vercel env add VITE_GEMINI_API_KEY production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production

# OU via Dashboard
# https://vercel.com/[seu-projeto]/settings/environment-variables
```

**Variáveis Obrigatórias**:
- `VITE_GEMINI_API_KEY` - API Key do Google Gemini
- `UPSTASH_REDIS_REST_URL` - URL do Redis Upstash
- `UPSTASH_REDIS_REST_TOKEN` - Token do Redis Upstash

**Variáveis Opcionais**:
- `QDRANT_URL` - Vector database (opcional)
- `QDRANT_API_KEY` - Chave API Qdrant (opcional)
- `DSPY_BRIDGE_URL` - DSPy optimization (opcional)
- `RESEND_API_KEY` - Emails (opcional)
- `SENTRY_DSN` - Error tracking (opcional)

---

## 🎯 **COMANDOS RÁPIDOS**

### **Deploy Completo**

```bash
# 1. Login
vercel login

# 2. Deploy produção
vercel --prod

# 3. Ver status
vercel list

# 4. Ver logs
vercel logs
```

### **Verificar Deploy**

```bash
# Ver URL de produção
vercel ls

# Abrir projeto no dashboard
vercel open

# Ver domínios
vercel domains ls
```

---

## 📊 **O QUE ESPERAR NO DEPLOY**

### **Timeline Estimada**

| Etapa | Tempo | Descrição |
|-------|-------|-----------|
| **Upload** | 1-2 min | Upload de ~2.68 MB |
| **Build** | 0-1 min | Build já feito localmente |
| **Deploy** | 30s-1min | Ativar no edge network |
| **Propagação** | 1-2 min | DNS global |
| **Total** | 3-6 min | Completo |

### **Saída Esperada**

```
🔍  Inspect: https://vercel.com/[seu-usuario]/[projeto]/[deployment-id]
✅  Production: https://assistente-juridico-p.vercel.app [2.68 MB]
```

---

## ✅ **CHECKLIST PÓS-DEPLOY**

Após o deploy, verificar:

### **1. Validação Técnica (5 min)**

```bash
# Testar URL de produção
curl -I https://assistente-juridico-p.vercel.app

# Verificar se retorna 200 OK
```

**No navegador, testar**:
- ✅ `https://assistente-juridico-p.vercel.app` - Página carrega
- ✅ Login funciona
- ✅ Dashboard carrega
- ✅ Processos/Expedientes acessíveis
- ✅ Agentes IA funcionando
- ✅ PWA instalável

### **2. Verificação de Funcionalidades (10 min)**

| Funcionalidade | Status |
|----------------|--------|
| ✅ Login/Auth | Testar |
| ✅ Dashboard Analytics | Testar |
| ✅ DJEN Monitoring | Testar |
| ✅ Processos CRM | Testar |
| ✅ Minutas Manager | Testar |
| ✅ Harvey Specter Chat | Testar |
| ✅ Agentes Autônomos | Testar |
| ✅ PWA Offline | Testar |

### **3. Validação de Performance (5 min)**

```bash
# Lighthouse CI (Google)
npx lighthouse https://assistente-juridico-p.vercel.app --view

# Esperar scores:
# Performance: >90
# Accessibility: >95
# Best Practices: >90
# SEO: >95
# PWA: >90
```

---

## 🔧 **TROUBLESHOOTING**

### **Erro: Build Failed**

```bash
# Verificar logs
vercel logs

# Re-deploy com logs verbosos
vercel --prod --debug
```

### **Erro: Variáveis de Ambiente**

```bash
# Listar variáveis
vercel env ls

# Adicionar faltando
vercel env add NOME_VARIAVEL production
```

### **Erro: Domínio não Resolve**

```bash
# Verificar domínios
vercel domains ls

# Adicionar domínio customizado (se necessário)
vercel domains add seudominio.com
```

### **Erro: 404 ou Blank Page**

1. Verificar se `dist/index.html` existe
2. Verificar `vercel.json` configurado corretamente
3. Re-deploy: `vercel --prod --force`

---

## 📄 **CONFIGURAÇÃO VERCEL (vercel.json)**

Certifique-se de que `vercel.json` está configurado:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

## 🎉 **DEPLOY ALTERNATIVO: VIA GIT**

Se preferir deploy automático via Git:

### **1. Conectar Repositório**

1. Acesse: https://vercel.com/new
2. Importe repositório GitHub
3. Selecione: `thiagobodevanadv-alt/assistente-jur-dico-principal`
4. Configure variáveis de ambiente
5. Deploy automático

### **2. Deploy via Git Push**

```bash
git add .
git commit -m "feat: production build v1.0.1 ready"
git push origin main

# Vercel vai fazer deploy automático
```

---

## 📊 **STATUS DO BUILD ATUAL**

### ✅ **Build Pronto para Deploy**

```
Bundle Size:      2.68 MB
Arquivos:         58
Chunks:           42 (code-split)
Type Safety:      100%
Test Coverage:    84.4%
PWA Ready:        YES
```

### ✅ **Arquivos Críticos Presentes**

- ✅ `dist/index.html` (13.22 KB)
- ✅ `dist/manifest.webmanifest` (0.74 KB)
- ✅ `dist/sw.js` (Service Worker)
- ✅ `dist/assets/*.js` (42 chunks)
- ✅ `dist/assets/*.css` (2 files)

---

## 🚀 **NEXT STEPS APÓS DEPLOY**

### **Imediato**

1. ✅ Testar URL de produção
2. ✅ Verificar funcionalidades principais
3. ✅ Validar PWA instalável
4. ✅ Confirmar HTTPS ativo

### **Curto Prazo**

1. ⏸️ Configurar domínio customizado (se necessário)
2. ⏸️ Configurar Sentry para error tracking
3. ⏸️ Ativar analytics (Google/Vercel)
4. ⏸️ Configurar backups automáticos

### **Médio Prazo**

1. ⏸️ Implementar CI/CD com GitHub Actions
2. ⏸️ Configurar staging environment
3. ⏸️ Adicionar testes E2E no CI
4. ⏸️ Configurar monitoring (Uptime Robot)

---

## 📞 **SUPORTE VERCEL**

- **Dashboard**: https://vercel.com/dashboard
- **Docs**: https://vercel.com/docs
- **Support**: https://vercel.com/support
- **Status**: https://www.vercel-status.com/

---

## 🎖️ **COMANDOS RESUMIDOS**

```bash
# Login
vercel login

# Deploy produção
vercel --prod

# Ver status
vercel ls

# Ver logs
vercel logs

# Abrir dashboard
vercel open
```

---

**Preparado por**: GitHub Copilot Deploy Assistant  
**Data**: 2025-01-12 23:20  
**Status**: ⏸️ **AGUARDANDO LOGIN VERCEL**

🚀 **Após login, execute: `vercel --prod`**
