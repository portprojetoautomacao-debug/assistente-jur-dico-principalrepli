# 📚 Índice Completo de Deploy

> Todos os guias de deploy em um só lugar

## 🚀 Começar Aqui

### Decisão Rápida (30 segundos)
- **[ESCOLHA_PLATAFORMA_DEPLOY.md](./ESCOLHA_PLATAFORMA_DEPLOY.md)** ⭐⭐⭐
  - Qual plataforma usar?
  - Comparação rápida
  - Recomendação por caso de uso

### Comparação Detalhada
- **[PLATAFORMAS_DEPLOY_GRATIS.md](./PLATAFORMAS_DEPLOY_GRATIS.md)** ⭐⭐⭐
  - Vercel vs Render vs Netlify vs Railway vs Fly.io vs Cloudflare Pages
  - Vantagens e desvantagens
  - Limites do plano gratuito

---

## 📖 Guias Passo a Passo

### Vercel (Recomendado para Produção)
- **[GUIA_RAPIDO_DEPLOY.md](./GUIA_RAPIDO_DEPLOY.md)** - 5 minutos
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Completo
- **[VERCEL_ENV_CHECKLIST.md](./VERCEL_ENV_CHECKLIST.md)** - Checklist de variáveis
- **[VERCEL_OAUTH_SETUP.md](./VERCEL_OAUTH_SETUP.md)** - Setup OAuth

### Render (100% Gratuito)
- **[GUIA_DEPLOY_RENDER.md](./GUIA_DEPLOY_RENDER.md)** ⭐ NOVO - 15 minutos
  - Passo a passo completo
  - Configuração de variáveis
  - Troubleshooting
  - Limitações do plano gratuito

### Netlify (CDN Global)
- **[GUIA_DEPLOY_NETLIFY.md](./GUIA_DEPLOY_NETLIFY.md)** ⭐ NOVO - 10 minutos
  - 3 métodos de deploy
  - Netlify Functions
  - Custom domain
  - Otimizações

### Railway ($5/mês grátis)
- **[GUIA_DEPLOY_RAILWAY.md](./GUIA_DEPLOY_RAILWAY.md)** ⭐ NOVO - 15 minutos
  - Setup com créditos grátis
  - PostgreSQL incluído
  - Railway CLI
  - Gestão de custos

---

## 🔧 Configuração e Setup

### Variáveis de Ambiente
- **[.env.example](./.env.example)** - Template de variáveis
- **[VERCEL_ENV_CHECKLIST.md](./VERCEL_ENV_CHECKLIST.md)** - Checklist completo
- **[VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)** - Setup detalhado

### OAuth e Credenciais
- **[OAUTH_SETUP.md](./OAUTH_SETUP.md)** - Setup Google OAuth
- **[VERCEL_OAUTH_SETUP.md](./VERCEL_OAUTH_SETUP.md)** - OAuth para Vercel
- **[CONFIGURACAO_RAPIDA_VERCEL.md](./CONFIGURACAO_RAPIDA_VERCEL.md)** - Configuração rápida
- **[CREDENTIALS_GUIDE.md](./CREDENTIALS_GUIDE.md)** - Guia de credenciais

### GitHub Actions (CI/CD)
- **[GITHUB_ACTIONS_DEPLOY_GUIDE.md](./GITHUB_ACTIONS_DEPLOY_GUIDE.md)** - Deploy automático
- **[GITHUB_SECRETS_CHECKLIST.md](./GITHUB_SECRETS_CHECKLIST.md)** - Secrets do GitHub
- **[CONFIGURACAO_VERCEL_TOKEN.md](./CONFIGURACAO_VERCEL_TOKEN.md)** - Token Vercel

---

## 🛠️ Arquivos de Configuração

### Plataformas Específicas
- **[render.yaml](./render.yaml)** - Configuração Render ⭐ ATUALIZADO
- **[netlify.toml](./netlify.toml)** - Configuração Netlify ⭐ NOVO
- **[vercel.json](./vercel.json)** - Configuração Vercel

