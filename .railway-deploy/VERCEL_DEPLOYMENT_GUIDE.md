# 🚀 Guia de Deploy no Vercel - Plano Hobby vs Pro

## Problema Encontrado

```
Error: No more than 12 Serverless Functions can be added to a Deployment 
on the Hobby plan. Create a team (Pro plan) to deploy more.
```

**Causa:** Você tem 15+ endpoints TS no `/api`, mas o plano Hobby permite máximo 12.

---

## ✅ Solução: Upgrade para Pro Plan

### Opção 1: Team (Pro Plan) - Recomendado
```bash
# No console do Vercel:
1. Settings → Billing
2. Change Plan → Pro ($20/mês)
3. Deploy novamente
```

**Benefícios Pro:**
- ✅ Até 100 Serverless Functions
- ✅ 60 conexões simultâneas (vs 10 no Hobby)
- ✅ Observability & Analytics avançado
- ✅ Custom domains ilimitados

---

## 📋 Endpoints Atuais (15)

### Core Agents
1. `api/agents-v2.ts` - Orquestrador V2
2. `api/agents/log.ts` - Logging de agentes

### Legal Services  
3. `api/legal-services.ts` - Consultas PJe
4. `api/pje.ts` - Wrapper PJe

### Tasks & Deadlines
5. `api/todoist.ts` - Integração Todoist
6. `api/tarefas/criar.ts` - Criar tarefa
7. `api/deadline/calculate.ts` - Cálculo de prazos

### Notifications
8. `api/intimacoes/pendente.ts` - Intimações
9. `api/whatsapp/send.ts` - WhatsApp Evolution

### Webhooks & Monitoring
10. `api/todoist-webhook.ts` - Webhook Todoist
11. `api/webhook.ts` - Webhook geral
12. `api/observability.ts` - Circuit breaker
13. `api/kv.ts` - Redis/KV logging

### Utilities
14. `api/cron.ts` - Cron jobs
15. `api/status.ts` - Health check

---

## Alternativa: Consolidação (Se não quiser Pro)

Se preferir ficar no Hobby, pode consolidar em ~10 endpoints:

```typescript
// Exemplo consolidação
api/legal/[action].ts    // PJe, intimações, prazos
api/tasks/[action].ts    // Todoist, criar tarefa
api/webhooks/[source].ts // Todoist, geral
```

Mas **não recomendamos** - perde escalabilidade.

---

## Deploy Corrigido

✅ **Build:** Sem erros TypeScript
✅ **Vercel Config:** Otimizado em `vercel.json`
✅ **.vercelignore:** Reduz tamanho do build

### Próximas Ações:

1. **Upgrade para Pro** (recomendado)
2. Fazer commit das correções
3. Deploy com `vercel --prod`

---

## Variáveis de Ambiente Necessárias

```bash
GEMINI_API_KEY=sk-...
TODOIST_TOKEN=...
DJEN_API_KEY=...
EVOLUTION_API_KEY=...
EVOLUTION_INSTANCE_ID=...
EVOLUTION_API_URL=https://...
```

Configure em: **Vercel Dashboard → Settings → Environment Variables**

---

## Troubleshooting

**Se mesmo com Pro ainda der erro:**
```bash
# Limpar cache de build
vercel env pull
npm ci
npm run build
vercel --prod --force
```

**Ver logs de deploy:**
```bash
vercel logs --prod
```

---

**Status:** ✅ Pronto para Pro Plan
**Próximo Step:** Upgrade + Deploy
