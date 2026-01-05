# 🔗 GitLab Webhooks Avançados - Integrações Automáticas

## 🎯 Sistema de Webhooks

Webhooks permitem comunicação automática entre sistemas:
- **Notificações em Tempo Real**: Alertas instantâneos
- **Integração PJe**: Sincronização automática de processos
- **Automação de Workflows**: Triggers baseados em eventos
- **Monitoramento Contínuo**: Health checks e alertas

## 📋 Configuração Básica

### **1. Acesse Webhooks**
1. Vá para: **Settings > Webhooks**
2. Clique em **"Add new webhook"**

### **2. Configurações Gerais**
```json
{
  "url": "https://api.assistente-juridico.com/webhooks/gitlab",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "X-GitLab-Token": "your-secret-token"
  },
  "ssl_verify": true,
  "enable_ssl_verification": true
}
```

### **3. Eventos a Monitorar**
- [x] Push events
- [x] Merge request events
- [x] Issue events
- [x] Pipeline events
- [x] Deployment events
- [x] Feature flag events

## 🔧 Implementação Técnica

### **1. Servidor de Webhooks**
```typescript
// api/webhooks/gitlab.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyGitLabWebhook } from '../../lib/gitlab/webhook-verification';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar assinatura do webhook
  const isValid = verifyGitLabWebhook(req);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.headers['x-gitlab-event'] as string;
  const payload = req.body;

  try {
    switch (event) {
      case 'Push Hook':
        await handlePushEvent(payload);
        break;
      case 'Merge Request Hook':
        await handleMergeRequestEvent(payload);
        break;
      case 'Issue Hook':
        await handleIssueEvent(payload);
        break;
      case 'Pipeline Hook':
        await handlePipelineEvent(payload);
        break;
      default:
        console.log(`Unhandled event: ${event}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### **2. Verificação de Segurança**
```typescript
// lib/gitlab/webhook-verification.ts
import crypto from 'crypto';

export function verifyGitLabWebhook(req: NextApiRequest): boolean {
  const signature = req.headers['x-gitlab-token'] as string;
  const secret = process.env.GITLAB_WEBHOOK_SECRET!;

  if (!signature || !secret) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(req.body)).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

### **3. Processamento de Eventos**
```typescript
// lib/gitlab/webhook-handlers.ts
export async function handlePushEvent(payload: any) {
  const { ref, commits, user_name } = payload;

  // Só processar pushes para main/production
  if (ref !== 'refs/heads/main') {
    return;
  }

  // Notificar equipe sobre deploy
  await notifySlack({
    text: `🚀 New deployment to production by ${user_name}`,
    commits: commits.length,
    branch: ref.replace('refs/heads/', ''),
  });

  // Trigger backup automático
  await triggerBackup();
}

export async function handleMergeRequestEvent(payload: any) {
  const { object_attributes, user } = payload;
  const { state, title, description, source_branch, target_branch } = object_attributes;

  if (state === 'merged') {
    // MR merged - atualizar documentação
    await updateDocumentation(source_branch, target_branch);

    // Notificar stakeholders
    await notifyStakeholders({
      type: 'merge_completed',
      title,
      merged_by: user.name,
      branch: source_branch,
    });
  } else if (state === 'opened') {
    // Novo MR - executar testes automáticos
    await runAutomatedTests(source_branch);
  }
}

export async function handleIssueEvent(payload: any) {
  const { object_attributes, user } = payload;
  const { state, title, description, labels } = object_attributes;

  // Classificar issue automaticamente
  const category = classifyIssue(title, description, labels);

  // Criar tarefa no sistema jurídico se for bug ou feature
  if (category === 'bug' || category === 'feature') {
    await createLegalTask({
      title,
      description,
      priority: getPriority(labels),
      assignee: findResponsibleUser(labels),
    });
  }

  // Atualizar métricas
  await updateMetrics('issue_created', { category, labels });
}

