# ?? RUNBOOK DE EMERGÊNCIA - Assistente Jurídico PJe

> **MODO MANUTENÇÃO ATIVO** - Sistema em produção estável  
> **Última Atualização**: 09/12/2024  
> **Versão**: 2.0.0

---

## ?? **CONTATOS DE EMERGÊNCIA**

| Papel | Nome | Contato | Horário |
|-------|------|---------|---------|
| **Tech Lead** | Thiago Bodevan | thiagobodevanadv@gmail.com | 24/7 |
| **Vercel Support** | - | https://vercel.com/support | 24/7 |
| **Sentry** | - | https://sentry.io/support | 24/7 |
| **Upstash Support** | - | https://upstash.com/support | 24/7 |

---

## ?? **INTERRUPÇÃO TOTAL DO SERVIÇO**

### **Sintomas**
- ? App não carrega (erro 500/502/503)
- ? API não responde
- ? Dashboard em branco
- ? Erro "Failed to fetch" em todas as chamadas

### **Passos Imediatos (5 minutos)**

#### **1. Verificar Status da Plataforma**

```bash
# Verificar Vercel Status
curl -I https://assistente-juridico-github.vercel.app/

# Verificar API Health
curl https://assistente-juridico-github.vercel.app/api/health

# Saída esperada (saudável):
# HTTP/2 200
# {"status":"ok","timestamp":"..."}
```

#### **2. Verificar Logs do Vercel**

```bash
# Via CLI
vercel logs assistente-juridico-p --follow

# Via Dashboard
# https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/logs
```

**O que procurar:**
- ?? `Error: ECONNREFUSED` ? Upstash Redis offline
- ?? `GEMINI_API_KEY` ? Chave de API inválida
- ?? `timeout` ? Função serverless excedeu 10s
- ?? `Out of memory` ? Limite de 1GB atingido

#### **3. Rollback Imediato**

```bash
# Listar deployments recentes
vercel ls assistente-juridico-p

# Promover deployment anterior (substitua URL)
vercel promote <deployment-url> --yes

# Exemplo:
vercel promote https://assistente-juridico-p-abc123.vercel.app --yes
```

**Tempo esperado**: 30-60 segundos para rollback

#### **4. Pausar Agentes IA (Opcional)**

Se o problema for causado por agentes:

```bash
# Via API (requer API_KEY)
curl -X POST https://assistente-juridico-github.vercel.app/api/agents \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "pause_all"}'
```

Ou via código:

```typescript
// src/hooks/use-autonomous-agents.ts
// Comentar temporariamente:
// const isEnabled = agent.enabled && agent.status === 'active'
const isEnabled = false // EMERGÊNCIA: desabilitar todos
```

#### **5. Notificar Stakeholders**

```
Subject: [CRÍTICO] Assistente Jurídico PJe - Interrupção Temporária

O sistema está temporariamente indisponível devido a [RAZÃO].

Ações tomadas:
- Rollback para versão anterior
- Agentes pausados
- Investigação em andamento

ETA de resolução: [TEMPO ESTIMADO]

Status: https://status-page-url (se houver)
```

---

## ?? **ERRO CRÍTICO EM PRODUÇÃO**

### **Sintomas**
- ?? Funções específicas não funcionam
- ?? Erros intermitentes
- ?? Taxa de erro Sentry > 5%

### **Passos Imediatos (15 minutos)**

#### **1. Identificar Erro no Sentry**

```bash
# Acessar dashboard
https://sentry.io/organizations/thiagobodevan-a11y/issues/

# Filtrar:
# - is:unresolved
# - timesSeen:>10
# - level:error OR level:fatal
```

**Erros Comuns:**

| Erro | Causa Provável | Solução Rápida |
|------|----------------|----------------|
| `UPSTASH_REDIS_REST_URL is not defined` | Variável de ambiente faltando | Adicionar no Vercel Dashboard |
| `GEMINI_API_KEY invalid` | Chave de API expirou | Regenerar em https://aistudio.google.com/app/apikey |
| `Collection 'legal_docs' not found` | Qdrant collection deletada | Rodar `npm run qdrant:init` |
| `Rate limit exceeded` | Muitas chamadas ao Gemini | Implementar throttling |

