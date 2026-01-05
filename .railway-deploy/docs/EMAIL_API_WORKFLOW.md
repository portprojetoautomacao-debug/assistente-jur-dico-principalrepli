# Email API - Fluxo Completo de Notificações

> **Status**: Implementado | Provider: Resend.com

## 📋 Arquitetura do Sistema de Emails

```
Trigger (Agente/Cron/Webhook)
  ↓
POST /api/emails
  ↓
Enfileirar no KV (emails:queue)
  ↓
Worker processa em background
  ↓
Resend API envia email
  ↓
Salvar histórico (emails:sent)
  ↓
Notificar usuário (opcional)
```

## 🚀 Setup Rápido

### 1. Criar Conta Resend

```bash
# 1. Acesse https://resend.com/signup
# 2. Plano gratuito: 100 emails/dia
# 3. Verificar domínio (ou usar onboarding@resend.dev para testes)
```

### 2. Obter API Key

```bash
# Dashboard Resend → API Keys → Create API Key
# Nome: assistente-juridico-prod
# Permissões: Sending access
```

### 3. Configurar Variáveis

```bash
# .env.local
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com  # ou onboarding@resend.dev
ADMIN_EMAIL=admin@yourdomain.com
```

### 4. Testar Envio

```bash
# Via curl
curl -X POST http://localhost:5173/api/emails \
  -H "Content-Type: application/json" \
  -d '{
    "to": "seu@email.com",
    "type": "test",
    "subject": "Teste Email API",
    "data": {}
  }'

# Resposta esperada:
# {"success":true,"id":"email_abc123","queued":true}
```

## 📧 Tipos de Email Disponíveis

### 1. Notificação de Intimação

```typescript
// POST /api/emails
{
  "to": "advogado@escritorio.com",
  "type": "intimation",
  "subject": "Nova Intimação Detectada - Processo CNJ-123",
  "data": {
    "processoCNJ": "0001234-56.2024.8.01.0001",
    "prazo": "15 dias",
    "dataLimite": "2024-12-30",
    "tipo": "Contestação",
    "expedienteId": "exp_123"
  }
}
```

**Template**: `src/lib/email-templates/intimation.html`

### 2. Resumo Diário

```typescript
// POST /api/emails
{
  "to": "advogado@escritorio.com",
  "type": "daily-summary",
  "subject": "Resumo Diário - 5 Intimações, 3 Prazos Vencendo",
  "data": {
    "data": "2024-12-13",
    "intimacoes": 5,
    "prazos": 3,
    "minutas": 2,
    "processos": [
      {
        "numero": "CNJ-123",
        "tipo": "Intimação",
        "prazo": "15 dias"
      }
    ]
  }
}
```

**Cron**: Diariamente às 18h (`api/cron.ts`)

### 3. Alerta de Prazo Crítico

```typescript
// POST /api/emails
{
  "to": "advogado@escritorio.com",
  "type": "deadline-alert",
  "subject": "URGENTE: Prazo vencendo em 24h - CNJ-123",
  "data": {
    "processoCNJ": "0001234-56.2024.8.01.0001",
    "prazo": "Contestação",
    "horasRestantes": 24,
    "dataLimite": "2024-12-14T18:00:00Z",
    "urgencia": "critical"
  }
}
```

**Trigger**: Mrs. Justin-e detecta prazo < 48h

### 4. Minuta Criada por Agente

```typescript
// POST /api/emails
{
  "to": "advogado@escritorio.com",
  "type": "minuta-created",
  "subject": "Minuta Gerada - Contestação CNJ-123",
  "data": {
    "minutaId": "min_abc123",
    "titulo": "Contestação - Processo CNJ-123",
    "tipo": "peticao",
    "agenteId": "redacao-peticoes",
    "confidence": 0.95,
    "status": "pendente-revisao"
  }
}
```

**Trigger**: Hook `useAutoMinuta()` detecta nova minuta

### 5. Email de Teste

```typescript
// POST /api/emails
{
  "to": "test@example.com",
  "type": "test",
  "subject": "Teste Email API",
  "data": {}
}
```

## 🔄 Fluxo de Processamento

### 1. Receber Request

```typescript
// api/emails.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validar payload
  const { to, type, subject, data } = req.body;
  
  // Enfileirar
  const emailId = await queueEmail({
    to,
    type,
    subject,
    data,
    status: 'queued',
    attempts: 0,
    createdAt: new Date().toISOString()
  });
  
  return res.json({ success: true, id: emailId, queued: true });
}
```

### 2. Worker Processar Fila

