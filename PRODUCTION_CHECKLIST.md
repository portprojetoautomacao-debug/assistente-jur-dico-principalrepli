# ✅ Checklist de Produção
## Assistente Jurídico PJe - Guia Passo a Passo

**Versão:** 1.0.1  
**Data:** Janeiro 2026

---

## 📋 Índice
1. [Preparação (1-2 semanas antes)](#1-preparação)
2. [Testes Finais (1 semana antes)](#2-testes-finais)
3. [Configuração de Infraestrutura (3-5 dias antes)](#3-configuração-de-infraestrutura)
4. [Deploy em Staging (2-3 dias antes)](#4-deploy-em-staging)
5. [Validação Final (1 dia antes)](#5-validação-final)
6. [Deploy em Produção (Dia D)](#6-deploy-em-produção)
7. [Monitoramento Pós-Deploy (24-48h)](#7-monitoramento-pós-deploy)
8. [Rollback (Se necessário)](#8-rollback-se-necessário)

---

## 1. Preparação (1-2 semanas antes)

### 1.1 Código e Testes
- [ ] Branch `main` estável
- [ ] Todos os PRs revisados e merged
- [ ] Sem conflitos de merge
- [ ] Changelog atualizado
- [ ] Versão bumped (1.0.1)

**Comandos:**
```bash
git checkout main
git pull origin main
git log --oneline -10
npm version patch  # 1.0.0 -> 1.0.1
```

---

### 1.2 Testes Locais
- [ ] Testes unitários passam
- [ ] Testes de integração passam
- [ ] Testes E2E passam
- [ ] Cobertura > 70%

**Comandos:**
```bash
npm run test:run
npm run test:integration
npm run test:e2e
npm run test:coverage
```

**Resultado esperado:**
```
✅ Test Files: 121 passed
✅ Tests: 500+ passed
✅ Coverage: > 70%
```

---

### 1.3 Qualidade de Código
- [ ] Lint sem erros
- [ ] Type-check sem erros
- [ ] Sem vulnerabilidades críticas
- [ ] Dependências atualizadas

**Comandos:**
```bash
npm run lint
npm run type-check
npm audit
npm outdated
```

---

### 1.4 Build de Produção
- [ ] Build sem erros
- [ ] Bundle size < 2MB (gzipped)
- [ ] Assets otimizados

**Comandos:**
```bash
npm run build:deploy
du -sh dist/
```

---

## 2. Testes Finais (1 semana antes)

### 2.1 Testes Funcionais
- [ ] Autenticação ✅
- [ ] Gestão de Processos ✅
- [ ] Sistema de Minutas ✅
- [ ] Cálculo de Prazos ✅
- [ ] Agentes de IA ✅
- [ ] Busca Global ✅
- [ ] Notificações ✅
- [ ] Upload de Documentos ✅
- [ ] Calendário ✅
- [ ] Gestão Financeira ✅

**Referência:** `SPECIFIC_TEST_SCENARIOS.md`

---

### 2.2 Testes de Performance
- [ ] Lighthouse score > 90
- [ ] FCP < 1.5s
- [ ] LCP < 2.5s
- [ ] TTI < 3.5s
- [ ] TBT < 300ms
- [ ] CLS < 0.1

**Comandos:**
```bash
npm run build
npx lighthouse http://localhost:4173 --view
```

---

### 2.3 Testes de Carga
- [ ] 10 usuários simultâneos ✅
- [ ] 50 usuários simultâneos ✅
- [ ] 100 usuários simultâneos ⚠️
- [ ] 1000 processos carregados ✅

**Ferramentas:**
- Artillery
- k6
- Azure Load Testing

---

### 2.4 Testes de Segurança
- [ ] `npm audit` limpo
- [ ] Headers de segurança configurados
- [ ] CORS configurado
- [ ] Rate limiting testado
- [ ] Secrets não expostos

**Comandos:**
```bash
npm audit
npm audit fix
```

---

## 3. Configuração de Infraestrutura (3-5 dias antes)

### 3.1 Escolher Plataforma de Deploy
**Recomendação:** Railway ⭐⭐⭐

**Alternativas:**
- Render (gratuita)
- Vercel (frontend)
- Fly.io (flexível)
- DigitalOcean (controle total)

**Referência:** `DEPLOY_CONFIG.md`

---

### 3.2 Configurar Variáveis de Ambiente
- [ ] `DATABASE_URL` (PostgreSQL)
- [ ] `VITE_GEMINI_API_KEY` (IA)
- [ ] `PORT` (3001)
- [ ] `NODE_ENV=production`
- [ ] Opcionais: Azure, Sentry, Redis, Qdrant

**Arquivo:** `.env.example` (88 variáveis documentadas)

**Railway:**
```bash
# Via CLI
railway variables set DATABASE_URL="postgresql://..."
railway variables set VITE_GEMINI_API_KEY="..."
railway variables set NODE_ENV="production"

# Via Dashboard
# Settings > Variables > Add Variable
```

---

### 3.3 Configurar Banco de Dados
- [ ] PostgreSQL 16+ provisionado
- [ ] Database criado
- [ ] Usuário e senha configurados
- [ ] Conexão testada
- [ ] Migrations aplicadas
- [ ] Backup inicial realizado

**Railway:**
```bash
# Provisionar PostgreSQL
railway add postgresql

# Obter connection string
railway variables get DATABASE_URL

# Aplicar migrations (se houver)
npm run migrate
```

---

### 3.4 Configurar Serviços Opcionais

#### Redis (Cache)
- [ ] Instância provisionada
- [ ] Connection string configurada
- [ ] Testado

#### Qdrant (Busca Vetorial)
- [ ] Instância provisionada
- [ ] Collection criada
- [ ] API key configurada

#### Azure Application Insights (Monitoramento)
- [ ] Resource criado
- [ ] Instrumentation key configurada
- [ ] Testado

#### Sentry (Error Tracking)
- [ ] Projeto criado
- [ ] DSN configurado
- [ ] Testado

---

## 4. Deploy em Staging (2-3 dias antes)

### 4.1 Criar Ambiente de Staging
- [ ] Ambiente separado criado
- [ ] Variáveis de ambiente configuradas
- [ ] Database de staging provisionado
- [ ] Dados de teste carregados

**Railway:**
```bash
# Criar novo environment
railway environment create staging

# Fazer deploy
railway up --environment staging
```

---

### 4.2 Deploy em Staging
- [ ] Build executado
- [ ] Deploy bem-sucedido
- [ ] Aplicação acessível
- [ ] Logs sem erros

**Comandos:**
```bash
# Railway
railway up --environment staging

# Verificar logs
railway logs --environment staging

# Verificar status
railway status --environment staging
```

---

### 4.3 Smoke Tests em Staging
- [ ] Aplicação carrega
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Criar processo funciona
- [ ] Criar minuta funciona
- [ ] Agentes respondem

**Checklist rápido:**
```
✅ GET  /                    -> 200
✅ POST /api/auth/login      -> 200
✅ GET  /api/processes       -> 200
✅ POST /api/processes       -> 201
✅ GET  /api/minutas         -> 200
✅ POST /api/agents/execute  -> 200
```

---

### 4.4 Testes Completos em Staging
- [ ] Todos os cenários de teste executados
- [ ] Performance validada
- [ ] Segurança validada
- [ ] Integrações funcionando

**Referência:** `SPECIFIC_TEST_SCENARIOS.md`

---

## 5. Validação Final (1 dia antes)

### 5.1 Revisão de Código
- [ ] Último PR revisado
- [ ] Sem código comentado
- [ ] Sem console.logs desnecessários
- [ ] Sem TODOs críticos

---

### 5.2 Revisão de Documentação
- [ ] README atualizado
- [ ] DEPLOY_CONFIG.md completo
- [ ] PRODUCTION_TEST_REPORT.md revisado
- [ ] SPECIFIC_TEST_SCENARIOS.md revisado
- [ ] ACCEPTANCE_CRITERIA.md revisado
- [ ] PRODUCTION_CHECKLIST.md (este arquivo) revisado

---

### 5.3 Preparar Comunicação
- [ ] Email para stakeholders preparado
- [ ] Janela de manutenção definida
- [ ] Equipe de suporte notificada
- [ ] Plano de comunicação de incidentes

**Template de email:**
```
Assunto: Deploy em Produção - Assistente Jurídico PJe v1.0.1

Prezados,

Informamos que será realizado o deploy da versão 1.0.1 do 
Assistente Jurídico PJe em produção.

Data: [DATA]
Horário: [HORÁRIO] (horário de Brasília)
Duração estimada: 30 minutos
Impacto: Sistema indisponível durante o deploy

Novidades da versão 1.0.1:
- [FEATURE 1]
- [FEATURE 2]
- [BUG FIX 1]

Em caso de dúvidas, entre em contato.

Atenciosamente,
Equipe de Desenvolvimento
```

---

### 5.4 Preparar Plano de Rollback
- [ ] Backup de produção realizado
- [ ] Versão anterior identificada
- [ ] Comandos de rollback testados
- [ ] Tempo estimado de rollback: < 10 minutos

**Comandos de rollback:**
```bash
# Railway
railway rollback --environment production

# Ou deploy de versão anterior
git checkout v1.0.0
railway up --environment production
```

---

## 6. Deploy em Produção (Dia D)

### 6.1 Pré-Deploy (30 min antes)
- [ ] Backup final de produção
- [ ] Equipe de plantão disponível
- [ ] Monitoramento ativo
- [ ] Comunicação enviada

**Comandos:**
```bash
# Backup de database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Verificar status atual
railway status --environment production
```

---

### 6.2 Deploy
- [ ] Janela de manutenção iniciada
- [ ] Deploy executado
- [ ] Build bem-sucedido
- [ ] Aplicação iniciada
- [ ] Health check passou

**Comandos:**
```bash
# Railway
railway up --environment production

# Verificar logs em tempo real
railway logs --environment production --follow

# Verificar health
curl https://seu-app.railway.app/health
```

**Tempo estimado:** 5-10 minutos

---

### 6.3 Smoke Tests em Produção
- [ ] Aplicação carrega (< 3s)
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Criar processo funciona
- [ ] Criar minuta funciona
- [ ] Agentes respondem

**Checklist rápido:**
```bash
# Automatizado
npm run test:smoke -- --env=production

# Manual
1. Abrir https://seu-app.railway.app
2. Fazer login
3. Criar processo de teste
4. Criar minuta de teste
5. Executar agente de teste
```

**Tempo estimado:** 10-15 minutos

---

### 6.4 Validação Completa
- [ ] Todas as funcionalidades críticas testadas
- [ ] Performance dentro do esperado
- [ ] Sem erros nos logs
- [ ] Métricas normais

**Tempo estimado:** 15-20 minutos

---

### 6.5 Finalização
- [ ] Janela de manutenção encerrada
- [ ] Comunicação de sucesso enviada
- [ ] Documentação atualizada
- [ ] Changelog publicado

**Template de email:**
```
Assunto: Deploy Concluído - Assistente Jurídico PJe v1.0.1

Prezados,

O deploy da versão 1.0.1 foi concluído com sucesso.

O sistema está operacional e disponível em:
https://seu-app.railway.app

Novidades:
- [FEATURE 1]
- [FEATURE 2]
- [BUG FIX 1]

Em caso de problemas, entre em contato.

Atenciosamente,
Equipe de Desenvolvimento
```

---

## 7. Monitoramento Pós-Deploy (24-48h)

### 7.1 Primeiras 2 horas
- [ ] Monitorar logs continuamente
- [ ] Verificar métricas a cada 15 min
- [ ] Responder a alertas imediatamente
- [ ] Coletar feedback de usuários

**Métricas a monitorar:**
- Uptime
- Tempo de resposta
- Taxa de erro
- CPU/Memória
- Requisições/segundo

---

### 7.2 Primeiras 24 horas
- [ ] Verificar métricas a cada hora
- [ ] Revisar logs de erro
- [ ] Coletar feedback de usuários
- [ ] Documentar issues encontrados

**Critérios de sucesso:**
- Uptime > 99.9%
- Tempo de resposta < 500ms
- Taxa de erro < 0.5%
- Sem bugs críticos

---

### 7.3 Primeiras 48 horas
- [ ] Verificar métricas a cada 4 horas
- [ ] Revisar todos os logs
- [ ] Consolidar feedback
- [ ] Planejar hotfixes se necessário

---

### 7.4 Primeira semana
- [ ] Monitoramento normal
- [ ] Revisar métricas semanais
- [ ] Priorizar bugs reportados
- [ ] Planejar próxima release

---

## 8. Rollback (Se necessário)

### 8.1 Critérios para Rollback
**Executar rollback se:**
- ❌ Uptime < 95% nas primeiras 2h
- ❌ Taxa de erro > 5%
- ❌ Bug crítico bloqueador
- ❌ Perda de dados detectada
- ❌ Performance inaceitável (> 5s)

---

### 8.2 Procedimento de Rollback
1. **Comunicar decisão** (2 min)
   - Notificar equipe
   - Notificar stakeholders

2. **Executar rollback** (5 min)
   ```bash
   # Railway
   railway rollback --environment production
   
   # Verificar
   railway status --environment production
   ```

3. **Validar rollback** (5 min)
   - Smoke tests
   - Verificar logs
   - Confirmar estabilidade

4. **Restaurar dados** (se necessário) (10 min)
   ```bash
   # Restaurar backup
   psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
   ```

5. **Comunicar conclusão** (2 min)
   - Email para stakeholders
   - Post-mortem agendado

**Tempo total:** 15-25 minutos

---

### 8.3 Post-Mortem
- [ ] Reunião agendada (24h após rollback)
- [ ] Causa raiz identificada
- [ ] Ações corretivas definidas
- [ ] Documentação atualizada
- [ ] Plano para próximo deploy

**Template de post-mortem:**
```markdown
# Post-Mortem: Rollback do Deploy v1.0.1

## Resumo
[Breve descrição do incidente]

## Timeline
- HH:MM - Deploy iniciado
- HH:MM - Problema detectado
- HH:MM - Decisão de rollback
- HH:MM - Rollback concluído

## Causa Raiz
[Descrição detalhada]

## Impacto
- Usuários afetados: X
- Duração: Y minutos
- Perda de dados: Sim/Não

## Ações Corretivas
1. [Ação 1]
2. [Ação 2]
3. [Ação 3]

## Lições Aprendidas
- [Lição 1]
- [Lição 2]

## Próximos Passos
- [ ] Corrigir bug
- [ ] Adicionar teste
- [ ] Melhorar monitoramento
- [ ] Agendar novo deploy
```

---

## 📊 Métricas de Sucesso

### Deploy Bem-Sucedido
✅ Uptime > 99.9% nas primeiras 24h  
✅ Tempo de resposta < 500ms  
✅ Taxa de erro < 1%  
✅ Sem bugs críticos  
✅ Feedback positivo > 80%  

### Deploy com Problemas
⚠️ Uptime 95-99%  
⚠️ Tempo de resposta 500-1000ms  
⚠️ Taxa de erro 1-3%  
⚠️ 1-2 bugs críticos (com workaround)  
⚠️ Feedback positivo 60-80%  

### Deploy Falho (Rollback necessário)
❌ Uptime < 95%  
❌ Tempo de resposta > 1000ms  
❌ Taxa de erro > 3%  
❌ Bugs críticos bloqueadores  
❌ Feedback positivo < 60%  

---

## 🔧 Ferramentas Úteis

### Monitoramento
- **Railway Dashboard** - Métricas básicas
- **Azure Application Insights** - APM completo
- **Sentry** - Error tracking
- **Uptime Robot** - Uptime monitoring

### Logs
```bash
# Railway
railway logs --environment production --follow

# Filtrar erros
railway logs --environment production | grep ERROR

# Últimas 100 linhas
railway logs --environment production --tail 100
```

### Métricas
```bash
# Railway
railway metrics --environment production

# CPU/Memória
railway metrics --environment production --type cpu
railway metrics --environment production --type memory
```

---

## 📞 Contatos de Emergência

**Equipe de Desenvolvimento:**
- [Nome] - [Email] - [Telefone]

**DevOps:**
- [Nome] - [Email] - [Telefone]

**Product Owner:**
- [Nome] - [Email] - [Telefone]

**Suporte Railway:**
- Discord: https://discord.gg/railway
- Email: team@railway.app

---

## 📝 Notas Finais

- Este checklist deve ser seguido rigorosamente
- Não pular etapas, mesmo que pareçam desnecessárias
- Documentar qualquer desvio do plano
- Atualizar checklist com lições aprendidas
- Revisar antes de cada deploy

**Última atualização:** Janeiro 2026  
**Próxima revisão:** Após primeiro deploy em produção

---

## ✅ Assinatura de Execução

**Deploy executado por:** _______________  
**Data:** ___/___/______  
**Horário:** ___:___  
**Resultado:** ☐ Sucesso  ☐ Rollback  
**Observações:** _______________________
