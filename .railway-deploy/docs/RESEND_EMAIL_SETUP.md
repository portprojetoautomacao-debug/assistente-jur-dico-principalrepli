# 📧 Configuração do Resend para Envio de E-mails

> **Status**: ✅ Integração completa implementada - Pronto para produção

Este guia detalha como configurar o serviço de e-mail Resend no Assistente Jurídico PJe.

---

## 🎯 Visão Geral

O sistema usa **Resend** como provedor de e-mail para:
- ✅ Envio de notificações de intimações e prazos urgentes
- ✅ Alertas automáticos dos agentes de IA
- ✅ Resumos diários de atividades
- ✅ Comunicações com clientes e operadores

**Vantagens do Resend:**
- 🆓 **Free tier generoso**: 3.000 emails/mês grátis
- ⚡ **API moderna**: SDK TypeScript nativo
- 📊 **Analytics integrado**: Tracking de aberturas e cliques
- 🔒 **DKIM/SPF configurados**: Alta deliverability
- 💼 **Domínio customizável**: Envie de `seu-escritorio.com.br`

---

## 📦 1. Criar Conta no Resend

1. Acesse https://resend.com/signup
2. Crie sua conta (pode usar GitHub/Google)
3. Confirme o e-mail de verificação

---

## 🔑 2. Obter API Key

### Passo 1: Criar API Key

1. Acesse https://resend.com/api-keys
2. Clique em **"Create API Key"**
3. Configure:
   - **Name**: `Assistente Jurídico PJe - Production`
   - **Permission**: `Sending access` (Full access se precisar de logs)
   - **Domain**: Selecione seu domínio ou use `onboarding` (temporário)

4. **Copie a API Key** - ela só é exibida uma vez!
   ```
   re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Passo 2: Configurar Domínio (Opcional mas Recomendado)

**Para enviar de `contato@seu-escritorio.com.br` em vez de `onboarding@resend.dev`:**

1. Acesse https://resend.com/domains
2. Clique em **"Add Domain"**
3. Digite seu domínio: `seu-escritorio.com.br`
4. Adicione os registros DNS fornecidos:

```dns
# No seu provedor de DNS (Cloudflare, GoDaddy, etc):
TXT  _resend       resend-verification-code
TXT  resend._domainkey    <DKIM key fornecido>
MX   @             feedback-smtp.resend.com (priority 10)
```

5. Aguarde verificação (pode levar até 72h, geralmente 10-30min)
6. Status mudará para ✅ **Verified**

---

## ⚙️ 3. Configurar no Vercel

### Método 1: Via Dashboard (Recomendado)

1. Acesse https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/settings/environment-variables

2. Adicione as variáveis:

| Variable Name      | Value                                    | Environments         |
|--------------------|------------------------------------------|----------------------|
| `RESEND_API_KEY`   | `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`        | Production, Preview  |
| `EMAIL_API_KEY`    | `<gerar token seguro>` (*)               | Production, Preview  |
| `EMAIL_FROM`       | `contato@seu-escritorio.com.br` (**)     | Production, Preview  |

(*) Gere um token seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

(**) Se ainda não configurou domínio, use:
```
onboarding@resend.dev
```

3. Clique em **"Save"**

### Método 2: Via CLI (Alternativo)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Adicionar variáveis
vercel env add RESEND_API_KEY
vercel env add EMAIL_API_KEY
vercel env add EMAIL_FROM
```

---

## 🧪 4. Testar Integração

### Teste Local (Desenvolvimento)

1. **Criar arquivo `.env.local`:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_API_KEY=test-token-123
EMAIL_FROM=contato@seu-escritorio.com.br
```

2. **Testar envio:**
```bash
# Iniciar servidor local
npm run dev

# Em outro terminal, enviar email de teste
curl -X POST 'http://localhost:5173/api/emails' \
  -H 'Authorization: Bearer test-token-123' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "test",
    "to": "seu-email@exemplo.com"
  }'
```

3. **Verificar resposta:**
```json
{
  "success": true,
  "messageId": "abc123-def456",
  "message": "Email de tipo \"test\" enviado com sucesso"
}
```

4. **Verificar inbox** - Email deve chegar em ~5-30 segundos

### Teste em Produção

**Após deploy no Vercel:**

```bash
# Substituir pela sua URL de produção
curl -X POST 'https://assistente-juridico-github.vercel.app/api/emails' \
  -H 'Authorization: Bearer SEU_EMAIL_API_KEY_REAL' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "test",
    "to": "seu-email@exemplo.com",
    "subject": "Teste de Produção - Resend"
  }'
```

---

## 📊 5. Monitoramento e Logs

### Ver E-mails Enviados

1. Acesse https://resend.com/emails
2. Veja lista de todos os e-mails enviados
3. Clique em um e-mail para ver:
   - ✅ Status de entrega
   - 📧 Conteúdo HTML/Text
   - 📈 Aberturas e cliques
   - 🔍 Headers completos
   - ⚠️ Bounces/Erros

### Verificar Quota

- **Dashboard**: https://resend.com/overview
- **Free tier**: 3.000 emails/mês
- **Alertas**: Configure em Settings para avisar quando atingir 80%

### Logs no Vercel

```bash
# Ver logs em tempo real
vercel logs --follow

