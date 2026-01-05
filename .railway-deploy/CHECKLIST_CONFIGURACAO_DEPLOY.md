# ✅ Checklist de Configuração do Ambiente de Implantação

> **Assistente Jurídico PJe v1.4.0+**
> 
> Use este checklist para garantir que tudo está configurado corretamente

## 📋 Antes de Começar

- [ ] Node.js v20+ instalado
- [ ] npm v9+ instalado
- [ ] Git instalado e configurado
- [ ] Conta GitHub ativa
- [ ] Editor de código (VS Code recomendado)
- [ ] Acesso ao terminal/linha de comando

---

## 🔑 Contas e Serviços (Criar se não tiver)

### Obrigatórias

- [ ] **Google Cloud** - Para Gemini API
  - URL: https://aistudio.google.com/app/apikey
  - Plano: Free tier (suficiente para começar)
  - Chave criada: ❌ / ✅

- [ ] **Upstash Redis** - Para armazenamento KV
  - URL: https://console.upstash.com/redis
  - Plano: Free tier (10k comandos/dia)
  - Database criado: ❌ / ✅
  - Região escolhida: São Paulo (GRU)

- [ ] **Neon PostgreSQL** - Para banco de dados
  - URL: https://console.neon.tech
  - Plano: Free tier (0.5GB storage)
  - Projeto criado: ❌ / ✅
  - Connection string copiada: ❌ / ✅

- [ ] **Vercel** - Para hosting
  - URL: https://vercel.com
  - Plano: Hobby (grátis) ou Pro ($20/mês se 12+ endpoints)
  - Conta conectada ao GitHub: ❌ / ✅

### Recomendadas (Produção)

- [ ] **Sentry** - Para error tracking
  - URL: https://sentry.io/signup/
  - Plano: Free tier
  - Projeto criado: ❌ / ✅

- [ ] **Google Analytics** - Para analytics (opcional)
  - URL: https://analytics.google.com/
  - Propriedade criada: ❌ / ✅

---

## 🛠️ Setup Local

### 1. Clonar e Instalar

- [ ] Repositório clonado localmente
  ```bash
  git clone https://github.com/thiagobodevanadv-alt/assistente-juridico-p.git
  cd assistente-juridico-p
  ```

- [ ] Dependências instaladas
  ```bash
  npm install
  cd backend && npm install && cd ..
  ```

### 2. Configurar Variáveis de Ambiente

- [ ] Arquivo `.env` criado
  ```bash
  cp .env.example .env
  ```

- [ ] Variáveis obrigatórias configuradas no `.env`:
  - [ ] `VITE_GEMINI_API_KEY` (da Google Cloud)
  - [ ] `GEMINI_API_KEY` (mesma chave acima)
  - [ ] `UPSTASH_REDIS_REST_URL` (da Upstash)
  - [ ] `UPSTASH_REDIS_REST_TOKEN` (da Upstash)
  - [ ] `DATABASE_URL` (da Neon)
  - [ ] `VITE_AUTH_MODE=simple` (para dev local)
  - [ ] `VITE_ENABLE_PII_FILTERING=true`

- [ ] Variáveis recomendadas configuradas (opcional):
  - [ ] `VITE_SENTRY_DSN` (se usar Sentry)
  - [ ] `VITE_GA4_ID` (se usar Analytics)

### 3. Inicializar Banco de Dados

- [ ] Schema PostgreSQL inicializado
  ```bash
  cd backend && npm run db:init
  ```

### 4. Validar Configuração Local

- [ ] TypeScript compila sem erros
  ```bash
  npm run type-check
  ```

- [ ] Lint passa (0 erros, < 150 warnings OK)
  ```bash
  npm run lint
  ```

- [ ] Build completa com sucesso
  ```bash
  npm run build
  ```

- [ ] Servidor dev funciona
  ```bash
  npm run dev
  # Acesse: http://localhost:5173
  ```

- [ ] Backend funciona (em outro terminal)
  ```bash
  cd backend && npm run dev
  # API em: http://localhost:3001
  ```

- [ ] Login funciona (usuário: `adm`, senha: `adm123`)

- [ ] Chat com Harvey responde corretamente

---

## 🌐 Deploy em Produção (Vercel)

### 1. Preparar Repositório

- [ ] Todas as mudanças commitadas
  ```bash
  git add .
  git commit -m "chore: preparar para deploy"
  ```

- [ ] Push para GitHub
  ```bash
  git push origin main
  ```

### 2. Configurar Vercel

- [ ] Projeto importado no Vercel
  - URL: https://vercel.com/new
  - Repositório selecionado: ✅

- [ ] Build settings configuradas:
  - [ ] Framework: Vite
  - [ ] Root Directory: `./`
  - [ ] Build Command: `npm run build:deploy`
  - [ ] Output Directory: `dist`
  - [ ] Install Command: `npm ci --include=dev`

### 3. Configurar Environment Variables no Vercel

Adicione em: Dashboard → Settings → Environment Variables

**Obrigatórias:**
- [ ] `VITE_GEMINI_API_KEY` (scope: Production, Preview, Development)
- [ ] `GEMINI_API_KEY`
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `DATABASE_URL`
- [ ] `VITE_AUTH_MODE=simple` (ou `google` se configurou OAuth)
- [ ] `VITE_ENABLE_PII_FILTERING=true`

**Recomendadas:**
- [ ] `VITE_SENTRY_DSN`
- [ ] `VITE_APP_VERSION=1.4.0`
- [ ] `SENTRY_AI_MONITORING_ENABLED=true`
- [ ] `VITE_GA4_ID` (se usar)

### 4. Deploy

- [ ] Deploy iniciado (automático após importar)
- [ ] Build completo sem erros
- [ ] Preview URL acessível
- [ ] Production URL configurada

