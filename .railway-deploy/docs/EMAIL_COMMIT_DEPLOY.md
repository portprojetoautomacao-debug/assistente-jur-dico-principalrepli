# 🚀 Email Service - Commit e Deploy

## ✅ Arquivos Criados

### Novos Arquivos:
- `api/lib/email-service.ts` - Biblioteca de funções de email com Resend
- `api/emails.ts` - Endpoint POST /api/emails
- `api/integrations/email-examples.ts` - Exemplos de integração com cron jobs
- `scripts/test-email-endpoint.sh` - Script de teste local
- `docs/EMAIL_SETUP_GUIDE.md` - Guia completo de configuração

### Arquivos Modificados:
- Nenhum modificado ainda (apenas novos criados)

## 📋 Checklist Pre-Deploy

- [ ] Adicionar secret `RESEND_API_KEY` no GitHub
- [ ] Testar localmente com `npm run dev`
- [ ] Fazer commit de todos os arquivos
- [ ] Push para main
- [ ] Verificar deploy no Vercel
- [ ] Testar endpoint em produção

## 🔧 Instruções Passo a Passo

### 1️⃣ Adicionar GitHub Secret

```bash
# Opção A: Via GitHub CLI
gh secret set RESEND_API_KEY --body "re_7ThT6k8r_FVT9baVy8BKD2KSWxCWfhTZ2"

# Opção B: Via Web Interface
# Visite: https://github.com/thiagobodevan-a11y/assistente-juridico-p/settings/secrets/actions
# Name: RESEND_API_KEY
# Value: re_7ThT6k8r_FVT9baVy8BKD2KSWxCWfhTZ2
```

### 2️⃣ Testar Localmente

```bash
# Terminal 1: Iniciar servidor dev
npm run dev

# Terminal 2: Executar testes
bash scripts/test-email-endpoint.sh seu-email@example.com
```

### 3️⃣ Fazer Commit

```bash
# Verificar arquivos
git status

# Adicionar todos
git add -A

# Commit com mensagem
git commit -m "feat: add email service with Resend integration

- Add email-service.ts library with 4 template functions
- Add /api/emails endpoint for sending notifications, alerts, summaries
- Add test script for local validation
- Add comprehensive documentation and examples
- Support for urgent deadline alerts with red styling
- Support for daily summary reports with metrics"

# Push para main
git push origin main
```

### 4️⃣ Verificar Deploy no Vercel

```bash
# Acompanhar logs do deploy
vercel logs assistente-juridico-p --follow

# Testar endpoint em produção
curl -X POST https://assistente-juridico-github.vercel.app/api/emails \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "to": "seu-email@example.com"
  }'
```

## 📧 Próximas Etapas

### Fase 2: Integrar com Cron Jobs

Adicionar ao `api/cron.ts` chamadas ao novo endpoint:

```typescript
// Quando detectar nova intimação:
await fetch(`${BASE_URL}/api/emails`, {
  method: 'POST',
  body: JSON.stringify({
    type: 'urgent',
    to: 'usuario@example.com',
    processNumber: intimation.processNumber,
    deadline: intimation.deadline
  })
})

// Resumo diário:
await fetch(`${BASE_URL}/api/emails`, {
  method: 'POST',
  body: JSON.stringify({
    type: 'daily_summary',
    to: 'usuario@example.com',
    summary: { totalProcesses, newIntimations, ... }
  })
})
```

### Fase 3: Adicionar Rate Limiting

Para produção, adicionar rate limiting no endpoint:

```typescript
// Exemplo com Upstash Redis
const rateLimitKey = `email-rate-limit:${to}`;
const count = await redis.incr(rateLimitKey);
if (count === 1) {
  await redis.expire(rateLimitKey, 3600); // 1 hora
}
if (count > 100) {
  return res.status(429).json({ error: 'Too many requests' });
}
```

### Fase 4: Dashboard de Emails

Criar página para visualizar:
- Histórico de emails enviados
- Taxa de entrega
- Bounces
- Performance por tipo

## 🔒 Variáveis de Ambiente

**Localmente (.env):**
```env
RESEND_API_KEY=re_7ThT6k8r_FVT9baVy8BKD2KSWxCWfhTZ2
```

**No Vercel:**
- Usar GitHub Secrets (Vercel sincroniza automaticamente)
- OU adicionar manualmente em: https://vercel.com/dashboard/thiagobodevan-a11y/assistente-juridico-p/settings/environment-variables

## 🐛 Troubleshooting

### Email não funciona em produção

1. **Verificar se secret foi sincronizado:**
   ```bash
   vercel env ls
   ```

2. **Verificar logs:**
   ```bash
   vercel logs assistente-juridico-p --follow --prod
   ```

3. **Verificar Resend dashboard:**
   - https://resend.com/emails
   - Procure por emails com status "failed"

### Erro: "RESEND_API_KEY is undefined"

- Secret não foi adicionada ao GitHub
- OU Vercel não sincronizou ainda
- Tente fazer re-deploy: `git push origin main`

### Email muito lento

- Implementar caching de templates
- Usar batching para múltiplos recipients
- Ver Exemplo 7 em `api/integrations/email-examples.ts`

## 📊 Monitoramento

**Resend Dashboard:**
- https://resend.com/emails
- Visualizar histórico de envios
- Acompanhar taxa de entrega
- Identificar bounces

**Vercel Logs:**
```bash
vercel logs assistente-juridico-p --prod
```

**GitHub Actions:**
- Deploy logs automáticos ao fazer push
- https://github.com/thiagobodevan-a11y/assistente-juridico-p/actions

## 📞 Suporte

**Resend Support:**
- Email: support@resend.com
- Docs: https://resend.com/docs

**Vercel Support:**
- Docs: https://vercel.com/docs
- Dashboard: https://vercel.com/dashboard

---

**Status:** ✅ Pronto para deploy

**Tempo estimado:**
- Setup: 5 minutos
- Testes: 10 minutos
- Deploy: 5 minutos
- Total: 20 minutos