export async function handlePipelineEvent(payload: any) {
  const { object_attributes, user } = payload;
  const { status, ref, stages } = object_attributes;

  if (status === 'failed' && ref === 'main') {
    // Pipeline falhou em produção - alerta crítico
    await alertCriticalFailure({
      pipeline_id: object_attributes.id,
      failure_stage: findFailedStage(stages),
      responsible: user?.name,
    });
  } else if (status === 'success' && ref === 'main') {
    // Deploy bem-sucedido - atualizar status
    await updateDeploymentStatus('success');
  }
}
```

## 🔗 Integração com PJe

### **1. Webhook para Atualização de Processos**
```typescript
// lib/integrations/pje-webhook.ts
export async function handlePJeUpdate(payload: any) {
  const { processo_id, movimento_tipo, data_movimento, descricao } = payload;

  // Buscar processo no sistema
  const processo = await findProcessoById(processo_id);
  if (!processo) {
    console.warn(`Processo não encontrado: ${processo_id}`);
    return;
  }

  // Registrar novo movimento
  await createMovimento({
    processo_id,
    tipo: movimento_tipo,
    data: data_movimento,
    descricao,
    fonte: 'PJe',
  });

  // Notificar advogado responsável
  await notifyAdvogado(processo.advogado_id, {
    tipo: 'novo_movimento',
    processo: processo.numero,
    movimento: movimento_tipo,
    descricao,
  });

  // Trigger regras de negócio
  await executeBusinessRules(processo_id, movimento_tipo);
}
```

### **2. Configuração do Webhook no PJe**
```json
{
  "url": "https://api.assistente-juridico.com/webhooks/pje",
  "eventos": [
    "movimento_processual",
    "distribuicao",
    "transito_julgado",
    "prazo_vencimento"
  ],
  "filtros": {
    "tribunal": ["TJSP", "TJMG", "TJRS"],
    "orgao": ["vara_civel", "vara_criminal"]
  },
  "autenticacao": {
    "tipo": "bearer_token",
    "token": "pje-webhook-secret-token"
  }
}
```

### **3. Sincronização Bidirecional**
```typescript
// lib/integrations/pje-sync.ts
export class PJeSync {
  async syncToPJe(processoId: string, dados: any) {
    // Enviar dados para PJe
    const response = await fetch(`${process.env.PJE_API_URL}/processos/${processoId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.PJE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      throw new Error(`PJe sync failed: ${response.statusText}`);
    }

    // Log da sincronização
    await logSyncEvent({
      direction: 'to_pje',
      processo_id: processoId,
      status: 'success',
      timestamp: new Date(),
    });
  }

  async syncFromPJe(processoId: string) {
    // Buscar dados atualizados do PJe
    const response = await fetch(`${process.env.PJE_API_URL}/processos/${processoId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PJE_TOKEN}`,
      },
    });

    const dadosPJe = await response.json();

    // Atualizar sistema local
    await updateProcessoLocal(processoId, dadosPJe);

    // Log da sincronização
    await logSyncEvent({
      direction: 'from_pje',
      processo_id: processoId,
      status: 'success',
      timestamp: new Date(),
    });
  }
}
```

## 📊 Monitoramento e Analytics

### **1. Dashboard de Webhooks**
```typescript
// api/webhooks/dashboard.ts
export async function getWebhookStats() {
  const stats = await db.webhook_logs.groupBy({
    by: ['event_type', 'status'],
    _count: true,
    _avg: {
      processing_time: true,
    },
    where: {
      created_at: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24h
      },
    },
  });

  return {
    total_events: stats.reduce((acc, stat) => acc + stat._count, 0),
    success_rate: calculateSuccessRate(stats),
    avg_processing_time: stats.reduce((acc, stat) => acc + (stat._avg.processing_time || 0), 0) / stats.length,
    events_by_type: stats.reduce((acc, stat) => {
      acc[stat.event_type] = stat._count;
      return acc;
    }, {}),
  };
}
```

### **2. Alertas e Monitoramento**
```typescript
// lib/monitoring/webhook-alerts.ts
export class WebhookMonitor {
  async checkHealth() {
    const recentEvents = await db.webhook_logs.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Últimos 5 min
        },
      },
    });

    // Alerta se nenhum evento nos últimos 5 minutos
    if (recentEvents.length === 0) {
      await alertNoEvents();
    }

    // Alerta se taxa de erro > 5%
    const errorRate = recentEvents.filter(e => e.status === 'error').length / recentEvents.length;
    if (errorRate > 0.05) {
      await alertHighErrorRate(errorRate);
    }
  }

  async alertNoEvents() {
    await notifySlack({
      text: '🚨 No webhook events received in last 5 minutes',
      severity: 'warning',
    });
  }

  async alertHighErrorRate(rate: number) {
    await notifySlack({
      text: `🚨 Webhook error rate is ${Math.round(rate * 100)}%`,
      severity: 'error',
    });
  }
}
```

### **3. Logs Estruturados**
```typescript
// lib/logging/webhook-logger.ts
export class WebhookLogger {
  async logEvent(event: {
    id: string;
    type: string;
    source: string;
    payload: any;
    processing_time: number;
    status: 'success' | 'error';
    error?: string;
  }) {
    await db.webhook_logs.create({
      data: {
        id: event.id,
        event_type: event.type,
        source: event.source,
        payload: JSON.stringify(event.payload),
        processing_time: event.processing_time,
        status: event.status,
        error_message: event.error,
        created_at: new Date(),
      },
    });

    // Log estruturado para análise
    console.log(JSON.stringify({
      level: event.status === 'success' ? 'info' : 'error',
      message: `Webhook ${event.type} processed`,
      event_id: event.id,
      processing_time: event.processing_time,
      source: event.source,
      status: event.status,
      ...(event.error && { error: event.error }),
    }));
  }
}
```

## 🔒 Segurança Avançada

### **1. Rate Limiting**
```typescript
// lib/security/rate-limiter.ts
export class WebhookRateLimiter {
  private attempts = new Map<string, number[]>();

  async checkLimit(source: string, maxRequests: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Limpar tentativas antigas
    const attempts = this.attempts.get(source) || [];
    const recentAttempts = attempts.filter(time => time > windowStart);

    if (recentAttempts.length >= maxRequests) {
      return false; // Rate limit excedido
    }

    recentAttempts.push(now);
    this.attempts.set(source, recentAttempts);

    return true;
  }
}
```

### **2. Validação de Payload**
```typescript
// lib/validation/webhook-validator.ts
export class WebhookValidator {
  validateGitLabPayload(payload: any, event: string): boolean {
    const requiredFields = {
      'Push Hook': ['ref', 'commits', 'user_name'],
      'Merge Request Hook': ['object_attributes', 'user'],
      'Issue Hook': ['object_attributes', 'user'],
      'Pipeline Hook': ['object_attributes'],
    };

    const fields = requiredFields[event as keyof typeof requiredFields];
    if (!fields) return false;

    return fields.every(field => payload.hasOwnProperty(field));
  }

  validatePJePayload(payload: any): boolean {
    const required = ['processo_id', 'movimento_tipo', 'data_movimento'];

    return required.every(field => {
      const value = payload[field];
      return value !== undefined && value !== null && value !== '';
    });
  }
}
```

### **3. Retry e Dead Letter Queue**
```typescript
// lib/queue/webhook-queue.ts
export class WebhookQueue {
  async processWithRetry(event: any, maxRetries: number = 3) {
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        await this.processEvent(event);
        return; // Sucesso
      } catch (error) {
        attempts++;
        console.error(`Webhook processing failed (attempt ${attempts}):`, error);

        if (attempts >= maxRetries) {
          await this.moveToDeadLetterQueue(event, error);
          break;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
  }

  async moveToDeadLetterQueue(event: any, error: any) {
    await db.dead_letter_queue.create({
      data: {
        event_type: event.type,
        payload: JSON.stringify(event.payload),
        error_message: error.message,
        created_at: new Date(),
      },
    });

    await notifyAdmin({
      subject: 'Webhook moved to dead letter queue',
      details: `Event: ${event.type}, Error: ${error.message}`,
    });
  }
}
```

## 🎯 Casos de Uso Jurídico

### **1. Notificações de Prazos**
```typescript
// Automatizar alertas de prazo
export async function handlePrazoVencimento(payload: any) {
  const { processo_id, prazo_data, tipo_prazo } = payload;

  // Calcular dias até vencimento
  const diasRestantes = calculateDaysUntil(prazo_data);

  if (diasRestantes <= 7) {
    // Alerta urgente
    await notifyAdvogado(processo_id, {
      tipo: 'prazo_critico',
      dias_restantes: diasRestantes,
      prioridade: 'alta',
    });
  }

  // Criar tarefa automática
  await createTask({
    titulo: `Prazo ${tipo_prazo} - Processo ${processo_id}`,
    data_vencimento: prazo_data,
    prioridade: diasRestantes <= 3 ? 'critica' : 'alta',
  });
}
```

### **2. Sincronização de Andamentos**
```typescript
// Atualização automática de processos
export async function handleNovoAndamento(payload: any) {
  const { processo_id, andamento_tipo, andamento_descricao } = payload;

  // Classificar andamento
  const categoria = classifyAndamento(andamento_tipo);

  // Atualizar status do processo
  await updateProcessoStatus(processo_id, {
    status: mapAndamentoToStatus(andamento_tipo),
    ultimo_andamento: andamento_descricao,
    data_atualizacao: new Date(),
  });

  // Trigger ações baseadas no andamento
  switch (categoria) {
    case 'sentenca':
      await handleSentenca(processo_id, andamento_descricao);
      break;
    case 'audiencia':
      await handleAudiencia(processo_id, andamento_descricao);
      break;
    case 'recurso':
      await handleRecurso(processo_id, andamento_descricao);
      break;
  }
}
```

### **3. Integração com Calendário**
```typescript
// Sincronização com Google Calendar
export async function syncToCalendar(payload: any) {
  const { evento_tipo, data, titulo, participantes } = payload;

  await calendarAPI.createEvent({
    summary: titulo,
    start: { dateTime: data },
    end: { dateTime: addHours(data, 1) },
    attendees: participantes.map(email => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 dia antes
        { method: 'popup', minutes: 30 }, // 30 min antes
      ],
    },
  });
}
```

## 📈 Benefícios Esperados

- **Automação Total**: Processos judiciais atualizados automaticamente
- **Redução de Erros**: Sincronização em tempo real evita dessincronização
- **Alertas Proativos**: Notificações automáticas de prazos e andamentos
- **Integração Completa**: Sistema conectado ao ecossistema jurídico
- **Confiabilidade**: Monitoramento contínuo e failover automático</content>
<parameter name="filePath">/workspaces/assistente-juridico-p/docs/GITLAB_WEBHOOKS_ADVANCED.md