#### **2. Criar Hotfix Branch**

```bash
# Criar branch de correção urgente
git checkout main
git pull origin main
git checkout -b hotfix/critical-error-$(date +%Y%m%d)

# Fazer correção mínima necessária
# Testar localmente
npm run type-check
npm run lint
npm run test:run
npm run build

# Commit e push
git add .
git commit -m "hotfix: corrigir [DESCRIÇÃO DO ERRO]"
git push origin hotfix/critical-error-$(date +%Y%m%d)
```

#### **3. Deploy Direto (Bypass CI)**

```bash
# Deploy imediato via Vercel CLI
vercel --prod

# Ou via Dashboard:
# Vercel ? assistente-juridico-p ? Deployments ? Redeploy
```

#### **4. Validar Correção**

```bash
# Verificar API Health
curl https://assistente-juridico-github.vercel.app/api/health

# Verificar Sentry (próximos 5 minutos)
# Taxa de erro deve cair para < 1%

# Testar funcionalidade afetada manualmente
```

---

## ?? **DEGRADAÇÃO DE PERFORMANCE**

### **Sintomas**
- ?? App lento (> 3s para carregar)
- ?? API timeout (> 10s)
- ?? Core Web Vitals ruins (LCP > 2.5s)

### **Diagnóstico (10 minutos)**

#### **1. Verificar Vercel Analytics**

```
Dashboard: https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/analytics

Métricas críticas:
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1
- TTFB (Time to First Byte) < 600ms
```

#### **2. Verificar Upstash Redis**

```bash
# Via Dashboard
https://console.upstash.com/redis/

# Verificar:
# - Latency: < 100ms
# - Memory Usage: < 90%
# - Commands/sec: < 1000
```

**Se memória > 90%:**

```bash
# Limpar cache antigo (via código)
curl -X POST https://assistente-juridico-github.vercel.app/api/cache/clear \
  -H "Authorization: Bearer $API_KEY"
```

#### **3. Verificar Qdrant Cloud**

```bash
# Via Dashboard
https://cloud.qdrant.io/clusters

# Verificar:
# - Status: Green
# - Storage: < 900MB (free tier = 1GB)
# - Latency: < 200ms
```

**Se storage > 900MB:**

```bash
# Deletar vetores antigos (> 90 dias)
npm run qdrant:cleanup-old
```

#### **4. Otimizações Imediatas**

```typescript
// src/lib/config.ts
// Reduzir limites temporariamente

export const LIMITS = {
  MAX_TASKS_PER_AGENT: 5, // Era 10
  MAX_CONCURRENT_AGENTS: 3, // Era 5
  CACHE_TTL: 300, // 5min (era 3600 = 1h)
}
```

---

## ?? **AGENTES IA COM COMPORTAMENTO ANÔMALO**

### **Sintomas**
- ?? Agente criando tarefas em loop infinito
- ?? Minutas com qualidade ruim
- ?? Consumo excessivo de tokens Gemini

### **Passos Imediatos**

#### **1. Pausar Agente Específico**

```bash
# Via API
curl -X POST https://assistente-juridico-github.vercel.app/api/agents \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "pause",
    "agentId": "redacao-peticoes"
  }'
```

#### **2. Limpar Fila de Tarefas**

```bash
# Via script
npm run clear-agent-queue redacao-peticoes

# Ou manualmente via Upstash Dashboard
# Key: agent-task-queue
# Action: Delete
```

#### **3. Resetar Estado do Agente**

```typescript
// src/lib/agents.ts
// Encontrar agente problemático e resetar:

const AGENTS: Agent[] = [
  {
    id: 'redacao-peticoes',
    // ...outras props
    enabled: false, // ? DESABILITAR TEMPORARIAMENTE
    tasksCompleted: 0, // ? RESETAR
    tasksToday: 0,
  }
]
```