### Build e Runtime
- **[package.json](./package.json)** - Scripts de build
- **[vite.config.ts](./vite.config.ts)** - Configuração Vite
- **[tsconfig.json](./tsconfig.json)** - TypeScript config

---

## 🆘 Troubleshooting

### Problemas Comuns de Deploy
- **[TROUBLESHOOTING_DEPLOY.md](./TROUBLESHOOTING_DEPLOY.md)** - Problemas gerais
- **[RESOLUCAO_DEPLOY.md](./RESOLUCAO_DEPLOY.md)** - Análise de problemas
- **[DEPLOYMENT_FIX_COMPLETE.md](./DEPLOYMENT_FIX_COMPLETE.md)** - Correções aplicadas

### Erros Específicos
- **[CORRECAO_403_VERCEL_JSON.md](./CORRECAO_403_VERCEL_JSON.md)** - Erro 403
- **[QUICK_FIX_403.md](./QUICK_FIX_403.md)** - Correção rápida 403
- **[CORRECAO_RAPIDA_403.md](./CORRECAO_RAPIDA_403.md)** - Guia rápido 403
- **[CORRECOES_VERCEL_DEPLOYMENT.md](./CORRECOES_VERCEL_DEPLOYMENT.md)** - Correções Vercel

### OAuth e Autenticação
- **[CORRECAO_ERRO_401.md](./CORRECAO_ERRO_401.md)** - Erro 401
- **[RESUMO_CORRECOES_401.md](./RESUMO_CORRECOES_401.md)** - Resumo de correções

---

## 🔍 Ferramentas de Verificação

### Scripts de Validação
- **[verificar-pre-deploy.sh](./verificar-pre-deploy.sh)** ⭐ NOVO
  - Verifica configurações antes do deploy
  - Valida build do projeto
  - Checa documentação
  - Testa variáveis de ambiente

### Outros Scripts
- **[verificar-deploy.sh](./verificar-deploy.sh)** - Verificar deploy
- **[verificar-config.sh](./verificar-config.sh)** - Verificar configuração
- **[verificar-gemini.sh](./verificar-gemini.sh)** - Verificar Gemini API

---

## 📊 Integrações Específicas

### Vercel KV Storage
- **[VERCEL_KV_SETUP.md](./VERCEL_KV_SETUP.md)** - Setup KV Storage
- **[MIGRACAO_VERCEL_KV.md](./MIGRACAO_VERCEL_KV.md)** - Migração para KV
- **[ERRO_BLOB_STORAGE_SPARK.md](./ERRO_BLOB_STORAGE_SPARK.md)** - Erros de storage

### Cron Jobs (Vercel)
- **[VERCEL_CRON_JOBS.md](./VERCEL_CRON_JOBS.md)** - Setup cron jobs
- **[IMPLEMENTACAO_COMPLETA_CRON_KV.md](./IMPLEMENTACAO_COMPLETA_CRON_KV.md)** - Implementação completa

### Spark e GitHub
- **[CONFIGURACAO_GITHUB_APP_E_SPARK.md](./CONFIGURACAO_GITHUB_APP_E_SPARK.md)** - GitHub App
- **[GUIA_PRATICO_SPARK.md](./GUIA_PRATICO_SPARK.md)** - Guia Spark
- **[SPARK_IMPLEMENTATION_SUMMARY.md](./SPARK_IMPLEMENTATION_SUMMARY.md)** - Implementação Spark

---

## 📋 Checklists e Guias Rápidos

### Deploy
- **[ESCOLHA_PLATAFORMA_DEPLOY.md](./ESCOLHA_PLATAFORMA_DEPLOY.md)** ⭐ NOVO - Decisão rápida
- **[DEPLOY_RAPIDO.md](./DEPLOY_RAPIDO.md)** - Deploy rápido
- **[LEIA_PRIMEIRO_DEPLOY.md](./LEIA_PRIMEIRO_DEPLOY.md)** - Leia primeiro