# Ver últimos 100 logs
vercel logs --limit 100
```

Procure por:
```
Email enviado com sucesso: abc-123
```

Ou erros:
```
Erro ao enviar email: Invalid API key
```

---

## 🔐 6. Segurança

### Proteções Implementadas

✅ **Autenticação obrigatória**: Header `Authorization: Bearer <token>`
✅ **Rate limiting**: 100 req/min por IP (Upstash Redis)
✅ **Timeout**: 30s máximo por envio
✅ **Retry automático**: 3 tentativas com backoff exponencial
✅ **Sanitização HTML**: `escapeHtml()` em subject/message
✅ **Validação Zod**: Payload validado antes de enviar

### Boas Práticas

1. **Nunca** commite `.env` ou exponha `RESEND_API_KEY`
2. **Rotacione** API keys a cada 90 dias
3. **Use** domínio verificado em produção (evita spam)
4. **Monitore** bounces e unsubscribes regularmente
5. **Configure** SPF/DKIM corretamente no DNS

---

## 🚨 7. Troubleshooting

### Erro: "RESEND_API_KEY não configurada"

**Causa**: Variável de ambiente ausente

**Solução**:
```bash
# Verificar se está configurada no Vercel
vercel env ls

# Se não estiver, adicionar
vercel env add RESEND_API_KEY
```

### Erro: "Invalid API key"

**Causa**: API Key incorreta ou expirada

**Solução**:
1. Gerar nova key em https://resend.com/api-keys
2. Atualizar no Vercel
3. Fazer redeploy: `vercel --prod`

### E-mails vão para SPAM

**Causas comuns**:
- ❌ Domínio não verificado
- ❌ DKIM/SPF não configurados
- ❌ Conteúdo marcado como spam

**Soluções**:
1. **Verificar domínio** no Resend
2. **Configurar DNS** corretamente (DKIM, SPF, MX)
3. **Evitar** palavras de spam ("grátis", "promoção", etc.)
4. **Testar** em https://mail-tester.com

### Rate limit atingido

**Sintoma**: HTTP 429 "Rate limit exceeded"

**Solução temporária**:
```bash
# Aumentar limite no código (api/lib/rate-limit.ts)
maxRequests: 200  # era 100
```

**Solução permanente**: Implementar fila de envio (BullMQ/Upstash Streams)

---

## 📈 8. Upgrade de Plano (Quando Necessário)

### Free Tier Esgotou?

**Planos Pagos do Resend:**

| Plano       | E-mails/mês | Preço/mês | Ideal para                    |
|-------------|-------------|-----------|-------------------------------|
| Free        | 3.000       | $0        | Testes e pequenos escritórios |
| Pro         | 50.000      | $20       | Escritórios médios            |
| Business    | 500.000     | $100      | Escritórios grandes           |

**Como fazer upgrade:**
1. Acesse https://resend.com/settings/billing
2. Escolha plano
3. Adicione cartão de crédito
4. **Nenhuma alteração no código é necessária!**

---

## 🎯 9. Tipos de E-mail Suportados

### 1. Email de Teste (`type: "test"`)

**Uso**: Validar configuração

```bash
curl -X POST '/api/emails' \
  -H 'Authorization: Bearer <token>' \
  -d '{"type": "test", "to": "email@example.com"}'
```

### 2. Notificação Genérica (`type: "notification"`)

**Uso**: Avisos e alertas gerais

```bash
curl -X POST '/api/emails' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "type": "notification",
    "to": "advogado@example.com",
    "subject": "Nova intimação disponível",
    "message": "Há uma nova intimação no processo 1234567-89.2025",
    "actionUrl": "https://app.vercel.app/process/1234567"
  }'
```

### 3. Alerta Urgente (`type: "urgent"`)

**Uso**: Prazos críticos (< 24h)

```bash
curl -X POST '/api/emails' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "type": "urgent",
    "to": "advogado@example.com",
    "processNumber": "1234567-89.2025.5.02.0999",
    "deadline": "2025-12-10 17:00"
  }'
```

### 4. Resumo Diário (`type: "daily_summary"`)

**Uso**: Relatório diário dos agentes

```bash
curl -X POST '/api/emails' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "type": "daily_summary",
    "to": "gestor@example.com",
    "summary": {
      "processesMonitored": 200,
      "deadlinesFound": 5,
      "documentsGenerated": 10,
      "errorsCount": 0
    }
  }'
```

---

## 🔗 10. Recursos Úteis

- 📖 **Documentação oficial**: https://resend.com/docs
- 💬 **Suporte**: https://resend.com/support
- 🐛 **Status**: https://status.resend.com
- 📊 **Dashboard**: https://resend.com/overview
- 🔑 **API Keys**: https://resend.com/api-keys
- 🌐 **Domínios**: https://resend.com/domains

---

## ✅ Checklist de Configuração

Use este checklist para garantir que tudo está configurado:

- [ ] Conta criada no Resend
- [ ] API Key gerada e copiada
- [ ] Domínio adicionado (opcional mas recomendado)
- [ ] Registros DNS configurados (se usar domínio)
- [ ] `RESEND_API_KEY` adicionada no Vercel
- [ ] `EMAIL_API_KEY` gerada e adicionada no Vercel
- [ ] `EMAIL_FROM` configurada no Vercel
- [ ] Teste local executado com sucesso
- [ ] Deploy em produção feito
- [ ] Teste em produção executado com sucesso
- [ ] E-mail de teste recebido no inbox (não spam)
- [ ] Monitoramento configurado (Resend Dashboard)

---

## 🎉 Conclusão

Após seguir este guia, seu sistema estará pronto para enviar e-mails profissionais automaticamente. Os agentes de IA poderão notificar operadores sobre intimações, prazos urgentes e gerar resumos diários.

**Próximos passos:**
1. Configurar templates de e-mail personalizados em `api/lib/email-service.ts`
2. Implementar fila de envio para alto volume (opcional)
3. Adicionar tracking de aberturas/cliques (opcional)
4. Configurar webhooks do Resend para bounces (opcional)

**Dúvidas?** Consulte a documentação completa em `docs/` ou abra uma issue no GitHub.