#### **4. Investigar Logs do Agente**

```bash
# Filtrar logs do Vercel por agente
vercel logs assistente-juridico-p --follow | grep "redacao-peticoes"

# Ou via Sentry
# https://sentry.io ? Filtrar por tag: agent_id = redacao-peticoes
```

---

## ?? **CHECKLIST DIÁRIO OBRIGATÓRIO**

### **?? Executar Todo Dia (09:00 BRT)**

```bash
# 1. Verificar Health do Sistema (2 min)
curl https://assistente-juridico-github.vercel.app/api/health

# Saída esperada:
# {"status":"ok","timestamp":"...","uptime":...}

# 2. Verificar Logs de Erro (3 min)
# Acessar: https://sentry.io
# Filtrar: is:unresolved, last 24h
# Meta: 0 erros críticos, < 5 erros médios

# 3. Executar Type Check (1 min)
npm run type-check

# Saída esperada:
# ? No TypeScript errors

# 4. Executar Lint (1 min)
npm run lint

# Saída esperada:
# ? 0 errors, ?150 warnings (limite configurado)

# 5. Executar Testes Unitários (2 min)
npm run test:run

# Saída esperada:
# Test Files  X passed (X)
# Tests  Y passed (Y)

# 6. Executar Build (3 min)
npm run build

# Saída esperada:
# ? built in Xs
# ? 0 errors, 0 warnings

# 7. Verificar Métricas Vercel (2 min)
# https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/analytics
# - LCP < 2.5s
# - Error Rate < 1%

# 8. Verificar Uso de Recursos (2 min)
# Upstash: < 90% memória
# Qdrant: < 900MB storage
# Gemini: < 80% quota diária
```

**Tempo Total**: ~16 minutos

**Se algum check falhar:**
- ? Documentar erro no GitHub Issues
- ? Criar label "daily-check-failure"
- ? Notificar tech lead se crítico

---

## ?? **PROCEDIMENTOS DE MANUTENÇÃO**

### **Atualização de Dependências (Mensal)**

```bash
# 1. Verificar dependências desatualizadas
npm outdated

# 2. Atualizar apenas patches e minors
npm update

# 3. Verificar breaking changes em majors
# Consultar changelogs antes de:
npm install <package>@latest

# 4. Testar tudo
npm run type-check && npm run lint && npm run test:run && npm run build

# 5. Deploy em staging primeiro
vercel --env=preview

# 6. Se OK, deploy em produção
vercel --prod
```

### **Rotação de API Keys (Trimestral)**

```bash
# 1. Gerar novas keys
# - Google: https://console.cloud.google.com/apis/credentials
# - Gemini: https://aistudio.google.com/app/apikey
# - Upstash: https://console.upstash.com/

# 2. Adicionar novas keys no Vercel com sufixo _NEW
VITE_GEMINI_API_KEY_NEW=xxx
GOOGLE_CLIENT_ID_NEW=xxx

# 3. Testar com novas keys (branch de teste)

# 4. Promover keys _NEW para versão principal

# 5. Revogar keys antigas após 7 dias
```

### **Backup Manual (Semanal)**

```bash
# 1. Exportar dados do Upstash
npm run backup:upstash

# 2. Exportar vetores do Qdrant
npm run backup:qdrant

# 3. Upload para Google Drive (automático via script)

# 4. Verificar integridade
npm run verify:backups
```

---

## ?? **ENDPOINTS DE VERIFICAÇÃO**

### **Health Checks**

| Endpoint | Método | Resposta Esperada | Timeout |
|----------|--------|-------------------|---------|
| `/api/health` | GET | `{"status":"ok"}` | 1s |
| `/api/status` | GET | JSON com detalhes | 3s |
| `/api/agents?action=status` | GET | Lista de agentes | 2s |
| `/api/djen-sync` | POST | `{"ok":true}` | 30s |
| `/api/expedientes` | GET | Array de expedientes | 5s |

### **Monitoramento Externo**