### Configuração
- **[CONFIGURACAO_RAPIDA.md](./CONFIGURACAO_RAPIDA.md)** - Setup rápido
- **[QUICKSTART.md](./QUICKSTART.md)** - Início rápido
- **[COMECE_AQUI.md](./COMECE_AQUI.md)** - Começar aqui

---

## 📚 Documentação Geral

### Produto e Features
- **[README.md](./README.md)** - Documentação principal
- **[PRD.md](./PRD.md)** - Product Requirements
- **[FEATURES_COMPLETAS.md](./FEATURES_COMPLETAS.md)** - Features completas

### Segurança
- **[SECURITY.md](./SECURITY.md)** - Políticas de segurança
- **[ALERTA_SEGURANCA_CREDENCIAIS_EXPOSTAS.md](./ALERTA_SEGURANCA_CREDENCIAIS_EXPOSTAS.md)** - Alertas

### Versionamento
- **[VERSIONAMENTO.md](./VERSIONAMENTO.md)** - Guia de versionamento
- **[CHANGELOG.md](./CHANGELOG.md)** - Histórico de mudanças

---

## 🎯 Recomendações por Situação

### Primeira vez fazendo deploy?
1. Leia: **[ESCOLHA_PLATAFORMA_DEPLOY.md](./ESCOLHA_PLATAFORMA_DEPLOY.md)**
2. Execute: **[verificar-pre-deploy.sh](./verificar-pre-deploy.sh)**
3. Escolha uma plataforma
4. Siga o guia correspondente

### Já tenho no Vercel, quero migrar?
1. Leia: **[PLATAFORMAS_DEPLOY_GRATIS.md](./PLATAFORMAS_DEPLOY_GRATIS.md)**
2. Escolha nova plataforma
3. Siga o guia da plataforma escolhida
4. Configure variáveis de ambiente

### Problemas com deploy atual?
1. Leia: **[TROUBLESHOOTING_DEPLOY.md](./TROUBLESHOOTING_DEPLOY.md)**
2. Veja erro específico nos guias de correção
3. Execute **[verificar-pre-deploy.sh](./verificar-pre-deploy.sh)**

### Quer deploy automático (CI/CD)?
1. Leia: **[GITHUB_ACTIONS_DEPLOY_GUIDE.md](./GITHUB_ACTIONS_DEPLOY_GUIDE.md)**
2. Configure: **[GITHUB_SECRETS_CHECKLIST.md](./GITHUB_SECRETS_CHECKLIST.md)**
3. Setup Vercel: **[CONFIGURACAO_VERCEL_TOKEN.md](./CONFIGURACAO_VERCEL_TOKEN.md)**

---

## 🆕 Novos Guias Adicionados

- ⭐ **GUIA_DEPLOY_RENDER.md** - Deploy completo no Render
- ⭐ **GUIA_DEPLOY_NETLIFY.md** - Deploy completo no Netlify
- ⭐ **GUIA_DEPLOY_RAILWAY.md** - Deploy completo no Railway
- ⭐ **PLATAFORMAS_DEPLOY_GRATIS.md** - Comparação de plataformas
- ⭐ **ESCOLHA_PLATAFORMA_DEPLOY.md** - Guia de decisão
- ⭐ **verificar-pre-deploy.sh** - Script de validação
- ⭐ **netlify.toml** - Configuração Netlify
- ⭐ **render.yaml** - Atualizado com configuração completa

---

## 📞 Ajuda

**Documentação principal:** [README.md](./README.md)

**Problemas?** Abra uma [issue no GitHub](https://github.com/thiagobodevan-a11y/assistente-jurdico-p/issues)

**Dúvidas sobre deploy?** Veja primeiro:
1. [ESCOLHA_PLATAFORMA_DEPLOY.md](./ESCOLHA_PLATAFORMA_DEPLOY.md)
2. [TROUBLESHOOTING_DEPLOY.md](./TROUBLESHOOTING_DEPLOY.md)
3. Guia específico da sua plataforma

---

**Última atualização:** 2025-11-18  
**Versão:** 1.0.0