---

## ✅ Validação Pós-Deploy

### Testes Automáticos

- [ ] Script de validação executado
  ```bash
  # Configure URL no script antes
  ./scripts/validar-ambiente-deploy.sh
  ```

### Testes Manuais

#### APIs Básicas

- [ ] Health check funcionando
  ```bash
  curl https://seu-projeto.vercel.app/api/health
  # Esperado: {"status":"ok"}
  ```

- [ ] Status endpoint funcionando
  ```bash
  curl https://seu-projeto.vercel.app/api/status
  # Esperado: JSON com dados do sistema
  ```

- [ ] Agentes listados corretamente
  ```bash
  curl https://seu-projeto.vercel.app/api/agents?action=status
  # Esperado: 15 agentes
  ```

#### Frontend

- [ ] Homepage carrega sem erros
- [ ] CSS/styles aplicados corretamente
- [ ] Login funciona (adm/adm123 ou Google)
- [ ] Dashboard carrega após login
- [ ] Sem erros no console do browser

#### Funcionalidades Core

- [ ] **Chat com Harvey:**
  - [ ] Interface carrega
  - [ ] Pode enviar mensagem
  - [ ] Recebe resposta (2-5s)
  - [ ] Resposta faz sentido

- [ ] **Processos:**
  - [ ] Lista carrega
  - [ ] Pode criar novo
  - [ ] Pode editar existente
  - [ ] Salvamento funciona

- [ ] **Minutas:**
  - [ ] Editor Tiptap carrega
  - [ ] Pode criar nova minuta
  - [ ] Templates disponíveis
  - [ ] Formatação funciona
  - [ ] Salvar funciona

- [ ] **Calculadora de Prazos:**
  - [ ] Interface carrega
  - [ ] Cálculo funciona
  - [ ] Resultado correto

#### Integrações

- [ ] **Gemini API:**
  - [ ] Chamadas funcionando
  - [ ] Respostas coerentes
  - [ ] Sem erros de API key

- [ ] **Upstash Redis:**
  - [ ] Dados salvam
  - [ ] Dados carregam
  - [ ] Performance OK

- [ ] **PostgreSQL:**
  - [ ] Minutas salvam
  - [ ] Consultas funcionam
  - [ ] Sem timeout

#### Monitoramento

- [ ] **Vercel Dashboard:**
  - [ ] Logs aparecem
  - [ ] Analytics funcionando
  - [ ] Sem erros críticos

- [ ] **Sentry (se configurado):**
  - [ ] Eventos chegando
  - [ ] PII filtering ativo
  - [ ] Alertas configurados

#### Segurança

- [ ] HTTPS ativo (automático no Vercel)
- [ ] Headers de segurança presentes
- [ ] CORS configurado corretamente
- [ ] PII filtering habilitado
- [ ] Sem chaves expostas no frontend

---

## 🔧 Troubleshooting

Se algo não funcionar, consulte:

1. **[GUIA_CONFIGURACAO_AMBIENTE_IMPLANTACAO.md](GUIA_CONFIGURACAO_AMBIENTE_IMPLANTACAO.md)**
   - Seção "Troubleshooting" com soluções para problemas comuns

2. **Vercel Logs:**
   ```bash
   vercel logs --follow
   ```

3. **Console do Browser:**
   - F12 → Console tab
   - Procure por erros em vermelho

4. **Verificar variáveis:**
   - Vercel Dashboard → Settings → Environment Variables
   - Garantir scope "Production" está marcado

5. **Redeployar:**
   ```bash
   vercel --prod --force
   ```

---

## 📝 Pós-Implantação

### Configurações Adicionais (Opcional)

- [ ] **Custom Domain:**
  - Vercel Dashboard → Domains
  - Adicionar domínio customizado
  - Configurar DNS

- [ ] **Alertas:**
  - Configurar alertas no Sentry
  - Setup uptime monitoring

- [ ] **Backup:**
  - Verificar cron job de backup ativo
  - Testar restore (ambiente staging)

- [ ] **Documentação:**
  - Documentar processos de deploy para equipe
  - Criar runbook de incidentes

### Comunicação

- [ ] **Equipe notificada:**
  - URL de produção compartilhada
  - Credenciais de acesso distribuídas
  - Guia de uso enviado

- [ ] **Stakeholders informados:**
  - Status de deploy comunicado
  - Features disponíveis listadas
  - Cronograma de próximas entregas

---

## 📊 Métricas de Sucesso

Após 24-48h de deploy:

- [ ] Uptime > 99%
- [ ] Error rate < 1%
- [ ] P95 latency < 3s
- [ ] Sem erros críticos no Sentry
- [ ] Feedback positivo de usuários

---

## 🎉 Deploy Completo!

Se você chegou aqui e marcou todos os itens, **parabéns!** 🎊

Seu ambiente está:
- ✅ Configurado corretamente
- ✅ Deployado em produção
- ✅ Validado e funcionando
- ✅ Monitorado e seguro

**Próximos passos:**
1. Monitorar métricas nas primeiras 48h
2. Coletar feedback de usuários
3. Iterar e melhorar conforme necessário

---

**Dúvidas ou problemas?**
- 📖 Consulte: [GUIA_CONFIGURACAO_AMBIENTE_IMPLANTACAO.md](GUIA_CONFIGURACAO_AMBIENTE_IMPLANTACAO.md)
- 🐛 Abra issue: https://github.com/thiagobodevanadv-alt/assistente-juridico-p/issues
- 📧 Contate suporte técnico

---

**Versão:** 1.0.0  
**Última atualização:** Janeiro 2026  
**Compatível com:** Assistente Jurídico PJe v1.4.0+