```bash
# UptimeRobot (recomendado)
# Monitor: https://assistente-juridico-github.vercel.app/api/health
# Interval: 5 minutos
# Alert: Email + SMS se down > 2 minutos

# Status Page (opcional)
# https://status.io ou https://statuspage.io
```

---

## ?? **MATRIZ DE ESCALAÇÃO**

| Severidade | Tempo de Resposta | Ação | Notificar |
|------------|-------------------|------|-----------|
| **P0 - Crítico** | Imediato (< 5 min) | Rollback + Investigação | Tech Lead + Stakeholders |
| **P1 - Alto** | < 30 min | Hotfix + Deploy | Tech Lead |
| **P2 - Médio** | < 2 horas | Fix + PR | Tech Lead |
| **P3 - Baixo** | < 1 dia | Issue + Backlog | Equipe |

### **Definições de Severidade**

**P0 - Crítico:**
- Sistema completamente fora do ar
- Perda de dados
- Violação de segurança/LGPD

**P1 - Alto:**
- Funcionalidade principal não funciona
- Erro afeta > 50% dos usuários
- Taxa de erro Sentry > 10%

**P2 - Médio:**
- Bug que afeta UX mas tem workaround
- Performance degradada (LCP > 5s)
- Taxa de erro Sentry 5-10%

**P3 - Baixo:**
- Melhorias cosméticas
- Typos em UI
- Performance OK mas pode melhorar

---

## ?? **DOCUMENTAÇÃO DE REFERÊNCIA**

| Documento | Link |
|-----------|------|
| **README Principal** | [README.md](../README.md) |
| **Instruções Copilot** | [.github/copilot-instructions.md](../.github/copilot-instructions.md) |
| **Upgrade Agentes** | [docs/UPGRADE_AGENTES_RESUMO_COMPLETO.md](UPGRADE_AGENTES_RESUMO_COMPLETO.md) |
| **LGPD Compliance** | [docs/LGPD_COMPLIANCE.md](LGPD_COMPLIANCE.md) |
| **Deploy Checklist** | [docs/DEPLOY_CHECKLIST_v1.4.0.md](DEPLOY_CHECKLIST_v1.4.0.md) |
| **Sentry AI Monitoring** | [docs/SENTRY_AI_MONITORING.md](SENTRY_AI_MONITORING.md) |

---

## ?? **TROUBLESHOOTING RÁPIDO**

### **Problema: "Failed to fetch" em todas as APIs**

```bash
# Causa: CORS ou Vercel Functions offline
# Solução:
1. Verificar vercel.json ? headers CORS
2. Verificar se functions estão em /api/*.ts
3. Redeploy: vercel --prod
```

### **Problema: Agentes não criam tarefas**

```bash
# Causa: Fila do Upstash cheia ou corrompida
# Solução:
1. Limpar fila: npm run clear-agent-queue
2. Verificar logs: vercel logs | grep "agent-task"
3. Reiniciar agentes: pausar + retomar
```

### **Problema: Qdrant retorna "Collection not found"**

```bash
# Causa: Collection deletada ou cluster offline
# Solução:
1. Verificar: https://cloud.qdrant.io/clusters
2. Recriar: npm run qdrant:init
3. Popular: npm run qdrant:populate-datajud
```

### **Problema: Build falha com "Module not found"**

```bash
# Causa: Dependência faltando no package.json
# Solução:
1. Limpar cache: rm -rf node_modules package-lock.json
2. Reinstalar: npm install
3. Build: npm run build
```

---

## ? **CHECKLIST PÓS-INCIDENTE**

Após resolver qualquer incidente:

- [ ] Documentar causa raiz no GitHub Issues
- [ ] Atualizar este runbook se necessário
- [ ] Criar post-mortem (para P0/P1)
- [ ] Adicionar teste para prevenir recorrência
- [ ] Notificar resolução aos stakeholders
- [ ] Revisar alertas/monitoramento

---

**Última revisão**: 09/12/2024  
**Próxima revisão**: 09/01/2025  
**Responsável**: Thiago Bodevan