```typescript
// api/cron.ts?action=process-email-queue
async function processEmailQueue() {
  const queue = await kv.get<Email[]>('emails:queue') || [];
  
  for (const email of queue) {
    try {
      // Renderizar template
      const html = await renderEmailTemplate(email.type, email.data);
      
      // Enviar via Resend
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: email.to,
        subject: email.subject,
        html
      });
      
      // Mover para sent
      await kv.lpush('emails:sent', {
        ...email,
        status: 'sent',
        sentAt: new Date().toISOString(),
        resendId: result.id
      });
      
      // Remover da fila
      await removeFromQueue(email.id);
      
    } catch (error) {
      // Incrementar tentativas
      email.attempts++;
      
      if (email.attempts >= 3) {
        // Mover para failed
        await kv.lpush('emails:failed', {
          ...email,
          status: 'failed',
          error: error.message
        });
      } else {
        // Reagendar
        await kv.lpush('emails:queue', {
          ...email,
          nextRetry: new Date(Date.now() + 60000).toISOString()
        });
      }
    }
  }
}
```

### 3. Cron Job (A cada 5 min)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron?action=process-email-queue",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## 📊 Templates de Email

### Estrutura de Pastas

```
src/lib/email-templates/
├── base.html              # Template base
├── intimation.html        # Notificação de intimação
├── daily-summary.html     # Resumo diário
├── deadline-alert.html    # Alerta de prazo
├── minuta-created.html    # Minuta gerada
└── test.html              # Email de teste
```

### Exemplo: intimation.html

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background: #1e40af; color: white; padding: 20px; }
    .content { padding: 20px; }
    .footer { background: #f3f4f6; padding: 10px; text-align: center; }
    .urgent { color: #dc2626; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Nova Intimação Detectada</h1>
  </div>
  
  <div class="content">
    <p>Olá,</p>
    <p>Foi detectada uma nova intimação no processo:</p>
    
    <ul>
      <li><strong>Processo:</strong> {{processoCNJ}}</li>
      <li><strong>Tipo:</strong> {{tipo}}</li>
      <li><strong>Prazo:</strong> <span class="urgent">{{prazo}}</span></li>
      <li><strong>Data Limite:</strong> {{dataLimite}}</li>
    </ul>
    
    <p>
      <a href="https://assistente-juridico-github.vercel.app/expedientes/{{expedienteId}}" 
         style="background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Ver Expediente
      </a>
    </p>
  </div>
  
  <div class="footer">
    <p>Assistente Jurídico PJe - Automação Jurídica com IA</p>
  </div>
</body>
</html>
```

## 🔔 Integração com Agentes

### Mrs. Justin-e (Intimações)

```typescript
// src/lib/agents.ts - justine
async function processIntimation(expediente: Expediente) {
  // Análise...
  
  // Notificar via email
  await fetch('/api/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: expediente.advogadoEmail,
      type: 'intimation',
      subject: `Nova Intimação - ${expediente.processoCNJ}`,
      data: {
        processoCNJ: expediente.processoCNJ,
        prazo: expediente.prazo,
        dataLimite: expediente.dataLimite,
        tipo: expediente.tipo,
        expedienteId: expediente.id
      }
    })
  });
}
```

### Redação de Petições (Minutas)

```typescript
// src/hooks/use-auto-minuta.ts
export function useAutoMinuta() {
  useEffect(() => {
    // Quando minuta é criada por agente...
    if (minuta.criadoPorAgente) {
      fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          type: 'minuta-created',
          subject: `Minuta Gerada - ${minuta.titulo}`,
          data: {
            minutaId: minuta.id,
            titulo: minuta.titulo,
            tipo: minuta.tipo,
            agenteId: minuta.agenteId,
            confidence: minuta.confidence
          }
        })
      });
    }
  }, [minutas]);
}
```

## 📊 Monitoramento

### Dashboard de Emails

```bash
# Ver fila atual
curl http://localhost:5173/api/emails?action=queue

# Ver histórico (últimos 100)
curl http://localhost:5173/api/emails?action=sent&limit=100

# Ver falhas
curl http://localhost:5173/api/emails?action=failed
```

### Métricas Resend

- Dashboard: https://resend.com/emails
- Métricas: Sent, Delivered, Opened, Clicked, Bounced
- Logs: Detalhes de cada envio

## 🐛 Troubleshooting

### Erro: "Invalid API key"

```bash
# Verificar key
echo $RESEND_API_KEY

# Regenerar no dashboard Resend
```

### Erro: "Email not verified"

```bash
# Opção 1: Usar onboarding@resend.dev (teste)
EMAIL_FROM=onboarding@resend.dev

# Opção 2: Verificar domínio
# Dashboard Resend → Domains → Add Domain
```

### Emails na fila mas não enviando

```bash
# Verificar cron job
curl http://localhost:5173/api/cron?action=process-email-queue

# Ver logs
railway logs | grep "email-queue"
```

## ✅ Checklist de Ativação

- [ ] Criar conta Resend
- [ ] Obter API Key
- [ ] Configurar `RESEND_API_KEY` e `EMAIL_FROM`
- [ ] Testar envio manual
- [ ] Verificar cron job ativo
- [ ] Criar templates de email
- [ ] Integrar com agentes
- [ ] Configurar monitoramento
- [ ] Documentar para equipe

---

**Custo**: Resend Free = 100 emails/dia | Pro = $20/mês (50k emails)
